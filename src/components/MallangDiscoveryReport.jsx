import { useState } from "react";
import { Mallang } from "./Mallang";
import { getDiaryHistory } from "../lib/diaryHistory";
import {
  buildMonthlyReport, MOOD, PARTS, SITUATIONS, LOADS, REASONS, SLEEP,
} from "../lib/mallangReportEngine";

// mallangReportEngine.js는 순수 로직 파일 — 이 컴포넌트는 그 출력을 그리기만 한다.
// (IMPLEMENTATION.md: "당신이 할 일은 UI를 만드는 것뿐입니다")

const C = {
  page: "#F7F5F1", bg: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2", card: "#FFFFFF",
};
const MOOD_COLOR = { 1: "#B85450", 2: "#F7C6D9", 3: "#B7B2A9", 4: "#BEE3C0", 5: "#5F8A76" };
const CARD_SHADOW = "0 1px 2px rgba(28,26,23,0.03), 0 8px 20px rgba(28,26,23,0.05)";
const SECTION_ICON = {
  mood_calendar: "📅", mood_distribution: "🙂", sore_map: "🗺️", sore_moments: "⏱️",
  overwork: "🔋", movement: "🏃", rest: "🌙", sleep: "😴", notes: "📝",
};

const FREQ_KEY = { none: "rarely", sometimes: "sometimes", weekly: "weekly", daily: "daily" };
const GOAL_KEY = { flexibility: "sore", posture: "posture", health: "stamina", stress: "stress" };
const POSTURE_KNOWN_IDS = ["sitting", "standing", "moving", "mixed"];
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

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

  const canGoPrev = !(year === 2026 && month === 7);
  const canGoNext = !(year === now.getFullYear() && month === now.getMonth() + 1);

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
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: C.page, overflowY: "auto", fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "18px 18px 60px" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <button onClick={onClose} aria-label="닫기" style={{ border: "none", background: "transparent", fontSize: 22, color: C.ink, cursor: "pointer", padding: 4, lineHeight: 1 }}>‹</button>
          <div style={{ fontSize: 15, fontWeight: 800 }}>말랑이의 발견</div>
          <div style={{ width: 26 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, margin: "14px 0 2px" }}>
          <button
            onClick={() => changeMonth(-1)}
            disabled={!canGoPrev}
            style={{ border: "none", background: "transparent", color: canGoPrev ? C.ink : "#D8D3C8", fontSize: 17, cursor: canGoPrev ? "pointer" : "default", padding: 8 }}
          >
            ‹
          </button>
          <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", minWidth: 130, textAlign: "center" }}>{year}년 {month}월</span>
          <button
            onClick={() => changeMonth(1)}
            disabled={!canGoNext}
            style={{ border: "none", background: "transparent", color: canGoNext ? C.ink : "#D8D3C8", fontSize: 17, cursor: canGoNext ? "pointer" : "default", padding: 8 }}
          >
            ›
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 12.5, color: C.sub, fontWeight: 700, margin: "0 0 22px" }}>
          이번 달 {report.meta.recordedDays}일 기록했어요
        </p>

        <DiscoveryHero discovery={report.discovery} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          {report.sections.map((s) => <SectionCard key={s.id} section={s} />)}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 22, padding: "12px 14px", background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 14 }}>
          <span style={{ fontSize: 13 }}>ℹ️</span>
          <p style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.6, margin: 0 }}>{report.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}

function DiscoveryHero({ discovery: d }) {
  if (!d.found) {
    return (
      <div style={{ background: "linear-gradient(180deg, #FBF8F3 0%, #F5F1E9 100%)", border: "1px solid #EEE6D6", borderRadius: 22, padding: "26px 22px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <Mallang v={3} size={44} />
        </div>
        <p style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.65, margin: 0, color: "#6B6252", whiteSpace: "pre-line" }}>{d.lines[0]}</p>
        {d.progress && (
          <>
            <div style={{ maxWidth: 160, margin: "16px auto 6px" }}>
              <ProgressBar current={d.progress.current} required={d.progress.required} color="#D9C79A" />
            </div>
            <p style={{ fontSize: 12, color: "#A69A82", fontWeight: 700, margin: 0 }}>
              {d.progress.required}일 중 {d.progress.current}일 기록했어요
            </p>
          </>
        )}
      </div>
    );
  }
  return (
    <div style={{ background: "linear-gradient(155deg, #FFF8EC 0%, #FFF0DA 100%)", border: "1px solid #F5DCB0", borderRadius: 22, padding: "22px 20px", boxShadow: CARD_SHADOW }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#966B1F", fontWeight: 800, marginBottom: 12, background: "rgba(255,255,255,0.6)", padding: "4px 10px", borderRadius: 999 }}>
        ✨ 이번 달의 발견
      </div>
      <p style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.48, margin: "0 0 6px" }}>{d.headline}</p>
      {d.evidence && <p style={{ fontSize: 12, color: "#A6863F", fontWeight: 700, margin: "0 0 16px" }}>근거 · {d.evidence}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "rgba(255,255,255,0.55)", borderRadius: 14, padding: "14px 16px" }}>
        {d.lines.map((line, i) => (
          <p key={i} style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.6, margin: 0, color: C.ink }}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ section: s }) {
  return (
    <div style={{ background: C.card, borderRadius: 20, padding: "16px 18px 20px", boxShadow: CARD_SHADOW }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <span style={{ fontSize: 15, opacity: s.unlocked ? 1 : 0.45 }}>{SECTION_ICON[s.id] || "•"}</span>
        <span style={{ fontSize: 14.5, fontWeight: 800, color: s.unlocked ? C.ink : "#B7B2A9" }}>{s.title}</span>
        {!s.unlocked && <span style={{ marginLeft: "auto", fontSize: 11 }}>🔒</span>}
      </div>
      {!s.unlocked ? (
        <div>
          <p style={{ fontSize: 12.5, color: C.sub, fontWeight: 700, margin: "0 0 10px" }}>{s.lockedMessage}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <ProgressBar current={s.progress.current} required={s.progress.required} />
            </div>
            <span style={{ fontSize: 11.5, color: "#B7B2A9", fontWeight: 700, whiteSpace: "nowrap" }}>
              {s.progress.current}/{s.progress.required}
            </span>
          </div>
        </div>
      ) : (
        <>
          {s.summary && <p style={{ fontSize: 13, fontWeight: 700, color: "#5A5448", margin: "0 0 14px" }}>{s.summary}</p>}
          {s.alert && (
            <div style={{ display: "flex", gap: 8, background: "#FDEEEE", border: "1px solid #F3CFCF", borderRadius: 12, padding: "10px 12px", marginBottom: 14 }}>
              <span style={{ fontSize: 12 }}>💬</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#A24B4B", margin: 0, lineHeight: 1.5 }}>{s.alert.message}</p>
            </div>
          )}
          <SectionBody id={s.id} data={s.data} />
        </>
      )}
    </div>
  );
}

function ProgressBar({ current, required, color = "#C9975A" }) {
  const pct = Math.min(100, Math.round((current / required) * 100));
  return (
    <div style={{ height: 6, borderRadius: 3, background: "#EDE9E2", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width .3s ease" }} />
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
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#C9C4B8" }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {cells.map((c, i) => (
          <div key={i} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {c && (c.mood
              ? <div style={{ width: "76%", height: "76%", borderRadius: "50%", background: MOOD_COLOR[c.mood] }} title={MOOD[c.mood]} />
              : <span style={{ fontSize: 10, color: "#D8D3C8" }}>{c.day}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 이번 달 말랑이들: 막대+% 대신 마스코트 크기로 빈도를 표현한다 ──
function MoodDistribution({ data }) {
  const maxRatio = Math.max(...data.items.map((i) => i.ratio), 0.0001);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 6 }}>
      {data.items.map((it) => (
        <div key={it.mood} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1 }}>
          <div style={{ height: 52, display: "flex", alignItems: "flex-end" }}>
            {it.count > 0 && <Mallang v={it.mood} size={Math.max(20, Math.round(52 * (it.ratio / maxRatio)))} />}
          </div>
          <span style={{ fontSize: 9.5, color: "#B7B2A9", fontWeight: 700, textAlign: "center", lineHeight: 1.3 }}>{it.label}</span>
          <span style={{ fontSize: 10.5, color: C.ink, fontWeight: 800 }}>{it.count}번</span>
        </div>
      ))}
    </div>
  );
}

// ── 뻐근 지도: 가로 막대 대신 몸 실루엣 위에 빈도만큼 큰 점을 찍는다 ──
const BODY_POS = {
  neck: { x: 50, y: 17 }, shoulder: { x: 31, y: 25 }, back: { x: 50, y: 40 },
  waist: { x: 50, y: 55 }, wrist: { x: 21, y: 58 }, pelvis: { x: 50, y: 66 },
  knee: { x: 43, y: 82 }, ankle: { x: 43, y: 97 },
};
function SoreMap({ data }) {
  const top = [...data.parts].sort((a, b) => b.count - a.count)[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <svg viewBox="0 0 100 106" width="144" height="153">
        <ellipse cx="50" cy="9" rx="9.5" ry="9.5" fill="#F2EFE8" stroke="#DCD6C8" strokeWidth="1.2" />
        <path d="M50 18 C33 18 29 31 29 46 L29 65 C29 78 38 83 50 83 C62 83 71 78 71 65 L71 46 C71 31 67 18 50 18 Z" fill="#F2EFE8" stroke="#DCD6C8" strokeWidth="1.2" />
        <path d="M29 45 C22 46 19 54 19 60" stroke="#DCD6C8" strokeWidth="5.5" fill="none" strokeLinecap="round" />
        <path d="M71 45 C78 46 81 54 81 60" stroke="#DCD6C8" strokeWidth="5.5" fill="none" strokeLinecap="round" />
        <path d="M40 83 L38 105 M60 83 L62 105" stroke="#DCD6C8" strokeWidth="6.5" fill="none" strokeLinecap="round" />
        {data.parts.map((p) => {
          const pos = BODY_POS[p.part];
          if (!pos) return null;
          const r = 3.5 + 6.5 * (p.count / (data.maxCount || 1));
          return (
            <circle key={p.part} cx={pos.x} cy={pos.y} r={r} fill="#FF6B9D" opacity={0.7}>
              <title>{p.label} {p.count}번</title>
            </circle>
          );
        })}
      </svg>
      {top && (
        <p style={{ fontSize: 11.5, color: C.sub, fontWeight: 700, margin: 0 }}>
          점이 클수록 자주 뻐근했던 부위예요 · 가장 많이 짚은 곳은 <b style={{ color: C.ink }}>{top.label}</b>
        </p>
      )}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.items.map((it) => (
        <BarRow key={it.load} label={it.label} count={it.count} max={max} color="#C9975A" />
      ))}
    </div>
  );
}

function MovementBody({ data }) {
  const max = Math.max(...data.byType.map((i) => i.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.byType.map((it) => (
        <BarRow key={it.type} label={it.label} count={it.count} max={max} color="#5F8A76" />
      ))}
    </div>
  );
}

// 톤 주의: 쉬어간 이유는 절대 강조하지 않는다 — 색·굵기 모두 차분하게, 랭킹처럼 안 보이게.
function RestBody({ data }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.items.map((it) => (
        <BarRow key={it.level} label={it.label} count={it.count} max={max} color="#6FA3C9" />
      ))}
    </div>
  );
}

function NotesBody({ data }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.items.map((it, i) => (
        <div key={i} style={{ borderLeft: "3px solid #EDE9E2", paddingLeft: 12 }}>
          <div style={{ fontSize: 10.5, color: C.sub, fontWeight: 700, marginBottom: 3 }}>{it.date} · {it.category}</div>
          <div style={{ fontSize: 13, color: C.ink, fontWeight: 600, lineHeight: 1.5 }}>{it.text}</div>
        </div>
      ))}
    </div>
  );
}

function BarRow({ label, count, max, color }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
        <span>{label}</span><span style={{ color: C.sub }}>{count}번</span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: "#EDE9E2", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.max(6, Math.round((count / max) * 100))}%`, background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}
