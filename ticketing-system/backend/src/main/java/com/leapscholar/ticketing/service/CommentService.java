package com.leapscholar.ticketing.service;

import com.leapscholar.ticketing.dto.CommentDtos;
import com.leapscholar.ticketing.entity.Comment;
import com.leapscholar.ticketing.entity.Ticket;
import com.leapscholar.ticketing.entity.User;
import com.leapscholar.ticketing.enums.TicketStatus;
import com.leapscholar.ticketing.exception.BadRequestException;
import com.leapscholar.ticketing.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketService ticketService;

    public List<CommentDtos.CommentResponse> listForTicket(User caller, Long ticketId) {
        // Reuses ticket access-control: throws if caller can't see the ticket.
        ticketService.loadAndAuthorizeView(caller, ticketId);
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(CommentDtos.CommentResponse::from)
                .toList();
    }

    @Transactional
    public CommentDtos.CommentResponse add(User caller, Long ticketId,
                                           CommentDtos.CreateCommentRequest req) {
        Ticket ticket = ticketService.loadAndAuthorizeView(caller, ticketId);
        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new BadRequestException("Cannot comment on a closed ticket");
        }
        Comment comment = Comment.builder()
                .ticket(ticket)
                .author(caller)
                .content(req.content())
                .build();
        return CommentDtos.CommentResponse.from(commentRepository.save(comment));
    }
}
