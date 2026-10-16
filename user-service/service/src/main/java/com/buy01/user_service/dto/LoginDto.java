package com.buy01.user_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginDto(
    @Size(max = 20, message = "username must not exceed 20 characters")
    String username,
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    @Size(max = 72, message = "Password must not exceed 72 characters")
    String password

) {}