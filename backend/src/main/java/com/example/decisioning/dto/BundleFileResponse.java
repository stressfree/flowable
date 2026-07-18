package com.example.decisioning.dto;

import java.time.Instant;

public record BundleFileResponse(
    Long id,
    String filename,
    String mimeType,
    boolean isEntrypoint,
    Instant createdAt
) {}
