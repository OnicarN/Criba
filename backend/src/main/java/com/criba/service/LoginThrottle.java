package com.criba.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/** Bloqueo temporal tras 5 intentos fallidos en 10 minutos por IP o por cuenta (RNF-05). */
@Component
public class LoginThrottle {
    private static final int MAX_FAILURES = 5;
    private static final Duration WINDOW = Duration.ofMinutes(10);

    private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();

    public boolean isBlocked(String ip, String email) {
        return count("ip:" + ip) >= MAX_FAILURES || count("mail:" + email) >= MAX_FAILURES;
    }

    public void fail(String ip, String email) {
        add("ip:" + ip);
        add("mail:" + email);
    }

    public void success(String ip, String email) {
        failures.remove("ip:" + ip);
        failures.remove("mail:" + email);
    }

    private int count(String key) {
        Deque<Instant> q = failures.get(key);
        if (q == null) return 0;
        synchronized (q) {
            Instant limit = Instant.now().minus(WINDOW);
            while (!q.isEmpty() && q.peekFirst().isBefore(limit)) q.pollFirst();
            return q.size();
        }
    }

    private void add(String key) {
        Deque<Instant> q = failures.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            q.addLast(Instant.now());
        }
    }
}
