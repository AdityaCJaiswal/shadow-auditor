package org.auditor.controller;

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
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = "*") // Prevents CORS blocks from your Vite dev server
public class AuditController {

    private final InMemoryRunner runner;
    private final Map<String, Session> activeSessions = new ConcurrentHashMap<>();

    public AuditController() {
        // Initialize your ADK pipeline exactly once
        PIIShield piiShield = new PIIShield();
        String model = AppConfig.get("gemini.model", "gemini-2.5-flash");
        LlmAgent cfoAgent = CFOAgent.build(model, piiShield);
        this.runner = new InMemoryRunner(cfoAgent, "ShadowAuditorApp");
    }

    @PostMapping("/run")
    public Map<String, String> startAudit() {
        // 1. Create a unique session for this run
        String userId = "cfo_user_" + UUID.randomUUID().toString().substring(0, 5);
        Session session = runner.sessionService().createSession("ShadowAuditorApp", userId).blockingGet();
        activeSessions.put(session.id(), session);

        return Map.of("sessionId", session.id(), "status", "ready");
    }

    @GetMapping(value = "/stream/{sessionId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAudit(@PathVariable String sessionId) {
        SseEmitter emitter = new SseEmitter(180000L); // 3 minute timeout
        Session session = activeSessions.get(sessionId);

        if (session == null) {
            emitter.completeWithError(new RuntimeException("Invalid Session"));
            return emitter;
        }

        String pdfPath = "src/main/resources/sample_expenses.pdf"; // Hardcoded for demo speed
        String prompt = "Execute full Shadow Audit workflow on: " + pdfPath;
        Content userContent = Content.builder().role("user").parts(List.of(Part.fromText(prompt))).build();

        // 2. Run the ADK Agent Pipeline asynchronously
        Flowable<Event> events = runner.runAsync(session.userId(), session.id(), userContent);

        // 3. Pipe RxJava events directly to the frontend via SSE
        events.subscribe(
            event -> {
                if (event.content().isPresent() && event.content().get().parts().isPresent()) {
                    for (var part : event.content().get().parts().get()) {
                        if (part.text().isPresent()) {
                            // Send raw tokens to React
                            emitter.send(SseEmitter.event().name("message").data(part.text().get()));
                        }
                    }
                }
            },
            error -> {
                emitter.send(SseEmitter.event().name("error").data(error.getMessage()));
                emitter.completeWithError(error);
            },
            () -> {
                emitter.send(SseEmitter.event().name("done").data("AUDIT_COMPLETE"));
                emitter.complete();
            }
        );

        return emitter;
    }
}