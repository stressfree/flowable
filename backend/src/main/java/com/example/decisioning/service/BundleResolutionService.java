package com.example.decisioning.service;

import com.example.decisioning.entity.BundleType;
import com.example.decisioning.entity.Company;
import com.example.decisioning.entity.DecisioningBundle;
import com.example.decisioning.repository.CompanyRepository;
import com.example.decisioning.repository.DecisioningBundleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class BundleResolutionService {

    private final DecisioningBundleRepository bundleRepository;
    private final CompanyRepository companyRepository;

    public BundleResolutionService(DecisioningBundleRepository bundleRepository,
                                     CompanyRepository companyRepository) {
        this.bundleRepository = bundleRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public Optional<DecisioningBundle> resolve(Long companyId, BundleType bundleType) {
        if (companyId != null) {
            Optional<Company> companyOpt = companyRepository.findById(companyId);
            if (companyOpt.isPresent()) {
                Company company = companyOpt.get();
                Optional<DecisioningBundle> found = resolveUpwardChain(company, bundleType);
                if (found.isPresent()) {
                    return found;
                }
            }
        }
        return bundleRepository.findPublishedGlobalByType(bundleType);
    }

    private Optional<DecisioningBundle> resolveUpwardChain(Company company,
                                                             BundleType bundleType) {
        Optional<DecisioningBundle> found = bundleRepository
            .findPublishedByCompanyAndType(company.getId(), bundleType);
        if (found.isPresent()) {
            return found;
        }
        if (company.getParentCompany() != null) {
            return resolveUpwardChain(company.getParentCompany(), bundleType);
        }
        return bundleRepository.findPublishedGlobalByType(bundleType);
    }
}
