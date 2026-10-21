package com.criba.service;

import com.criba.domain.AppUser;
import com.criba.domain.Plan;
import com.criba.repo.AppUserRepository;
import com.criba.repo.VacancyRepository;
import com.criba.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Límites del plan, validados siempre en el servidor (RF-42, RP-01, RP-06).
 * Antes de llamar a la IA se reserva una unidad; si el análisis falla se devuelve,
 * así los CVs que fallan no cuentan contra el límite.
 */
@Service
public class UsageService {
    private static final Object LOCK = new Object();

    private final AppUserRepository users;
    private final VacancyRepository vacancies;
    private final TransactionTemplate tx;

    public UsageService(AppUserRepository users, VacancyRepository vacancies, TransactionTemplate tx) {
        this.users = users;
        this.vacancies = vacancies;
        this.tx = tx;
    }

    public record Usage(int cvUsed, Integer cvLimit, long vacanciesActive, Integer vacancyLimit) {}

    public Usage usage(AppUser u) {
        Plan p = u.getPlan();
        return new Usage(u.currentUsage(), p.cvLimit(), vacancies.countByOwnerIdAndArchivedFalse(u.getId()), p.vacancyLimit());
    }

    public void checkCanCreateVacancy(AppUser u) {
        Integer limit = u.getPlan().vacancyLimit();
        if (limit != null && vacancies.countByOwnerIdAndArchivedFalse(u.getId()) >= limit) {
            throw new ApiException(HttpStatus.FORBIDDEN, "PLAN_VACANCY_LIMIT",
                    "Tu plan " + u.getPlan().label() + " permite " + limit + " vacante activa.",
                    "Archiva una vacante o cambia a un plan superior en Planes.");
        }
    }

    public void reserveCv(Long userId) {
        synchronized (LOCK) {
            tx.executeWithoutResult(s -> {
                AppUser u = users.findById(userId).orElseThrow();
                Integer limit = u.getPlan().cvLimit();
                if (limit != null && u.currentUsage() >= limit) {
                    throw new ApiException(HttpStatus.FORBIDDEN, "PLAN_CV_LIMIT",
                            "Has llegado al límite de " + limit + " CVs de este mes en el plan " + u.getPlan().label() + ".",
                            "El contador se reinicia el día 1. Si lo necesitas antes, cambia de plan en Planes.");
                }
                u.addUsage();
            });
        }
    }

    public void releaseCv(Long userId) {
        synchronized (LOCK) {
            tx.executeWithoutResult(s -> users.findById(userId).ifPresent(AppUser::removeUsage));
        }
    }
}
