package com.buy01.user_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserDto(

    @Size(min = 3, max = 70, message = "Username must be between 3 and 70 characters")
    @Pattern(regexp = "^[A-Za-z_]+$", message = "Username should contain only letters or underscores")
    String name,

    @Email(message = "Invalid email format")
    String email,

    @Size(min = 6, max = 70, message = "Password must be at least 6 and at most 70 characters long")
    String password,

    @Size(min = 6, max = 70, message = "Current Password must be at least 6 and at most 70 characters long")
    String currentPassword
) {
    
}
