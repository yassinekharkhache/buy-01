package com.buy01.user_service.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.buy01.user_service.dto.UpdateUserDto;
import com.buy01.user_service.dto.UserResponse;
import com.buy01.user_service.exception.EmailAlreadyExistsException;
import com.buy01.user_service.model.User;
import com.buy01.user_service.repository.UserRepository;
import lombok.AllArgsConstructor;
import java.util.Optional;
import jakarta.validation.Valid;

@Service
@AllArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;

    public Optional<User> getUserByName(String username) {
        return userRepository.findByName(username);
    }

    public UserResponse getUserResponse(User user){
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }
    
    public UserResponse updateUser(User user, @Valid UpdateUserDto data) {
        if (data.name() != null && !data.name().isBlank()) {
            user.setName(data.name());
        }
        if (data.email() != null && !data.email().isBlank()) {
            if (!user.getEmail().equalsIgnoreCase(data.email()) && userRepository.existsByEmail(data.email().toLowerCase())) {
                throw new EmailAlreadyExistsException("Email '" + data.email().toLowerCase() + "' is already registered.");
            }
            user.setEmail(data.email().toLowerCase());
        }
        if (data.password() != null && !data.password().isBlank()) {
            user.setPassword(encoder.encode(data.password()));
        }

        User updatedUser = userRepository.save(user);
        return getUserResponse(updatedUser);
    }
}