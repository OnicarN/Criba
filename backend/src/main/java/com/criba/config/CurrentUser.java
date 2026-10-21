package com.criba.config;

import com.criba.domain.AppUser;
import com.criba.repo.AppUserRepository;
import com.criba.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    private final AppUserRepository users;

    public CurrentUser(AppUserRepository users) {
        this.users = users;
    }

    public Long id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long id)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Tu sesión ha caducado.", "Vuelve a iniciar sesión.");
        }
        return id;
    }

    public AppUser get() {
        return users.findById(id()).orElseThrow(() ->
                new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Tu cuenta ya no existe.", "Crea una cuenta nueva."));
    }
}
