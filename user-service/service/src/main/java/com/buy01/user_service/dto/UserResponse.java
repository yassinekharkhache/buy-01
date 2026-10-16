package com.buy01.user_service.dto;

public record UserResponse (
    String id,
    String name,
    String email,
    String role
)
{
}
