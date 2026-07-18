package com.example.decisioning.dto;

import jakarta.validation.constraints.NotBlank;

public record CompanyRequest(
    @NotBlank(message = "Company name is required")
    String name,

    Long parentCompanyId
) {}
