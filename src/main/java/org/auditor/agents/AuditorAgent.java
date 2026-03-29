package org.auditor.agents;

import org.auditor.interceptors.PIIShield;
import org.auditor.tools.FinanceTools;
import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.FunctionTool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * ╔══════════════════════════════════════════════════╗
 * ║  AUDITOR AGENT  –  Specialist #1                 ║
 * ║  Role: Deep forensic analysis of expense data    ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Capabilities:
 *  - Parse expense/invoice PDFs via PDFBox
 *  - Detect price spikes against vendor baselines
 *  - Flag unrecognized vendors
 *  - Identify duplicate charges
 *  - Categorize spending patterns
 *
 * Registered as an AgentTool on the CFO Root Agent.
 */
public class AuditorAgent {

    private static final Logger log = LoggerFactory.getLogger(AuditorAgent.class);

    public static final String AGENT_NAME = "AuditorAgent";

    private static final String SYSTEM_PROMPT = """
        You are the Shadow Auditor — a forensic financial analyst AI with the instincts of a \
        Big-4 partner and the precision of a fraud investigator.
        
        YOUR MISSION:
        You analyze company expense data to surface hidden financial risks, unusual patterns, \
        and unnecessary spending. You are thorough, data-driven, and unafraid to call out problems.
        
        ANALYSIS PROTOCOL:
        1. PARSE: Use parsePdfExpenses to extract raw transaction data from the provided PDF path.
        2. DETECT: Run detectAnomalies on the extracted transactions to find:
           - Price spikes (>30% above vendor's own historical average)
           - Duplicate charges (same vendor + amount within 24 hours)
           - Unrecognized/suspicious vendors not in the trusted whitelist
           - Abnormally large single transactions (>$10,000)
        3. CATEGORIZE: Use categorizeSpending to map the full spend distribution.
        4. RECOMMEND: Use generateCostSuggestions with the analysis to produce prioritized actions.
        
        OUTPUT FORMAT:
        Produce a structured audit report with:
        - Executive Summary (3-4 sentences, dollar figures included)
        - Critical Findings (CRITICAL/HIGH severity anomalies first)
        - Spending Breakdown (top categories and vendors by % of total)
        - Risk Register (each finding with: Vendor | Amount | Type | Severity | Evidence)
        - Cost Reduction Opportunities (numbered, with estimated savings where calculable)
        
        IMPORTANT:
        - Always cite specific transaction IDs, dates, and dollar amounts
        - Do NOT speculate without data evidence
        - Flag anything that smells wrong even if it doesn't match a hardcoded pattern
        - Your output feeds into the NegotiatorAgent — be specific about which vendors need action
        """;

    /**
     * Builds and returns the configured AuditorAgent LlmAgent.
     *
     * @param model     Gemini model string (e.g. "gemini-2.0-flash")
     * @param piiShield The PII interceptor to attach
     */
    public static LlmAgent build(String model, PIIShield piiShield) {
        log.info("[AuditorAgent] Building specialist agent with model: {}", model);

        FinanceTools financeTools = new FinanceTools();

        LlmAgent agent = LlmAgent.builder()
                .name(AGENT_NAME)
                .description("Forensic financial auditor. Analyzes expense PDFs to detect price spikes, " +
                        "duplicate charges, unrecognized vendors, and unusual spending patterns. " +
                        "Produces structured audit reports with severity-ranked findings.")
                .model(model)
                .instruction(SYSTEM_PROMPT)
                .tools(List.of(
                        FunctionTool.create(financeTools, "parsePdfExpenses"),
                        FunctionTool.create(financeTools, "detectAnomalies"),
                        FunctionTool.create(financeTools, "categorizeSpending"),
                        FunctionTool.create(financeTools, "generateCostSuggestions")
                ))
                .beforeModelCallback(piiShield)
                .outputKey("audit_report")    // stores result in session state
                .build();

        log.info("[AuditorAgent] Agent built successfully.");
        return agent;
    }
}