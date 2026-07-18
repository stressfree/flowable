package com.example.decisioning.repository;

import com.example.decisioning.entity.BundleStatus;
import com.example.decisioning.entity.BundleType;
import com.example.decisioning.entity.DecisioningBundle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface DecisioningBundleRepository extends JpaRepository<DecisioningBundle, Long> {

    @Query("SELECT DISTINCT b FROM DecisioningBundle b LEFT JOIN FETCH b.files WHERE b.id = :id")
    Optional<DecisioningBundle> findByIdWithFiles(@Param("id") Long id);

    @Query("SELECT DISTINCT b FROM DecisioningBundle b LEFT JOIN FETCH b.files LEFT JOIN FETCH b.company WHERE b.id = :id")
    Optional<DecisioningBundle> findByIdWithCompanyAndFiles(@Param("id") Long id);

    @Query("SELECT b FROM DecisioningBundle b WHERE b.company.id = :companyId AND b.bundleType = :type AND b.status = 'PUBLISHED'")
    Optional<DecisioningBundle> findPublishedByCompanyAndType(@Param("companyId") Long companyId,
                                                               @Param("type") BundleType type);

    @Query("SELECT b FROM DecisioningBundle b WHERE b.company IS NULL AND b.bundleType = :type AND b.status = 'PUBLISHED'")
    Optional<DecisioningBundle> findPublishedGlobalByType(@Param("type") BundleType type);

    @Query("SELECT b FROM DecisioningBundle b WHERE b.status = 'DRAFT' AND b.goLiveAt IS NOT NULL AND b.goLiveAt <= :now")
    List<DecisioningBundle> findScheduledForPromotion(@Param("now") Instant now);

    List<DecisioningBundle> findAllByOrderByCreatedAtDesc();

    @Query("SELECT b FROM DecisioningBundle b WHERE " +
           "(:companyId IS NULL OR b.company.id = :companyId) AND " +
           "(:bundleType IS NULL OR b.bundleType = :bundleType) AND " +
           "(:status IS NULL OR b.status = :status) " +
           "ORDER BY b.createdAt DESC")
    List<DecisioningBundle> findAllWithFilters(@Param("companyId") Long companyId,
                                                @Param("bundleType") BundleType bundleType,
                                                @Param("status") BundleStatus status);
}
