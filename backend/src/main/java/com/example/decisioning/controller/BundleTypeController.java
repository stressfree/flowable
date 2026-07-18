package com.example.decisioning.controller;

import com.example.decisioning.config.BundleTypeConfig;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/bundle-types")
public class BundleTypeController {

    private final BundleTypeConfig bundleTypeConfig;

    public BundleTypeController(BundleTypeConfig bundleTypeConfig) {
        this.bundleTypeConfig = bundleTypeConfig;
    }

    @GetMapping
    public List<Map<String, String>> findAll() {
        return bundleTypeConfig.getTypes().entrySet().stream()
            .map(e -> Map.of(
                "type", e.getKey().name(),
                "label", e.getValue()))
            .collect(Collectors.toList());
    }
}
