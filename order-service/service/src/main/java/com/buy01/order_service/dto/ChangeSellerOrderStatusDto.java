package com.buy01.order_service.dto;

import com.buy01.order_service.model.OrderStatus;

public record ChangeSellerOrderStatusDto(
    OrderStatus newStatus,
    String orderId
) {
    
}
