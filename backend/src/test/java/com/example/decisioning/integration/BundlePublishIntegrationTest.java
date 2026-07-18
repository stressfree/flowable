package com.example.decisioning.integration;

import com.example.decisioning.entity.BundleStatus;
import com.example.decisioning.entity.BundleType;
import com.example.decisioning.entity.Company;
import com.example.decisioning.entity.DecisioningBundle;
import com.example.decisioning.repository.CompanyRepository;
import com.example.decisioning.repository.DecisioningBundleRepository;
import com.example.decisioning.service.BundlePublishService;
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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class BundlePublishIntegrationTest {

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
    private BundlePublishService publishService;

    @Autowired
    private DecisioningBundleRepository bundleRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @AfterEach
    void tearDown() {
        bundleRepository.deleteAll();
        companyRepository.deleteAll();
    }

    @Test
    void publishNowPromotesDraftToPublished() {
        DecisioningBundle bundle = createDraftBundle(null, BundleType.EXPENSE_APPROVAL);

        DecisioningBundle published = publishService.publishNow(bundle.getId());

        assertThat(published.getStatus()).isEqualTo(BundleStatus.PUBLISHED);
        assertThat(published.getGoLiveAt()).isNull();
    }

    @Test
    void publishNowArchivesPreviousPublished() {
        Company acme = createCompany("Acme Corp");
        DecisioningBundle first = createDraftBundle(acme, BundleType.EXPENSE_APPROVAL);
        publishService.publishNow(first.getId());

        DecisioningBundle second = createDraftBundle(acme, BundleType.EXPENSE_APPROVAL);
        publishService.publishNow(second.getId());

        DecisioningBundle refetched = bundleRepository.findById(first.getId()).orElseThrow();
        assertThat(refetched.getStatus()).isEqualTo(BundleStatus.ARCHIVED);

        DecisioningBundle newPublished = bundleRepository.findById(second.getId()).orElseThrow();
        assertThat(newPublished.getStatus()).isEqualTo(BundleStatus.PUBLISHED);
    }

    @Test
    void publishNowArchivesPreviousGlobalPublished() {
        DecisioningBundle first = createDraftBundle(null, BundleType.EXPENSE_APPROVAL);
        publishService.publishNow(first.getId());

        DecisioningBundle second = createDraftBundle(null, BundleType.EXPENSE_APPROVAL);
        publishService.publishNow(second.getId());

        DecisioningBundle refetched = bundleRepository.findById(first.getId()).orElseThrow();
        assertThat(refetched.getStatus()).isEqualTo(BundleStatus.ARCHIVED);
    }

    @Test
    void publishNowFailsOnPublishedBundle() {
        DecisioningBundle bundle = createDraftBundle(null, BundleType.EXPENSE_APPROVAL);
        publishService.publishNow(bundle.getId());

        assertThatThrownBy(() -> publishService.publishNow(bundle.getId()))
            .isInstanceOf(com.example.decisioning.exception.BundleLifecycleException.class);
    }

    @Test
    void publishNowFailsOnArchivedBundle() {
        DecisioningBundle bundle = createDraftBundle(null, BundleType.EXPENSE_APPROVAL);
        publishService.publishNow(bundle.getId());
        bundle.setStatus(BundleStatus.ARCHIVED);
        bundleRepository.save(bundle);

        assertThatThrownBy(() -> publishService.publishNow(bundle.getId()))
            .isInstanceOf(com.example.decisioning.exception.BundleLifecycleException.class);
    }

    @Test
    void publishNowFailsOnNonExistentBundle() {
        assertThatThrownBy(() -> publishService.publishNow(99999L))
            .isInstanceOf(com.example.decisioning.exception.BundleFileNotFoundException.class);
    }

    @Test
    void schedulePublishSetsGoLiveAt() {
        DecisioningBundle bundle = createDraftBundle(null, BundleType.EXPENSE_APPROVAL);
        Instant future = Instant.now().plus(2, ChronoUnit.HOURS);

        DecisioningBundle scheduled = publishService.schedulePublish(bundle.getId(), future);

        assertThat(scheduled.getStatus()).isEqualTo(BundleStatus.DRAFT);
        assertThat(scheduled.getGoLiveAt()).isEqualTo(future);
    }

    @Test
    void schedulePublishFailsOnPastTimestamp() {
        DecisioningBundle bundle = createDraftBundle(null, BundleType.EXPENSE_APPROVAL);
        Instant past = Instant.now().minus(1, ChronoUnit.HOURS);

        assertThatThrownBy(() -> publishService.schedulePublish(bundle.getId(), past))
            .isInstanceOf(com.example.decisioning.exception.BundleLifecycleException.class);
    }

    @Test
    void schedulePublishFailsOnNullTimestamp() {
        DecisioningBundle bundle = createDraftBundle(null, BundleType.EXPENSE_APPROVAL);

        assertThatThrownBy(() -> publishService.schedulePublish(bundle.getId(), null))
            .isInstanceOf(com.example.decisioning.exception.BundleLifecycleException.class);
    }

    @Test
    void schedulePublishFailsOnPublishedBundle() {
        DecisioningBundle bundle = createDraftBundle(null, BundleType.EXPENSE_APPROVAL);
        publishService.publishNow(bundle.getId());

        assertThatThrownBy(() ->
            publishService.schedulePublish(bundle.getId(), Instant.now().plus(1, ChronoUnit.HOURS)))
            .isInstanceOf(com.example.decisioning.exception.BundleLifecycleException.class);
    }

    @Test
    void promoteScheduledPromotesDueBundle() {
        DecisioningBundle bundle = createDraftBundle(null, BundleType.EXPENSE_APPROVAL);
        bundle.setGoLiveAt(Instant.now().minus(1, ChronoUnit.MINUTES));
        bundleRepository.save(bundle);

        publishService.promoteScheduled();

        DecisioningBundle refetched = bundleRepository.findById(bundle.getId()).orElseThrow();
        assertThat(refetched.getStatus()).isEqualTo(BundleStatus.PUBLISHED);
        assertThat(refetched.getGoLiveAt()).isNull();
    }

    @Test
    void promoteScheduledDoesNotPromoteFutureBundle() {
        DecisioningBundle bundle = createDraftBundle(null, BundleType.EXPENSE_APPROVAL);
        bundle.setGoLiveAt(Instant.now().plus(1, ChronoUnit.HOURS));
        bundleRepository.save(bundle);

        publishService.promoteScheduled();

        DecisioningBundle refetched = bundleRepository.findById(bundle.getId()).orElseThrow();
        assertThat(refetched.getStatus()).isEqualTo(BundleStatus.DRAFT);
    }

    @Test
    void promoteScheduledDoesNotPromoteBundleWithoutGoLiveAt() {
        DecisioningBundle bundle = createDraftBundle(null, BundleType.EXPENSE_APPROVAL);
        bundleRepository.save(bundle);

        publishService.promoteScheduled();

        DecisioningBundle refetched = bundleRepository.findById(bundle.getId()).orElseThrow();
        assertThat(refetched.getStatus()).isEqualTo(BundleStatus.DRAFT);
    }

    @Test
    void promoteScheduledArchivesPreviousPublished() {
        Company acme = createCompany("Acme Corp");
        DecisioningBundle first = createDraftBundle(acme, BundleType.EXPENSE_APPROVAL);
        publishService.publishNow(first.getId());

        DecisioningBundle second = createDraftBundle(acme, BundleType.EXPENSE_APPROVAL);
        second.setGoLiveAt(Instant.now().minus(1, ChronoUnit.MINUTES));
        bundleRepository.save(second);

        publishService.promoteScheduled();

        DecisioningBundle oldPublished = bundleRepository.findById(first.getId()).orElseThrow();
        assertThat(oldPublished.getStatus()).isEqualTo(BundleStatus.ARCHIVED);

        DecisioningBundle newPublished = bundleRepository.findById(second.getId()).orElseThrow();
        assertThat(newPublished.getStatus()).isEqualTo(BundleStatus.PUBLISHED);
    }

    @Test
    void promoteScheduledHandlesMultipleDueBundles() {
        DecisioningBundle bundle1 = createDraftBundle(null, BundleType.EXPENSE_APPROVAL);
        bundle1.setGoLiveAt(Instant.now().minus(5, ChronoUnit.MINUTES));
        bundleRepository.save(bundle1);

        DecisioningBundle bundle2 = createDraftBundle(null, BundleType.VIRTUAL_CARD_APPROVAL);
        bundle2.setGoLiveAt(Instant.now().minus(3, ChronoUnit.MINUTES));
        bundleRepository.save(bundle2);

        publishService.promoteScheduled();

        assertThat(bundleRepository.findById(bundle1.getId()).orElseThrow().getStatus())
            .isEqualTo(BundleStatus.PUBLISHED);
        assertThat(bundleRepository.findById(bundle2.getId()).orElseThrow().getStatus())
            .isEqualTo(BundleStatus.PUBLISHED);
    }

    private Company createCompany(String name) {
        Company company = new Company();
        company.setName(name);
        return companyRepository.save(company);
    }

    private DecisioningBundle createDraftBundle(Company company, BundleType type) {
        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setCompany(company);
        bundle.setBundleType(type);
        bundle.setStatus(BundleStatus.DRAFT);
        return bundleRepository.save(bundle);
    }
}
