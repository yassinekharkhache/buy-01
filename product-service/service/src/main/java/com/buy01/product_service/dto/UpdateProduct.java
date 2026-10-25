package com.buy01.product_service.dto;

import jakarta.validation.constraints.*;


public record UpdateProduct(
    @Size(min = 3, max = 70, message = "Name must be between 3 and 70 characters")
    String name,

    @Size(min = 10, max = 500, message = "Description must be between 10 and 500 characters")
    String description,

    @Positive(message = "Price must be positive")
    @DecimalMax(value = "1000000", message = "Price must not exceed 1000000")
    Double price,

    @Min(value = 0, message = "Quantity cannot be negative")
    @Max(value = 1000000, message = "Quantity must not exceed 1000000")
    Integer quantity

) {}