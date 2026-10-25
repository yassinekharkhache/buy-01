package com.buy01.user_service.dto;

import com.buy01.user_service.model.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterDto(

    @NotBlank(message = "Name is required")
    @Size(min = 3, max = 70, message = "Name must be between 3 and 70 characters")
    @Pattern(regexp = "^[A-Za-z_]+$", message = "Username should contain only letters or underscores")
    String name,

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 70, message = "Password must be at least 6 and at most 70 characters long")
    String password,

    @NotNull (message = "Role is required")//seller or client
    Role role

) {}