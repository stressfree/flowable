package com.example.decisioning.integration;

import com.example.decisioning.entity.BundleStatus;
import com.example.decisioning.entity.BundleType;
import com.example.decisioning.entity.Company;
import com.example.decisioning.entity.DecisioningBundle;
import com.example.decisioning.repository.CompanyRepository;
import com.example.decisioning.repository.DecisioningBundleRepository;
import com.example.decisioning.service.BundleResolutionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class BundleResolutionIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("decisioning")
        .withUsername("decisioning")
        .withPassword("decisioning");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("flowable.database-schema", () -> "public");
        registry.add("flowable.event-registry.database-schema", () -> "public");
    }

    @Autowired
    private BundleResolutionService resolutionService;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private DecisioningBundleRepository bundleRepository;

    @AfterEach
    void tearDown() {
        bundleRepository.deleteAll();
        companyRepository.deleteAll();
    }

    @Test
    void resolveFindsPublishedBundleForCompany() {
        Company acme = new Company();
        acme.setName("Acme Corp");
        companyRepository.save(acme);

        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setCompany(acme);
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(bundle);

        Optional<DecisioningBundle> result = resolutionService.resolve(
            acme.getId(), BundleType.EXPENSE_APPROVAL);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(bundle.getId());
    }

    @Test
    void resolveFallsBackToParentCompany() {
        Company parent = new Company();
        parent.setName("Parent Corp");
        companyRepository.save(parent);

        Company child = new Company();
        child.setName("Child Corp");
        child.setParentCompany(parent);
        companyRepository.save(child);

        DecisioningBundle parentBundle = new DecisioningBundle();
        parentBundle.setCompany(parent);
        parentBundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        parentBundle.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(parentBundle);

        Optional<DecisioningBundle> result = resolutionService.resolve(
            child.getId(), BundleType.EXPENSE_APPROVAL);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(parentBundle.getId());
    }

    @Test
    void resolveFallsBackToGrandparentCompany() {
        Company grandparent = new Company();
        grandparent.setName("Grandparent Corp");
        companyRepository.save(grandparent);

        Company parent = new Company();
        parent.setName("Parent Corp");
        parent.setParentCompany(grandparent);
        companyRepository.save(parent);

        Company child = new Company();
        child.setName("Child Corp");
        child.setParentCompany(parent);
        companyRepository.save(child);

        DecisioningBundle gpBundle = new DecisioningBundle();
        gpBundle.setCompany(grandparent);
        gpBundle.setBundleType(BundleType.VIRTUAL_CARD_APPROVAL);
        gpBundle.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(gpBundle);

        Optional<DecisioningBundle> result = resolutionService.resolve(
            child.getId(), BundleType.VIRTUAL_CARD_APPROVAL);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(gpBundle.getId());
    }

    @Test
    void resolveFallsBackToGlobalWhenNoCompanyBundle() {
        Company acme = new Company();
        acme.setName("Acme Corp");
        companyRepository.save(acme);

        DecisioningBundle globalBundle = new DecisioningBundle();
        globalBundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        globalBundle.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(globalBundle);

        Optional<DecisioningBundle> result = resolutionService.resolve(
            acme.getId(), BundleType.EXPENSE_APPROVAL);

        assertThat(result).isPresent();
        assertThat(result.get().getCompany()).isNull();
    }

    @Test
    void resolveFallsBackToGlobalForUnknownCompanyId() {
        DecisioningBundle globalBundle = new DecisioningBundle();
        globalBundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        globalBundle.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(globalBundle);

        Optional<DecisioningBundle> result = resolutionService.resolve(
            99999L, BundleType.EXPENSE_APPROVAL);

        assertThat(result).isPresent();
        assertThat(result.get().getCompany()).isNull();
    }

    @Test
    void resolveReturnsEmptyWhenNothingFound() {
        Company acme = new Company();
        acme.setName("Acme Corp");
        companyRepository.save(acme);

        Optional<DecisioningBundle> result = resolutionService.resolve(
            acme.getId(), BundleType.CARD_CONTROLS_CHANGE_APPROVAL);

        assertThat(result).isEmpty();
    }

    @Test
    void resolveIgnoresDraftBundles() {
        Company acme = new Company();
        acme.setName("Acme Corp");
        companyRepository.save(acme);

        DecisioningBundle draft = new DecisioningBundle();
        draft.setCompany(acme);
        draft.setBundleType(BundleType.EXPENSE_APPROVAL);
        draft.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(draft);

        Optional<DecisioningBundle> result = resolutionService.resolve(
            acme.getId(), BundleType.EXPENSE_APPROVAL);

        assertThat(result).isEmpty();
    }

    @Test
    void resolveIgnoresArchivedBundles() {
        Company acme = new Company();
        acme.setName("Acme Corp");
        companyRepository.save(acme);

        DecisioningBundle archived = new DecisioningBundle();
        archived.setCompany(acme);
        archived.setBundleType(BundleType.EXPENSE_APPROVAL);
        archived.setStatus(BundleStatus.ARCHIVED);
        bundleRepository.save(archived);

        Optional<DecisioningBundle> result = resolutionService.resolve(
            acme.getId(), BundleType.EXPENSE_APPROVAL);

        assertThat(result).isEmpty();
    }

    @Test
    void resolveWithNullCompanyIdFallsBackToGlobal() {
        DecisioningBundle globalBundle = new DecisioningBundle();
        globalBundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        globalBundle.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(globalBundle);

        Optional<DecisioningBundle> result = resolutionService.resolve(
            null, BundleType.EXPENSE_APPROVAL);

        assertThat(result).isPresent();
        assertThat(result.get().getCompany()).isNull();
    }

    @Test
    void resolvePrefersCompanyBundleOverGlobal() {
        Company acme = new Company();
        acme.setName("Acme Corp");
        companyRepository.save(acme);

        DecisioningBundle globalBundle = new DecisioningBundle();
        globalBundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        globalBundle.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(globalBundle);

        DecisioningBundle acmeBundle = new DecisioningBundle();
        acmeBundle.setCompany(acme);
        acmeBundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        acmeBundle.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(acmeBundle);

        Optional<DecisioningBundle> result = resolutionService.resolve(
            acme.getId(), BundleType.EXPENSE_APPROVAL);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(acmeBundle.getId());
    }

    @Test
    void resolvePrefersDirectCompanyOverParent() {
        Company parent = new Company();
        parent.setName("Parent Corp");
        companyRepository.save(parent);

        Company child = new Company();
        child.setName("Child Corp");
        child.setParentCompany(parent);
        companyRepository.save(child);

        DecisioningBundle parentBundle = new DecisioningBundle();
        parentBundle.setCompany(parent);
        parentBundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        parentBundle.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(parentBundle);

        DecisioningBundle childBundle = new DecisioningBundle();
        childBundle.setCompany(child);
        childBundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        childBundle.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(childBundle);

        Optional<DecisioningBundle> result = resolutionService.resolve(
            child.getId(), BundleType.EXPENSE_APPROVAL);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(childBundle.getId());
    }
}
