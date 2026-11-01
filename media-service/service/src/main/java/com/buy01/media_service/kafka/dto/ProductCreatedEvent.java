package com.buy01.media_service.kafka.dto;

public record ProductCreatedEvent(String productId, String userId, String uploadSessionId) {
    
}
