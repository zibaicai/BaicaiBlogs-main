package com.baicaiblogs.dto;

import lombok.Data;

import java.util.List;

public class ImageDtos {

    @Data
    public static class PresignFile {
        private String name;
        private String type;
        private Long size;
    }

    @Data
    public static class PresignResponse {
        private String key;
        private String uploadUrl;
        private String publicUrl;
        private long expiresAt;
    }

    @Data
    public static class ConfirmPhoto {
        private String key;
        private Integer width;
        private Integer height;
        private Long bytes;
        private String mime;
        private String caption;
        private Integer weight;
        private String hash;
    }

    @Data
    public static class ConfirmRequest {
        private List<ConfirmPhoto> photos;
    }

    @Data
    public static class ReorderItem {
        private Long photoId;
        private Integer weight;
    }

    @Data
    public static class ReorderRequest {
        private List<ReorderItem> items;
    }

    @Data
    public static class UnlockRequest {
        private String password;
    }

    @Data
    public static class ReportRequest {
        private String reason;
        private String detail;
    }

    @Data
    public static class AccessRequest {
        private String reason;
    }

    @Data
    public static class AppealRequest {
        private String reason;
    }
}
