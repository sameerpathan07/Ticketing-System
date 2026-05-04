package com.leapscholar.ticketing.repository;

import com.leapscholar.ticketing.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByTicketIdOrderByUploadedAtAsc(Long ticketId);
}
