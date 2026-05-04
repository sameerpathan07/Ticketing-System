package com.leapscholar.ticketing;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("h2")
class TicketingApplicationTests {

    @Test
    void contextLoads() {
        // Verifies the Spring application context starts without errors.
    }
}
