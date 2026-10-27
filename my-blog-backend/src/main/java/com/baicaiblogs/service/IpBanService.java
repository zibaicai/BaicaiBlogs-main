package com.baicaiblogs.service;

import com.baicaiblogs.entity.IpBan;
import com.baicaiblogs.repository.IpBanRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class IpBanService {

    private final IpBanRepository repository;
    private final Set<String> bannedHashes = ConcurrentHashMap.newKeySet();
    private final Map<String, LocalDateTime> expiresAt = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        repository.findAll().stream()
                .filter(b -> b.getExpiresAt() == null || b.getExpiresAt().isAfter(LocalDateTime.now()))
                .forEach(b -> {
                    bannedHashes.add(b.getIpHash());
                    if (b.getExpiresAt() != null) expiresAt.put(b.getIpHash(), b.getExpiresAt());
                });
    }

    public static String hash(String ip) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(md.digest(ip.getBytes(StandardCharsets.UTF_8))).substring(0, 32);
        } catch (Exception e) {
            return "unknown";
        }
    }

    public boolean isBanned(String ip) {
        if (ip == null) return false;
        String h = hash(ip);
        if (!bannedHashes.contains(h)) return false;
        LocalDateTime expiry = expiresAt.get(h);
        if (expiry != null && !expiry.isAfter(LocalDateTime.now())) {
            bannedHashes.remove(h);
            expiresAt.remove(h);
            repository.findByIpHash(h).ifPresent(repository::delete);
            return false;
        }
        return true;
    }

    public IpBan ban(String ip, String reason, Long adminId) {
        String h = hash(ip);
        bannedHashes.add(h);
        expiresAt.remove(h);
        IpBan entity = repository.findByIpHash(h).orElseGet(() -> IpBan.builder().ipHash(h).build());
        entity.setReason(reason);
        entity.setCreatedBy(adminId);
        entity.setExpiresAt(null);
        return repository.save(entity);
    }

    public IpBan banTemporary(String ip, String reason, int minutes) {
        String h = hash(ip);
        LocalDateTime expires = LocalDateTime.now().plusMinutes(Math.max(1, minutes));
        bannedHashes.add(h);
        expiresAt.put(h, expires);
        IpBan entity = repository.findByIpHash(h).orElseGet(() -> IpBan.builder().ipHash(h).build());
        entity.setReason(reason);
        entity.setCreatedBy(null);
        entity.setExpiresAt(expires);
        return repository.save(entity);
    }

    public List<IpBan> list() {
        return repository.findAll();
    }

    public void unban(Long id) {
        repository.findById(id).ifPresent(b -> {
            bannedHashes.remove(b.getIpHash());
            expiresAt.remove(b.getIpHash());
            repository.delete(b);
        });
    }
}
