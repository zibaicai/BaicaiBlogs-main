package com.baicaiblogs.service;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.Chatter;
import com.baicaiblogs.repository.ChatterRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatterService {

    private final ChatterRepository chatterRepository;
    private final ObjectMapper objectMapper;
    private final Parser markdownParser = Parser.builder().build();
    private final HtmlRenderer htmlRenderer = HtmlRenderer.builder().build();

    @Transactional(readOnly = true)
    public List<ChatterResponse> getAllChatters() {
        return chatterRepository.findAllByOrderByDateDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<ChatterResponse> getChatters(int page, int size) {
        Page<Chatter> chatterPage = chatterRepository.findAllByOrderByDateDesc(PageRequest.of(page, size));
        return new PageResponse<>(
                chatterPage.getContent().stream().map(this::toResponse).collect(Collectors.toList()),
                chatterPage.getTotalElements(),
                chatterPage.getTotalPages(),
                chatterPage.getNumber(),
                chatterPage.getSize()
        );
    }

    @Transactional(readOnly = true)
    public ChatterResponse getChatterBySlug(String slug) {
        Chatter chatter = chatterRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("杂谈不存在: " + slug));
        return toResponse(chatter);
    }

    @Transactional
    public ChatterResponse createChatter(ChatterRequest request) {
        if (chatterRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Slug 已存在: " + request.getSlug());
        }

        String htmlContent = renderMarkdown(request.getContent());
        String tagsJson = serializeTags(request.getTags());

        Chatter chatter = Chatter.builder()
                .slug(request.getSlug())
                .title(request.getTitle())
                .content(request.getContent())
                .htmlContent(htmlContent)
                .mood(request.getMood())
                .cover(request.getCover())
                .date(request.getDate() != null ? request.getDate() : LocalDateTime.now())
                .tags(tagsJson)
                .build();

        return toResponse(chatterRepository.save(chatter));
    }

    @Transactional
    public ChatterResponse updateChatter(String slug, ChatterRequest request) {
        Chatter chatter = chatterRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("杂谈不存在: " + slug));

        chatter.setTitle(request.getTitle());
        chatter.setContent(request.getContent());
        chatter.setHtmlContent(renderMarkdown(request.getContent()));
        chatter.setMood(request.getMood());
        chatter.setCover(request.getCover());
        chatter.setTags(serializeTags(request.getTags()));
        if (request.getDate() != null) {
            chatter.setDate(request.getDate());
        }

        return toResponse(chatterRepository.save(chatter));
    }

    @Transactional
    public void deleteChatter(String slug) {
        if (!chatterRepository.existsBySlug(slug)) {
            throw new RuntimeException("杂谈不存在: " + slug);
        }
        chatterRepository.deleteBySlug(slug);
    }

    private String renderMarkdown(String markdown) {
        Node document = markdownParser.parse(markdown);
        return htmlRenderer.render(document);
    }

    private String serializeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(tags);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<String> deserializeTags(String tagsJson) {
        if (tagsJson == null || tagsJson.isEmpty()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(tagsJson, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private ChatterResponse toResponse(Chatter chatter) {
        return ChatterResponse.builder()
                .id(chatter.getId())
                .slug(chatter.getSlug())
                .title(chatter.getTitle())
                .content(chatter.getContent())
                .htmlContent(chatter.getHtmlContent())
                .mood(chatter.getMood())
                .cover(chatter.getCover())
                .date(chatter.getDate())
                .tags(deserializeTags(chatter.getTags()))
                .createdAt(chatter.getCreatedAt())
                .updatedAt(chatter.getUpdatedAt())
                .build();
    }
}
