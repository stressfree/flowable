package com.example.decisioning.service;

import com.example.decisioning.dto.BundleFileResponse;
import com.example.decisioning.dto.BundleResponse;
import com.example.decisioning.dto.BundleSummaryResponse;
import com.example.decisioning.dto.ValidationError;
import com.example.decisioning.entity.BundleFile;
import com.example.decisioning.entity.BundleStatus;
import com.example.decisioning.entity.BundleType;
import com.example.decisioning.entity.Company;
import com.example.decisioning.entity.DecisioningBundle;
import com.example.decisioning.exception.BundleFileNotFoundException;
import com.example.decisioning.exception.BundleLifecycleException;
import com.example.decisioning.exception.BundleParseException;
import com.example.decisioning.exception.CompanyNotFoundException;
import com.example.decisioning.repository.BundleFileRepository;
import com.example.decisioning.repository.CompanyRepository;
import com.example.decisioning.repository.DecisioningBundleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class BundleService {

    private final DecisioningBundleRepository bundleRepository;
    private final BundleFileRepository fileRepository;
    private final CompanyRepository companyRepository;
    private final XmlParseService xmlParseService;
    private final DiagramGenerationService diagramGenerationService;
    private final CrossReferenceValidator crossReferenceValidator;

    public BundleService(DecisioningBundleRepository bundleRepository,
                          BundleFileRepository fileRepository,
                          CompanyRepository companyRepository,
                          XmlParseService xmlParseService,
                          DiagramGenerationService diagramGenerationService,
                          CrossReferenceValidator crossReferenceValidator) {
        this.bundleRepository = bundleRepository;
        this.fileRepository = fileRepository;
        this.companyRepository = companyRepository;
        this.xmlParseService = xmlParseService;
        this.diagramGenerationService = diagramGenerationService;
        this.crossReferenceValidator = crossReferenceValidator;
    }

    public BundleResponse createBundle(MultipartFile[] files, Long companyId,
                                        BundleType bundleType, String description) {
        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setBundleType(bundleType);
        bundle.setDescription(description);
        bundle.setStatus(BundleStatus.DRAFT);
        if (companyId != null) {
            Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new CompanyNotFoundException(companyId));
            bundle.setCompany(company);
        }
        bundleRepository.save(bundle);

        List<BundleFile> savedFiles = processFiles(bundle, files);
        if (!savedFiles.isEmpty() && bundle.getEntrypointFile() == null) {
            BundleFile first = savedFiles.get(0);
            first.setEntrypoint(true);
            bundle.setEntrypointFile(first);
        }
        bundleRepository.save(bundle);

        return toBundleResponse(bundle, List.of());
    }

    public BundleResponse addFiles(Long bundleId, MultipartFile[] files) {
        DecisioningBundle bundle = bundleRepository.findByIdWithFiles(bundleId)
            .orElseThrow(() -> new BundleFileNotFoundException(
                "Bundle with id " + bundleId + " not found"));
        if (bundle.getStatus() != BundleStatus.DRAFT) {
            throw new BundleLifecycleException(
                bundleId, bundle.getStatus().name(), "ADD_FILES",
                "Cannot add files to a " + bundle.getStatus() + " bundle",
                "Only DRAFT bundles can have files added");
        }
        processFiles(bundle, files);
        bundleRepository.save(bundle);
        List<ValidationError> errors = crossReferenceValidator.validate(bundle);
        return toBundleResponse(bundle, errors);
    }

    @Transactional(readOnly = true)
    public BundleResponse getBundle(Long bundleId) {
        DecisioningBundle bundle = bundleRepository.findByIdWithCompanyAndFiles(bundleId)
            .orElseThrow(() -> new BundleFileNotFoundException(
                "Bundle with id " + bundleId + " not found"));
        List<ValidationError> errors = crossReferenceValidator.validate(bundle);
        return toBundleResponse(bundle, errors);
    }

    @Transactional(readOnly = true)
    public List<BundleSummaryResponse> listBundles(Long companyId, BundleType bundleType,
                                                     BundleStatus status) {
        return bundleRepository.findAllWithFilters(companyId, bundleType, status).stream()
            .map(b -> new BundleSummaryResponse(
                b.getId(),
                b.getBundleType().name(),
                b.getDescription(),
                b.getStatus().name(),
                b.getCompany() != null ? b.getCompany().getId() : null,
                b.getCompany() != null ? b.getCompany().getName() : null,
                b.getFiles().size(),
                b.getCreatedAt()))
            .toList();
    }

    public BundleResponse setEntrypoint(Long bundleId, Long fileId) {
        DecisioningBundle bundle = bundleRepository.findByIdWithFiles(bundleId)
            .orElseThrow(() -> new BundleFileNotFoundException(
                "Bundle with id " + bundleId + " not found"));
        if (bundle.getStatus() != BundleStatus.DRAFT) {
            throw new BundleLifecycleException(
                bundleId, bundle.getStatus().name(), "SET_ENTRYPOINT",
                "Cannot set entrypoint on a " + bundle.getStatus() + " bundle",
                "Only DRAFT bundles can have their entrypoint changed");
        }
        BundleFile target = bundle.getFiles().stream()
            .filter(f -> f.getId().equals(fileId))
            .findFirst()
            .orElseThrow(() -> new BundleFileNotFoundException(
                "File with id " + fileId + " not found in bundle " + bundleId));
        bundle.getFiles().forEach(f -> f.setEntrypoint(false));
        target.setEntrypoint(true);
        bundle.setEntrypointFile(target);
        bundleRepository.save(bundle);
        return toBundleResponse(bundle, crossReferenceValidator.validate(bundle));
    }

    @Transactional(readOnly = true)
    public byte[] getFileContent(Long bundleId, Long fileId) {
        DecisioningBundle bundle = bundleRepository.findByIdWithFiles(bundleId)
            .orElseThrow(() -> new BundleFileNotFoundException(
                "Bundle with id " + bundleId + " not found"));
        BundleFile file = bundle.getFiles().stream()
            .filter(f -> f.getId().equals(fileId))
            .findFirst()
            .orElseThrow(() -> new BundleFileNotFoundException(
                "File with id " + fileId + " not found in bundle " + bundleId));
        return file.getContent();
    }

    public void deleteBundle(Long bundleId) {
        DecisioningBundle bundle = bundleRepository.findByIdWithFiles(bundleId)
            .orElseThrow(() -> new BundleFileNotFoundException(
                "Bundle with id " + bundleId + " not found"));
        if (bundle.getStatus() != BundleStatus.DRAFT) {
            throw new BundleLifecycleException(
                bundleId, bundle.getStatus().name(), "DELETE",
                "Cannot delete a " + bundle.getStatus() + " bundle",
                "Only DRAFT bundles can be deleted. Archive instead.");
        }
        bundleRepository.delete(bundle);
    }

    private List<BundleFile> processFiles(DecisioningBundle bundle, MultipartFile[] files) {
        List<BundleFile> savedFiles = new ArrayList<>();
        for (MultipartFile multipart : files) {
            try {
                byte[] content = multipart.getBytes();
                String filename = multipart.getOriginalFilename();
                if (filename == null || !filename.toLowerCase().endsWith(".event")) {
                    xmlParseService.validateWellFormed(content)
                        .ifPresent(parseError -> {
                            throw new BundleParseException(
                                null, filename, parseError);
                        });
                }
                byte[] enrichedContent = diagramGenerationService.enrichWithDiagrams(
                    content, filename);
                BundleFile file = new BundleFile();
                file.setBundle(bundle);
                file.setFilename(filename);
                file.setMimeType(multipart.getContentType() != null
                    ? multipart.getContentType() : "application/xml");
                file.setContent(enrichedContent);
                file.setEntrypoint(false);
                fileRepository.save(file);
                bundle.addFile(file);
                savedFiles.add(file);
            } catch (IOException e) {
                throw new BundleFileNotFoundException(
                    "Failed to read file: " + multipart.getOriginalFilename());
            }
        }
        return savedFiles;
    }

    private BundleResponse toBundleResponse(DecisioningBundle bundle,
                                              List<ValidationError> errors) {
        List<BundleFileResponse> fileResponses = bundle.getFiles().stream()
            .map(f -> new BundleFileResponse(
                f.getId(),
                f.getFilename(),
                f.getMimeType(),
                f.isEntrypoint(),
                f.getCreatedAt()))
            .toList();
        Long companyId = bundle.getCompany() != null ? bundle.getCompany().getId() : null;
        String companyName = bundle.getCompany() != null ? bundle.getCompany().getName() : null;
        Long entrypointId = bundle.getEntrypointFile() != null
            ? bundle.getEntrypointFile().getId() : null;
        return new BundleResponse(
            bundle.getId(),
            bundle.getBundleType().name(),
            bundle.getDescription(),
            bundle.getStatus().name(),
            bundle.getGoLiveAt(),
            companyId,
            companyName,
            entrypointId,
            fileResponses,
            errors,
            bundle.getCreatedAt());
    }
}
