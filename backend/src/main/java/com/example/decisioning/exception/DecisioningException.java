package com.example.decisioning.exception;

public abstract class DecisioningException extends RuntimeException {

    private final String type;
    private final String title;

    protected DecisioningException(String type, String title, String message) {
        super(message);
        this.type = type;
        this.title = title;
    }

    protected DecisioningException(String type, String title, String message, Throwable cause) {
        super(message, cause);
        this.type = type;
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public abstract int getHttpStatus();
}
