package com.buy01.order_service.model;

public enum OrderStatus {
    PENDING,          // Order created, awaiting customer confirmation.
    CONFIRMED,        // Customer confirmed the order.
    READY_TO_SHIP,    // Package prepared and waiting for carrier pickup.
    SHIPPED,          // Package handed over to the delivery company (ship_it).
    OUT_FOR_DELIVERY, // Courier is delivering the package.
    DELIVERED,        // Customer received the order.

    CALL_CANCELLED,   // Customer didn't answer, phone invalid, or refused confirmation.
    CUSTOMER_REFUSED,  // Customer refused to accept the package.
    CANCELLED // Order cancelled by customer or seller.
}
