package org.auditor.interceptors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for PIIShield regex masking logic.
 * Tests the maskPII() method directly without ADK runtime dependency.
 */
@DisplayName("PIIShield – PII Masking Tests")
class PIIShieldTest {

    private PIIShield shield;

    @BeforeEach
    void setUp() {
        shield = new PIIShield();
    }

    @Test
    @DisplayName("Masks 16-digit credit card number")
    void masksCreditCard() {
        String input  = "Card: 4532123456789012 was charged $500";
        String result = shield.maskPII(input);
        assertFalse(result.contains("4532123456789012"), "Card number should be masked");
        assertTrue(result.contains("[CARD-MASKED]"), "Replacement token should be present");
    }

    @Test
    @DisplayName("Masks SSN in standard format")
    void masksSSN() {
        String input  = "Employee SSN: 123-45-6789 on file";
        String result = shield.maskPII(input);
        assertFalse(result.contains("123-45-6789"), "SSN should be masked");
        assertTrue(result.contains("[SSN-MASKED]"));
    }

    @Test
    @DisplayName("Masks IBAN")
    void masksIBAN() {
        String input  = "Wire to: GB29 NWBK 6016 1331 9268 19";
        String result = shield.maskPII(input);
        assertFalse(result.contains("GB29"), "IBAN should be masked");
        assertTrue(result.contains("[IBAN-MASKED]"));
    }

    @Test
    @DisplayName("Masks email addresses")
    void masksEmail() {
        String input  = "Contact cfo@acme-corp.com for details";
        String result = shield.maskPII(input);
        assertFalse(result.contains("cfo@acme-corp.com"), "Email should be masked");
        assertTrue(result.contains("[EMAIL-MASKED]"));
    }

    @Test
    @DisplayName("Masks bank account references")
    void masksBankAccount() {
        String input  = "ACCT: 123456789012 transfer pending";
        String result = shield.maskPII(input);
        assertFalse(result.contains("123456789012"), "Bank account should be masked");
        assertTrue(result.contains("[ACCT-MASKED]"));
    }

    @Test
    @DisplayName("Clean text passes through unchanged")
    void cleanTextPassesThrough() {
        String input  = "Vendor: AWS, Amount: $12,450, Category: Cloud Infrastructure";
        String result = shield.maskPII(input);
        assertEquals(input, result, "Clean financial text should not be modified");
    }

    @Test
    @DisplayName("Multiple PII types masked in single string")
    void masksMultiplePiiTypes() {
        String input  = "Card 4111111111111111 SSN 987-65-4321 email user@test.com";
        String result = shield.maskPII(input);
        assertTrue(result.contains("[CARD-MASKED]"),  "Card should be masked");
        assertTrue(result.contains("[SSN-MASKED]"),   "SSN should be masked");
        assertTrue(result.contains("[EMAIL-MASKED]"), "Email should be masked");
        assertFalse(result.contains("4111"), "No card digits should remain");
        assertFalse(result.contains("987-65"), "No SSN digits should remain");
    }

    @Test
    @DisplayName("Null and blank inputs handled safely")
    void handlesNullAndBlank() {
        assertNull(shield.maskPII(null));
        assertEquals("", shield.maskPII(""));
        assertEquals("   ", shield.maskPII("   ")); // blank passthrough
    }

    @ParameterizedTest(name = "Card format: {0}")
    @CsvSource({
            "4532-1234-5678-9012",
            "4532 1234 5678 9012",
            "4532123456789012"
    })
    @DisplayName("Masks various credit card formats")
    void masksVariousCardFormats(String cardNumber) {
        String result = shield.maskPII("Payment: " + cardNumber);
        assertTrue(result.contains("[CARD-MASKED]"),
                "Card format '" + cardNumber + "' should be masked");
    }
}