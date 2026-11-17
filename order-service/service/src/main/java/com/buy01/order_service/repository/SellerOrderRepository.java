package com.buy01.order_service.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.buy01.order_service.model.OrderStatus;
import com.buy01.order_service.model.SellerOrder;

public interface SellerOrderRepository extends MongoRepository<SellerOrder,String> {
    List<SellerOrder> findByOrderIdIn(Collection<String> orderIds);

    // No status filter
List<SellerOrder> findBySellerIdOrderByCreatedAtDescIdDesc(
        String sellerId, Pageable pageable);

List<SellerOrder> findBySellerIdAndCreatedAtLessThanOrSellerIdAndCreatedAtEqualsAndIdLessThanOrderByCreatedAtDescIdDesc(
        String sellerId, Long createdAt,
        String sellerId2, Long createdAt2, String lastId,
        Pageable pageable);

// With status filter
List<SellerOrder> findBySellerIdAndStatusOrderByCreatedAtDescIdDesc(
        String sellerId, OrderStatus status, Pageable pageable);

List<SellerOrder> findBySellerIdAndStatusAndCreatedAtLessThanOrSellerIdAndStatusAndCreatedAtEqualsAndIdLessThanOrderByCreatedAtDescIdDesc(
        String sellerId, OrderStatus status, Long createdAt,
        String sellerId2, OrderStatus status2, Long createdAt2, String lastId,
        Pageable pageable);

default List<SellerOrder> findSellerOrdersPage(
        String sellerId, OrderStatus status, Long lastCreatedAt, String lastId, int fetchSize) {

    Pageable pageable = PageRequest.of(0, fetchSize);
    boolean firstPage = lastCreatedAt == null || lastId == null;

    if (status == null) {
        return firstPage
                ? findBySellerIdOrderByCreatedAtDescIdDesc(sellerId, pageable)
                : findBySellerIdAndCreatedAtLessThanOrSellerIdAndCreatedAtEqualsAndIdLessThanOrderByCreatedAtDescIdDesc(
                        sellerId, lastCreatedAt, sellerId, lastCreatedAt, lastId, pageable);
    }
    return firstPage
            ? findBySellerIdAndStatusOrderByCreatedAtDescIdDesc(sellerId, status, pageable)
            : findBySellerIdAndStatusAndCreatedAtLessThanOrSellerIdAndStatusAndCreatedAtEqualsAndIdLessThanOrderByCreatedAtDescIdDesc(
                    sellerId, status, lastCreatedAt, sellerId, status, lastCreatedAt, lastId, pageable);
}
}