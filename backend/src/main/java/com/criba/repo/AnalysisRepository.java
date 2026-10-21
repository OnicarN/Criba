package com.criba.repo;

import com.criba.domain.Analysis;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnalysisRepository extends JpaRepository<Analysis, Long> {
    List<Analysis> findByVacancyIdOrderByScoreDescCreatedAtAsc(Long vacancyId);

    Optional<Analysis> findByIdAndVacancyOwnerId(Long id, Long ownerId);
}
