package com.baicaiblogs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class MusicDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrackDto {
        private Long id;
        private String platform;
        private String externalTrackId;
        private String title;
        private String artist;
        private String cover;
        private Integer duration;
        private String externalUrl;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlaylistDto {
        private Long id;
        private String slug;
        private String title;
        private String cover;
        private String description;
        private String type;
        private String visibility;
        private String status;
        private Integer trackCount;
        private Integer heatScore;
        private String recommenderName;
        private long likeCount;
        private long dislikeCount;
        private long favoriteCount;
        private String myReaction;
        private boolean favorited;
        private List<TrackDto> tracks;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlaylistRequest {
        private String title;
        private String cover;
        private String description;
        private List<Long> trackIds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrackRequest {
        private String platform;
        private String externalTrackId;
        private String title;
        private String artist;
        private String cover;
        private Integer duration;
        private String externalUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicationRequest {
        private String platform;
        private String externalPlaylistId;
        private String title;
        private String cover;
        private String description;
        private String note;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReactionRequest {
        private String type;
    }
}
