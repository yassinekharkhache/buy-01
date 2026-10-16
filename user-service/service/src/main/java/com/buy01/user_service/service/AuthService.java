package com.buy01.user_service.service;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.buy01.user_service.repository.UserRepository;
import com.buy01.user_service.dto.LoginDto;
import com.buy01.user_service.dto.RegisterDto;
import com.buy01.user_service.dto.UpdateUserDto;
import com.buy01.user_service.dto.UserResponse;
import com.buy01.user_service.exception.EmailAlreadyExistsException;
import com.buy01.user_service.exception.InvalidCredentialsException;
import com.buy01.user_service.exception.InvalidRoleException;
import com.buy01.user_service.exception.UsernameAlreadyExistsException;
import com.buy01.user_service.model.Role;
import com.buy01.user_service.model.User;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service 
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    @Transactional
    public void saveUser(@Valid RegisterDto data) {
        if (userRepository.existsByEmail(data.email().toLowerCase())) {
            throw new EmailAlreadyExistsException("Email '" + data.email().toLowerCase() + "' is already registered.");
        } else if (userRepository.existsByName(data.name())) {
            throw new UsernameAlreadyExistsException("Username '" + data.name() + "' is already registered.");
        } else if (data.role() != Role.CLIENT && data.role() != Role.SELLER) {
            throw new InvalidRoleException("Invalid role. Must be either CLIENT or SELLER");
        }

        User user = new User();
        user.setName(data.name());
        user.setEmail(data.email().toLowerCase());
        user.setPassword(encoder.encode(data.password()));
        user.setRole(data.role());

        userRepository.save(user);
    }

    public String login(LoginDto data) {
        Optional<User> userOptional = userRepository.findByName(data.username());
        if (userOptional.isEmpty()) {
            throw new InvalidCredentialsException("Invalid username or password");
        }

        User user = userOptional.get();
        if (!encoder.matches(data.password(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid username or password");
        }

        return jwtService.generateToken(user);
    }
}
