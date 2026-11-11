package com.buy01.order_service.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.buy01.order_service.dto.MakeOrderDto;
import com.buy01.order_service.service.OrderService;

import lombok.AllArgsConstructor;

@RestController 
@RequestMapping ("/api/order")
@AllArgsConstructor 
public class OrderController {

    private final OrderService orderService;

    @PostMapping ("/")
    public void createOrder(@RequestBody MakeOrderDto orderRequest) {
        orderService.createOrder(orderRequest);
    }
    
}
