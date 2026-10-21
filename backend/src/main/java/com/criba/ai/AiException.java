package com.criba.ai;

import com.criba.web.ApiException;
import org.springframework.http.HttpStatus;

public class AiException extends ApiException {
    public AiException(HttpStatus status, String code, String message, String hint) {
        super(status, code, message, hint);
    }
}
