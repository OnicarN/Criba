package com.criba.web;

import com.criba.config.CurrentUser;
import com.criba.domain.AppUser;
import com.criba.domain.Vacancy;
import com.criba.repo.VacancyRepository;
import com.criba.service.UsageService;
import com.criba.web.Dtos.*;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vacancies")
public class VacancyController {
    private final VacancyRepository vacancies;
    private final CurrentUser current;
    private final UsageService usage;

    public VacancyController(VacancyRepository vacancies, CurrentUser current, UsageService usage) {
        this.vacancies = vacancies;
        this.current = current;
        this.usage = usage;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<VacancyDto> list() {
        Long uid = current.id();
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : vacancies.countAnalysesByOwner(uid)) counts.put((Long) row[0], (Long) row[1]);
        return vacancies.findByOwnerIdOrderByCreatedAtDesc(uid).stream()
                .map(v -> VacancyDto.of(v, counts.getOrDefault(v.getId(), 0L)))
                .toList();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<VacancyDto> create(@Valid @RequestBody VacancyRequest req) {
        AppUser u = current.get();
        usage.checkCanCreateVacancy(u);
        Vacancy v = new Vacancy();
        v.setOwner(u);
        apply(v, req);
        vacancies.save(v);
        return ResponseEntity.status(HttpStatus.CREATED).body(VacancyDto.of(v, 0));
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public VacancyDto get(@PathVariable Long id) {
        Vacancy v = own(id);
        return VacancyDto.of(v, v.getAnalyses().size());
    }

    /** Editar no altera los análisis ya hechos (RF-13): cada uno guarda su propio resultado. */
    @PutMapping("/{id}")
    @Transactional
    public VacancyDto update(@PathVariable Long id, @Valid @RequestBody VacancyRequest req) {
        Vacancy v = own(id);
        apply(v, req);
        return VacancyDto.of(v, v.getAnalyses().size());
    }

    /** Archivar o reactivar (RF-14). Reactivar cuenta contra el límite de vacantes activas. */
    @PatchMapping("/{id}")
    @Transactional
    public VacancyDto archive(@PathVariable Long id, @RequestBody ArchiveRequest req) {
        Vacancy v = own(id);
        if (v.isArchived() && !req.archived()) usage.checkCanCreateVacancy(current.get());
        v.setArchived(req.archived());
        return VacancyDto.of(v, v.getAnalyses().size());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        vacancies.delete(own(id));
        return ResponseEntity.noContent().build();
    }

    private Vacancy own(Long id) {
        return vacancies.findByIdAndOwnerId(id, current.id()).orElseThrow(ApiException::notFound);
    }

    private static void apply(Vacancy v, VacancyRequest req) {
        v.setTitle(req.title().trim());
        v.setDescription(req.description().trim());
        v.setRequirements(req.requirements() == null ? null : req.requirements().trim());
    }
}
