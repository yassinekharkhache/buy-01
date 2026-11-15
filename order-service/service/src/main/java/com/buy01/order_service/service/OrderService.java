package com.buy01.order_service.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import com.buy01.order_service.dto.ChangeSellerOrderStatusDto;
import com.buy01.order_service.dto.MakeOrderDto;
import com.buy01.order_service.dto.OrderInfo;
import com.buy01.order_service.dto.SellerProduct;
import com.buy01.order_service.model.Order;
import com.buy01.order_service.model.OrderStatus;
import com.buy01.order_service.model.ProductItem;
import com.buy01.order_service.model.SellerOrder;
import com.buy01.order_service.repository.OrderRepository;
import com.buy01.order_service.repository.SellerOrderRepository;

import lombok.AllArgsConstructor;

@Service 
@AllArgsConstructor 
public class OrderService {

    private final OrderRepository orderRepository;
    private final SellerOrderRepository sellerOrderRepository;
    private final RestClient restClient;

    @Transactional
    public void createOrder(MakeOrderDto orderRequest, String userId, String token) {
        Order order = new Order();
        OrderInfo orderInfo = getProductsInfo(orderRequest.productItems(), token);
        long now = System.currentTimeMillis();
        order.setUserId(userId);
        order.setTotalPrice(orderInfo.total());
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        order = orderRepository.save(order);
        for (SellerProduct sellerProduct : orderInfo.sellerProducts()) {
            SellerOrder sellerOrder = new SellerOrder();
            sellerOrder.setCreatedAt(now);
            sellerOrder.setOrderId(order.getId());
            sellerOrder.setProductItems(sellerProduct.productItems());
            sellerOrder.setSellerId(sellerProduct.sellerId());
            sellerOrder.setStatus(OrderStatus.CREATED);
            sellerOrder.setTotalPrice(sellerProduct.totalPrice());
            sellerOrder.setUpdatedAt(now);
            // save
            sellerOrderRepository.save(sellerOrder);
        }
    }

    private OrderInfo getProductsInfo(ProductItem[] productItems, String token) {
        return restClient.post()
                .uri("/api/products/order-info")
                .header("Authorization", "Bearer " + token)
                .body(productItems)
                .retrieve()
                .body(OrderInfo.class);
    }

    public void changeOrderStatus(ChangeSellerOrderStatusDto orderRequest, String sellerId) {
        SellerOrder sellerOrder = sellerOrderRepository.findById(orderRequest.orderId())
                .orElseThrow(() -> new RuntimeException("Seller order not found"));
        sellerOrder.setStatus(orderRequest.newStatus());
        sellerOrder.setUpdatedAt(System.currentTimeMillis());
        sellerOrderRepository.save(sellerOrder);
    }

    public List<Order> getUserOrders(Long lastCreatedAt, String lastId,String userId) {
        if (lastCreatedAt != null && lastId != null) {
            return orderRepository.findByUserIdAndCreatedAtLessThanAndIdLessThanOrderByCreatedAtDesc(
                    userId, lastCreatedAt, lastId);
        } else {
            return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
    }

}
