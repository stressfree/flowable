package com.example.decisioning.exception;

import com.example.decisioning.dto.ValidationError;

import java.util.List;

public class BundleValidationException extends DecisioningException {

    private final Long bundleId;
    private final List<ValidationError> errors;

    public BundleValidationException(Long bundleId, List<ValidationError> errors) {
        super(
            "https://flowable-v2/errors/validation-failed",
            "Cross-reference validation failed",
            errors.size() + " unresolved references found in this bundle");
        this.bundleId = bundleId;
        this.errors = errors;
    }

    public Long getBundleId() {
        return bundleId;
    }

    public List<ValidationError> getErrors() {
        return errors;
    }

    @Override
    public int getHttpStatus() {
        return 422;
    }
}
