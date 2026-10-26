package com.baicaiblogs.service;

import com.baicaiblogs.dto.CommentRequest;
import com.baicaiblogs.dto.CommentResponse;
import com.baicaiblogs.entity.*;
import com.baicaiblogs.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentReactionRepository reactionRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final MomentRepository momentRepository;
    private final AlbumRepository albumRepository;
    private final MusicTrackRepository musicTrackRepository;
    private final MusicLibraryService musicLibraryService;
    private final ReportRepository reportRepository;

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(String targetType, Long targetId, User viewer) {
        String type = normalizeTargetType(targetType);
        assertPublicTarget(type, targetId);
        return commentRepository
                .findByTargetTypeAndTargetIdAndStatusOrderByCreatedAtDesc(type, targetId, "VISIBLE")
                .stream()
                .map(comment -> toResponse(comment, viewer))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countVisible(String targetType, Long targetId) {
        return commentRepository.countByTargetTypeAndTargetIdAndStatus(
                normalizeTargetType(targetType), targetId, "VISIBLE");
    }

    @Transactional
    public CommentResponse createComment(CommentRequest request, User author) {
        if (author == null) throw new RuntimeException("请先登录");
        String type = normalizeTargetType(request.getTargetType());
        if (request.getTargetId() == null) throw new RuntimeException("缺少评论目标");
        String content = request.getContent() == null ? "" : request.getContent().trim();
        if (content.isEmpty()) throw new RuntimeException("评论不能为空");
        if (content.length() > 1000) throw new RuntimeException("评论不能超过 1000 字");
        assertPublicTarget(type, request.getTargetId());

        Comment comment = Comment.builder()
                .targetType(type)
                .targetId(request.getTargetId())
                .userId(author.getId())
                .author(displayName(author))
                .avatar(author.getAvatar())
                .content(content)
                .status("VISIBLE")
                .build();
        return toResponse(commentRepository.save(comment), author);
    }

    @Transactional
    public void deleteOwn(Long commentId, User current) {
        if (current == null) throw new RuntimeException("请先登录");
        Comment comment = get(commentId);
        boolean superAdmin = isSuperAdmin(current);
        if (!superAdmin && !current.getId().equals(comment.getUserId())) {
            throw new RuntimeException("只能删除自己的评论");
        }
        if (superAdmin) {
            hardDelete(comment);
        } else {
            comment.setStatus("DELETED");
            comment.setContent("");
            commentRepository.save(comment);
        }
    }

    @Transactional
    public CommentResponse react(Long commentId, User current, String rawType) {
        if (current == null) throw new RuntimeException("请先登录");
        Comment comment = get(commentId);
        if (!"VISIBLE".equals(comment.getStatus())) throw new RuntimeException("评论不可互动");
        if (current.getId().equals(comment.getUserId())) throw new RuntimeException("不能给自己的评论点赞或踩");
        assertPublicTarget(comment.getTargetType(), comment.getTargetId());
        var existing = reactionRepository.findByCommentIdAndUserId(commentId, current.getId());
        if ("TOGGLE_OFF".equalsIgnoreCase(rawType)) {
            existing.ifPresent(reactionRepository::delete);
            return toResponse(comment, current);
        }
        String type = "DISLIKE".equalsIgnoreCase(rawType) ? "DISLIKE" : "LIKE";
        if (existing.isPresent()) {
            CommentReaction reaction = existing.get();
            if (type.equals(reaction.getType())) {
                reactionRepository.delete(reaction);
            } else {
                reaction.setType(type);
                reactionRepository.save(reaction);
            }
        } else {
            reactionRepository.save(CommentReaction.builder()
                    .commentId(commentId)
                    .userId(current.getId())
                    .type(type)
                    .build());
        }
        return toResponse(comment, current);
    }

    @Transactional
    public void report(Long commentId, User current, String reason, String detail) {
        if (current == null) throw new RuntimeException("请先登录");
        Comment comment = get(commentId);
        if (!"VISIBLE".equals(comment.getStatus())) throw new RuntimeException("评论不可举报");
        if (current.getId().equals(comment.getUserId())) throw new RuntimeException("不能举报自己的评论");
        assertPublicTarget(comment.getTargetType(), comment.getTargetId());
        if (reportRepository.existsByReporterIdAndTargetTypeAndTargetId(current.getId(), "comment", commentId)) {
            throw new RuntimeException("你已举报过这条评论");
        }
        String safeReason = reason == null || reason.isBlank() ? "其他" : reason.trim();
        reportRepository.save(Report.builder()
                .reporterId(current.getId())
                .targetType("comment")
                .targetId(commentId)
                .targetUserId(comment.getUserId())
                .reason(safeReason)
                .detail(detail)
                .status("PENDING")
                .build());
    }

    @Transactional
    public void adminSetStatus(Long commentId, User admin, String status) {
        assertAdmin(admin);
        if (!"VISIBLE".equals(status) && !"HIDDEN".equals(status)) {
            throw new RuntimeException("不支持的评论状态");
        }
        Comment comment = get(commentId);
        comment.setStatus(status);
        commentRepository.save(comment);
    }

    @Transactional
    public void adminDelete(Long commentId, User admin) {
        if (!isSuperAdmin(admin)) throw new RuntimeException("只有超级管理员可以永久删除评论");
        hardDelete(get(commentId));
    }

    @Transactional
    public void expireTrackComments(Long trackId) {
        List<Comment> comments = commentRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc("TRACK", trackId);
        for (Comment comment : comments) {
            comment.setExpiresAt(LocalDateTime.now().plusDays(90));
            commentRepository.save(comment);
        }
    }

    @Transactional
    public void restoreTrackComments(Long trackId) {
        List<Comment> comments = commentRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc("TRACK", trackId);
        for (Comment comment : comments) {
            comment.setExpiresAt(null);
            commentRepository.save(comment);
        }
    }

    @Transactional
    public void purgeExpiredComments() {
        List<Comment> expired = commentRepository.findByTargetTypeAndExpiresAtBefore(
                "TRACK", LocalDateTime.now());
        for (Comment comment : expired) {
            hardDelete(comment);
        }
    }

    private void hardDelete(Comment comment) {
        reactionRepository.deleteByCommentId(comment.getId());
        reportRepository.deleteByTargetTypeAndTargetId("comment", comment.getId());
        commentRepository.delete(comment);
    }

    private Comment get(Long id) {
        return commentRepository.findById(id).orElseThrow(() -> new RuntimeException("评论不存在"));
    }

    private void assertPublicTarget(String type, Long targetId) {
        if (targetId == null) throw new RuntimeException("缺少评论目标");
        switch (type) {
            case "POST" -> {
                Post post = postRepository.findById(targetId).orElseThrow(() -> new RuntimeException("文章不存在"));
                if (!"PUBLISHED".equalsIgnoreCase(post.getStatus()) || !"public".equalsIgnoreCase(post.getVisibility())) {
                    throw new RuntimeException("文章不可评论");
                }
            }
            case "MOMENT" -> {
                Moment moment = momentRepository.findById(targetId).orElseThrow(() -> new RuntimeException("说说不存在"));
                if (!"PUBLISHED".equalsIgnoreCase(moment.getStatus()) || !"PUBLIC".equalsIgnoreCase(moment.getVisibility())) {
                    throw new RuntimeException("说说不可评论");
                }
            }
            case "ALBUM" -> {
                Album album = albumRepository.findById(targetId).orElseThrow(() -> new RuntimeException("相册不存在"));
                if (!"VISIBLE".equalsIgnoreCase(album.getStatus()) || !"PUBLIC".equalsIgnoreCase(album.getVisibility())) {
                    throw new RuntimeException("相册不可评论");
                }
            }
            case "TRACK" -> {
                MusicTrack track = musicTrackRepository.findById(targetId).orElseThrow(() -> new RuntimeException("歌曲不存在"));
                if (!"ACTIVE".equalsIgnoreCase(track.getStatus()) || !musicLibraryService.isPublicTrack(targetId)) {
                    throw new RuntimeException("歌曲不可评论");
                }
            }
            default -> throw new RuntimeException("不支持的评论目标");
        }
    }

    private String normalizeTargetType(String raw) {
        if (raw == null) throw new RuntimeException("缺少评论类型");
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private String displayName(User user) {
        return user.getNickname() == null || user.getNickname().isBlank()
                ? user.getUsername()
                : user.getNickname();
    }

    private CommentResponse toResponse(Comment comment, User viewer) {
        User author = comment.getUserId() == null ? null : userRepository.findById(comment.getUserId()).orElse(null);
        String myReaction = null;
        if (viewer != null) {
            myReaction = reactionRepository.findByCommentIdAndUserId(comment.getId(), viewer.getId())
                    .map(CommentReaction::getType).orElse(null);
        }
        boolean own = viewer != null && viewer.getId().equals(comment.getUserId());
        return CommentResponse.builder()
                .id(comment.getId())
                .targetType(comment.getTargetType())
                .targetId(comment.getTargetId())
                .userId(comment.getUserId())
                .author(author == null ? comment.getAuthor() : displayName(author))
                .avatar(author == null ? comment.getAvatar() : author.getAvatar())
                .content(comment.getContent())
                .status(comment.getStatus())
                .createdAt(comment.getCreatedAt())
                .likeCount(reactionRepository.countByCommentIdAndType(comment.getId(), "LIKE"))
                .dislikeCount(reactionRepository.countByCommentIdAndType(comment.getId(), "DISLIKE"))
                .myReaction(myReaction)
                .canDelete(own || isSuperAdmin(viewer))
                .canReport(viewer != null && !own)
                .build();
    }

    private boolean isSuperAdmin(User user) {
        return user != null && "SUPER_ADMIN".equals(user.getRole());
    }

    private void assertAdmin(User user) {
        if (user == null || (!"ADMIN".equals(user.getRole()) && !"SUPER_ADMIN".equals(user.getRole()))) {
            throw new RuntimeException("需要管理员权限");
        }
    }
}
