package com.baicaiblogs.service;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Short-lived human verification session shared by the friend page forms.
 * A Turnstile token bootstraps the session; the token itself is never reused.
 */
@Service
@RequiredArgsConstructor
public class HumanVerificationService {

    public static final String COOKIE_NAME = "baicai_human";
    public static final int MAX_ACTIONS = 5;
    public static final Duration TTL = Duration.ofMinutes(15);

    private final TurnstileService turnstileService;
    private final Map<String, Session> sessions = new ConcurrentHashMap<>();

    public record Session(String id, int remaining, Instant expiresAt) {
    }

    public Session verifyAndCreate(String token, String ip) {
        turnstileService.verify(token, ip);
        Session session = new Session(
                UUID.randomUUID().toString().replace("-", ""),
                MAX_ACTIONS,
                Instant.now().plus(TTL)
        );
        sessions.put(session.id(), session);
        cleanup();
        return session;
    }

    public Session find(HttpServletRequest request) {
        String id = cookieValue(request);
        if (id == null || id.isBlank()) return null;
        Session session = sessions.get(id);
        if (session == null) return null;
        if (session.expiresAt().isBefore(Instant.now()) || session.remaining() <= 0) {
            sessions.remove(id);
            return null;
        }
        return session;
    }

    public Session consume(Session session) {
        if (session == null) return null;
        synchronized (session) {
            Session current = sessions.get(session.id());
            if (current == null) return null;
            if (current.expiresAt().isBefore(Instant.now()) || current.remaining() <= 0) {
                sessions.remove(current.id());
                return null;
            }
            Session next = new Session(current.id(), current.remaining() - 1, current.expiresAt());
            if (next.remaining() <= 0) sessions.remove(next.id());
            else sessions.put(next.id(), next);
            return next;
        }
    }

    private String cookieValue(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (COOKIE_NAME.equals(cookie.getName())) return cookie.getValue();
        }
        return null;
    }

    private void cleanup() {
        Instant now = Instant.now();
        sessions.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }
}
