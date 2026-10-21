package com.criba.web;

import org.springframework.http.HttpStatus;

/** Error con un mensaje que dice qué ha pasado y una pista de qué hacer (RNF-32). */
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String code;
    private final String hint;

    public ApiException(HttpStatus status, String code, String message, String hint) {
        super(message);
        this.status = status;
        this.code = code;
        this.hint = hint;
    }

    public ApiException(HttpStatus status, String code, String message) {
        this(status, code, message, null);
    }

    public static ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND",
                "No hemos encontrado lo que buscas.", "Vuelve a Mis vacantes y ábrelo desde allí.");
    }

    public HttpStatus status() { return status; }
    public String code() { return code; }
    public String hint() { return hint; }
}
