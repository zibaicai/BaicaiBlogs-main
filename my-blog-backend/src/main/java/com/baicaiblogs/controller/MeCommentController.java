package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.dto.CommentResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/me/comments")
@RequiredArgsConstructor
public class MeCommentController {

    private final CommentService commentService;

    @GetMapping
    public ApiResponse<List<CommentResponse>> mine() {
        try {
            return ApiResponse.success(commentService.ownerComments(currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/hide")
    public ApiResponse<Void> hide(@PathVariable Long id) {
        try {
            commentService.ownerSetStatus(id, currentUser(), "HIDDEN");
            return ApiResponse.success("已隐藏", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/restore")
    public ApiResponse<Void> restore(@PathVariable Long id) {
        try {
            commentService.ownerSetStatus(id, currentUser(), "VISIBLE");
            return ApiResponse.success("已恢复", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("未登录");
    }
}
