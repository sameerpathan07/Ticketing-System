package com.leapscholar.ticketing.service;

import com.leapscholar.ticketing.entity.Ticket;
import com.leapscholar.ticketing.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Sends email notifications for ticket events.
 *
 * Disabled by default (app.mail.enabled=false). When enabled, calls run async
 * so they never block the request thread. We log but don't rethrow on send
 * failure — a flaky SMTP server shouldn't break the API.
 */
@Service
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;
    private final boolean enabled;
    private final String fromAddress;

    public NotificationService(JavaMailSender mailSender,
                               @Value("${app.mail.enabled}") boolean enabled,
                               @Value("${app.mail.from}") String fromAddress) {
        this.mailSender = mailSender;
        this.enabled = enabled;
        this.fromAddress = fromAddress;
    }

    @Async
    public void notifyTicketCreated(Ticket ticket) {
        if (!enabled) return;
        send(ticket.getOwner().getEmail(),
                "Ticket #" + ticket.getId() + " created: " + ticket.getSubject(),
                "Your support ticket has been created.\n\n" +
                        "Subject: " + ticket.getSubject() + "\n" +
                        "Priority: " + ticket.getPriority() + "\n" +
                        "Status: " + ticket.getStatus() + "\n\n" +
                        "We'll keep you posted as it progresses.");
    }

    @Async
    public void notifyTicketAssigned(Ticket ticket, User assignee) {
        if (!enabled) return;
        send(assignee.getEmail(),
                "Ticket #" + ticket.getId() + " assigned to you",
                "A ticket has been assigned to you.\n\n" +
                        "Subject: " + ticket.getSubject() + "\n" +
                        "Priority: " + ticket.getPriority() + "\n" +
                        "Owner: " + ticket.getOwner().getFullName() + "\n");
    }

    @Async
    public void notifyStatusChanged(Ticket ticket) {
        if (!enabled) return;
        send(ticket.getOwner().getEmail(),
                "Ticket #" + ticket.getId() + " status updated: " + ticket.getStatus(),
                "Your ticket \"" + ticket.getSubject() + "\" is now " + ticket.getStatus() + ".");
    }

    private void send(String to, String subject, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
        } catch (Exception e) {
            log.warn("Failed to send notification email to {}: {}", to, e.getMessage());
        }
    }
}
