package com.example.decisioning.repository;

import com.example.decisioning.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    List<Company> findAllByOrderByNameAsc();

    @Query("SELECT DISTINCT c FROM Company c LEFT JOIN FETCH c.parentCompany LEFT JOIN FETCH c.children ORDER BY c.name")
    List<Company> findAllWithRelations();

    @Query("SELECT DISTINCT c FROM Company c LEFT JOIN FETCH c.parentCompany LEFT JOIN FETCH c.children LEFT JOIN FETCH c.bundles WHERE c.id = :id")
    Optional<Company> findByIdWithRelations(@Param("id") Long id);
}
