package com.baicaiblogs.service;

import com.baicaiblogs.repository.RegistrationAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;

@Service
@RequiredArgsConstructor
public class RegistrationGuardService {

    private static final int PER_IP_HOURLY = 3;
    private static final int PER_IP_DAILY = 5;
    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

    private final RegistrationAuditRepository auditRepository;
    private final Semaphore global = new Semaphore(10);
    private final Set<String> activeIps = ConcurrentHashMap.newKeySet();

    public void assertAllowed(String ipHash) {
        LocalDateTime now = LocalDateTime.now();
        if (auditRepository.countByIpHashAndCreatedAtAfter(ipHash, now.minusHours(1)) >= PER_IP_HOURLY) {
            throw new RuntimeException("该网络注册过于频繁，请稍后再试");
        }
        LocalDateTime startOfDay = LocalDate.now(ZONE).atStartOfDay();
        if (auditRepository.countByIpHashAndCreatedAtAfter(ipHash, startOfDay) >= PER_IP_DAILY) {
            throw new RuntimeException("该网络今日注册数量已达上限");
        }
    }

    public Permit acquire(String ipHash) {
        if (!activeIps.add(ipHash)) {
            throw new RuntimeException("该网络已有注册请求正在处理，请稍后再试");
        }
        if (!global.tryAcquire()) {
            activeIps.remove(ipHash);
            throw new RuntimeException("注册请求繁忙，请稍后再试");
        }
        return new Permit(ipHash);
    }

    public final class Permit implements AutoCloseable {
        private final String ipHash;
        private boolean closed;

        private Permit(String ipHash) {
            this.ipHash = ipHash;
        }

        @Override
        public synchronized void close() {
            if (closed) return;
            closed = true;
            activeIps.remove(ipHash);
            global.release();
        }
    }
}
