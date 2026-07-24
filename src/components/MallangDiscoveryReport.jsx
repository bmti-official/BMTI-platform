import { useState } from "react";
import { Mallang } from "./Mallang";
import { getDiaryHistory, mergeWeatherIntoHistory } from "../lib/diaryHistory";
import { getSavedGeo, requestGeo, fetchWeatherRange } from "../lib/weather";
import {
  buildMonthlyReport, MOOD, PARTS, SITUATIONS, LOADS, REASONS, SLEEP,
} from "../lib/mallangReportEngine";
import { getTypeAccent, YELLOW, YELLOW_LINE, GOLD } from "../lib/typeAccent";

// mallangReportEngine.js는 순수 로직 파일 — 이 컴포넌트는 그 출력을 그리기만 한다.
// (IMPLEMENTATION.md: "당신이 할 일은 UI를 만드는 것뿐입니다")

const C = {
  page: "#FFFFFF", bg: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2", card: "#FFFFFF",
};
const MOOD_COLOR = { 1: "#B85450", 2: "#F7C6D9", 3: "#B7B2A9", 4: "#BEE3C0", 5: "#5F8A76" };
const CARD_SHADOW = "0 1px 2px rgba(28,26,23,0.03), 0 8px 20px rgba(28,26,23,0.05)";

// 섹션 제목 옆 아이콘 — 기기마다 다르게 보이는 유니코드 이모지 대신, 사이트의 다른 하단
// 네비 아이콘(Navbar.jsx)과 같은 currentColor 라인 아이콘으로 통일한다.
const IconCalendar = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="5" width="17" height="15" rx="3" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 3v3.4M16 3v3.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const IconSmile = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="9" cy="10.6" r="1.15" fill="currentColor" />
    <circle cx="15" cy="10.6" r="1.15" fill="currentColor" />
    <path d="M8.6 14.4c1 1.2 5.8 1.2 6.8 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
  </svg>
);
const IconMap = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 21s-6.5-5.6-6.5-10.8a6.5 6.5 0 1 1 13 0C18.5 15.4 12 21 12 21Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);
const IconTimer = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 8.6V13l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
    <path d="M9.5 2.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const IconBattery = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2.5" y="7.5" width="16" height="9" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M20.5 10.5v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <rect x="5" y="10" width="6.5" height="4" rx="1" fill="currentColor" />
  </svg>
);
const IconRun = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="14.6" cy="4.3" r="1.9" fill="currentColor" />
    <path d="M9 21l2-5.4 2.3-2 .7-4-3.4 1.2-1.7 3.2M13.3 9.6l2 2.4 3.7 1M8 12.6l4-1.4 2.6-3.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
const IconMoon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M20 14.2A8.5 8.5 0 1 1 9.8 4a6.8 6.8 0 0 0 10.2 10.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);
const IconZzz = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 6h7l-7 8h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M14 15h5.5l-5.5 5.5h5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.75" />
  </svg>
);
const IconNotepad = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4.5" y="3.5" width="15" height="17" rx="2.4" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 8.5h8M8 12.5h8M8 16.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const IconInfo = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="12" cy="8.3" r="1.15" fill="currentColor" />
    <path d="M12 11.3v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const IconTarget = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="4.6" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </svg>
);
const IconCloud = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 9 3.99 3.99 0 0 0 7 18Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M9 21l-1 1.5M13 21l-1 1.5M17 21l-1 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const IconLink = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M9 12h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M10 8.5H7.5a3.5 3.5 0 1 0 0 7H10M14 8.5h2.5a3.5 3.5 0 1 1 0 7H14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const SECTION_ICON = {
  mood_calendar: IconCalendar, mood_distribution: IconSmile, sore_map: IconMap, sore_moments: IconTimer,
  overwork: IconBattery, movement: IconRun, rest: IconMoon, sleep: IconZzz, notes: IconNotepad,
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
  const [showExample, setShowExample] = useState(false);
  const [tab, setTab] = useState("records"); // "records" | "discovery"
  const [, forceWeatherRefresh] = useState(0); // 날씨를 붙인 뒤 리포트를 다시 읽게 하는 트리거

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
    <div style={{ position: "fixed", inset: 0, zIndex: 30, background: C.page, overflowY: "auto", fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "76px 18px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, margin: "2px 0 2px" }}>
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
        <p style={{ textAlign: "center", fontSize: 12.5, color: C.sub, fontWeight: 700, margin: "0 0 16px" }}>
          이번 달 {report.meta.recordedDays}일 기록했어요
        </p>

        {/* 카테고리 탭 — 이번달 기록(근거 데이터) / 이번달 발견(패턴) */}
        <div style={{ display: "flex", background: "#F3F1EC", borderRadius: 999, padding: 4, marginBottom: 18 }}>
          {[["records", "이번달 기록"], ["discovery", "이번달 발견"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, border: "none", cursor: "pointer", borderRadius: 999, padding: "9px 0",
                fontSize: 13.5, fontWeight: 800, fontFamily: "inherit",
                background: tab === key ? "#fff" : "transparent",
                color: tab === key ? C.ink : C.sub,
                boxShadow: tab === key ? "0 1px 3px rgba(28,26,23,0.12)" : "none",
                transition: "color .2s, background .2s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "records" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {report.sections.map((s) => <SectionCard key={s.id} section={s} />)}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <DiscoveryHero report={report} onShowExample={() => setShowExample(true)} />
            {report.discovery.found && <MoreDiscoveries discoveries={report.discoveries} />}
            {report.discovery.found && <CooccurrenceCard report={report} />}
            {report.discovery.found && <BedtimeCard report={report} />}
            {report.discovery.found && <SummaryTilesCard report={report} />}
            {report.discovery.found && <FreeSignals signals={report.freeSignals} />}
            {report.discovery.found && <LoggedTimeCard report={report} />}
            {report.discovery.found && <NoteEffortCard report={report} />}
            {report.discovery.found && <WeatherCard report={report} entries={entries} onWeatherUpdated={() => forceWeatherRefresh((n) => n + 1)} />}
            {report.discovery.found && <MoodFlowCard report={report} />}
            {report.discovery.found && <ProfileLinkCard report={report} profile={profile} />}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 22, padding: "12px 14px", background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 14 }}>
          <span style={{ display: "flex", color: C.sub, marginTop: 1 }}><IconInfo size={14} /></span>
          <p style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.6, margin: 0 }}>{report.disclaimer}</p>
        </div>
      </div>

      {showExample && <DiscoveryExamplePopup onClose={() => setShowExample(false)} />}
    </div>
  );
}

// ── '이런 방식으로 발견을 찾아요' 미리보기 팝업 (실제 예시) ──
function DiscoveryExamplePopup({ onClose }) {
  const t = getTypeAccent();
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(28,26,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 22 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 340, maxHeight: "84vh", overflowY: "auto", background: "#fff", borderRadius: 22, padding: "22px 20px 20px", position: "relative" }}>
        <button onClick={onClose} aria-label="닫기" style={{ position: "absolute", top: 12, right: 14, border: "none", background: "transparent", color: C.sub, fontSize: 16, cursor: "pointer", padding: 4 }}>✕</button>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>발견은 이렇게 찾아요</div>
        <p style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6, margin: "0 0 16px" }}>
          매일 남긴 기록에서 반복되는 패턴을 찾아 한 가지 발견으로 보여드려요. 아래는 예시예요.
        </p>

        {/* 1) 기록이 쌓이면 */}
        <div style={{ fontSize: 11.5, fontWeight: 800, color: t.accentDeep, marginBottom: 8 }}>① 이렇게 기록이 쌓이면</div>
        <div style={{ background: "#FBFAF6", border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 14px", marginBottom: 14 }}>
          {[
            { d: "7/3", s: "목이 불편했어요 · 오래 앉아있을 때" },
            { d: "7/9", s: "목이 불편했어요 · 오래 앉아있을 때" },
            { d: "7/15", s: "목이 불편했어요 · 움직일 때" },
            { d: "7/21", s: "목이 불편했어요 · 오래 앉아있을 때" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "5px 0", fontSize: 12.5 }}>
              <span style={{ color: C.sub, fontWeight: 700, minWidth: 30 }}>{r.d}</span>
              <span style={{ color: C.ink }}>{r.s}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", color: t.accent, fontSize: 18, marginBottom: 6 }}>↓</div>

        {/* 2) 이런 발견을 찾아드려요 */}
        <div style={{ fontSize: 11.5, fontWeight: 800, color: t.accentDeep, marginBottom: 8 }}>② 이런 발견을 찾아드려요</div>
        <div style={{ background: YELLOW, border: `1px solid ${YELLOW_LINE}`, borderRadius: 16, padding: "16px 16px 14px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: t.accentDeep, fontWeight: 800, marginBottom: 10, background: "#fff", padding: "4px 10px", borderRadius: 999 }}>✨ 이번 달의 발견</div>
          <p style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.5, margin: "0 0 6px" }}>목이 불편했던 4번 중 3번이 ‘오래 앉아있을 때’였어요.</p>
          <p style={{ fontSize: 11.5, color: t.accentDeep, fontWeight: 700, margin: "0 0 12px" }}>근거 · 4번 중 3번</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "rgba(255,255,255,0.6)", borderRadius: 12, padding: "12px 14px" }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.55, margin: 0 }}>같은 자세를 오래 유지하면 그 부위가 계속 긴장한다고 알려져 있어요.</p>
            <p style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.55, margin: 0 }}>한 시간에 한 번쯤 앉은 자세를 바꿔보면 어떨까요.</p>
          </div>
        </div>

        <p style={{ fontSize: 11, color: C.mute, lineHeight: 1.6, marginTop: 14 }}>
          위 내용은 예시예요. 회원님이 남긴 실제 기록에서 발견을 찾아드려요.
        </p>
      </div>
    </div>
  );
}

function ExampleQButton({ onClick, t }) {
  return (
    <button onClick={onClick} aria-label="발견 예시 미리보기" style={{ position: "absolute", top: 12, right: 12, width: 26, height: 26, borderRadius: "50%", border: `1.5px solid ${t.accentSoft}`, background: "#fff", color: t.accentDeep, fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>?</button>
  );
}

// 발견 조각 타일에 쓰는 작은 아이콘 배지
function TileBadge({ children, t }) {
  return (
    <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: t.accentSoft, color: t.accentDeep }}>
      {children}
    </span>
  );
}

function FindingTile({ visual, big, small, t }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "13px 13px 12px", boxShadow: "0 1px 3px rgba(28,26,23,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {visual}
        <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: "-0.01em", color: C.ink, lineHeight: 1.2, wordBreak: "keep-all" }}>{big}</div>
      </div>
      <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, marginTop: 8, lineHeight: 1.4 }}>{small}</div>
    </div>
  );
}

// 잠금 해제된 섹션의 데이터만 꺼내온다.
const sectionData = (report, id) => { const s = report.sections.find((x) => x.id === id); return s && s.unlocked ? s.data : null; };

// 이번 달 기록에서 뽑은 '조각'들 — 여러 카드가 공유한다.
function buildTiles(report, t) {
  const dist = sectionData(report, "mood_distribution");
  const sore = sectionData(report, "sore_map");
  const moments = sectionData(report, "sore_moments");
  const move = sectionData(report, "movement");
  const rest = sectionData(report, "rest");
  const sleep = sectionData(report, "sleep");
  const over = sectionData(report, "overwork");
  const topMood = dist && dist.top ? dist.items.find((i) => i.mood === dist.top) : null;

  const tiles = [];
  if (topMood) tiles.push({ visual: <Mallang v={dist.top} size={30} />, big: MOOD[dist.top], small: `가장 많았던 기분 · ${topMood.count}번` });
  if (sore && sore.parts[0]) tiles.push({ visual: <TileBadge t={t}><IconMap size={17} /></TileBadge>, big: sore.parts[0].label, small: `자주 불편했어요 · ${sore.parts[0].count}번` });
  if (moments && moments.items[0]) tiles.push({ visual: <TileBadge t={t}><IconTimer size={17} /></TileBadge>, big: moments.items[0].label, small: `불편했던 순간 · ${moments.items[0].count}번` });
  if (move && move.days) tiles.push({ visual: <TileBadge t={t}><IconRun size={17} /></TileBadge>, big: `${move.days}일`, small: `몸을 움직인 날${move.byType[0] ? ` · ${move.byType[0].label}` : ""}` });
  if (over && over.days) tiles.push({ visual: <TileBadge t={t}><IconBattery size={17} /></TileBadge>, big: `${over.days}일`, small: `평소보다 무리한 날` });
  if (sleep && sleep.items[0]?.count) tiles.push({ visual: <TileBadge t={t}><IconZzz size={17} /></TileBadge>, big: sleep.items[0].label, small: `가장 많던 수면 · ${sleep.items[0].count}번` });
  if (rest && rest.days) tiles.push({ visual: <TileBadge t={t}><IconMoon size={17} /></TileBadge>, big: `${rest.days}일`, small: `쉬어간 날` });
  return tiles;
}

// 흰 카드 + 아이콘 헤더 + 한 줄 설명(hint)을 공유하는 래퍼.
function InfoCard({ icon, title, hint, children }) {
  const t = getTypeAccent();
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 20, padding: "18px 18px 20px", boxShadow: CARD_SHADOW }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: hint ? 6 : 14 }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: t.accentSoft, color: t.accentDeep, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</span>
      </div>
      {hint && <p style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, margin: "0 0 13px", lineHeight: 1.5 }}>{hint}</p>}
      {children}
    </div>
  );
}

// ── 대표 발견(이번 달의 발견) — 가장 중요한 한 가지 + 쉬운 설명 + 팁 ──
function DiscoveryHero({ report, onShowExample }) {
  const d = report.discovery;
  const t = getTypeAccent();

  if (!d.found) {
    return (
      <div style={{ position: "relative", background: YELLOW, border: `1px solid ${YELLOW_LINE}`, borderRadius: 22, padding: "26px 22px", textAlign: "center" }}>
        <ExampleQButton onClick={onShowExample} t={t} />
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <Mallang v={3} size={44} />
        </div>
        <p style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.65, margin: 0, color: C.ink, whiteSpace: "pre-line" }}>{d.lines[0]}</p>
        {d.progress && (
          <>
            <div style={{ maxWidth: 160, margin: "16px auto 6px" }}>
              <ProgressBar current={d.progress.current} required={d.progress.required} color={t.accent} />
            </div>
            <p style={{ fontSize: 12, color: C.sub, fontWeight: 700, margin: 0 }}>
              {d.progress.required}일 중 {d.progress.current}일 기록했어요
            </p>
          </>
        )}
      </div>
    );
  }

  const suggestion = d.lines[d.lines.length - 1];
  const explain = d.lines.slice(0, -1); // 마지막(제안/팁)을 뺀 설명 문장들

  return (
    <div style={{ position: "relative", background: YELLOW, border: `1px solid ${YELLOW_LINE}`, borderRadius: 22, padding: "20px 18px 20px", boxShadow: CARD_SHADOW }}>
      <ExampleQButton onClick={onShowExample} t={t} />
      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: t.accentDeep, fontWeight: 800, marginBottom: 14, background: "#fff", padding: "4px 10px", borderRadius: 999 }}>
        ✨ 이번 달의 발견
      </div>

      {/* 연결(끈) 시각화 — 두 기록을 끈으로 잇고 겹친 횟수만 보여준다 (줄글 대신) */}
      {d.pair && <KnotPair pair={d.pair} t={t} />}

      {/* 핵심 발견 한 줄 + 근거 pill */}
      <p style={{ fontSize: d.pair ? 15.5 : 18, fontWeight: 800, lineHeight: 1.5, letterSpacing: "-0.01em", margin: "0 0 8px" }}>{d.headline}</p>
      {d.evidence && (
        <span style={{ display: "inline-block", fontSize: 11.5, color: t.accentDeep, fontWeight: 800, background: t.accentSoft, padding: "4px 10px", borderRadius: 999 }}>근거 · {d.evidence}</span>
      )}

      {/* 끈 카드가 아니면(비교형 발견) 쉬운 설명을 덧붙인다 */}
      {!d.pair && explain.length > 0 && (
        <div style={{ marginTop: 14, background: "rgba(255,255,255,0.72)", borderRadius: 14, padding: "13px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: t.accentDeep, marginBottom: 6 }}>이게 무슨 뜻이에요?</div>
          {explain.map((line, i) => (
            <p key={i} style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6, margin: i ? "5px 0 0" : 0, color: "#3F3A31" }}>{line}</p>
          ))}
        </div>
      )}

      {/* 한 줄 팁 */}
      {suggestion && (
        <div style={{ display: "flex", gap: 7, alignItems: "flex-start", marginTop: 10, background: "#fff", borderRadius: 12, padding: "12px 13px" }}>
          <span style={{ fontSize: 14 }}>💡</span>
          <p style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.55, margin: 0, color: t.accentDeep }}>{suggestion}</p>
        </div>
      )}
    </div>
  );
}

// 연결(끈) 시각화 — [아이콘 A] —겹친 횟수— [아이콘 B]
const PAIR_EMOJI = {
  situation: { morning: "🌅", moving: "🚶", sitting: "🪑", standing: "🧍", allday: "🕛", etc: "📍" },
  load: { sit: "🪑", stand: "🧍", walk: "🚶", lift: "🏋️", etc: "💪" },
  part: "😣", sleep: "🌙", moodDown: "😔",
};
function pairEmoji(node) {
  const m = PAIR_EMOJI[node.kind];
  if (!m) return "🔗";
  return typeof m === "string" ? m : (m[node.code] || "📍");
}
function KnotNode({ node }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, width: 84, flexShrink: 0 }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 27, boxShadow: "0 2px 8px rgba(28,26,23,0.08)" }}>{pairEmoji(node)}</div>
      <span style={{ fontSize: 11.5, fontWeight: 800, color: C.ink, textAlign: "center", lineHeight: 1.25, wordBreak: "keep-all" }}>{node.label}</span>
    </div>
  );
}
function KnotPair({ pair, t }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", marginBottom: 16 }}>
      <KnotNode node={pair.a} />
      {/* 끈 + 겹친 횟수 pill */}
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", height: 56, minWidth: 40 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 27, height: 2, borderTop: `2px dashed ${t.accent}` }} />
        <span style={{ position: "relative", fontSize: 11, fontWeight: 800, color: "#fff", background: t.accent, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap", boxShadow: "0 1px 4px rgba(28,26,23,0.12)" }}>{pair.overlap} 겹침</span>
      </div>
      <KnotNode node={pair.b} />
    </div>
  );
}

// ── 이번 달 기분 흐름 — 색 스펙트럼 바 + 범례 ──
function MoodFlowCard({ report }) {
  const dist = sectionData(report, "mood_distribution");
  const total = dist ? dist.items.reduce((n, i) => n + i.count, 0) : 0;
  if (!total) return null;
  return (
    <InfoCard icon={<IconSmile size={17} />} title="이번 달 기분 흐름" hint="색이 길수록 그만큼 많았던 기분이에요.">
      <div style={{ display: "flex", height: 16, borderRadius: 999, overflow: "hidden", background: "#F3F1EC" }}>
        {dist.items.map((it) => it.count > 0 && (
          <div key={it.mood} style={{ flex: it.count, background: MOOD_COLOR[it.mood] }} title={`${it.label} ${it.count}번`} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", justifyContent: "center", marginTop: 14 }}>
        {[1, 2, 3, 4, 5].map((v) => (
          <div key={v} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: MOOD_COLOR[v], flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.sub }}>{MOOD[v]}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, marginTop: 12, textAlign: "center" }}>이번 달 총 {total}번의 기분을 기록했어요</div>
    </InfoCard>
  );
}

// ── 이번 달 한눈에 — 발견 조각 타일 ──
function SummaryTilesCard({ report }) {
  const t = getTypeAccent();
  const tiles = buildTiles(report, t).slice(0, 4);
  if (!tiles.length) return null;
  return (
    <InfoCard icon={<IconNotepad size={17} />} title="이번 달 한눈에" hint="이번 달 기록에서 뽑은 조각들이에요.">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {tiles.map((tile, i) => <FindingTile key={i} {...tile} t={t} />)}
      </div>
    </InfoCard>
  );
}

// ── 함께 온 기록 — '오늘의 태그'를 축으로, 그날 함께 찍힌 기록의 동시출현 ──
function CooccurrenceCard({ report }) {
  const t = getTypeAccent();
  const c = report.cooccurrence;
  if (!c) return null;
  return (
    <InfoCard icon={<IconLink size={17} />} title="함께 온 기록" hint={`'${c.tag}'을(를) 적은 ${c.uses}번의 날, 이런 것들이 자주 함께였어요.`}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {c.items.map((it) => (
          <span key={it.label} style={{ fontSize: 12.5, fontWeight: 700, background: t.accentSoft, color: t.accentDeep, borderRadius: 999, padding: "8px 14px", display: "inline-flex", alignItems: "baseline", gap: 5 }}>
            {it.label}<b style={{ fontWeight: 800 }}>{it.count}번</b>
          </span>
        ))}
      </div>
    </InfoCard>
  );
}

// ── 취침 리듬 — 막대 높이=그날 잠든 시간대, 색=다음날 기분 (점수 없이, 기분색으로) ──
function BedtimeCard({ report }) {
  const t = getTypeAccent();
  const b = report.bedtime;
  if (!b) return null;
  return (
    <InfoCard icon={<IconMoon size={17} />} title="이번 달 잠든 시간" hint="막대 높이 = 그날 잠든 시간대 · 색 = 다음날 기분">
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 84, padding: "0 2px" }}>
        {b.items.map((it, i) => (
          <div key={i} style={{ flex: 1, minWidth: 5, height: `${((it.bucket + 1) / b.buckets.length) * 100}%`,
            background: it.nextMood ? MOOD_COLOR[it.nextMood] : "#E7E2D8", borderRadius: 4 }}
            title={`${it.date} · ${b.buckets[it.bucket]}${it.nextMood ? ` → 다음날 ${MOOD[it.nextMood]}` : ""}`} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.sub, fontWeight: 700, marginTop: 6 }}>
        <span>일찍 잠 (막대 낮음)</span><span>늦게 잠 (막대 높음)</span>
      </div>
      {b.trend === "lateLower" && (
        <p style={{ fontSize: 12, color: "#3F3A31", fontWeight: 700, margin: "12px 0 0", lineHeight: 1.5 }}>
          늦게 잔 날일수록 다음날 기분이 낮은 편이었어요.
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 12, paddingTop: 12, borderTop: "1px dashed #EDE9E2" }}>
        {[1, 2, 3, 4, 5].map((v) => (
          <div key={v} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: MOOD_COLOR[v], flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.sub }}>{MOOD[v]}</span>
          </div>
        ))}
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.sub, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#E7E2D8", flexShrink: 0 }} />다음날 기록 없음
        </span>
      </div>
    </InfoCard>
  );
}

// ── 기록 남긴 시간대 — created_at 기준, 하루를 주로 언제 남기는지 ──
function LoggedTimeCard({ report }) {
  const t = getTypeAccent();
  const lt = report.loggedTime;
  if (!lt) return null;
  const max = Math.max(...lt.buckets.map((b) => b.count), 1);
  return (
    <InfoCard icon={<IconTimer size={17} />} title="기록 남긴 시간대" hint="하루를 주로 언제 남기는지 보이는 흐름이에요.">
      <p style={{ fontSize: 14, fontWeight: 700, color: "#3F3A31", margin: "0 0 14px", lineHeight: 1.5 }}>
        주로 <span style={{ color: t.accentDeep, fontWeight: 800 }}>{lt.top}</span>에 하루를 남겨요.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lt.buckets.map((b) => (
          <BarRow key={b.label} label={b.label} count={b.count} max={max} color={t.accent} />
        ))}
      </div>
      {lt.lateLower && (
        <p style={{ fontSize: 12, color: C.sub, fontWeight: 700, margin: "12px 0 0", lineHeight: 1.5 }}>늦게 남긴 날일수록 기분이 조금 낮은 편이었어요.</p>
      )}
    </InfoCard>
  );
}

// ── 기록에 담긴 정성 — 한 줄 일기 길이(평가가 아니라 다독임) ──
function NoteEffortCard({ report }) {
  const t = getTypeAccent();
  const ne = report.noteEffort;
  if (!ne) return null;
  return (
    <InfoCard icon={<IconNotepad size={17} />} title="기록에 담긴 정성" hint="평가가 아니라, 남긴 마음을 헤아려요.">
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, background: "#FBFAF6", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: t.accentDeep }}>{ne.count}줄</div>
          <div style={{ fontSize: 10.5, color: C.sub, fontWeight: 700, marginTop: 3 }}>이번 달 남긴 일기</div>
        </div>
        <div style={{ flex: 1, background: "#FBFAF6", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: t.accentDeep }}>{ne.avgLen}자</div>
          <div style={{ fontSize: 10.5, color: C.sub, fontWeight: 700, marginTop: 3 }}>평균 길이</div>
        </div>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#3F3A31", margin: 0, lineHeight: 1.55 }}>
        {ne.ampLink ? "길게 적은 날엔, 하고 싶은 이야기가 많았나 봐요." : "짧아도 꾸준히 마음을 남겨주셨어요."}
      </p>
    </InfoCard>
  );
}

// ── 날씨와 겹쳐보기 — 위치 1회 허용 → Open-Meteo로 날짜별 날씨 첨부 ──
function WeatherCard({ report, entries, onWeatherUpdated }) {
  const t = getTypeAccent();
  const w = report.weather;
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const enable = async () => {
    setLoading(true); setErr(null);
    try {
      const geo = getSavedGeo() || (await requestGeo());
      const dates = entries.map((e) => e.date).sort();
      if (!dates.length) throw new Error("no-dates");
      const map = await fetchWeatherRange(geo.lat, geo.lon, dates[0], dates[dates.length - 1]);
      mergeWeatherIntoHistory(map);
      if (onWeatherUpdated) onWeatherUpdated();
    } catch (e) {
      setErr(e && e.code === 1 ? "위치 권한을 허용해 주세요." : "날씨를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
    setLoading(false);
  };

  if (w) {
    return (
      <InfoCard icon={<IconCloud size={17} />} title="날씨와 겹쳐보기" hint="비·습도·기온과 불편함을 함께 봤어요.">
        <p style={{ fontSize: 14, fontWeight: 800, color: C.ink, margin: "0 0 12px", lineHeight: 1.5, wordBreak: "keep-all" }}>
          {w.rainMoreSore ? "🌧️ 비 오는 날, 유독 불편했어요." : "날씨에 따른 불편함 차이는 크지 않았어요."}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            { e: "🌧️", label: "비 온 날 불편", n: w.rainSore },
            { e: "☀️", label: "맑은 날 불편", n: w.clearSore },
            { e: "💧", label: "습한 날 불편", n: w.humidSore },
          ].map((it) => (
            <span key={it.label} style={{ fontSize: 12.5, fontWeight: 700, background: t.accentSoft, color: t.accentDeep, borderRadius: 999, padding: "8px 13px", display: "inline-flex", alignItems: "baseline", gap: 5 }}>
              {it.e} {it.label}<b style={{ fontWeight: 800 }}>{it.n}번</b>
            </span>
          ))}
        </div>
      </InfoCard>
    );
  }

  return (
    <InfoCard icon={<IconCloud size={17} />} title="날씨와 겹쳐보기" hint="위치를 한 번만 허용하면 비·습도와 불편함을 함께 볼 수 있어요.">
      <button onClick={enable} disabled={loading}
        style={{ width: "100%", padding: "13px 0", borderRadius: 13, border: "none", background: loading ? "#E7E2D8" : GOLD, color: loading ? "#B7B2A9" : "#fff", fontSize: 14, fontWeight: 800, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
        {loading ? "날씨 불러오는 중…" : "📍 위치 한 번만 허용하기"}
      </button>
      {err && <p style={{ fontSize: 12, color: "#B85450", fontWeight: 700, margin: "10px 0 0", textAlign: "center" }}>{err}</p>}
      <p style={{ fontSize: 11, color: C.sub, fontWeight: 600, margin: "10px 0 0", lineHeight: 1.5, textAlign: "center" }}>
        위치는 날씨 조회에만 쓰고, 대략 좌표만 기기에 보관해요.
      </p>
    </InfoCard>
  );
}

// ── 내 프로필과 이어보기 — 온보딩(운동 빈도·목적·자주 하는 자세)을 이번 달 기록과 연결 ──
const FREQ_LABEL = { rarely: "거의 안 함", sometimes: "가끔", weekly: "주 1회 정도", daily: "거의 매일" };
const POSTURE_LABEL = { sitting: "오래 앉아 있기", standing: "오래 서 있기", moving: "계속 움직이기", mixed: "앉고 서고 섞임" };
const GOAL_LABEL = { sore: "불편함 줄이기", posture: "자세 바로잡기", stamina: "체력 기르기", stress: "스트레스 풀기" };

function ProfileLinkCard({ report, profile }) {
  const t = getTypeAccent();
  const moveDays = sectionData(report, "movement")?.days || 0;
  const overDays = sectionData(report, "overwork")?.days || 0;
  const topSore = sectionData(report, "sore_map")?.parts?.[0] || null;
  const dist = sectionData(report, "mood_distribution");
  const goodDays = dist ? dist.items.filter((i) => i.mood >= 4).reduce((n, i) => n + i.count, 0) : 0;

  const batchim = (w) => { const c = (w || "").slice(-1).charCodeAt(0); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };
  const goalText = {
    sore: topSore ? `자주 불편했던 곳은 '${topSore.label}'${batchim(topSore.label) ? "이었" : "였"}어요.` : "이번 달엔 불편한 곳을 크게 짚지 않으셨어요.",
    posture: overDays ? `평소보다 무리한 날이 ${overDays}번이었어요.` : "평소보다 무리한 날은 많지 않았어요.",
    stamina: `이번 달 ${moveDays}일 몸을 움직이셨어요.`,
    stress: `기분이 좋았던 날이 ${goodDays}일이었어요.`,
  };

  const rows = [];
  (profile.goals || []).forEach((g) => { if (GOAL_LABEL[g]) rows.push({ tag: GOAL_LABEL[g], sub: "내 목표", text: goalText[g] }); });
  if (profile.freq && FREQ_LABEL[profile.freq]) rows.push({ tag: FREQ_LABEL[profile.freq], sub: "운동 빈도", text: `이번 달엔 ${moveDays}일 몸을 움직이셨네요.` });
  if (profile.dailyPosture && POSTURE_LABEL[profile.dailyPosture]) rows.push({ tag: POSTURE_LABEL[profile.dailyPosture], sub: "자주 하는 자세", text: overDays ? `이 자세를 기준으로 '무리한 날'을 ${overDays}번 찾았어요.` : "이 자세를 기준으로 무리한 날을 살펴봤어요." });
  if (!rows.length) return null;

  return (
    <InfoCard icon={<IconTarget size={17} />} title="내 프로필과 이어보기" hint="처음 알려주신 운동 습관과 이번 달 기록을 연결했어요.">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start", background: "#FBFAF6", borderRadius: 12, padding: "12px 13px" }}>
            <span style={{ flexShrink: 0, display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 62 }}>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: C.sub }}>{r.sub}</span>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: t.accentDeep, background: t.accentSoft, padding: "4px 8px", borderRadius: 999, lineHeight: 1.2, textAlign: "center", wordBreak: "keep-all" }}>{r.tag}</span>
            </span>
            <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.55, margin: 0, color: "#3F3A31", alignSelf: "center" }}>{r.text}</p>
          </div>
        ))}
      </div>
    </InfoCard>
  );
}

// 발견 유형별 배지 이모지
const DISC_EMOJI = { D1: "😴", C2: "📍", A1: "⚡", E1: "🏃", F1: "📅", G1: "🌙" };

// 연결(끈) 미니 — 발견 더보기 카드용 (한 줄, 작게)
function MiniKnot({ pair, t }) {
  const Node = ({ node }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 999, padding: "5px 10px", flexShrink: 0 }}>
      <span style={{ fontSize: 15 }}>{pairEmoji(node)}</span>
      <b style={{ fontSize: 11.5, fontWeight: 800, color: C.ink, wordBreak: "keep-all" }}>{node.label}</b>
    </span>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 9 }}>
      <Node node={pair.a} />
      <div style={{ flex: 1, position: "relative", height: 18, minWidth: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 8, borderTop: `2px dashed ${t.accent}` }} />
        <span style={{ position: "relative", fontSize: 9.5, fontWeight: 800, color: "#fff", background: t.accent, padding: "2px 6px", borderRadius: 999, whiteSpace: "nowrap" }}>{pair.overlap}</span>
      </div>
      <Node node={pair.b} />
    </div>
  );
}

// ── 발견 더보기: 대표 외 다른 패턴들 — 줄글 대신 끈/스탯으로 보여준다 ──
function MoreDiscoveries({ discoveries }) {
  const t = getTypeAccent();
  const more = (discoveries || []).slice(1); // [0]은 대표 발견(위 히어로)과 동일
  if (!more.length) return null;
  return (
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ display: "flex", color: t.accentDeep }}><IconMap size={15} /></span>
        이런 발견도 있었어요
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {more.map((d, i) => (
          <div key={d.id || i} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: "14px 16px", boxShadow: CARD_SHADOW }}>
            {d.pair ? (
              <>
                <MiniKnot pair={d.pair} t={t} />
                <p style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.5, margin: 0, color: C.sub, wordBreak: "keep-all" }}>{d.headline}</p>
              </>
            ) : (
              <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: t.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{DISC_EMOJI[d.id] || "🔎"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.5, margin: "0 0 7px", color: C.ink, wordBreak: "keep-all" }}>{d.headline}</p>
                  {d.evidence && (
                    <span style={{ display: "inline-block", fontSize: 11, color: t.accentDeep, fontWeight: 800, background: t.accentSoft, padding: "3px 9px", borderRadius: 999 }}>근거 · {d.evidence}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 입력 없이 찾은 신호: 회복력 / 연속·공백 (추가 입력 없이 기록만으로 계산) ──
function FreeSignals({ signals }) {
  const t = getTypeAccent();
  const reb = signals?.rebound;
  const stk = signals?.streak;
  const cards = [];

  if (reb && reb.low >= 3) {
    const pct = Math.round(reb.ratio * 100);
    cards.push(
      <div key="reb" style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: "15px 16px", boxShadow: CARD_SHADOW }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800, color: t.accentDeep, background: t.accentSoft, padding: "3px 9px", borderRadius: 999, marginBottom: 10 }}>💪 회복력</div>
        <p style={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.5, margin: "0 0 12px", color: C.ink, wordBreak: "keep-all" }}>
          힘들었던 다음날, {reb.low}번 중 <span style={{ color: t.accentDeep }}>{reb.rebound}번</span>은 하루 만에 나아졌어요.
        </p>
        <div style={{ height: 10, borderRadius: 999, background: "#EFEBE3", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.max(8, pct)}%`, background: t.accent, borderRadius: 999 }} />
        </div>
        <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, marginTop: 6 }}>다음날 회복 {pct}%</div>
      </div>
    );
  }

  if (stk && stk.longest >= 2) {
    cards.push(
      <div key="stk" style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: "15px 16px", boxShadow: CARD_SHADOW }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800, color: t.accentDeep, background: t.accentSoft, padding: "3px 9px", borderRadius: 999, marginBottom: 10 }}>🔥 연속·공백</div>
        <p style={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.5, margin: "0 0 12px", color: C.ink, wordBreak: "keep-all" }}>
          이번 달 가장 길게 무리한 건 <span style={{ color: t.accentDeep }}>{stk.longest}일 연속</span>이었어요.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {Array.from({ length: stk.longest }).map((_, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: t.accent }} />
              {i < stk.longest - 1 && <span style={{ width: 10, height: 2, background: t.accentSoft, borderRadius: 2 }} />}
            </span>
          ))}
          {stk.crashAfter && (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 2, background: t.accentSoft, borderRadius: 2 }} />
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: MOOD_COLOR[1] }} title="다음날 기분이 꺾였어요" />
            </span>
          )}
        </div>
        {stk.crashAfter && (
          <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 700, marginTop: 8 }}>그리고 그 다음날 기분이 꺾였어요. 무리한 뒤엔 하루쯤 쉬어가도 좋아요.</div>
        )}
      </div>
    );
  }

  if (!cards.length) return null;
  return (
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, margin: "0 0 4px" }}>입력 없이 찾은 신호</div>
      <p style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, margin: "0 0 10px" }}>따로 적지 않아도 기록만으로 보이는 흐름이에요</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{cards}</div>
    </div>
  );
}

function SectionCard({ section: s }) {
  const Icon = SECTION_ICON[s.id];
  const t = getTypeAccent();
  return (
    <div style={{ background: C.card, borderRadius: 20, padding: "18px 18px 22px", boxShadow: CARD_SHADOW, border: `1px solid ${s.unlocked ? "#F1EEE8" : "#F3F1EC"}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: s.unlocked ? t.accentSoft : "#F3F1EC", color: s.unlocked ? t.accentDeep : "#C0BBB1" }}>
          {Icon && <Icon size={18} />}
        </span>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", color: s.unlocked ? C.ink : "#B7B2A9" }}>{s.title}</span>
        {!s.unlocked && <span style={{ marginLeft: "auto", fontSize: 12 }}>🔒</span>}
      </div>
      {!s.unlocked ? (
        <div>
          <p style={{ fontSize: 13, color: C.sub, fontWeight: 700, margin: "0 0 12px" }}>{s.lockedMessage}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <ProgressBar current={s.progress.current} required={s.progress.required} />
            </div>
            <span style={{ fontSize: 12, color: t.accentDeep, fontWeight: 800, whiteSpace: "nowrap" }}>
              {s.progress.current}/{s.progress.required}
            </span>
          </div>
        </div>
      ) : (
        <>
          {s.summary && <p style={{ fontSize: 14, fontWeight: 700, color: "#3F3A31", lineHeight: 1.55, margin: "0 0 16px" }}>{s.summary}</p>}
          {s.alert && (
            <div style={{ display: "flex", gap: 8, background: "#FDEEEE", border: "1px solid #F3CFCF", borderRadius: 12, padding: "11px 13px", marginBottom: 16 }}>
              <span style={{ fontSize: 13 }}>💬</span>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: "#A24B4B", margin: 0, lineHeight: 1.55 }}>{s.alert.message}</p>
            </div>
          )}
          <SectionBody id={s.id} data={s.data} />
        </>
      )}
    </div>
  );
}

function ProgressBar({ current, required, color }) {
  const fill = color || getTypeAccent().accent;
  const pct = Math.min(100, Math.round((current / required) * 100));
  return (
    <div style={{ height: 9, borderRadius: 999, background: "#EDE9E2", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: fill, borderRadius: 999, transition: "width .3s ease" }} />
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
  const [showLegend, setShowLegend] = useState(false);
  const cells = [...Array(data.firstWeekday).fill(null), ...data.cells];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: i === 0 ? "#E0999A" : i === 6 ? "#8FA9D8" : "#B4AEA2" }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((c, i) => (
          <div key={i} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {c && (c.mood
              ? <div style={{ width: "82%", height: "82%", borderRadius: "50%", background: MOOD_COLOR[c.mood], boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.06)" }} title={MOOD[c.mood]} />
              : <span style={{ fontSize: 11, color: "#D8D3C8", fontWeight: 600 }}>{c.day}</span>)}
          </div>
        ))}
      </div>

      {/* 색상 안내(인라인 미니 범례) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", justifyContent: "center", marginTop: 14, paddingTop: 12, borderTop: "1px dashed #EDE9E2" }}>
        {[1, 2, 3, 4, 5].map((v) => (
          <div key={v} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: MOOD_COLOR[v], flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.sub }}>{MOOD[v]}</span>
          </div>
        ))}
      </div>

      {showLegend && (
        <div onClick={() => setShowLegend(false)} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(28,26,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 300, background: "#fff", borderRadius: 22, padding: "22px 22px 20px", position: "relative" }}>
            <button
              onClick={() => setShowLegend(false)}
              aria-label="닫기"
              style={{ position: "absolute", top: 12, right: 14, border: "none", background: "transparent", color: "#9B9489", fontSize: 15, cursor: "pointer", padding: 4 }}
            >
              ✕
            </button>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1C1A17", marginBottom: 16 }}>색깔이 뜻하는 기분</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <div key={v} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: MOOD_COLOR[v], flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1C1A17" }}>{MOOD[v]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 이번 달 말랑이들: 막대+% 대신 마스코트 크기로 빈도를 표현한다 ──
function MoodDistribution({ data }) {
  const t = getTypeAccent();
  const maxRatio = Math.max(...data.items.map((i) => i.ratio), 0.0001);
  const topCount = Math.max(...data.items.map((i) => i.count), 0);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 6, background: "#FBFAF6", borderRadius: 14, padding: "16px 10px 12px" }}>
      {data.items.map((it) => {
        const isTop = it.count > 0 && it.count === topCount;
        return (
          <div key={it.mood} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
            <div style={{ height: 58, display: "flex", alignItems: "flex-end" }}>
              {it.count > 0 && <Mallang v={it.mood} size={Math.max(24, Math.round(58 * (it.ratio / maxRatio)))} />}
            </div>
            <span style={{ fontSize: 10, color: "#9B9489", fontWeight: 700, textAlign: "center", lineHeight: 1.3 }}>{it.label}</span>
            <span style={{ fontSize: 13, color: isTop ? t.accentDeep : C.ink, fontWeight: 800 }}>{it.count}번</span>
          </div>
        );
      })}
    </div>
  );
}

// ── 뻐근 지도: 가로 막대 대신 몸 실루엣 위에 빈도만큼 큰 점을 찍는다 ──
const BODY_POS = {
  head: { x: 50, y: 8 }, neck: { x: 50, y: 17 }, shoulder: { x: 31, y: 25 },
  elbow: { x: 22, y: 47 }, wrist: { x: 21, y: 60 }, back: { x: 50, y: 38 },
  abdomen: { x: 50, y: 50 }, waist: { x: 50, y: 58 }, pelvis: { x: 50, y: 67 },
  knee: { x: 43, y: 82 }, ankle: { x: 43, y: 97 },
  // etc(기타)는 몸 위치가 없어 지도에 점으로 표시하지 않는다.
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
            <circle key={p.part} cx={pos.x} cy={pos.y} r={r} fill={getTypeAccent().accent} opacity={0.7}>
              <title>{p.label} {p.count}번</title>
            </circle>
          );
        })}
      </svg>
      {top && (
        <p style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, margin: 0, textAlign: "center", lineHeight: 1.55 }}>
          점이 클수록 자주 불편했던 곳이에요<br />가장 많이 짚은 곳은 <b style={{ color: getTypeAccent().accentDeep, fontWeight: 800 }}>{top.label}</b>
        </p>
      )}
    </div>
  );
}

function SoreMoments({ data }) {
  const t = getTypeAccent();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {data.items.map((it) => (
        <span key={it.situation} style={{ fontSize: 12.5, fontWeight: 700, background: t.accentSoft, color: t.accentDeep, borderRadius: 999, padding: "8px 14px", display: "inline-flex", alignItems: "baseline", gap: 5 }}>
          {it.label}<b style={{ fontWeight: 800 }}>{it.count}번</b>
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
        <BarRow key={it.load} label={it.label} count={it.count} max={max} color={getTypeAccent().accent} />
      ))}
    </div>
  );
}

function MovementBody({ data }) {
  const max = Math.max(...data.byType.map((i) => i.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.byType.map((it) => (
        <BarRow key={it.type} label={it.label} count={it.count} max={max} color={getTypeAccent().accent} />
      ))}
    </div>
  );
}

// 톤 주의: 쉬어간 이유는 절대 강조하지 않는다 — 색·굵기 모두 차분하게, 랭킹처럼 안 보이게.
function RestBody({ data }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.items.map((it) => (
        <div key={it.reason} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#7C776C", fontWeight: 600 }}>
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
        <BarRow key={it.level} label={it.label} count={it.count} max={max} color={getTypeAccent().accent} />
      ))}
    </div>
  );
}

function NotesBody({ data }) {
  const t = getTypeAccent();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.items.map((it, i) => (
        <div key={i} style={{ background: "#FBFAF6", borderRadius: 12, borderLeft: `3px solid ${t.accent}`, padding: "11px 13px" }}>
          <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, marginBottom: 4 }}>{it.date} · {it.category}</div>
          <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 600, lineHeight: 1.55 }}>{it.text}</div>
        </div>
      ))}
    </div>
  );
}

function BarRow({ label, count, max, color }) {
  const accentDeep = getTypeAccent().accentDeep;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
        <span>{label}</span><span style={{ color: accentDeep, fontWeight: 800 }}>{count}번</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: "#EFEBE3", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.max(8, Math.round((count / max) * 100))}%`, background: color, borderRadius: 999, transition: "width .3s ease" }} />
      </div>
    </div>
  );
}
