package com.buy01.order_service.dto;

import java.util.List;

public record SellerOrderPage(
        List<SellerOrderDetailsView> orders,
        boolean hasMore,
        NextCursor nextCursor) {}   // reuses NextCursor from before