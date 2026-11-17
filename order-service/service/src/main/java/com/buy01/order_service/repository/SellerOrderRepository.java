package com.buy01.order_service.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.buy01.order_service.model.SellerOrder;

public interface SellerOrderRepository extends MongoRepository<SellerOrder,String> {
    List<SellerOrder> findByOrderIdIn(Collection<String> orderIds);
}