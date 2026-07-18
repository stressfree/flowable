package com.example.decisioning.unit;

import com.example.decisioning.controller.GlobalExceptionHandler;
import com.example.decisioning.dto.ParseError;
import com.example.decisioning.dto.ValidationError;
import com.example.decisioning.exception.BundleFileNotFoundException;
import com.example.decisioning.exception.BundleLifecycleException;
import com.example.decisioning.exception.BundleParseException;
import com.example.decisioning.exception.BundleValidationException;
import com.example.decisioning.exception.CompanyNotFoundException;
import com.example.decisioning.exception.FlowableDeploymentException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleCompanyNotFoundExceptionReturns404() {
        CompanyNotFoundException ex = new CompanyNotFoundException(42L);
        ProblemDetail problem = handler.handleCompanyNotFound(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(problem.getType().toString())
            .isEqualTo("https://flowable-v2/errors/not-found");
        assertThat(problem.getTitle()).isEqualTo("Resource not found");
        assertThat(problem.getDetail()).contains("42");
        assertThat(problem.getProperties()).containsKey("companyId");
        assertThat(problem.getProperties().get("companyId")).isEqualTo(42L);
        assertThat(problem.getProperties()).containsKey("timestamp");
    }

    @Test
    void handleBundleFileNotFoundExceptionReturns404() {
        BundleFileNotFoundException ex =
            new BundleFileNotFoundException("Bundle with id 99 not found");
        ProblemDetail problem = handler.handleBundleFileNotFound(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(problem.getDetail()).contains("99");
        assertThat(problem.getProperties()).containsKey("timestamp");
    }

    @Test
    void handleBundleValidationExceptionReturns422WithErrors() {
        ValidationError error = new ValidationError(
            12L, "expense-approval.bpmn", "BPMN", "callActivity",
            "Approve Invoice", "callActivity_1", "subprocess-invoice",
            "calledElement",
            "Upload a BPMN file containing process id=\"subprocess-invoice\", "
            + "or remove this callActivity from expense-approval.bpmn");
        BundleValidationException ex =
            new BundleValidationException(7L, List.of(error));
        ProblemDetail problem = handler.handleBundleValidation(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY.value());
        assertThat(problem.getType().toString())
            .isEqualTo("https://flowable-v2/errors/validation-failed");
        assertThat(problem.getTitle()).isEqualTo("Cross-reference validation failed");
        assertThat(problem.getDetail()).contains("1 unresolved references");
        assertThat(problem.getProperties()).containsKey("bundleId");
        assertThat(problem.getProperties().get("bundleId")).isEqualTo(7L);
        assertThat(problem.getProperties()).containsKey("errors");
        assertThat(problem.getProperties()).containsKey("timestamp");
    }

    @Test
    void handleBundleValidationExceptionMultipleErrors() {
        ValidationError error1 = new ValidationError(
            12L, "expense-approval.bpmn", "BPMN", "callActivity",
            "Approve Invoice", "callActivity_1", "subprocess-invoice",
            "calledElement", "Fix suggestion 1");
        ValidationError error2 = new ValidationError(
            13L, "rules.dmn", "DMN", "decision",
            "Travel Check", "decision_1", "missing-table",
            "decisionRef", "Fix suggestion 2");
        BundleValidationException ex =
            new BundleValidationException(7L, List.of(error1, error2));
        ProblemDetail problem = handler.handleBundleValidation(ex);

        assertThat(problem.getDetail()).contains("2 unresolved references");
    }

    @Test
    void handleBundleParseExceptionReturns422WithParseError() {
        ParseError parseError = new ParseError(14, 7,
            "Expected closing tag </process> but found </sequenceFlow>",
            "Check that all XML tags are properly opened and closed. "
            + "The error occurred at line 14.");
        BundleParseException ex =
            new BundleParseException(12L, "expense-approval.bpmn", parseError);
        ProblemDetail problem = handler.handleBundleParse(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY.value());
        assertThat(problem.getType().toString())
            .isEqualTo("https://flowable-v2/errors/parse-failed");
        assertThat(problem.getTitle()).isEqualTo("XML parse error");
        assertThat(problem.getDetail()).contains("expense-approval.bpmn");
        assertThat(problem.getProperties()).containsKey("fileId");
        assertThat(problem.getProperties().get("fileId")).isEqualTo(12L);
        assertThat(problem.getProperties()).containsKey("filename");
        assertThat(problem.getProperties().get("filename")).isEqualTo("expense-approval.bpmn");
        assertThat(problem.getProperties()).containsKey("parseError");
        assertThat(problem.getProperties()).containsKey("timestamp");
    }

    @Test
    void handleBundleLifecycleExceptionReturns409() {
        BundleLifecycleException ex = new BundleLifecycleException(
            7L, "DRAFT", "PUBLISH",
            "Bundle has 2 unresolved cross-references",
            "Fix all validation errors before publishing");
        ProblemDetail problem = handler.handleBundleLifecycle(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(problem.getType().toString())
            .isEqualTo("https://flowable-v2/errors/lifecycle");
        assertThat(problem.getTitle()).isEqualTo("Invalid bundle state");
        assertThat(problem.getProperties()).containsKey("bundleId");
        assertThat(problem.getProperties().get("bundleId")).isEqualTo(7L);
        assertThat(problem.getProperties().get("currentStatus")).isEqualTo("DRAFT");
        assertThat(problem.getProperties().get("action")).isEqualTo("PUBLISH");
        assertThat(problem.getProperties().get("reason"))
            .isEqualTo("Bundle has 2 unresolved cross-references");
        assertThat(problem.getProperties().get("suggestion"))
            .isEqualTo("Fix all validation errors before publishing");
        assertThat(problem.getProperties()).containsKey("timestamp");
    }

    @Test
    void handleFlowableDeploymentExceptionReturns503() {
        FlowableDeploymentException ex = new FlowableDeploymentException(
            7L, "expense-approval",
            "Duplicate process key — a different version is already deployed",
            "Archive the existing published bundle for this process key, "
            + "or update the process id in your BPMN file");
        ProblemDetail problem = handler.handleFlowableDeployment(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE.value());
        assertThat(problem.getType().toString())
            .isEqualTo("https://flowable-v2/errors/flowable-deploy");
        assertThat(problem.getTitle()).isEqualTo("Flowable deployment failed");
        assertThat(problem.getDetail())
            .isEqualTo("Process could not be deployed to the Flowable engine");
        assertThat(problem.getProperties().get("bundleId")).isEqualTo(7L);
        assertThat(problem.getProperties().get("processKey")).isEqualTo("expense-approval");
        assertThat(problem.getProperties().get("reason"))
            .isEqualTo("Duplicate process key — a different version is already deployed");
        assertThat((String) problem.getProperties().get("suggestion"))
            .contains("Archive the existing published bundle");
        assertThat(problem.getProperties()).containsKey("timestamp");
    }

    @Test
    void handleIllegalArgumentExceptionReturns400() {
        IllegalArgumentException ex = new IllegalArgumentException("Invalid parameter");
        ProblemDetail problem = handler.handleIllegalArgument(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(problem.getDetail()).isEqualTo("Invalid parameter");
        assertThat(problem.getProperties()).containsKey("timestamp");
    }

    @Test
    void handleUnhandledExceptionReturns500() {
        Exception ex = new RuntimeException("Unexpected error");
        ProblemDetail problem = handler.handleUnhandled(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
        assertThat(problem.getType().toString())
            .isEqualTo("https://flowable-v2/errors/internal");
        assertThat(problem.getTitle()).isEqualTo("Internal server error");
        assertThat(problem.getProperties()).containsKey("timestamp");
    }

    @Test
    void handleMaxUploadSizeExceededExceptionReturns413() {
        MaxUploadSizeExceededException ex =
            new MaxUploadSizeExceededException(10_000_000L);
        ProblemDetail problem = handler.handleMaxUploadSize(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE.value());
        assertThat(problem.getType().toString())
            .isEqualTo("https://flowable-v2/errors/payload-too-large");
        assertThat(problem.getTitle()).isEqualTo("File too large");
        assertThat(problem.getDetail()).contains("10MB");
        assertThat(problem.getProperties()).containsKey("timestamp");
    }
}
