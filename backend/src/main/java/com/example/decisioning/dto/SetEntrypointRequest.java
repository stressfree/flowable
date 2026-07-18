package com.example.decisioning.dto;

import jakarta.validation.constraints.NotNull;

public record SetEntrypointRequest(
    @NotNull(message = "fileId is required")
    Long fileId
) {}
