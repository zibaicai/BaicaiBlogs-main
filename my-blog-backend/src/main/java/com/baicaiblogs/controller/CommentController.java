package com.baicaiblogs.controller;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/public/comments")
    public ApiResponse<List<CommentResponse>> getComments(
            @RequestParam(required = false) Long postId,
            @RequestParam(required = false) Long chatterId) {
        try {
            List<CommentResponse> comments;
            if (postId != null) {
                comments = commentService.getCommentsByPostId(postId);
            } else if (chatterId != null) {
                comments = commentService.getCommentsByChatterId(chatterId);
            } else {
                return ApiResponse.error("需要提供 postId 或 chatterId");
            }
            return ApiResponse.success(comments);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/public/comments")
    public ApiResponse<CommentResponse> createComment(@RequestBody CommentRequest request) {
        try {
            return ApiResponse.success("评论成功", commentService.createComment(request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
