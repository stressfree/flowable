package com.example.decisioning.unit;

import com.example.decisioning.dto.BundleCreateRequest;
import com.example.decisioning.dto.BundleFileResponse;
import com.example.decisioning.dto.BundleResponse;
import com.example.decisioning.dto.BundleSummaryResponse;
import com.example.decisioning.dto.CompanyDetailResponse;
import com.example.decisioning.dto.CompanyRequest;
import com.example.decisioning.dto.CompanyResponse;
import com.example.decisioning.dto.EventDefinitionResponse;
import com.example.decisioning.dto.ParseError;
import com.example.decisioning.dto.PublishRequest;
import com.example.decisioning.dto.SendEventRequest;
import com.example.decisioning.dto.SetEntrypointRequest;
import com.example.decisioning.dto.SpawnRequest;
import com.example.decisioning.dto.SpawnVariable;
import com.example.decisioning.dto.ValidationError;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DtoRecordTest {

    @Test
    void companyRequestRecord() {
        CompanyRequest request = new CompanyRequest("Acme Corp", null);
        assertThat(request.name()).isEqualTo("Acme Corp");
        assertThat(request.parentCompanyId()).isNull();
    }

    @Test
    void companyRequestWithParent() {
        CompanyRequest request = new CompanyRequest("Child Corp", 5L);
        assertThat(request.name()).isEqualTo("Child Corp");
        assertThat(request.parentCompanyId()).isEqualTo(5L);
    }

    @Test
    void companyResponseRecord() {
        Instant now = Instant.now();
        CompanyResponse response = new CompanyResponse(1L, "Acme Corp", null, null, now);
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.name()).isEqualTo("Acme Corp");
        assertThat(response.parentCompanyId()).isNull();
        assertThat(response.parentCompanyName()).isNull();
        assertThat(response.createdAt()).isEqualTo(now);
    }

    @Test
    void companyDetailResponseRecord() {
        Instant now = Instant.now();
        CompanyResponse child = new CompanyResponse(2L, "Child Corp", 1L, "Acme Corp", now);
        BundleSummaryResponse bundle = new BundleSummaryResponse(
            10L, "EXPENSE_APPROVAL", "desc", "DRAFT", 1L, "Acme Corp", 2, now);
        CompanyDetailResponse response = new CompanyDetailResponse(
            1L, "Acme Corp", null, null, List.of(child), List.of(bundle), now);
        assertThat(response.children()).hasSize(1);
        assertThat(response.bundles()).hasSize(1);
        assertThat(response.children().get(0).name()).isEqualTo("Child Corp");
    }

    @Test
    void bundleSummaryResponseRecord() {
        Instant now = Instant.now();
        BundleSummaryResponse response = new BundleSummaryResponse(
            1L, "EXPENSE_APPROVAL", "Test bundle", "DRAFT", 5L, "Acme Corp", 3, now);
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.bundleType()).isEqualTo("EXPENSE_APPROVAL");
        assertThat(response.status()).isEqualTo("DRAFT");
        assertThat(response.fileCount()).isEqualTo(3);
    }

    @Test
    void bundleFileResponseRecord() {
        Instant now = Instant.now();
        BundleFileResponse response = new BundleFileResponse(
            1L, "main.bpmn", "application/xml", true, now);
        assertThat(response.filename()).isEqualTo("main.bpmn");
        assertThat(response.isEntrypoint()).isTrue();
    }

    @Test
    void bundleResponseIncludesFilesArray() {
        Instant now = Instant.now();
        BundleFileResponse file1 = new BundleFileResponse(
            1L, "main.bpmn", "application/xml", true, now);
        BundleFileResponse file2 = new BundleFileResponse(
            2L, "rules.dmn", "application/xml", false, now);
        BundleResponse response = new BundleResponse(
            1L, "EXPENSE_APPROVAL", "Test", "DRAFT", null,
            5L, "Acme Corp", 1L, List.of(file1, file2), List.of(), now);
        assertThat(response.files()).hasSize(2);
        assertThat(response.files().get(0).filename()).isEqualTo("main.bpmn");
        assertThat(response.files().get(1).filename()).isEqualTo("rules.dmn");
    }

    @Test
    void bundleResponseWithEmptyFiles() {
        Instant now = Instant.now();
        BundleResponse response = new BundleResponse(
            1L, "EXPENSE_APPROVAL", "Test", "DRAFT", null,
            null, null, null, List.of(), List.of(), now);
        assertThat(response.files()).isEmpty();
        assertThat(response.validationErrors()).isEmpty();
    }

    @Test
    void validationErrorRecordWithAllFields() {
        ValidationError error = new ValidationError(
            12L, "expense-approval.bpmn", "BPMN", "callActivity",
            "Approve Invoice", "callActivity_1", "subprocess-invoice",
            "calledElement",
            "Upload a BPMN file containing process id=\"subprocess-invoice\", "
            + "or remove this callActivity from expense-approval.bpmn");
        assertThat(error.fileId()).isEqualTo(12L);
        assertThat(error.filename()).isEqualTo("expense-approval.bpmn");
        assertThat(error.fileType()).isEqualTo("BPMN");
        assertThat(error.elementType()).isEqualTo("callActivity");
        assertThat(error.elementName()).isEqualTo("Approve Invoice");
        assertThat(error.elementId()).isEqualTo("callActivity_1");
        assertThat(error.missingReference()).isEqualTo("subprocess-invoice");
        assertThat(error.referenceAttribute()).isEqualTo("calledElement");
        assertThat(error.suggestion()).contains("subprocess-invoice");
    }

    @Test
    void parseErrorRecord() {
        ParseError error = new ParseError(14, 7,
            "Expected closing tag </process> but found </sequenceFlow>",
            "Check that all XML tags are properly opened and closed. The error occurred at line 14.");
        assertThat(error.line()).isEqualTo(14);
        assertThat(error.column()).isEqualTo(7);
        assertThat(error.message()).contains("process");
        assertThat(error.suggestion()).contains("line 14");
    }

    @Test
    void spawnVariableRecord() {
        SpawnVariable variable = new SpawnVariable("amount", "double", true, "Amount");
        assertThat(variable.name()).isEqualTo("amount");
        assertThat(variable.type()).isEqualTo("double");
        assertThat(variable.required()).isTrue();
        assertThat(variable.label()).isEqualTo("Amount");
    }

    @Test
    void eventDefinitionResponseRecord() {
        EventDefinitionResponse.CorrelationParameter corParam =
            new EventDefinitionResponse.CorrelationParameter("employeeId", "string");
        EventDefinitionResponse.PayloadField payloadField =
            new EventDefinitionResponse.PayloadField("amount", "double");
        EventDefinitionResponse response = new EventDefinitionResponse(
            "expense-submitted", "Expense Submitted",
            List.of(corParam), List.of(payloadField));
        assertThat(response.key()).isEqualTo("expense-submitted");
        assertThat(response.name()).isEqualTo("Expense Submitted");
        assertThat(response.correlationParameters()).hasSize(1);
        assertThat(response.correlationParameters().get(0).name()).isEqualTo("employeeId");
        assertThat(response.payload()).hasSize(1);
        assertThat(response.payload().get(0).type()).isEqualTo("double");
    }

    @Test
    void sendEventRequestRecord() {
        SendEventRequest request = new SendEventRequest(Map.of("amount", 500.0));
        assertThat(request.payload()).containsEntry("amount", 500.0);
    }

    @Test
    void setEntrypointRequestRecord() {
        SetEntrypointRequest request = new SetEntrypointRequest(42L);
        assertThat(request.fileId()).isEqualTo(42L);
    }

    @Test
    void publishRequestRecord() {
        Instant goLive = Instant.now().plusSeconds(3600);
        PublishRequest request = new PublishRequest(goLive);
        assertThat(request.goLiveAt()).isEqualTo(goLive);
    }

    @Test
    void publishRequestNullGoLiveAt() {
        PublishRequest request = new PublishRequest(null);
        assertThat(request.goLiveAt()).isNull();
    }

    @Test
    void spawnRequestRecord() {
        SpawnRequest request = new SpawnRequest(Map.of("employeeId", "emp-123"));
        assertThat(request.variables()).containsEntry("employeeId", "emp-123");
    }

    @Test
    void bundleCreateRequestRecord() {
        BundleCreateRequest request = new BundleCreateRequest(1L, "EXPENSE_APPROVAL", "Test bundle");
        assertThat(request.companyId()).isEqualTo(1L);
        assertThat(request.bundleType()).isEqualTo("EXPENSE_APPROVAL");
        assertThat(request.description()).isEqualTo("Test bundle");
    }

    @Test
    void bundleCreateRequestWithNullFields() {
        BundleCreateRequest request = new BundleCreateRequest(null, null, null);
        assertThat(request.companyId()).isNull();
        assertThat(request.bundleType()).isNull();
        assertThat(request.description()).isNull();
    }
}
