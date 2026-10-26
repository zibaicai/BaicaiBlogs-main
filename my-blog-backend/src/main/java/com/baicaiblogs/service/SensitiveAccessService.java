package com.baicaiblogs.service;

import com.baicaiblogs.entity.SensitiveAccessRequest;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.SensitiveAccessRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SensitiveAccessService {

    private final SensitiveAccessRequestRepository requestRepository;

    @Transactional
    public SensitiveAccessRequest request(User admin, String resourceType, String reason) {
        if (!"ADMIN".equals(admin.getRole())) {
            throw new RuntimeException("只有普通管理员可以申请敏感信息权限");
        }
        if (reason == null || reason.trim().length() < 10) {
            throw new RuntimeException("申请原因至少 10 个字");
        }
        if (requestRepository.existsByAdminIdAndResourceTypeAndStatus(admin.getId(), resourceType, "PENDING")) {
            throw new RuntimeException("已有待审批申请");
        }
        return requestRepository.save(SensitiveAccessRequest.builder()
                .adminId(admin.getId())
                .resourceType(resourceType)
                .reason(reason.trim())
                .status("PENDING")
                .build());
    }

    @Transactional
    public SensitiveAccessRequest approve(User superAdmin, Long id) {
        if (!"SUPER_ADMIN".equals(superAdmin.getRole())) {
            throw new RuntimeException("只有超级管理员可以审批");
        }
        SensitiveAccessRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("申请不存在"));
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("申请已处理");
        }
        request.setStatus("APPROVED");
        request.setReviewedBy(superAdmin.getId());
        request.setReviewedAt(LocalDateTime.now());
        request.setExpiresAt(LocalDateTime.now().plusHours(1));
        return requestRepository.save(request);
    }

    @Transactional
    public SensitiveAccessRequest reject(User superAdmin, Long id) {
        if (!"SUPER_ADMIN".equals(superAdmin.getRole())) {
            throw new RuntimeException("只有超级管理员可以审批");
        }
        SensitiveAccessRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("申请不存在"));
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("申请已处理");
        }
        request.setStatus("REJECTED");
        request.setReviewedBy(superAdmin.getId());
        request.setReviewedAt(LocalDateTime.now());
        return requestRepository.save(request);
    }

    public List<SensitiveAccessRequest> list(User user) {
        return "SUPER_ADMIN".equals(user.getRole())
                ? requestRepository.findAllByOrderByCreatedAtDesc()
                : requestRepository.findByAdminIdOrderByCreatedAtDesc(user.getId());
    }

    public boolean hasActiveGrant(User user, String resourceType) {
        if (user == null) return false;
        if ("SUPER_ADMIN".equals(user.getRole())) return true;
        return requestRepository
                .findFirstByAdminIdAndResourceTypeAndStatusAndExpiresAtAfterOrderByExpiresAtDesc(
                        user.getId(), resourceType, "APPROVED", LocalDateTime.now())
                .isPresent();
    }

    public List<Map<String, Object>> serialize(List<SensitiveAccessRequest> requests) {
        return requests.stream().map(item -> Map.<String, Object>of(
                "id", item.getId(),
                "adminId", item.getAdminId(),
                "resourceType", item.getResourceType(),
                "reason", item.getReason(),
                "status", item.getStatus(),
                "reviewedBy", item.getReviewedBy() == null ? "" : item.getReviewedBy(),
                "expiresAt", item.getExpiresAt() == null ? "" : item.getExpiresAt().toString(),
                "createdAt", item.getCreatedAt() == null ? "" : item.getCreatedAt().toString()
        )).collect(Collectors.toList());
    }
}
