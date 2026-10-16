package com.buy01.user_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.buy01.user_service.dto.LoginDto;
import com.buy01.user_service.dto.RegisterDto;
import com.buy01.user_service.dto.UpdateUserDto;
import com.buy01.user_service.dto.UserResponse;
import com.buy01.user_service.model.User;
import com.buy01.user_service.service.AuthService;
import com.buy01.user_service.service.UserService;

import java.util.Map;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping ("/api/auth")
@RequiredArgsConstructor 
public class AuthController {
    private final AuthService AuthService;
    private final UserService userService;

    @PostMapping ("/login")
    public ResponseEntity<Map<String, String>> login(@Valid @RequestBody LoginDto data) {
        String token = AuthService.login(data);
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerUser(@Valid @RequestBody RegisterDto data) {
        AuthService.saveUser(data);

        return ResponseEntity
                .status(201)
                .body(Map.of("created", data.name() + " registered successfully!"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getLoggedInUser(
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(
                userService.getUserResponse(user)
        );
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateLoggedInUser(
            @AuthenticationPrincipal User user, @Valid @RequestBody UpdateUserDto data) {

        return ResponseEntity.ok(
                userService.updateUser(user, data)
        );
    }

}
