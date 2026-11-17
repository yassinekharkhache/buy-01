package com.buy01.order_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.buy01.order_service.model.Order;

public interface OrderRepository extends MongoRepository<Order, String>{
    // findByUserIdAndCreatedAtLessThanAndIdLessThanOrderByCreatedAtDesc
    List<Order> findByUserIdAndCreatedAtLessThanAndIdLessThanOrderByCreatedAtDesc(String userId, Long createdAt, String id);
    // findByUserIdOrderByCreatedAtDesc
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);

       // First page
    List<Order> findByUserIdOrderByCreatedAtDescIdDesc(String userId, Pageable pageable);

    // Next pages: (createdAt < X) OR (createdAt == X AND id < Y)
    List<Order> findByUserIdAndCreatedAtLessThanOrUserIdAndCreatedAtEqualsAndIdLessThanOrderByCreatedAtDescIdDesc(
            String userId, Long lastCreatedAt,
            String userId2, Long lastCreatedAt2, String lastId,
            Pageable pageable);

    default List<Order> findUserOrdersPage(String userId, Long lastCreatedAt, String lastId, int fetchSize) {
    Pageable pageable = PageRequest.of(0, fetchSize);
    if (lastCreatedAt == null || lastId == null) {
        return findByUserIdOrderByCreatedAtDescIdDesc(userId, pageable);
    }
    return findByUserIdAndCreatedAtLessThanOrUserIdAndCreatedAtEqualsAndIdLessThanOrderByCreatedAtDescIdDesc(
            userId, lastCreatedAt, userId, lastCreatedAt, lastId, pageable);
    }
}
