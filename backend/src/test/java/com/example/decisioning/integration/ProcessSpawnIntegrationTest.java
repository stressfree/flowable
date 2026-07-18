package com.example.decisioning.integration;

import com.example.decisioning.dto.SpawnVariable;
import com.example.decisioning.entity.BundleFile;
import com.example.decisioning.entity.BundleStatus;
import com.example.decisioning.entity.BundleType;
import com.example.decisioning.entity.DecisioningBundle;
import com.example.decisioning.exception.BundleFileNotFoundException;
import com.example.decisioning.exception.FlowableDeploymentException;
import com.example.decisioning.repository.DecisioningBundleRepository;
import com.example.decisioning.service.ProcessSpawnService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class ProcessSpawnIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("decisioning")
        .withUsername("decisioning")
        .withPassword("decisioning");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("flowable.database-schema", () -> "public");
        registry.add("flowable.event-registry.database-schema", () -> "public");
    }

    @Autowired
    private ProcessSpawnService spawnService;

    @Autowired
    private DecisioningBundleRepository bundleRepository;

    private static final String SIMPLE_BPMN = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                     xmlns:flowable="http://flowable.org/bpmn"
                     targetNamespace="http://example.com">
          <process id="simple-spawn-test" name="Simple Spawn Test" isExecutable="true">
            <startEvent id="start" name="Start">
              <extensionElements>
                <flowable:formProperty id="employeeId" name="Employee ID" type="string" required="true" />
                <flowable:formProperty id="amount" name="Amount" type="double" />
              </extensionElements>
            </startEvent>
            <userTask id="task1" name="Review" />
            <endEvent id="end" name="End" />
            <sequenceFlow id="f1" sourceRef="start" targetRef="task1" />
            <sequenceFlow id="f2" sourceRef="task1" targetRef="end" />
          </process>
        </definitions>
        """;

    @AfterEach
    void tearDown() {
        bundleRepository.deleteAll();
    }

    @Test
    void getSpawnFormReturnsVariables() {
        DecisioningBundle bundle = createBundleWithEntrypoint(SIMPLE_BPMN, "test.bpmn");

        List<SpawnVariable> variables = spawnService.getSpawnForm(bundle.getId());

        assertThat(variables).isNotEmpty();
        assertThat(variables).hasSize(2);
        assertThat(variables)
            .extracting(SpawnVariable::name)
            .containsExactlyInAnyOrder("employeeId", "amount");
        assertThat(variables)
            .extracting(SpawnVariable::label)
            .containsExactlyInAnyOrder("Employee ID", "Amount");
    }

    @Test
    void spawnStartsProcessAndReturnsInstanceId() {
        DecisioningBundle bundle = createBundleWithEntrypoint(SIMPLE_BPMN, "test.bpmn");

        String instanceId = spawnService.spawn(bundle.getId(),
            Map.of("employeeId", "emp-123", "amount", 500.0));

        assertThat(instanceId).isNotNull();
        assertThat(instanceId).isNotEmpty();
    }

    @Test
    void spawnWithoutEntrypointThrowsException() {
        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(bundle);

        assertThatThrownBy(() -> spawnService.spawn(bundle.getId(), Map.of()))
            .isInstanceOf(FlowableDeploymentException.class);
    }

    @Test
    void getSpawnFormWithoutEntrypointThrowsException() {
        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(bundle);

        assertThatThrownBy(() -> spawnService.getSpawnForm(bundle.getId()))
            .isInstanceOf(FlowableDeploymentException.class);
    }

    @Test
    void getSpawnFormWithNonExistentBundleThrowsException() {
        assertThatThrownBy(() -> spawnService.getSpawnForm(99999L))
            .isInstanceOf(BundleFileNotFoundException.class);
    }

    @Test
    void spawnWithNonExistentBundleThrowsException() {
        assertThatThrownBy(() -> spawnService.spawn(99999L, Map.of()))
            .isInstanceOf(BundleFileNotFoundException.class);
    }

    @Test
    void spawnWithInvalidBpmnThrowsDeploymentException() {
        DecisioningBundle bundle = createBundleWithEntrypoint(
            "NOT VALID BPMN XML", "invalid.bpmn");

        assertThatThrownBy(() -> spawnService.spawn(bundle.getId(), Map.of()))
            .isInstanceOf(FlowableDeploymentException.class);
    }

    @Test
    void spawnCachesDeployment() {
        DecisioningBundle bundle = createBundleWithEntrypoint(SIMPLE_BPMN, "test.bpmn");

        spawnService.getSpawnForm(bundle.getId());
        String instanceId = spawnService.spawn(bundle.getId(),
            Map.of("employeeId", "emp-456"));

        assertThat(instanceId).isNotNull();
    }

    @Test
    void spawnVariableContainsNameAndType() {
        DecisioningBundle bundle = createBundleWithEntrypoint(SIMPLE_BPMN, "test.bpmn");

        List<SpawnVariable> variables = spawnService.getSpawnForm(bundle.getId());

        assertThat(variables).isNotEmpty();
        SpawnVariable var = variables.get(0);
        assertThat(var.name()).isNotEmpty();
        assertThat(var.type()).isNotEmpty();
    }

    private DecisioningBundle createBundleWithEntrypoint(String content, String filename) {
        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(bundle);

        BundleFile file = new BundleFile();
        file.setBundle(bundle);
        file.setFilename(filename);
        file.setMimeType("application/xml");
        file.setContent(content.getBytes(StandardCharsets.UTF_8));
        file.setEntrypoint(true);
        bundle.addFile(file);
        bundle.setEntrypointFile(file);
        bundleRepository.save(bundle);

        return bundle;
    }
}
