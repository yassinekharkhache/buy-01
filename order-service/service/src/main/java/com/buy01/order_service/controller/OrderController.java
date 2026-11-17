package com.buy01.order_service.controller;

import com.buy01.order_service.dto.ChangeSellerOrderStatusDto;
import com.buy01.order_service.dto.MakeOrderDto;
import com.buy01.order_service.dto.OrderPage;
import com.buy01.order_service.model.OrderStatus;
import com.buy01.order_service.service.OrderService;

import lombok.AllArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;



@RestController 
@RequestMapping ("/api/orders")
@AllArgsConstructor 
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody MakeOrderDto orderRequest, @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("userID");
        //get jwt token
        String token = jwt.getTokenValue();
        orderService.createOrder(orderRequest, userId, token);
        return ResponseEntity.status(201).build();

    }

    // change order status (Sellers Only)
    @PatchMapping ("/status")
    public ResponseEntity<?> changeOrderStatus(@RequestBody ChangeSellerOrderStatusDto orderRequest, @AuthenticationPrincipal Jwt jwt) {
        String sellerId = jwt.getClaimAsString("userID");
        orderService.changeOrderStatus(orderRequest, sellerId);
        return ResponseEntity.noContent().build();
    }

    // get all orders for a user (Users Only)
    // using lastId
    @GetMapping
    public ResponseEntity<OrderPage> getUserOrders(
            @RequestParam(required = false) Long lastCreatedAt,
            @RequestParam(required = false) String lastId,
            @AuthenticationPrincipal Jwt jwt
        ) {
            
        String userId = jwt.getClaimAsString("userID");
        return ResponseEntity.ok(orderService.getUserOrders(lastCreatedAt, lastId, userId));
    }


    // getOrders Seller only
    @GetMapping("/seller")
    public ResponseEntity<?> ss(
        @RequestParam(required = false) Long lastCreatedAt,
        @RequestParam(required = false) String lastId,
        @RequestParam(required = true) OrderStatus orderStatus,
        @AuthenticationPrincipal Jwt jwt
    ){
        String userId = jwt.getClaimAsString("userID");
        return ResponseEntity.ok(orderService.getSellerOrders(lastCreatedAt, lastId, userId,orderStatus));
    }
}
