package com.example.decisioning.integration;

import com.example.decisioning.entity.BundleFile;
import com.example.decisioning.entity.BundleStatus;
import com.example.decisioning.entity.BundleType;
import com.example.decisioning.entity.DecisioningBundle;
import com.example.decisioning.repository.DecisioningBundleRepository;
import com.example.decisioning.service.EventRegistryService;
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
class EventRegistryIntegrationTest {

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
    private EventRegistryService eventService;

    @Autowired
    private DecisioningBundleRepository bundleRepository;

    private static final String EVENT_JSON = """
        {
          "key": "expense-submitted",
          "name": "Expense Submitted",
          "correlationParameters": [
            {"name": "employeeId", "type": "string"},
            {"name": "expenseId", "type": "string"}
          ],
          "payload": [
            {"name": "amount", "type": "double"},
            {"name": "description", "type": "string"},
            {"name": "hasTravel", "type": "boolean"}
          ]
        }
        """;

    private static final String SECOND_EVENT_JSON = """
        {
          "key": "expense-approved",
          "name": "Expense Approved",
          "correlationParameters": [
            {"name": "expenseId", "type": "string"}
          ],
          "payload": [
            {"name": "approvedBy", "type": "string"}
          ]
        }
        """;

    @AfterEach
    void tearDown() {
        bundleRepository.deleteAll();
    }

    @Test
    void getEventDefinitionsReturnsParsedEvents() {
        DecisioningBundle bundle = createBundleWithEventFile(EVENT_JSON, "expense-submitted.event");

        var definitions = eventService.getEventDefinitions(bundle.getId());

        assertThat(definitions).hasSize(1);
        var def = definitions.get(0);
        assertThat(def.key()).isEqualTo("expense-submitted");
        assertThat(def.name()).isEqualTo("Expense Submitted");
        assertThat(def.correlationParameters()).hasSize(2);
        assertThat(def.correlationParameters().get(0).name()).isEqualTo("employeeId");
        assertThat(def.correlationParameters().get(0).type()).isEqualTo("string");
        assertThat(def.payload()).hasSize(3);
        assertThat(def.payload().get(0).name()).isEqualTo("amount");
        assertThat(def.payload().get(0).type()).isEqualTo("double");
    }

    @Test
    void getEventDefinitionsReturnsMultipleEvents() {
        DecisioningBundle bundle = createBundleWithEventFiles(
            new String[]{"expense-submitted.event", "expense-approved.event"},
            new String[]{EVENT_JSON, SECOND_EVENT_JSON});

        var definitions = eventService.getEventDefinitions(bundle.getId());

        assertThat(definitions).hasSize(2);
        assertThat(definitions).extracting(d -> d.key())
            .containsExactlyInAnyOrder("expense-submitted", "expense-approved");
    }

    @Test
    void getEventDefinitionsEmptyBundleReturnsEmptyList() {
        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(bundle);

        var definitions = eventService.getEventDefinitions(bundle.getId());

        assertThat(definitions).isEmpty();
    }

    @Test
    void getEventDefinitionsIgnoresNonEventFiles() {
        DecisioningBundle bundle = createBundleWithEventFile(
            "<?xml version=\"1.0\"?><definitions/>", "main.bpmn");

        var definitions = eventService.getEventDefinitions(bundle.getId());

        assertThat(definitions).isEmpty();
    }

    @Test
    void getEventDefinitionsNonExistentBundleThrows() {
        assertThatThrownBy(() -> eventService.getEventDefinitions(99999L))
            .isInstanceOf(com.example.decisioning.exception.BundleFileNotFoundException.class);
    }

    @Test
    void getEventDefinitionsHandlesInvalidJson() {
        DecisioningBundle bundle = createBundleWithEventFile(
            "NOT VALID JSON", "broken.event");

        var definitions = eventService.getEventDefinitions(bundle.getId());

        assertThat(definitions).isEmpty();
    }

    @Test
    void getEventDefinitionsHandlesMissingKey() {
        DecisioningBundle bundle = createBundleWithEventFile(
            "{\"name\": \"No Key Event\"}", "no-key.event");

        var definitions = eventService.getEventDefinitions(bundle.getId());

        assertThat(definitions).isEmpty();
    }

    @Test
    void sendEventWithValidKeySucceeds() {
        DecisioningBundle bundle = createBundleWithEventFile(EVENT_JSON, "expense-submitted.event");

        eventService.sendEvent(bundle.getId(), "expense-submitted",
            Map.of("employeeId", "emp-1", "expenseId", "exp-1", "amount", 500.0));
    }

    @Test
    void sendEventWithInvalidKeyThrows() {
        DecisioningBundle bundle = createBundleWithEventFile(EVENT_JSON, "expense-submitted.event");

        assertThatThrownBy(() -> eventService.sendEvent(bundle.getId(), "non-existent",
            Map.of()))
            .isInstanceOf(com.example.decisioning.exception.BundleFileNotFoundException.class);
    }

    @Test
    void sendEventNonExistentBundleThrows() {
        assertThatThrownBy(() -> eventService.sendEvent(99999L, "any-event", Map.of()))
            .isInstanceOf(com.example.decisioning.exception.BundleFileNotFoundException.class);
    }

    private DecisioningBundle createBundleWithEventFile(String content, String filename) {
        return createBundleWithEventFiles(new String[]{filename}, new String[]{content});
    }

    private DecisioningBundle createBundleWithEventFiles(String[] filenames, String[] contents) {
        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(bundle);

        for (int i = 0; i < filenames.length; i++) {
            BundleFile file = new BundleFile();
            file.setBundle(bundle);
            file.setFilename(filenames[i]);
            file.setMimeType("application/json");
            file.setContent(contents[i].getBytes(StandardCharsets.UTF_8));
            file.setEntrypoint(false);
            bundle.addFile(file);
        }
        bundleRepository.save(bundle);
        return bundle;
    }
}
