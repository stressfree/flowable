package com.example.decisioning.dto;

import java.time.Instant;
import java.util.List;

public record CompanyDetailResponse(
    Long id,
    String name,
    Long parentCompanyId,
    String parentCompanyName,
    List<CompanyResponse> children,
    List<BundleSummaryResponse> bundles,
    Instant createdAt
) {}
