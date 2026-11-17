package com.buy01.order_service.dto;

import java.util.List;

import com.buy01.order_service.model.OrderStatus;
import com.buy01.order_service.model.ProductItem;

// SellerOrderView.java
public record SellerOrderView(
        String id,
        String sellerId,
        OrderStatus status,
        double totalPrice,
        List<ProductItem> productItems,
        long updatedAt
    ) {}