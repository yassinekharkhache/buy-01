package com.buy01.user_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserDto(

    @Min(value = 6, message = "Name must be at least 6 characters long")
    @Max (value = 40, message = "Name must not exceed 40 characters")
    @Pattern(regexp = "^[A-Za-z_]+$", message = "Username should contain only letters or underscores")
    String name,

    @Email(message = "Invalid email format")
    String email,

    @Size(min = 6, max = 70, message = "Password must be at least 6 and at most 70 characters long")
    String password
) {
    
}
