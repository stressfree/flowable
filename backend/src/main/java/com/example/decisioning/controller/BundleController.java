package com.example.decisioning.controller;

import com.example.decisioning.dto.BundleResponse;
import com.example.decisioning.dto.BundleSummaryResponse;
import com.example.decisioning.dto.PublishRequest;
import com.example.decisioning.dto.SetEntrypointRequest;
import com.example.decisioning.entity.BundleStatus;
import com.example.decisioning.entity.BundleType;
import com.example.decisioning.service.BundlePublishService;
import com.example.decisioning.service.BundleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/v1/bundles")
public class BundleController {

    private final BundleService bundleService;
    private final BundlePublishService publishService;

    public BundleController(BundleService bundleService,
                            BundlePublishService publishService) {
        this.bundleService = bundleService;
        this.publishService = publishService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BundleResponse> createBundle(
        @RequestParam("files") MultipartFile[] files,
        @RequestParam(value = "companyId", required = false) Long companyId,
        @RequestParam("bundleType") String bundleType,
        @RequestParam(value = "description", required = false) String description) {
        BundleResponse response = bundleService.createBundle(
            files, companyId, BundleType.valueOf(bundleType), description);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BundleResponse> addFiles(
        @PathVariable Long id,
        @RequestParam("files") MultipartFile[] files) {
        BundleResponse response = bundleService.addFiles(id, files);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public BundleResponse getBundle(@PathVariable Long id) {
        return bundleService.getBundle(id);
    }

    @GetMapping
    public List<BundleSummaryResponse> listBundles(
        @RequestParam(value = "companyId", required = false) Long companyId,
        @RequestParam(value = "bundleType", required = false) String bundleType,
        @RequestParam(value = "status", required = false) String status) {
        return bundleService.listBundles(
            companyId,
            bundleType != null ? BundleType.valueOf(bundleType) : null,
            status != null ? BundleStatus.valueOf(status) : null);
    }

    @PutMapping("/{id}/entrypoint")
    public BundleResponse setEntrypoint(
        @PathVariable Long id,
        @RequestBody SetEntrypointRequest request) {
        return bundleService.setEntrypoint(id, request.fileId());
    }

    @PostMapping("/{id}/validate")
    public BundleResponse validateBundle(@PathVariable Long id) {
        return bundleService.getBundle(id);
    }

    @PostMapping("/{id}/publish")
    public BundleResponse publishBundle(
        @PathVariable Long id,
        @RequestBody(required = false) PublishRequest request) {
        if (request != null && request.goLiveAt() != null) {
            publishService.schedulePublish(id, request.goLiveAt());
        } else {
            publishService.publishNow(id);
        }
        return bundleService.getBundle(id);
    }

    @GetMapping("/{id}/files/{fileId}")
    public ResponseEntity<byte[]> getFileContent(
        @PathVariable Long id,
        @PathVariable Long fileId) {
        byte[] content = bundleService.getFileContent(id, fileId);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_XML)
            .body(content);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBundle(@PathVariable Long id) {
        bundleService.deleteBundle(id);
        return ResponseEntity.noContent().build();
    }
}
