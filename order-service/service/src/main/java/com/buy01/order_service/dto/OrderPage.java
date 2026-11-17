package com.buy01.order_service.dto;

import java.util.List;

public record OrderPage(
        List<OrderView> orders,
        boolean hasMore,
        NextCursor nextCursor
    ) {}