package com.leapscholar.ticketing.repository;

import com.leapscholar.ticketing.entity.Ticket;
import com.leapscholar.ticketing.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository
        extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

    Page<Ticket> findByOwner(User owner, Pageable pageable);

    Page<Ticket> findByAssignee(User assignee, Pageable pageable);
}
