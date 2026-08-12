package com.baicaiblogs.controller;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.service.AlbumService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AlbumController {

    private final AlbumService albumService;

    @GetMapping("/public/albums")
    public ApiResponse<List<AlbumResponse>> getAllAlbums() {
        try {
            return ApiResponse.success(albumService.getAllAlbums());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/albums")
    public ApiResponse<AlbumResponse> createAlbum(@RequestBody AlbumRequest request) {
        try {
            return ApiResponse.success("创建成功", albumService.createAlbum(request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/admin/albums/{albumId}")
    public ApiResponse<AlbumResponse> updateAlbum(@PathVariable String albumId,
                                                   @RequestBody AlbumRequest request) {
        try {
            return ApiResponse.success("更新成功", albumService.updateAlbum(albumId, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/admin/albums/{albumId}")
    public ApiResponse<Void> deleteAlbum(@PathVariable String albumId) {
        try {
            albumService.deleteAlbum(albumId);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
