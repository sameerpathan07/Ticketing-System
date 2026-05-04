package com.leapscholar.ticketing.controller;

import com.leapscholar.ticketing.dto.CommentDtos;
import com.leapscholar.ticketing.security.CurrentUserProvider;
import com.leapscholar.ticketing.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final CurrentUserProvider currentUser;

    @GetMapping
    public ResponseEntity<List<CommentDtos.CommentResponse>> list(@PathVariable Long ticketId) {
        return ResponseEntity.ok(commentService.listForTicket(currentUser.get(), ticketId));
    }

    @PostMapping
    public ResponseEntity<CommentDtos.CommentResponse> add(
            @PathVariable Long ticketId,
            @Valid @RequestBody CommentDtos.CreateCommentRequest req) {
        return ResponseEntity.ok(commentService.add(currentUser.get(), ticketId, req));
    }
}
