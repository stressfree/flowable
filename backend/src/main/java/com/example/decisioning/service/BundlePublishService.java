package com.example.decisioning.service;

import com.example.decisioning.entity.BundleStatus;
import com.example.decisioning.entity.BundleType;
import com.example.decisioning.entity.DecisioningBundle;
import com.example.decisioning.exception.BundleLifecycleException;
import com.example.decisioning.exception.BundleFileNotFoundException;
import com.example.decisioning.repository.DecisioningBundleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BundlePublishService {

    private static final Logger log = LoggerFactory.getLogger(BundlePublishService.class);

    private final DecisioningBundleRepository bundleRepository;

    public BundlePublishService(DecisioningBundleRepository bundleRepository) {
        this.bundleRepository = bundleRepository;
    }

    public DecisioningBundle publishNow(Long bundleId) {
        DecisioningBundle bundle = bundleRepository.findByIdWithCompanyAndFiles(bundleId)
            .orElseThrow(() -> new BundleFileNotFoundException(
                "Bundle with id " + bundleId + " not found"));

        if (bundle.getStatus() != BundleStatus.DRAFT) {
            throw new BundleLifecycleException(
                bundleId, bundle.getStatus().name(), "PUBLISH",
                "Cannot publish a " + bundle.getStatus() + " bundle",
                "Only DRAFT bundles can be published");
        }

        archiveCurrentPublished(bundle);

        bundle.setStatus(BundleStatus.PUBLISHED);
        bundle.setGoLiveAt(null);
        return bundleRepository.save(bundle);
    }

    public DecisioningBundle schedulePublish(Long bundleId, Instant goLiveAt) {
        DecisioningBundle bundle = bundleRepository.findByIdWithCompanyAndFiles(bundleId)
            .orElseThrow(() -> new BundleFileNotFoundException(
                "Bundle with id " + bundleId + " not found"));

        if (bundle.getStatus() != BundleStatus.DRAFT) {
            throw new BundleLifecycleException(
                bundleId, bundle.getStatus().name(), "SCHEDULE",
                "Cannot schedule a " + bundle.getStatus() + " bundle",
                "Only DRAFT bundles can be scheduled");
        }

        if (goLiveAt == null || goLiveAt.isBefore(Instant.now())) {
            throw new BundleLifecycleException(
                bundleId, bundle.getStatus().name(), "SCHEDULE",
                "goLiveAt must be a future timestamp",
                "Provide a future ISO-8601 timestamp for goLiveAt");
        }

        bundle.setGoLiveAt(goLiveAt);
        return bundleRepository.save(bundle);
    }

    public void promoteScheduled() {
        List<DecisioningBundle> scheduled = bundleRepository
            .findScheduledForPromotion(Instant.now());

        for (DecisioningBundle bundle : scheduled) {
            try {
                archiveCurrentPublished(bundle);
                bundle.setStatus(BundleStatus.PUBLISHED);
                bundle.setGoLiveAt(null);
                bundleRepository.save(bundle);
                log.info("Auto-promoted bundle {} to PUBLISHED", bundle.getId());
            } catch (Exception e) {
                log.error("Failed to auto-promote bundle {}", bundle.getId(), e);
            }
        }
    }

    private void archiveCurrentPublished(DecisioningBundle bundle) {
        BundleType bundleType = bundle.getBundleType();
        Long companyId = bundle.getCompany() != null ? bundle.getCompany().getId() : null;

        Optional<DecisioningBundle> currentPublished;
        if (companyId != null) {
            currentPublished = bundleRepository
                .findPublishedByCompanyAndType(companyId, bundleType);
        } else {
            currentPublished = bundleRepository
                .findPublishedGlobalByType(bundleType);
        }

        currentPublished.ifPresent(published -> {
            published.setStatus(BundleStatus.ARCHIVED);
            bundleRepository.save(published);
            log.info("Archived previously published bundle {}", published.getId());
        });
    }
}
