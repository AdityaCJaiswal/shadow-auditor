package org.auditor;

import org.auditor.agents.CFOAgent;
import org.auditor.config.AppConfig;
import org.auditor.interceptors.PIIShield;
import com.google.adk.agents.LlmAgent;
import com.google.adk.events.Event;
import com.google.adk.runner.InMemoryRunner;
import com.google.adk.sessions.Session;
import com.google.genai.types.Content;
import com.google.genai.types.Part;
import io.reactivex.rxjava3.core.Flowable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Scanner;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  THE SHADOW AUDITOR  –  Main Entry Point                     ║
 * ║                                                              ║
 * ║  Finance PS #4: AI agent that monitors company expenses,     ║
 * ║  detects unusual transactions, categorizes spend patterns,   ║
 * ║  and suggests cost reduction actions.                        ║
 * ║                                                              ║
 * ║  Stack: Java 21 · Google ADK 0.2.x · LangChain4j · PDFBox   ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Architecture:
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  User Input                                              │
 *  │       │                                                  │
 *  │       ▼                                                  │
 *  │  PIIShield (beforeModelCallback) ──► Masks PII in prompt │
 *  │       │                                                  │
 *  │       ▼                                                  │
 *  │  CFO Root Agent (LlmAgent)                               │
 *  │    ├── AgentTool: AuditorAgent ──► FinanceTools (PDFBox) │
 *  │    └── AgentTool: NegotiatorAgent ──► Email drafting     │
 *  │       │                                                  │
 *  │       ▼                                                  │
 *  │  InMemoryRunner + InMemorySessionService                 │
 *  │       │                                                  │
 *  │       ▼                                                  │
 *  │  Streamed Response to Console                            │
 *  └─────────────────────────────────────────────────────────┘
 */
public class ShadowAuditorApp {

    private static final Logger log = LoggerFactory.getLogger(ShadowAuditorApp.class);

    private static final String APP_NAME    = AppConfig.get("session.app-name", "ShadowAuditorApp");
    private static final String USER_ID     = "cfo_user_001";
    private static final String MODEL       = AppConfig.get("gemini.model", "gemini-1.5-flash");

    // ── ANSI colors for console output ────────────────────────────────────────
    private static final String RESET  = "\u001B[0m";
    private static final String BOLD   = "\u001B[1m";
    private static final String CYAN   = "\u001B[36m";
    private static final String YELLOW = "\u001B[33m";
    private static final String GREEN  = "\u001B[32m";
    private static final String RED    = "\u001B[31m";
    private static final String DIM    = "\u001B[2m";

    public static void main(String[] args) {
        printBanner();

        // 1. Validate API key early
        String apiKey;
        try {
            apiKey = AppConfig.resolveApiKey();
            log.info("API key resolved successfully.");
        } catch (IllegalStateException e) {
            System.err.println(RED + "✘  " + e.getMessage() + RESET);
            System.err.println(DIM + "   Export GOOGLE_API_KEY=your_key_here" + RESET);
            System.exit(1);
            return;
        }

        // 2. Resolve PDF path from CLI args or config
        String pdfPath = resolvePdfPath(args);
        log.info("Target PDF: {}", pdfPath);

        // 3. Build shared PII interceptor
        PIIShield piiShield = new PIIShield();
        log.info("PIIShield interceptor initialized.");

        // 4. Build root CFO agent (which internally creates AuditorAgent + NegotiatorAgent)
        LlmAgent cfoAgent = CFOAgent.build(MODEL, piiShield);

        // 5. Wire up InMemoryRunner (handles session + event routing)
        InMemoryRunner runner = new InMemoryRunner(cfoAgent, APP_NAME);
        log.info("InMemoryRunner initialized with app: {}", APP_NAME);

        // 6. Create a session
        Session session = runner.sessionService()
                .createSession(APP_NAME, USER_ID)
                .blockingGet();
        log.info("Session created: {}", session.id());

        System.out.println(GREEN + "✔  Shadow Auditor ready. Session: " + session.id() + RESET);
        System.out.println(DIM + "   Model: " + MODEL + "  |  PII Shield: ACTIVE" + RESET);
        System.out.println();

        // 7. Interactive REPL or single-shot mode
        if (args.length > 0 && args[0].equals("--interactive")) {
            runInteractiveMode(runner, session, pdfPath);
        } else {
            runAuditMode(runner, session, pdfPath);
        }
    }

    // ── Single-shot full audit mode ───────────────────────────────────────────

    private static void runAuditMode(InMemoryRunner runner, Session session, String pdfPath) {
        String initialPrompt = buildAuditPrompt(pdfPath);

        System.out.println(CYAN + BOLD + "▶  Initiating Shadow Audit..." + RESET);
        System.out.println(DIM + "   PDF: " + pdfPath + RESET);
        System.out.println(DIM + "─".repeat(70) + RESET);
        System.out.println();

        runQuery(runner, session, initialPrompt);

        System.out.println();
        System.out.println(DIM + "─".repeat(70) + RESET);
        System.out.println(GREEN + "✔  Audit complete. Session: " + session.id() + RESET);
    }

    // ── Interactive REPL mode ─────────────────────────────────────────────────

    private static void runInteractiveMode(InMemoryRunner runner, Session session, String pdfPath) {
        System.out.println(CYAN + BOLD + "▶  Interactive Mode Active" + RESET);
        System.out.println(DIM + "   Type your question or 'audit' to run a full analysis. 'quit' to exit." + RESET);
        System.out.println();

        Scanner scanner = new Scanner(System.in);
        while (true) {
            System.out.print(YELLOW + "CFO> " + RESET);
            String input = scanner.nextLine().trim();

            if (input.equalsIgnoreCase("quit") || input.equalsIgnoreCase("exit")) {
                System.out.println(GREEN + "Session closed. Goodbye." + RESET);
                break;
            }

            if (input.equalsIgnoreCase("audit") || input.isBlank()) {
                input = buildAuditPrompt(pdfPath);
            }

            System.out.println(DIM + "─".repeat(70) + RESET);
            runQuery(runner, session, input);
            System.out.println(DIM + "─".repeat(70) + RESET);
            System.out.println();
        }
        scanner.close();
    }

    // ── Core query execution with streaming ──────────────────────────────────

    private static void runQuery(InMemoryRunner runner, Session session, String userMessage) {
        Content userContent = Content.builder()
                .role("user")
                .parts(List.of(Part.fromText(userMessage)))
                .build();

        try {
            Flowable<Event> events = runner.runAsync(USER_ID, session.id(), userContent);

            events.blockingForEach(event -> {
                // Stream text tokens as they arrive
                if (event.content().isPresent()) {
                    Content content = event.content().get();
                    if (content.parts() != null && content.parts().isPresent()) {
                        for (var part : content.parts().get()) {
                            if (part.text().isPresent() && !part.text().get().isBlank()) {
                                System.out.print(part.text().get());
                                System.out.flush();
                            }
                        }
                    }
                }

                // Log event author for debug tracing
                if (event.author() != null) {
                    log.debug("[Runner] Event from: {}", event.author());
                }
            });

        } catch (Exception e) {
            log.error("Error during agent execution: {}", e.getMessage(), e);
            System.err.println(RED + "\n✘  Execution error: " + e.getMessage() + RESET);
            if (e.getMessage() != null && e.getMessage().contains("API key")) {
                System.err.println(DIM + "   Verify your GOOGLE_API_KEY is valid and has Gemini API access." + RESET);
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static String buildAuditPrompt(String pdfPath) {
        return String.format("""
            Please perform a complete Shadow Audit of our company expenses.
            
            The expense report PDF is located at: %s
            
            Execute your full audit workflow:
            1. Use the AuditorAgent to parse the PDF, detect all anomalies, categorize spending, \
               and generate cost reduction suggestions.
            2. Based on the audit findings, use the NegotiatorAgent to draft vendor action emails \
               for the highest-severity issues found (prioritize CRITICAL and HIGH findings).
            3. Synthesize everything into a complete Executive Briefing in your standard format.
            
            Be thorough, specific with dollar amounts, and direct about any financial risks you find.
            """, pdfPath);
    }

    private static String resolvePdfPath(String[] args) {
        // CLI: --pdf-path=/path/to/expenses.pdf
        for (String arg : args) {
            if (arg.startsWith("--pdf-path=")) {
                return arg.substring("--pdf-path=".length());
            }
        }
        // Config file fallback
        return AppConfig.get("finance.sample-pdf", "src/main/resources/sample_expenses.pdf");
    }

    private static void printBanner() {
        System.out.println();
        System.out.println(CYAN + BOLD + "╔══════════════════════════════════════════════════════════╗" + RESET);
        System.out.println(CYAN + BOLD + "║                                                          ║" + RESET);
        System.out.println(CYAN + BOLD + "║   💀  THE SHADOW AUDITOR  –  Finance Intelligence v1.0   ║" + RESET);
        System.out.println(CYAN + BOLD + "║                                                          ║" + RESET);
        System.out.println(CYAN + BOLD + "║   Stack: Java 21 · Google ADK 0.2.x · PDFBox · Gemini   ║" + RESET);
        System.out.println(CYAN + BOLD + "║   Agents: CFO (Root) → Auditor + Negotiator              ║" + RESET);
        System.out.println(CYAN + BOLD + "║   Shield: PII Masking ACTIVE on all prompts              ║" + RESET);
        System.out.println(CYAN + BOLD + "║                                                          ║" + RESET);
        System.out.println(CYAN + BOLD + "╚══════════════════════════════════════════════════════════╝" + RESET);
        System.out.println();
    }
}