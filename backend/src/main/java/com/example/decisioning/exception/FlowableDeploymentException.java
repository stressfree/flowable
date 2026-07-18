package com.example.decisioning.exception;

public class FlowableDeploymentException extends DecisioningException {

    private final Long bundleId;
    private final String processKey;
    private final String reason;
    private final String suggestion;

    public FlowableDeploymentException(Long bundleId, String processKey,
                                        String reason, String suggestion) {
        super(
            "https://flowable-v2/errors/flowable-deploy",
            "Flowable deployment failed",
            "Process could not be deployed to the Flowable engine");
        this.bundleId = bundleId;
        this.processKey = processKey;
        this.reason = reason;
        this.suggestion = suggestion;
    }

    public Long getBundleId() {
        return bundleId;
    }

    public String getProcessKey() {
        return processKey;
    }

    public String getReason() {
        return reason;
    }

    public String getSuggestion() {
        return suggestion;
    }

    @Override
    public int getHttpStatus() {
        return 503;
    }
}
