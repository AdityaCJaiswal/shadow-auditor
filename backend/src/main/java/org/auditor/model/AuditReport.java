package org.auditor.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Structured audit report produced by the AuditorAgent.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuditReport(
        String reportId,
        Instant generatedAt,
        String periodCovered,
        int totalTransactionsAnalyzed,
        BigDecimal totalSpend,
        BigDecimal flaggedSpend,
        List<AuditFinding> findings,
        Map<String, BigDecimal> spendByCategory,
        Map<String, BigDecimal> spendByVendor,
        List<String> costReductionSuggestions,
        String executiveSummary
) {
    public enum FindingSeverity { LOW, MEDIUM, HIGH, CRITICAL }
    public enum FindingType {
        PRICE_SPIKE, UNRECOGNIZED_VENDOR, DUPLICATE_CHARGE,
        BUDGET_OVERSPEND, SUBSCRIPTION_WASTE, UNUSUAL_PATTERN
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record AuditFinding(
            String findingId,
            FindingType type,
            FindingSeverity severity,
            String vendor,
            BigDecimal amount,
            String description,
            String recommendation,
            List<String> relatedTransactionIds
    ) {}
}