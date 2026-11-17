package com.buy01.order_service.dto;

import java.util.List;

public record OrderView(
        String id,
        double totalPrice,
        long createdAt,
        long updatedAt,
        List<SellerOrderView> sellerOrders) {}