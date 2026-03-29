package org.auditor.interceptors;

import com.google.adk.agents.CallbackContext;
import com.google.adk.agents.Callbacks;
import com.google.adk.models.LlmRequest;
import com.google.adk.models.LlmResponse;
import com.google.genai.types.Content;
import com.google.genai.types.Part;
import io.reactivex.rxjava3.core.Maybe;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

public class PIIShield implements Callbacks.BeforeModelCallback {

    private static final Logger log = LoggerFactory.getLogger(PIIShield.class);

    // ── Regex patterns ──────────────────────────────────────────────────────

    private static final Pattern CARD_NUMBER = Pattern.compile(
            "\\b(?:\\d[ -]?){13,19}\\b"
    );
    private static final Pattern SSN_TIN = Pattern.compile(
            "\\b\\d{3}[- ]?\\d{2}[- ]?\\d{4}\\b"
    );
    private static final Pattern IBAN = Pattern.compile(
            "\\b[A-Z]{2}\\d{2}[A-Z0-9 ]{4,30}\\b"
    );
    private static final Pattern ROUTING_NUMBER = Pattern.compile(
            "\\b(routing[:\\s#]*)?\\d{9}\\b",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern BANK_ACCOUNT = Pattern.compile(
            "(?i)(?:acct|account)[.:\\s#]*\\d{8,18}"
    );
    private static final Pattern EMAIL = Pattern.compile(
            "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}"
    );
    private static final Pattern PHONE = Pattern.compile(
            "(?:\\+?\\d{1,3}[\\s.-]?)?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}"
    );

    private record MaskRule(String label, Pattern pattern, String replacement) {}

    private static final List<MaskRule> RULES = List.of(
            new MaskRule("CARD_NUMBER",  CARD_NUMBER,    "[CARD-MASKED]"),
            new MaskRule("SSN_TIN",      SSN_TIN,        "[SSN-MASKED]"),
            new MaskRule("IBAN",         IBAN,           "[IBAN-MASKED]"),
            new MaskRule("ROUTING",      ROUTING_NUMBER, "[ROUTING-MASKED]"),
            new MaskRule("BANK_ACCOUNT", BANK_ACCOUNT,   "[ACCT-MASKED]"),
            new MaskRule("EMAIL",        EMAIL,          "[EMAIL-MASKED]"),
            new MaskRule("PHONE",        PHONE,          "[PHONE-MASKED]")
    );

    // ── Callback ─────────────────────────────────────────────────────────────

    @Override
    public Maybe<LlmResponse> call(CallbackContext callbackContext, LlmRequest.Builder builder) {
        log.debug("[PIIShield] Scanning prompt for sensitive identifiers...");

        List<Content> sanitizedContents = sanitizeContents(builder.build().contents());
        builder.contents(sanitizedContents);

        log.debug("[PIIShield] Prompt sanitization complete.");
        return Maybe.empty(); // continue pipeline
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private List<Content> sanitizeContents(List<Content> contents) {
        if (contents == null) return List.of();
        List<Content> result = new ArrayList<>();
        for (Content content : contents) {
            result.add(sanitizeContent(content));
        }
        return result;
    }

    private Content sanitizeContent(Content content) {
        if (content.parts() == null || content.parts().get().isEmpty()) return content;

        List<Part> sanitizedParts = new ArrayList<>();
        for (Part part : content.parts().get()) {
            sanitizedParts.add(sanitizePart(part));
        }

        return Content.builder()
                .role(content.role().orElse("user"))
                .parts(sanitizedParts)
                .build();
    }

    private Part sanitizePart(Part part) {
        if (part.text().isEmpty()) return part;

        String original = part.text().get();
        String masked = maskPII(original);

        if (!masked.equals(original)) {
            log.info("[PIIShield] ⚠  PII detected and masked in prompt.");
            log.debug("[PIIShield] Original length={}, Masked length={}",
                    original.length(), masked.length());
        }

        return Part.fromText(masked);
    }

    public String maskPII(String text) {
        if (text == null || text.isBlank()) return text;

        String result = text;
        for (MaskRule rule : RULES) {
            String before = result;
            result = rule.pattern().matcher(result).replaceAll(rule.replacement());
            if (!result.equals(before)) {
                log.debug("[PIIShield] Rule '{}' triggered masking.", rule.label());
            }
        }
        return result;
    }
}