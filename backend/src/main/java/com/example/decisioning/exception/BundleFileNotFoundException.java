package com.example.decisioning.exception;

public class BundleFileNotFoundException extends DecisioningException {

    public BundleFileNotFoundException(String message) {
        super(
            "https://flowable-v2/errors/not-found",
            "Resource not found",
            message);
    }

    @Override
    public int getHttpStatus() {
        return 404;
    }
}
