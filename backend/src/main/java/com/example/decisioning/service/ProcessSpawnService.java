package com.example.decisioning.service;

import com.example.decisioning.dto.SpawnVariable;
import com.example.decisioning.entity.BundleFile;
import com.example.decisioning.entity.DecisioningBundle;
import com.example.decisioning.exception.BundleFileNotFoundException;
import com.example.decisioning.exception.FlowableDeploymentException;
import com.example.decisioning.repository.DecisioningBundleRepository;
import org.flowable.engine.FormService;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.form.FormProperty;
import org.flowable.engine.form.StartFormData;
import org.flowable.engine.repository.DeploymentBuilder;
import org.flowable.engine.repository.ProcessDefinition;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.bpmn.model.BpmnModel;
import org.flowable.bpmn.model.FlowElement;
import org.flowable.bpmn.model.Process;
import org.flowable.bpmn.model.StartEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Transactional
public class ProcessSpawnService {

    private static final Logger log = LoggerFactory.getLogger(ProcessSpawnService.class);

    private final DecisioningBundleRepository bundleRepository;
    private final RepositoryService repositoryService;
    private final RuntimeService runtimeService;
    private final FormService formService;

    private final ConcurrentHashMap<Long, String> deployedProcessKeys = new ConcurrentHashMap<>();

    public ProcessSpawnService(DecisioningBundleRepository bundleRepository,
                                RepositoryService repositoryService,
                                RuntimeService runtimeService,
                                FormService formService) {
        this.bundleRepository = bundleRepository;
        this.repositoryService = repositoryService;
        this.runtimeService = runtimeService;
        this.formService = formService;
    }

    @Transactional
    public List<SpawnVariable> getSpawnForm(Long bundleId) {
        DecisioningBundle bundle = bundleRepository.findByIdWithFiles(bundleId)
            .orElseThrow(() -> new BundleFileNotFoundException(
                "Bundle with id " + bundleId + " not found"));

        if (bundle.getEntrypointFile() == null) {
            throw new FlowableDeploymentException(
                bundleId, "unknown",
                "Bundle has no entrypoint file",
                "Set an entrypoint file before spawning");
        }

        String processKey = deployBundle(bundle);
        deployedProcessKeys.put(bundleId, processKey);

        try {
            ProcessDefinition processDefinition = repositoryService.createProcessDefinitionQuery()
                .processDefinitionKey(processKey)
                .latestVersion()
                .singleResult();

            if (processDefinition == null) {
                return List.of();
            }

            StartFormData startFormData = formService.getStartFormData(processDefinition.getId());

            if (startFormData != null && startFormData.getFormProperties() != null
                && !startFormData.getFormProperties().isEmpty()) {

                List<SpawnVariable> variables = new ArrayList<>();
                for (FormProperty fp : startFormData.getFormProperties()) {
                    variables.add(new SpawnVariable(
                        fp.getId(),
                        fp.getType() != null ? fp.getType().getName() : "string",
                        fp.isRequired(),
                        fp.getName() != null ? fp.getName() : fp.getId()));
                }
                return variables;
            }
        } catch (Exception e) {
            log.debug("Form service did not return start form data for process {}, "
                + "falling back to BPMN model extraction", processKey, e);
        }

        return extractVariablesFromBpmnModel(processKey);
    }

    public String spawn(Long bundleId, Map<String, Object> variables) {
        DecisioningBundle bundle = bundleRepository.findByIdWithFiles(bundleId)
            .orElseThrow(() -> new BundleFileNotFoundException(
                "Bundle with id " + bundleId + " not found"));

        if (bundle.getEntrypointFile() == null) {
            throw new FlowableDeploymentException(
                bundleId, "unknown",
                "Bundle has no entrypoint file",
                "Set an entrypoint file before spawning");
        }

        String processKey = deployedProcessKeys.computeIfAbsent(bundleId,
            id -> deployBundle(bundle));

        try {
            ProcessInstance instance = runtimeService.startProcessInstanceByKey(processKey, variables);
            return instance.getId();
        } catch (Exception e) {
            throw new FlowableDeploymentException(
                bundleId, processKey,
                "Failed to start process instance: " + e.getMessage(),
                "Check that the process definition is valid and all required variables are provided");
        }
    }

    private String deployBundle(DecisioningBundle bundle) {
        BundleFile entrypoint = bundle.getEntrypointFile();
        String processKey = extractProcessKey(entrypoint);

        try {
            DeploymentBuilder builder = repositoryService.createDeployment()
                .name("bundle-" + bundle.getId());

            for (BundleFile file : bundle.getFiles()) {
                String resourceName = file.getFilename();
                builder.addBytes(resourceName, file.getContent());
            }

            builder.deploy();
            log.info("Deployed bundle {} to Flowable, process key: {}",
                bundle.getId(), processKey);
            return processKey;
        } catch (Exception e) {
            throw new FlowableDeploymentException(
                bundle.getId(), processKey,
                "Failed to deploy process to Flowable engine: " + e.getMessage(),
                "Check that the BPMN XML is valid and the process key is not already deployed with a conflicting version");
        }
    }

    private String extractProcessKey(BundleFile entrypoint) {
        String xml = new String(entrypoint.getContent(), StandardCharsets.UTF_8);
        int processIdx = xml.indexOf("<process ");
        if (processIdx < 0) {
            processIdx = xml.indexOf("<process>");
        }
        if (processIdx < 0) {
            throw new FlowableDeploymentException(
                null, "unknown",
                "Entrypoint file does not contain a BPMN process element",
                "Ensure the entrypoint file is a valid BPMN XML with a <process> element");
        }
        int idIdx = xml.indexOf("id=\"", processIdx);
        if (idIdx < 0) {
            throw new FlowableDeploymentException(
                null, "unknown",
                "Process element has no id attribute",
                "Add an id attribute to the <process> element in the BPMN file");
        }
        int endIdx = xml.indexOf("\"", idIdx + 4);
        return xml.substring(idIdx + 4, endIdx);
    }

    private List<SpawnVariable> extractVariablesFromBpmnModel(String processKey) {
        try {
            ProcessDefinition pd = repositoryService
                .createProcessDefinitionQuery()
                .processDefinitionKey(processKey)
                .latestVersion()
                .singleResult();

            if (pd == null) {
                return List.of();
            }

            BpmnModel model = repositoryService.getBpmnModel(pd.getId());

            if (model == null || model.getProcesses().isEmpty()) {
                return List.of();
            }

            List<SpawnVariable> variables = new ArrayList<>();
            for (Process process : model.getProcesses()) {
                for (FlowElement element : process.getFlowElements()) {
                    if (element instanceof StartEvent startEvent) {
                        if (startEvent.getFormProperties() != null) {
                            for (org.flowable.bpmn.model.FormProperty fp :
                                    startEvent.getFormProperties()) {
                                variables.add(new SpawnVariable(
                                    fp.getId() != null ? fp.getId() : fp.getName(),
                                    fp.getType() != null ? fp.getType() : "string",
                                    fp.isRequired(),
                                    fp.getName() != null ? fp.getName() : fp.getId()));
                            }
                        }
                    }
                }
            }
            return variables;
        } catch (Exception e) {
            log.debug("Could not extract variables from BPMN model", e);
            return List.of();
        }
    }
}
