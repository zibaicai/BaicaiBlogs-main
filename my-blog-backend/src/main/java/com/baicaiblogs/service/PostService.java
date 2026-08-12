package com.baicaiblogs.service;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.Post;
import com.baicaiblogs.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final Parser markdownParser = Parser.builder().build();
    private final HtmlRenderer htmlRenderer = HtmlRenderer.builder().build();

    @Transactional(readOnly = true)
    public List<PostResponse> getAllPosts() {
        return postRepository.findAllPublished().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getPosts(int page, int size) {
        Page<Post> postPage = postRepository.findAllPublished(PageRequest.of(page, size));
        return new PageResponse<>(
                postPage.getContent().stream().map(this::toResponse).collect(Collectors.toList()),
                postPage.getTotalElements(),
                postPage.getTotalPages(),
                postPage.getNumber(),
                postPage.getSize()
        );
    }

    @Transactional(readOnly = true)
    public PostResponse getPostBySlug(String slug) {
        Post post = postRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("文章不存在: " + slug));
        return toResponse(post);
    }

    @Transactional
    public PostResponse createPost(PostRequest request) {
        if (postRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Slug 已存在: " + request.getSlug());
        }

        String htmlContent = renderMarkdown(request.getContent());

        Post post = Post.builder()
                .slug(request.getSlug())
                .title(request.getTitle())
                .description(request.getDescription())
                .content(request.getContent())
                .htmlContent(htmlContent)
                .cover(request.getCover())
                .date(request.getDate() != null ? request.getDate() : java.time.LocalDateTime.now())
                .status(request.getStatus() != null ? request.getStatus() : "PUBLISHED")
                .views(0)
                .build();

        return toResponse(postRepository.save(post));
    }

    @Transactional
    public PostResponse updatePost(String slug, PostRequest request) {
        Post post = postRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("文章不存在: " + slug));

        post.setTitle(request.getTitle());
        post.setDescription(request.getDescription());
        post.setContent(request.getContent());
        post.setHtmlContent(renderMarkdown(request.getContent()));
        post.setCover(request.getCover());
        if (request.getDate() != null) {
            post.setDate(request.getDate());
        }
        if (request.getStatus() != null) {
            post.setStatus(request.getStatus());
        }

        return toResponse(postRepository.save(post));
    }

    @Transactional
    public void deletePost(String slug) {
        if (!postRepository.existsBySlug(slug)) {
            throw new RuntimeException("文章不存在: " + slug);
        }
        postRepository.deleteBySlug(slug);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> searchPosts(String keyword) {
        return postRepository.searchPublished(keyword).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private String renderMarkdown(String markdown) {
        Node document = markdownParser.parse(markdown);
        return htmlRenderer.render(document);
    }

    private PostResponse toResponse(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .slug(post.getSlug())
                .title(post.getTitle())
                .description(post.getDescription())
                .content(post.getContent())
                .htmlContent(post.getHtmlContent())
                .cover(post.getCover())
                .date(post.getDate())
                .status(post.getStatus())
                .views(post.getViews())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
