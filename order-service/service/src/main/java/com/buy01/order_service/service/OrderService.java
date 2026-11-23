package com.buy01.order_service.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import com.buy01.order_service.dto.AddOrderNoteDto;
import com.buy01.order_service.dto.ChangeSellerOrderStatusDto;
import com.buy01.order_service.dto.MakeOrderDto;
import com.buy01.order_service.dto.NextCursor;
import com.buy01.order_service.dto.OrderInfo;
import com.buy01.order_service.dto.OrderPage;
import com.buy01.order_service.dto.OrderView;
import com.buy01.order_service.dto.SellerOrderDetailsView;
import com.buy01.order_service.dto.SellerOrderPage;
import com.buy01.order_service.dto.SellerOrderView;
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
            sellerOrder.setStatus(OrderStatus.PENDING);
            sellerOrder.setTotalPrice(sellerProduct.totalPrice());
            sellerOrder.setUpdatedAt(now);
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
        if(!sellerOrder.getSellerId().equals(sellerId)){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your order");
        }
        sellerOrder.setStatus(orderRequest.newStatus());
        sellerOrder.setUpdatedAt(System.currentTimeMillis());
        sellerOrderRepository.save(sellerOrder);
    }

    private static final int PAGE_SIZE = 5;

    public OrderPage getUserOrders(Long lastCreatedAt, String lastId, String userId) {
        validateCursor(lastCreatedAt, lastId);

        // fetch one extra row to know if another page exists
        List<Order> orders = orderRepository.findUserOrdersPage(userId, lastCreatedAt, lastId, PAGE_SIZE + 1);

        boolean hasMore = orders.size() > PAGE_SIZE;
        if (hasMore) {
            orders = orders.subList(0, PAGE_SIZE);
        }

        if (orders.isEmpty()) {
            return new OrderPage(List.of(), false, null);
        }

        // one query for all seller orders of this page (no N+1)
        List<String> orderIds = orders.stream().map(Order::getId).toList();

        Map<String, List<SellerOrderView>> sellerOrdersByOrderId = sellerOrderRepository
                .findByOrderIdIn(orderIds).stream()
                .collect(Collectors.groupingBy(
                        SellerOrder::getOrderId,
                        Collectors.mapping(this::toSellerOrderView, Collectors.toList())));

        List<OrderView> views = orders.stream()
                .map(order -> new OrderView(
                        order.getId(),
                        order.getTotalPrice(),
                        order.getCreatedAt(),
                        order.getUpdatedAt(),
                        sellerOrdersByOrderId.getOrDefault(order.getId(), List.of())))
                .toList();

        Order last = orders.get(orders.size() - 1);
        NextCursor nextCursor = hasMore
                ? new NextCursor(last.getCreatedAt(), last.getId())
                : null;

        return new OrderPage(views, hasMore, nextCursor);
    }

    private SellerOrderView toSellerOrderView(SellerOrder s) {
        return new SellerOrderView(
                s.getId(),
                s.getSellerId(),
                s.getStatus(),
                s.getSellerNote(),
                s.getTotalPrice(),
                List.of(s.getProductItems()),
                s.getUpdatedAt());
    }


    public SellerOrderPage getSellerOrders(Long lastCreatedAt, String lastId, String sellerId, OrderStatus orderStatus) {

        validateCursor(lastCreatedAt, lastId);

        // fetch one extra row to know if another page exists
        List<SellerOrder> orders = sellerOrderRepository
                .findSellerOrdersPage(sellerId, orderStatus, lastCreatedAt, lastId, PAGE_SIZE + 1);

        boolean hasMore = orders.size() > PAGE_SIZE;
        if (hasMore) {
            orders = orders.subList(0, PAGE_SIZE);
        }
        if (orders.isEmpty()) {
            return new SellerOrderPage(List.of(), false, null);
        }

        List<SellerOrderDetailsView> views = orders.stream()
                .map(s -> new SellerOrderDetailsView(
                        s.getId(),
                        s.getOrderId(),
                        s.getStatus(),
                        s.getTotalPrice(),
                        List.of(s.getProductItems()),
                        s.getSellerNote(),
                        s.getCreatedAt(),
                        s.getUpdatedAt()))
                .toList();

        SellerOrder last = orders.get(orders.size() - 1);
        NextCursor nextCursor = hasMore
                ? new NextCursor(last.getCreatedAt(), last.getId())
                : null;

        return new SellerOrderPage(views, hasMore, nextCursor);
    }

    private void validateCursor(Long lastCreatedAt, String lastId) {
        if ((lastCreatedAt == null) != (lastId == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "lastCreatedAt and lastId must be sent together");
        }
        if (lastId != null && !ObjectId.isValid(lastId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid lastId");
        }
    }

    public void addOrderNote(String orderId,AddOrderNoteDto addOrderNoteDto, String sellerId){
        SellerOrder sellerOrder = sellerOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Seller order not found"));
        if(!sellerOrder.getSellerId().equals(sellerId)){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your order");
        }
        sellerOrder.setSellerNote(addOrderNoteDto.note());
        sellerOrderRepository.save(sellerOrder);
    }
}
