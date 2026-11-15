package com.buy01.order_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.buy01.order_service.model.Order;

public interface OrderRepository extends MongoRepository<Order, String>{
    // findByUserIdAndCreatedAtLessThanAndIdLessThanOrderByCreatedAtDesc
    List<Order> findByUserIdAndCreatedAtLessThanAndIdLessThanOrderByCreatedAtDesc(String userId, Long createdAt, String id);
    // findByUserIdOrderByCreatedAtDesc
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);
}
