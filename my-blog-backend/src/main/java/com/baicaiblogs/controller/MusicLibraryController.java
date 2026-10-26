package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.dto.MusicDtos;
import com.baicaiblogs.entity.MusicPlaylistApplication;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.UserRepository;
import com.baicaiblogs.service.MusicLibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MusicLibraryController {

    private final MusicLibraryService musicLibraryService;
    private final UserRepository userRepository;

    @GetMapping("/public/music/playlists")
    public ApiResponse<List<MusicDtos.PlaylistDto>> publicPlaylists(Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.getPublicPlaylists(currentUser(authentication)));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/music/playlists/{slug}")
    public ApiResponse<MusicDtos.PlaylistDto> publicPlaylist(@PathVariable String slug,
                                                              Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.getPublicPlaylist(slug, currentUser(authentication)));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/music/tracks/{id}")
    public ApiResponse<MusicDtos.TrackDto> publicTrack(@PathVariable Long id, Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.getPublicTrack(id, currentUser(authentication)));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/user/music/playlists")
    public ApiResponse<List<MusicDtos.PlaylistDto>> myPlaylists(Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.getMyPlaylists(currentUser(authentication)));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/user/music/playlists")
    public ApiResponse<MusicDtos.PlaylistDto> createPersonal(@RequestBody MusicDtos.PlaylistRequest request,
                                                              Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.createPersonal(currentUser(authentication), request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/user/music/playlists/{id}/reaction")
    public ApiResponse<MusicDtos.PlaylistDto> react(@PathVariable Long id,
                                                     @RequestBody MusicDtos.ReactionRequest request,
                                                     Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.react(id, currentUser(authentication), request.getType()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/user/music/playlists/{id}/favorite")
    public ApiResponse<MusicDtos.PlaylistDto> favorite(@PathVariable Long id, Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.toggleFavorite(id, currentUser(authentication)));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/user/music/applications")
    public ApiResponse<MusicPlaylistApplication> apply(@RequestBody MusicDtos.ApplicationRequest request,
                                                        Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.apply(currentUser(authentication), request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/music/playlists")
    public ApiResponse<MusicDtos.PlaylistDto> createCurated(@RequestBody MusicDtos.PlaylistRequest request,
                                                            Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.adminCreateCurated(currentUser(authentication), request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/music/playlists")
    public ApiResponse<List<MusicDtos.PlaylistDto>> adminPlaylists(Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.adminPlaylists(currentUser(authentication)));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/music/tracks")
    public ApiResponse<MusicDtos.TrackDto> upsertTrack(@RequestBody MusicDtos.TrackRequest request,
                                                       Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.adminUpsertTrack(currentUser(authentication), request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/music/applications")
    public ApiResponse<List<MusicPlaylistApplication>> applications(Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.listApplications(currentUser(authentication)));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/music/applications/{id}/review")
    public ApiResponse<MusicPlaylistApplication> review(@PathVariable Long id,
                                                         @RequestParam boolean approve,
                                                         @RequestParam(required = false) String note,
                                                         Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.reviewApplication(
                    id, currentUser(authentication), approve, note));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/music/playlists/{id}/status")
    public ApiResponse<MusicDtos.PlaylistDto> setStatus(@PathVariable Long id,
                                                         @RequestParam String status,
                                                         Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.setPlaylistStatus(
                    id, currentUser(authentication), status));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/admin/music/playlists/{id}/tracks")
    public ApiResponse<MusicDtos.PlaylistDto> setTracks(@PathVariable Long id,
                                                        @RequestBody MusicDtos.PlaylistRequest request,
                                                        Authentication authentication) {
        try {
            return ApiResponse.success(musicLibraryService.adminSetTracks(
                    id, currentUser(authentication), request.getTrackIds()));
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
