import { useState, useEffect, useRef, useCallback } from "react";

const COLORS = {
  critical: "#E24B4A",
  high: "#EF9F27",
  medium: "#378ADD",
  low: "#639922",
  bg: "var(--color-background-primary)",
  bgSecondary: "var(--color-background-secondary)",
  bgTertiary: "var(--color-background-tertiary)",
  border: "var(--color-border-tertiary)",
  borderSecondary: "var(--color-border-secondary)",
  text: "var(--color-text-primary)",
  textSecondary: "var(--color-text-secondary)",
  textMuted: "var(--color-text-tertiary)",
  success: "var(--color-background-success)",
  successText: "var(--color-text-success)",
  danger: "var(--color-background-danger)",
  dangerText: "var(--color-text-danger)",
  warning: "var(--color-background-warning)",
  warningText: "var(--color-text-warning)",
  info: "var(--color-background-info)",
  infoText: "var(--color-text-info)",
};

const MOCK_TRANSACTIONS = [
  { id: "TXN-001", date: "2025-04-01", vendor: "AWS", category: "Cloud", amount: 12450, dept: "Engineering", ref: "INV-AWS-001", status: "NORMAL" },
  { id: "TXN-002", date: "2025-04-15", vendor: "AWS", category: "Cloud", amount: 18200, dept: "Engineering", ref: "INV-AWS-002", status: "SPIKE" },
  { id: "TXN-003", date: "2025-04-05", vendor: "Zoom", category: "SaaS", amount: 3200, dept: "IT", ref: "INV-ZM-001", status: "DUPLICATE" },
  { id: "TXN-004", date: "2025-04-05", vendor: "Zoom", category: "SaaS", amount: 3200, dept: "IT", ref: "INV-ZM-002", status: "DUPLICATE" },
  { id: "TXN-005", date: "2025-04-07", vendor: "XYZ Consulting", category: "Professional", amount: 25000, dept: "Finance", ref: "INV-XYZ-001", status: "FLAGGED" },
  { id: "TXN-006", date: "2025-04-10", vendor: "GitHub", category: "SaaS", amount: 1200, dept: "Engineering", ref: "INV-GH-001", status: "NORMAL" },
  { id: "TXN-007", date: "2025-04-12", vendor: "Delta Airlines", category: "Travel", amount: 8750, dept: "Sales", ref: "INV-DL-001", status: "NORMAL" },
  { id: "TXN-008", date: "2025-04-14", vendor: "Marriott Hotels", category: "Travel", amount: 4200, dept: "Sales", ref: "INV-MR-001", status: "NORMAL" },
  { id: "TXN-009", date: "2025-04-16", vendor: "Datadog", category: "Monitoring", amount: 5600, dept: "Engineering", ref: "INV-DD-001", status: "NORMAL" },
  { id: "TXN-010", date: "2025-04-18", vendor: "QuickPay LLC", category: "Vendor", amount: 15000, dept: "Operations", ref: "INV-QP-001", status: "UNRECOGNIZED_VENDOR" },
  { id: "TXN-011", date: "2025-04-20", vendor: "Salesforce", category: "CRM", amount: 9800, dept: "Sales", ref: "INV-SF-001", status: "NORMAL" },
  { id: "TXN-012", date: "2025-04-22", vendor: "Slack", category: "SaaS", amount: 2100, dept: "All", ref: "INV-SL-001", status: "NORMAL" },
  { id: "TXN-013", date: "2025-04-24", vendor: "Microsoft Azure", category: "Cloud", amount: 6700, dept: "IT", ref: "INV-AZ-001", status: "NORMAL" },
  { id: "TXN-014", date: "2025-04-26", vendor: "FastPay Services", category: "Vendor", amount: 48000, dept: "Finance", ref: "INV-FP-001", status: "FLAGGED" },
  { id: "TXN-015", date: "2025-04-28", vendor: "Figma", category: "Design", amount: 1800, dept: "Product", ref: "INV-FG-001", status: "NORMAL" },
  { id: "TXN-016", date: "2025-05-01", vendor: "AWS", category: "Cloud", amount: 13100, dept: "Engineering", ref: "INV-AWS-003", status: "NORMAL" },
  { id: "TXN-017", date: "2025-05-05", vendor: "PagerDuty", category: "Monitoring", amount: 4500, dept: "Engineering", ref: "INV-PD-001", status: "NORMAL" },
  { id: "TXN-018", date: "2025-05-10", vendor: "Hertz Car Rental", category: "Travel", amount: 3800, dept: "Sales", ref: "INV-HZ-001", status: "NORMAL" },
  { id: "TXN-019", date: "2025-05-15", vendor: "ShadowVendor Inc", category: "Unknown", amount: 12500, dept: "Unknown", ref: "INV-SV-001", status: "UNRECOGNIZED_VENDOR" },
  { id: "TXN-020", date: "2025-05-20", vendor: "Cloudflare", category: "Infrastructure", amount: 2200, dept: "Engineering", ref: "INV-CF-001", status: "NORMAL" },
];

const MOCK_FINDINGS = [
  { id: "F-001", type: "DUPLICATE_CHARGE", severity: "CRITICAL", vendor: "Zoom", amount: 3200, description: "Identical charge $3,200 billed twice on 2025-04-05 within minutes. INV-ZM-001 and INV-ZM-002.", recommendation: "Initiate chargeback request immediately.", txns: ["TXN-003", "TXN-004"] },
  { id: "F-002", type: "PRICE_SPIKE", severity: "HIGH", vendor: "AWS", amount: 18200, description: "AWS charge $18,200 is 46.2% above vendor mean of $12,450. Unexplained usage surge.", recommendation: "Request itemized usage report and consider Reserved Instances.", txns: ["TXN-002"] },
  { id: "F-003", type: "LARGE_TRANSACTION", severity: "HIGH", vendor: "FastPay Services", amount: 48000, description: "$48,000 single vendor payment with no contract reference on file. Requires CFO sign-off.", recommendation: "Halt payment pending contract verification.", txns: ["TXN-014"] },
  { id: "F-004", type: "UNRECOGNIZED_VENDOR", severity: "MEDIUM", vendor: "ShadowVendor Inc", amount: 12500, description: "Vendor not in trusted whitelist. No purchase order or approval trail found.", recommendation: "Freeze payment and issue verification notice to vendor.", txns: ["TXN-019"] },
  { id: "F-005", type: "UNRECOGNIZED_VENDOR", severity: "MEDIUM", vendor: "QuickPay LLC", amount: 15000, description: "Vendor not in approved vendor registry. $15K payment to unverified entity.", recommendation: "Immediate cancellation notice and vendor onboarding review.", txns: ["TXN-010"] },
  { id: "F-006", type: "LARGE_TRANSACTION", severity: "HIGH", vendor: "XYZ Consulting", amount: 25000, description: "$25,000 consulting invoice without SOW reference. Finance dept authorization unclear.", recommendation: "Request Statement of Work and approval chain before releasing funds.", txns: ["TXN-005"] },
];

const MOCK_EMAILS = [
  {
    id: "E-001",
    type: "PRICE_DISPUTE",
    vendor: "Zoom",
    subject: "Urgent: Duplicate Charge Dispute — INV-ZM-001 & INV-ZM-002 — $3,200 Chargeback Required",
    priority: "HIGH",
    to: "billing@zoom.us",
    body: `Dear Zoom Billing Team,

We are writing to formally dispute a duplicate charge on our account (Account: [ACCT-MASKED]).

On April 5, 2025, two identical charges of $3,200.00 each were processed within minutes of each other:
• Invoice INV-ZM-001 — $3,200.00 — April 5, 2025 09:14 UTC
• Invoice INV-ZM-002 — $3,200.00 — April 5, 2025 09:27 UTC

Only one charge is contractually authorized under our Enterprise agreement. The duplicate represents an unauthorized debit of $3,200.00.

We require the following within 5 business days:
1. Written confirmation of the duplicate charge
2. Full refund of $3,200.00 to our account on file
3. Root cause explanation to prevent recurrence

Failure to resolve this within the stated timeline will result in escalation to our banking partner for a formal chargeback and potential review of our Zoom enterprise agreement.

Regards,
Finance Team — ACME Corp`,
  },
  {
    id: "E-002",
    type: "CANCELLATION_NOTICE",
    vendor: "ShadowVendor Inc",
    subject: "Payment Hold & Vendor Verification Required — INV-SV-001 — $12,500",
    priority: "HIGH",
    to: "accounts@shadowvendor.com",
    body: `To Whom It May Concern,

Our internal audit system has flagged invoice INV-SV-001 ($12,500.00 dated May 15, 2025) as requiring immediate verification.

ShadowVendor Inc does not appear in our approved vendor registry and we have no record of a signed contract, purchase order, or procurement approval authorizing this payment.

Effective immediately, payment of $12,500.00 is SUSPENDED pending receipt of the following:
• Signed vendor agreement or contract reference
• Valid W-9 / tax documentation
• Approval chain from ACME Corp procurement

You have 10 business days to provide this documentation. If unresolved, this matter will be referred to our legal and compliance teams.

Regards,
CFO Office — ACME Corp`,
  },
  {
    id: "E-003",
    type: "RENEGOTIATION",
    vendor: "AWS",
    subject: "AWS Contract Review — Cost Optimization Proposal — Q3 2025",
    priority: "NORMAL",
    to: "enterprise@aws.amazon.com",
    body: `Dear AWS Enterprise Account Team,

Our Q2 2025 audit has identified a 46% month-over-month spend increase on our AWS account, from $12,450 (April) to $18,200 (April spike), with our trailing 90-day average at $14,583/month.

At this trajectory, our annual AWS spend will reach approximately $175,000. We believe there is a significant opportunity to optimize costs through:

1. Reserved Instance commitments (1-year or 3-year) for predictable workloads
2. Savings Plans for compute-flexible resources
3. Right-sizing review for over-provisioned instances

We would like to schedule a cost optimization review with your solutions architecture team within the next 2 weeks. We are also evaluating competitive proposals from Azure and GCP as part of our annual infrastructure review.

We value our partnership with AWS and would prefer to resolve this through a structured optimization plan rather than a cloud migration.

Please respond by [Date + 14 days] to schedule.

Regards,
CFO — ACME Corp`,
  },
];

const SPEND_BY_CATEGORY = [
  { category: "Cloud", amount: 50450, color: "#378ADD" },
  { category: "Vendor", amount: 63000, color: "#E24B4A" },
  { category: "Professional", amount: 25000, color: "#EF9F27" },
  { category: "Travel", amount: 16750, color: "#1D9E75" },
  { category: "SaaS", amount: 6500, color: "#7F77DD" },
  { category: "Monitoring", amount: 10100, color: "#D4537E" },
  { category: "CRM", amount: 9800, color: "#639922" },
  { category: "Other", amount: 7200, color: "#888780" },
];

const SPEND_BY_VENDOR = [
  { vendor: "FastPay Services", amount: 48000 },
  { vendor: "XYZ Consulting", amount: 25000 },
  { vendor: "AWS", amount: 43750 },
  { vendor: "QuickPay LLC", amount: 15000 },
  { vendor: "ShadowVendor Inc", amount: 12500 },
  { vendor: "Salesforce", amount: 9800 },
  { vendor: "Delta Airlines", amount: 8750 },
  { vendor: "Datadog", amount: 5600 },
];

const AUDIT_LOG_STEPS = [
  { agent: "CFO", msg: "Audit request received. Delegating to AuditorAgent...", delay: 400 },
  { agent: "SYSTEM", msg: "PIIShield interceptor active. Scanning prompt for sensitive identifiers...", delay: 900 },
  { agent: "SYSTEM", msg: "PIIShield: CARD_NUMBER pattern triggered masking.", delay: 1300 },
  { agent: "SYSTEM", msg: "PIIShield: ROUTING pattern triggered masking.", delay: 1600 },
  { agent: "AUDITOR", msg: "Invoking parsePdfExpenses() — parsing Q2 expense PDF...", delay: 2100 },
  { agent: "AUDITOR", msg: "parsePdfExpenses() complete: 20 transactions extracted, $188,800 total.", delay: 3000 },
  { agent: "AUDITOR", msg: "Invoking detectAnomalies() — running 4 detection passes...", delay: 3500 },
  { agent: "AUDITOR", msg: "Pass 1/4: Price spike detection — vendor baseline comparison in progress...", delay: 4200 },
  { agent: "AUDITOR", msg: "SPIKE detected: AWS INV-AWS-002 — $18,200 is 46.2% above mean ($12,450).", delay: 4900 },
  { agent: "AUDITOR", msg: "Pass 2/4: Duplicate charge detection — same vendor + amount within 24hr...", delay: 5400 },
  { agent: "AUDITOR", msg: "DUPLICATE detected: Zoom — INV-ZM-001 and INV-ZM-002 ($3,200 each, same day).", delay: 6000 },
  { agent: "AUDITOR", msg: "Pass 3/4: Unrecognized vendor scan — checking against 40+ trusted whitelist...", delay: 6500 },
  { agent: "AUDITOR", msg: "UNRECOGNIZED: ShadowVendor Inc ($12,500) — not in approved registry.", delay: 7100 },
  { agent: "AUDITOR", msg: "UNRECOGNIZED: QuickPay LLC ($15,000) — not in approved registry.", delay: 7600 },
  { agent: "AUDITOR", msg: "Pass 4/4: Large transaction scan (threshold: $10,000)...", delay: 8100 },
  { agent: "AUDITOR", msg: "LARGE_TXN: FastPay Services $48,000 — no contract reference on file.", delay: 8600 },
  { agent: "AUDITOR", msg: "LARGE_TXN: XYZ Consulting $25,000 — missing SOW reference.", delay: 9000 },
  { agent: "AUDITOR", msg: "Invoking categorizeSpending() — bucketing by category and vendor...", delay: 9500 },
  { agent: "AUDITOR", msg: "Invoking generateCostSuggestions() — generating prioritized recommendations...", delay: 10200 },
  { agent: "AUDITOR", msg: "AuditorAgent complete. 6 findings, $106,700 flagged (56.5% of total spend).", delay: 11000 },
  { agent: "CFO", msg: "Audit complete. Forwarding high-severity findings to NegotiatorAgent...", delay: 11500 },
  { agent: "NEGOTIATOR", msg: "NegotiatorAgent received 3 priority action items.", delay: 12000 },
  { agent: "NEGOTIATOR", msg: "Drafting PRICE_DISPUTE for Zoom (CRITICAL — duplicate $3,200)...", delay: 12500 },
  { agent: "NEGOTIATOR", msg: "Drafting CANCELLATION_NOTICE for ShadowVendor Inc (MEDIUM — unrecognized)...", delay: 13200 },
  { agent: "NEGOTIATOR", msg: "Drafting RENEGOTIATION request for AWS (HIGH — spend spike)...", delay: 13900 },
  { agent: "NEGOTIATOR", msg: "3 vendor action emails generated. Stored to session: vendor_emails.", delay: 14600 },
  { agent: "CFO", msg: "Executive briefing synthesis complete. Shadow Audit Report ready.", delay: 15200 },
];

// ─── Small components ─────────────────────────────────────────────────────────

function SeverityBadge({ severity }) {
  const map = {
    CRITICAL: { bg: "#FCEBEB", color: "#A32D2D", border: "#F09595" },
    HIGH: { bg: "#FAEEDA", color: "#854F0B", border: "#FAC775" },
    MEDIUM: { bg: "#E6F1FB", color: "#185FA5", border: "#85B7EB" },
    LOW: { bg: "#EAF3DE", color: "#3B6D11", border: "#97C459" },
  };
  const s = map[severity] || map.LOW;
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: "2px 8px",
      borderRadius: 4, background: s.bg, color: s.color,
      border: `0.5px solid ${s.border}`, letterSpacing: "0.04em",
      textTransform: "uppercase",
    }}>{severity}</span>
  );
}

function StatusBadge({ status }) {
  const map = {
    NORMAL: { bg: "#EAF3DE", color: "#3B6D11", label: "Normal" },
    SPIKE: { bg: "#FAEEDA", color: "#854F0B", label: "Spike" },
    DUPLICATE: { bg: "#FCEBEB", color: "#A32D2D", label: "Duplicate" },
    FLAGGED: { bg: "#FAEEDA", color: "#854F0B", label: "Flagged" },
    UNRECOGNIZED_VENDOR: { bg: "#E6F1FB", color: "#185FA5", label: "Unknown Vendor" },
  };
  const s = map[status] || map.NORMAL;
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: "2px 8px",
      borderRadius: 4, background: s.bg, color: s.color, letterSpacing: "0.03em",
    }}>{s.label}</span>
  );
}

function AgentTag({ agent }) {
  const map = {
    CFO: { bg: "#EEEDFE", color: "#3C3489", label: "CFO" },
    AUDITOR: { bg: "#E1F5EE", color: "#085041", label: "Auditor" },
    NEGOTIATOR: { bg: "#FAEEDA", color: "#854F0B", label: "Negotiator" },
    SYSTEM: { bg: "#F1EFE8", color: "#5F5E5A", label: "System" },
  };
  const s = map[agent] || map.SYSTEM;
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: "1px 6px",
      borderRadius: 3, background: s.bg, color: s.color,
      minWidth: 68, textAlign: "center", display: "inline-block",
      letterSpacing: "0.04em", textTransform: "uppercase",
    }}>{s.label}</span>
  );
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: "var(--color-background-secondary)",
      borderRadius: "var(--border-radius-md)",
      padding: "1rem",
      flex: 1, minWidth: 140,
    }}>
      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 500, margin: 0, color: color || "var(--color-text-primary)" }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "2px 0 0" }}>{sub}</p>}
    </div>
  );
}

// ─── Donut chart (pure SVG) ───────────────────────────────────────────────────

function DonutChart({ data, total }) {
  const size = 160, cx = 80, cy = 80, r = 60, stroke = 22;
  let cumulative = 0;
  const segments = data.map(d => {
    const pct = d.amount / total;
    const start = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;
    const end = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
    const large = pct > 0.5 ? 1 : 0;
    return { ...d, path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, pct };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {segments.map((s, i) => (
        <path key={i} d={s.path} fill="none" stroke={s.color} strokeWidth={stroke}
          strokeLinecap="butt" opacity={0.9} />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fill="var(--color-text-secondary)" fontFamily="var(--font-sans)">Total</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={14} fontWeight={500} fill="var(--color-text-primary)" fontFamily="var(--font-sans)">
        ${(total / 1000).toFixed(0)}K
      </text>
    </svg>
  );
}

// ─── Bar chart (horizontal, pure SVG) ─────────────────────────────────────────

function HBarChart({ data }) {
  const max = Math.max(...data.map(d => d.amount));
  const barH = 20, gap = 10, labelW = 130, barMaxW = 180, amtW = 60;
  const totalH = data.length * (barH + gap);

  return (
    <svg viewBox={`0 0 ${labelW + barMaxW + amtW + 10} ${totalH}`} style={{ width: "100%", height: totalH }}>
      {data.map((d, i) => {
        const y = i * (barH + gap);
        const w = Math.max(2, (d.amount / max) * barMaxW);
        const flagged = d.amount >= 10000;
        return (
          <g key={i}>
            <text x={labelW - 8} y={y + barH / 2 + 4} textAnchor="end" fontSize={11}
              fill="var(--color-text-secondary)" fontFamily="var(--font-sans)">
              {d.vendor.length > 16 ? d.vendor.slice(0, 15) + "…" : d.vendor}
            </text>
            <rect x={labelW} y={y} width={w} height={barH} rx={3}
              fill={flagged ? "#E24B4A" : "#378ADD"} opacity={0.85} />
            <text x={labelW + w + 6} y={y + barH / 2 + 4} fontSize={11} fontWeight={500}
              fill={flagged ? "#A32D2D" : "var(--color-text-primary)"} fontFamily="var(--font-sans)">
              ${(d.amount / 1000).toFixed(0)}K
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Drop zone ───────────────────────────────────────────────────────────────

function DropZone({ onFile }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => ref.current.click()}
      style={{
        border: `1.5px dashed ${drag ? "#378ADD" : "var(--color-border-secondary)"}`,
        borderRadius: "var(--border-radius-lg)",
        padding: "2.5rem 2rem",
        textAlign: "center",
        cursor: "pointer",
        background: drag ? "var(--color-background-info)" : "var(--color-background-secondary)",
        transition: "all 0.15s ease",
      }}
    >
      <input ref={ref} type="file" accept=".pdf,.xlsx,.csv" style={{ display: "none" }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
      <div style={{ fontSize: 28, marginBottom: 8 }}>
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth={1.5}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
        Drop PDF or Excel file here
      </p>
      <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: 0 }}>
        .pdf, .xlsx, .csv — or click to browse
      </p>
    </div>
  );
}

// ─── Live audit log ───────────────────────────────────────────────────────────

function AuditLog({ running, steps, current }) {
  const bottomRef = useRef();
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [current]);

  if (!running && current === 0) return null;

  return (
    <div style={{
      background: "var(--color-background-secondary)",
      borderRadius: "var(--border-radius-lg)",
      border: "0.5px solid var(--color-border-tertiary)",
      padding: "1rem",
      maxHeight: 260,
      overflowY: "auto",
      fontFamily: "var(--font-mono)",
    }}>
      {steps.slice(0, current).map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
          <AgentTag agent={s.agent} />
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{s.msg}</span>
        </div>
      ))}
      {running && current < steps.length && (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <AgentTag agent={steps[current]?.agent || "SYSTEM"} />
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>processing…</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("upload");
  const [file, setFile] = useState(null);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditDone, setAuditDone] = useState(false);
  const [logStep, setLogStep] = useState(0);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [txnFilter, setTxnFilter] = useState("ALL");
  // Add this inside the App component, right under your state declarations
  const [realFindings, setRealFindings] = useState(MOCK_FINDINGS); // Fallback to mock

  useEffect(() => {
    // If your Spring boot endpoint is ready:
    fetch('/api/audit/findings/latest')
      .then(res => res.json())
      .then(data => {
         if(data && data.length > 0) setRealFindings(data);
      })
      .catch(err => console.log("Backend offline, using fallback mock data."));
  }, []);
  const runAudit = useCallback(async () => {
    if (auditRunning) return;
    setAuditRunning(true);
    setAuditDone(false);
    setTab("live");

    try {
      // 1. Tell Spring Boot to create a session
      const res = await fetch("http://localhost:8080/api/audit/run", { method: "POST" });
      const data = await res.json();
      
      // 2. Connect to the Live SSE Stream
      const eventSource = new EventSource(`http://localhost:8080/api/audit/stream/${data.sessionId}`);
      
      eventSource.onmessage = (event) => {
        // Here you would append the incoming tokens to your UI log state
        console.log("Incoming token:", event.data);
      };

      eventSource.addEventListener("done", () => {
        setAuditRunning(false);
        setAuditDone(true);
        eventSource.close();
      });

      eventSource.onerror = (err) => {
        console.error("Stream error", err);
        eventSource.close();
      };

    } catch (err) {
      console.error("Backend offline", err);
    }
  }, [auditRunning]);

  const handleFile = (f) => {
    setFile(f);
  };

  const totalFlagged = MOCK_FINDINGS.reduce((s, f) => s + f.amount, 0);
  const totalSpend = 188800;

  const filteredTxns = txnFilter === "ALL"
    ? MOCK_TRANSACTIONS
    : MOCK_TRANSACTIONS.filter(t => t.status === txnFilter);

  const tabs = [
    { id: "upload", label: "Upload" },
    { id: "live", label: "Live Audit" },
    { id: "findings", label: "Findings", badge: MOCK_FINDINGS.length },
    { id: "spend", label: "Spend Analysis" },
    { id: "transactions", label: "Transactions" },
    { id: "emails", label: "Vendor Emails", badge: MOCK_EMAILS.length },
  ];

  const s = {
    root: {
      fontFamily: "var(--font-sans)",
      color: "var(--color-text-primary)",
      maxWidth: 1100,
      margin: "0 auto",
      padding: "0 0 3rem",
    },
    header: {
      borderBottom: "0.5px solid var(--color-border-tertiary)",
      paddingBottom: "1rem",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap",
    },
    headerLeft: { display: "flex", alignItems: "center", gap: 12 },
    skull: {
      width: 36, height: 36, background: "#2C2C2A",
      borderRadius: 8, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 18,
    },
    title: { fontSize: 18, fontWeight: 500, margin: 0 },
    subtitle: { fontSize: 12, color: "var(--color-text-tertiary)", margin: 0 },
    statusChip: {
      fontSize: 11, padding: "3px 10px", borderRadius: 20,
      background: auditDone ? "var(--color-background-success)" : auditRunning ? "#FAEEDA" : "var(--color-background-secondary)",
      color: auditDone ? "var(--color-text-success)" : auditRunning ? "#854F0B" : "var(--color-text-secondary)",
      border: `0.5px solid ${auditDone ? "var(--color-border-success)" : "var(--color-border-tertiary)"}`,
      fontWeight: 500,
    },
    tabBar: {
      display: "flex", gap: 0,
      borderBottom: "0.5px solid var(--color-border-tertiary)",
      marginBottom: "1.5rem",
      overflowX: "auto",
    },
    tab: (active) => ({
      padding: "8px 16px", fontSize: 13, fontWeight: active ? 500 : 400,
      color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
      borderBottom: active ? "2px solid var(--color-text-primary)" : "2px solid transparent",
      cursor: "pointer", background: "none", border: "none",
      borderBottomWidth: 2,
      borderBottomStyle: "solid",
      borderBottomColor: active ? "var(--color-text-primary)" : "transparent",
      whiteSpace: "nowrap",
      display: "flex", alignItems: "center", gap: 6,
    }),
    panel: { padding: "0" },
    sectionTitle: { fontSize: 13, fontWeight: 500, marginBottom: "1rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em" },
    card: {
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)",
      padding: "1.25rem",
      marginBottom: "1rem",
    },
    row: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "1rem" },
    btnPrimary: {
      padding: "8px 20px", fontSize: 13, fontWeight: 500,
      background: "#2C2C2A", color: "#fff", border: "none",
      borderRadius: "var(--border-radius-md)", cursor: "pointer",
    },
    btnSecondary: {
      padding: "8px 16px", fontSize: 13,
      background: "none", color: "var(--color-text-primary)",
      border: "0.5px solid var(--color-border-secondary)",
      borderRadius: "var(--border-radius-md)", cursor: "pointer",
    },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" },
    td: { padding: "10px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)", verticalAlign: "middle" },
  };

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.skull}>💀</div>
          <div>
            <p style={s.title}>Shadow Auditor</p>
            <p style={s.subtitle}>Finance Intelligence · Multi-Agent System</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={s.statusChip}>
            {auditDone ? "✓ Audit Complete" : auditRunning ? "⟳ Running" : "Ready"}
          </span>
          {auditDone && (
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              Q2 2025 · ACME Corp · {MOCK_TRANSACTIONS.length} txns
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabBar}>
        {tabs.map(t => (
          <button key={t.id} style={s.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
            {t.badge && (
              <span style={{
                fontSize: 10, fontWeight: 500, padding: "1px 5px",
                borderRadius: 10, background: "var(--color-background-secondary)",
                color: "var(--color-text-secondary)",
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div style={s.panel}>

        {/* ── Upload Tab ───────────────────────────────────────────────────── */}
        {tab === "upload" && (
          <div>
            <div style={s.row}>
              <MetricCard label="Status" value={auditDone ? "Complete" : "Pending"} sub="Q2 2025 report" />
              <MetricCard label="Total Spend" value="$188.8K" sub="20 transactions" />
              <MetricCard label="Flagged" value="$106.7K" sub="56.5% of total" color="#E24B4A" />
              <MetricCard label="Findings" value="6" sub="2 critical/high" color="#EF9F27" />
            </div>

            <div style={s.card}>
              <p style={{ ...s.sectionTitle, marginBottom: "0.75rem" }}>Upload Expense Report</p>
              <DropZone onFile={handleFile} />
              {file && (
                <div style={{
                  marginTop: 12, padding: "10px 14px", borderRadius: "var(--border-radius-md)",
                  background: "var(--color-background-success)", fontSize: 13,
                  color: "var(--color-text-success)", display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span>✓ {file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                  <button style={s.btnSecondary} onClick={() => setFile(null)}>Remove</button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button style={s.btnPrimary} onClick={runAudit} disabled={auditRunning}>
                {auditRunning ? "Running audit…" : auditDone ? "Re-run Audit" : "Run Shadow Audit →"}
              </button>
              <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
                Or run with sample data (Q2 2025 ACME Corp)
              </span>
            </div>

            <div style={{ ...s.card, marginTop: "1.5rem" }}>
              <p style={s.sectionTitle}>Spring Boot REST API Endpoints</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                {[
                  ["POST", "/api/audit/upload", "Upload PDF/Excel for analysis"],
                  ["POST", "/api/audit/run", "Trigger CFO agent pipeline"],
                  ["GET", "/api/audit/stream/{id}", "SSE stream — live agent logs"],
                  ["GET", "/api/audit/findings/{id}", "Fetch anomaly findings"],
                  ["GET", "/api/audit/spend/{id}", "Spend breakdown data"],
                  ["GET", "/api/emails/{id}", "Generated vendor emails"],
                ].map(([method, path, desc]) => (
                  <div key={path} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 3,
                      background: method === "POST" ? "#FAEEDA" : "#E1F5EE",
                      color: method === "POST" ? "#854F0B" : "#085041",
                      minWidth: 36, textAlign: "center",
                    }}>{method}</span>
                    <span style={{ color: "var(--color-text-primary)", minWidth: 220 }}>{path}</span>
                    <span style={{ color: "var(--color-text-tertiary)" }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Live Audit Tab ───────────────────────────────────────────────── */}
        {tab === "live" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <p style={{ ...s.sectionTitle, margin: 0 }}>Live Agent Pipeline</p>
              {!auditRunning && (
                <button style={s.btnPrimary} onClick={runAudit}>
                  {auditDone ? "Re-run" : "Start Audit →"}
                </button>
              )}
            </div>

            {/* Agent topology */}
            <div style={{ ...s.card, marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {[
                  { label: "PIIShield", sub: "beforeModelCallback", color: "#F1EFE8", tc: "#5F5E5A" },
                  { label: "→" },
                  { label: "CFOAgent", sub: "Root orchestrator", color: "#EEEDFE", tc: "#3C3489" },
                  { label: "→" },
                  { label: "AuditorAgent", sub: "4 FunctionTools", color: "#E1F5EE", tc: "#085041" },
                  { label: "+" },
                  { label: "NegotiatorAgent", sub: "Generative only", color: "#FAEEDA", tc: "#854F0B" },
                ].map((n, i) => n.label === "→" || n.label === "+" ? (
                  <span key={i} style={{ color: "var(--color-text-tertiary)", fontSize: 14 }}>{n.label}</span>
                ) : (
                  <div key={i} style={{
                    background: n.color, borderRadius: "var(--border-radius-md)",
                    padding: "6px 12px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: n.tc }}>{n.label}</div>
                    <div style={{ fontSize: 10, color: n.tc, opacity: 0.7 }}>{n.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <AuditLog running={auditRunning} steps={AUDIT_LOG_STEPS} current={logStep} />

            {auditDone && (
              <div style={{ ...s.card, marginTop: "1rem", borderColor: "var(--color-border-success)" }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-success)", margin: "0 0 8px" }}>
                  ✓ Audit complete — executive briefing ready
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={s.btnPrimary} onClick={() => setTab("findings")}>View Findings →</button>
                  <button style={s.btnSecondary} onClick={() => setTab("emails")}>View Emails →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Findings Tab ─────────────────────────────────────────────────── */}
        {tab === "findings" && (
          <div>
            <div style={s.row}>
              {[
                { label: "Critical", count: MOCK_FINDINGS.filter(f => f.severity === "CRITICAL").length, color: "#E24B4A" },
                { label: "High", count: MOCK_FINDINGS.filter(f => f.severity === "HIGH").length, color: "#EF9F27" },
                { label: "Medium", count: MOCK_FINDINGS.filter(f => f.severity === "MEDIUM").length, color: "#378ADD" },
                { label: "Flagged spend", count: "$" + (totalFlagged / 1000).toFixed(0) + "K", color: "#E24B4A" },
              ].map(m => (
                <MetricCard key={m.label} label={m.label} value={m.count} color={m.color} />
              ))}
            </div>

            <div style={s.card}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {["ID", "Type", "Severity", "Vendor", "Amount", "Description", "Action"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_FINDINGS.map(f => (
                    <tr key={f.id} style={{ cursor: "pointer" }} onClick={() => setSelectedFinding(f)}>
                      <td style={s.td}><code style={{ fontSize: 11 }}>{f.id}</code></td>
                      <td style={s.td}><span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{f.type.replace(/_/g, " ")}</span></td>
                      <td style={s.td}><SeverityBadge severity={f.severity} /></td>
                      <td style={{ ...s.td, fontWeight: 500 }}>{f.vendor}</td>
                      <td style={{ ...s.td, fontWeight: 500, color: f.severity === "CRITICAL" ? "#A32D2D" : "var(--color-text-primary)" }}>
                        ${f.amount.toLocaleString()}
                      </td>
                      <td style={{ ...s.td, maxWidth: 240, overflow: "hidden" }}>
                        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{f.description.slice(0, 80)}…</span>
                      </td>
                      <td style={s.td}>
                        <button style={{ ...s.btnSecondary, padding: "4px 10px", fontSize: 12 }}
                          onClick={(e) => { e.stopPropagation(); setSelectedFinding(f); }}>
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Finding detail drawer */}
            {selectedFinding && (
              <div style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
                display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100,
              }} onClick={() => setSelectedFinding(null)}>
                <div style={{
                  background: "var(--color-background-primary)",
                  border: "0.5px solid var(--color-border-secondary)",
                  borderRadius: "16px 16px 0 0",
                  padding: "1.5rem",
                  width: "100%",
                  maxWidth: 700,
                  maxHeight: "70vh",
                  overflowY: "auto",
                }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div>
                      <SeverityBadge severity={selectedFinding.severity} />
                      <span style={{ marginLeft: 8, fontSize: 13, color: "var(--color-text-secondary)" }}>{selectedFinding.type.replace(/_/g, " ")}</span>
                    </div>
                    <button style={{ ...s.btnSecondary, padding: "4px 10px", fontSize: 12 }} onClick={() => setSelectedFinding(null)}>✕ Close</button>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>{selectedFinding.vendor}</p>
                  <p style={{ fontSize: 22, fontWeight: 500, color: "#E24B4A", margin: "0 0 16px" }}>${selectedFinding.amount.toLocaleString()}</p>
                  <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 12 }}>{selectedFinding.description}</p>
                  <div style={{ background: "var(--color-background-warning)", borderRadius: "var(--border-radius-md)", padding: "10px 14px", marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-warning)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recommendation</p>
                    <p style={{ fontSize: 13, color: "var(--color-text-primary)", margin: 0 }}>{selectedFinding.recommendation}</p>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>
                    Related transactions: {selectedFinding.txns.join(", ")}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Spend Analysis Tab ───────────────────────────────────────────── */}
        {tab === "spend" && (
          <div>
            <div style={s.row}>
              <MetricCard label="Total analyzed" value="$188.8K" sub="Q2 2025" />
              <MetricCard label="Flagged spend" value="$106.7K" sub="56.5% of total" color="#E24B4A" />
              <MetricCard label="Top category" value="Vendor" sub="$63K — 33.4%" />
              <MetricCard label="Top vendor" value="FastPay" sub="$48K — 25.4%" color="#E24B4A" />
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ ...s.card, flex: 1, minWidth: 260 }}>
                <p style={s.sectionTitle}>Spend by category</p>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <DonutChart data={SPEND_BY_CATEGORY} total={totalSpend} />
                  <div style={{ flex: 1 }}>
                    {SPEND_BY_CATEGORY.map(d => (
                      <div key={d.category} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, flex: 1, color: "var(--color-text-secondary)" }}>{d.category}</span>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{((d.amount / totalSpend) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ ...s.card, flex: 1, minWidth: 280 }}>
                <p style={s.sectionTitle}>Top vendors by spend</p>
                <HBarChart data={SPEND_BY_VENDOR} />
                <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 8, marginBottom: 0 }}>
                  Red bars = flagged (≥$10K threshold)
                </p>
              </div>
            </div>

            <div style={s.card}>
              <p style={s.sectionTitle}>Cost reduction opportunities</p>
              {[
                { n: 1, title: "Negotiate AWS Reserved Instances", savings: "$14,400/yr", detail: "Commit to 1-year RI for predictable workloads — typically 35% discount on on-demand rates." },
                { n: 2, title: "Resolve Zoom duplicate charge", savings: "$3,200 immediate", detail: "Chargeback request in progress. Full recovery expected within 5 business days." },
                { n: 3, title: "Freeze FastPay Services payment", savings: "$48,000 at risk", detail: "No contract reference found. Payment held pending CFO verification." },
                { n: 4, title: "Vendor consolidation — SaaS tools", savings: "$5,200/yr est.", detail: "Zoom + Slack + PagerDuty all overlap on communication. Evaluate bundle pricing." },
              ].map(item => (
                <div key={item.n} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: "50%", background: "var(--color-background-secondary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 500, flexShrink: 0, color: "var(--color-text-secondary)",
                  }}>{item.n}</span>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{item.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 7px", borderRadius: 10, background: "#E1F5EE", color: "#085041" }}>{item.savings}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Transactions Tab ─────────────────────────────────────────────── */}
        {tab === "transactions" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
              {["ALL", "NORMAL", "DUPLICATE", "SPIKE", "FLAGGED", "UNRECOGNIZED_VENDOR"].map(f => (
                <button key={f} style={{
                  ...s.btnSecondary,
                  padding: "5px 12px", fontSize: 12,
                  background: txnFilter === f ? "var(--color-background-secondary)" : "none",
                  fontWeight: txnFilter === f ? 500 : 400,
                }} onClick={() => setTxnFilter(f)}>
                  {f === "ALL" ? "All" : f.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>

            <div style={s.card}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {["ID", "Date", "Vendor", "Category", "Amount", "Dept", "Ref", "Status"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTxns.map(t => (
                    <tr key={t.id}>
                      <td style={s.td}><code style={{ fontSize: 11 }}>{t.id}</code></td>
                      <td style={{ ...s.td, fontSize: 12, color: "var(--color-text-secondary)" }}>{t.date}</td>
                      <td style={{ ...s.td, fontWeight: 500 }}>{t.vendor}</td>
                      <td style={{ ...s.td, fontSize: 12, color: "var(--color-text-secondary)" }}>{t.category}</td>
                      <td style={{ ...s.td, fontWeight: 500, color: t.status !== "NORMAL" ? "#A32D2D" : "var(--color-text-primary)" }}>
                        ${t.amount.toLocaleString()}
                      </td>
                      <td style={{ ...s.td, fontSize: 12, color: "var(--color-text-secondary)" }}>{t.dept}</td>
                      <td style={{ ...s.td, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-tertiary)" }}>{t.ref}</td>
                      <td style={s.td}><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 8, marginBottom: 0 }}>
                {filteredTxns.length} of {MOCK_TRANSACTIONS.length} transactions
              </p>
            </div>
          </div>
        )}

        {/* ── Vendor Emails Tab ────────────────────────────────────────────── */}
        {tab === "emails" && (
          <div>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
              {MOCK_EMAILS.length} vendor action emails drafted by NegotiatorAgent
            </p>
            <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
              {MOCK_EMAILS.map(email => (
                <div key={email.id} style={s.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 3,
                          background: email.type === "PRICE_DISPUTE" ? "#FCEBEB" : email.type === "CANCELLATION_NOTICE" ? "#FAEEDA" : "#E6F1FB",
                          color: email.type === "PRICE_DISPUTE" ? "#A32D2D" : email.type === "CANCELLATION_NOTICE" ? "#854F0B" : "#185FA5",
                          textTransform: "uppercase", letterSpacing: "0.04em",
                        }}>{email.type.replace(/_/g, " ")}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 3,
                          background: email.priority === "HIGH" ? "#FCEBEB" : "#F1EFE8",
                          color: email.priority === "HIGH" ? "#A32D2D" : "#5F5E5A",
                          textTransform: "uppercase",
                        }}>{email.priority}</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 3px" }}>{email.subject}</p>
                      <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: 0 }}>
                        To: {email.to}
                      </p>
                    </div>
                    <button style={{ ...s.btnSecondary, padding: "5px 12px", fontSize: 12 }}
                      onClick={() => setSelectedEmail(selectedEmail?.id === email.id ? null : email)}>
                      {selectedEmail?.id === email.id ? "Collapse" : "View →"}
                    </button>
                  </div>
                  {selectedEmail?.id === email.id && (
                    <div style={{
                      background: "var(--color-background-secondary)",
                      borderRadius: "var(--border-radius-md)",
                      padding: "1rem",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                    }}>
                      {email.body}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
