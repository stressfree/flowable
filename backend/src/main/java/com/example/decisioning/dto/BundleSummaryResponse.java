package com.example.decisioning.dto;

import java.time.Instant;

public record BundleSummaryResponse(
    Long id,
    String bundleType,
    String description,
    String status,
    Long companyId,
    String companyName,
    int fileCount,
    Instant createdAt
) {}
