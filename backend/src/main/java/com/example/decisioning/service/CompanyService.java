package com.example.decisioning.service;

import com.example.decisioning.dto.BundleSummaryResponse;
import com.example.decisioning.dto.CompanyDetailResponse;
import com.example.decisioning.dto.CompanyRequest;
import com.example.decisioning.dto.CompanyResponse;
import com.example.decisioning.entity.Company;
import com.example.decisioning.exception.BundleLifecycleException;
import com.example.decisioning.exception.CompanyNotFoundException;
import com.example.decisioning.repository.CompanyRepository;
import com.example.decisioning.repository.DecisioningBundleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final DecisioningBundleRepository bundleRepository;

    public CompanyService(CompanyRepository companyRepository,
                           DecisioningBundleRepository bundleRepository) {
        this.companyRepository = companyRepository;
        this.bundleRepository = bundleRepository;
    }

    @Transactional(readOnly = true)
    public List<CompanyResponse> findAll() {
        return companyRepository.findAllByOrderByNameAsc().stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public CompanyDetailResponse findById(Long id) {
        Company company = companyRepository.findByIdWithRelations(id)
            .orElseThrow(() -> new CompanyNotFoundException(id));
        return toDetailResponse(company);
    }

    public CompanyResponse create(CompanyRequest request) {
        Company company = new Company();
        company.setName(request.name());
        if (request.parentCompanyId() != null) {
            Company parent = companyRepository.findById(request.parentCompanyId())
                .orElseThrow(() -> new CompanyNotFoundException(request.parentCompanyId()));
            company.setParentCompany(parent);
        }
        companyRepository.save(company);
        return toResponse(company);
    }

    public void delete(Long id) {
        Company company = companyRepository.findByIdWithRelations(id)
            .orElseThrow(() -> new CompanyNotFoundException(id));
        if (!company.getBundles().isEmpty()) {
            throw new BundleLifecycleException(
                id, "N/A", "DELETE_COMPANY",
                "Company has " + company.getBundles().size() + " bundles",
                "Delete or reassign all bundles before deleting the company");
        }
        companyRepository.delete(company);
    }

    private CompanyResponse toResponse(Company company) {
        String parentName = null;
        Long parentId = null;
        if (company.getParentCompany() != null) {
            parentId = company.getParentCompany().getId();
            parentName = company.getParentCompany().getName();
        }
        return new CompanyResponse(
            company.getId(),
            company.getName(),
            parentId,
            parentName,
            company.getCreatedAt());
    }

    private CompanyDetailResponse toDetailResponse(Company company) {
        String parentName = null;
        Long parentId = null;
        if (company.getParentCompany() != null) {
            parentId = company.getParentCompany().getId();
            parentName = company.getParentCompany().getName();
        }
        List<CompanyResponse> children = company.getChildren().stream()
            .map(this::toResponse)
            .toList();
        List<BundleSummaryResponse> bundles = company.getBundles().stream()
            .map(b -> new BundleSummaryResponse(
                b.getId(),
                b.getBundleType().name(),
                b.getDescription(),
                b.getStatus().name(),
                company.getId(),
                company.getName(),
                b.getFiles().size(),
                b.getCreatedAt()))
            .toList();
        return new CompanyDetailResponse(
            company.getId(),
            company.getName(),
            parentId,
            parentName,
            children,
            bundles,
            company.getCreatedAt());
    }
}
