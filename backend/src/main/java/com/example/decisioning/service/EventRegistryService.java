package com.example.decisioning.service;

import com.example.decisioning.dto.EventDefinitionResponse;
import com.example.decisioning.entity.BundleFile;
import com.example.decisioning.entity.DecisioningBundle;
import com.example.decisioning.exception.BundleFileNotFoundException;
import com.example.decisioning.exception.FlowableDeploymentException;
import com.example.decisioning.repository.DecisioningBundleRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.flowable.eventregistry.api.EventRegistry;
import org.flowable.eventregistry.api.EventRegistryEvent;
import org.flowable.eventregistry.api.runtime.EventInstance;
import org.flowable.eventregistry.api.runtime.EventPayloadInstance;
import org.flowable.eventregistry.impl.event.FlowableEventRegistryEvent;
import org.flowable.eventregistry.impl.runtime.EventInstanceImpl;
import org.flowable.eventregistry.impl.runtime.EventPayloadInstanceImpl;
import org.flowable.eventregistry.model.EventPayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class EventRegistryService {

    private static final Logger log = LoggerFactory.getLogger(EventRegistryService.class);

    private final DecisioningBundleRepository bundleRepository;
    private final EventRegistry eventRegistry;
    private final ObjectMapper objectMapper;

    public EventRegistryService(DecisioningBundleRepository bundleRepository,
                                 EventRegistry eventRegistry,
                                 ObjectMapper objectMapper) {
        this.bundleRepository = bundleRepository;
        this.eventRegistry = eventRegistry;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<EventDefinitionResponse> getEventDefinitions(Long bundleId) {
        DecisioningBundle bundle = bundleRepository.findByIdWithFiles(bundleId)
            .orElseThrow(() -> new BundleFileNotFoundException(
                "Bundle with id " + bundleId + " not found"));

        List<EventDefinitionResponse> definitions = new ArrayList<>();
        for (BundleFile file : bundle.getFiles()) {
            if (isEventFile(file.getFilename())) {
                try {
                    EventDefinitionResponse def = parseEventFile(file);
                    if (def != null) {
                        definitions.add(def);
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse event file {}: {}",
                        file.getFilename(), e.getMessage());
                }
            }
        }
        return definitions;
    }

    public void sendEvent(Long bundleId, String eventKey, Map<String, Object> payload) {
        DecisioningBundle bundle = bundleRepository.findByIdWithFiles(bundleId)
            .orElseThrow(() -> new BundleFileNotFoundException(
                "Bundle with id " + bundleId + " not found"));

        boolean eventExists = bundle.getFiles().stream()
            .anyMatch(f -> isEventFile(f.getFilename()) && containsEventKey(f, eventKey));

        if (!eventExists) {
            throw new BundleFileNotFoundException(
                "Event with key '" + eventKey + "' not found in bundle " + bundleId);
        }

        try {
            List<EventPayloadInstance> payloadInstances = new ArrayList<>();
            for (Map.Entry<String, Object> entry : payload.entrySet()) {
                EventPayload eventPayload = new EventPayload(entry.getKey(), "object");
                payloadInstances.add(new EventPayloadInstanceImpl(eventPayload, entry.getValue()));
            }

            EventInstance eventInstance = new EventInstanceImpl(eventKey, payloadInstances);
            EventRegistryEvent registryEvent = new FlowableEventRegistryEvent(eventInstance);
            eventRegistry.sendEventToConsumers(registryEvent);

            log.info("Sent event '{}' for bundle {}", eventKey, bundleId);
        } catch (Exception e) {
            throw new FlowableDeploymentException(
                bundleId, eventKey,
                "Failed to send event: " + e.getMessage(),
                "Ensure the event definition is deployed to the Event Registry");
        }
    }

    private EventDefinitionResponse parseEventFile(BundleFile file) throws Exception {
        JsonNode root = objectMapper.readTree(file.getContent());

        String key = root.path("key").asText();
        String name = root.path("name").asText();

        if (key.isEmpty()) {
            return null;
        }

        List<EventDefinitionResponse.CorrelationParameter> correlationParameters =
            new ArrayList<>();
        JsonNode corParams = root.path("correlationParameters");
        if (corParams.isArray()) {
            for (JsonNode param : corParams) {
                correlationParameters.add(
                    new EventDefinitionResponse.CorrelationParameter(
                        param.path("name").asText(),
                        param.path("type").asText()));
            }
        }

        List<EventDefinitionResponse.PayloadField> payloadFields = new ArrayList<>();
        JsonNode payload = root.path("payload");
        if (payload.isArray()) {
            for (JsonNode field : payload) {
                payloadFields.add(
                    new EventDefinitionResponse.PayloadField(
                        field.path("name").asText(),
                        field.path("type").asText()));
            }
        }

        return new EventDefinitionResponse(key, name, correlationParameters, payloadFields);
    }

    private boolean isEventFile(String filename) {
        return filename != null
            && (filename.toLowerCase().endsWith(".event")
                || filename.toLowerCase().endsWith(".json"));
    }

    private boolean containsEventKey(BundleFile file, String eventKey) {
        try {
            JsonNode root = objectMapper.readTree(file.getContent());
            return eventKey.equals(root.path("key").asText());
        } catch (Exception e) {
            return false;
        }
    }
}
