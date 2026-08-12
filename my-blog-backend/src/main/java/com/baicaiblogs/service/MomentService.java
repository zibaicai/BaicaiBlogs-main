package com.baicaiblogs.service;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.Moment;
import com.baicaiblogs.repository.MomentRepository;
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
        return momentRepository.findAllByOrderByDateDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MomentResponse createMoment(MomentRequest request) {
        if (momentRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Slug 已存在: " + request.getSlug());
        }

        Moment moment = Moment.builder()
                .slug(request.getSlug())
                .content(request.getContent())
                .htmlContent(renderMarkdown(request.getContent()))
                .date(request.getDate() != null ? request.getDate() : LocalDateTime.now())
                .images(serializeImages(request.getImages()))
                .build();

        return toResponse(momentRepository.save(moment));
    }

    @Transactional
    public MomentResponse updateMoment(String slug, MomentRequest request) {
        Moment moment = momentRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("动态不存在: " + slug));

        moment.setContent(request.getContent());
        moment.setHtmlContent(renderMarkdown(request.getContent()));
        moment.setImages(serializeImages(request.getImages()));
        if (request.getDate() != null) {
            moment.setDate(request.getDate());
        }

        return toResponse(momentRepository.save(moment));
    }

    @Transactional
    public void deleteMoment(String slug) {
        if (!momentRepository.existsBySlug(slug)) {
            throw new RuntimeException("动态不存在: " + slug);
        }
        momentRepository.deleteBySlug(slug);
    }

    private String renderMarkdown(String markdown) {
        Node document = markdownParser.parse(markdown);
        return htmlRenderer.render(document);
    }

    private String serializeImages(List<String> images) {
        if (images == null || images.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(images);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<String> deserializeImages(String imagesJson) {
        if (imagesJson == null || imagesJson.isEmpty()) {
            return List.of();
        }
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
                .createdAt(moment.getCreatedAt())
                .build();
    }
}
