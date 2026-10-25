package com.buy01.product_service.repository;

import com.buy01.product_service.model.*;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

@Repository
public interface productRepository extends MongoRepository<Product, String> {
    List<Product> findByCreatedAtGreaterThanOrCreatedAtEqualsAndIdGreaterThanOrderByCreatedAtAscIdAsc(
    long createdAt,
    long sameCreatedAt,
    String id,
    Pageable pageable);

}