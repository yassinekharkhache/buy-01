package com.buy01.order_service.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.buy01.order_service.model.SellerOrder;

public interface SellerOrderRepository extends MongoRepository<SellerOrder,String> {

}