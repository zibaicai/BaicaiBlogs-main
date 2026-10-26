package com.baicaiblogs.service;

import com.baicaiblogs.dto.MusicDtos;
import com.baicaiblogs.entity.*;
import com.baicaiblogs.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MusicLibraryService {

    private final MusicPlaylistRepository playlistRepository;
    private final MusicPlaylistTrackRepository playlistTrackRepository;
    private final MusicTrackRepository trackRepository;
    private final MusicPlaylistReactionRepository reactionRepository;
    private final MusicPlaylistFavoriteRepository favoriteRepository;
    private final MusicPlaylistApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<MusicDtos.PlaylistDto> getPublicPlaylists(User viewer) {
        return playlistRepository
                .findByTypeAndStatusAndVisibilityOrderByHeatScoreDescCreatedAtDesc("CURATED", "ACTIVE", "PUBLIC")
                .stream().map(p -> toPlaylistDto(p, viewer, false)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MusicDtos.PlaylistDto getPublicPlaylist(String slug, User viewer) {
        MusicPlaylist playlist = playlistRepository.findBySlug(slug)
                .filter(p -> "CURATED".equals(p.getType())
                        && "ACTIVE".equals(p.getStatus())
                        && "PUBLIC".equals(p.getVisibility()))
                .orElseThrow(() -> new RuntimeException("歌单不存在"));
        return toPlaylistDto(playlist, viewer, true);
    }

    @Transactional(readOnly = true)
    public List<MusicDtos.PlaylistDto> adminPlaylists(User admin) {
        assertAdmin(admin);
        return playlistRepository.findAll().stream()
                .filter(p -> "CURATED".equals(p.getType()))
                .sorted(Comparator.comparing(MusicPlaylist::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(p -> toPlaylistDto(p, admin, true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MusicDtos.PlaylistDto> getMyPlaylists(User user) {        if (user == null) throw new RuntimeException("请先登录");
        return playlistRepository.findByOwnerIdAndTypeOrderByCreatedAtDesc(user.getId(), "PERSONAL")
                .stream().map(p -> toPlaylistDto(p, user, true)).collect(Collectors.toList());
    }

    @Transactional
    public MusicDtos.PlaylistDto createPersonal(User user, MusicDtos.PlaylistRequest request) {
        if (user == null) throw new RuntimeException("请先登录");
        MusicPlaylist playlist = MusicPlaylist.builder()
                .slug(uniqueSlug(request.getTitle()))
                .platform("netease")
                .type("PERSONAL")
                .visibility("PRIVATE")
                .ownerId(user.getId())
                .title(requiredTitle(request))
                .cover(request.getCover())
                .description(request.getDescription())
                .status("ACTIVE")
                .build();
        playlist = playlistRepository.save(playlist);
        replaceTracks(playlist, request.getTrackIds());
        return toPlaylistDto(playlist, user, true);
    }

    @Transactional
    public MusicDtos.PlaylistDto adminCreateCurated(User admin, MusicDtos.PlaylistRequest request) {
        assertAdmin(admin);
        MusicPlaylist playlist = MusicPlaylist.builder()
                .slug(uniqueSlug(request.getTitle()))
                .platform("netease")
                .type("CURATED")
                .visibility("PUBLIC")
                .ownerId(null)
                .title(requiredTitle(request))
                .cover(request.getCover())
                .description(request.getDescription())
                .status("ACTIVE")
                .recommenderName(admin.getNickname() == null ? admin.getUsername() : admin.getNickname())
                .build();
        playlist = playlistRepository.save(playlist);
        replaceTracks(playlist, request.getTrackIds());
        return toPlaylistDto(playlist, admin, true);
    }

    @Transactional
    public MusicDtos.TrackDto adminUpsertTrack(User admin, MusicDtos.TrackRequest request) {
        assertAdmin(admin);
        if (request.getExternalTrackId() == null || request.getExternalTrackId().isBlank()) {
            throw new RuntimeException("缺少平台歌曲 ID");
        }
        MusicTrack track = trackRepository
                .findByPlatformAndExternalTrackId("netease", request.getExternalTrackId())
                .orElseGet(() -> MusicTrack.builder()
                        .platform("netease")
                        .externalTrackId(request.getExternalTrackId())
                        .build());
        track.setTitle(request.getTitle() == null ? request.getExternalTrackId() : request.getTitle());
        track.setArtist(request.getArtist());
        track.setCover(request.getCover());
        track.setDuration(request.getDuration());
        track.setExternalUrl(request.getExternalUrl());
        track.setStatus("ACTIVE");
        track.setOrphanedAt(null);
        track.setPurgeAfter(null);
        track.setLastSeenAt(LocalDateTime.now());
        return toTrackDto(trackRepository.save(track));
    }

    @Transactional
    public MusicDtos.PlaylistDto react(Long playlistId, User user, String type) {
        if (user == null) throw new RuntimeException("请先登录");
        MusicPlaylist playlist = publicCurated(playlistId);
        if (playlist.getOwnerId() != null && playlist.getOwnerId().equals(user.getId())) {
            throw new RuntimeException("不能给自己的歌单点赞或踩");
        }
        String normalized = "DISLIKE".equalsIgnoreCase(type) ? "DISLIKE" : "LIKE";
        var existing = reactionRepository.findByPlaylistIdAndUserId(playlistId, user.getId());
        if (existing.isPresent()) {
            MusicPlaylistReaction reaction = existing.get();
            if (normalized.equals(reaction.getType())) reactionRepository.delete(reaction);
            else {
                reaction.setType(normalized);
                reactionRepository.save(reaction);
            }
        } else {
            reactionRepository.save(MusicPlaylistReaction.builder()
                    .playlistId(playlistId).userId(user.getId()).type(normalized).build());
        }
        recalculateHeat(playlist);
        return toPlaylistDto(playlistRepository.findById(playlistId).orElse(playlist), user, false);
    }

    @Transactional
    public MusicDtos.PlaylistDto toggleFavorite(Long playlistId, User user) {
        if (user == null) throw new RuntimeException("请先登录");
        MusicPlaylist playlist = publicCurated(playlistId);
        var existing = favoriteRepository.findByPlaylistIdAndUserId(playlistId, user.getId());
        if (existing.isPresent()) favoriteRepository.delete(existing.get());
        else favoriteRepository.save(MusicPlaylistFavorite.builder().playlistId(playlistId).userId(user.getId()).build());
        return toPlaylistDto(playlist, user, false);
    }

    @Transactional
    public MusicPlaylistApplication apply(User user, MusicDtos.ApplicationRequest request) {
        if (user == null) throw new RuntimeException("请先登录");
        if (request.getExternalPlaylistId() == null || request.getExternalPlaylistId().isBlank()) {
            throw new RuntimeException("缺少公开歌单 ID");
        }
        if (applicationRepository.existsByApplicantIdAndExternalPlaylistIdAndStatus(
                user.getId(), request.getExternalPlaylistId(), "PENDING")) {
            throw new RuntimeException("该歌单已有待审核申请");
        }
        return applicationRepository.save(MusicPlaylistApplication.builder()
                .applicantId(user.getId())
                .platform(request.getPlatform() == null ? "netease" : request.getPlatform())
                .externalPlaylistId(request.getExternalPlaylistId())
                .title(request.getTitle())
                .cover(request.getCover())
                .description(request.getDescription())
                .note(request.getNote())
                .status("PENDING")
                .build());
    }

    @Transactional(readOnly = true)
    public List<MusicPlaylistApplication> listApplications(User admin) {
        assertAdmin(admin);
        return applicationRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public MusicPlaylistApplication reviewApplication(Long id, User admin, boolean approve, String note) {
        assertAdmin(admin);
        MusicPlaylistApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("申请不存在"));
        if (!"PENDING".equals(application.getStatus())) throw new RuntimeException("申请已处理");
        application.setStatus(approve ? "APPROVED" : "REJECTED");
        application.setReviewedBy(admin.getId());
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewNote(note);
        applicationRepository.save(application);
        if (approve) {
            MusicPlaylist playlist = MusicPlaylist.builder()
                    .slug(uniqueSlug(application.getTitle()))
                    .platform(application.getPlatform())
                    .externalPlaylistId(application.getExternalPlaylistId())
                    .type("CURATED")
                    .visibility("PUBLIC")
                    .title(application.getTitle() == null ? "推荐歌单" : application.getTitle())
                    .cover(application.getCover())
                    .description(application.getDescription())
                    .status("ACTIVE")
                    .recommenderName(userRepository.findById(application.getApplicantId())
                            .map(u -> u.getNickname() == null ? u.getUsername() : u.getNickname())
                            .orElse(null))
                    .build();
            playlistRepository.save(playlist);
        }
        return application;
    }

    @Transactional
    public MusicDtos.PlaylistDto adminSetTracks(Long id, User admin, List<Long> trackIds) {
        assertAdmin(admin);
        MusicPlaylist playlist = playlistRepository.findById(id).orElseThrow(() -> new RuntimeException("歌单不存在"));
        if (!"CURATED".equals(playlist.getType())) throw new RuntimeException("只能编辑公共歌单");
        replaceTracks(playlist, trackIds);
        return toPlaylistDto(playlist, admin, true);
    }

    @Transactional
    public MusicDtos.PlaylistDto setPlaylistStatus(Long id, User admin, String status) {        assertAdmin(admin);
        if (!"ACTIVE".equals(status) && !"DEMOTED".equals(status) && !"HIDDEN".equals(status)) {
            throw new RuntimeException("不支持的歌单状态");
        }
        MusicPlaylist playlist = playlistRepository.findById(id).orElseThrow(() -> new RuntimeException("歌单不存在"));
        playlist.setStatus(status);
        return toPlaylistDto(playlistRepository.save(playlist), admin, true);
    }

    @Transactional(readOnly = true)
    public MusicDtos.TrackDto getPublicTrack(Long id, User viewer) {
        MusicTrack track = trackRepository.findById(id).orElseThrow(() -> new RuntimeException("歌曲不存在"));
        if (!"ACTIVE".equals(track.getStatus()) || !isPublicTrack(id)) {
            throw new RuntimeException("歌曲不存在");
        }
        return toTrackDto(track);
    }

    @Transactional(readOnly = true)
    public boolean isPublicTrack(Long trackId) {
        return playlistTrackRepository.findByTrackId(trackId).stream().anyMatch(ref -> {
            MusicPlaylist p = playlistRepository.findById(ref.getPlaylistId()).orElse(null);
            return p != null && "CURATED".equals(p.getType())
                    && "ACTIVE".equals(p.getStatus())
                    && "PUBLIC".equals(p.getVisibility());
        });
    }

    @Transactional
    public void recalculateHeat(MusicPlaylist playlist) {
        List<MusicPlaylistReaction> reactions = reactionRepository.findAll().stream()
                .filter(r -> r.getPlaylistId().equals(playlist.getId()))
                .filter(r -> !r.getUserId().equals(playlist.getOwnerId()))
                .toList();
        long likes = reactions.stream().filter(r -> "LIKE".equals(r.getType())).count();
        long dislikes = reactions.stream().filter(r -> "DISLIKE".equals(r.getType())).count();
        playlist.setHeatScore((int) (likes - dislikes * 2));
        playlistRepository.save(playlist);
    }

    private MusicPlaylist publicCurated(Long id) {
        return playlistRepository.findById(id)
                .filter(p -> "CURATED".equals(p.getType()) && "ACTIVE".equals(p.getStatus())
                        && "PUBLIC".equals(p.getVisibility()))
                .orElseThrow(() -> new RuntimeException("歌单不存在"));
    }

    private void replaceTracks(MusicPlaylist playlist, List<Long> trackIds) {
        playlistTrackRepository.deleteByPlaylistId(playlist.getId());
        if (trackIds == null) trackIds = List.of();
        int position = 0;
        for (Long trackId : new LinkedHashSet<>(trackIds)) {
            MusicTrack track = trackRepository.findById(trackId).orElseThrow(() -> new RuntimeException("歌曲不存在"));
            if (!"ACTIVE".equals(track.getStatus())) continue;
            playlistTrackRepository.save(MusicPlaylistTrack.builder()
                    .playlistId(playlist.getId()).trackId(trackId).position(position++).build());
        }
        playlist.setTrackCount(position);
        playlistRepository.save(playlist);
    }

    private MusicDtos.PlaylistDto toPlaylistDto(MusicPlaylist playlist, User viewer, boolean includeTracks) {
        List<MusicDtos.TrackDto> tracks = includeTracks
                ? playlistTrackRepository.findByPlaylistIdOrderByPositionAsc(playlist.getId()).stream()
                    .map(ref -> trackRepository.findById(ref.getTrackId()).orElse(null))
                    .filter(Objects::nonNull)
                    .map(this::toTrackDto)
                    .collect(Collectors.toList())
                : null;
        String myReaction = viewer == null ? null : reactionRepository
                .findByPlaylistIdAndUserId(playlist.getId(), viewer.getId())
                .map(MusicPlaylistReaction::getType).orElse(null);
        boolean favorited = viewer != null && favoriteRepository
                .findByPlaylistIdAndUserId(playlist.getId(), viewer.getId()).isPresent();
        return MusicDtos.PlaylistDto.builder()
                .id(playlist.getId())
                .slug(playlist.getSlug())
                .title(playlist.getTitle())
                .cover(playlist.getCover())
                .description(playlist.getDescription())
                .type(playlist.getType())
                .visibility(playlist.getVisibility())
                .status(playlist.getStatus())
                .trackCount(playlist.getTrackCount())
                .heatScore(playlist.getHeatScore())
                .recommenderName(playlist.getRecommenderName())
                .likeCount(reactionRepository.countByPlaylistIdAndType(playlist.getId(), "LIKE"))
                .dislikeCount(reactionRepository.countByPlaylistIdAndType(playlist.getId(), "DISLIKE"))
                .favoriteCount(favoriteRepository.countByPlaylistId(playlist.getId()))
                .myReaction(myReaction)
                .favorited(favorited)
                .tracks(tracks)
                .createdAt(playlist.getCreatedAt())
                .build();
    }

    private MusicDtos.TrackDto toTrackDto(MusicTrack track) {
        return MusicDtos.TrackDto.builder()
                .id(track.getId())
                .platform(track.getPlatform())
                .externalTrackId(track.getExternalTrackId())
                .title(track.getTitle())
                .artist(track.getArtist())
                .cover(track.getCover())
                .duration(track.getDuration())
                .externalUrl(track.getExternalUrl())
                .status(track.getStatus())
                .build();
    }

    private String requiredTitle(MusicDtos.PlaylistRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) throw new RuntimeException("歌单标题不能为空");
        return request.getTitle().trim();
    }

    private String uniqueSlug(String title) {
        String base = Normalizer.normalize(title == null ? "music" : title, Normalizer.Form.NFKD)
                .replaceAll("[^a-zA-Z0-9\\u4e00-\\u9fa5]+", "-")
                .replaceAll("(^-|-$)", "")
                .toLowerCase(Locale.ROOT);
        if (base.isBlank()) base = "music";
        String slug = base;
        int i = 2;
        while (playlistRepository.findBySlug(slug).isPresent()) slug = base + "-" + i++;
        return slug.length() > 120 ? slug.substring(0, 120) : slug;
    }

    private void assertAdmin(User user) {
        if (user == null || (!"ADMIN".equals(user.getRole()) && !"SUPER_ADMIN".equals(user.getRole()))) {
            throw new RuntimeException("需要管理员权限");
        }
    }
}
