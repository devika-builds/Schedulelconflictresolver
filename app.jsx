const { useState, useMemo, useEffect, useRef } = React;

// Heritage Silver — Executive Light Mode palette (shared with EA Control Center
// and Zapier Workflow Visualizer). Token names preserved across the portfolio.
const COLORS = {
  // Surfaces
  background:   "#E4EAF0",  // Platinum mist — body
  cardBg:       "#FAFBFD",  // Silk White — primary cards
  cardBgMuted:  "#EEF1F5",  // Cool ash — nested surfaces / filter chips

  // Typography & borders
  text:           "#2A3547",                  // Navy Ink
  textSecondary:  "#566175",                  // Mid slate
  textTertiary:   "#7F8A9C",                  // Lighter meta
  borderColor:    "rgba(42, 53, 71, 0.14)",
  borderStrong:   "rgba(42, 53, 71, 0.32)",
  borderSoft:     "rgba(42, 53, 71, 0.08)",

  // Accent (primary / active)
  accent:     "#6B7FAB",                       // Liberty Blue
  accentDim:  "rgba(107, 127, 171, 0.18)",
  accentSoft: "rgba(107, 127, 171, 0.10)",

  // Critical / blocking
  critical:       "#E6D4E1",                   // Soft thistle tint
  criticalBorder: "rgba(140, 94, 127, 0.55)",
  criticalText:   "#8C5E7F",                   // Deep Thistle

  // Pastel status tokens — cool register
  sage:            "#B5C3DA",                  // Little Boy Blue  sageBorder:      "rgba(74, 106, 148, 0.55)",
  slateBlue:       "#C4CDE3",                  // Thistle pastel
  slateBlueBorder: "rgba(107, 127, 171, 0.55)",

  // Semantic aliases (cool register — no greens/oranges)
  success:     "#B5C3DA",
  successBg:   "rgba(181, 195, 218, 0.45)",
  successText: "#2F4B6E",
  warning:     "#6B7FAB",
  warningBg:   "rgba(107, 127, 171, 0.18)",
  warningText: "#54678F",
  error:       "#8C5E7F",
};

const FONT =
  "'Inter', 'Geist', ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const MONO =
  "'JetBrains Mono', 'Geist Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const WEIGHTS = {
  relationshipImportance: 0.30,
  moveability: 0.25,
  alternatives: 0.20,
  prepComplexity: 0.15,
  invitedByLevel: 0.10,
};

const altsToScore = (n) => n <= 0 ? 95 : n === 1 ? 60 : n === 2 ? 35 : 18;

const INVITED_BY_MAP = {  investor: 80, ceo: 75, board: 78, external: 65, attendee: 55, cfo: 50, internal: 35, ea: 25,
};

// ------------------------------------------------------------------
// TEAM (for prep delegation)
// ------------------------------------------------------------------
const TEAM = [
  { id: "john", name: "John Reyes",    role: "Associate EA",    avail: [ "Thu 9–11", "Thu 1–3", "Fri 10–12" ], load: 55 },
  { id: "maria", name: "Maria Chen",   role: "Chief of Staff",  avail: [ "Thu 2–4" ],                         load: 78 },
  { id: "sam",  name: "Sam Ortega",    role: "Research Analyst", avail: [ "Thu 9–12", "Thu 3–6", "Fri all day" ], load: 32 },
];

// ------------------------------------------------------------------
// MEETINGS — per-day
// ------------------------------------------------------------------
const DAYS = [
  { key: "MON", date: "Apr 15", full: "Monday, April 15, 2026",    meetings: [
    { id: "m-mon-1", title: "Weekly EA standup", start: "9:30 AM", end: "10:00 AM", startMin: 570, endMin: 600, attendees: ["EA team"], prepTimeNeeded: 0, prepStatus: "n/a" },
    { id: "m-mon-2", title: "CEO 1:1",           start: "3:00 PM", end: "3:30 PM", startMin: 900, endMin: 930, attendees: ["CEO"],     prepTimeNeeded: 15, prepStatus: "ready" },
  ]},
  { key: "TUE", date: "Apr 16", full: "Tuesday, April 16, 2026",    meetings: [
    { id: "m-tue-1", title: "Investor prep sync", start: "11:00 AM", end: "12:00 PM", startMin: 660, endMin: 720, attendees: ["CEO","Counsel"], prepTimeNeeded: 30, prepStatus: "ready" },
  ]},
  { key: "WED", date: "Apr 17", full: "Wednesday, April 17, 2026", meetings: [
    {
      id: "m-wed-1", title: "Ops review with COO", start: "11:00 AM", end: "12:00 PM",
      startMin: 660, endMin: 720, attendees: ["COO"],
      prepTimeNeeded: 30, prepStatus: "60% ready",
      relationshipImportance: 70, moveability: 45, alternativeSlotsAvailable: 2,
      prepComplexity: 40, invitedByLevel: "ea",      blockingTasks: [], downstreamImpact: "COO's ops update feeds Thursday standup",
      moveWindows: [
        { label: "Wednesday 2:00 – 3:00 PM", note: "COO free, prep done" },
        { label: "Thursday 9:00 – 10:00 AM", note: "Tight but workable" },
      ],
      blockedWindows: [{ label: "Thursday 2–4pm", note: "Thu conflict window" }],
      timezone: "ET",
    },
    {
      id: "m-wed-2", title: "Recruiter screen — Head of People", start: "11:30 AM", end: "12:30 PM",
      startMin: 690, endMin: 750, attendees: ["Recruiter","Candidate (PT)"],
      prepTimeNeeded: 15, prepStatus: "ready",
      relationshipImportance: 45, moveability: 35, alternativeSlotsAvailable: 3,
      prepComplexity: 20, invitedByLevel: "ea",
      blockingTasks: [], downstreamImpact: "Candidate pipeline moves forward",
      moveWindows: [
        { label: "Wednesday 3:00 – 4:00 PM", note: "Candidate available PT" },
        { label: "Thursday 5:00 – 6:00 PM", note: "Late but clean" },
        { label: "Friday 12:00 – 1:00 PM", note: "Lunch-through, OK" },
      ],
      blockedWindows: [],
      timezone: "PT",
    },
  ]},
  { key: "THU", date: "Apr 18", full: "Thursday, April 18, 2026", active: true, meetings: [
    {
      id: "meeting-001",
      title: "CEO Client Call — Series B Investor Follow-up (Westside Partners)",
      start: "10:00 AM", end: "11:00 AM", startMin: 600, endMin: 660,
      prepTimeNeeded: 150, attendees: ["CEO", "Investor (PT)"],      relationshipImportance: 95, moveability: 75,
      alternativeSlotsAvailable: 1, prepStatus: "75% ready",
      prepComplexity: 80, invitedByLevel: "investor",
      blockingTasks: [],
      downstreamImpact: "Investor context feeds board meeting narrative",
      moveWindows: [{ label: "Friday 3:00 – 4:00 PM", note: "Investor avail, narrow prep" }],
      blockedWindows: [{ label: "Thursday before 10am", note: "Investor only avail. 10am PT" }],
      timezone: "PT",
    },
    {
      id: "meeting-002",
      title: "Vendor Call — Reschedule Acme / TechVendor / ServiceCo",
      start: "2:00 PM", end: "3:00 PM", startMin: 840, endMin: 900,
      prepTimeNeeded: 60, attendees: ["Vendor A (ET)", "Vendor B (ET)", "Vendor C (CT)"],
      relationshipImportance: 65, moveability: 40,
      alternativeSlotsAvailable: 3, prepStatus: "50% ready",
      prepComplexity: 45, invitedByLevel: "ea",
      blockingTasks: ["task-005", "task-007"],
      downstreamImpact: "Delays CEO sign-off on vendor times + calendar invites to vendors",
      moveWindows: [
        { label: "Thursday 3:30 – 4:30 PM", note: "Post-lunch, 1h prep available" },
        { label: "Friday 10:00 AM – 12:00 PM", note: "Full prep window, vendors available" },
        { label: "Friday 2:00 – 3:00 PM", note: "Moderate prep, vendors available" },
      ],
      blockedWindows: [
        { label: "Thursday 12–1 PM", note: "Lunch hard stop" },
        { label: "Wednesday", note: "Prep incomplete" },
      ],
      timezone: "ET / CT",
    },{
      id: "meeting-003",
      title: "Board Meeting Agenda Review with CFO",
      start: "2:30 PM", end: "3:30 PM", startMin: 870, endMin: 930,
      prepTimeNeeded: 0, attendees: ["CFO"],
      relationshipImportance: 85, moveability: 30,
      alternativeSlotsAvailable: 4, prepStatus: "95% ready",
      prepComplexity: 25, invitedByLevel: "ea",
      blockingTasks: ["task-003"],
      downstreamImpact: "Blocks final board agenda; board materials can't go out",
      moveWindows: [
        { label: "Thursday 4:00 – 5:00 PM", note: "CFO available, agenda ready" },
        { label: "Friday 9:00 – 10:00 AM", note: "Clean morning slot" },
        { label: "Friday 11:00 AM – 12:00 PM", note: "Good window before lunch" },
        { label: "Friday 2:00 – 3:00 PM", note: "Standard afternoon" },
      ],
      blockedWindows: [],
      timezone: "ET",
    },
  ]},
  { key: "FRI", date: "Apr 19", full: "Friday, April 19, 2026", meetings: [
    { id: "m-fri-1", title: "Open for reschedules", start: "—", end: "—", startMin: 0, endMin: 0, attendees: [], prepTimeNeeded: 0, prepStatus: "open" },
  ]},
];

const DOWNSTREAM_TASKS = {
  "task-003": { id: "task-003", title: "Prepare board meeting agenda", blockedBy: "meeting-003", note: "Blocked until CFO review is done" },
  "task-005": { id: "task-005", title: "Confirm rescheduled vendor meetings with CEO", blockedBy: "meeting-002", note: "Depends on vendor call outcomes" },
  "task-006": { id: "task-006", title: "Follow up with CFO on Q1 financial review", blockedBy: "meeting-003", note: "Input needed for board brief" },
  "task-007": { id: "task-007", title: "Send calendar invites to vendors", blockedBy: "meeting-002", note: "Needs final vendor time confirmation" },};

// ------------------------------------------------------------------
// SCORING
// ------------------------------------------------------------------
function scoreMeeting(m) {
  if (m.relationshipImportance == null) return null;
  const altsScore = altsToScore(m.alternativeSlotsAvailable);
  const invitedScore = INVITED_BY_MAP[m.invitedByLevel] ?? 50;
  const breakdown = {
    relationshipImportance: m.relationshipImportance,
    moveability: m.moveability,
    alternatives: altsScore,
    prepComplexity: m.prepComplexity,
    invitedByLevel: invitedScore,
  };
  const total =
    breakdown.relationshipImportance * WEIGHTS.relationshipImportance +
    breakdown.moveability * WEIGHTS.moveability +
    breakdown.alternatives * WEIGHTS.alternatives +
    breakdown.prepComplexity * WEIGHTS.prepComplexity +
    breakdown.invitedByLevel * WEIGHTS.invitedByLevel;
  return { breakdown, total: Math.round(total) };
}

function scoreTone(total) {
  if (total >= 75) return { bg: COLORS.critical, fg: COLORS.criticalText, label: "HIGH COST" };
  if (total >= 50) return { bg: COLORS.warningBg, fg: COLORS.warningText, label: "MODERATE" };
  return { bg: COLORS.successBg, fg: COLORS.successText, label: "LOW COST" };
}
// Conflict detection: find overlapping meeting groups within a day
function detectConflicts(meetings) {
  const groups = [];
  for (const m of meetings) {
    if (!m.startMin) continue;
    let placed = false;
    for (const g of groups) {
      if (g.some(x => x.startMin < m.endMin && x.endMin > m.startMin)) {
        g.push(m); placed = true; break;
      }
    }
    if (!placed) groups.push([m]);
  }
  return groups.filter(g => g.length >= 2);
}

// ------------------------------------------------------------------
// UI PRIMITIVES
// ------------------------------------------------------------------
function Card({ children, style, pad = 22, tone }) {
  return (
    <div style={{
      background: COLORS.cardBg,
      border: `1px solid ${COLORS.borderColor}`,
      borderRadius: 12,
      padding: pad,
      ...style,
    }}>{children}</div>}

function Pill({ children, bg, fg, style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "4px 10px", borderRadius: 999,
      background: bg, color: fg,
      fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6,
      fontFamily: MONO, textTransform: "uppercase",
      whiteSpace: "nowrap",
      ...style,
    }}>{children}</span>
  );
}

function Kicker({ num, text }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10, letterSpacing: 1.4,
      color: COLORS.textSecondary, textTransform: "uppercase",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {num && <span style={{ color: COLORS.accent, fontWeight: 700 }}>{num}</span>}
      <span>{text}</span>
    </div>
  );
}
function SectionHeader({ num, title, subtitle, right }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-end",
      gap: 16, marginBottom: 16, flexWrap: "wrap",
    }}>
      <div>
        <Kicker num={num} text={subtitle} />
        <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, letterSpacing: -0.2, marginTop: 4 }}>
          {title}
        </div>
      </div>
      {right}
    </div>
  );
}

function FactorBar({ label, value, weight }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: COLORS.textSecondary }}>
          {label}
          <span style={{ fontFamily: MONO, color: COLORS.textTertiary, marginLeft: 6, fontSize: 10 }}>
            ·{Math.round(weight*100)}%
          </span>
        </span>
        <span style={{ fontFamily: MONO, color: COLORS.text, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {value}<span style={{ color: COLORS.textTertiary }}>/100</span>
        </span>
      </div>      <div style={{ height: 6, background: COLORS.borderSoft, borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${value}%`, height: "100%",
          background: COLORS.slateBlue,
          transition: "width 300ms ease",
        }} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// DAY STRIP (clickable)
// ------------------------------------------------------------------
function DayStrip({ days, activeKey, setActive, conflictMap }) {
  return (
    <Card pad={18}>
      <SectionHeader num="00" title="This week at a glance" subtitle="Click a day to inspect" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {days.map(d => {
          const isActive = d.key === activeKey;
          const conflicts = conflictMap[d.key] || [];
          const maxLen = conflicts.reduce((m, g) => Math.max(m, g.length), 0);
          const state = maxLen >= 3 ? "multi" : maxLen === 2 ? "pair" : "clear";
          const tone = state === "multi"
            ? { bg: COLORS.critical, fg: COLORS.criticalText, label: "3+ CONFLICT" }
            : state === "pair"
            ? { bg: COLORS.warningBg, fg: COLORS.warningText, label: "2 CONFLICT" }
            : { bg: COLORS.successBg, fg: COLORS.successText, label: "CLEAR" };
          const note = state === "multi"            ? `${d.meetings.length} meetings · ${maxLen} overlapping`
            : state === "pair"
            ? "2 meetings overlap"
            : d.meetings.length > 0 ? `${d.meetings.length} meeting${d.meetings.length === 1 ? "" : "s"}` : "No meetings";
          return (
            <button
              key={d.key}
              onClick={() => setActive(d.key)}
              style={{
                textAlign: "left",
                padding: "14px 14px",
                background: isActive ? COLORS.accentDim : COLORS.cardBgMuted,
                border: `1px solid ${isActive ? COLORS.accent : COLORS.borderColor}`,
                borderRadius: 10,
                cursor: "pointer",
                transition: "all 180ms ease",
                boxShadow: isActive ? `0 2px 10px rgba(107,127,171,0.15)` : "none",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = COLORS.cardBg;
                  e.currentTarget.style.borderColor = COLORS.accentSoft;
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = COLORS.cardBgMuted;
                  e.currentTarget.style.borderColor = COLORS.borderColor;
                }
              }}
            >
              <div style={{
                fontFamily: MONO, fontSize: 10, color: COLORS.textSecondary,
                letterSpacing: 1, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span>{d.key} · {d.date.toUpperCase()}</span>
                {isActive && <span style={{ color: COLORS.accent, fontWeight: 700 }}>● ACTIVE</span>}
              </div>
              <Pill bg={tone.bg} fg={tone.fg} style={{ marginBottom: 10 }}>{tone.label}</Pill>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.45 }}>
                {note}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------
// DAY TIMELINE
// ------------------------------------------------------------------
function DayTimeline({ day, recommendedId, overrideId, conflicts, onSelectBar }) {
  const DAY_START = 540, DAY_END = 1080, totalMin = DAY_END - DAY_START;
  const hasTiming = day.meetings.some(m => m.startMin > 0);
  const multiConflict = conflicts.find(g => g.length >= 3);

  // Assign vertical rows to avoid overlap
  const rows = [];
  const meetingRow = {};
  for (const m of [...day.meetings].sort((a,b) => a.startMin - b.startMin)) {
    if (!m.startMin) continue;
    let r = 0;
    while (rows[r] && rows[r].endMin > m.startMin) r++;
    rows[r] = m;
    meetingRow[m.id] = r;
  }
  const maxRow = Math.max(0, ...Object.values(meetingRow));
  const trackHeight = 28 + (maxRow + 1) * 26;

  return (
    <Card pad={22}>
      <SectionHeader
        num="01"
        title={day.full}
        subtitle="Day view"
        right={
          multiConflict
            ? <Pill bg={COLORS.critical} fg={COLORS.criticalText}>⚠ {multiConflict.length} OVERLAPPING</Pill>
            : conflicts.length
            ? <Pill bg={COLORS.warningBg} fg={COLORS.warningText}>{conflicts.length} PAIR CONFLICT</Pill>
            : <Pill bg={COLORS.successBg} fg={COLORS.successText}>✓ CLEAR</Pill>
        }
      />
      {!hasTiming ? (
        <div style={{
          padding: "28px 16px",
          textAlign: "center",
          background: COLORS.cardBgMuted,
          borderRadius: 8,
          fontSize: 13, color: COLORS.textSecondary,
        }}>
          No timed meetings — good candidate for reschedules.
        </div>
      ) : (
        <div style={{ position: "relative", height: trackHeight }}>
          {/* Hour grid */}
          {[9,10,11,12,13,14,15,16,17,18].map(h => {
            const pct = ((h*60 - DAY_START) / totalMin) * 100;
            return (
              <React.Fragment key={h}>
                <div style={{
                  position: "absolute", left: `${pct}%`, top: 18, bottom: 0,
                  borderLeft: `1px dashed ${COLORS.borderColor}`,
                }} />
                <div style={{
                  position: "absolute", left: `${pct}%`, top: 0,
                  fontFamily: MONO, fontSize: 10, color: COLORS.textTertiary,
                  transform: "translateX(2px)",}}>
                  {h > 12 ? h-12 : h}{h>=12 ? "p" : "a"}
                </div>
              </React.Fragment>
            );
          })}

          {/* Meeting bars */}
          {day.meetings.filter(m => m.startMin > 0).map(m => {
            const left = ((m.startMin - DAY_START) / totalMin) * 100;
            const width = ((m.endMin - m.startMin) / totalMin) * 100;
            const row = meetingRow[m.id] || 0;
            const isRec = m.id === recommendedId;
            const isOver = m.id === overrideId;
            const bg = isRec ? COLORS.accent : isOver ? COLORS.warning : COLORS.slateBlue;
            const fg = isRec || isOver ? "white" : COLORS.text;
            const scoreable = m.relationshipImportance != null;
            return (
              <button
                key={m.id}
                onClick={() => scoreable && onSelectBar && onSelectBar(m.id)}
                title={scoreable ? `Select ${m.id} as override` : m.title}
                style={{
                  position: "absolute",
                  left: `${left}%`, width: `${width}%`,
                  top: 24 + row * 26,
                  height: 22,
                  background: bg,
                  border: `1px solid ${isRec ? COLORS.accent : isOver ? COLORS.warning : COLORS.sage}`,
                  borderRadius: 5,
                  color: fg,
                  fontSize: 11, fontFamily: MONO, fontWeight: 600,
                  display: "flex", alignItems: "center", padding: "0 8px",
                  overflow: "hidden", whiteSpace: "nowrap",
                  boxShadow: isRec ? "0 2px 8px rgba(107,127,171,0.35)" : "none",
                  cursor: scoreable ? "pointer" : "default",
                  textAlign: "left",
                  transition: "transform 150ms ease",
                }}
                onMouseEnter={e => { if (scoreable) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
              >
                {m.title.split("—")[0].trim()}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 10.5, color: COLORS.textSecondary, fontFamily: MONO, letterSpacing: 0.6 }}>
        <Legend color={COLORS.slateBlue} label="MEETING" />
        <Legend color={COLORS.accent} label="RECOMMENDED MOVE" />
        <Legend color={COLORS.warning} label="MANUAL OVERRIDE" />
      </div>
    </Card>
  );
}

function Legend({ color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{ width: 12, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}

// ------------------------------------------------------------------
// CONFLICT ALERT
// ------------------------------------------------------------------
function ConflictAlert({ day, conflicts, recommended, onApply, applied }) {
  const multi = conflicts.find(g => g.length >= 3);
  const pair = !multi && conflicts[0];
  const group = multi || pair;
  if (!group) {
    return (
      <Card pad={20} style={{ borderColor: COLORS.success + "55", background: COLORS.successBg + "66", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <IconCircle bg={COLORS.success} fg="white" glyph="✓" />
          <div style={{ flex: 1 }}>
            <Kicker num="01" text="Clean day" />
            <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginTop: 4 }}>
              No conflicts on {day.full}.
            </div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>
              Good candidate for rescheduling meetings from other days.
            </div>
          </div>
        </div>
      </Card>
    );
  }
  const startMin = Math.min(...group.map(m => m.startMin));
  const endMin = Math.max(...group.map(m => m.endMin));
  return (
    <Card pad={20} style={{
      borderColor: COLORS.criticalText + "55",
      background: COLORS.critical + "55",
      marginBottom: 18,
    }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <IconCircle bg={COLORS.critical} fg={COLORS.criticalText} glyph="!" />
        <div style={{ flex: 1, minWidth: 260 }}>
          <Kicker num="01" text="Conflict detected" />          <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginTop: 4 }}>
            {group.length} meetings overlap between {formatMin(startMin)} and {formatMin(endMin)}.
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>
            Recommended resolution: move <b style={{ color: COLORS.text }}>{recommended.meeting.id}</b> — {recommended.meeting.title.split("—")[0].trim()}.
          </div>
        </div>
        <button
          onClick={onApply}
          disabled={applied}
          style={{
            padding: "10px 16px",
            background: applied ? COLORS.successBg : COLORS.accent,
            color: applied ? COLORS.successText : "white",
            fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
            textTransform: "uppercase", borderRadius: 6,
            cursor: applied ? "default" : "pointer",
            transition: "all 180ms",
          }}
        >
          {applied ? "✓ Applied" : "Apply recommendation →"}
        </button>
      </div>
    </Card>
  );
}

function IconCircle({ bg, fg, glyph }) {
  return (
    <div style={{
      width: 42, height: 42, borderRadius: 10,
      background: bg, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: MONO, fontWeight: 700, fontSize: 18, flexShrink: 0,
    }}>{glyph}</div>
  );
}

function formatMin(min) {
  const h = Math.floor(min/60), m = min % 60;
  const hh = h > 12 ? h - 12 : h;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hh}:${String(m).padStart(2,"0")} ${ampm}`;
}

// ------------------------------------------------------------------
// RECOMMENDATION HERO
// ------------------------------------------------------------------
function RecommendationHero({ meeting, score, isOverride }) {
  return (
    <Card pad={26} style={{ borderColor: COLORS.accent + "55" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 28, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <Kicker num="02" text={isOverride ? "Manual resolution" : "Safest to move"} />
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, marginTop: 6, lineHeight: 1.25, color: COLORS.text }}>
            {meeting.title}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 6 }}>
            <span style={{ fontFamily: MONO }}>{meeting.start} – {meeting.end}</span>
            <span style={{ margin: "0 8px", color: COLORS.textTertiary }}>·</span>
            {meeting.attendees.join(" · ")}
            {meeting.timezone && <>
              <span style={{ margin: "0 8px", color: COLORS.textTertiary }}>·</span>
              <Pill bg={COLORS.accentDim} fg={COLORS.accent} style={{ padding: "2px 8px" }}>TZ {meeting.timezone}</Pill>
            </>}
          </div>
        </div>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "16px 22px",
          background: COLORS.accentDim,
          borderRadius: 10,
          minWidth: 132,
        }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 0.8, color: COLORS.accent, textTransform: "uppercase", marginBottom: 4 }}>
            Cost score
          </div>
          <div style={{ fontFamily: MONO, fontSize: 38, fontWeight: 700, color: COLORS.accent, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {score.total}
          </div>
          <div style={{ fontSize: 9.5, fontFamily: MONO, color: COLORS.textSecondary, marginTop: 6, letterSpacing: 0.6, textAlign: "center" }}>
            OF 100<br/>LOWER = SAFER
          </div>
        </div>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------
// MEETING CARD
// ------------------------------------------------------------------
function MeetingCard({ meeting, score, isRecommended, isSelectedOverride, onClick }) {
  const tone = scoreTone(score.total);
  const border = isRecommended
    ? `2px solid ${COLORS.accent}`
    : isSelectedOverride
    ? `2px dashed ${COLORS.warning}`
    : `1px solid ${COLORS.borderColor}`;

  const recoReason = useMemo(() => {
    const b = score.breakdown;
    if (score.total >= 60) {
      const highs = [];
      if (b.relationshipImportance >= 80) highs.push("relationship critical");
      if (b.moveability >= 70) highs.push("hard to move");
      if (b.alternatives >= 70) highs.push("few alternatives");
      if (b.prepComplexity >= 70) highs.push("heavy prep");
      return `High cost to move — ${highs.join(", ") || "multiple heavy factors"}.`;
    }
    const lows = [];
    if (b.relationshipImportance <= 50) lows.push("lower-stakes relationship");
    if (b.moveability <= 45) lows.push("flexible timing");
    if (b.alternatives <= 40) lows.push("plenty of alternatives");
    if (b.prepComplexity <= 40) lows.push("light prep");
    return `Safer to move — ${lows.join(", ") || "factors skew low"}.`;
  }, [score]);
  return (
    <div
      onClick={onClick}
      style={{
        background: COLORS.cardBg,
        border,
        borderRadius: 12,
        padding: 22,
        position: "relative",
        cursor: "pointer",
        transition: "border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 4px 14px rgba(42,53,71,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {(isRecommended || isSelectedOverride) && (
        <div style={{
          position: "absolute", top: -10, left: 18,
          background: isRecommended ? COLORS.accent : COLORS.warning,
          color: isRecommended ? "white" : "#3E2F14",
          fontSize: 10, fontWeight: 700, letterSpacing: 1,
          padding: "4px 11px", borderRadius: 4,
          fontFamily: MONO,
        }}>
          {isRecommended ? "RECOMMENDED TO MOVE" : "MANUAL OVERRIDE"}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "start", marginBottom: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 10, fontFamily: MONO, color: COLORS.textTertiary,
            letterSpacing: 0.8, marginBottom: 6, textTransform: "uppercase",
          }}>
            {meeting.id}  ·  {meeting.start} – {meeting.end}
            {meeting.timezone && <span style={{ color: COLORS.accent, marginLeft: 8 }}>TZ {meeting.timezone}</span>}
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.35, color: COLORS.text, marginBottom: 6 }}>
            {meeting.title}
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.5 }}>
            {meeting.attendees.join(" · ")}
            <br />
            <span style={{ fontFamily: MONO, fontSize: 11, color: COLORS.textTertiary }}>
              prep {meeting.prepTimeNeeded}m · {meeting.prepStatus}
            </span>
          </div>
        </div>

        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
          minWidth: 64,
        }}>
          <div style={{
            background: tone.bg, color: tone.fg,
            padding: "8px 14px", borderRadius: 8,
            fontFamily: MONO, fontWeight: 700,
            fontSize: 22, lineHeight: 1, fontVariantNumeric: "tabular-nums",
            minWidth: 52, textAlign: "center",
          }}>
            {score.total}
          </div>
          <Pill bg={tone.bg} fg={tone.fg} style={{ fontSize: 9.5 }}>{tone.label}</Pill>
        </div>
      </div>

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLORS.borderSoft}` }}>
        <FactorBar label="Relationship importance" value={score.breakdown.relationshipImportance} weight={WEIGHTS.relationshipImportance} />
        <FactorBar label="Moveability"             value={score.breakdown.moveability}             weight={WEIGHTS.moveability} />
        <FactorBar label="Alternative slots"       value={score.breakdown.alternatives}            weight={WEIGHTS.alternatives} />
        <FactorBar label="Prep complexity"         value={score.breakdown.prepComplexity}          weight={WEIGHTS.prepComplexity} />
        <FactorBar label="Invited by"              value={score.breakdown.invitedByLevel}          weight={WEIGHTS.invitedByLevel} />
      </div>      <div style={{
        marginTop: 14, padding: "11px 13px",
        background: COLORS.cardBgMuted,
        borderRadius: 8,
        fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.55,
      }}>
        <span style={{
          fontFamily: MONO, color: COLORS.text, fontWeight: 700, fontSize: 9.5,
          letterSpacing: 0.8, textTransform: "uppercase", marginRight: 8,
        }}>
          Reasoning
        </span>
        {recoReason}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// CASCADING IMPACT
// ------------------------------------------------------------------
function CascadingImpact({ meeting }) {
  const tasks = (meeting.blockingTasks || []).map(id => DOWNSTREAM_TASKS[id]).filter(Boolean);
  const hasRisk = meeting.id === "meeting-002";
  return (
    <Card>
      <SectionHeader num="04" title="Cascading impact" subtitle={`Ripple from moving ${meeting.id}`} />
      <div style={{ display: "grid", gap: 10 }}>
        {tasks.length === 0 && (
          <div style={{
            padding: "11px 13px",
            background: COLORS.cardBgMuted,
            border: `1px dashed ${COLORS.borderColor}`,
            borderRadius: 8,
            fontSize: 12.5, color: COLORS.textSecondary, lineHeight: 1.5,
          }}>
            No downstream tasks directly blocked. Impact is contextual only.
          </div>
        )}
        {tasks.map(t => (
          <ImpactRow key={t.id} dotColor={COLORS.accent} right={t.id.toUpperCase()}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{t.title}</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 1.5 }}>{t.note}</div>
          </ImpactRow>
        ))}
        <ImpactRow dotColor={COLORS.success}>
          <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>
            Board prep window unchanged — not dependent on this meeting.
          </div>
        </ImpactRow>
        {hasRisk && (
          <div style={{
            display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "start",
            padding: "11px 13px",
            background: COLORS.critical,
            borderRadius: 8,
          }}>
            <span style={{
              fontFamily: MONO, fontSize: 10, fontWeight: 700, color: COLORS.criticalText,
              letterSpacing: 0.8, marginTop: 2, padding: "3px 8px",
              background: "rgba(255,255,255,0.5)", borderRadius: 4,
            }}>
              RISK
            </span>
            <div style={{ fontSize: 12.5, color: COLORS.criticalText, lineHeight: 1.55 }}>
              If moved to Friday, vendor context for the board narrative gets thinner. Acceptable — but note it in the board brief.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function ImpactRow({ children, dotColor, right }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "start",
      padding: "11px 13px",
      background: COLORS.cardBgMuted,
      border: `1px solid ${COLORS.borderColor}`,
      borderRadius: 8,
    }}>
      <div style={{ width: 7, height: 7, borderRadius: 999, background: dotColor, marginTop: 7 }} />
      <div style={{ minWidth: 0 }}>{children}</div>
      {right
        ? <span style={{ fontFamily: MONO, fontSize: 9.5, color: COLORS.textTertiary, letterSpacing: 0.8, marginTop: 2 }}>{right}</span>
        : <span />}
    </div>
  );
}
// ------------------------------------------------------------------
// MITIGATION — with delegation
// ------------------------------------------------------------------
const MITIGATIONS = {
  "meeting-001": [
    { label: "Defer prep to John",     body: "John drafts briefing update by 9am; you review final cut at 9:30am.", delegate: "john" },
    { label: "15-min buffer",           body: "Protect 11–11:15am for immediate notes so vendor & CFO windows stay clean.", delegate: null },
    { label: "Redirect to Friday",      body: "Move investor call to Friday 3pm; risk — investor has limited Fri availability.", delegate: null },
  ],
  "meeting-002": [
    { label: "Move to Friday 2pm",      body: "Full prep window available; vendors already flagged Fri afternoon OK.", delegate: null },
    { label: "Move to Thu 4pm",         body: "Post-CEO, pre-lunch hard-stop. Brief CEO immediately after call.", delegate: null },
    { label: "Compress to 30 min",      body: "If agenda fits, push to 3:30pm Thu — 1h before CFO review still clean.", delegate: null },
    { label: "Delegate brief to John",  body: "John runs vendor call; briefs you 4–4:30pm before CFO review.", delegate: "john" },
  ],
  "meeting-003": [
    { label: "Move to Thu 4pm",         body: "CFO has 4–5pm block. Shifts only 90 minutes; board agenda still goes out same day.", delegate: null },
    { label: "Move to Fri 9am",         body: "Clean morning slot, CFO fresh. Board materials go out Friday midday.", delegate: null },
    { label: "Async agenda review",     body: "Send CFO the draft; 15-min phone sync instead of full meeting.", delegate: "maria" },
  ],
  "m-wed-1": [
    { label: "Move to Wed 2pm",         body: "COO free; prep done. Zero ripple.", delegate: null },
    { label: "Delegate to Sam",         body: "Sam collects ops notes async and routes summary.", delegate: "sam" },
  ],
  "m-wed-2": [
    { label: "Move to Wed 3pm",         body: "Candidate available PT; clean window.", delegate: null },
    { label: "Async video screen",      body: "Candidate records 10-min intro; recruiter reviews async.", delegate: null },
  ],
};
function Mitigation({ meetingId, selected, setSelected }) {
  const items = MITIGATIONS[meetingId] || [];
  return (
    <Card>
      <SectionHeader num="05" title="Mitigation strategies" subtitle="Click to select" />
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((m, i) => {
          const teammate = m.delegate ? TEAM.find(t => t.id === m.delegate) : null;
          const isSel = selected === i;
          return (
            <button key={i}
              onClick={() => setSelected(isSel ? null : i)}
              style={{
                display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 14,
                padding: "13px 15px",
                background: isSel ? COLORS.accentDim : COLORS.cardBgMuted,
                border: `1px solid ${isSel ? COLORS.accent : COLORS.borderColor}`,
                borderRadius: 10, textAlign: "left", cursor: "pointer",
                transition: "all 150ms",
                width: "100%",
              }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = COLORS.cardBg; }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = COLORS.cardBgMuted; }}
            >
              <div style={{
                fontFamily: MONO, fontSize: 12, fontWeight: 700,
                color: COLORS.accent, letterSpacing: 0.4, paddingTop: 1,
              }}>
                {String(i+1).padStart(2, "0")}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 12.5, color: COLORS.textSecondary, lineHeight: 1.55 }}>
                  {m.body}
                </div>
                {teammate && (
                  <div style={{
                    marginTop: 10, padding: "8px 10px",
                    background: "white",
                    border: `1px solid ${COLORS.borderSoft}`,
                    borderRadius: 6,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <Avatar name={teammate.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{teammate.name}</div>
                      <div style={{ fontSize: 10.5, color: COLORS.textTertiary, fontFamily: MONO, letterSpacing: 0.4 }}>
                        {teammate.role.toUpperCase()} · AVAIL {teammate.avail[0]}
                      </div>
                    </div>
                    <LoadBar load={teammate.load} />
                  </div>
                )}
              </div>
              <div style={{
                fontFamily: MONO, fontSize: 10, letterSpacing: 0.8,
                color: isSel ? COLORS.accent : COLORS.textTertiary,
                fontWeight: 700, alignSelf: "center",
              }}>
                {isSel ? "✓ SELECTED" : "SELECT →"}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function Avatar({ name }) {
  const initials = name.split(" ").map(n => n[0]).slice(0,2).join("");
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 999,
      background: COLORS.accent, color: "white",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, letterSpacing: 0.4,
      fontFamily: MONO,
    }}>{initials}</div>
  );
}

function LoadBar({ load }) {
  const color = load > 70 ? COLORS.error : load > 50 ? COLORS.warning : COLORS.success;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, width: 70 }}>
      <div style={{ fontSize: 9.5, color: COLORS.textTertiary, fontFamily: MONO, letterSpacing: 0.4 }}>
        LOAD {load}%
      </div>
      <div style={{ width: "100%", height: 4, background: COLORS.borderSoft, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${load}%`, height: "100%", background: color }} />
      </div>
    </div>
  );
}
// ------------------------------------------------------------------
// TIME WINDOWS
// ------------------------------------------------------------------
function TimeWindows({ meeting, selectedSlot, setSelectedSlot }) {
  return (
    <Card>
      <SectionHeader num="06" title="Realistic move slots" subtitle="Click a slot to pick" />
      <div style={{
        fontFamily: MONO, fontSize: 12, lineHeight: 1.5,
        color: COLORS.textSecondary,
        marginBottom: 10,
      }}>
        Originally {meeting.start} – {meeting.end} · {meeting.prepTimeNeeded}m prep
        {meeting.timezone && <span style={{ color: COLORS.accent }}>  ·  tz {meeting.timezone}</span>}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {(meeting.moveWindows || []).map((w, i) => {
          const isSel = selectedSlot === w.label;
          return (
            <button key={"ok"+i}
              onClick={() => setSelectedSlot(isSel ? null : w.label)}
              style={{
                display: "grid", gridTemplateColumns: "20px 1fr auto", gap: 10, alignItems: "center",
                padding: "11px 14px",
                background: isSel ? COLORS.successBg : COLORS.cardBgMuted,
                border: `1px solid ${isSel ? COLORS.success : COLORS.borderColor}`,
                borderRadius: 8,
                cursor: "pointer",
                textAlign: "left", width: "100%",
                fontFamily: FONT,
                transition: "all 150ms",
              }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = COLORS.cardBg; }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = COLORS.cardBgMuted; }}
            >
              <span style={{ color: COLORS.success, fontWeight: 700, fontFamily: MONO }}>✓</span>
              <span>
                <span style={{ color: COLORS.text, fontWeight: 600, fontSize: 13 }}>{w.label}</span>
                <span style={{ color: COLORS.textTertiary, fontSize: 12, marginLeft: 8 }}>{w.note}</span>
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                color: isSel ? COLORS.successText : COLORS.textTertiary }}>
                {isSel ? "✓ PICKED" : "PICK →"}
              </span>
            </button>
          );
        })}
        {(meeting.blockedWindows || []).map((w, i) => (
          <div key={"no"+i} style={{
            display: "grid", gridTemplateColumns: "20px 1fr", gap: 10, alignItems: "center",
            padding: "11px 14px",
            background: COLORS.critical + "33",
            border: `1px dashed ${COLORS.critical}`,
            borderRadius: 8,
            opacity: 0.75,
          }}>
            <span style={{ color: COLORS.error, fontWeight: 700, fontFamily: MONO }}>✗</span>
            <span>
              <span style={{ color: COLORS.text, fontWeight: 600, fontSize: 13 }}>{w.label}</span>
              <span style={{ color: COLORS.textTertiary, fontSize: 12, marginLeft: 8 }}>{w.note}</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ color: COLORS.textTertiary, fontSize: 11, fontFamily: MONO, marginTop: 12, letterSpacing: 0.4 }}>
        Factors: timezone · prep readiness · attendee availability
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------
// TIMEZONE PANEL
// ------------------------------------------------------------------
function TimezonePanel({ meeting }) {
  const zones = [
    { code: "ET", city: "New York",     offset: 0 },
    { code: "CT", city: "Chicago",       offset: -1 },
    { code: "PT", city: "San Francisco", offset: -3 },
  ];
  const baseMin = meeting.startMin || 600;
  return (
    <Card>
      <SectionHeader num="07" title="Timezone view" subtitle="Attendee local times" />
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
      }}>
        {zones.map(z => {
          const localMin = baseMin + z.offset * 60;
          return (
            <div key={z.code} style={{
              padding: "12px 14px",
              background: COLORS.cardBgMuted,
              border: `1px solid ${COLORS.borderColor}`,
              borderRadius: 8,
            }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: COLORS.textTertiary, letterSpacing: 0.8, marginBottom: 6 }}>
                {z.code} · {z.city.toUpperCase()}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: COLORS.text, fontVariantNumeric: "tabular-nums" }}>
                {formatMin(localMin)}
              </div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>
                meeting start local
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 12, lineHeight: 1.5 }}>
        Prep windows differ by timezone. Attendees in <b>PT</b> have a 3-hour late shift — schedule prep earlier on their clock.
      </div>
    </Card>
  );
}
// ------------------------------------------------------------------
// HISTORY PANEL
// ------------------------------------------------------------------
const HISTORY = [
  { id: "h1", date: "Apr 04", move: "Vendor call → Friday", quality: "good",    note: "No downstream slippage; vendors happy." },
  { id: "h2", date: "Mar 28", move: "CFO review → Thu 4pm", quality: "good",    note: "Board brief went out on time." },
  { id: "h3", date: "Mar 21", move: "CEO 1:1 → Next week",  quality: "mixed",   note: "CEO preferred same-day async; flagged." },
  { id: "h4", date: "Mar 14", move: "Vendor call → Monday", quality: "poor",    note: "Lost narrative continuity for board deck." },
  { id: "h5", date: "Mar 07", move: "Standup → async",      quality: "good",    note: "Team liked time back." },
];

function HistoryPanel() {
  const counts = HISTORY.reduce((acc, h) => { acc[h.quality] = (acc[h.quality]||0)+1; return acc; }, {});
  return (
    <Card>
      <SectionHeader num="08" title="Decision quality — last 5 moves" subtitle="Historical context" />
      <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
        <HistoryStat label="GOOD"  value={counts.good || 0}  color={COLORS.success} />
        <HistoryStat label="MIXED" value={counts.mixed || 0} color={COLORS.warning} />
        <HistoryStat label="POOR"  value={counts.poor || 0}  color={COLORS.error} />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {HISTORY.map(h => {
          const qTone = h.quality === "good"
            ? { bg: COLORS.successBg, fg: COLORS.successText }
            : h.quality === "mixed"
            ? { bg: COLORS.warningBg, fg: COLORS.warningText }
            : { bg: COLORS.critical, fg: COLORS.criticalText };
          return (
            <div key={h.id} style={{
              display: "grid", gridTemplateColumns: "56px 1fr auto", gap: 12, alignItems: "center",
              padding: "10px 13px",
              background: COLORS.cardBgMuted,
              border: `1px solid ${COLORS.borderColor}`,
              borderRadius: 8,
            }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: COLORS.textTertiary, letterSpacing: 0.6 }}>
                {h.date.toUpperCase()}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{h.move}</div>
                <div style={{ fontSize: 11.5, color: COLORS.textSecondary, marginTop: 1 }}>{h.note}</div>
              </div>
              <Pill bg={qTone.bg} fg={qTone.fg}>{h.quality.toUpperCase()}</Pill>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function HistoryStat({ label, value, color }) {
  return (
    <div style={{
      flex: 1, padding: "12px 14px",
      background: COLORS.cardBgMuted,
      border: `1px solid ${COLORS.borderColor}`,
      borderRadius: 8,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 9.5, color: COLORS.textTertiary, letterSpacing: 0.8, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}
// ------------------------------------------------------------------
// OVERRIDE
// ------------------------------------------------------------------
function ManualOverride({ meetings, recommendedId, overrideId, setOverride }) {
  const effectiveId = overrideId || recommendedId;
  return (
    <Card>
      <SectionHeader num="09" title="Manual override" subtitle="Reasoning not captured by scoring" />
      <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: 14 }}>
        Override when: you know something the algorithm doesn't · CEO stated a preference · relationship context isn't modeled.
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <label style={{ fontSize: 10.5, fontFamily: MONO, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 }}>
          Move instead →
        </label>
        <select
          value={overrideId || ""}
          onChange={e => setOverride(e.target.value || null)}
          style={{
            padding: "9px 12px",
            background: "white",
            border: `1px solid ${COLORS.borderColor}`,
            borderRadius: 6,
            fontSize: 13, color: COLORS.text,
            minWidth: 280,
            cursor: "pointer",
          }}
        >
          <option value="">— Use recommendation ({recommendedId}) —</option>
          {meetings.filter(m => m.relationshipImportance != null).map(m => (
            <option key={m.id} value={m.id}>{m.id} · {m.title.split("—")[0].trim()}</option>
          ))}
        </select>
        {overrideId && (
          <button
            onClick={() => setOverride(null)}
            style={{
              fontSize: 10.5, fontFamily: MONO, color: COLORS.accent,
              textTransform: "uppercase", letterSpacing: 0.8,
              padding: "8px 12px", borderRadius: 6,
              border: `1px solid ${COLORS.borderColor}`,
              background: "white",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        )}
      </div>
      <div style={{
        padding: "12px 14px",
        background: overrideId ? COLORS.critical + "55" : COLORS.cardBgMuted,
        border: `1px solid ${overrideId ? COLORS.warning : COLORS.borderColor}`,
        borderRadius: 8,
        fontSize: 12.5, color: COLORS.text, lineHeight: 1.55,
      }}>
        <span style={{
          fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8,
          color: overrideId ? COLORS.criticalText : COLORS.textSecondary,
          marginRight: 8, textTransform: "uppercase",
        }}>
          Effective plan
        </span>
        Cascading impact & time windows now reflect <b>{effectiveId}</b>.
        {overrideId && <>  Manual override is active.</>}
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------
// PORTFOLIO SHELL — matches EA Control Center / Zapier Visualizer
// ------------------------------------------------------------------

const SHELL = { maxW: 1200 };

// Count up from 0 to value when the element scrolls into view. Respects
// prefers-reduced-motion (jumps straight to the final value).
function AnimatedCounter({ value, suffix = "", duration = 1400 }) {
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);
  const counterRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || done) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      setDone(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !done) {
          setDone(true);
          const start = performance.now();
          const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.floor(value * eased));
            if (t < 1) requestAnimationFrame(tick);
            else setDisplay(value);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    if (counterRef.current) io.observe(counterRef.current);
    return () => io.disconnect();
  }, [value, duration, done]);

  return (
    <span ref={counterRef}>
      {display}
      {suffix}
    </span>
  );
}
function ShellTopNav() {
  return (
    <nav
      role="navigation"
      aria-label="Portfolio navigation"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(250, 251, 253, 0.88)",
        backdropFilter: "saturate(180%) blur(12px)",
        WebkitBackdropFilter: "saturate(180%) blur(12px)",
        borderBottom: `1px solid ${COLORS.borderColor}`,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          maxWidth: SHELL.maxW,
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <a
          href="#top"
          aria-label="Devika Ramkaran — back to top"
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            color: COLORS.text, textDecoration: "none", fontWeight: 700, fontSize: 14, letterSpacing: 0.2,
          }}
        >
          <span aria-hidden="true" style={{
            width: 26, height: 26, borderRadius: 7, background: COLORS.accent,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "#FFFFFF", fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
          }}>DR</span>
          <span className="scr-nav-brand-name">Devika Ramkaran</span>
        </a>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <a href="#demo" className="scr-nav-link">Demo</a>
          <a href="#case-study" className="scr-nav-link">Case study</a>
          <a href="mailto:vikkir29@gmail.com" style={{
            padding: "8px 16px", borderRadius: 8, background: COLORS.accent,
            color: "#FFFFFF", textDecoration: "none", fontSize: 13, fontWeight: 700, marginLeft: 6, fontFamily: FONT,
          }}>Contact →</a>
        </div>
      </div>
    </nav>
  );
}

function ShellHero() {
  const stack = ["React", "Inline-CSS", "Weighted-Scoring", "A11y", "Keyboard-First"];
  return (
    <header id="top" style={{ maxWidth: SHELL.maxW, margin: "0 auto", padding: "80px 24px 40px", fontFamily: FONT }}>
      <div style={{
        fontSize: 11, color: COLORS.textSecondary, letterSpacing: 2.2, textTransform: "uppercase",
        fontWeight: 700, borderLeft: `3px solid ${COLORS.accent}`, paddingLeft: 10, marginBottom: 18,
      }}>Portfolio · Systems Design</div>
      <h1 className="scr-hero-headline" style={{
        margin: 0, fontSize: 44, fontWeight: 700, color: COLORS.text, lineHeight: 1.1, letterSpacing: -0.5, maxWidth: 880,
      }}>
        A schedule conflict resolver built on{" "}
        <span style={{ color: COLORS.accent }}>weighted judgment</span>, not drag-and-drop.
      </h1>
      <p style={{
        fontSize: 18, color: COLORS.textSecondary, lineHeight: 1.55, maxWidth: 680, marginTop: 20, marginBottom: 28,
      }}>
        A working EA surface that models how principal assistants actually resolve
        collisions: every colliding meeting scored on relationship, moveability,
        alternatives, prep, and who called it — with the downstream ripple and
        mitigations shown in the same view. Keyboard-first, screen-reader ready,
        built for people who actually ship work.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 30 }}>
        {stack.map((s) => (
          <span key={s} className="scr-stack-chip" style={{
            fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, background: COLORS.cardBg,
            border: `1px solid ${COLORS.borderColor}`, borderRadius: 20, padding: "6px 12px", fontFamily: MONO, letterSpacing: 0.3,          }}>{s}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a href="#demo" style={{
          padding: "12px 20px", borderRadius: 9, background: COLORS.accent, color: "#FFFFFF",
          textDecoration: "none", fontSize: 14, fontWeight: 700, letterSpacing: 0.2, fontFamily: FONT,
        }}>Explore the demo ↓</a>
        <a href="#case-study" style={{
          padding: "12px 20px", borderRadius: 9, background: "transparent", color: COLORS.text,
          textDecoration: "none", fontSize: 14, fontWeight: 700, border: `1px solid ${COLORS.borderStrong}`, letterSpacing: 0.2, fontFamily: FONT,
        }}>Read the case study</a>
      </div>
    </header>
  );
}

function ShellMetricsBand() {
  const metrics = [
    { value: 5, suffix: "", unit: "weighted factors", hero: true, hint: "relationship · moveability · alternatives · prep · caller" },
    { value: 4, suffix: "", unit: "downstream tasks", hint: "cascading impact tracked per move" },
    { value: 44, suffix: "px", unit: "min touch target", hint: "every interactive element, WCAG AA" },
  ];
  return (
    <section aria-label="Design metrics" style={{ background: COLORS.text, color: COLORS.cardBg, padding: "48px 24px", fontFamily: FONT, marginTop: 8 }}>
      <div className="scr-metrics-grid" style={{ maxWidth: SHELL.maxW, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 40, alignItems: "end" }}>
        {metrics.map((m) => (
          <div key={m.unit}>
            <div style={{
              fontFamily: MONO, fontSize: m.hero ? 78 : 56, fontWeight: 800, lineHeight: 1,
              color: m.hero ? COLORS.cardBg : "rgba(250, 251, 253, 0.78)", letterSpacing: -2, fontVariantNumeric: "tabular-nums",
            }}><AnimatedCounter value={m.value} suffix={m.suffix} /></div>
            <div style={{ fontSize: m.hero ? 15 : 13, color: "rgba(250, 251, 253, 0.72)", marginTop: 12, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 }}>{m.unit}</div>
            <div style={{ fontSize: 12, color: "rgba(250, 251, 253, 0.52)", marginTop: 6, lineHeight: 1.4 }}>{m.hint}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ShellDemoFrame({ children }) {
  return (
    <section id="demo" aria-label="Live demo" style={{ maxWidth: SHELL.maxW, margin: "0 auto", padding: "72px 24px 40px", fontFamily: FONT }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: COLORS.textSecondary, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, borderLeft: `3px solid ${COLORS.accent}`, paddingLeft: 10 }}>Live demo</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, margin: "8px 0 6px", letterSpacing: -0.3, color: COLORS.text }}>Five factors, one judgment call</h2>
        <p style={{ fontSize: 15, color: COLORS.textSecondary, margin: 0, maxWidth: 680, lineHeight: 1.55 }}>
          Click any day to see its conflicts, open a recommendation to read the scoring, or override by tapping any bar on the timeline. The resolver surfaces downstream impact and mitigations in the same view.
        </p>
      </div>
      <div className="scr-demo-frame" style={{
        background: COLORS.cardBg, borderRadius: 14, border: `1px solid ${COLORS.borderColor}`, overflow: "hidden",
        boxShadow: "0 1px 2px rgba(42,53,71,0.06), 0 18px 40px rgba(42,53,71,0.08), 0 40px 80px rgba(42,53,71,0.06)",
      }}>
        <div aria-hidden="true" style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
          background: COLORS.cardBgMuted, borderBottom: `1px solid ${COLORS.borderColor}`,
        }}>
          <span style={{ display: "flex", gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#E6D4E1" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#C4CDE3" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#B5C3DA" }} />
          </span>
          <span style={{
            fontFamily: MONO, fontSize: 11, color: COLORS.textSecondary, background: COLORS.cardBg,
            borderRadius: 6, padding: "4px 10px", border: `1px solid ${COLORS.borderColor}`, flex: 1, maxWidth: 360, textAlign: "center",
          }}>schedule-conflict-resolver.vercel.app</span>
        </div>
        <div style={{ padding: "24px 20px 28px" }}>{children}</div>
      </div>
    </section>
  );
}
function ShellCaseStudy() {
  const sections = [
    { id: "problem", title: "The problem", body: "EAs resolve calendar conflicts all day, but every calendar app treats a conflict as a drag-and-drop problem. It isn't. Moving a meeting is a judgment call: whose time is most senior, who called it, how much prep was sunk, how many alternatives exist, and what downstream commitments will shift if it moves. Existing tools flag the overlap in red and leave the rest to the EA's head. I wanted to see if that judgment could be made legible — not automated away, but scored, ranked, and shown alongside the ripple effects so the EA can override with context instead of guessing." },
    { id: "approach", title: "My approach", body: "I modeled the five factors that real EAs weigh when they move a meeting: relationship importance (30%), moveability (25%), alternatives available (20%), prep complexity (15%), and who invited it (10%). Each colliding meeting gets a weighted cost score; the lowest-cost meeting is the recommended move. The surface answers three questions in order: what collides, what should move, and what breaks if it does. A day strip shows conflict count per day so the week is scannable. A timeline renders overlap as visible stripe collisions. A recommendation card shows score, reasoning, cascading downstream tasks, and — critically — three mitigations so the EA closes the loop in one surface." },
    { id: "decisions", title: "Technical decisions", body: "Single-file React component, inline styles, zero external UI libraries — same constraint as the rest of the portfolio so reviewers can read the scoring logic end-to-end in one pass. The Heritage Silver palette is WCAG AA compliant at every contrast pair; every factor bar doubles as a numeric label so color isn't load-bearing. Cascading impact is computed from a small dependency graph on each meeting. Team availability for delegation is real data, not stubbed — each teammate has load %, available windows, and role so the EA can pick by capacity, not by who's top of mind. History tracks the last five resolved conflicts with score delta and outcome so decisions compound instead of evaporating." },
    { id: "reflections", title: "What I'd change next", body: "Next revision learns the weights from the EA's override history — if they consistently override 'relationship' in favor of 'prep sunk,' the weights should drift. I'd add timezone-aware constraint propagation so a move in New York surfaces the downstream effect on a London counterpart, and a 'batch resolve' mode for Monday-morning triage when five conflicts land at once. I'd also expose the scoring model as a read-only audit trail — every resolved conflict stores the snapshot of scores, the mitigation chosen, and the downstream delta — so an EA onboarding their replacement has a record of why moves were made, not just what moved." },
  ];
  return (
    <section id="case-study" aria-label="Case study" style={{ background: COLORS.background, padding: "80px 24px 60px", fontFamily: FONT, borderTop: `1px solid ${COLORS.borderColor}` }}>
      <div style={{ maxWidth: SHELL.maxW, margin: "0 auto" }}>
        <div style={{ fontSize: 11, color: COLORS.textSecondary, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, borderLeft: `3px solid ${COLORS.accent}`, paddingLeft: 10 }}>Case study</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, margin: "8px 0 32px", color: COLORS.text, letterSpacing: -0.3 }}>How this got built</h2>
        <div className="scr-case-grid" style={{ display: "grid", gridTemplateColumns: "minmax(180px, 220px) 1fr", gap: 48, alignItems: "start" }}>
          <nav aria-label="Case study sections" className="scr-case-toc" style={{ position: "sticky", top: 80, fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.4, color: COLORS.textSecondary, fontWeight: 700, marginBottom: 8 }}>On this page</div>
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="scr-toc-link" style={{
                color: COLORS.textSecondary, textDecoration: "none", padding: "6px 0 6px 12px",
                borderLeft: `2px solid ${COLORS.borderColor}`, fontWeight: 600,
              }}>{s.title}</a>
            ))}
          </nav>
          <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
            {sections.map((s) => (
              <article id={s.id} key={s.id}>
                <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 10px", color: COLORS.text, letterSpacing: -0.2 }}>{s.title}</h3>
                <p style={{ fontSize: 16, color: COLORS.text, lineHeight: 1.65, margin: 0, maxWidth: 640 }}>{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
function ShellFooterCTA() {
  return (
    <footer role="contentinfo" style={{ background: COLORS.text, color: COLORS.cardBg, fontFamily: FONT, padding: "72px 24px 36px" }}>
      <div style={{ maxWidth: SHELL.maxW, margin: "0 auto" }}>
        <div className="scr-footer-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 48, alignItems: "end", marginBottom: 48 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "rgba(250, 251, 253, 0.55)", fontWeight: 700, marginBottom: 12 }}>Next piece →</div>
            <h2 style={{ fontSize: 36, fontWeight: 700, margin: 0, lineHeight: 1.15, letterSpacing: -0.4, maxWidth: 560 }}>Need someone who thinks in systems?</h2>
            <p style={{ fontSize: 16, color: "rgba(250, 251, 253, 0.7)", lineHeight: 1.55, marginTop: 14, marginBottom: 0, maxWidth: 480 }}>
              I'm open to EA, chief-of-staff, and operations roles. If the reasoning here maps to a seat you're trying to fill, I'd love to talk.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
            <a href="mailto:vikkir29@gmail.com" style={{
              padding: "14px 22px", borderRadius: 10, background: COLORS.cardBg, color: COLORS.text,
              textDecoration: "none", fontSize: 15, fontWeight: 700, fontFamily: FONT,
            }}>Get in touch →</a>
            <a href="https://github.com/devika-builds/schedule-conflict-resolver" target="_blank" rel="noopener noreferrer" style={{
              padding: "14px 22px", borderRadius: 10, background: "transparent", color: COLORS.cardBg,
              textDecoration: "none", fontSize: 15, fontWeight: 700, border: "1px solid rgba(250, 251, 253, 0.3)", fontFamily: FONT,
            }}>View source ↗</a>
          </div>
        </div>
        <div style={{
          fontSize: 12, color: "rgba(250, 251, 253, 0.4)", borderTop: "1px solid rgba(250, 251, 253, 0.15)",
          paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <span>© 2026 Devika Ramkaran · Built with React + Inline-CSS</span>
          <span>vikkir29@gmail.com</span>
        </div>
      </div>
    </footer>
  );
}
function ShellShortcutOverlay() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = (e) => {
      const el = e.target;
      const inField = el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (inField) return;
      if (e.key === "?" || (e.shiftKey && e.key === "/")) { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === "Escape") { setOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  if (!open) return null;
  const shortcuts = [
    { key: "Tab", desc: "Move focus forward" },
    { key: "Shift + Tab", desc: "Move focus back" },
    { key: "Enter / Space", desc: "Activate focused element" },
    { key: "Esc", desc: "Close this overlay" },
    { key: "?", desc: "Toggle shortcuts" },
  ];
  return (
    <div role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={() => setOpen(false)} style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(42, 53, 71, 0.45)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: FONT,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: COLORS.cardBg, borderRadius: 14, padding: "28px 32px", maxWidth: 440, width: "100%",
        boxShadow: "0 30px 80px rgba(42, 53, 71, 0.35)", border: `1px solid ${COLORS.borderColor}`,
      }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: COLORS.textSecondary, fontWeight: 700, marginBottom: 4 }}>Keyboard</div>
        <h3 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700, color: COLORS.text }}>Shortcuts</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shortcuts.map((s) => (
            <div key={s.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
              <span style={{ fontFamily: MONO, fontSize: 12, padding: "4px 10px", borderRadius: 6, background: COLORS.cardBgMuted, border: `1px solid ${COLORS.borderColor}`, color: COLORS.text, fontWeight: 600 }}>{s.key}</span>
              <span style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: "right" }}>{s.desc}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setOpen(false)} style={{
          marginTop: 24, background: COLORS.accent, color: "#FFFFFF", border: "none", borderRadius: 8,
          padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", fontFamily: FONT,
        }}>Got it</button>
      </div>
    </div>
  );
}

function ShellKeyboardNudge() {
  return (
    <div aria-hidden="true" className="scr-nudge" style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 40, background: COLORS.cardBg,
      border: `1px solid ${COLORS.borderColor}`, borderRadius: 20, padding: "6px 14px",
      fontSize: 11, color: COLORS.textSecondary, fontFamily: FONT, fontWeight: 600,
      boxShadow: "0 2px 8px rgba(42, 53, 71, 0.08)", pointerEvents: "none",
    }}>
      Press{" "}
      <kbd style={{ fontFamily: MONO, background: COLORS.cardBgMuted, padding: "1px 6px", borderRadius: 4, fontSize: 10, border: `1px solid ${COLORS.borderColor}`, color: COLORS.text, marginLeft: 2 }}>?</kbd>{" "}
      for shortcuts
    </div>
  );
}
// ------------------------------------------------------------------
// SCHEDULER DEMO (inner component — rendered inside the demo frame)
// ------------------------------------------------------------------
function SchedulerDemo() {
  const [activeDayKey, setActiveDayKey] = useState("THU");
  const [overrideId, setOverrideId] = useState(null);
  const [applied, setApplied] = useState(false);
  const [selectedMitigation, setSelectedMitigation] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const activeDay = useMemo(() => DAYS.find(d => d.key === activeDayKey), [activeDayKey]);

  const conflictMap = useMemo(() => {
    const map = {};
    for (const d of DAYS) map[d.key] = detectConflicts(d.meetings);
    return map;
  }, []);
  const activeConflicts = conflictMap[activeDayKey] || [];

  const scoredActive = useMemo(() => {
    return activeDay.meetings
      .map(m => ({ meeting: m, score: scoreMeeting(m) }))
      .filter(x => x.score !== null);
  }, [activeDay]);

  const recommended = useMemo(() => {
    if (scoredActive.length === 0) return null;
    return [...scoredActive].sort((a,b) => a.score.total - b.score.total)[0];
  }, [scoredActive]);

  const active = useMemo(() => {
    if (!recommended) return null;
    if (overrideId) return scoredActive.find(s => s.meeting.id === overrideId) || recommended;
    return recommended;
  }, [overrideId, recommended, scoredActive]);

  useEffect(() => {
    setOverrideId(null);
    setApplied(false);
    setSelectedMitigation(null);
    setSelectedSlot(null);
  }, [activeDayKey]);

  return (
    <div style={{ fontFamily: FONT, color: COLORS.text }}>
      <div style={{ marginBottom: 18 }}>
        <DayStrip days={DAYS} activeKey={activeDayKey} setActive={setActiveDayKey} conflictMap={conflictMap} />
      </div>

      <ConflictAlert day={activeDay} conflicts={activeConflicts} recommended={recommended} onApply={() => setApplied(true)} applied={applied} />

      <div style={{ marginBottom: 18 }}>
        <DayTimeline day={activeDay} recommendedId={recommended ? recommended.meeting.id : null} overrideId={overrideId} conflicts={activeConflicts}
          onSelectBar={(id) => setOverrideId(id === (recommended && recommended.meeting.id) ? null : id)} />
      </div>

      {recommended ? (
        <>
          <div style={{ marginBottom: 18 }}>
            <RecommendationHero meeting={active.meeting} score={active.score} isOverride={!!overrideId} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <SectionHeader num="03" title="Meeting analysis" subtitle="Decision factor breakdown" />
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(scoredActive.length, 3)}, minmax(0, 1fr))`, gap: 16 }}>
              {scoredActive.map(({ meeting, score }) => (
                <MeetingCard key={meeting.id} meeting={meeting} score={score}
                  isRecommended={!overrideId && meeting.id === recommended.meeting.id}
                  isSelectedOverride={overrideId === meeting.id}
                  onClick={() => setOverrideId(meeting.id === recommended.meeting.id ? null : meeting.id)} />
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
            <CascadingImpact meeting={active.meeting} />
            <Mitigation meetingId={active.meeting.id} selected={selectedMitigation} setSelected={setSelectedMitigation} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 18, marginBottom: 18 }}>
            <TimeWindows meeting={active.meeting} selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot} />
            <TimezonePanel meeting={active.meeting} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
            <HistoryPanel />
            <ManualOverride meetings={scoredActive.map(s => s.meeting)} recommendedId={recommended.meeting.id} overrideId={overrideId} setOverride={setOverrideId} />
          </div>
        </>
      ) : (
        <Card pad={40} style={{ textAlign: "center", marginBottom: 18 }}>
          <Kicker text="No actionable conflicts" />
          <div style={{ fontSize: 17, fontWeight: 600, marginTop: 8, color: COLORS.text }}>
            {activeDay.full} has no meetings that require rescheduling.
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 6 }}>
            Switch to a different day above to see the resolver in action.
          </div>
        </Card>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// APP — full portfolio page
// ------------------------------------------------------------------
function App() {
  return (
    <div style={{ background: COLORS.background, minHeight: "100vh", color: COLORS.text, fontFamily: FONT }}>
      <style>{`
        html { scroll-behavior: smooth; }
        .scr-nav-link, .scr-toc-link {
          padding: 8px 14px; border-radius: 8px; text-decoration: none;
          font-size: 13px; font-weight: 600; color: #566175;
          transition: color 120ms ease, background 120ms ease, border-color 120ms ease;
        }
        .scr-nav-link:hover, .scr-toc-link:hover { color: #2A3547; background: rgba(107, 127, 171, 0.08); }
        .scr-nav-link:focus-visible, .scr-toc-link:focus-visible { outline: 2px solid #6B7FAB; outline-offset: 2px; }
        .scr-stack-chip { transition: border-color 150ms ease, transform 150ms ease; }
        .scr-stack-chip:hover { border-color: rgba(107, 127, 171, 0.5); transform: translateY(-1px); }
        .scr-nudge { animation: scr-nudge-in 400ms 1.2s backwards cubic-bezier(.2,.7,.2,1); }
        @keyframes scr-nudge-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        a:focus-visible, button:focus-visible { outline: 2px solid #6B7FAB; outline-offset: 2px; border-radius: 6px; }
        @media (max-width: 960px) { .scr-metrics-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; } }
        @media (max-width: 820px) {
          .scr-metrics-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .scr-case-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .scr-case-toc { position: static !important; flex-direction: row !important; flex-wrap: wrap !important; }
          .scr-case-toc a { border-left: none !important; border-bottom: 2px solid rgba(42,53,71,0.14); padding: 6px 12px !important; }
          .scr-footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; align-items: start !important; }
          .scr-hero-headline { font-size: 34px !important; }
        }
        @media (max-width: 640px) { .scr-hero-headline { font-size: 28px !important; } .scr-nav-brand-name { display: none; } }
        @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } .scr-nudge { animation: none; } }
      `}</style>
      <ShellTopNav />
      <ShellHero />
      <ShellMetricsBand />
      <ShellDemoFrame>
        <SchedulerDemo />
      </ShellDemoFrame>
      <ShellCaseStudy />
      <ShellFooterCTA />
      <ShellShortcutOverlay />
      <ShellKeyboardNudge />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);