package com.leapscholar.ticketing.dto;

import com.leapscholar.ticketing.entity.User;
import com.leapscholar.ticketing.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class UserDtos {

    public record UserResponse(
            Long id,
            String fullName,
            String email,
            Role role,
            boolean enabled,
            Instant createdAt
    ) {
        public static UserResponse from(User u) {
            return new UserResponse(
                    u.getId(), u.getFullName(), u.getEmail(),
                    u.getRole(), u.isEnabled(), u.getCreatedAt()
            );
        }
    }

    /** Admin endpoint: create a user with any role. */
    public record CreateUserRequest(
            @NotBlank @Size(min = 2, max = 100) String fullName,
            @Email @NotBlank String email,
            @NotBlank @Size(min = 6, max = 100) String password,
            @NotNull Role role
    ) {}

    public record UpdateRoleRequest(@NotNull Role role) {}

    private UserDtos() {}
}
