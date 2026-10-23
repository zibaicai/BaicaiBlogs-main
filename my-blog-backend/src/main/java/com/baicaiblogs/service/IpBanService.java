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
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class IpBanService {

    private final IpBanRepository repository;
    private final Set<String> bannedHashes = ConcurrentHashMap.newKeySet();

    @PostConstruct
    public void init() {
        repository.findAll().stream()
                .filter(b -> b.getExpiresAt() == null || b.getExpiresAt().isAfter(LocalDateTime.now()))
                .forEach(b -> bannedHashes.add(b.getIpHash()));
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
        return ip != null && bannedHashes.contains(hash(ip));
    }

    public IpBan ban(String ip, String reason, Long adminId) {
        String h = hash(ip);
        bannedHashes.add(h);
        return repository.save(IpBan.builder().ipHash(h).reason(reason).createdBy(adminId).build());
    }

    public List<IpBan> list() {
        return repository.findAll();
    }

    public void unban(Long id) {
        repository.findById(id).ifPresent(b -> {
            bannedHashes.remove(b.getIpHash());
            repository.delete(b);
        });
    }
}
