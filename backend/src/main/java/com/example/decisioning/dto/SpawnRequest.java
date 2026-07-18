package com.example.decisioning.dto;

import java.util.Map;

public record SpawnRequest(
    Map<String, Object> variables
) {}
