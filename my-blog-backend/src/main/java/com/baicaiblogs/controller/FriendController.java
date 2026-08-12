package com.baicaiblogs.controller;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.service.FriendService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @GetMapping("/public/friends")
    public ApiResponse<List<FriendResponse>> getAllFriends() {
        try {
            return ApiResponse.success(friendService.getAllFriends());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/friends")
    public ApiResponse<FriendResponse> createFriend(@RequestBody FriendRequest request) {
        try {
            return ApiResponse.success("创建成功", friendService.createFriend(request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/admin/friends/{friendId}")
    public ApiResponse<FriendResponse> updateFriend(@PathVariable String friendId,
                                                     @RequestBody FriendRequest request) {
        try {
            return ApiResponse.success("更新成功", friendService.updateFriend(friendId, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/admin/friends/{friendId}")
    public ApiResponse<Void> deleteFriend(@PathVariable String friendId) {
        try {
            friendService.deleteFriend(friendId);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
