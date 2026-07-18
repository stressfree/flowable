package com.example.decisioning.repository;

import com.example.decisioning.entity.BundleFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BundleFileRepository extends JpaRepository<BundleFile, Long> {

    List<BundleFile> findByBundleId(Long bundleId);
}
