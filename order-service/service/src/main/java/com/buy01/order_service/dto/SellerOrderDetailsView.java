package com.buy01.order_service.dto;

import java.util.List;

import com.buy01.order_service.model.OrderStatus;
import com.buy01.order_service.model.ProductItem;

public record SellerOrderDetailsView(
        String id,
        String orderId,
        OrderStatus status,
        double totalPrice,
        List<ProductItem> productItems,
        String sellerNote,
        long createdAt,
        long updatedAt
) {}