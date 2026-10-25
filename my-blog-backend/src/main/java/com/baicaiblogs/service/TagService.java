package com.baicaiblogs.service;

import com.baicaiblogs.dto.TagRequest;
import com.baicaiblogs.dto.TagResponse;
import com.baicaiblogs.entity.Post;
import com.baicaiblogs.entity.Tag;
import com.baicaiblogs.repository.PostRepository;
import com.baicaiblogs.repository.TagRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<TagResponse> activeTags() {
        return tagRepository.findByStatusOrderByCreatedAtDesc("ACTIVE").stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TagResponse> pendingTags() {
        return tagRepository.findByStatusOrderByCreatedAtDesc("PENDING").stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TagResponse> allTags() {
        return tagRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public TagResponse createActive(TagRequest request) {
        String name = request.getName() == null ? "" : request.getName().trim().replaceFirst("^#", "");
        if (name.isBlank()) throw new RuntimeException("标签名称不能为空");
        if (tagRepository.findByNameIgnoreCase(name).isPresent()) {
            throw new RuntimeException("标签已存在");
        }
        return toResponse(tagRepository.save(Tag.builder()
                .name(name)
                .status("ACTIVE")
                .requestedBy(null)
                .build()));
    }

    @Transactional
    public TagResponse requestTag(Long userId, TagRequest request) {
        String name = request.getName() == null ? "" : request.getName().trim().replaceFirst("^#", "");
        if (name.isBlank()) throw new RuntimeException("标签名称不能为空");
        if (tagRepository.findByNameIgnoreCase(name).isPresent()) {
            throw new RuntimeException("标签已存在或已申请");
        }
        Tag tag = Tag.builder()
                .name(name)
                .status("PENDING")
                .requestedBy(userId)
                .reviewNote(request.getReason())
                .build();
        return toResponse(tagRepository.save(tag));
    }

    @Transactional
    public TagResponse approve(Long reviewerId, Long id) {
        Tag tag = tagRepository.findById(id).orElseThrow(() -> new RuntimeException("标签不存在"));
        if (!"PENDING".equals(tag.getStatus())) throw new RuntimeException("该标签不在待审批状态");
        tag.setStatus("ACTIVE");
        tag.setApprovedBy(reviewerId);
        tagRepository.save(tag);
        notificationService.notifyUser(tag.getRequestedBy(), "TAG_APPROVED", "标签申请已通过",
                "你申请的标签 #" + tag.getName() + " 已进入标签库，现在可以在资源中使用。");
        return toResponse(tag);
    }

    @Transactional
    public TagResponse reject(Long reviewerId, Long id, String note) {
        Tag tag = tagRepository.findById(id).orElseThrow(() -> new RuntimeException("标签不存在"));
        if (!"PENDING".equals(tag.getStatus())) throw new RuntimeException("该标签不在待审批状态");
        tag.setStatus("REJECTED");
        tag.setApprovedBy(reviewerId);
        tag.setReviewNote(note == null || note.isBlank() ? "未通过审核" : note);
        tagRepository.save(tag);
        notificationService.notifyUser(tag.getRequestedBy(), "TAG_REJECTED", "标签申请未通过",
                "你申请的标签 #" + tag.getName() + " 未通过审核。原因：" + tag.getReviewNote());
        return toResponse(tag);
    }

    /** Related tags from resources in the same category (and its descendants via path is handled by client). */
    @Transactional(readOnly = true)
    public List<String> recommend(Long categoryId) {
        List<Post> posts = categoryId == null ? postRepository.findAllPublished() : postRepository.findByCategoryId(categoryId);
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (Post post : posts) {
            for (String tag : deserializeTags(post.getTags())) {
                counts.merge(tag, 1, Integer::sum);
            }
        }
        return counts.entrySet().stream()
                .sorted((a, b) -> b.getValue() - a.getValue())
                .map(Map.Entry::getKey)
                .limit(8)
                .toList();
    }

    private List<String> deserializeTags(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private TagResponse toResponse(Tag tag) {
        return TagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .status(tag.getStatus())
                .requestedBy(tag.getRequestedBy())
                .approvedBy(tag.getApprovedBy())
                .reviewNote(tag.getReviewNote())
                .createdAt(tag.getCreatedAt() == null ? null : tag.getCreatedAt().toString())
                .build();
    }
}
