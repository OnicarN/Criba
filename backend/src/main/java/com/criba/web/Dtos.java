package com.criba.web;

import com.criba.domain.*;
import com.criba.service.UsageService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;

public final class Dtos {
    private Dtos() {}

    public record RegisterRequest(
            @NotBlank(message = "Escribe el nombre de tu empresa.") @Size(max = 120, message = "El nombre de la empresa es demasiado largo.") String companyName,
            @NotBlank(message = "Escribe tu email.") @Email(message = "El email no tiene un formato válido.") @Size(max = 254) String email,
            @NotBlank(message = "Escribe una contraseña.") @Size(min = 8, max = 128, message = "La contraseña es demasiado corta. Usa 8 caracteres o más.") String password,
            boolean acceptDpa) {}

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}

    public record AuthResponse(String token, long expiresInSeconds, Me user) {}

    public record Me(Long id, String email, String companyName, String plan, String planLabel, Instant createdAt,
                     UsageService.Usage usage) {
        public static Me of(AppUser u, UsageService.Usage usage) {
            return new Me(u.getId(), u.getEmail(), u.getCompanyName(), u.getPlan().name(), u.getPlan().label(),
                    u.getCreatedAt(), usage);
        }
    }

    public record ChangePlanRequest(@NotNull Plan plan) {}

    public record PlanDto(String id, String name, int monthlyPrice, String audience, Integer cvLimit,
                          Integer vacancyLimit, List<String> features, boolean highlighted, boolean provisional) {
        public static PlanDto of(Plan p) {
            return new PlanDto(p.name(), p.label(), p.monthlyPrice(), p.audience(), p.cvLimit(), p.vacancyLimit(),
                    p.features(), p == Plan.PRO, true);
        }
    }

    public record VacancyRequest(
            @NotBlank(message = "Escribe el nombre del puesto.") @Size(max = 160, message = "El nombre del puesto es demasiado largo.") String title,
            @NotBlank(message = "Escribe una descripción del puesto.") @Size(max = 8000, message = "La descripción no puede pasar de 8.000 caracteres.") String description,
            @Size(max = 8000, message = "Los requisitos no pueden pasar de 8.000 caracteres.") String requirements) {}

    public record ArchiveRequest(boolean archived) {}

    public record VacancyDto(Long id, String title, String description, String requirements, Instant createdAt,
                             boolean archived, long analysisCount) {
        public static VacancyDto of(Vacancy v, long count) {
            return new VacancyDto(v.getId(), v.getTitle(), v.getDescription(), v.getRequirements(), v.getCreatedAt(),
                    v.isArchived(), count);
        }
    }

    public record AnalysisSummary(Long id, String fileName, String candidateName, int score, String recommendation,
                                  String status, boolean hasNotes, Instant createdAt) {
        public static AnalysisSummary of(Analysis a) {
            return new AnalysisSummary(a.getId(), a.getFileName(), a.getCandidateName(), a.getScore(),
                    a.getRecommendation().name(), a.getStatus().name(),
                    a.getNotes() != null && !a.getNotes().isBlank(), a.getCreatedAt());
        }
    }

    public record AnalysisDetail(Long id, Long vacancyId, String fileName, String candidateName, int score,
                                 String recommendation, String status, String notes, JsonNode result,
                                 String modelVersion, String promptVersion, Instant createdAt) {}

    public record FileResult(String fileName, boolean ok, AnalysisSummary analysis, ErrorBody error) {}

    public record UpdateAnalysisRequest(CandidateStatus status, @Size(max = 4000, message = "La nota no puede pasar de 4.000 caracteres.") String notes) {}
}
