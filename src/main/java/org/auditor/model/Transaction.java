package org.auditor.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Represents a single parsed financial transaction from an expense PDF.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record Transaction(
        String id,
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
        String vendor,
        String category,
        BigDecimal amount,
        String currency,
        String description,
        String department,
        String invoiceRef,
        TransactionStatus status
) {
    public enum TransactionStatus {
        NORMAL, SUSPICIOUS, DUPLICATE, SPIKE, UNRECOGNIZED_VENDOR, FLAGGED
    }

    /** Returns true if amount exceeds the given threshold. */
    public boolean isLargeTransaction(BigDecimal threshold) {
        return amount != null && amount.compareTo(threshold) > 0;
    }

    /** Convenience: amount as double for percentage calculations. */
    public double amountDouble() {
        return amount != null ? amount.doubleValue() : 0.0;
    }

    @Override
    public String toString() {
        return String.format("[%s] %s | %s %s | %s | Ref: %s",
                date, vendor, currency != null ? currency : "USD",
                amount, category, invoiceRef != null ? invoiceRef : "N/A");
    }
}