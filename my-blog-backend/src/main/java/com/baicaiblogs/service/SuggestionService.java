package com.baicaiblogs.service;

import com.baicaiblogs.dto.SuggestionDtos;
import com.baicaiblogs.entity.Suggestion;
import com.baicaiblogs.entity.SuggestionImage;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.SuggestionImageRepository;
import com.baicaiblogs.repository.SuggestionRepository;
import com.baicaiblogs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SuggestionService {

    private static final int MAX_IMAGES = 5;
    private static final int MAX_CONTENT = 20000;

    private final SuggestionRepository suggestionRepository;
    private final SuggestionImageRepository imageRepository;
    private final UserRepository userRepository;
    private final ImageSecurityService imageSecurityService;
    private final OssService ossService;

    @Scheduled(cron = "0 20 4 * * *")
    @Transactional
    public void cleanupOrphanImages() {
        for (SuggestionImage image : imageRepository
                .findByStatusAndSuggestionIdIsNullAndCreatedAtBefore("TEMP", LocalDateTime.now().minusHours(24))) {
            try {
                ossService.deleteObject(image.getObjectKey());
            } catch (Exception ignored) {
            }
            imageRepository.delete(image);
        }
    }

    @Transactional
    public SuggestionDtos.ImageDto uploadImage(User user, MultipartFile file) {
        requireUser(user);
        if (file == null || file.isEmpty()) throw new RuntimeException("请选择图片");
        if (file.getSize() > ImageSecurityService.MAX_BYTES) throw new RuntimeException("图片不能超过 10MB");
        if (imageRepository.countByUserIdAndSuggestionIdIsNull(user.getId()) >= MAX_IMAGES) {
            throw new RuntimeException("最多上传 5 张待提交图片");
        }
        ImageSecurityService.SafeImage safe = imageSecurityService.sanitize(readBytes(file));
        String key = "suggestions/" + user.getId() + "/" + UUID.randomUUID().toString().replace("-", "")
                + "." + safe.extension();
        ossService.putPrivateObject(key, safe.bytes(), safe.contentType());
        SuggestionImage image = imageRepository.save(SuggestionImage.builder()
                .userId(user.getId())
                .objectKey(key)
                .contentType(safe.contentType())
                .bytes((long) safe.bytes().length)
                .width(safe.width())
                .height(safe.height())
                .sha256(safe.sha256())
                .status("TEMP")
                .build());
        return toImageDto(image);
    }

    @Transactional
    public SuggestionDtos.SuggestionResponse create(User user, SuggestionDtos.SuggestionRequest request) {
        requireUser(user);
        if (request == null) throw new RuntimeException("建议内容不能为空");
        String title = trim(request.getTitle());
        String content = trim(request.getContent());
        if (title.length() < 3) throw new RuntimeException("标题至少 3 个字符");
        if (title.length() > 160) throw new RuntimeException("标题不能超过 160 个字符");
        if (content.length() < 10) throw new RuntimeException("建议内容至少 10 个字符");
        if (content.length() > MAX_CONTENT) throw new RuntimeException("建议内容不能超过 20000 个字符");
        List<Long> ids = request.getImageIds() == null ? List.of() : request.getImageIds();
        if (new LinkedHashSet<>(ids).size() > MAX_IMAGES) throw new RuntimeException("最多 5 张图片");
        List<SuggestionImage> images = imageRepository.findByIdInAndUserId(ids, user.getId());
        if (images.size() != new LinkedHashSet<>(ids).size()) throw new RuntimeException("图片不存在或无权使用");
        for (SuggestionImage image : images) {
            if (!"TEMP".equals(image.getStatus()) || image.getSuggestionId() != null) {
                throw new RuntimeException("图片已被使用");
            }
        }

        Suggestion suggestion = suggestionRepository.save(Suggestion.builder()
                .userId(user.getId())
                .title(title)
                .category(trim(request.getCategory()))
                .content(content)
                .status("SUBMITTED")
                .build());
        int order = 0;
        for (SuggestionImage image : images) {
            image.setSuggestionId(suggestion.getId());
            image.setStatus("ATTACHED");
            image.setSortOrder(order++);
        }
        imageRepository.saveAll(images);
        return toResponse(suggestion);
    }

    @Transactional(readOnly = true)
    public List<SuggestionDtos.SuggestionResponse> mine(User user) {
        requireUser(user);
        return suggestionRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SuggestionDtos.SuggestionResponse get(User user, Long id) {
        requireUser(user);
        Suggestion suggestion = suggestionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("建议不存在"));
        if (!suggestion.getUserId().equals(user.getId()) && !isSuperAdmin(user)) {
            throw new RuntimeException("无权查看该建议");
        }
        return toResponse(suggestion);
    }

    @Transactional(readOnly = true)
    public List<SuggestionDtos.SuggestionResponse> adminList(User admin, String status) {
        requireSuperAdmin(admin);
        List<Suggestion> list = status == null || status.isBlank()
                ? suggestionRepository.findAllByOrderByCreatedAtDesc()
                : suggestionRepository.findByStatusOrderByCreatedAtDesc(status);
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional
    public SuggestionDtos.SuggestionResponse review(User admin, Long id, SuggestionDtos.ReviewRequest request) {
        requireSuperAdmin(admin);
        Suggestion suggestion = suggestionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("建议不存在"));
        Set<String> allowed = Set.of("IN_REVIEW", "NEEDS_INFO", "ACCEPTED", "REJECTED",
                "PLANNED", "IMPLEMENTED", "REWARD_PENDING", "REWARD_PAID", "CLOSED");
        String status = request == null ? null : trim(request.getStatus());
        if (status == null || !allowed.contains(status)) throw new RuntimeException("不支持的审核状态");
        if (request.getScore() != null && (request.getScore() < 1 || request.getScore() > 5)) {
            throw new RuntimeException("评分必须在 1-5 之间");
        }
        if (request.getRewardAmount() != null) {
            BigDecimal amount = request.getRewardAmount();
            if (amount.compareTo(BigDecimal.ONE) < 0 || amount.compareTo(new BigDecimal("5.00")) > 0) {
                throw new RuntimeException("奖励金额必须在 1-5 元之间");
            }
            suggestion.setRewardAmount(amount);
            suggestion.setRewardStatus("REWARD_PENDING");
        }
        suggestion.setStatus(status);
        suggestion.setScore(request.getScore());
        suggestion.setReviewerId(admin.getId());
        suggestion.setReviewNote(trim(request.getReviewNote()));
        return toResponse(suggestionRepository.save(suggestion));
    }

    @Transactional(readOnly = true)
    public SuggestionImage getImage(User user, Long imageId) {
        requireUser(user);
        SuggestionImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("图片不存在"));
        if (!image.getUserId().equals(user.getId()) && !isSuperAdmin(user)) {
            throw new RuntimeException("无权查看该图片");
        }
        return image;
    }

    @Transactional(readOnly = true)
    public byte[] imageBytes(SuggestionImage image) {
        return ossService.getObjectBytes(image.getObjectKey());
    }

    private SuggestionDtos.SuggestionResponse toResponse(Suggestion suggestion) {
        List<SuggestionDtos.ImageDto> images = imageRepository
                .findBySuggestionIdOrderBySortOrderAscIdAsc(suggestion.getId()).stream()
                .map(this::toImageDto).toList();
        String author = userRepository.findById(suggestion.getUserId())
                .map(u -> u.getNickname() == null ? u.getUsername() : u.getNickname())
                .orElse("用户 #" + suggestion.getUserId());
        return SuggestionDtos.SuggestionResponse.builder()
                .id(suggestion.getId())
                .userId(suggestion.getUserId())
                .author(author)
                .title(suggestion.getTitle())
                .category(suggestion.getCategory())
                .content(suggestion.getContent())
                .status(suggestion.getStatus())
                .score(suggestion.getScore())
                .rewardAmount(suggestion.getRewardAmount())
                .rewardStatus(suggestion.getRewardStatus())
                .reviewNote(suggestion.getReviewNote())
                .images(images)
                .createdAt(suggestion.getCreatedAt())
                .updatedAt(suggestion.getUpdatedAt())
                .build();
    }

    private SuggestionDtos.ImageDto toImageDto(SuggestionImage image) {
        return SuggestionDtos.ImageDto.builder()
                .id(image.getId())
                .width(image.getWidth())
                .height(image.getHeight())
                .bytes(image.getBytes())
                .contentType(image.getContentType())
                .build();
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (Exception e) {
            throw new RuntimeException("图片读取失败");
        }
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private void requireUser(User user) {
        if (user == null) throw new RuntimeException("请先登录");
    }

    private void requireSuperAdmin(User user) {
        requireUser(user);
        if (!"SUPER_ADMIN".equals(user.getRole())) throw new RuntimeException("仅超级管理员可操作");
    }

    private boolean isSuperAdmin(User user) {
        return user != null && "SUPER_ADMIN".equals(user.getRole());
    }
}
