package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.dto.CommentRequest;
import com.baicaiblogs.dto.CommentResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.UserRepository;
import com.baicaiblogs.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository;

    @GetMapping("/public/comments")
    public ApiResponse<List<CommentResponse>> getComments(
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Long targetId,
            @RequestParam(required = false) Long postId,
            @RequestParam(required = false) Long momentId,
            Authentication authentication) {
        try {
            String type = targetType;
            Long id = targetId;
            if (type == null && postId != null) {
                type = "POST";
                id = postId;
            } else if (type == null && momentId != null) {
                type = "MOMENT";
                id = momentId;
            }
            return ApiResponse.success(commentService.getComments(type, id, currentUser(authentication)));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/user/comments")
    public ApiResponse<CommentResponse> createComment(@RequestBody CommentRequest request,
                                                       Authentication authentication) {
        try {
            return ApiResponse.success("评论成功", commentService.createComment(request, currentUser(authentication)));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/user/comments/{id}")
    public ApiResponse<Void> deleteComment(@PathVariable Long id, Authentication authentication) {
        try {
            commentService.deleteOwn(id, currentUser(authentication));
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/user/comments/{id}/reaction")
    public ApiResponse<CommentResponse> react(@PathVariable Long id,
                                              @RequestBody Map<String, String> body,
                                              Authentication authentication) {
        try {
            String type = body.getOrDefault("type", "LIKE");
            return ApiResponse.success(commentService.react(id, currentUser(authentication), type));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/user/comments/{id}/reaction")
    public ApiResponse<CommentResponse> removeReaction(@PathVariable Long id, Authentication authentication) {
        try {
            User user = currentUser(authentication);
            CommentResponse current = commentService.react(id, user, "TOGGLE_OFF");
            return ApiResponse.success(current);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/user/comments/{id}/report")
    public ApiResponse<Void> report(@PathVariable Long id,
                                    @RequestBody(required = false) Map<String, String> body,
                                    Authentication authentication) {
        try {
            String reason = body == null ? "其他" : body.getOrDefault("reason", "其他");
            String detail = body == null ? null : body.get("detail");
            commentService.report(id, currentUser(authentication), reason, detail);
            return ApiResponse.success("举报已提交", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/comments/{id}/hide")
    public ApiResponse<Void> hide(@PathVariable Long id, Authentication authentication) {
        try {
            commentService.adminSetStatus(id, currentUser(authentication), "HIDDEN");
            return ApiResponse.success("已隐藏", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/comments/{id}/restore")
    public ApiResponse<Void> restore(@PathVariable Long id, Authentication authentication) {
        try {
            commentService.adminSetStatus(id, currentUser(authentication), "VISIBLE");
            return ApiResponse.success("已恢复", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/admin/comments/{id}")
    public ApiResponse<Void> adminDelete(@PathVariable Long id, Authentication authentication) {
        try {
            commentService.adminDelete(id, currentUser(authentication));
            return ApiResponse.success("已永久删除", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null) return null;
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) return user;
        return userRepository.findByUsername(authentication.getName()).orElse(null);
    }
}
