package com.criba.web;

import com.criba.config.CurrentUser;
import com.criba.config.JwtService;
import com.criba.domain.AppUser;
import com.criba.repo.AppUserRepository;
import com.criba.repo.VacancyRepository;
import com.criba.service.LoginThrottle;
import com.criba.service.UsageService;
import com.criba.web.Dtos.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final CurrentUser current;
    private final UsageService usage;
    private final LoginThrottle throttle;
    private final VacancyRepository vacancies;

    public AuthController(AppUserRepository users, PasswordEncoder encoder, JwtService jwt, CurrentUser current,
                          UsageService usage, LoginThrottle throttle, VacancyRepository vacancies) {
        this.vacancies = vacancies;
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.current = current;
        this.usage = usage;
        this.throttle = throttle;
    }

    @PostMapping("/auth/register")
    @Transactional
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        if (!req.acceptDpa()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "DPA_REQUIRED",
                    "Para crear la cuenta tienes que aceptar el contrato de encargo de tratamiento.",
                    "Marca la casilla de aceptación.");
        }
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_TAKEN", "Ya existe una cuenta con ese email.",
                    "Inicia sesión o usa otro email.");
        }
        AppUser u = new AppUser();
        u.setEmail(email);
        u.setCompanyName(req.companyName().trim());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setDpaAcceptedAt(Instant.now());
        users.save(u);
        return ResponseEntity.status(HttpStatus.CREATED).body(auth(u));
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        String ip = http.getRemoteAddr();
        if (throttle.isBlocked(ip, email)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "LOCKED",
                    "Demasiados intentos fallidos.", "Espera 10 minutos antes de volver a intentarlo.");
        }
        AppUser u = users.findByEmailIgnoreCase(email).orElse(null);
        if (u == null || !encoder.matches(req.password(), u.getPasswordHash())) {
            throttle.fail(ip, email);
            // No se indica cuál de los dos datos falló (RF-02).
            throw new ApiException(HttpStatus.UNAUTHORIZED, "BAD_CREDENTIALS",
                    "El email o la contraseña no son correctos.", "Revisa los dos datos y vuelve a intentarlo.");
        }
        throttle.success(ip, email);
        return auth(u);
    }

    @GetMapping("/auth/me")
    public Me me() {
        AppUser u = current.get();
        return Me.of(u, usage.usage(u));
    }

    /** Cambio de plan sin cobro: la pasarela de pago está pendiente (RF-43). */
    @PutMapping("/account/plan")
    @Transactional
    public Me changePlan(@Valid @RequestBody ChangePlanRequest req) {
        AppUser u = current.get();
        u.setPlan(req.plan());
        return Me.of(u, usage.usage(u));
    }

    /** Borrado definitivo de la cuenta y de todos sus datos (RD-06). */
    @DeleteMapping("/account")
    @Transactional
    public ResponseEntity<Void> deleteAccount() {
        AppUser u = current.get();
        vacancies.deleteAll(vacancies.findByOwnerIdOrderByCreatedAtDesc(u.getId()));
        users.delete(u);
        return ResponseEntity.noContent().build();
    }

    private AuthResponse auth(AppUser u) {
        return new AuthResponse(jwt.issue(u.getId()), JwtService.TTL.toSeconds(), Me.of(u, usage.usage(u)));
    }
}
