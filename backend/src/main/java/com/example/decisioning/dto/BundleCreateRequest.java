package com.example.decisioning.dto;

public record BundleCreateRequest(
    Long companyId,
    String bundleType,
    String description
) {}
