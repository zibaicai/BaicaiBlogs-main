package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/public/rooms")
    public ApiResponse<List<Map<String, Object>>> rooms() {
        try {
            return ApiResponse.success(roomService.listRooms());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/rooms/{username}")
    public ApiResponse<Map<String, Object>> room(@PathVariable String username) {
        try {
            return ApiResponse.success(roomService.getRoom(username));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/user/room")
    public ApiResponse<Map<String, Object>> myRoom() {
        try {
            return ApiResponse.success(roomService.myRoom(currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/user/room")
    public ApiResponse<Map<String, Object>> updateRoom(@RequestBody Map<String, String> body) {
        try {
            return ApiResponse.success("小屋信息已更新", roomService.updateRoom(currentUser(), body));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("用户未登录");
    }
}
