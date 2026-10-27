package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.dto.SuggestionDtos;
import com.baicaiblogs.entity.SuggestionImage;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.UserRepository;
import com.baicaiblogs.service.SuggestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SuggestionController {

    private final SuggestionService suggestionService;
    private final UserRepository userRepository;

    @PostMapping("/user/suggestions/images")
    public ApiResponse<SuggestionDtos.ImageDto> uploadImage(@RequestParam("file") MultipartFile file,
                                                            Authentication authentication) {
        try {
            return ApiResponse.success(suggestionService.uploadImage(currentUser(authentication), file));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/user/suggestions")
    public ApiResponse<SuggestionDtos.SuggestionResponse> create(@RequestBody SuggestionDtos.SuggestionRequest request,
                                                                  Authentication authentication) {
        try {
            return ApiResponse.success(suggestionService.create(currentUser(authentication), request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/user/suggestions")
    public ApiResponse<List<SuggestionDtos.SuggestionResponse>> mine(Authentication authentication) {
        try {
            return ApiResponse.success(suggestionService.mine(currentUser(authentication)));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/user/suggestions/{id}")
    public ApiResponse<SuggestionDtos.SuggestionResponse> get(@PathVariable Long id, Authentication authentication) {
        try {
            return ApiResponse.success(suggestionService.get(currentUser(authentication), id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/user/suggestions/images/{id}")
    public ResponseEntity<byte[]> image(@PathVariable Long id, Authentication authentication) {
        return imageResponse(currentUser(authentication), id);
    }

    @GetMapping("/admin/suggestions")
    public ApiResponse<List<SuggestionDtos.SuggestionResponse>> adminList(@RequestParam(required = false) String status,
                                                                          Authentication authentication) {
        try {
            return ApiResponse.success(suggestionService.adminList(currentUser(authentication), status));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/suggestions/{id}")
    public ApiResponse<SuggestionDtos.SuggestionResponse> adminGet(@PathVariable Long id, Authentication authentication) {
        try {
            return ApiResponse.success(suggestionService.get(currentUser(authentication), id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/suggestions/images/{id}")
    public ResponseEntity<byte[]> adminImage(@PathVariable Long id, Authentication authentication) {
        return imageResponse(currentUser(authentication), id);
    }

    @PostMapping("/admin/suggestions/{id}/review")
    public ApiResponse<SuggestionDtos.SuggestionResponse> review(@PathVariable Long id,
                                                                  @RequestBody SuggestionDtos.ReviewRequest request,
                                                                  Authentication authentication) {
        try {
            return ApiResponse.success(suggestionService.review(currentUser(authentication), id, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private ResponseEntity<byte[]> imageResponse(User user, Long id) {
        try {
            SuggestionImage image = suggestionService.getImage(user, id);
            byte[] bytes = suggestionService.imageBytes(image);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(image.getContentType()))
                    .contentLength(bytes.length)
                    .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePrivate())
                    .header("X-Content-Type-Options", "nosniff")
                    .header("Content-Disposition", "inline; filename=\"suggestion-image\"")
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null) return null;
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) return user;
        return userRepository.findByUsername(authentication.getName()).orElse(null);
    }
}
