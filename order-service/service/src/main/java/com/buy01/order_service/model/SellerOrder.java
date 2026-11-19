package com.buy01.order_service.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "seller_orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerOrder {

    @Id
    private String id;

    private String orderId;

    private String sellerId;

    private ProductItem[] productItems;

    private double totalPrice;

    private OrderStatus status;

    private String sellerNote;

    private long createdAt;

    private long updatedAt;
}