package com.buy01.order_service.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document (collection = "orders")
@Data
@Builder 
@NoArgsConstructor 
@AllArgsConstructor 
public class Order {
    @Id
    private String id;

    @Field ("userId")
    private String userId;

    @Field ("productItems")
    private ProductItem[] productItems;

    @Field ("totalPrice")
    private double totalPrice;

    @Field ("status")
    private OrderStatus status;

    @Field ("createdAt")
    private long createdAt;

    @Field ("updatedAt")
    private long updatedAt;
}