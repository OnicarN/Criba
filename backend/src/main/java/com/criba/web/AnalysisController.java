package com.criba.web;

import com.criba.ai.AiResult;
import com.criba.ai.CvAnalyzer;
import com.criba.config.CurrentUser;
import com.criba.domain.Analysis;
import com.criba.domain.Recommendation;
import com.criba.domain.Vacancy;
import com.criba.repo.AnalysisRepository;
import com.criba.repo.VacancyRepository;
import com.criba.service.TextExtractor;
import com.criba.service.UsageService;
import com.criba.web.Dtos.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class AnalysisController {
    public static final int MAX_FILES = 10;

    private final VacancyRepository vacancies;
    private final AnalysisRepository analyses;
    private final CurrentUser current;
    private final TextExtractor extractor;
    private final CvAnalyzer analyzer;
    private final UsageService usage;
    private final ObjectMapper mapper;
    private final TransactionTemplate tx;

    public AnalysisController(VacancyRepository vacancies, AnalysisRepository analyses, CurrentUser current,
                              TextExtractor extractor, CvAnalyzer analyzer, UsageService usage, ObjectMapper mapper,
                              TransactionTemplate tx) {
        this.vacancies = vacancies;
        this.analyses = analyses;
        this.current = current;
        this.extractor = extractor;
        this.analyzer = analyzer;
        this.usage = usage;
        this.mapper = mapper;
        this.tx = tx;
    }

    /**
     * Sube hasta 10 archivos. Cada archivo se trata por separado (RF-23): si uno falla,
     * el resto sigue y el error se devuelve junto a su nombre. El archivo no se guarda (RD-01).
     */
    @PostMapping("/vacancies/{id}/analyses")
    public List<FileResult> upload(@PathVariable Long id, @RequestParam("files") List<MultipartFile> files) {
        Long uid = current.id();
        Vacancy v = vacancies.findByIdAndOwnerId(id, uid).orElseThrow(ApiException::notFound);
        if (v.isArchived()) {
            throw new ApiException(HttpStatus.CONFLICT, "ARCHIVED", "Esta vacante está archivada y no admite nuevas subidas.",
                    "Reactívala desde Mis vacantes para seguir subiendo CVs.");
        }
        if (files == null || files.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NO_FILES", "No has elegido ningún archivo.", "Arrastra uno o varios CVs.");
        }
        if (files.size() > MAX_FILES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TOO_MANY_FILES", "Puedes subir hasta 10 archivos por tanda.",
                    "Divide los CVs en varias tandas.");
        }
        String title = v.getTitle(), description = v.getDescription(), requirements = v.getRequirements();

        List<FileResult> out = new ArrayList<>();
        for (MultipartFile f : files) {
            String name = f.getOriginalFilename() == null ? "archivo" : f.getOriginalFilename();
            try {
                String text = extractor.extract(f);
                usage.reserveCv(uid);
                AiResult r;
                try {
                    r = analyzer.analyze(title, description, requirements, text);
                } catch (RuntimeException e) {
                    usage.releaseCv(uid);
                    throw e;
                }
                Analysis saved = tx.execute(s -> save(id, name, r));
                out.add(new FileResult(name, true, AnalysisSummary.of(saved), null));
            } catch (ApiException e) {
                out.add(new FileResult(name, false, null, new ErrorBody(e.code(), e.getMessage(), e.hint())));
            } catch (RuntimeException e) {
                out.add(new FileResult(name, false, null, new ErrorBody("INTERNAL",
                        "No se pudo analizar este archivo.", "Reintenta este archivo.")));
            }
        }
        return out;
    }

    private Analysis save(Long vacancyId, String fileName, AiResult r) {
        Analysis a = new Analysis();
        a.setVacancy(vacancies.getReferenceById(vacancyId));
        a.setFileName(fileName.length() > 250 ? fileName.substring(0, 250) : fileName);
        a.setCandidateName(r.candidateName());
        a.setScore(r.score());
        a.setRecommendation(Recommendation.valueOf(r.recommendation()));
        try {
            a.setResultJson(mapper.writeValueAsString(r));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
        a.setModelVersion(analyzer.modelVersion());
        a.setPromptVersion(analyzer.promptVersion());
        return analyses.save(a);
    }

    /** Ranking de la vacante, de mayor a menor encaje (RF-30). */
    @GetMapping("/vacancies/{id}/analyses")
    @Transactional(readOnly = true)
    public List<AnalysisSummary> ranking(@PathVariable Long id) {
        vacancies.findByIdAndOwnerId(id, current.id()).orElseThrow(ApiException::notFound);
        return analyses.findByVacancyIdOrderByScoreDescCreatedAtAsc(id).stream().map(AnalysisSummary::of).toList();
    }

    @GetMapping("/analyses/{id}")
    @Transactional(readOnly = true)
    public AnalysisDetail detail(@PathVariable Long id) {
        return detailOf(own(id));
    }

    /** Estado y notas de la persona de selección (RF-36). */
    @PatchMapping("/analyses/{id}")
    @Transactional
    public AnalysisDetail update(@PathVariable Long id, @Valid @RequestBody UpdateAnalysisRequest req) {
        Analysis a = own(id);
        if (req.status() != null) a.setStatus(req.status());
        if (req.notes() != null) a.setNotes(req.notes());
        return detailOf(a);
    }

    /** Borrado definitivo del análisis de un candidato (RF-32, RL-07). */
    @DeleteMapping("/analyses/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Analysis a = own(id);
        a.getVacancy().getAnalyses().remove(a);
        analyses.delete(a);
        return ResponseEntity.noContent().build();
    }

    private Analysis own(Long id) {
        return analyses.findByIdAndVacancyOwnerId(id, current.id()).orElseThrow(ApiException::notFound);
    }

    private AnalysisDetail detailOf(Analysis a) {
        try {
            return new AnalysisDetail(a.getId(), a.getVacancy().getId(), a.getFileName(), a.getCandidateName(),
                    a.getScore(), a.getRecommendation().name(), a.getStatus().name(), a.getNotes(),
                    mapper.readTree(a.getResultJson()), a.getModelVersion(), a.getPromptVersion(), a.getCreatedAt());
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}
