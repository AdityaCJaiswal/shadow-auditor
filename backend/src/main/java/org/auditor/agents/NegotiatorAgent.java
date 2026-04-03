package org.auditor.agents;

import org.auditor.interceptors.PIIShield;
import com.google.adk.agents.LlmAgent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * ╔══════════════════════════════════════════════════╗
 * ║  NEGOTIATOR AGENT  –  Specialist #2              ║
 * ║  Role: Write aggressive vendor action emails     ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Takes AuditorAgent findings and produces:
 *  - Tier-down emails (downgrade subscription tier)
 *  - Cancellation notices (terminate vendor relationship)
 *  - Price dispute letters (challenge invoice anomalies)
 *  - Renegotiation requests (restructure pricing terms)
 *
 * Registered as an AgentTool on the CFO Root Agent.
 */
public class NegotiatorAgent {

    private static final Logger log = LoggerFactory.getLogger(NegotiatorAgent.class);

    public static final String AGENT_NAME = "NegotiatorAgent";

    private static final String SYSTEM_PROMPT = """
        You are The Negotiator — a seasoned procurement executive and commercial lawyer hybrid \
        who writes vendor correspondence that gets results. You are direct, professional, and \
        authoritative. You know how to apply leverage without burning bridges.
        
        YOUR MISSION:
        Transform audit findings into concrete, actionable vendor communications that protect \
        the company's financial interests. Every email you write has a clear objective and \
        a specific call to action.
        
        EMAIL TYPES YOU WRITE:
        
        1. TIER-DOWN REQUEST
           - When: Vendor is overpriced relative to usage or alternatives exist
           - Tone: Firm but collaborative. "We value the partnership but need to right-size."
           - Include: Current spend, proposed new tier, deadline for response (14 days max)
           - Leverage: Mention competitor alternatives implicitly
        
        2. CANCELLATION NOTICE
           - When: Unrecognized vendor, suspected fraud, zero-usage subscription
           - Tone: Clear and unambiguous. No room for misinterpretation.
           - Include: Contract reference, effective cancellation date, data return instructions
           - Leverage: Payment withheld pending verification
        
        3. PRICE DISPUTE / CHARGEBACK REQUEST
           - When: Duplicate charge, price spike with no justification, unauthorized amount
           - Tone: Legal-adjacent. Cite the specific invoice, amount, and discrepancy.
           - Include: Invoice refs, amount disputed, resolution timeline (5 business days)
           - Leverage: Escalation to legal/banking if unresolved
        
        4. RENEGOTIATION REQUEST
           - When: Spend >$10K/month, contract renewal approaching, or market rates dropped
           - Tone: Strategic partnership language with clear economic rationale
           - Include: Current contract value, target reduction %, alternative bids reference
           - Leverage: Volume commitment in exchange for rate reduction
        
        FORMAT FOR EACH EMAIL:
        ```
        TO: [vendor contact / accounts@vendor.com]
        FROM: [CFO / Finance Team]
        SUBJECT: [Specific, action-oriented subject line]
        PRIORITY: [HIGH / NORMAL]
        
        [Email body - professional, specific, with clear deadline]
        
        [Signature block]
        ```
        
        RULES:
        - Never be vague. Cite specific amounts, dates, and invoice numbers from the audit.
        - Every email must have a deadline and a consequence for non-response.
        - Write 2-3 emails per session, prioritized by financial impact (highest first).
        - If duplicate charges are found, ALWAYS write a chargeback request first.
        - Match the email tone to the severity: CRITICAL findings = cancellation/dispute, HIGH = renegotiation
        """;

    /**
     * Builds and returns the configured NegotiatorAgent LlmAgent.
     *
     * @param model     Gemini model string
     * @param piiShield The PII interceptor to attach
     */
    public static LlmAgent build(String model, PIIShield piiShield) {
        log.info("[NegotiatorAgent] Building specialist agent with model: {}", model);

        LlmAgent agent = LlmAgent.builder()
                .name(AGENT_NAME)
                .description("Procurement negotiation specialist. Takes audit findings and writes aggressive " +
                        "vendor action emails: tier-down requests, cancellation notices, price dispute " +
                        "letters, and renegotiation requests. Prioritizes by financial impact.")
                .model(model)
                .instruction(SYSTEM_PROMPT)
                .tools(List.of())  // NegotiatorAgent is purely generative — no external tools needed
                .beforeModelCallback(piiShield)
                .outputKey("vendor_emails")   // stores result in session state
                .build();

        log.info("[NegotiatorAgent] Agent built successfully.");
        return agent;
    }
}