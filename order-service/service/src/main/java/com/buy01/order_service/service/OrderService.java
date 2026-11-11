package com.buy01.order_service.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.buy01.order_service.dto.MakeOrderDto;
import com.buy01.order_service.model.Order;
import com.buy01.order_service.model.OrderStatus;
import com.buy01.order_service.model.ProductItem;
import com.buy01.order_service.repository.OrderRepository;

import lombok.AllArgsConstructor;

@Service 
@AllArgsConstructor 
public class OrderService {

    private final OrderRepository orderRepository;
    private final RestClient restClient;

    public void createOrder(MakeOrderDto orderRequest) {
        Order order = new Order();
        order.setUserId(orderRequest.userId());
        order.setProductItems(orderRequest.productItems());
        order.setTotalPrice(calculateTotalPrice(orderRequest.productItems()));
        order.setStatus(OrderStatus.CREATED);
        order.setCreatedAt(System.currentTimeMillis());
        order.setUpdatedAt(System.currentTimeMillis());
        orderRepository.save(order);
    }

    private double calculateTotalPrice(ProductItem[] productItems) {
        return restClient.post()
                .uri("/api/products/total")
                .body(productItems)
                .retrieve()
                .body(Double.class);
    }
}
