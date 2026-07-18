package com.example.decisioning.exception;

public class BundleLifecycleException extends DecisioningException {

    private final Long bundleId;
    private final String currentStatus;
    private final String action;
    private final String reason;
    private final String suggestion;

    public BundleLifecycleException(Long bundleId, String currentStatus, String action,
                                     String reason, String suggestion) {
        super(
            "https://flowable-v2/errors/lifecycle",
            "Invalid bundle state",
            reason);
        this.bundleId = bundleId;
        this.currentStatus = currentStatus;
        this.action = action;
        this.reason = reason;
        this.suggestion = suggestion;
    }

    public Long getBundleId() {
        return bundleId;
    }

    public String getCurrentStatus() {
        return currentStatus;
    }

    public String getAction() {
        return action;
    }

    public String getReason() {
        return reason;
    }

    public String getSuggestion() {
        return suggestion;
    }

    @Override
    public int getHttpStatus() {
        return 409;
    }
}
