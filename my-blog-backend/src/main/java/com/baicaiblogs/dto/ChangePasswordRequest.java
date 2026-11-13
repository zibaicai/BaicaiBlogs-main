package com.baicaiblogs.dto;

public record ChangePasswordRequest(String currentPassword, String newPassword) {
}
