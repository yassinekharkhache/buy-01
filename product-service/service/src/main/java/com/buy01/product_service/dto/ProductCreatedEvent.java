package com.buy01.product_service.dto;

// Data sent to Kafka when a product is created
public record ProductCreatedEvent(
    String productId,
    String userId,
    long createdAt
){}
