package com.criba.domain;

import java.util.List;

/** Planes de suscripción. Los precios son provisionales (sección 9 de requisitos). */
public enum Plan {
    GRATIS("Gratis", 0, "Probar el análisis", 10, 1, List.of(
            "10 CVs analizados al mes", "1 vacante activa", "Informe de encaje y estructura", "Ranking de candidatos")),
    PRO("Pro", 49, "Equipos de selección pequeños", 300, null, List.of(
            "300 CVs analizados al mes", "Vacantes ilimitadas", "Ranking y comparativa", "Preguntas de entrevista", "Soporte por correo")),
    EMPRESA("Empresa", 199, "Alto volumen de candidaturas", null, null, List.of(
            "CVs ilimitados", "Vacantes ilimitadas", "Ranking y comparativa", "Exportación de informes", "Soporte prioritario"));

    private final String label;
    private final int monthlyPrice;
    private final String audience;
    private final Integer cvLimit;
    private final Integer vacancyLimit;
    private final List<String> features;

    Plan(String label, int monthlyPrice, String audience, Integer cvLimit, Integer vacancyLimit, List<String> features) {
        this.label = label;
        this.monthlyPrice = monthlyPrice;
        this.audience = audience;
        this.cvLimit = cvLimit;
        this.vacancyLimit = vacancyLimit;
        this.features = features;
    }

    public String label() { return label; }
    public int monthlyPrice() { return monthlyPrice; }
    public String audience() { return audience; }
    /** null = ilimitado */
    public Integer cvLimit() { return cvLimit; }
    /** null = ilimitado */
    public Integer vacancyLimit() { return vacancyLimit; }
    public List<String> features() { return features; }
}
