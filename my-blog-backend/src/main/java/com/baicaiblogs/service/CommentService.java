package com.baicaiblogs.service;

import com.baicaiblogs.dto.CommentRequest;
import com.baicaiblogs.dto.CommentResponse;
import com.baicaiblogs.dto.CommentThreadPage;
import com.baicaiblogs.entity.*;
import com.baicaiblogs.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
    private final ArticleRepository articleRepository;
    private final ProjectRepository projectRepository;
    private final MusicLibraryService musicLibraryService;
    private final MusicPlaylistRepository musicPlaylistRepository;
    private final MusicPlaylistTrackRepository musicPlaylistTrackRepository;
    private final ReportRepository reportRepository;
    private final NotificationService notificationService;

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
    public CommentThreadPage getThreadPage(Long rootId, int page, int size, User viewer) {
        Comment root = get(rootId);
        assertPublicTarget(root.getTargetType(), root.getTargetId());
        int safePage = Math.max(0, page - 1);
        int safeSize = Math.min(50, Math.max(1, size));
        Page<Comment> result = commentRepository.findByRootIdAndStatusOrderByCreatedAtAsc(
                rootId, "VISIBLE", PageRequest.of(safePage, safeSize));
        return CommentThreadPage.builder()
                .items(result.getContent().stream().map(comment -> toResponse(comment, viewer)).toList())
                .page(safePage + 1)
                .size(safeSize)
                .total(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getThread(Long rootId, User viewer) {
        Comment root = get(rootId);
        assertPublicTarget(root.getTargetType(), root.getTargetId());
        List<Comment> comments = new java.util.ArrayList<>();
        comments.add(root);
        comments.addAll(commentRepository.findByRootIdOrderByCreatedAtAsc(rootId));
        return comments.stream()
                .filter(comment -> "VISIBLE".equals(comment.getStatus()))
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
        assertInteractionTarget(type, request.getTargetId());

        Long parentId = request.getParentId();
        Long rootId = null;
        Long replyToUserId = null;
        if (parentId != null) {
            Comment parent = get(parentId);
            if (!type.equals(parent.getTargetType()) || !request.getTargetId().equals(parent.getTargetId())) {
                throw new RuntimeException("回复目标不匹配");
            }
            if (!"VISIBLE".equals(parent.getStatus())) throw new RuntimeException("该评论不可回复");
            rootId = parent.getRootId() == null ? parent.getId() : parent.getRootId();
            replyToUserId = parent.getUserId();
        }

        Comment comment = Comment.builder()
                .targetType(type)
                .targetId(request.getTargetId())
                .parentId(parentId)
                .rootId(rootId)
                .replyToUserId(replyToUserId)
                .userId(author.getId())
                .author(displayName(author))
                .avatar(author.getAvatar())
                .content(content)
                .status("VISIBLE")
                .build();
        Comment saved = commentRepository.save(comment);
        if (parentId != null && replyToUserId != null && !replyToUserId.equals(author.getId())) {
            notificationService.notifyUser(
                    replyToUserId,
                    "COMMENT_REPLY",
                    "有人回复了你的评论",
                    displayName(author) + "：" + (content.length() > 80 ? content.substring(0, 80) + "…" : content),
                    type,
                    request.getTargetId(),
                    "/comments/thread/" + (rootId == null ? saved.getId() : rootId) + "#comment-" + saved.getId(),
                    author.getId(),
                    displayName(author),
                    author.getAvatar()
            );
        }
        notifyMentions(content, author, type, request.getTargetId(), rootId == null ? saved.getId() : rootId, saved.getId());
        return toResponse(saved, author);
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
        assertInteractionTarget(comment.getTargetType(), comment.getTargetId());
        var existing = reactionRepository.findByCommentIdAndUserId(commentId, current.getId());
        if ("TOGGLE_OFF".equalsIgnoreCase(rawType)) {
            existing.ifPresent(reactionRepository::delete);
            return toResponse(comment, current);
        }
        String type = "DISLIKE".equalsIgnoreCase(rawType) ? "DISLIKE" : "LIKE";
        String previousType = existing.map(CommentReaction::getType).orElse(null);
        boolean notifyLike = false;
        if (existing.isPresent()) {
            CommentReaction reaction = existing.get();
            if (type.equals(reaction.getType())) {
                reactionRepository.delete(reaction);
            } else {
                reaction.setType(type);
                reactionRepository.save(reaction);
                notifyLike = "LIKE".equals(type);
            }
        } else {
            reactionRepository.save(CommentReaction.builder()
                    .commentId(commentId)
                    .userId(current.getId())
                    .type(type)
                    .build());
            notifyLike = "LIKE".equals(type);
        }
        if ("LIKE".equals(previousType) && !"LIKE".equals(type) && comment.getUserId() != null) {
            notificationService.remove(comment.getUserId(), "COMMENT_LIKE", commentId, current.getId());
        }
        if (notifyLike && comment.getUserId() != null
                && !notificationService.exists(comment.getUserId(), "COMMENT_LIKE", commentId, current.getId())) {
            notificationService.notifyUser(
                    comment.getUserId(),
                    "COMMENT_LIKE",
                    "有人赞了你的评论",
                    displayName(current) + " 赞了你的评论",
                    comment.getTargetType(),
                    comment.getTargetId(),
                    "/comments/thread/" + (comment.getRootId() == null ? comment.getId() : comment.getRootId()) + "#comment-" + comment.getId(),
                    current.getId(),
                    displayName(current),
                    current.getAvatar()
            );
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
        assertInteractionTarget(comment.getTargetType(), comment.getTargetId());
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
        applyModeration(comment, status, admin.getId(), "ADMIN", status.equals("HIDDEN") ? "管理员隐藏" : null);
        commentRepository.save(comment);
        notifyHidden(comment, status);
    }

    @Transactional
    public void adminDelete(Long commentId, User admin) {
        if (!isSuperAdmin(admin)) throw new RuntimeException("只有超级管理员可以永久删除评论");
        hardDelete(get(commentId));
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> ownerComments(User owner) {
        if (owner == null) throw new RuntimeException("请先登录");
        return commentRepository.findAll().stream()
                .filter(comment -> ownsTarget(comment, owner))
                .map(comment -> toResponse(comment, owner))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> adminList(User admin, String status) {
        assertAdmin(admin);
        return commentRepository.findAll().stream()
                .filter(comment -> status == null || status.isBlank() || status.equalsIgnoreCase(comment.getStatus()))
                .map(comment -> toResponse(comment, admin))
                .collect(Collectors.toList());
    }

    @Transactional
    public void appeal(Long commentId, User author, String reason) {
        if (author == null) throw new RuntimeException("请先登录");
        Comment comment = get(commentId);
        if (!author.getId().equals(comment.getUserId())) throw new RuntimeException("只能申诉自己的评论");
        if (!"HIDDEN".equals(comment.getStatus())) throw new RuntimeException("只有被隐藏的评论可以申诉");
        if ("PENDING".equals(comment.getAppealStatus())) throw new RuntimeException("申诉已提交，请等待处理");
        comment.setAppealReason(reason == null ? "" : reason.trim());
        comment.setAppealedAt(LocalDateTime.now());
        comment.setAppealStatus("PENDING");
        commentRepository.save(comment);
    }

    @Transactional
    public void rejectAppeal(Long commentId, User admin) {
        assertAdmin(admin);
        Comment comment = get(commentId);
        comment.setAppealStatus("REJECTED");
        commentRepository.save(comment);
        if (comment.getUserId() != null) {
            notificationService.notifyUser(
                    comment.getUserId(),
                    "COMMENT_APPEAL_REJECTED",
                    "评论申诉未通过",
                    "你的评论申诉未通过，评论仍保持隐藏。",
                    comment.getTargetType(),
                    comment.getTargetId(),
                    "/comments/thread/" + (comment.getRootId() == null ? comment.getId() : comment.getRootId()) + "#comment-" + comment.getId()
            );
        }
    }

    @Transactional
    public void ownerSetStatus(Long commentId, User owner, String status) {
        if (owner == null) throw new RuntimeException("请先登录");
        if (!"VISIBLE".equals(status) && !"HIDDEN".equals(status)) {
            throw new RuntimeException("不支持的评论状态");
        }
        Comment comment = get(commentId);
        if (!ownsTarget(comment, owner)) throw new RuntimeException("无权管理该评论");
        comment.setStatus(status);
        applyModeration(comment, status, owner.getId(), "OWNER", status.equals("HIDDEN") ? "资源所有者隐藏" : null);
        commentRepository.save(comment);
        notifyHidden(comment, status);
    }

    private void notifyMentions(String content, User author, String targetType, Long targetId, Long rootId, Long commentId) {
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("@([A-Za-z0-9_\\u4e00-\\u9fa5-]{2,32})").matcher(content);
        java.util.Set<Long> notified = new java.util.HashSet<>();
        while (matcher.find()) {
            String username = matcher.group(1);
            userRepository.findByUsername(username).ifPresent(target -> {
                if (target.getId().equals(author.getId()) || !notified.add(target.getId())) return;
                notificationService.notifyUser(
                        target.getId(),
                        "MENTION",
                        "有人在评论中 @ 了你",
                        displayName(author) + " 在评论中 @ 了你",
                        targetType,
                        targetId,
                        "/comments/thread/" + rootId + "#comment-" + commentId,
                        author.getId(),
                        displayName(author),
                        author.getAvatar()
                );
            });
        }
    }

    private void notifyHidden(Comment comment, String status) {
        if (!"HIDDEN".equals(status) || comment.getUserId() == null) return;
        notificationService.notifyUser(
                comment.getUserId(),
                "COMMENT_HIDDEN",
                "评论被隐藏",
                "你在资源下的评论被所有者或管理员隐藏。",
                comment.getTargetType(),
                comment.getTargetId(),
                "/comments/thread/" + (comment.getRootId() == null ? comment.getId() : comment.getRootId()) + "#comment-" + comment.getId()
        );
    }

    private void applyModeration(Comment comment, String status, Long actorId, String source, String reason) {
        if ("HIDDEN".equals(status)) {
            comment.setHiddenBy(actorId);
            comment.setHiddenReason(reason);
            comment.setHiddenAt(LocalDateTime.now());
            comment.setModerationSource(source);
        } else {
            boolean appealAccepted = "PENDING".equals(comment.getAppealStatus());
            if (comment.getHiddenBy() != null && comment.getUserId() != null) {
                notificationService.notifyUser(
                        comment.getUserId(),
                        appealAccepted ? "COMMENT_APPEAL_ACCEPTED" : "COMMENT_RESTORED",
                        appealAccepted ? "评论申诉已通过" : "评论已恢复",
                        appealAccepted ? "你的评论申诉已通过，评论已恢复显示。" : "你被隐藏的评论已恢复显示。",
                        comment.getTargetType(),
                        comment.getTargetId(),
                        "/comments/thread/" + (comment.getRootId() == null ? comment.getId() : comment.getRootId()) + "#comment-" + comment.getId()
                );
            }
            comment.setHiddenBy(null);
            comment.setHiddenReason(null);
            comment.setHiddenAt(null);
            comment.setModerationSource(null);
            if ("PENDING".equals(comment.getAppealStatus())) comment.setAppealStatus("ACCEPTED");
        }
    }

    private boolean ownsTarget(Comment comment, User user) {
        if (user == null || comment.getTargetId() == null) return false;
        Long userId = user.getId();
        return switch (comment.getTargetType()) {
            case "POST" -> postRepository.findById(comment.getTargetId())
                    .map(post -> userId.equals(post.getUserId())).orElse(false);
            case "MOMENT" -> momentRepository.findById(comment.getTargetId())
                    .map(moment -> userId.equals(moment.getUserId())).orElse(false);
            case "ARTICLE" -> articleRepository.findById(comment.getTargetId())
                    .map(article -> userId.equals(article.getUserId())).orElse(false);
            case "ALBUM" -> albumRepository.findById(comment.getTargetId())
                    .map(album -> userId.equals(album.getUserId())).orElse(false);
            case "PROJECT" -> projectRepository.findById(comment.getTargetId())
                    .map(project -> userId.equals(project.getUserId())).orElse(false);
            case "TRACK" -> musicPlaylistTrackRepository.findByTrackId(comment.getTargetId()).stream()
                    .map(ref -> musicPlaylistRepository.findById(ref.getPlaylistId()).orElse(null))
                    .anyMatch(playlist -> playlist != null && userId.equals(playlist.getOwnerId()));
            default -> false;
        };
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
    public void ensureTrackCommentsExpireAt(Long trackId, LocalDateTime expiresAt) {
        List<Comment> comments = commentRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc("TRACK", trackId);
        for (Comment comment : comments) {
            if (comment.getExpiresAt() == null) {
                comment.setExpiresAt(expiresAt);
                commentRepository.save(comment);
            }
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

    private void assertInteractionTarget(String type, Long targetId) {
        if ("TRACK".equals(type) && !musicLibraryService.isPlayableTrack(targetId)) {
            throw new RuntimeException("该歌曲当前不可互动");
        }
    }

    private void assertPublicTarget(String type, Long targetId) {        if (targetId == null) throw new RuntimeException("缺少评论目标");
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
            case "ARTICLE" -> {
                Article article = articleRepository.findById(targetId).orElseThrow(() -> new RuntimeException("文章不存在"));
                if (!"PUBLISHED".equalsIgnoreCase(article.getStatus()) || !"PUBLIC".equalsIgnoreCase(article.getVisibility())) {
                    throw new RuntimeException("文章不可评论");
                }
            }
            case "PROJECT" -> {
                Project project = projectRepository.findById(targetId).orElseThrow(() -> new RuntimeException("项目不存在"));
                if (!"public".equalsIgnoreCase(project.getVisibility())) {
                    throw new RuntimeException("项目不可评论");
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
                .parentId(comment.getParentId())
                .rootId(comment.getRootId())
                .replyToUserId(comment.getReplyToUserId())
                .replyToAuthor(comment.getReplyToUserId() == null ? null
                        : userRepository.findById(comment.getReplyToUserId())
                                .map(this::displayName).orElse(null))
                .userId(comment.getUserId())
                .author(author == null ? comment.getAuthor() : displayName(author))
                .avatar(author == null ? comment.getAvatar() : author.getAvatar())
                .content(comment.getContent())
                .status(comment.getStatus())
                .hiddenBy(comment.getHiddenBy())
                .hiddenReason(comment.getHiddenReason())
                .hiddenAt(comment.getHiddenAt())
                .moderationSource(comment.getModerationSource())
                .appealReason(comment.getAppealReason())
                .appealedAt(comment.getAppealedAt())
                .appealStatus(comment.getAppealStatus())
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
