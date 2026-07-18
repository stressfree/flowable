package com.example.decisioning.unit;

import com.example.decisioning.dto.ParseError;
import com.example.decisioning.dto.ValidationError;
import com.example.decisioning.exception.BundleFileNotFoundException;
import com.example.decisioning.exception.BundleLifecycleException;
import com.example.decisioning.exception.BundleParseException;
import com.example.decisioning.exception.BundleValidationException;
import com.example.decisioning.exception.CompanyNotFoundException;
import com.example.decisioning.exception.FlowableDeploymentException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ExceptionTest {

    @Test
    void bundleFileNotFoundExceptionGetters() {
        BundleFileNotFoundException ex = new BundleFileNotFoundException("Not found");
        assertThat(ex.getType()).isEqualTo("https://flowable-v2/errors/not-found");
        assertThat(ex.getTitle()).isEqualTo("Resource not found");
        assertThat(ex.getMessage()).isEqualTo("Not found");
        assertThat(ex.getHttpStatus()).isEqualTo(404);
    }

    @Test
    void companyNotFoundExceptionGetters() {
        CompanyNotFoundException ex = new CompanyNotFoundException(42L);
        assertThat(ex.getCompanyId()).isEqualTo(42L);
        assertThat(ex.getType()).isEqualTo("https://flowable-v2/errors/not-found");
        assertThat(ex.getTitle()).isEqualTo("Resource not found");
        assertThat(ex.getMessage()).contains("42");
        assertThat(ex.getHttpStatus()).isEqualTo(404);
    }

    @Test
    void bundleLifecycleExceptionGetters() {
        BundleLifecycleException ex = new BundleLifecycleException(
            7L, "DRAFT", "PUBLISH", "Cannot publish", "Fix errors first");
        assertThat(ex.getBundleId()).isEqualTo(7L);
        assertThat(ex.getCurrentStatus()).isEqualTo("DRAFT");
        assertThat(ex.getAction()).isEqualTo("PUBLISH");
        assertThat(ex.getReason()).isEqualTo("Cannot publish");
        assertThat(ex.getSuggestion()).isEqualTo("Fix errors first");
        assertThat(ex.getType()).isEqualTo("https://flowable-v2/errors/lifecycle");
        assertThat(ex.getTitle()).isEqualTo("Invalid bundle state");
        assertThat(ex.getHttpStatus()).isEqualTo(409);
    }

    @Test
    void bundleParseExceptionGetters() {
        ParseError parseError = new ParseError(1, 2, "msg", "suggestion");
        BundleParseException ex = new BundleParseException(5L, "file.bpmn", parseError);
        assertThat(ex.getFileId()).isEqualTo(5L);
        assertThat(ex.getFilename()).isEqualTo("file.bpmn");
        assertThat(ex.getParseError()).isEqualTo(parseError);
        assertThat(ex.getType()).isEqualTo("https://flowable-v2/errors/parse-failed");
        assertThat(ex.getTitle()).isEqualTo("XML parse error");
        assertThat(ex.getHttpStatus()).isEqualTo(422);
    }

    @Test
    void bundleValidationExceptionGetters() {
        ValidationError error = new ValidationError(
            1L, "f.bpmn", "BPMN", "el", "name", "id", "ref",
            "attr", "suggestion");
        BundleValidationException ex = new BundleValidationException(3L, List.of(error));
        assertThat(ex.getBundleId()).isEqualTo(3L);
        assertThat(ex.getErrors()).hasSize(1);
        assertThat(ex.getType()).isEqualTo("https://flowable-v2/errors/validation-failed");
        assertThat(ex.getTitle()).isEqualTo("Cross-reference validation failed");
        assertThat(ex.getHttpStatus()).isEqualTo(422);
    }

    @Test
    void flowableDeploymentExceptionGetters() {
        FlowableDeploymentException ex = new FlowableDeploymentException(
            1L, "processKey", "reason", "suggestion");
        assertThat(ex.getBundleId()).isEqualTo(1L);
        assertThat(ex.getProcessKey()).isEqualTo("processKey");
        assertThat(ex.getReason()).isEqualTo("reason");
        assertThat(ex.getSuggestion()).isEqualTo("suggestion");
        assertThat(ex.getType()).isEqualTo("https://flowable-v2/errors/flowable-deploy");
        assertThat(ex.getTitle()).isEqualTo("Flowable deployment failed");
        assertThat(ex.getHttpStatus()).isEqualTo(503);
    }
}
