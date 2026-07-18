package com.example.decisioning.dto;

import java.util.List;

public record EventDefinitionResponse(
    String key,
    String name,
    List<CorrelationParameter> correlationParameters,
    List<PayloadField> payload
) {
    public record CorrelationParameter(String name, String type) {}
    public record PayloadField(String name, String type) {}
}
