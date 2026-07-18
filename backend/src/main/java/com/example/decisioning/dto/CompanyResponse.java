package com.example.decisioning.dto;

import java.time.Instant;

public record CompanyResponse(
    Long id,
    String name,
    Long parentCompanyId,
    String parentCompanyName,
    Instant createdAt
) {}
