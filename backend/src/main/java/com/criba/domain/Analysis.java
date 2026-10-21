package com.criba.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "analysis")
public class Analysis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vacancy_id")
    private Vacancy vacancy;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false, length = 160)
    private String candidateName;

    private int score;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Recommendation recommendation;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String resultJson;

    /** Versión del modelo y de las instrucciones (RD-04). */
    @Column(length = 80)
    private String modelVersion;
    @Column(length = 20)
    private String promptVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CandidateStatus status = CandidateStatus.SIN_REVISAR;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Vacancy getVacancy() { return vacancy; }
    public void setVacancy(Vacancy vacancy) { this.vacancy = vacancy; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public Recommendation getRecommendation() { return recommendation; }
    public void setRecommendation(Recommendation recommendation) { this.recommendation = recommendation; }
    public String getResultJson() { return resultJson; }
    public void setResultJson(String resultJson) { this.resultJson = resultJson; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public String getPromptVersion() { return promptVersion; }
    public void setPromptVersion(String promptVersion) { this.promptVersion = promptVersion; }
    public CandidateStatus getStatus() { return status; }
    public void setStatus(CandidateStatus status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
}
