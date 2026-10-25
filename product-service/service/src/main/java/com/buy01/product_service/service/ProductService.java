package com.buy01.product_service.service;

import com.buy01.product_service.dto.*;
import com.buy01.product_service.exception.ProductNotFoundException;
import com.buy01.product_service.kafka.ProductEventProducer;
import com.buy01.product_service.exception.InvalidProductUpdateException;
import com.buy01.product_service.exception.ForbiddenException;
import com.buy01.product_service.model.Product;
import com.buy01.product_service.repository.productRepository;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.UUID;


@Service
@AllArgsConstructor
public class ProductService {

    private final productRepository productRepository;
    private final ProductEventProducer eventProducer;

    // add product (Create)
    public void addProduct(AddProduct product, String userId) {
        Product productEntity = new Product();
        productEntity.setId(UUID.randomUUID().toString());
        productEntity.setName(product.name());
        productEntity.setPrice(product.price());
        productEntity.setDescription(product.description());
        productEntity.setUserId(userId);
        productEntity.setCreatedAt(System.currentTimeMillis());
        var savedProduct = productRepository.save(productEntity);
        ProductCreatedEvent event = new ProductCreatedEvent(
            savedProduct.getId(),
            savedProduct.getUserId(),
            savedProduct.getCreatedAt()
        );

        eventProducer.publishProductCreated(event);
    }

    // delete product (Delete)
    @Transactional
    public void deleteProduct(String productId, String userId) {
        Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ProductNotFoundException(productId));
        
        if (!product.getUserId().equals(userId)) {
            throw new ForbiddenException("Unauthorized to delete this product:"+ productId);
        }
        productRepository.deleteById(productId);
    }

    // update product (Update)
    @Transactional
    public Product updateProduct(String productId,UpdateProduct updateProduct, String userId) {
        if(updateProduct.name() == null && updateProduct.price() == null && updateProduct.description() == null){
            throw new InvalidProductUpdateException("At least one field must be provided for update");
        }
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));

        if (product.getUserId().equals(userId)) {
            if (updateProduct.name() != null) {
                product.setName(updateProduct.name());
            }
            if (updateProduct.price() != null) {
                product.setPrice(updateProduct.price());
            }
            if (updateProduct.description() != null) {
                product.setDescription(updateProduct.description());
            }
            return productRepository.save(product);
        } else {
            throw new ForbiddenException("you are not allowed to update this product: " + productId);
        }
    }

    // get product by id (Read)
    public Product getProductById(String productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
    }
    
    // get 10 products by lastId (Read)
    public List<Product> getProductsByLastId(Long lastCreatedAt, String lastId) {
        Pageable page = PageRequest.of(0, 10);

        if (lastCreatedAt == null || lastId == null) {
            return productRepository.findAll(PageRequest.of(0, 10, Sort.by(Sort.Order.asc("createdAt"),Sort.Order.asc("id")).ascending())).getContent();
        }

        return productRepository.findByCreatedAtGreaterThanOrCreatedAtEqualsAndIdGreaterThanOrderByCreatedAtAscIdAsc(
            lastCreatedAt,
            lastCreatedAt,
            lastId,
            page
        );
    }

}