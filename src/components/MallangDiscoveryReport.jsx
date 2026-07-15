import { useState } from "react";
import { Mallang } from "./Mallang";
import { getDiaryHistory } from "../lib/diaryHistory";
import {
  buildMonthlyReport, MOOD, PARTS, SITUATIONS, LOADS, REASONS, SLEEP,
} from "../lib/mallangReportEngine";

// mallangReportEngine.js는 순수 로직 파일 — 이 컴포넌트는 그 출력을 그리기만 한다.
// (IMPLEMENTATION.md: "당신이 할 일은 UI를 만드는 것뿐입니다")

const C = {
  bg: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2", card: "#FAF9F6",
};
const MOOD_COLOR = { 1: "#B85450", 2: "#F7C6D9", 3: "#B7B2A9", 4: "#BEE3C0", 5: "#5F8A76" };

const FREQ_KEY = { none: "rarely", sometimes: "sometimes", weekly: "weekly", daily: "daily" };
const GOAL_KEY = { flexibility: "sore", posture: "posture", health: "stamina", stress: "stress" };
const POSTURE_KNOWN_IDS = ["sitting", "standing", "moving", "mixed"];

const DISCOVERY_HISTORY_KEY = "bmti_discovery_history"; // [{monthKey, id}]
function getDiscoveryHistory() {
  try { return JSON.parse(localStorage.getItem(DISCOVERY_HISTORY_KEY)) || []; } catch { return []; }
}
function recordDiscovery(monthKey, id) {
  const hist = getDiscoveryHistory().filter((h) => h.monthKey !== monthKey);
  hist.push({ monthKey, id });
  hist.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  localStorage.setItem(DISCOVERY_HISTORY_KEY, JSON.stringify(hist.slice(0, 12)));
}
function getRecentIdsBefore(monthKey) {
  return getDiscoveryHistory()
    .filter((h) => h.monthKey < monthKey)
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
    .slice(0, 2)
    .map((h) => h.id);
}

function buildProfile(userData) {
  const goals = (userData?.exercise_goals || []).map((g) => GOAL_KEY[g]).filter(Boolean).slice(0, 2);
  const dailyPosture = POSTURE_KNOWN_IDS.includes(userData?.common_posture) ? userData.common_posture : "etc";
  return {
    ageRange: userData?.kakaoAge,
    gender: userData?.kakaoGender,
    freq: FREQ_KEY[userData?.exercise_frequency] || undefined,
    goals,
    dailyPosture,
  };
}

function buildBmti(bmtiCode) {
  const axis = bmtiCode ? String(bmtiCode).split("-")[0] : "";
  return {
    ao: axis.includes("O") ? "O" : "A",
    cl: axis.includes("L") ? "L" : "C",
    dq: axis.includes("Q") ? "Q" : "D",
    zm: axis.includes("M") ? "M" : "Z",
  };
}

export default function MallangDiscoveryReport({ onClose, bmtiCode, userData }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const entries = getDiaryHistory().filter((e) => e.date.startsWith(monthKey));
  const profile = buildProfile(userData);
  const bmti = buildBmti(bmtiCode);
  const recentDiscoveryIds = getRecentIdsBefore(monthKey);

  const report = buildMonthlyReport(entries, profile, { year, month, bmti, empathy: null, recentDiscoveryIds });

  if (report.discovery.found) recordDiscovery(monthKey, report.discovery.id);

  const changeMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    // 2026년 7월 이전, 또는 미래 달은 볼 수 없다.
    if (y < 2026 || (y === 2026 && m < 7)) return;
    if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth() + 1)) return;
    setYear(y); setMonth(m);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: C.bg, overflowY: "auto", fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "20px 20px 60px" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <button onClick={onClose} aria-label="닫기" style={{ border: "none", background: "transparent", fontSize: 22, color: C.ink, cursor: "pointer", padding: 4 }}>‹</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => changeMonth(-1)} style={{ border: "none", background: "transparent", color: C.sub, fontSize: 15, cursor: "pointer", padding: 4 }}>‹</button>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{year}년 {month}월</span>
            <button onClick={() => changeMonth(1)} style={{ border: "none", background: "transparent", color: C.sub, fontSize: 15, cursor: "pointer", padding: 4 }}>›</button>
          </div>
          <div style={{ width: 26 }} />
        </div>
        <h1 style={{ textAlign: "center", fontSize: 20, fontWeight: 800, margin: "0 0 20px" }}>말랑이의 발견</h1>

        <DiscoveryHero discovery={report.discovery} />

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
          {report.sections.map((s) => <SectionCard key={s.id} section={s} />)}
        </div>

        <p style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.6, textAlign: "center", marginTop: 26, padding: "0 8px" }}>
          {report.disclaimer}
        </p>
      </div>
    </div>
  );
}

function DiscoveryHero({ discovery: d }) {
  if (!d.found) {
    return (
      <div style={{ background: "#FDF6EC", border: "1px solid #F2E3C0", borderRadius: 22, padding: "24px 20px", textAlign: "center" }}>
        <p style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{d.lines[0]}</p>
        {d.progress && (
          <p style={{ fontSize: 12.5, color: C.sub, fontWeight: 700, marginTop: 10 }}>
            {d.progress.required}일 중 {d.progress.current}일 기록했어요
          </p>
        )}
      </div>
    );
  }
  return (
    <div style={{ background: "#FFF7ED", border: "1px solid #F5DCB0", borderRadius: 22, padding: "24px 20px" }}>
      <div style={{ fontSize: 13, color: "#B8912A", fontWeight: 800, marginBottom: 10 }}>✨ 말랑이의 발견</div>
      <p style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.5, margin: "0 0 4px" }}>{d.headline}</p>
      {d.evidence && <p style={{ fontSize: 12, color: C.sub, fontWeight: 700, margin: "0 0 14px" }}>{d.evidence}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {d.lines.map((line, i) => (
          <p key={i} style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.6, margin: 0, color: C.ink }}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ section: s }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: "18px 18px 20px" }}>
      <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 8 }}>{s.title}</div>
      {!s.unlocked ? (
        <div>
          <p style={{ fontSize: 12.5, color: C.sub, fontWeight: 700, margin: 0 }}>{s.lockedMessage}</p>
          <ProgressBar current={s.progress.current} required={s.progress.required} />
        </div>
      ) : (
        <>
          {s.summary && <p style={{ fontSize: 13, fontWeight: 700, color: "#5A5448", margin: "0 0 12px" }}>{s.summary}</p>}
          {s.alert && (
            <div style={{ background: "#FDEEEE", border: "1px solid #F3CFCF", borderRadius: 12, padding: "10px 12px", marginBottom: 12, fontSize: 12, fontWeight: 700, color: "#A24B4B" }}>
              {s.alert.message}
            </div>
          )}
          <SectionBody id={s.id} data={s.data} />
        </>
      )}
    </div>
  );
}

function ProgressBar({ current, required }) {
  const pct = Math.min(100, Math.round((current / required) * 100));
  return (
    <div style={{ height: 6, borderRadius: 3, background: "#EDE9E2", marginTop: 10, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: "#C9C4B8", borderRadius: 3 }} />
    </div>
  );
}

function SectionBody({ id, data }) {
  if (!data) return null;
  switch (id) {
    case "mood_calendar": return <MoodCalendar data={data} />;
    case "mood_distribution": return <MoodDistribution data={data} />;
    case "sore_map": return <SoreMap data={data} />;
    case "sore_moments": return <SoreMoments data={data} />;
    case "overwork": return <OverworkBody data={data} />;
    case "movement": return <MovementBody data={data} />;
    case "rest": return <RestBody data={data} />;
    case "sleep": return <SleepBody data={data} />;
    case "notes": return <NotesBody data={data} />;
    default: return null;
  }
}

// ── 기분 달력: 꺾은선 그래프 대신 날짜마다 기분을 그린다 ──
function MoodCalendar({ data }) {
  const cells = [...Array(data.firstWeekday).fill(null), ...data.cells];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
      {cells.map((c, i) => (
        <div key={i} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {c && (c.mood
            ? <div style={{ width: "78%", height: "78%", borderRadius: "50%", background: MOOD_COLOR[c.mood] }} title={MOOD[c.mood]} />
            : <span style={{ fontSize: 10, color: "#D8D3C8" }}>{c.day}</span>)}
        </div>
      ))}
    </div>
  );
}

// ── 이번 달 말랑이들: 막대+% 대신 마스코트 크기로 빈도를 표현한다 ──
function MoodDistribution({ data }) {
  const maxRatio = Math.max(...data.items.map((i) => i.ratio), 0.0001);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 6 }}>
      {data.items.map((it) => (
        <div key={it.mood} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
          <div style={{ height: 52, display: "flex", alignItems: "flex-end" }}>
            {it.count > 0 && <Mallang v={it.mood} size={Math.max(20, Math.round(52 * (it.ratio / maxRatio)))} />}
          </div>
          <span style={{ fontSize: 10, color: C.sub, fontWeight: 700 }}>{it.count}번</span>
        </div>
      ))}
    </div>
  );
}

// ── 뻐근 지도: 가로 막대 대신 몸 실루엣 위에 빈도만큼 큰 점을 찍는다 ──
const BODY_POS = {
  neck: { x: 50, y: 16 }, shoulder: { x: 32, y: 24 }, back: { x: 50, y: 40 },
  waist: { x: 50, y: 55 }, wrist: { x: 22, y: 58 }, pelvis: { x: 50, y: 66 },
  knee: { x: 44, y: 82 }, ankle: { x: 44, y: 96 },
};
function SoreMap({ data }) {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg viewBox="0 0 100 105" width="150" height="158">
        <ellipse cx="50" cy="8" rx="9" ry="9" fill="#F0EDE6" stroke="#DCD6C8" strokeWidth="1" />
        <path d="M50 17 C34 17 30 30 30 45 L30 66 C30 78 38 82 50 82 C62 82 70 78 70 66 L70 45 C70 30 66 17 50 17 Z" fill="#F0EDE6" stroke="#DCD6C8" strokeWidth="1" />
        <path d="M30 82 L27 105 M70 82 L73 105" stroke="#DCD6C8" strokeWidth="6" fill="none" strokeLinecap="round" />
        {data.parts.map((p) => {
          const pos = BODY_POS[p.part];
          if (!pos) return null;
          const r = 3 + 7 * (p.count / (data.maxCount || 1));
          return (
            <circle key={p.part} cx={pos.x} cy={pos.y} r={r} fill="#FF6B9D" opacity={0.75}>
              <title>{p.label} {p.count}번</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}

function SoreMoments({ data }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {data.items.map((it) => (
        <span key={it.situation} style={{ fontSize: 12, fontWeight: 700, background: "#F3F1EC", color: C.ink, borderRadius: 999, padding: "6px 12px" }}>
          {it.label} · {it.count}번
        </span>
      ))}
    </div>
  );
}

function OverworkBody({ data }) {
  const max = Math.max(...data.items.map((i) => i.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.items.map((it) => (
        <BarRow key={it.load} label={it.label} count={it.count} max={max} color="#C9975A" />
      ))}
    </div>
  );
}

function MovementBody({ data }) {
  const max = Math.max(...data.byType.map((i) => i.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.byType.map((it) => (
        <BarRow key={it.type} label={it.label} count={it.count} max={max} color="#5F8A76" />
      ))}
    </div>
  );
}

// 톤 주의: 쉬어간 이유는 절대 강조하지 않는다 — 색·굵기 모두 차분하게, 랭킹처럼 안 보이게.
function RestBody({ data }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {data.items.map((it) => (
        <div key={it.reason} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#8A8577", fontWeight: 600 }}>
          <span>{it.label}</span>
          <span>{it.count}번</span>
        </div>
      ))}
    </div>
  );
}

function SleepBody({ data }) {
  const max = Math.max(...data.items.map((i) => i.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.items.map((it) => (
        <BarRow key={it.level} label={it.label} count={it.count} max={max} color="#6FA3C9" />
      ))}
    </div>
  );
}

function NotesBody({ data }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.items.map((it, i) => (
        <div key={i} style={{ borderLeft: "3px solid #EDE9E2", paddingLeft: 10 }}>
          <div style={{ fontSize: 10.5, color: C.sub, fontWeight: 700, marginBottom: 2 }}>{it.date} · {it.category}</div>
          <div style={{ fontSize: 13, color: C.ink, fontWeight: 600 }}>{it.text}</div>
        </div>
      ))}
    </div>
  );
}

function BarRow({ label, count, max, color }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 3 }}>
        <span>{label}</span><span style={{ color: C.sub }}>{count}번</span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: "#EDE9E2", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.max(6, Math.round((count / max) * 100))}%`, background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}
