package com.example.decisioning.config;

import com.example.decisioning.service.BundlePublishService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ScheduledTasks {

    private static final Logger log = LoggerFactory.getLogger(ScheduledTasks.class);

    private final BundlePublishService publishService;

    public ScheduledTasks(BundlePublishService publishService) {
        this.publishService = publishService;
    }

    @Scheduled(fixedDelayString = "${scheduler.go-live-interval-ms:30000}")
    public void promoteScheduledBundles() {
        publishService.promoteScheduled();
    }
}
