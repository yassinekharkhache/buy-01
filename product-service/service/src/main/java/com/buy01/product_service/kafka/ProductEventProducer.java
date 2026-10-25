package com.buy01.product_service.kafka;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.buy01.product_service.dto.ProductCreatedEvent;

@Component
public class ProductEventProducer {

    private final KafkaTemplate<String, ProductCreatedEvent> kafkaTemplate;

    public ProductEventProducer(
            KafkaTemplate<String, ProductCreatedEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishProductCreated(ProductCreatedEvent event) {
        // Use productId as the Kafka key
        kafkaTemplate.send("product-created", event.productId(), event);
    }
}