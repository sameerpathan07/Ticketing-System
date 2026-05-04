package com.leapscholar.ticketing.controller;

import com.leapscholar.ticketing.dto.AttachmentDtos;
import com.leapscholar.ticketing.security.CurrentUserProvider;
import com.leapscholar.ticketing.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final CurrentUserProvider currentUser;

    @GetMapping("/api/tickets/{ticketId}/attachments")
    public ResponseEntity<List<AttachmentDtos.AttachmentResponse>> list(@PathVariable Long ticketId) {
        return ResponseEntity.ok(attachmentService.listForTicket(currentUser.get(), ticketId));
    }

    @PostMapping(value = "/api/tickets/{ticketId}/attachments",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentDtos.AttachmentResponse> upload(
            @PathVariable Long ticketId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(attachmentService.upload(currentUser.get(), ticketId, file));
    }

    @GetMapping("/api/attachments/{attachmentId}")
    public ResponseEntity<Resource> download(@PathVariable Long attachmentId) {
        AttachmentService.AttachmentDownload dl =
                attachmentService.download(currentUser.get(), attachmentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(dl.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + dl.filename() + "\"")
                .body(dl.resource());
    }
}
