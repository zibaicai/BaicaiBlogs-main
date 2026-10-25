package com.baicaiblogs.service;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.Moment;
import com.baicaiblogs.repository.MomentRepository;
import com.baicaiblogs.util.HtmlSanitizer;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MomentService {

    private final MomentRepository momentRepository;
    private final ObjectMapper objectMapper;
    private final Parser markdownParser = Parser.builder().build();
    private final HtmlRenderer htmlRenderer = HtmlRenderer.builder().build();

    @Transactional(readOnly = true)
    public List<MomentResponse> getAllMoments() {
        return momentRepository.findByStatusAndVisibilityOrderByDateDesc("PUBLISHED", "PUBLIC").stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MomentResponse> getMomentsForUser(Long userId) {
        return momentRepository.findByStatusOrderByDateDesc("PUBLISHED").stream()
                .filter((item) -> "PUBLIC".equals(item.getVisibility())
                        || (userId != null && userId.equals(item.getUserId())))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MomentResponse> getMyMoments(Long userId) {
        return momentRepository.findByUserIdOrderByDateDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MomentResponse> getPrivateMomentsForAudit() {
        return momentRepository.findByVisibilityOrderByDateDesc("PRIVATE").stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MomentResponse createMoment(Long userId, MomentRequest request) {
        if (momentRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Slug 已存在: " + request.getSlug());
        }
        Moment moment = Moment.builder()
                .slug(request.getSlug())
                .content(request.getContent())
                .htmlContent(renderMarkdown(request.getContent()))
                .date(request.getDate() != null ? request.getDate() : LocalDateTime.now())
                .images(serializeImages(request.getImages()))
                .userId(userId)
                .status(normalizeStatus(request.getStatus()))
                .visibility(normalizeVisibility(request.getVisibility()))
                .build();
        return toResponse(momentRepository.save(moment));
    }

    @Transactional
    public MomentResponse updateMoment(Long userId, String slug, MomentRequest request) {
        Moment moment = momentRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("动态不存在: " + slug));
        if (moment.getUserId() != null && !moment.getUserId().equals(userId)) {
            throw new RuntimeException("无权操作该动态");
        }
        moment.setContent(request.getContent());
        moment.setHtmlContent(renderMarkdown(request.getContent()));
        moment.setImages(serializeImages(request.getImages()));
        moment.setStatus(normalizeStatus(request.getStatus()));
        moment.setVisibility(normalizeVisibility(request.getVisibility()));
        if (request.getDate() != null) moment.setDate(request.getDate());
        if (moment.getUserId() == null) moment.setUserId(userId);
        return toResponse(momentRepository.save(moment));
    }

    @Transactional
    public void deleteMoment(Long userId, String slug) {
        Moment moment = momentRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("动态不存在: " + slug));
        if (moment.getUserId() != null && !moment.getUserId().equals(userId)) {
            throw new RuntimeException("无权操作该动态");
        }
        momentRepository.delete(moment);
    }

    private String normalizeStatus(String value) {
        return "DRAFT".equalsIgnoreCase(value) ? "DRAFT" : "PUBLISHED";
    }

    private String normalizeVisibility(String value) {
        return "PRIVATE".equalsIgnoreCase(value) ? "PRIVATE" : "PUBLIC";
    }

    private String renderMarkdown(String markdown) {
        if (markdown == null) return "";
        Node document = markdownParser.parse(markdown);
        return HtmlSanitizer.clean(htmlRenderer.render(document));
    }

    private String serializeImages(List<String> images) {
        if (images == null || images.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(images);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<String> deserializeImages(String imagesJson) {
        if (imagesJson == null || imagesJson.isEmpty()) return List.of();
        try {
            return objectMapper.readValue(imagesJson, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private MomentResponse toResponse(Moment moment) {
        return MomentResponse.builder()
                .id(moment.getId())
                .slug(moment.getSlug())
                .content(moment.getContent())
                .htmlContent(moment.getHtmlContent())
                .date(moment.getDate())
                .images(deserializeImages(moment.getImages()))
                .userId(moment.getUserId())
                .status(moment.getStatus())
                .visibility(moment.getVisibility())
                .createdAt(moment.getCreatedAt())
                .build();
    }
}
