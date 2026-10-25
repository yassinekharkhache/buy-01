package com.buy01.product_service.dto;

import jakarta.validation.constraints.*;

public record AddProduct(

    @NotBlank(message = "Name is required")
    @Size(min = 3, max = 70, message = "Name must be between 3 and 70 characters")
    String name,

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 500, message = "Description must be between 10 and 500 characters")
    String description,

    @Positive(message = "Price must be positive")
    @NotNull(message = "Price is required")
    @DecimalMax(value = "1000000", message = "Price must not exceed 1000000")
    double price,

    @Min(value = 0, message = "Quantity cannot be negative")
    @Max(value = 1000000, message = "Quantity must not exceed 1000000")
    @NotNull(message = "Quantity is required")
    int quantity

) {}