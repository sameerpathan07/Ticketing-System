package com.leapscholar.ticketing.service;

import com.leapscholar.ticketing.dto.TicketDtos;
import com.leapscholar.ticketing.entity.Ticket;
import com.leapscholar.ticketing.entity.User;
import com.leapscholar.ticketing.enums.Priority;
import com.leapscholar.ticketing.enums.Role;
import com.leapscholar.ticketing.enums.TicketStatus;
import com.leapscholar.ticketing.exception.BadRequestException;
import com.leapscholar.ticketing.exception.ForbiddenException;
import com.leapscholar.ticketing.exception.ResourceNotFoundException;
import com.leapscholar.ticketing.repository.TicketRepository;
import com.leapscholar.ticketing.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Core ticket logic: lifecycle, RBAC, search/filter.
 *
 * Visibility rules:
 *   ADMIN         - sees everything
 *   SUPPORT_AGENT - sees everything (so they can pick up unassigned tickets)
 *   USER          - sees only their own tickets
 *
 * Mutation rules:
 *   - Owner can edit subject/description/priority while ticket is OPEN.
 *   - Owner can comment any time (until CLOSED).
 *   - Agent assigned to the ticket (or any agent / admin) can change status,
 *     comment, and reassign.
 *   - Admin can do anything, including overriding ownership.
 */
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /** Allowed forward transitions. We don't allow skipping states. */
    private static final Map<TicketStatus, Set<TicketStatus>> ALLOWED_TRANSITIONS = Map.of(
            TicketStatus.OPEN,        EnumSet.of(TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED),
            TicketStatus.IN_PROGRESS, EnumSet.of(TicketStatus.RESOLVED, TicketStatus.OPEN, TicketStatus.CLOSED),
            TicketStatus.RESOLVED,    EnumSet.of(TicketStatus.CLOSED, TicketStatus.IN_PROGRESS),
            TicketStatus.CLOSED,      EnumSet.noneOf(TicketStatus.class)
    );

    // -------- create --------

    @Transactional
    public TicketDtos.TicketDetailResponse create(User owner, TicketDtos.CreateTicketRequest req) {
        Ticket ticket = Ticket.builder()
                .subject(req.subject())
                .description(req.description())
                .priority(req.priority() != null ? req.priority() : Priority.MEDIUM)
                .status(TicketStatus.OPEN)
                .owner(owner)
                .build();
        Ticket saved = ticketRepository.save(ticket);
        notificationService.notifyTicketCreated(saved);
        return TicketDtos.TicketDetailResponse.from(saved);
    }

    // -------- read --------

    public Page<TicketDtos.TicketSummaryResponse> search(
            User caller,
            String q,
            TicketStatus status,
            Priority priority,
            Long assigneeId,
            Long ownerId,
            Pageable pageable) {

        Specification<Ticket> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Visibility scope: regular users see only their own tickets.
            if (caller.getRole() == Role.USER) {
                predicates.add(cb.equal(root.get("owner"), caller));
            } else if (ownerId != null) {
                predicates.add(cb.equal(root.get("owner").get("id"), ownerId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (assigneeId != null) {
                predicates.add(cb.equal(root.get("assignee").get("id"), assigneeId));
            }
            if (q != null && !q.isBlank()) {
                String like = "%" + q.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("subject")), like),
                        cb.like(cb.lower(root.get("description")), like)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return ticketRepository.findAll(spec, pageable)
                .map(TicketDtos.TicketSummaryResponse::from);
    }

    public TicketDtos.TicketDetailResponse getById(User caller, Long ticketId) {
        Ticket ticket = loadAndAuthorizeView(caller, ticketId);
        return TicketDtos.TicketDetailResponse.from(ticket);
    }

    /** Returns the entity (for service-internal use); also enforces view perms. */
    public Ticket loadAndAuthorizeView(User caller, Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));
        if (caller.getRole() == Role.USER && !ticket.getOwner().getId().equals(caller.getId())) {
            throw new ForbiddenException("You do not have access to this ticket");
        }
        return ticket;
    }

    // -------- update --------

    @Transactional
    public TicketDtos.TicketDetailResponse update(User caller, Long ticketId,
                                                  TicketDtos.UpdateTicketRequest req) {
        Ticket ticket = loadAndAuthorizeView(caller, ticketId);

        boolean isOwner = ticket.getOwner().getId().equals(caller.getId());
        boolean isAdmin = caller.getRole() == Role.ADMIN;

        if (!isAdmin && !isOwner) {
            throw new ForbiddenException("Only the owner or an admin can edit ticket details");
        }
        if (!isAdmin && ticket.getStatus() != TicketStatus.OPEN) {
            throw new BadRequestException("Ticket can only be edited while OPEN");
        }

        if (req.subject() != null)     ticket.setSubject(req.subject());
        if (req.description() != null) ticket.setDescription(req.description());
        if (req.priority() != null)    ticket.setPriority(req.priority());
        return TicketDtos.TicketDetailResponse.from(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketDtos.TicketDetailResponse changeStatus(User caller, Long ticketId,
                                                        TicketStatus newStatus) {
        Ticket ticket = loadAndAuthorizeView(caller, ticketId);

        boolean isAdmin = caller.getRole() == Role.ADMIN;
        boolean isAgent = caller.getRole() == Role.SUPPORT_AGENT;
        boolean isOwner = ticket.getOwner().getId().equals(caller.getId());

        // Owners can only close their own RESOLVED ticket; otherwise agent/admin only.
        if (!isAdmin && !isAgent) {
            if (!(isOwner && ticket.getStatus() == TicketStatus.RESOLVED && newStatus == TicketStatus.CLOSED)) {
                throw new ForbiddenException("Only support agents or admins can change ticket status");
            }
        }

        TicketStatus current = ticket.getStatus();
        if (!isAdmin && !ALLOWED_TRANSITIONS.getOrDefault(current, Set.of()).contains(newStatus)) {
            throw new BadRequestException(
                    "Invalid status transition: " + current + " -> " + newStatus);
        }
        if (current == newStatus) {
            throw new BadRequestException("Ticket is already " + newStatus);
        }

        ticket.setStatus(newStatus);
        if (newStatus == TicketStatus.RESOLVED && ticket.getResolvedAt() == null) {
            ticket.setResolvedAt(Instant.now());
        }
        if (newStatus == TicketStatus.CLOSED && ticket.getClosedAt() == null) {
            ticket.setClosedAt(Instant.now());
        }

        Ticket saved = ticketRepository.save(ticket);
        notificationService.notifyStatusChanged(saved);
        return TicketDtos.TicketDetailResponse.from(saved);
    }

    @Transactional
    public TicketDtos.TicketDetailResponse assign(User caller, Long ticketId, Long assigneeId) {
        Ticket ticket = loadAndAuthorizeView(caller, ticketId);

        boolean isAdmin = caller.getRole() == Role.ADMIN;
        boolean isAgent = caller.getRole() == Role.SUPPORT_AGENT;
        if (!isAdmin && !isAgent) {
            throw new ForbiddenException("Only support agents or admins can reassign tickets");
        }

        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignee not found: " + assigneeId));
        if (assignee.getRole() != Role.SUPPORT_AGENT && assignee.getRole() != Role.ADMIN) {
            throw new BadRequestException("Tickets can only be assigned to support agents or admins");
        }

        ticket.setAssignee(assignee);
        // Auto-bump OPEN -> IN_PROGRESS once someone picks it up
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        Ticket saved = ticketRepository.save(ticket);
        notificationService.notifyTicketAssigned(saved, assignee);
        return TicketDtos.TicketDetailResponse.from(saved);
    }

    @Transactional
    public TicketDtos.TicketDetailResponse rate(User caller, Long ticketId,
                                                TicketDtos.RatingRequest req) {
        Ticket ticket = loadAndAuthorizeView(caller, ticketId);
        if (!ticket.getOwner().getId().equals(caller.getId())) {
            throw new ForbiddenException("Only the ticket owner can rate the resolution");
        }
        if (ticket.getStatus() != TicketStatus.RESOLVED && ticket.getStatus() != TicketStatus.CLOSED) {
            throw new BadRequestException("You can only rate a ticket once it is resolved or closed");
        }
        ticket.setRating(req.rating());
        ticket.setRatingFeedback(req.feedback());
        return TicketDtos.TicketDetailResponse.from(ticketRepository.save(ticket));
    }
}
