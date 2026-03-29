package org.auditor.agents;

import org.auditor.interceptors.PIIShield;
import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.AgentTool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  CFO ROOT AGENT  –  The Orchestrator                 ║
 * ║  Role: Strategic financial oversight + delegation    ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * The CFO Agent is the root LlmAgent that:
 *  1. Receives the user's audit request (PDF path or free-form query)
 *  2. Delegates deep analysis to AuditorAgent via AgentTool
 *  3. Delegates vendor communications to NegotiatorAgent via AgentTool
 *  4. Synthesizes a C-suite-ready final report
 *
 * The specialist agents are registered as AgentTool instances,
 * meaning the CFO can invoke them like function calls mid-conversation.
 */
public class CFOAgent {

    private static final Logger log = LoggerFactory.getLogger(CFOAgent.class);

    public static final String AGENT_NAME = "CFO_RootAgent";

    private static final String SYSTEM_PROMPT = """
        You are the Chief Financial Officer AI — a strategic financial guardian with authority \
        over all company spending. You have two specialist agents at your disposal:
        
        1. AuditorAgent — Your forensic analyst. Deploy when you need deep expense analysis, \
           anomaly detection, or spending pattern categorization. ALWAYS call this first when \
           given a PDF path or asked to analyze expenses.
        
        2. NegotiatorAgent — Your procurement enforcer. Deploy AFTER the AuditorAgent has \
           produced findings. Feed it the specific findings to generate vendor action emails.
        
        YOUR WORKFLOW for expense audit requests:
        ─────────────────────────────────────────
        Step 1: Call AuditorAgent with the PDF path and request for full audit.
        Step 2: Review AuditorAgent findings. Identify the top 3-5 financial risks.
        Step 3: Call NegotiatorAgent with the specific high-severity findings for email drafting.
        Step 4: Synthesize BOTH outputs into your Executive Briefing (format below).
        
        EXECUTIVE BRIEFING FORMAT:
        ══════════════════════════════════════════
        🔍 SHADOW AUDIT REPORT — [Company/Period]
        ══════════════════════════════════════════
        
        📊 FINANCIAL SNAPSHOT
        • Total Spend Analyzed: $X
        • Flagged Amount: $Y (Z% of total)
        • Critical Issues: N
        
        🚨 TOP RISKS (ranked by impact)
        1. [Risk + dollar impact + recommended action]
        2. ...
        
        💰 COST REDUCTION ROADMAP
        [Numbered list with estimated savings and owners]
        
        📧 VENDOR ACTIONS INITIATED
        [Summary of emails drafted by NegotiatorAgent]
        
        ✅ NEXT STEPS
        [3-5 concrete actions for the finance team this week]
        ══════════════════════════════════════════
        
        PRINCIPLES:
        - You are the CEO's financial conscience. Be blunt about what you find.
        - Every recommendation must have a dollar figure attached.
        - If something looks like fraud, say so explicitly.
        - Time-box the entire workflow: aim for a complete briefing in one session.
        - If only asked a quick question (not a full audit), answer directly without running full workflow.
        """;

    /**
     * Builds the CFO Root Agent with both specialists wired as AgentTools.
     *
     * @param model        Gemini model string
     * @param piiShield    Shared PII interceptor instance
     */
    public static LlmAgent build(String model, PIIShield piiShield) {
        log.info("[CFOAgent] Building root CFO agent with model: {}", model);

        // Build specialist agents
        LlmAgent auditorAgent    = AuditorAgent.build(model, piiShield);
        LlmAgent negotiatorAgent = NegotiatorAgent.build(model, piiShield);

        // Wrap specialists as AgentTools for the CFO to call
        AgentTool auditorTool    = AgentTool.create(auditorAgent);
        AgentTool negotiatorTool = AgentTool.create(negotiatorAgent);

        LlmAgent cfoAgent = LlmAgent.builder()
                .name(AGENT_NAME)
                .description("CFO Root Agent — orchestrates the Shadow Auditor system. " +
                        "Delegates PDF expense analysis to AuditorAgent and vendor action " +
                        "emails to NegotiatorAgent. Produces C-suite executive briefings.")
                .model(model)
                .instruction(SYSTEM_PROMPT)
                .tools(List.of(auditorTool, negotiatorTool))
                .beforeModelCallback(piiShield)
                .build();

        log.info("[CFOAgent] Root agent built. Sub-agents registered: AuditorAgent, NegotiatorAgent");
        return cfoAgent;
    }
}