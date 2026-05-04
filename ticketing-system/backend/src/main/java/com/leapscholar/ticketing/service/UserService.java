package com.leapscholar.ticketing.service;

import com.leapscholar.ticketing.dto.UserDtos;
import com.leapscholar.ticketing.entity.User;
import com.leapscholar.ticketing.enums.Role;
import com.leapscholar.ticketing.exception.BadRequestException;
import com.leapscholar.ticketing.exception.ResourceNotFoundException;
import com.leapscholar.ticketing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserDtos.UserResponse> listAll() {
        return userRepository.findAll().stream()
                .map(UserDtos.UserResponse::from)
                .toList();
    }

    public List<UserDtos.UserResponse> listAgents() {
        return userRepository.findAllByRole(Role.SUPPORT_AGENT).stream()
                .map(UserDtos.UserResponse::from)
                .toList();
    }

    @Transactional
    public UserDtos.UserResponse create(UserDtos.CreateUserRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new BadRequestException("Email already registered");
        }
        User user = User.builder()
                .fullName(req.fullName())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(req.role())
                .enabled(true)
                .build();
        return UserDtos.UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserDtos.UserResponse updateRole(Long userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setRole(role);
        return UserDtos.UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void delete(Long userId, Long currentAdminId) {
        if (userId.equals(currentAdminId)) {
            throw new BadRequestException("You cannot delete your own admin account");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        // Soft-disable rather than hard-delete to preserve ticket history.
        user.setEnabled(false);
        userRepository.save(user);
    }

    public UserDtos.UserResponse getById(Long userId) {
        return userRepository.findById(userId)
                .map(UserDtos.UserResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }
}
