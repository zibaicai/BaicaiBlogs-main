package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.AlbumService;
import com.baicaiblogs.service.ChatterService;
import com.baicaiblogs.service.MomentService;
import com.baicaiblogs.service.PostService;
import com.baicaiblogs.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Authenticated feed used by the private blog mode.
 * Every query is scoped to the current user; public content is not included.
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class PrivateBlogController {

    private final PostService postService;
    private final MomentService momentService;
    private final ChatterService chatterService;
    private final ProjectService projectService;
    private final AlbumService albumService;

    @GetMapping("/private-feed")
    public ApiResponse<Map<String, Object>> privateFeed() {
        try {
            Long userId = currentUserId();
            Map<String, Object> feed = new LinkedHashMap<>();
            feed.put("posts", postService.getAllPostsByUser(userId));
            feed.put("moments", momentService.getMyMoments(userId));
            feed.put("chatters", chatterService.getMyChatters(userId));
            feed.put("projects", projectService.getProjectsByUser(userId));
            feed.put("albums", albumService.getAlbumsByUser(userId));
            return ApiResponse.success(feed);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private Long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) {
            return user.getId();
        }
        throw new RuntimeException("用户未登录");
    }
}
