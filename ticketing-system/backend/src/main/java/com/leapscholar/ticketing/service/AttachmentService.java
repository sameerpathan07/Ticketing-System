package com.leapscholar.ticketing.service;

import com.leapscholar.ticketing.dto.AttachmentDtos;
import com.leapscholar.ticketing.entity.Attachment;
import com.leapscholar.ticketing.entity.Ticket;
import com.leapscholar.ticketing.entity.User;
import com.leapscholar.ticketing.exception.BadRequestException;
import com.leapscholar.ticketing.exception.ResourceNotFoundException;
import com.leapscholar.ticketing.repository.AttachmentRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

/**
 * Secure file attachments. Files live on disk under app.upload.dir. We store
 * a UUID-prefixed name to defeat path-traversal attempts and avoid collisions;
 * the original filename is preserved only as metadata for display.
 */
@Service
@Slf4j
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final TicketService ticketService;
    private final Path uploadRoot;

    public AttachmentService(AttachmentRepository attachmentRepository,
                             TicketService ticketService,
                             @Value("${app.upload.dir}") String uploadDir) {
        this.attachmentRepository = attachmentRepository;
        this.ticketService = ticketService;
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(uploadRoot);
        log.info("Attachment storage initialised at {}", uploadRoot);
    }

    public List<AttachmentDtos.AttachmentResponse> listForTicket(User caller, Long ticketId) {
        ticketService.loadAndAuthorizeView(caller, ticketId);
        return attachmentRepository.findByTicketIdOrderByUploadedAtAsc(ticketId).stream()
                .map(AttachmentDtos.AttachmentResponse::from)
                .toList();
    }

    @Transactional
    public AttachmentDtos.AttachmentResponse upload(User caller, Long ticketId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        Ticket ticket = ticketService.loadAndAuthorizeView(caller, ticketId);

        String original = file.getOriginalFilename() != null
                ? Paths.get(file.getOriginalFilename()).getFileName().toString()
                : "unnamed";
        String stored = UUID.randomUUID() + "_" + original.replaceAll("[^A-Za-z0-9._-]", "_");
        Path target = uploadRoot.resolve(stored).normalize();
        if (!target.startsWith(uploadRoot)) {
            // Defensive: should not happen given the UUID prefix, but cheap insurance.
            throw new BadRequestException("Invalid filename");
        }

        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BadRequestException("Failed to save file: " + e.getMessage());
        }

        Attachment att = Attachment.builder()
                .ticket(ticket)
                .uploadedBy(caller)
                .originalFilename(original)
                .storedFilename(stored)
                .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .sizeBytes(file.getSize())
                .build();
        return AttachmentDtos.AttachmentResponse.from(attachmentRepository.save(att));
    }

    /** Returns (resource, originalFilename, contentType). Caller must have view perms. */
    public AttachmentDownload download(User caller, Long attachmentId) {
        Attachment att = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));
        ticketService.loadAndAuthorizeView(caller, att.getTicket().getId());

        Path file = uploadRoot.resolve(att.getStoredFilename()).normalize();
        if (!file.startsWith(uploadRoot) || !Files.exists(file)) {
            throw new ResourceNotFoundException("File missing on disk");
        }
        try {
            Resource resource = new UrlResource(file.toUri());
            return new AttachmentDownload(resource, att.getOriginalFilename(), att.getContentType());
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Could not read file");
        }
    }

    public record AttachmentDownload(Resource resource, String filename, String contentType) {}
}
