package com.criba.ai;

/**
 * Único punto de contacto con el proveedor de IA (RI-06): cambiar de proveedor
 * es implementar esta interfaz.
 */
public interface CvAnalyzer {
    AiResult analyze(String vacancyTitle, String vacancyDescription, String vacancyRequirements, String cvText);

    String modelVersion();

    String promptVersion();
}
