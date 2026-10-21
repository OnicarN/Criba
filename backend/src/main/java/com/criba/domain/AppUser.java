package com.criba.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.YearMonth;

@Entity
@Table(name = "app_users")
public class AppUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 120)
    private String companyName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Plan plan = Plan.GRATIS;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    /** Aceptación del contrato de encargo de tratamiento (RL-01). */
    private Instant dpaAcceptedAt;

    /** Uso mensual (RD-07): mes natural en curso y CVs analizados con éxito en él. */
    @Column(length = 7)
    private String usageMonth;
    private int usageCount;

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public Plan getPlan() { return plan; }
    public void setPlan(Plan plan) { this.plan = plan; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getDpaAcceptedAt() { return dpaAcceptedAt; }
    public void setDpaAcceptedAt(Instant dpaAcceptedAt) { this.dpaAcceptedAt = dpaAcceptedAt; }

    /** CVs usados en el mes natural actual; se reinicia el día 1 (RP-01). */
    public int currentUsage() {
        return YearMonth.now().toString().equals(usageMonth) ? usageCount : 0;
    }

    public void addUsage() {
        String month = YearMonth.now().toString();
        if (!month.equals(usageMonth)) {
            usageMonth = month;
            usageCount = 0;
        }
        usageCount++;
    }

    public void removeUsage() {
        if (YearMonth.now().toString().equals(usageMonth) && usageCount > 0) usageCount--;
    }
}
