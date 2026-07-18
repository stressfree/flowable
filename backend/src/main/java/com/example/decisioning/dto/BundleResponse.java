package com.example.decisioning.dto;

import java.time.Instant;
import java.util.List;

public record BundleResponse(
    Long id,
    String bundleType,
    String description,
    String status,
    Instant goLiveAt,
    Long companyId,
    String companyName,
    Long entrypointFileId,
    List<BundleFileResponse> files,
    List<ValidationError> validationErrors,
    Instant createdAt
) {}
