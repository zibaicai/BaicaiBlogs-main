package com.baicaiblogs.service;

import com.baicaiblogs.entity.MusicPlaylist;
import com.baicaiblogs.entity.MusicPlaylistReaction;
import com.baicaiblogs.entity.MusicPlaylistTrack;
import com.baicaiblogs.entity.MusicTrack;
import com.baicaiblogs.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MusicLifecycleService {

    private final MusicTrackRepository trackRepository;
    private final MusicPlaylistRepository playlistRepository;
    private final MusicPlaylistTrackRepository playlistTrackRepository;
    private final MusicPlaylistReactionRepository reactionRepository;
    private final CommentService commentService;
    private final CommentRepository commentRepository;
    private final MusicPlaylistImportService importService;

    @Scheduled(cron = "0 0 4 * * *")
    public void refreshCuratedAvailability() {
        for (MusicPlaylist playlist : playlistRepository
                .findByTypeAndStatusAndVisibilityOrderByHeatScoreDescCreatedAtDesc("CURATED", "ACTIVE", "PUBLIC")) {
            if (playlist.getExternalPlaylistId() == null || playlist.getExternalPlaylistId().isBlank()) continue;
            try {
                importService.importPublicPlaylist(playlist.getExternalPlaylistId(), null);
            } catch (Exception e) {
                log.warn("Refresh music playlist {} failed: {}", playlist.getId(), e.getMessage());
            }
        }
    }

    @Scheduled(cron = "0 30 3 * * *")
    @Transactional
    public void runDailyMaintenance() {
        List<MusicTrack> tracks = trackRepository.findAll();
        for (MusicTrack track : tracks) {
            boolean publicRef = isReferencedByPublicPlaylist(track.getId());
            if (!"FREE".equals(track.getAccessStatus())) {
                LocalDateTime purgeAt = track.getCommentPurgeAt() == null
                        ? LocalDateTime.now().plusDays(90) : track.getCommentPurgeAt();
                commentService.ensureTrackCommentsExpireAt(track.getId(), purgeAt);
            } else {
                commentService.restoreTrackComments(track.getId());
            }
            if (publicRef && "UNLISTED".equals(track.getStatus())) {
                track.setStatus("ACTIVE");
                track.setOrphanedAt(null);
                track.setPurgeAfter(null);
                trackRepository.save(track);
                commentService.restoreTrackComments(track.getId());
            } else if (!publicRef && "ACTIVE".equals(track.getStatus())) {
                track.setStatus("UNLISTED");
                track.setOrphanedAt(LocalDateTime.now());
                track.setPurgeAfter(LocalDateTime.now().plusDays(90));
                trackRepository.save(track);
                commentService.expireTrackComments(track.getId());
            }
        }

        commentService.purgeExpiredComments();

        for (MusicTrack track : trackRepository.findByStatus("UNLISTED")) {
            if (track.getPurgeAfter() == null || track.getPurgeAfter().isAfter(LocalDateTime.now())) continue;
            if (playlistTrackRepository.countByTrackId(track.getId()) > 0) continue;
            if (commentRepository.countByTargetTypeAndTargetId("TRACK", track.getId()) > 0) continue;
            trackRepository.delete(track);
            log.info("Purged orphan music track {}", track.getId());
        }

        demoteLowHeatPlaylists();
    }

    @Transactional
    public void demoteLowHeatPlaylists() {
        List<MusicPlaylist> candidates = playlistRepository.findByTypeAndStatusAndVisibilityOrderByHeatScoreDescCreatedAtDesc(
                "CURATED", "ACTIVE", "PUBLIC");
        for (MusicPlaylist playlist : candidates) {
            if (playlist.getCreatedAt() == null || playlist.getCreatedAt().plusDays(14).isAfter(LocalDateTime.now())) continue;
            List<MusicPlaylistReaction> reactions = reactionRepository.findAll().stream()
                    .filter(r -> r.getPlaylistId().equals(playlist.getId()))
                    .filter(r -> !r.getUserId().equals(playlist.getOwnerId()))
                    .toList();
            if (reactions.size() < 20) continue;
            long dislikes = reactions.stream().filter(r -> "DISLIKE".equals(r.getType())).count();
            boolean tooManyDislikes = dislikes * 100L >= reactions.size() * 60L;
            if (tooManyDislikes || (playlist.getHeatScore() != null && playlist.getHeatScore() <= 0)) {
                playlist.setStatus("DEMOTED");
                playlistRepository.save(playlist);
                log.info("Auto-demoted music playlist {} for review", playlist.getId());
            }
        }
    }

    private boolean isReferencedByPublicPlaylist(Long trackId) {
        return playlistTrackRepository.findByTrackId(trackId).stream().anyMatch(ref -> {
            MusicPlaylist playlist = playlistRepository.findById(ref.getPlaylistId()).orElse(null);
            return playlist != null
                    && "CURATED".equals(playlist.getType())
                    && "ACTIVE".equals(playlist.getStatus())
                    && "PUBLIC".equals(playlist.getVisibility());
        });
    }
}
