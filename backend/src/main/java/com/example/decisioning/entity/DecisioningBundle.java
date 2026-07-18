package com.example.decisioning.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import static jakarta.persistence.GenerationType.IDENTITY;

@Entity
@Table(name = "decisioning_bundles")
public class DecisioningBundle {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Enumerated(EnumType.STRING)
    @Column(name = "bundle_type", nullable = false, length = 50)
    private BundleType bundleType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BundleStatus status = BundleStatus.DRAFT;

    @Column(name = "go_live_at")
    private Instant goLiveAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrypoint_file_id")
    private BundleFile entrypointFile;

    @OneToMany(mappedBy = "bundle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BundleFile> files = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public BundleType getBundleType() {
        return bundleType;
    }

    public void setBundleType(BundleType bundleType) {
        this.bundleType = bundleType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BundleStatus getStatus() {
        return status;
    }

    public void setStatus(BundleStatus status) {
        this.status = status;
    }

    public Instant getGoLiveAt() {
        return goLiveAt;
    }

    public void setGoLiveAt(Instant goLiveAt) {
        this.goLiveAt = goLiveAt;
    }

    public BundleFile getEntrypointFile() {
        return entrypointFile;
    }

    public void setEntrypointFile(BundleFile entrypointFile) {
        this.entrypointFile = entrypointFile;
    }

    public List<BundleFile> getFiles() {
        return files;
    }

    public void addFile(BundleFile file) {
        files.add(file);
        file.setBundle(this);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DecisioningBundle that)) return false;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
