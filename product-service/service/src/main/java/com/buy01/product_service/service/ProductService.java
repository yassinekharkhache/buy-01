package com.buy01.product_service.service;

import com.buy01.product_service.dto.*;
import com.buy01.product_service.exception.ProductNotFoundException;
import com.buy01.product_service.kafka.ProductEventProducer;
import com.buy01.product_service.exception.InvalidProductUpdateException;
import com.buy01.product_service.exception.ForbiddenException;
import com.buy01.product_service.model.Product;
import com.buy01.product_service.model.ProductCategory;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.buy01.product_service.repository.ProductRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Sort;
import java.util.UUID;
import java.util.List;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductEventProducer eventProducer;
    private final MongoTemplate mongoTemplate;

    // add product (Create)
    public void addProduct(AddProduct product, String userId) {
        Product productEntity = new Product();
        productEntity.setId(UUID.randomUUID().toString());
        productEntity.setName(product.name());
        productEntity.setPrice(product.price());
        productEntity.setDescription(product.description());
        productEntity.setUserId(userId);
        productEntity.setQuantity(product.quantity());
        productEntity.setCreatedAt(System.currentTimeMillis());
        productEntity.setMainPicPosition(product.mainPicPosition());
        productEntity.setCategory(product.category());
        var savedProduct = productRepository.save(productEntity);
        ProductCreatedEvent event = new ProductCreatedEvent(
            savedProduct.getId(),
            savedProduct.getUserId(),
            product.uploadSessionId()
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
    
    
    
    public List<Product> getMyProducts(String userId) {
        return productRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // get 10 products by lastId (Read)
    public List<Product> getProductsByLastId(
            Long lastCreatedAt,
            String lastId,
            ProductCategory category,
            String sortBy,
            String direction
    ) {

        // Allowed sorting fields
        List<String> allowedFields = List.of(
                "createdAt",
                "name",
                "price"
        );

        if (!allowedFields.contains(sortBy)) {
            throw new IllegalArgumentException("Invalid sort field");
        }

        Sort.Direction sortDirection =
                direction.equalsIgnoreCase("desc")
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC;

        Query query = new Query();

        // Category filter
        if (category != null) {
            query.addCriteria(
                    Criteria.where("category").is(category)
            );
        }

        // Cursor pagination (currently for createdAt sorting)
        if (lastCreatedAt != null && lastId != null
                && sortBy.equals("createdAt")) {

            query.addCriteria(
                    new Criteria().orOperator(
                            Criteria.where("createdAt")
                                    .gt(lastCreatedAt),

                            new Criteria().andOperator(
                                    Criteria.where("createdAt")
                                            .is(lastCreatedAt),
                                    Criteria.where("_id")
                                            .gt(lastId)
                            )
                    )
            );
        }

        // Sorting
        query.with(Sort.by(
                sortDirection,
                sortBy,
                "_id"
        ));

        // Limit to 10
        query.limit(10);

        return mongoTemplate.find(query, Product.class);
    }
    
}
