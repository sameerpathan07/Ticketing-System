package com.leapscholar.ticketing.controller;

import com.leapscholar.ticketing.dto.TicketDtos;
import com.leapscholar.ticketing.enums.Priority;
import com.leapscholar.ticketing.enums.TicketStatus;
import com.leapscholar.ticketing.security.CurrentUserProvider;
import com.leapscholar.ticketing.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final CurrentUserProvider currentUser;

    /**
     * List tickets with search & filters. RBAC is enforced inside the service:
     * regular users only ever see their own tickets, regardless of filters.
     */
    @GetMapping
    public ResponseEntity<Page<TicketDtos.TicketSummaryResponse>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] parts = sort.split(",");
        Sort.Direction dir = parts.length > 1 && parts[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(dir, parts[0]));

        return ResponseEntity.ok(
                ticketService.search(currentUser.get(), q, status, priority,
                        assigneeId, ownerId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketDtos.TicketDetailResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getById(currentUser.get(), id));
    }

    @PostMapping
    public ResponseEntity<TicketDtos.TicketDetailResponse> create(
            @Valid @RequestBody TicketDtos.CreateTicketRequest req) {
        return ResponseEntity.ok(ticketService.create(currentUser.get(), req));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TicketDtos.TicketDetailResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TicketDtos.UpdateTicketRequest req) {
        return ResponseEntity.ok(ticketService.update(currentUser.get(), id, req));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketDtos.TicketDetailResponse> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody TicketDtos.StatusUpdateRequest req) {
        return ResponseEntity.ok(ticketService.changeStatus(currentUser.get(), id, req.status()));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<TicketDtos.TicketDetailResponse> assign(
            @PathVariable Long id,
            @Valid @RequestBody TicketDtos.AssignRequest req) {
        return ResponseEntity.ok(ticketService.assign(currentUser.get(), id, req.assigneeId()));
    }

    @PostMapping("/{id}/rating")
    public ResponseEntity<TicketDtos.TicketDetailResponse> rate(
            @PathVariable Long id,
            @Valid @RequestBody TicketDtos.RatingRequest req) {
        return ResponseEntity.ok(ticketService.rate(currentUser.get(), id, req));
    }
}
