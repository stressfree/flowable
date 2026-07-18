package com.example.decisioning.dto;

import java.util.Map;

public record SendEventRequest(
    Map<String, Object> payload
) {}
