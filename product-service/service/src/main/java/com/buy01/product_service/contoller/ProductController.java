package com.buy01.product_service.contoller;

import com.buy01.product_service.dto.*;
import com.buy01.product_service.model.Product;
import com.buy01.product_service.model.ProductCategory;
import com.buy01.product_service.service.ProductService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor 
@RequestMapping("/api")
public class ProductController {

    private final ProductService productService;

    @PostMapping("/products")
    public ResponseEntity<?> createProduct(@Valid @RequestBody AddProduct addProduct,@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("userID");
        productService.addProduct(addProduct, userId);
        return ResponseEntity.ok(Map.of("message","Product created successfully"));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<String> deleteProduct(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("userID");
        productService.deleteProduct(id, userId);
        return ResponseEntity.ok("Product deleted successfully");
    }

    @PatchMapping("/products/{id}")
    public ResponseEntity<String> updateProduct(@PathVariable String id, @Valid @RequestBody UpdateProduct updateProduct, @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("userID");
        productService.updateProduct(id, updateProduct, userId);
        return ResponseEntity.ok("Product updated successfully");
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getRecentProducts(
        @RequestParam(required = false) Long lastCreatedAt,
        @RequestParam(required = false) String lastId,
        @RequestParam(required = false) ProductCategory category,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "asc") String direction
    ) {
        List<Product> products = productService.getProductsByLastId(
                lastCreatedAt, lastId, category, sortBy, direction
        );
    
        return ResponseEntity.ok(products);
    }

    // get product by id
    @GetMapping("/products/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable String id) {
        Product product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    //get my products
    @GetMapping("/my-products")
    public ResponseEntity<List<Product>> getMyProducts(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("userID");
        List<Product> products = productService.getMyProducts(userId);
        return ResponseEntity.ok(products);
    }
}