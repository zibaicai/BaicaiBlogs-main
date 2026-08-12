package com.baicaiblogs.service;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.Comment;
import com.baicaiblogs.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByPostId(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByChatterId(Long chatterId) {
        return commentRepository.findByChatterIdOrderByCreatedAtDesc(chatterId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse createComment(CommentRequest request) {
        Comment comment = Comment.builder()
                .postId(request.getPostId())
                .chatterId(request.getChatterId())
                .momentId(request.getMomentId())
                .author(request.getAuthor())
                .email(request.getEmail())
                .content(request.getContent())
                .avatar(request.getAvatar())
                .status("APPROVED")
                .build();

        return toResponse(commentRepository.save(comment));
    }

    private CommentResponse toResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .chatterId(comment.getChatterId())
                .momentId(comment.getMomentId())
                .author(comment.getAuthor())
                .email(comment.getEmail())
                .content(comment.getContent())
                .avatar(comment.getAvatar())
                .status(comment.getStatus())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
