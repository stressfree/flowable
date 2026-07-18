package com.example.decisioning.integration;

import com.example.decisioning.entity.BundleFile;
import com.example.decisioning.entity.BundleStatus;
import com.example.decisioning.entity.BundleType;
import com.example.decisioning.entity.Company;
import com.example.decisioning.entity.DecisioningBundle;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@ActiveProfiles("test")
class EntityMappingTest {

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
    private EntityManager entityManager;

    @Test
    void companyPersistsWithAllFields() {
        Company company = new Company();
        company.setName("Acme Corp");

        entityManager.persist(company);
        entityManager.flush();
        entityManager.clear();

        Company found = entityManager.find(Company.class, company.getId());
        assertThat(found).isNotNull();
        assertThat(found.getName()).isEqualTo("Acme Corp");
        assertThat(found.getCreatedAt()).isNotNull();
        assertThat(found.getChildren()).isEmpty();
        assertThat(found.getBundles()).isEmpty();
    }

    @Test
    void companyPersistsWithParentAndChild() {
        Company parent = new Company();
        parent.setName("Parent Corp");
        entityManager.persist(parent);

        Company child = new Company();
        child.setName("Child Corp");
        child.setParentCompany(parent);
        entityManager.persist(child);
        entityManager.flush();
        entityManager.clear();

        Company foundParent = entityManager.find(Company.class, parent.getId());
        assertThat(foundParent.getChildren()).hasSize(1);
        assertThat(foundParent.getChildren().get(0).getName()).isEqualTo("Child Corp");
    }

    @Test
    void decisioningBundlePersistsWithAllFields() {
        Company company = new Company();
        company.setName("Acme Corp");
        entityManager.persist(company);

        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setCompany(company);
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setDescription("Standard expense approval workflow");
        bundle.setStatus(BundleStatus.DRAFT);
        entityManager.persist(bundle);
        entityManager.flush();
        entityManager.clear();

        DecisioningBundle found = entityManager.find(DecisioningBundle.class, bundle.getId());
        assertThat(found).isNotNull();
        assertThat(found.getCompany().getName()).isEqualTo("Acme Corp");
        assertThat(found.getBundleType()).isEqualTo(BundleType.EXPENSE_APPROVAL);
        assertThat(found.getDescription()).isEqualTo("Standard expense approval workflow");
        assertThat(found.getStatus()).isEqualTo(BundleStatus.DRAFT);
        assertThat(found.getCreatedAt()).isNotNull();
        assertThat(found.getFiles()).isEmpty();
    }

    @Test
    void globalBundlePersistsWithNullCompany() {
        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setBundleType(BundleType.VIRTUAL_CARD_APPROVAL);
        bundle.setDescription("Global virtual card approval");
        bundle.setStatus(BundleStatus.PUBLISHED);
        entityManager.persist(bundle);
        entityManager.flush();
        entityManager.clear();

        DecisioningBundle found = entityManager.find(DecisioningBundle.class, bundle.getId());
        assertThat(found).isNotNull();
        assertThat(found.getCompany()).isNull();
        assertThat(found.getStatus()).isEqualTo(BundleStatus.PUBLISHED);
    }

    @Test
    void bundleFilePersistsWithContent() {
        Company company = new Company();
        company.setName("Acme Corp");
        entityManager.persist(company);

        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setCompany(company);
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.DRAFT);
        entityManager.persist(bundle);

        BundleFile file = new BundleFile();
        file.setBundle(bundle);
        file.setFilename("expense-approval.bpmn");
        file.setMimeType("application/xml");
        file.setContent("<?xml version=\"1.0\"?><definitions/>".getBytes());
        file.setEntrypoint(true);
        entityManager.persist(file);
        entityManager.flush();
        entityManager.clear();

        BundleFile found = entityManager.find(BundleFile.class, file.getId());
        assertThat(found).isNotNull();
        assertThat(found.getFilename()).isEqualTo("expense-approval.bpmn");
        assertThat(found.getMimeType()).isEqualTo("application/xml");
        assertThat(new String(found.getContent())).contains("definitions");
        assertThat(found.isEntrypoint()).isTrue();
        assertThat(found.getCreatedAt()).isNotNull();
    }

    @Test
    void bundleCascadeDeletesFiles() {
        Company company = new Company();
        company.setName("Acme Corp");
        entityManager.persist(company);

        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setCompany(company);
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.DRAFT);
        entityManager.persist(bundle);

        BundleFile file = new BundleFile();
        file.setBundle(bundle);
        file.setFilename("test.bpmn");
        file.setMimeType("application/xml");
        file.setContent("<xml/>".getBytes());
        file.setEntrypoint(false);
        bundle.addFile(file);
        entityManager.persist(bundle);
        entityManager.flush();

        Long fileId = file.getId();
        Long bundleId = bundle.getId();

        entityManager.remove(bundle);
        entityManager.flush();

        assertThat(entityManager.find(BundleFile.class, fileId)).isNull();
        assertThat(entityManager.find(DecisioningBundle.class, bundleId)).isNull();
    }

    @Test
    void companyEqualsAndHashCodeBasedOnId() {
        Company c1 = new Company();
        c1.setId(1L);
        c1.setName("A");

        Company c2 = new Company();
        c2.setId(1L);
        c2.setName("B");

        Company c3 = new Company();
        c3.setId(2L);
        c3.setName("A");

        assertThat(c1).isEqualTo(c2);
        assertThat(c1).isNotEqualTo(c3);
        assertThat(c1.hashCode()).isEqualTo(c2.hashCode());
    }

    @Test
    void bundleEqualsAndHashCodeBasedOnId() {
        DecisioningBundle b1 = new DecisioningBundle();
        b1.setId(1L);
        b1.setBundleType(BundleType.EXPENSE_APPROVAL);

        DecisioningBundle b2 = new DecisioningBundle();
        b2.setId(1L);
        b2.setBundleType(BundleType.VIRTUAL_CARD_APPROVAL);

        DecisioningBundle b3 = new DecisioningBundle();
        b3.setId(2L);
        b3.setBundleType(BundleType.EXPENSE_APPROVAL);

        assertThat(b1).isEqualTo(b2);
        assertThat(b1).isNotEqualTo(b3);
        assertThat(b1.hashCode()).isEqualTo(b2.hashCode());
    }

    @Test
    void bundleFileEqualsAndHashCodeBasedOnId() {
        BundleFile f1 = new BundleFile();
        f1.setId(1L);
        f1.setFilename("a.bpmn");

        BundleFile f2 = new BundleFile();
        f2.setId(1L);
        f2.setFilename("b.bpmn");

        BundleFile f3 = new BundleFile();
        f3.setId(2L);
        f3.setFilename("a.bpmn");

        assertThat(f1).isEqualTo(f2);
        assertThat(f1).isNotEqualTo(f3);
        assertThat(f1.hashCode()).isEqualTo(f2.hashCode());
    }

    @Test
    void bundleFileEqualsWithSameReference() {
        BundleFile f1 = new BundleFile();
        f1.setId(1L);
        assertThat(f1).isEqualTo(f1);
    }

    @Test
    void bundleFileEqualsWithNullIdReturnsFalse() {
        BundleFile f1 = new BundleFile();
        BundleFile f2 = new BundleFile();
        f2.setId(1L);
        assertThat(f1).isNotEqualTo(f2);
    }

    @Test
    void bundleFileEqualsWithNonBundleFileReturnsFalse() {
        BundleFile f1 = new BundleFile();
        f1.setId(1L);
        assertThat(f1).isNotEqualTo("not a BundleFile");
    }

    @Test
    void bundleFileEqualsWithNullReturnsFalse() {
        BundleFile f1 = new BundleFile();
        f1.setId(1L);
        assertThat(f1).isNotEqualTo(null);
    }

    @Test
    void companyEqualsWithSameReference() {
        Company c1 = new Company();
        c1.setId(1L);
        assertThat(c1).isEqualTo(c1);
    }

    @Test
    void companyEqualsWithNullIdReturnsFalse() {
        Company c1 = new Company();
        Company c2 = new Company();
        c2.setId(1L);
        assertThat(c1).isNotEqualTo(c2);
    }

    @Test
    void companyEqualsWithNonCompanyReturnsFalse() {
        Company c1 = new Company();
        c1.setId(1L);
        assertThat(c1).isNotEqualTo("not a Company");
    }

    @Test
    void companyEqualsWithNullReturnsFalse() {
        Company c1 = new Company();
        c1.setId(1L);
        assertThat(c1).isNotEqualTo(null);
    }

    @Test
    void companyAddChildSetsBidirectionalRelationship() {
        Company parent = new Company();
        parent.setName("Parent");
        Company child = new Company();
        child.setName("Child");

        parent.addChild(child);

        assertThat(parent.getChildren()).hasSize(1);
        assertThat(parent.getChildren().get(0)).isEqualTo(child);
        assertThat(child.getParentCompany()).isEqualTo(parent);
    }

    @Test
    void companyAddBundleSetsBidirectionalRelationship() {
        Company company = new Company();
        company.setName("Acme");
        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.DRAFT);

        company.addBundle(bundle);

        assertThat(company.getBundles()).hasSize(1);
        assertThat(bundle.getCompany()).isEqualTo(company);
    }

    @Test
    void decisioningBundleGetFilesAndAddFile() {
        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.DRAFT);

        BundleFile file = new BundleFile();
        file.setFilename("test.bpmn");
        file.setMimeType("application/xml");
        file.setContent("<xml/>".getBytes());
        bundle.addFile(file);

        assertThat(bundle.getFiles()).hasSize(1);
        assertThat(file.getBundle()).isEqualTo(bundle);
    }

    @Test
    void decisioningBundleEqualsWithSameReference() {
        DecisioningBundle b1 = new DecisioningBundle();
        b1.setId(1L);
        assertThat(b1).isEqualTo(b1);
    }

    @Test
    void decisioningBundleEqualsWithNullIdReturnsFalse() {
        DecisioningBundle b1 = new DecisioningBundle();
        DecisioningBundle b2 = new DecisioningBundle();
        b2.setId(1L);
        assertThat(b1).isNotEqualTo(b2);
    }

    @Test
    void decisioningBundleEqualsWithNonBundleReturnsFalse() {
        DecisioningBundle b1 = new DecisioningBundle();
        b1.setId(1L);
        assertThat(b1).isNotEqualTo("not a bundle");
    }

    @Test
    void decisioningBundleEqualsWithNullReturnsFalse() {
        DecisioningBundle b1 = new DecisioningBundle();
        b1.setId(1L);
        assertThat(b1).isNotEqualTo(null);
    }

    @Test
    void decisioningBundleGoLiveAtGetterSetter() {
        DecisioningBundle bundle = new DecisioningBundle();
        Instant goLive = Instant.now().plusSeconds(3600);
        bundle.setGoLiveAt(goLive);
        assertThat(bundle.getGoLiveAt()).isEqualTo(goLive);
    }

    @Test
    void decisioningBundleEntrypointFileGetterSetter() {
        DecisioningBundle bundle = new DecisioningBundle();
        BundleFile file = new BundleFile();
        file.setId(1L);
        bundle.setEntrypointFile(file);
        assertThat(bundle.getEntrypointFile()).isEqualTo(file);
    }
}
