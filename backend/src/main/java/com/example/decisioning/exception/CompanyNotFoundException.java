package com.example.decisioning.exception;

public class CompanyNotFoundException extends DecisioningException {

    private final Long companyId;

    public CompanyNotFoundException(Long companyId) {
        super(
            "https://flowable-v2/errors/not-found",
            "Resource not found",
            "Company with id " + companyId + " not found");
        this.companyId = companyId;
    }

    public Long getCompanyId() {
        return companyId;
    }

    @Override
    public int getHttpStatus() {
        return 404;
    }
}
