package com.example.decisioning.integration;

import com.example.decisioning.entity.BundleFile;
import com.example.decisioning.entity.BundleStatus;
import com.example.decisioning.entity.BundleType;
import com.example.decisioning.entity.Company;
import com.example.decisioning.entity.DecisioningBundle;
import com.example.decisioning.repository.BundleFileRepository;
import com.example.decisioning.repository.CompanyRepository;
import com.example.decisioning.repository.DecisioningBundleRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@ActiveProfiles("test")
class RepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("decisioning")
            .withUsername("decisioning")
            .withPassword("decisioning");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private DecisioningBundleRepository bundleRepository;

    @Autowired
    private BundleFileRepository fileRepository;

    @AfterEach
    void tearDown() {
        fileRepository.deleteAll();
        bundleRepository.deleteAll();
        companyRepository.deleteAll();
    }

    @Test
    void companyRepositoryFindAllByOrderByNameAsc() {
        Company zebra = new Company();
        zebra.setName("Zebra Inc");
        companyRepository.save(zebra);

        Company apple = new Company();
        apple.setName("Apple Corp");
        companyRepository.save(apple);

        List<Company> result = companyRepository.findAllByOrderByNameAsc();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Apple Corp");
        assertThat(result.get(1).getName()).isEqualTo("Zebra Inc");
    }

    @Test
    void companyRepositoryFindAllWithRelations() {
        Company parent = new Company();
        parent.setName("Parent Corp");
        companyRepository.save(parent);

        Company child = new Company();
        child.setName("Child Corp");
        child.setParentCompany(parent);
        companyRepository.save(child);

        entityManager.clear();

        List<Company> result = companyRepository.findAllWithRelations();

        assertThat(result).hasSize(2);
        Company foundParent = result.stream()
                .filter(c -> c.getName().equals("Parent Corp"))
                .findFirst()
                .orElseThrow();
        assertThat(foundParent.getChildren()).hasSize(1);
        assertThat(foundParent.getChildren().get(0).getName()).isEqualTo("Child Corp");
    }

    @Test
    void companyRepositoryFindByIdWithRelations() {
        Company parent = new Company();
        parent.setName("Parent Corp");
        companyRepository.save(parent);

        Company child = new Company();
        child.setName("Child Corp");
        child.setParentCompany(parent);
        companyRepository.save(child);

        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setCompany(child);
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(bundle);

        entityManager.clear();

        Optional<Company> result = companyRepository.findByIdWithRelations(child.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getParentCompany()).isNotNull();
        assertThat(result.get().getParentCompany().getName()).isEqualTo("Parent Corp");
        assertThat(result.get().getBundles()).hasSize(1);
    }

    @Test
    void bundleRepositoryFindByIdWithFiles() {
        Company company = new Company();
        company.setName("Acme Corp");
        companyRepository.save(company);

        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setCompany(company);
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(bundle);

        BundleFile file1 = new BundleFile();
        file1.setBundle(bundle);
        file1.setFilename("main.bpmn");
        file1.setMimeType("application/xml");
        file1.setContent("<xml/>".getBytes());
        file1.setEntrypoint(true);
        fileRepository.save(file1);

        BundleFile file2 = new BundleFile();
        file2.setBundle(bundle);
        file2.setFilename("rules.dmn");
        file2.setMimeType("application/xml");
        file2.setContent("<xml/>".getBytes());
        file2.setEntrypoint(false);
        fileRepository.save(file2);

        entityManager.clear();

        Optional<DecisioningBundle> result = bundleRepository.findByIdWithFiles(bundle.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getFiles()).hasSize(2);
    }

    @Test
    void bundleRepositoryFindByIdWithCompanyAndFiles() {
        Company company = new Company();
        company.setName("Acme Corp");
        companyRepository.save(company);

        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setCompany(company);
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(bundle);

        BundleFile file = new BundleFile();
        file.setBundle(bundle);
        file.setFilename("main.bpmn");
        file.setMimeType("application/xml");
        file.setContent("<xml/>".getBytes());
        file.setEntrypoint(true);
        fileRepository.save(file);

        entityManager.clear();

        Optional<DecisioningBundle> result = bundleRepository.findByIdWithCompanyAndFiles(bundle.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getCompany().getName()).isEqualTo("Acme Corp");
        assertThat(result.get().getFiles()).hasSize(1);
    }

    @Test
    void bundleRepositoryFindPublishedByCompanyAndType() {
        Company company = new Company();
        company.setName("Acme Corp");
        companyRepository.save(company);

        DecisioningBundle published = new DecisioningBundle();
        published.setCompany(company);
        published.setBundleType(BundleType.EXPENSE_APPROVAL);
        published.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(published);

        DecisioningBundle draft = new DecisioningBundle();
        draft.setCompany(company);
        draft.setBundleType(BundleType.EXPENSE_APPROVAL);
        draft.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(draft);

        Optional<DecisioningBundle> result = bundleRepository
                .findPublishedByCompanyAndType(company.getId(), BundleType.EXPENSE_APPROVAL);

        assertThat(result).isPresent();
        assertThat(result.get().getStatus()).isEqualTo(BundleStatus.PUBLISHED);
        assertThat(result.get().getId()).isEqualTo(published.getId());
    }

    @Test
    void bundleRepositoryFindPublishedGlobalByType() {
        DecisioningBundle globalPublished = new DecisioningBundle();
        globalPublished.setBundleType(BundleType.EXPENSE_APPROVAL);
        globalPublished.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(globalPublished);

        DecisioningBundle globalDraft = new DecisioningBundle();
        globalDraft.setBundleType(BundleType.EXPENSE_APPROVAL);
        globalDraft.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(globalDraft);

        Optional<DecisioningBundle> result = bundleRepository
                .findPublishedGlobalByType(BundleType.EXPENSE_APPROVAL);

        assertThat(result).isPresent();
        assertThat(result.get().getCompany()).isNull();
        assertThat(result.get().getStatus()).isEqualTo(BundleStatus.PUBLISHED);
    }

    @Test
    void bundleRepositoryFindScheduledForPromotion() {
        Instant past = Instant.now().minus(1, ChronoUnit.HOURS);
        Instant future = Instant.now().plus(1, ChronoUnit.HOURS);

        DecisioningBundle scheduled = new DecisioningBundle();
        scheduled.setBundleType(BundleType.EXPENSE_APPROVAL);
        scheduled.setStatus(BundleStatus.DRAFT);
        scheduled.setGoLiveAt(past);
        bundleRepository.save(scheduled);

        DecisioningBundle notYetScheduled = new DecisioningBundle();
        notYetScheduled.setBundleType(BundleType.EXPENSE_APPROVAL);
        notYetScheduled.setStatus(BundleStatus.DRAFT);
        notYetScheduled.setGoLiveAt(future);
        bundleRepository.save(notYetScheduled);

        DecisioningBundle noSchedule = new DecisioningBundle();
        noSchedule.setBundleType(BundleType.EXPENSE_APPROVAL);
        noSchedule.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(noSchedule);

        List<DecisioningBundle> result = bundleRepository
                .findScheduledForPromotion(Instant.now());

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(scheduled.getId());
    }

    @Test
    void bundleRepositoryFindAllByOrderByCreatedAtDesc() {
        DecisioningBundle first = new DecisioningBundle();
        first.setBundleType(BundleType.EXPENSE_APPROVAL);
        first.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(first);

        DecisioningBundle second = new DecisioningBundle();
        second.setBundleType(BundleType.VIRTUAL_CARD_APPROVAL);
        second.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(second);

        List<DecisioningBundle> result = bundleRepository.findAllByOrderByCreatedAtDesc();

        assertThat(result).hasSizeGreaterThanOrEqualTo(2);
        assertThat(result.get(0).getCreatedAt()).isAfterOrEqualTo(result.get(1).getCreatedAt());
    }

    @Test
    void bundleRepositoryFindAllWithFiltersByCompanyId() {
        Company acme = new Company();
        acme.setName("Acme Corp");
        companyRepository.save(acme);

        Company beta = new Company();
        beta.setName("Beta Inc");
        companyRepository.save(beta);

        DecisioningBundle acmeBundle = new DecisioningBundle();
        acmeBundle.setCompany(acme);
        acmeBundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        acmeBundle.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(acmeBundle);

        DecisioningBundle betaBundle = new DecisioningBundle();
        betaBundle.setCompany(beta);
        betaBundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        betaBundle.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(betaBundle);

        List<DecisioningBundle> result = bundleRepository
                .findAllWithFilters(acme.getId(), null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCompany().getName()).isEqualTo("Acme Corp");
    }

    @Test
    void bundleRepositoryFindAllWithFiltersByBundleType() {
        DecisioningBundle expense = new DecisioningBundle();
        expense.setBundleType(BundleType.EXPENSE_APPROVAL);
        expense.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(expense);

        DecisioningBundle virtualCard = new DecisioningBundle();
        virtualCard.setBundleType(BundleType.VIRTUAL_CARD_APPROVAL);
        virtualCard.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(virtualCard);

        List<DecisioningBundle> result = bundleRepository
                .findAllWithFilters(null, BundleType.EXPENSE_APPROVAL, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getBundleType()).isEqualTo(BundleType.EXPENSE_APPROVAL);
    }

    @Test
    void bundleRepositoryFindAllWithFiltersByStatus() {
        DecisioningBundle draft = new DecisioningBundle();
        draft.setBundleType(BundleType.EXPENSE_APPROVAL);
        draft.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(draft);

        DecisioningBundle published = new DecisioningBundle();
        published.setBundleType(BundleType.EXPENSE_APPROVAL);
        published.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(published);

        List<DecisioningBundle> result = bundleRepository
                .findAllWithFilters(null, null, BundleStatus.PUBLISHED);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(BundleStatus.PUBLISHED);
    }

    @Test
    void bundleRepositoryFindAllWithFiltersCombined() {
        Company acme = new Company();
        acme.setName("Acme Corp");
        companyRepository.save(acme);

        DecisioningBundle matching = new DecisioningBundle();
        matching.setCompany(acme);
        matching.setBundleType(BundleType.EXPENSE_APPROVAL);
        matching.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(matching);

        DecisioningBundle wrongType = new DecisioningBundle();
        wrongType.setCompany(acme);
        wrongType.setBundleType(BundleType.VIRTUAL_CARD_APPROVAL);
        wrongType.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(wrongType);

        DecisioningBundle wrongStatus = new DecisioningBundle();
        wrongStatus.setCompany(acme);
        wrongStatus.setBundleType(BundleType.EXPENSE_APPROVAL);
        wrongStatus.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(wrongStatus);

        List<DecisioningBundle> result = bundleRepository
                .findAllWithFilters(acme.getId(), BundleType.EXPENSE_APPROVAL, BundleStatus.PUBLISHED);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(matching.getId());
    }

    @Test
    void bundleRepositoryFindAllWithFiltersAllNull() {
        DecisioningBundle bundle1 = new DecisioningBundle();
        bundle1.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle1.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(bundle1);

        DecisioningBundle bundle2 = new DecisioningBundle();
        bundle2.setBundleType(BundleType.VIRTUAL_CARD_APPROVAL);
        bundle2.setStatus(BundleStatus.PUBLISHED);
        bundleRepository.save(bundle2);

        List<DecisioningBundle> result = bundleRepository
                .findAllWithFilters(null, null, null);

        assertThat(result).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void fileRepositoryFindByBundleId() {
        Company company = new Company();
        company.setName("Acme Corp");
        companyRepository.save(company);

        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setCompany(company);
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.DRAFT);
        bundleRepository.save(bundle);

        BundleFile file1 = new BundleFile();
        file1.setBundle(bundle);
        file1.setFilename("main.bpmn");
        file1.setMimeType("application/xml");
        file1.setContent("<xml/>".getBytes());
        file1.setEntrypoint(true);
        fileRepository.save(file1);

        BundleFile file2 = new BundleFile();
        file2.setBundle(bundle);
        file2.setFilename("rules.dmn");
        file2.setMimeType("application/xml");
        file2.setContent("<xml/>".getBytes());
        file2.setEntrypoint(false);
        fileRepository.save(file2);

        List<BundleFile> result = fileRepository.findByBundleId(bundle.getId());

        assertThat(result).hasSize(2);
        assertThat(result).extracting(BundleFile::getFilename)
                .containsExactlyInAnyOrder("main.bpmn", "rules.dmn");
    }
}
