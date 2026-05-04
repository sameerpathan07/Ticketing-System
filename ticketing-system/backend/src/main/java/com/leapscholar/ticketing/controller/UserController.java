package com.leapscholar.ticketing.controller;

import com.leapscholar.ticketing.dto.UserDtos;
import com.leapscholar.ticketing.security.CurrentUserProvider;
import com.leapscholar.ticketing.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final CurrentUserProvider currentUser;

    /** Admin only: full user list. */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDtos.UserResponse>> listAll() {
        return ResponseEntity.ok(userService.listAll());
    }

    /**
     * Lists support agents — used by the assignment dropdown. Available to
     * agents and admins (so an agent can reassign to a colleague).
     */
    @GetMapping("/agents")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_AGENT')")
    public ResponseEntity<List<UserDtos.UserResponse>> listAgents() {
        return ResponseEntity.ok(userService.listAgents());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDtos.UserResponse> create(
            @Valid @RequestBody UserDtos.CreateUserRequest req) {
        return ResponseEntity.ok(userService.create(req));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDtos.UserResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDtos.UserResponse> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody UserDtos.UpdateRoleRequest req) {
        return ResponseEntity.ok(userService.updateRole(id, req.role()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id, currentUser.get().getId());
        return ResponseEntity.noContent().build();
    }
}
