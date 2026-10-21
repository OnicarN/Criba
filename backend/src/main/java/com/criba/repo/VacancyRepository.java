package com.criba.repo;

import com.criba.domain.Vacancy;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface VacancyRepository extends JpaRepository<Vacancy, Long> {
    /** Toda consulta filtra por la cuenta propietaria (aislamiento entre empresas). */
    Optional<Vacancy> findByIdAndOwnerId(Long id, Long ownerId);

    List<Vacancy> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    long countByOwnerIdAndArchivedFalse(Long ownerId);

    @Query("select v.id, count(a) from Vacancy v left join v.analyses a where v.owner.id = :ownerId group by v.id")
    List<Object[]> countAnalysesByOwner(Long ownerId);
}
