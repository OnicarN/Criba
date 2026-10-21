package com.criba.ai;

import java.util.List;

/** Forma de la respuesta de la IA (anexo A de requisitos). */
public record AiResult(
        String candidateName,
        int score,
        String recommendation,
        String summary,
        List<String> strengths,
        List<String> gaps,
        Structure structure,
        List<String> interviewQuestions) {

    public record Structure(String clarity, List<String> issues) {}
}
