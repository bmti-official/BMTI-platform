import { useState, useRef, useMemo, Fragment } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Mallang } from "./Mallang";
import { CHARACTERS, CHARACTER_NAMES } from "../data";
import { DiaryIcon } from "./DiaryIcons";
import { SLEEP_ICON } from "../lib/diaryEntryLabels";

// 오늘의 태그 라벨 → 아이콘 이름 (DiaryWriteFlow의 TAG_CATEGORIES와 동일하게 유지)
const TAG_ICON = {
  "카페인": "caffeine", "음주": "alcohol", "야식·과식": "snacking", "수분 보충": "water", "맵거나 짠 음식": "spicy", "달달 디저트": "dessert", "영양제": "supplement",
  "스마트폰·PC": "phone", "장거리 운전": "driving", "불편한 신발": "shoes", "무거운 짐": "heavyBag", "에어컨·추위": "coldAir",
  "스트레스": "stress", "긴장함": "nervous", "방전됨": "drained", "소화 불량": "indigestion", "생리 중": "period", "생리함": "menstrual", "진통제": "medicine",
};
// 활동량 트랙 말풍선용 이모지
const LOAD_EMOJI = { sit: "🪑", stand: "🧍", walk: "🚶", lift: "📦", etc: "💥" };
const REASON_EMOJI = { busy: "⏰", tired: "🔋", sick: "🤒", rest: "🛋️", forgot: "💭" };
const EX_EMOJI = { "요가": "🧘", "걷기/산책": "🚶", "러닝·조깅": "🏃", "헬스·PT": "🏋️", "필라테스": "🤸", "수영": "🏊", "자전거": "🚴", "등산": "🥾", "축구": "⚽", "농구": "🏀", "배드민턴": "🏸", "테니스": "🎾", "크로스핏": "💪", "댄스": "💃", "스트레칭": "🙆", "명상·호흡": "🧘" };
import { getDiaryHistory, mergeWeatherIntoHistory } from "../lib/diaryHistory";
import { getSavedGeo, requestGeo, fetchWeatherRange } from "../lib/weather";
import {
  buildMonthlyReport, MOOD, PARTS, SITUATIONS, LOADS, REASONS, SLEEP,
} from "../lib/mallangReportEngine";
import { getTypeAccent, YELLOW, YELLOW_LINE, GOLD } from "../lib/typeAccent";
import { getSleepSetting, sleepWindow, sleepBaseIdx, SLEEP_HOURS, SLEEP_IRREGULAR_OPTS, HOTSPOTS } from "../lib/mallangProfile";
import MallangInfoPopup, { habitConfirmedThisMonth } from "./MallangInfoPopup";
import bodyFemaleFront from "../assets/3d_body/female_front.png";
import bodyFemaleBack from "../assets/3d_body/female_back.png";
import bodyMaleFront from "../assets/3d_body/male_front.png";
import bodyMaleBack from "../assets/3d_body/male_back.png";
import { openKakaoChannelChat } from "../lib/kakaoChannel";
import { getRecordMessage } from "../lib/recordMessage";

// mallangReportEngine.js는 순수 로직 파일 — 이 컴포넌트는 그 출력을 그리기만 한다.
// (IMPLEMENTATION.md: "당신이 할 일은 UI를 만드는 것뿐입니다")

const C = {
  page: "#FFFFFF", bg: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2", card: "#FFFFFF",
};
// 현재 2D 말랑이 몸통 색과 맞춘 무드 색(힘들었어요→좋았어요)
const MOOD_COLOR = { 1: "#8A6E7E", 2: "#C9C09E", 3: "#E8E8EB", 4: "#D0BFEB", 5: "#BF8FE9" };
// 박스 그림자를 연한 옐로우 톤으로 통일.
const CARD_SHADOW = "0 2px 4px rgba(220,188,86,0.16), 0 10px 24px rgba(233,203,110,0.42)";

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
// 바디 스캔 — 카메라 아이콘
const IconCamera = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 8h3l1.4-2h7.2L17 8h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="12" cy="13" r="3.3" stroke="currentColor" strokeWidth="1.7" />
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
const IconTag = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5.7a2 2 0 0 1 1.4.6l6.3 6.3a1.6 1.6 0 0 1 0 2.3l-5.7 5.7a1.6 1.6 0 0 1-2.3 0L4.6 12.6A2 2 0 0 1 4 11.2V5.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="8.4" cy="8.4" r="1.4" fill="currentColor" />
  </svg>
);
// 기분 자판기 '분석 기준' 슬롯 아이콘 (이모지 대신 라인 아이콘)
const SLOT_CAT_ICON = { weekday: IconCalendar, weather: IconCloud, sleep: IconMoon, tag: IconTag, activity: IconRun };
const SECTION_ICON = {
  mood_calendar: IconCalendar, mood_distribution: IconSmile, sore_map: IconCamera, sore_moments: IconTimer,
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

// ══════════════════════════════════════════════════════════════
// 잠금 미리보기 — 기록이 부족해 잠긴 박스에 '하드 유저' 예시를 블러로 보여주고,
// 커서를 올리면(또는 탭하면) 블러가 풀리며 어떤 정보가 나오는지 확인할 수 있다.
// ══════════════════════════════════════════════════════════════
function LockedPreview({ children, label }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div
      onMouseEnter={() => setReveal(true)}
      onMouseLeave={() => setReveal(false)}
      onClick={() => setReveal(true)}
      style={{ position: "relative", cursor: reveal ? "default" : "pointer", userSelect: "none", WebkitTapHighlightColor: "transparent" }}
    >
      {/* 열리면 내부를 조작(스와이프 등)할 수 있게 pointerEvents를 켠다 */}
      <div style={{ filter: reveal ? "none" : "blur(6px)", opacity: reveal ? 1 : 0.92, transform: reveal ? "none" : "scale(0.995)", transition: "filter .3s ease, opacity .3s ease, transform .3s ease", pointerEvents: reveal ? "auto" : "none" }}>
        {children}
      </div>
      {/* 잠금 안내 배지 — 블러 상태에서만 보인다 */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", opacity: reveal ? 0 : 1, transition: "opacity .25s ease" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "rgba(28,26,23,0.74)", color: "#fff", padding: "10px 16px", borderRadius: 16, boxShadow: "0 4px 14px rgba(0,0,0,0.22)", backdropFilter: "blur(2px)", textAlign: "center" }}>
          <span style={{ fontSize: 12.5, fontWeight: 800 }}>아직 발견된 내용이 없어요.</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.92, whiteSpace: "nowrap" }}>🔒 {label || "이렇게 채워질 거예요 · 클릭해보세요"}</span>
        </div>
      </div>
    </div>
  );
}

// 하드 유저 한 달치 예시 기록 — 잠긴 박스의 블러 미리보기에 쓴다. 실제 엔진/인사이트 파이프라인에
// 그대로 태워서(같은 렌더러) 데이터 모양이 어긋나지 않게 한다.
const EX_Y = 2025, EX_M = 6;
const exISO = (d) => `${EX_Y}-06-${String(d).padStart(2, "0")}`;
const exAt = (d, h) => `${exISO(d)}T${String(h).padStart(2, "0")}:15:00`;
function buildExampleEntries() {
  const S = (part, situation, level) => ({ part, situation, level });
  // [일, 기분, 수면, 취침시간대, 기록시각(시), 그 외]
  const spec = [
    [1, 3, 1, "1시", 23, { soreness: [S("neck", "sitting", 5)], tags: ["카페인"], note: { category: "일상", text: "오늘은 목이 좀 뻐근했다. 물을 자주 마셔야지." } }],
    [2, 4, 3, "~11시", 22, { exercise: { did: true, types: ["러닝·조깅"] }, overwork: { yes: true, loads: ["sit"] }, soreness: [S("neck", "sitting", 4)], tags: ["스트레스", "카페인"], note: { category: "운동습관", text: "아침 러닝 30분! 개운하다." } }],
    [3, 3, 2, "12시", 22, { soreness: [S("shoulder", "moving", 4)], tags: ["야식·과식"] }],
    [4, 2, 2, "2시 이후", 23, { exercise: { did: false, reason: "tired" }, tags: ["스마트폰·PC"], note: { category: "고민", text: "너무 피곤해서 아무것도 못 했다." } }],
    [5, 5, 1, "1시", 21, { exercise: { did: false, reason: "rest" }, tags: ["수분 보충"] }],
    [6, 4, 3, "~11시", 22, { exercise: { did: true, types: ["걷기/산책"] }, overwork: { yes: true, loads: ["sit"] }, soreness: [S("neck", "sitting", 5)], tags: ["스트레스", "카페인"] }],
    [7, 5, 3, "~11시", 21, { tags: ["수분 보충"], note: { category: "일상", text: "오랜만에 푹 잤다. 컨디션 최고." } }],
    [8, 4, 2, "12시", 22, { exercise: { did: true, types: ["헬스·PT"] }, soreness: [S("shoulder", "standing", 4)], tags: ["카페인"] }],
    [9, 3, 1, "1시", 23, { soreness: [S("neck", "sitting", 4)], tags: ["야식·과식", "카페인"] }],
    [10, 4, 3, "~11시", 22, { overwork: { yes: true, loads: ["sit"] }, soreness: [S("neck", "sitting", 5)], tags: ["카페인"] }],
    [11, 2, 0, "2시 이후", 23, { exercise: { did: false, reason: "tired" }, overwork: { yes: true, loads: ["sit"] }, soreness: [S("back", "sitting", 5)], note: { category: "고민", text: "허리가 계속 아프다. 오래 앉아있어서 그런가." } }],
    [12, 3, 2, "12시", 22, { overwork: { yes: true, loads: ["stand"] }, soreness: [S("neck", "sitting", 4)] }],
    [13, 4, 1, "1시", 22, { overwork: { yes: true, loads: ["sit"] }, soreness: [S("pelvis", "allday", 6)], tags: ["긴장함"] }],
    [14, 4, 3, "~11시", 22, { overwork: { yes: true, loads: ["sit"] }, soreness: [S("neck", "sitting", 4)] }],
    [15, 5, 3, "~11시", 21, { exercise: { did: true, types: ["요가"] }, soreness: [S("waist", "morning", 6)], tags: ["야식·과식"], note: { category: "일상", text: "요가하고 나니 몸이 개운. 근데 밤에 야식이 당긴다." } }],
    [16, 4, 2, "12시", 22, { soreness: [S("pelvis", "allday", 5)], tags: ["야식·과식", "달달 디저트"] }],
    [17, 5, 3, "~11시", 22, { exercise: { did: true, types: ["걷기/산책"] }, soreness: [S("waist", "morning", 6)], tags: ["야식·과식", "카페인"] }],
    [18, 2, 0, "2시 이후", 23, { exercise: { did: false, reason: "rest" }, soreness: [S("pelvis", "allday", 5)], tags: ["야식·과식"], note: { category: "고민", text: "이유 없이 예민한 하루." } }],
    [19, 5, 3, "~11시", 21, { exercise: { did: true, types: ["러닝·조깅"] }, soreness: [S("waist", "morning", 6)] }],
    [20, 3, 2, "12시", 22, { soreness: [S("pelvis", "allday", 5)], tags: ["생리 중"] }],
    [21, 2, 1, "1시", 23, { tags: ["생리 중", "달달 디저트"], note: { category: "일상", text: "컨디션 난조. 초콜릿으로 버티는 중." } }],
    [22, 4, 3, "~11시", 22, { exercise: { did: false, reason: "busy" }, tags: ["생리 중"] }],
    [23, 5, 3, "~11시", 21, { soreness: [S("shoulder", "sitting", 4)], tags: ["카페인"] }],
    [24, 4, 2, "12시", 22, { exercise: { did: true, types: ["헬스·PT"] }, tags: ["수분 보충"] }],
    [25, 3, 2, "12시", 22, { exercise: { did: false, reason: "tired" }, soreness: [S("neck", "sitting", 3)] }],
    [26, 5, 3, "~11시", 21, { exercise: { did: true, types: ["요가"] }, tags: ["수분 보충"], note: { category: "운동습관", text: "한 달 마무리 요가. 뿌듯!" } }],
  ];
  return spec.map(([d, mood, sleep, sleepTime, hour, extra]) => ({
    date: exISO(d), created_at: exAt(d, hour), mood, sleep, sleepTime,
    soreness: extra.soreness || [], tags: extra.tags || [],
    ...(extra.exercise ? { exercise: extra.exercise } : {}),
    ...(extra.overwork ? { overwork: extra.overwork } : {}),
    ...(extra.note ? { note: extra.note } : {}),
  }));
}
const EXAMPLE_ENTRIES = buildExampleEntries();
const EXAMPLE_USER = { nickname: "회원", kakao_gender: "female", kakaoGender: "female", exercise_frequency: "sometimes", common_posture: "sitting", exercise_goals: ["flexibility"] };

export default function MallangDiscoveryReport({ onClose, bmtiCode, userData, isLoggedIn = true, onRequireLogin }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [showExample, setShowExample] = useState(false);
  const [tab, setTab] = useState("records"); // "records" | "discovery"
  const [, forceWeatherRefresh] = useState(0); // 날씨를 붙인 뒤 리포트를 다시 읽게 하는 트리거
  const [savingPDF, setSavingPDF] = useState(false);
  const contentRef = useRef(null);
  const scrollerRef = useRef(null);
  const goTab = (key) => { setTab(key); scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" }); };

  // 다음 페인트까지 대기(탭 전환 후 DOM 갱신 + 이미지 로딩)
  const nextPaint = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120))));
  const waitForImages = (el) => Promise.all(Array.from(el.querySelectorAll("img")).map((img) =>
    (img.complete && img.naturalWidth > 0) ? Promise.resolve() : new Promise((res) => { img.onload = res; img.onerror = res; })));

  // '이번달 기록' + '이번달 발견'을 한 PDF로 만들어 카카오톡(OS 공유 시트)으로 전달 (ResultView 패턴 재사용)
  const handleMonthlyPDF = async () => {
    if (!isLoggedIn) { if (onRequireLogin) onRequireLogin(); return; } // 로그인 사용자만 PDF 받기 → 비로그인은 카카오 시작 팝업
    if (savingPDF) return;
    setSavingPDF(true);
    const prevTab = tab;
    const nickname = userData?.nickname || "회원";
    const reportTitle = `${nickname}님의 BMTI 건강 리포트`;
    let noAnim = null; // 캡처 동안 애니메이션/전환을 꺼서 '움직이는 요소가 어중간하게 찍히는' 문제를 막는다
    try {
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 32;
      const CARD_W = pageWidth - margin * 2;   // 카드를 페이지 가로폭 가득 차게(가로세로 넓게)
      const usableH = pageHeight - margin * 2;
      const gap = 14;
      let cursorY = margin;

      // 폰트가 완전히 로드된 뒤 캡처해야 텍스트 기준선이 어긋나지 않는다.
      if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch { /* noop */ } }

      // 애니메이션·전환·펄스 정지 → 말랑이/왕관/폭죽/바디스캔/빨강점 등이 정착(기본) 상태로 찍힌다.
      noAnim = document.createElement("style");
      // animation:none 은 '기본 상태'로 되돌린다(play-state:paused 는 중간 프레임에 얼어붙어 제거).
      // 2D 말랑이 눈 덮개는 기본이 '덮인' 상태라 눈 감김 → 캡처 땐 숨긴다. 빨강점 펄스는 기본 크기(scale1)로.
      // html2canvas는 음수 마진을 무시해 뒤따르는 문구·이모지가 아래로 밀린다 → 캡처 동안 0으로 맞춰 화면과 같은 간격을 유지.
      noAnim.textContent = "*,*::before,*::after{animation:none !important;transition:none !important;}"
        + ".mallang-eye-cover{opacity:0 !important;transform:scaleY(0) !important;}"
        + ".sore-dot-pulse{transform:none !important;}"
        + ".award-confetti{opacity:0 !important;}"
        + ".neg-margin{margin:0 !important;}";
      document.head.appendChild(noAnim);

      // 표지 — 한글 제목(jsPDF 기본 폰트는 한글 미지원이라 이미지로 렌더)
      const titleEl = document.createElement("div");
      titleEl.style.cssText = "position:fixed;left:-9999px;top:0;width:640px;padding:6px 4px 12px;font-family:'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif;text-align:center;background:#ffffff;";
      const eyebrow = document.createElement("div");
      eyebrow.style.cssText = "font-size:13px;font-weight:800;letter-spacing:.12em;color:#8B7BD8;";
      eyebrow.textContent = `${year}.${String(month).padStart(2, "0")} MONTHLY REPORT`;
      const titleH = document.createElement("div");
      titleH.style.cssText = "font-size:27px;font-weight:900;color:#1C1A17;margin-top:7px;letter-spacing:-0.01em;";
      titleH.textContent = reportTitle;
      titleEl.appendChild(eyebrow); titleEl.appendChild(titleH);
      document.body.appendChild(titleEl);
      try {
        const tCanvas = await html2canvas(titleEl, { scale: 2, backgroundColor: "#ffffff" });
        const tw = CARD_W, th = (tCanvas.height * tw) / tCanvas.width;
        pdf.addImage(tCanvas.toDataURL("image/jpeg", 0.94), "JPEG", (pageWidth - tw) / 2, cursorY, tw, th);
        cursorY += th + gap;
      } finally { document.body.removeChild(titleEl); }

      // html2canvas는 position:fixed 조상 + 내부 스크롤 오프셋에서 좌표를 잘못 잡아
      // 문구가 밀리거나 캡처가 늘어난다. 캡처 동안만 스크롤러를 일반 흐름(static)으로 되돌린다.
      const scroller = scrollerRef.current;
      const saved = scroller ? { position: scroller.style.position, inset: scroller.style.inset, top: scroller.style.top, left: scroller.style.left, right: scroller.style.right, bottom: scroller.style.bottom, overflow: scroller.style.overflow, height: scroller.style.height } : null;
      if (scroller) {
        scroller.style.position = "static";
        scroller.style.inset = "auto";
        scroller.style.overflow = "visible";
        scroller.style.height = "auto";
      }
      try {
        for (const t of ["records", "discovery"]) {
          setTab(t);
          await nextPaint();
          // 카드 목록 컨테이너까지 내려간다 — 자식이 하나뿐인 래퍼(<div key={tab}> 등)를 건너뛰지 않으면
          // 탭 전체가 이미지 한 장으로 캡처되어 좁고 길쭉하게 찌그러진다.
          let root = contentRef.current?.firstElementChild;
          for (let i = 0; i < 3 && root && root.children.length === 1; i++) root = root.firstElementChild;
          if (!root || !root.children.length) continue;
          await waitForImages(root);
          const cards = Array.from(root.children);
          for (const card of cards) {
            // '아직 발견된 내용이 없어요'(잠긴 미리보기) 카드는 PDF에 넣지 않는다.
            if (/아직 발견된 내용이 없어요/.test(card.textContent || "")) continue;
            const rect = card.getBoundingClientRect();
            const canvas = await html2canvas(card, {
              scale: 2, useCORS: true, backgroundColor: "#ffffff", letterRendering: true,
              width: Math.ceil(rect.width), height: Math.ceil(rect.height),
              windowWidth: document.documentElement.clientWidth,
              scrollX: 0, scrollY: -window.scrollY,
            });
            if (!canvas.width || !canvas.height) continue;
            const w = CARD_W;                       // 가로는 항상 페이지 폭 가득 — 좁게 찌그러지지 않게
            const ptPerPx = w / canvas.width;
            const h = canvas.height * ptPerPx;

            if (h <= usableH) {
              // 한 장에 들어가는 카드 — 남은 공간에 안 들어가면 통째로 다음 페이지로
              if (cursorY > margin && cursorY + h > pageHeight - margin) { pdf.addPage(); cursorY = margin; }
              pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", (pageWidth - w) / 2, cursorY, w, h);
              cursorY += h + gap;
            } else {
              // 한 장보다 긴 카드(한 줄 일기장 등) — 폭은 유지한 채 세로로 잘라 여러 페이지에 이어 붙인다.
              if (cursorY > margin) { pdf.addPage(); cursorY = margin; }
              const slicePx = Math.floor(usableH / ptPerPx);
              for (let sy = 0; sy < canvas.height; sy += slicePx) {
                const hpx = Math.min(slicePx, canvas.height - sy);
                const slice = document.createElement("canvas");
                slice.width = canvas.width; slice.height = hpx;
                slice.getContext("2d").drawImage(canvas, 0, sy, canvas.width, hpx, 0, 0, canvas.width, hpx);
                const sh = hpx * ptPerPx;
                if (cursorY > margin && cursorY + sh > pageHeight - margin) { pdf.addPage(); cursorY = margin; }
                pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", (pageWidth - w) / 2, cursorY, w, sh);
                cursorY += sh + gap;
              }
            }
          }
        }
      } finally {
        if (scroller && saved) Object.assign(scroller.style, saved);
      }

      const pdfBlob = pdf.output("blob");
      const fileName = `${reportTitle} ${year}-${String(month).padStart(2, "0")}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({ files: [pdfFile], title: reportTitle, text: `${year}년 ${month}월 ${reportTitle} — 이번 달 기록과 발견이에요.` });
      } else {
        const link = document.createElement("a");
        link.download = fileName; link.href = URL.createObjectURL(pdfBlob); link.click();
        URL.revokeObjectURL(link.href);
        alert(`${reportTitle} PDF가 저장되었어요. 카카오톡 채팅방에서 파일을 첨부해 보내주세요.`);
      }
    } catch (e) {
      console.error("월간 리포트 PDF 생성 오류:", e);
      alert("리포트를 만드는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      if (noAnim) noAnim.remove();
      setTab(prevTab);
      setSavingPDF(false);
    }
  };

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const entries = getDiaryHistory().filter((e) => e.date.startsWith(monthKey));
  const profile = buildProfile(userData);
  const bmti = buildBmti(bmtiCode);
  const recentDiscoveryIds = getRecentIdsBefore(monthKey);

  const report = buildMonthlyReport(entries, profile, { year, month, bmti, empathy: null, recentDiscoveryIds });

  // 잠긴 박스의 블러 미리보기용 — 하드 유저 예시를 같은 파이프라인에 태운다.
  const exReport = useMemo(() => buildMonthlyReport(EXAMPLE_ENTRIES, buildProfile(EXAMPLE_USER), { year: EX_Y, month: EX_M, bmti: buildBmti("OCDM"), empathy: null, recentDiscoveryIds: [] }), []);
  const exIns = useMemo(() => computeInsights(EXAMPLE_ENTRIES, EXAMPLE_USER, exReport), [exReport]);

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
    <div ref={scrollerRef} data-scroll-top style={{ position: "fixed", inset: 0, zIndex: 30, background: C.page, overflowY: "auto", fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "0 18px 96px" }}>
        {/* 날짜 · 기록수 · 탭 — 고정하지 않고 스크롤과 함께 위로 흘러가게 한다. */}
        <div style={{ background: C.page, paddingTop: 60, paddingBottom: 10, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, margin: "2px 0 2px" }}>
          <button
            onClick={() => changeMonth(-1)}
            disabled={!canGoPrev}
            style={{ border: "none", background: "transparent", color: canGoPrev ? C.ink : "#D8D3C8", fontSize: 17, cursor: canGoPrev ? "pointer" : "default", padding: 8 }}
          >
            ‹
          </button>
          <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", minWidth: 130, textAlign: "center", color: "#5E594F" }}>{year}년 {month}월</span>
          <button
            onClick={() => changeMonth(1)}
            disabled={!canGoNext}
            style={{ border: "none", background: "transparent", color: canGoNext ? C.ink : "#D8D3C8", fontSize: 17, cursor: canGoNext ? "pointer" : "default", padding: 8 }}
          >
            ›
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 12.5, color: "#8B7BD8", fontWeight: 700, margin: "0 0 16px" }}>
          {report.meta.recordedDays > 0
            ? getRecordMessage(report.meta.recordedDays, (bmtiCode ? bmtiCode.split("-")[0] : "").includes("M"))
            : "아직 기록이 없어요"}
        </p>

        {/* 카테고리 탭 — 위 날짜·기록수와 함께 고정. 선택 시 흰 알약이 옆으로 미끄러진다 */}
        <div style={{ position: "relative", display: "flex", background: YELLOW, borderRadius: 999, padding: 4 }}>
          <div style={{ position: "absolute", top: 4, bottom: 4, left: 4, width: "calc((100% - 8px) / 2)", transform: `translateX(${tab === "discovery" ? 100 : 0}%)`, background: "#fff", borderRadius: 999, boxShadow: "0 1px 3px rgba(28,26,23,0.12)", transition: "transform .3s cubic-bezier(.34,1.45,.5,1)" }} />
          {[["records", "이번달 기록"], ["discovery", "이번달 발견"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => goTab(key)}
              style={{
                position: "relative", zIndex: 1,
                flex: 1, border: "none", cursor: "pointer", borderRadius: 999, padding: "9px 0",
                fontSize: 13.5, fontWeight: 800, fontFamily: "inherit", background: "transparent",
                color: tab === key ? C.ink : C.sub, transition: "color .2s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        </div>

        <style>{`@keyframes discoTabFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div ref={contentRef}>
        <div key={tab} style={{ animation: savingPDF ? "none" : "discoTabFade .3s ease" }}>
        {tab === "records" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(() => {
              const find = (id) => report.sections.find(x => x.id === id);
              const exFind = (id) => exReport.sections.find(x => x.id === id);
              const topMood = find("mood_distribution")?.data?.top || null;
              const exTopMood = exFind("mood_distribution")?.data?.top || null;
              const gender = userData?.kakao_gender || userData?.kakaoGender;
              // 잠긴(아직 발견된 내용이 없는) 카드는 제일 밑으로 모은다.
              const items = [];
              report.sections.forEach((s) => {
                // 무리·움직임·쉬어감 세 카드는 '활동량 요약' 하나로, '불편했던 순간'은 '바디 스캔'에 합친다.
                if (s.id === "overwork" || s.id === "rest" || s.id === "sore_moments" || s.id === "sleep") return; // 수면(말랑이의 밤)은 '이번 달 발견'으로 옮김
                if (s.id === "movement") {
                  const locked = !(find("movement")?.unlocked || find("rest")?.unlocked || find("overwork")?.unlocked);
                  items.push({ locked, node: <ActivityTrackCard key="activity" topMood={topMood} move={find("movement")} rest={find("rest")} over={find("overwork")}
                    exTopMood={exTopMood} exMove={exFind("movement")} exRest={exFind("rest")} exOver={exFind("overwork")} /> });
                  return;
                }
                const card = <SectionCard key={s.id} section={s} gender={gender} entries={entries} topMood={topMood} moments={s.id === "sore_map" ? find("sore_moments")?.data : null}
                  exampleSection={exFind(s.id)} exampleMoments={s.id === "sore_map" ? exFind("sore_moments")?.data : null} exTopMood={exTopMood} pdfMode={savingPDF} />;
                // '영혼의 단짝'은 '한 줄 일기장'(notes) 바로 앞에 넣는다.
                if (s.id === "notes") { items.push({ locked: !s.unlocked, node: <Fragment key="notes-group"><SoulmateCard entries={entries} exampleEntries={EXAMPLE_ENTRIES} />{card}</Fragment> }); return; }
                items.push({ locked: !s.unlocked, node: card });
              });
              return [...items.filter((i) => !i.locked), ...items.filter((i) => i.locked)].map((i) => i.node);
            })()}
          </div>
        ) : (
          <DiscoveryInsights report={report} entries={entries} userData={userData} nickname={userData?.nickname} bmtiCode={bmtiCode} exIns={exIns} pdfMode={savingPDF} onWeatherUpdated={() => forceWeatherRefresh((n) => n + 1)} />
        )}
        </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 22, padding: "12px 14px", background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 14 }}>
          <span style={{ display: "flex", color: C.sub, marginTop: 1 }}><IconInfo size={14} /></span>
          <p style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.6, margin: 0 }}>{report.disclaimer}<br />🤖 이 리포트는 입력하신 기록을 바탕으로 자동 생성된 참고 정보예요.</p>
        </div>

        {/* 이번 달 기록·발견을 하나의 PDF로 카카오톡으로 받기 — 20일 이상 기록해야 활성화 */}
        {(() => {
          const enough = report.meta.recordedDays >= 20;
          const active = enough && !savingPDF;
          return (
            <button onClick={active ? handleMonthlyPDF : undefined} disabled={!active}
              style={{ width: "100%", marginTop: 16, padding: 16, borderRadius: 15, border: "none", background: enough ? "#FEE500" : "#F3F1EC", color: enough ? "#3C1E1E" : C.sub, fontSize: 14.5, fontWeight: 800, cursor: active ? "pointer" : "default", opacity: savingPDF ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
              {enough && <svg viewBox="0 0 24 24" style={{ width: 19, height: 19, fill: "#3C1E1E" }}><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" /></svg>}
              {savingPDF ? "PDF 만드는 중..." : enough ? `${month}월 기록·발견 PDF로 받기` : `20일 이상 기록하면 받을 수 있어요 (${report.meta.recordedDays}/20)`}
            </button>
          );
        })()}
        <p style={{ textAlign: "center", fontSize: 11, color: C.sub, fontWeight: 600, margin: "10px 0 0" }}>
          한 달에 20일 이상 기록하면 기록·발견을 하나의 PDF로 저장해 카카오톡으로 보낼 수 있어요.
        </p>

        {/* 말랑이의 발견 개선 의견 받기 */}
        <button onClick={openKakaoChannelChat}
          style={{ display: "block", margin: "22px auto 0", border: "none", background: "transparent", color: C.sub, fontSize: 12.5, fontWeight: 700, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
          💬 다이어리와 기록·발견의 개선 의견 보내기
        </button>
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
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", fontSize: 12.5 }}>
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
          <span key={it.label} style={{ fontSize: 12.5, fontWeight: 700, background: t.accentSoft, color: t.accentDeep, borderRadius: 999, padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 5 }}>
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

// ── 이번 달 발견: 날씨 × 신체 불편함 / 기분 ──
// 위치를 한 번 허용받아 날짜별 날씨(비·기온·습도·미세먼지)를 붙이고,
// [신체적 불편함] 2장 + [기분 상태] 3장을 각각 가로 스와이프 카드로 겹쳐 보여준다.
function WeatherFindingCards({ entries, onWeatherUpdated }) {
  const t = getTypeAccent();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const days = (entries || []).filter((e) => e && typeof e.mood === "number");
  const wDays = days.filter((d) => d.weather && typeof d.weather.code === "number");

  const enable = async () => {
    setLoading(true); setErr(null);
    try {
      const geo = getSavedGeo() || (await requestGeo());
      const dates = days.map((e) => e.date).sort();
      if (!dates.length) throw new Error("no-dates");
      const map = await fetchWeatherRange(geo.lat, geo.lon, dates[0], dates[dates.length - 1]);
      mergeWeatherIntoHistory(map);
      if (onWeatherUpdated) onWeatherUpdated();
    } catch (e) {
      setErr(e && e.code === 1 ? "위치 권한을 허용해 주세요." : "날씨를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
    setLoading(false);
  };

  // 아직 날씨를 안 붙였으면(위치 미허용) 안내 + 동의 버튼
  if (wDays.length === 0) {
    return (
      <InsCard badge="이번 달 발견 · 날씨" title="날씨와 내 몸·마음을 겹쳐볼까요?" sub="위치를 한 번만 허용하면 비·기온·습도·미세먼지와 이번 달 기록을 이어봐요">
        <button onClick={enable} disabled={loading}
          style={{ width: "100%", padding: "14px 0", borderRadius: 13, border: "none", background: loading ? "#E7E2D8" : GOLD, color: loading ? "#B7B2A9" : "#fff", fontSize: 14.5, fontWeight: 800, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
          {loading ? "날씨 불러오는 중…" : "📍 날씨 위치 정보 동의하기"}
        </button>
        {err && <p style={{ fontSize: 12, color: "#B85450", fontWeight: 700, margin: "10px 0 0", textAlign: "center" }}>{err}</p>}
        <p style={{ fontSize: 11, color: C.sub, fontWeight: 600, margin: "10px 0 0", lineHeight: 1.5, textAlign: "center" }}>
          위치는 날씨 조회에만 쓰고, 대략 좌표만 기기에 보관해요.
        </p>
      </InsCard>
    );
  }

  // ── 날씨 분류 헬퍼 ──
  const isRainCloud = (w) => (w.precip != null && w.precip >= 1) || RAIN_CODES2.has(w.code) || (w.code != null && w.code >= 3);
  const dayRange = (w) => (w.tmax != null && w.tmin != null ? w.tmax - w.tmin : null);
  const isColdSwing = (w, prevMax) => {
    const r = dayRange(w);
    const bigSwing = r != null && r >= 10;
    const drop = prevMax != null && w.tmax != null && prevMax - w.tmax >= 5;
    return bigSwing || drop;
  };
  const isHotHumid = (w) => w.tmax != null && w.tmax >= 28 && w.humidity != null && w.humidity >= 70;
  const isBadAir = (w) => (w.pm25 != null && w.pm25 >= 36) || (w.pm10 != null && w.pm10 >= 81);

  const avgSoreOf = (list, partSet) => {
    const xs = [];
    list.forEach((d) => (d.soreness || []).forEach((s) => { if (partSet.has(s.part)) xs.push(s.level); }));
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  const soreCountOf = (list, partSet) => {
    let n = 0; list.forEach((d) => (d.soreness || []).forEach((s) => { if (partSet.has(s.part)) n++; })); return n;
  };
  const lowMoodCount = (list) => list.filter((d) => d.mood <= 2).length;

  // 전날 최고기온 참조(기온 저하 판정용)
  const sorted = [...wDays].sort((a, b) => a.date.localeCompare(b.date));
  const prevMax = {};
  for (let i = 0; i < sorted.length; i++) prevMax[sorted[i].date] = i > 0 ? sorted[i - 1].weather.tmax : null;

  const rainDays = wDays.filter((d) => isRainCloud(d.weather));
  const coldDays = wDays.filter((d) => isColdSwing(d.weather, prevMax[d.date]));
  const hotHumidDays = wDays.filter((d) => isHotHumid(d.weather));
  const badAirDays = wDays.filter((d) => isBadAir(d.weather));

  const kneeWaist = new Set(["knee", "waist"]);
  const neckShoulder = new Set(["neck", "shoulder"]);
  const rainSore = avgSoreOf(rainDays, kneeWaist);
  const coldSore = soreCountOf(coldDays, neckShoulder);

  // 거창한 스와이프 카드 대신 — 이런 날이 며칠이었고, 그날 기분 기록이 어땠는지 한 박스에 간단히.
  // 기분 기록에서 특이점(저조한 날)이 없으면 '특이한 점 없음'을 명시한다.
  const moodNote = (list) => (lowMoodCount(list) ? `기분 저조 ${lowMoodCount(list)}일` : "기분 기록엔 특이한 점 없음");
  const rows = [
    { emoji: "🌧️", label: "비·흐린 날", days: rainDays.length, sub: [rainSore != null ? `무릎·허리 평균 ${rainSore.toFixed(1)}점` : null, moodNote(rainDays)].filter(Boolean).join(" · ") },
    { emoji: "🌡️", label: "기온 낮음·큰 일교차", days: coldDays.length, sub: [coldSore ? `목·어깨 기록 ${coldSore}번` : null, moodNote(coldDays)].filter(Boolean).join(" · ") },
    { emoji: "🔥", label: "고온 다습", days: hotHumidDays.length, sub: moodNote(hotHumidDays) },
    { emoji: "🌫️", label: "미세먼지 나쁨", days: badAirDays.length, sub: moodNote(badAirDays) },
  ].filter((r) => r.days > 0);

  return (
    <InsCard badge="이번 달 발견 · 날씨" title="날씨와 겹쳐 본 기록" sub="이런 날이 며칠이었고, 그날 몸·기분 기록이 어땠는지 한눈에">
      {rows.length ? (
        <div style={{ background: "#FBFAF6", border: `1px solid ${C.line}`, borderRadius: 16, padding: "4px 15px" }}>
          {rows.map((r, i) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
              <span style={{ fontSize: 22, width: 28, textAlign: "center", flexShrink: 0 }}>{r.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>{r.label} <b style={{ color: t.accentDeep }}>{r.days}일</b></div>
                {r.sub && <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginTop: 2, wordBreak: "keep-all" }}>{r.sub}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: C.sub, fontWeight: 600, lineHeight: 1.6, margin: 0, background: "#FBFAF6", borderRadius: 14, padding: "16px 15px", textAlign: "center" }}>
          이번 달은 특별한 날씨 패턴이 많지 않았어요.
        </p>
      )}
    </InsCard>
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

// ── 활동량 요약: 무리·움직임·쉬어감을 3개의 단거리 트랙으로 ──
// 단거리 트랙 한 레인 — 금메달 말랑이가 일수만큼 앞서 달리고, 머리 위 말풍선에 1위 종목/이유
function ActLane({ emoji, label, days, maxDays, bubbleEmoji, bubbleLabel, mood }) {
  const pos = days > 0 ? Math.min(88, 10 + 78 * (days / (maxDays || 1))) : 6;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
      <div style={{ width: 62, flexShrink: 0, paddingBottom: 6 }}>
        <div style={{ fontSize: 14 }}>{emoji}</div>
        <div style={{ fontSize: 11, fontWeight: 800, color: C.ink }}>{label}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.sub }}>{days}일</div>
      </div>
      <div style={{ position: "relative", flex: 1, height: 62 }}>
        {/* 트랙 라인 + 결승선 */}
        <div style={{ position: "absolute", left: 0, right: 14, bottom: 11, borderTop: "2px dashed #E3DED4" }} />
        <span style={{ position: "absolute", right: -2, bottom: 3, fontSize: 16 }}>🏁</span>
        {days > 0 && (
          <div style={{ position: "absolute", bottom: 5, left: `${pos}%`, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
            {bubbleLabel && (
              <div style={{ background: "#fff", border: "1px solid #EDE9E2", borderRadius: 10, padding: "2px 7px", fontSize: 9.5, fontWeight: 800, color: C.ink, whiteSpace: "nowrap", boxShadow: "0 1px 3px rgba(0,0,0,.12)", marginBottom: 3 }}>
                {bubbleEmoji} {bubbleLabel} 1위
              </div>
            )}
            <div style={{ animation: "mallangRun .9s ease-in-out infinite" }}><Mallang v={mood} size={26} /></div>
          </div>
        )}
      </div>
    </div>
  );
}
// 세 트랙 레인을 그린다 — 실제/예시 공용
function buildActLanes(move, rest, over) {
  const moveN = move?.data?.days || 0, restN = rest?.data?.days || 0, overN = over?.data?.days || 0;
  const exTop = move?.data?.byType?.[0];
  const restTop = rest?.data?.items?.[0];
  const overTop = over?.data?.items?.[0];
  return {
    maxDays: Math.max(moveN, restN, overN, 1),
    total: moveN + restN + overN,
    lanes: [
      { key: "move", emoji: "🏃‍♂️", label: "운동함", days: moveN, be: exTop ? (EX_EMOJI[exTop.label] || "🏃") : "", bl: exTop?.label },
      { key: "rest", emoji: "🛌", label: "쉬어감", days: restN, be: restTop ? (REASON_EMOJI[restTop.reason] || "🛌") : "", bl: restTop?.label },
      { key: "over", emoji: "💦", label: "무리함", days: overN, be: overTop ? (LOAD_EMOJI[overTop.load] || "💦") : "", bl: overTop?.label },
    ],
  };
}
function ActLanes({ lanes, maxDays, mood }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {lanes.map(l => (
        <ActLane key={l.key} emoji={l.emoji} label={l.label} days={l.days} maxDays={maxDays} bubbleEmoji={l.be} bubbleLabel={l.bl} mood={mood} />
      ))}
    </div>
  );
}
function ActivityTrackCard({ topMood, move, rest, over, exTopMood, exMove, exRest, exOver }) {
  const t = getTypeAccent();
  const mood = topMood || 4; // 이번 달 금메달 말랑이
  const { maxDays, total, lanes } = buildActLanes(move, rest, over);
  const has = total > 0;
  const ex = buildActLanes(exMove, exRest, exOver);
  return (
    <div style={{ background: C.card, borderRadius: 20, padding: "18px 18px 20px", boxShadow: CARD_SHADOW, border: "1px solid #F1EEE8" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: t.accentSoft, color: t.accentDeep }}><IconRun size={18} /></span>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", color: C.ink }}>활동량 요약</span>
      </div>
      <p style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, margin: "0 0 8px" }}>금메달 말랑이가 세 트랙을 달렸어요. 많이 한 트랙일수록 앞서 있어요 🏁</p>
      {has ? (
        <ActLanes lanes={lanes} maxDays={maxDays} mood={mood} />
      ) : (
        <div>
          <p style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, margin: "6px 0 12px", textAlign: "center" }}>이번 달 활동 기록이 아직 없어요.</p>
          <LockedPreview label="이렇게 채워질 거예요 · 클릭해보세요">
            <ActLanes lanes={ex.lanes} maxDays={ex.maxDays} mood={exTopMood || 4} />
          </LockedPreview>
        </div>
      )}
      <style>{`@keyframes mallangRun{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-4px) rotate(3deg)}}`}</style>
    </div>
  );
}

// ── 영혼의 단짝: 이번 달 가장 자주 함께 찍힌 태그 두 개(찰떡궁합) ──
const SOULMATE_WIT = { "스트레스|카페인": "스트레스받을 때마다 커피를 찾으셨군요 🧐", "야식·과식|음주": "한잔하면 야식이 빠질 수 없죠 🍻", "긴장함|카페인": "긴장될 땐 커피 한 모금으로 버티셨네요 ☕" };
// 태그 쌍 동시출현에서 '단짝'을 뽑는다 — 없으면 null
function computeSoulmate(entries) {
  const pc = {};
  (entries || []).forEach(e => { const tags = [...new Set((e.tags || []).filter(x => TAG_ICON[x]))]; for (let i = 0; i < tags.length; i++) for (let j = i + 1; j < tags.length; j++) { const k = [tags[i], tags[j]].sort().join("|"); pc[k] = (pc[k] || 0) + 1; } });
  const top = Object.entries(pc).sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] < 2) return null;
  const [a, b] = top[0].split("|"); const n = top[1];
  const solo = {};
  (entries || []).forEach(e => { [...new Set((e.tags || []))].forEach(tg => { solo[tg] = (solo[tg] || 0) + 1; }); });
  const wit = SOULMATE_WIT[top[0]] || `이 둘이 만난 날이 무려 ${n}일이나 되네요. 서로 꼭 붙어다니는 단짝이었어요 🤝`;
  return { a, b, n, solo, wit };
}
// 이번 달 '오늘의 태그' 선택 횟수 순위(많이 선택한 순)
function computeTagCounts(entries) {
  const c = {};
  (entries || []).forEach(e => (e.tags || []).forEach(tg => { if (TAG_ICON[tg]) c[tg] = (c[tg] || 0) + 1; }));
  return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([tag, n]) => ({ tag, n }));
}
function SoulmateCard({ entries, exampleEntries }) {
  const t = getTypeAccent();
  const realRanked = computeTagCounts(entries);
  const hasReal = realRanked.length > 0;
  const ranked = hasReal ? realRanked : computeTagCounts(exampleEntries);
  if (!ranked.length) return null;

  const soul = computeSoulmate(entries) || (hasReal ? null : computeSoulmate(exampleEntries));

  // 피라미드 — 1 / 2 / 3 행(꼭대기가 제일 많이 선택한 태그)
  const top = ranked.slice(0, 6);
  const rows = [];
  if (top[0]) rows.push([top[0]]);
  if (top[1]) rows.push([top[1], top[2]].filter(Boolean));
  if (top[3]) rows.push([top[3], top[4], top[5]].filter(Boolean));

  const pTile = (item, sz, isTop) => (
    <div key={item.tag} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span style={{ position: "relative", width: sz, height: sz, borderRadius: "50%", background: t.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        {isTop && <span style={{ position: "absolute", top: -15, fontSize: 15 }}>👑</span>}
        <DiaryIcon name={TAG_ICON[item.tag]} size={Math.round(sz * 0.54)} />
      </span>
      <span style={{ fontSize: sz >= 58 ? 12.5 : 11, fontWeight: 800, color: C.ink }}>{item.tag}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: t.accentDeep }}>{item.n}번</span>
    </div>
  );

  const soulBadge = (name) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, animation: "soulmateBob 2.2s ease-in-out infinite" }}>
      <span style={{ width: 58, height: 58, borderRadius: "50%", background: t.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}><DiaryIcon name={TAG_ICON[name]} size={32} /></span>
      <span style={{ fontSize: 11.5, fontWeight: 800, color: C.ink }}>{name}</span>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: t.accentDeep }}>{(soul?.solo?.[name]) || 0}번 선택</span>
    </div>
  );

  const body = (
    <>
      {/* 태그 피라미드 — 제일 많이 선택한 오늘의 태그가 꼭대기 */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0 4px" }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: "flex", justifyContent: "center", gap: ri === 0 ? 0 : 16 }}>
            {row.map(item => pTile(item, ri === 0 ? 62 : ri === 1 ? 52 : 44, ri === 0))}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, textAlign: "center", margin: "10px 0 0", wordBreak: "keep-all" }}>이번 달 가장 자주 남긴 <b style={{ color: t.accentDeep }}>[{top[0].tag}]</b> 태그가 피라미드 꼭대기에 올랐어요!</p>

      {soul && (
        <>
          <div style={{ height: 1, background: C.line, margin: "16px 0 14px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>💞</span>
            <span style={{ fontSize: 14.5, fontWeight: 800, color: C.ink }}>영혼의 단짝</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 0 6px" }}>
            {soulBadge(soul.a)}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 20, animation: "soulmateHeart 1.4s ease-in-out infinite" }}>💞</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: t.accentDeep, whiteSpace: "nowrap" }}>함께 {soul.n}번</span>
            </div>
            {soulBadge(soul.b)}
          </div>
          <p style={{ fontSize: 14, fontWeight: 800, color: C.ink, textAlign: "center", margin: "0 0 6px", wordBreak: "keep-all" }}>이번 달, <b style={{ color: t.accentDeep }}>[{soul.a}]</b>와 <b style={{ color: t.accentDeep }}>[{soul.b}]</b>은 찰떡궁합 영혼의 단짝이었어요!</p>
          <p style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, textAlign: "center", margin: 0, lineHeight: 1.55, wordBreak: "keep-all" }}>{soul.wit}</p>
        </>
      )}
    </>
  );
  return (
    <div style={{ background: C.card, borderRadius: 20, padding: "18px 18px 20px", boxShadow: CARD_SHADOW, border: "1px solid #F1EEE8" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: t.accentSoft, fontSize: 16 }}>🔺</span>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", color: C.ink }}>태그 피라미드</span>
        {!hasReal && <span style={{ marginLeft: "auto", fontSize: 12 }}>🔒</span>}
      </div>
      {hasReal ? body : <LockedPreview label="이렇게 채워질 거예요 · 클릭해보세요">{body}</LockedPreview>}
      <style>{`@keyframes soulmateBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes soulmateHeart{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}`}</style>
    </div>
  );
}

function SectionCard({ section: s, gender, entries, topMood, moments, exampleSection, exampleMoments, exTopMood, pdfMode = false }) {
  const Icon = SECTION_ICON[s.id];
  const t = getTypeAccent();
  const hasExample = !s.unlocked && exampleSection?.data;
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
          {hasExample && (
            <div style={{ marginTop: 16 }}>
              <LockedPreview label="이렇게 채워질 거예요 · 클릭해보세요">
                <SectionBody id={s.id} data={exampleSection.data} gender={gender} entries={EXAMPLE_ENTRIES} topMood={exTopMood} moments={exampleMoments} pdfMode={pdfMode} />
              </LockedPreview>
            </div>
          )}
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
          <SectionBody id={s.id} data={s.data} gender={gender} entries={entries} topMood={topMood} moments={moments} pdfMode={pdfMode} />
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

function SectionBody({ id, data, gender, entries, topMood, moments, pdfMode = false }) {
  if (!data) return null;
  switch (id) {
    case "mood_calendar": return <MoodCalendar data={data} />;
    case "mood_distribution": return <MoodDistribution data={data} />;
    case "sore_map": return <SoreMap data={data} gender={gender} moments={moments} />;
    case "sore_moments": return <SoreMoments data={data} />;
    case "overwork": return <OverworkBody data={data} />;
    case "movement": return <MovementBody data={data} />;
    case "rest": return <RestBody data={data} />;
    case "sleep": return <SleepBody data={data} entries={entries} topMood={topMood} />;
    case "notes": return <NotesBody data={data} entries={entries} pdfMode={pdfMode} />;
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

// ── 이번 달 말랑이 어워즈: 가장 많이 찾아온 기분 TOP 3 금·은·동 시상대 ──
const PODIUM = [
  { rank: 1, medal: "🥇", h: 74, order: 2, bar: "#F4C542", size: 56 },
  { rank: 2, medal: "🥈", h: 54, order: 1, bar: "#C7CDD6", size: 46 },
  { rank: 3, medal: "🥉", h: 40, order: 3, bar: "#D9A066", size: 42 },
];
function MoodDistribution({ data }) {
  const ranked = [...data.items].filter(i => i.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
  if (ranked.length === 0) return null;
  const podium = PODIUM.slice(0, ranked.length).map((p, i) => ({ ...p, item: ranked[i] }));
  return (
    <div style={{ background: "linear-gradient(180deg,#FFFCF2,#FBF7EA)", borderRadius: 16, padding: "18px 12px 14px", position: "relative", overflow: "hidden" }}>
      {/* 1등 축하 폭죽 */}
      {[...Array(10)].map((_, i) => (
        <span key={i} className="award-confetti" style={{ position: "absolute", left: `${8 + i * 9}%`, top: "6%", fontSize: 12,
          animation: `awardPop 1.8s ease-out ${(i % 5) * 0.18}s infinite` }}>{["🎉", "✨", "🎊"][i % 3]}</span>
      ))}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 8, position: "relative", zIndex: 1 }}>
        {podium.sort((a, b) => a.order - b.order).map((p) => (
          <div key={p.rank} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0, maxWidth: 96 }}>
            {/* 왕관은 음수 마진 대신 절대배치 — html2canvas(PDF)가 음수 마진을 무시해 아래 요소가 밀려 내려가는 걸 막는다 */}
            {p.rank === 1 && <div style={{ height: 15, position: "relative", width: "100%" }}>
              <span style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", fontSize: 20, lineHeight: 1, animation: "crownBob 2s ease-in-out infinite" }}>👑</span>
            </div>}
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <Mallang v={p.item.mood} size={p.size} />
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: C.ink, marginTop: 4, textAlign: "center", lineHeight: 1.2, wordBreak: "keep-all" }}>{p.item.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, marginBottom: 5 }}>{p.item.count}번</div>
            {/* 시상대 단 */}
            <div style={{ width: "100%", height: p.h, background: `linear-gradient(180deg, ${p.bar}, ${p.bar}CC)`, borderRadius: "8px 8px 0 0",
              display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 6, boxShadow: "inset 0 2px 0 rgba(255,255,255,0.45)" }}>
              <span style={{ fontSize: 18 }}>{p.medal}</span>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes awardPop { 0% { transform: translateY(0) scale(.6); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(26px) scale(1); opacity: 0; } }
        @keyframes crownBob { 0%,100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-3px) rotate(6deg); } }
      `}</style>
    </div>
  );
}

// ── 뻐근 지도: 3D 캐릭터 앞(좌)·뒤(우) 위에 불편한 부위마다 빨간 점을 찍는다 ──
// 엔진 부위 키 → {v: 앞/뒤, x, y}(정규화 이미지 기준 중심 %). BodySelector3D의 히트존과 좌표를 맞춘다.
// 불편 부위 키/라벨 — '기타'는 직접 적은 이름별로 나눠 센다(부위 지도와 같은 규칙).
// 예: { part: 'etc', partOther: '엉덩이' } → 키 'etc:엉덩이', 라벨 '기타(엉덩이)'
const sorePartKey = (s) => {
  if (!s || s.part == null) return null;
  const other = s.part === "etc" ? String(s.partOther || "").trim() : "";
  return other ? `etc:${other}` : s.part;
};
const sorePartLabel = (key) =>
  (typeof key === "string" && key.startsWith("etc:")) ? `기타(${key.slice(4)})` : (PARTS[key] || key);

// 부위별 점 좌표 — 선택 팝업의 히트존(HOTSPOTS)에서 그대로 뽑아 쓴다.
// 예전엔 부위마다 좌표를 하나씩 손으로 적어둬서, 좌·우로 나뉜 부위(어깨·팔꿈치·손목·무릎·발목)는
// 한쪽에만, 앞뒤 모두 해당하는 부위(머리·어깨·골반 등)는 앞모습에만 점이 찍혔다.
// 히트존에서 만들면 '팝업에서 누를 수 있는 자리'와 '지도에 찍히는 점'이 항상 같아진다.
// 값은 각 히트존의 중심(x + w/2, y + h/2). etc(기타)는 몸에 자리가 없어 히트존이 없고 지도에도 안 나온다.
const BODY_POS_3D = (() => {
  const keyOf = Object.fromEntries(Object.entries(PARTS).map(([k, ko]) => [ko, k]));
  const map = {};
  for (const view of ["front", "back"]) {
    for (const z of HOTSPOTS[view] || []) {
      const key = keyOf[z.part];
      if (!key) continue;
      (map[key] ||= []).push({ v: view, x: z.x + z.w / 2, y: z.y + z.h / 2 });
    }
  }
  return map;
})();
function SoreMap({ data, gender, moments }) {
  const t = getTypeAccent();
  const isMale = gender === "male" || gender === "M" || gender === "남성";
  const imgFront = isMale ? bodyMaleFront : bodyFemaleFront;
  const imgBack = isMale ? bodyMaleBack : bodyFemaleBack;
  const top = [...data.parts].sort((a, b) => b.count - a.count)[0];
  const maxCount = data.maxCount || 1;

  const Figure = ({ src, view, label }) => (
    <div style={{ position: "relative", flex: 1, aspectRatio: "1 / 2", maxWidth: 150 }}>
      <img src={src} alt={label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
      {data.parts.flatMap((p) => {
        // 한 부위가 좌·우 또는 앞·뒤에 걸쳐 있으면 해당하는 자리에 모두 찍는다.
        const spots = (BODY_POS_3D[p.part] || []).filter((pos) => pos.v === view);
        const size = 10 + 20 * (p.count / maxCount); // 누적 많을수록 큰 점
        const isTop = top && (p.key || p.part) === (top.key || top.part);
        return spots.map((pos, i) => (
          // 가운데 정렬은 음수 마진 대신 바깥 래퍼의 transform으로 — PDF(html2canvas)가 음수 마진을 무시해 점이 밀리는 걸 막는다.
          <span key={`${p.key || p.part}-${view}-${i}`} title={`${p.label} ${p.count}번`}
            style={{ position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, width: size, height: size, transform: "translate(-50%,-50%)" }}>
            <span className="sore-dot-pulse"
              style={{ display: "block", width: "100%", height: "100%", borderRadius: "50%",
                background: "radial-gradient(circle, rgba(230,60,55,0.95) 0%, rgba(230,60,55,0.55) 60%, rgba(230,60,55,0) 100%)",
                animation: isTop ? "soreDotPulse 1.8s ease-in-out infinite" : "none" }} />
          </span>
        ));
      })}
      <span style={{ position: "absolute", bottom: -2, left: 0, right: 0, textAlign: "center", fontSize: 11, fontWeight: 700, color: C.sub }}>{label}</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, width: "100%", paddingBottom: 12 }}>
        <Figure src={imgFront} view="front" label="앞모습" />
        <Figure src={imgBack} view="back" label="뒷모습" />
      </div>
      {top && (
        <p style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, margin: 0, textAlign: "center", lineHeight: 1.55 }}>
          점이 클수록 자주 불편했던 곳이에요<br />가장 많이 짚은 곳은 <b style={{ color: "#E63C37", fontWeight: 800 }}>{top.label}</b>
        </p>
      )}

      {/* 부위별 상세 — 평균 불편 강도 + 부위마다 언제 불편했는지를 나눠서 */}
      {data.parts.length > 0 && (
        <div style={{ width: "100%", marginTop: 4, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: C.ink, marginBottom: 10, textAlign: "center" }}>부위별 불편함 · 언제 그랬나요?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.parts.map((p) => (
              <div key={p.key || p.part} style={{ border: `1px solid ${C.line}`, borderRadius: 14, padding: "11px 13px", background: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>
                    {p.label}<span style={{ color: C.sub, fontWeight: 700 }}>({p.count}번)</span>
                  </span>
                  {/* 불편함 강도 평균 박스 — 따로 표시 */}
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: "#E63C37", background: "rgba(230,60,55,0.10)", borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap" }}>
                    평균 강도 {p.avgLevel.toFixed(1)}<span style={{ color: C.sub, fontWeight: 700 }}>/10</span>
                  </span>
                </div>
                {p.situations && p.situations.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.sub, fontWeight: 700, alignSelf: "center", marginRight: 2 }}>언제:</span>
                    {p.situations.map((it) => (
                      <span key={it.situation} style={{ fontSize: 11.5, fontWeight: 700, background: t.accentSoft, color: t.accentDeep, borderRadius: 999, padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {it.label}<b style={{ fontWeight: 800 }}>{it.count}번</b>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>언제인지 기록이 아직 없어요</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`@keyframes soreDotPulse{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.35);opacity:1}}`}</style>
    </div>
  );
}

function SoreMoments({ data }) {
  const t = getTypeAccent();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {data.items.map((it) => (
        <span key={it.situation} style={{ fontSize: 12.5, fontWeight: 700, background: t.accentSoft, color: t.accentDeep, borderRadius: 999, padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 5 }}>
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

// ── 말랑이의 밤: 자는 말랑이 + 머리 위 꿈방울(수면 질) + 협탁 시계(취침 시간대) ──
const BUBBLE_POS = [
  { left: "50%", top: "0%", tx: "-50%" },
  { left: "12%", top: "22%", tx: "0" },
  { left: "74%", top: "16%", tx: "0" },
  { left: "40%", top: "44%", tx: "0" },
];
function SleepBody({ data, entries, topMood }) {
  const bubbles = [...data.items].filter(i => i.count > 0).sort((a, b) => b.count - a.count).slice(0, 4);
  const maxRatio = Math.max(...bubbles.map(b => b.ratio), 0.0001);
  // 취침 시간대 최빈값
  const bt = {};
  (entries || []).forEach(e => { if (e.sleepTime) bt[e.sleepTime] = (bt[e.sleepTime] || 0) + 1; });
  const topBed = Object.entries(bt).sort((a, b) => b[1] - a[1])[0];

  return (
    <div style={{ background: "linear-gradient(180deg,#2E2A44,#413A5E)", borderRadius: 16, padding: "16px 16px 18px", position: "relative", overflow: "hidden" }}>
      {/* 별 */}
      {["✦", "✧", "⋆", "✦", "✧"].map((s, i) => (
        <span key={i} style={{ position: "absolute", left: `${10 + i * 20}%`, top: `${6 + (i % 2) * 10}%`, color: "rgba(255,255,255,0.45)", fontSize: 10, animation: `twinkle 2.6s ease-in-out ${i * 0.4}s infinite` }}>{s}</span>
      ))}

      {/* 꿈방울 영역 */}
      <div style={{ position: "relative", height: 150, marginBottom: 6 }}>
        {bubbles.map((b, i) => {
          const pos = BUBBLE_POS[i] || BUBBLE_POS[3];
          const sz = 34 + Math.round(40 * (b.ratio / maxRatio));
          return (
            <div key={b.level} title={`${b.label} ${Math.round(b.ratio * 100)}%`}
              style={{ position: "absolute", left: pos.left, top: pos.top, "--tx": pos.tx, transform: `translateX(${pos.tx})`, width: sz, height: sz,
                borderRadius: "50%", background: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95), rgba(210,225,255,0.72))",
                boxShadow: "0 2px 10px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                animation: `dreamFloat ${3 + i * 0.5}s ease-in-out ${i * 0.3}s infinite` }}>
              <DiaryIcon name={SLEEP_ICON[b.level]} size={Math.round(sz * 0.46)} />
              <span style={{ fontSize: 9, fontWeight: 800, color: "#5B5470" }}>{Math.round(b.ratio * 100)}%</span>
            </div>
          );
        })}
        {/* 자는 말랑이 + 이불 */}
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 96, textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Mallang v={topMood || 5} size={54} />
            {/* 이불 */}
            <div style={{ position: "absolute", left: -8, right: -8, bottom: -2, height: 22, background: "linear-gradient(180deg,#8C7FB8,#6E63A0)", borderRadius: "12px 12px 6px 6px", boxShadow: "inset 0 2px 0 rgba(255,255,255,0.2)" }} />
          </div>
          <span style={{ position: "absolute", right: -6, top: -6, fontSize: 13, color: "#fff", animation: "zzz 2.4s ease-in-out infinite" }}>💤</span>
        </div>
      </div>

      {/* 꿈방울 아이콘이 뜻하는 수면 상태 문구 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 8 }}>
        {[...data.items].filter(i => i.count > 0).sort((a, b) => b.count - a.count).map(it => (
          <span key={it.level} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.12)", borderRadius: 999, padding: "4px 9px 4px 5px" }}>
            <DiaryIcon name={SLEEP_ICON[it.level]} size={15} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{it.label}</span>
            <b style={{ fontSize: 11, fontWeight: 800, color: "#FFD98A" }}>{Math.round(it.ratio * 100)}%</b>
          </span>
        ))}
      </div>

      {/* 협탁 시계 */}
      {topBed && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(0,0,0,0.28)", borderRadius: 12, padding: "9px 14px", marginTop: 4 }}>
          <span style={{ fontSize: 16 }}>🕛</span>
          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>가장 자주 잠든 시간</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#FFD98A", textShadow: "0 0 8px rgba(255,200,90,0.5)" }}>{topBed[0]}</span>
        </div>
      )}
      <style>{`
        @keyframes dreamFloat { 0%,100% { transform: translateX(var(--tx,0)) translateY(0); } 50% { transform: translateX(var(--tx,0)) translateY(-7px); } }
        @keyframes twinkle { 0%,100% { opacity: .3; } 50% { opacity: 1; } }
        @keyframes zzz { 0%,100% { transform: translateY(0); opacity: .7; } 50% { transform: translateY(-4px); opacity: 1; } }
      `}</style>
    </div>
  );
}

// ── 한 줄 일기장: 코르크 보드에 꽂힌 폴라로이드 사진첩 (터치하면 커진다) ──
const NOTE_CAT = {
  "운동습관": { emoji: "🏃", tint: "#E4F5E7" },
  "일상": { emoji: "🌤️", tint: "#FDF6D3" },
  "고민": { emoji: "💭", tint: "#F0E6FB" },
};
// 폴라로이드 '사진'칸 — 그날 오늘의 태그 아이콘들을 담고, 없으면 카테고리 이모지
function PhotoInner({ tags, cat, big }) {
  const shown = (tags || []).filter(tg => TAG_ICON[tg]);
  if (shown.length === 0) return <span style={{ fontSize: big ? 64 : 34 }}>{cat.emoji}</span>;
  // 4개가 넘으면 줄바꿈해서 모든 아이콘을 담는다(개수 많으면 살짝 작게).
  const sz = big ? (shown.length > 6 ? 32 : 40) : (shown.length > 6 ? 20 : shown.length > 4 ? 23 : 26);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: big ? 10 : 5, alignItems: "center", justifyContent: "center", padding: big ? 12 : 5, width: "100%", boxSizing: "border-box" }}>
      {shown.map(tg => <DiaryIcon key={tg} name={TAG_ICON[tg]} size={sz} />)}
    </div>
  );
}
// 코르크 보드 한 장 — 폴라로이드를 2×2로 붙인다.
function NotesBoard({ list, tagLabels, onOpen }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, justifyItems: "center", alignContent: "start",
      background: "#E7D6B8", backgroundImage: "radial-gradient(rgba(150,110,60,0.18) 1px, transparent 1px)", backgroundSize: "10px 10px",
      borderRadius: 14, padding: "16px 12px" }}>
        {list.map((it, i) => {
          const cat = NOTE_CAT[it.category] || { emoji: "📝", tint: "#F3F1EC" };
          const tilt = (i % 3 - 1) * 3.2;
          const tags = tagLabels(it);
          return (
            <button key={`${it.date}-${i}`} onClick={() => onOpen(it)}
              style={{ width: "100%", maxWidth: 150, background: "#fff", border: "none", borderRadius: 4, padding: "8px 8px 0", boxShadow: "0 3px 10px rgba(60,45,25,0.22)", cursor: "pointer", transform: `rotate(${tilt}deg)`, transition: "transform .15s" }}>
              <div style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 2, background: cat.tint, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <PhotoInner tags={tags} cat={cat} />
                <span style={{ position: "absolute", top: 5, left: "50%", transform: "translateX(-50%)", width: 14, height: 14, borderRadius: "50%", background: "#D6584F", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }} />
              </div>
              <div style={{ padding: "7px 3px 9px", textAlign: "left" }}>
                <div style={{ fontSize: 9.5, color: C.sub, fontWeight: 700, marginBottom: 2 }}>{it.date.slice(5)} · {it.category}</div>
                <div style={{ fontSize: 11.5, color: C.ink, fontWeight: 600, lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{it.text}</div>
                {tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 5 }}>
                    {tags.slice(0, 3).map(tg => <span key={tg} style={{ fontSize: 8.5, fontWeight: 700, color: "#8A6A3A", background: "#F3EAD8", borderRadius: 6, padding: "1px 5px" }}>#{tg}</span>)}
                  </div>
                )}
              </div>
            </button>
          );
        })}
    </div>
  );
}

// 한 화면(코르크 보드 한 장)에 담는 폴라로이드 수 — 2×2
const NOTES_PER_PAGE = 4;

function NotesBody({ data, entries, pdfMode = false }) {
  const [open, setOpen] = useState(null);
  const [page, setPage] = useState(0);
  const boardRef = useRef(null);
  // 최근 날짜가 먼저 오게 정렬한다(엔진도 최신순이지만 여기서 한 번 더 확정).
  const items = [...(data.items || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const tagsByDate = {};
  (entries || []).forEach(e => { if (e?.date && Array.isArray(e.tags)) tagsByDate[e.date] = e.tags; });
  const tagLabels = (it) => (tagsByDate[it.date] || []);

  // PDF로 저장할 땐 넘기는 UI 없이 전부 세로로 이어 붙여 캡처한다.
  const pageCount = pdfMode ? 1 : Math.max(1, Math.ceil(items.length / NOTES_PER_PAGE));
  const pages = pdfMode
    ? [items]
    : Array.from({ length: pageCount }, (_, i) => items.slice(i * NOTES_PER_PAGE, (i + 1) * NOTES_PER_PAGE));
  const cur = Math.min(page, pageCount - 1);

  // 좌우로 미는 제스처 — 스크롤 위치로 현재 장을 판단한다.
  const onBoardScroll = () => {
    const el = boardRef.current;
    if (!el || pdfMode) return;
    const idx = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    if (idx !== cur) setPage(idx);
  };
  const goPage = (i) => {
    const el = boardRef.current;
    setPage(i);
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div>
      {pdfMode ? (
        <NotesBoard list={items} tagLabels={tagLabels} onOpen={setOpen} />
      ) : pageCount === 1 ? (
        <NotesBoard list={pages[0]} tagLabels={tagLabels} onOpen={setOpen} />
      ) : (
        <>
          {/* 4장이 넘으면 좌우로 넘겨 본다 — 한 장에 2×2씩 */}
          <div ref={boardRef} onScroll={onBoardScroll}
            style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none", borderRadius: 14 }}>
            {pages.map((list, i) => (
              <div key={i} style={{ flex: "0 0 100%", scrollSnapAlign: "start" }}><NotesBoard list={list} tagLabels={tagLabels} onOpen={setOpen} /></div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 10 }}>
            {pages.map((_, i) => (
              <button key={i} onClick={() => goPage(i)} aria-label={`${i + 1}번째 장`}
                style={{ width: cur === i ? 18 : 7, height: 7, borderRadius: 999, border: "none", padding: 0, cursor: "pointer",
                  background: cur === i ? "#8A6A3A" : "#D9CDB6", transition: "width .2s, background .2s" }} />
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 11.5, color: C.sub, fontWeight: 600, margin: "8px 0 0" }}>
            좌우로 넘기면 남은 일기를 볼 수 있어요 · 총 {items.length}장
          </p>
        </>
      )}

      {open && (() => {
        const cat = NOTE_CAT[open.category] || { emoji: "📝", tint: "#F3F1EC" };
        const tags = tagLabels(open);
        return (
          <div onClick={() => setOpen(null)} style={{ position: "fixed", inset: 0, zIndex: 85, background: "rgba(28,26,23,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 28 }}>
            <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 300, maxHeight: "88vh", overflowY: "auto", background: "#fff", borderRadius: 6, padding: "12px 12px 0", boxShadow: "0 12px 40px rgba(0,0,0,0.35)", animation: "polaroidPop .28s cubic-bezier(.22,.9,.32,1)" }}>
              <button onClick={() => setOpen(null)} aria-label="닫기"
                style={{ position: "absolute", top: 6, right: 9, zIndex: 2, border: "none", background: "transparent", color: "rgba(255,255,255,0.95)", fontSize: 21, fontWeight: 700, lineHeight: 1, cursor: "pointer", padding: 4, textShadow: "0 1px 3px rgba(0,0,0,0.45)" }}>✕</button>
              <div style={{ aspectRatio: "1 / 1", borderRadius: 2, background: cat.tint, display: "flex", alignItems: "center", justifyContent: "center" }}><PhotoInner tags={tags} cat={cat} big /></div>
              <div style={{ padding: "14px 6px 18px" }}>
                <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 700, marginBottom: 7 }}>{open.date} · {open.category}</div>
                <div style={{ fontSize: 15, color: C.ink, fontWeight: 600, lineHeight: 1.6, wordBreak: "keep-all" }}>{open.text}</div>
                {tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
                    {tags.map(tg => <span key={tg} style={{ fontSize: 11, fontWeight: 700, color: "#8A6A3A", background: "#F3EAD8", borderRadius: 999, padding: "4px 10px" }}>#{tg}</span>)}
                  </div>
                )}
              </div>
            </div>
            <style>{`@keyframes polaroidPop{from{opacity:0;transform:scale(.9) rotate(-2deg)}to{opacity:1;transform:scale(1) rotate(0)}}`}</style>
          </div>
        );
      })()}
    </div>
  );
}

function BarRow({ label, count, max, color }) {
  const accentDeep = getTypeAccent().accentDeep;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
        <span>{label}</span><span style={{ color: accentDeep, fontWeight: 800 }}>{count}번</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: "#EFEBE3", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.max(8, Math.round((count / max) * 100))}%`, background: color, borderRadius: 999, transition: "width .3s ease" }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 이번 달 발견 — 8가지 인사이트
// ══════════════════════════════════════════════════════════════
const WD_FULL = ["일", "월", "화", "수", "목", "금", "토"];
const ONB_FREQ_LABEL = { none: "거의 안 해요", sometimes: "가끔 생각날 때", weekly: "일주일에 몇 번", daily: "거의 매일" };
const ONB_POSTURE_LABEL = { sitting: "주로 앉아 있어요", standing: "주로 서 있어요", moving: "계속 움직여요", mixed: "앉았다 섰다 해요", heavy: "무거운 물건을 자주 들어요" };
const ONB_GOAL_LABEL = { flexibility: "뻐근함 줄이기", posture: "자세 바로잡기", health: "체력 기르기", stress: "스트레스 풀기" };
// 마이페이지 '일상 정보'(가장 최근 저장값)를 발견 리포트에서 칩으로 보여주기 위한 요약.
function buildProfileSummary(u) {
  return {
    freq: u?.exercise_frequency ? ONB_FREQ_LABEL[u.exercise_frequency] : null,
    goals: (u?.exercise_goals || []).map((g) => ONB_GOAL_LABEL[g] || g),
    posture: u?.common_posture ? (ONB_POSTURE_LABEL[u.common_posture] || u.common_posture) : null,
    sore: (u?.mallang_sore || []).map((s) => s?.part).filter(Boolean),
  };
}
const RAIN_CODES2 = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

function topOf(map) { let k = null, n = 0; for (const [key, v] of Object.entries(map)) if (v > n) { n = v; k = key; } return k == null ? null : { key: k, n }; }

function computeInsights(entries, userData, report) {
  const days = [...(entries || [])].filter(e => e && typeof e.mood === "number").sort((a, b) => a.date.localeCompare(b.date));
  const byDate = Object.fromEntries(days.map(d => [d.date, d]));
  const nextOf = (ds) => { const d = new Date(ds + "T00:00:00"); d.setDate(d.getDate() + 1); const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; return byDate[iso]; };
  const prevOf = (ds) => { const d = new Date(ds + "T00:00:00"); d.setDate(d.getDate() - 1); const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; return byDate[iso]; };
  const wd = (ds) => new Date(ds + "T00:00:00").getDay();

  // ── 0. 내 몸 불편 신호 (앱 정체성: 불편함 기록 기반 발견) ──
  const soreReport = (() => {
    const partArr = {}; // partKey -> [{level, date}]
    days.forEach(d => (d.soreness || []).forEach(s => {
      if (!s || s.part == null) return;
      (partArr[s.part] ||= []).push({ level: typeof s.level === "number" ? s.level : null, date: d.date });
    }));
    const parts = Object.entries(partArr).map(([part, arr]) => ({ part, label: PARTS[part] || part, count: arr.length, arr }));
    if (!parts.length) return null;
    parts.sort((a, b) => b.count - a.count);
    const top = parts[0];
    const totalSoreDays = new Set(days.filter(d => (d.soreness || []).length).map(d => d.date)).size;
    const topDates = new Set(top.arr.map(x => x.date));
    const topEntries = days.filter(d => topDates.has(d.date));
    const overN = topEntries.filter(d => d.overwork?.yes).length;
    const prevPoorN = topEntries.filter(d => { const pv = prevOf(d.date); return pv && pv.sleep != null && pv.sleep <= 1; }).length;
    // 강도 추세(전반부 vs 후반부 평균)
    const lv = (arr) => { const xs = arr.map(x => x.level).filter(v => typeof v === "number"); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
    const mid = days[Math.floor(days.length / 2)]?.date;
    const early = lv(top.arr.filter(x => mid && x.date < mid));
    const late = lv(top.arr.filter(x => mid && x.date >= mid));
    let trend = null;
    if (early != null && late != null && top.count >= 3) {
      if (early - late >= 0.6) trend = { dir: "down", msg: `다행히 후반부로 갈수록 ${top.label} 불편함이 옅어지고 있어요. 관리가 통하고 있나 봐요!` };
      else if (late - early >= 0.6) trend = { dir: "up", msg: `후반부로 갈수록 ${top.label} 불편함이 짙어지고 있어요. 조금 더 신경 써봐요.` };
    }
    let insight;
    if (top.count >= 2 && overN >= 2 && overN / top.count >= 0.4) insight = `그중 ${overN}일은 '무리했다'고 기록한 날과 겹쳤어요. 무리가 ${top.label} 쪽으로 오나 봐요.`;
    else if (prevPoorN >= 2) insight = `잘 못 잔 다음 날 ${top.label} 불편함이 ${prevPoorN}번 나타났어요. 잠이 ${top.label}에 영향을 주나 봐요.`;
    else if (trend) insight = trend.msg;
    else insight = `이번 달 ${top.label}을(를) 가장 자주 신경 쓰셨어요. 자주 뻐근한 곳이니 틈틈이 부드럽게 풀어줘요.`;
    return { top, second: parts[1] || null, totalSoreDays, insight, trend };
  })();

  // ── 1. 기분 연결고리 (슬롯) ──
  // 5가지 분석 기준(요일·날씨·수면·태그·활동)별로 [상세 기록]→[기분] 슬롯 인사이트
  const domMood = (arr) => { const c = {}; arr.forEach(d => { c[d.mood] = (c[d.mood] || 0) + 1; }); const t = topOf(c); return t ? { mood: Number(t.key), n: t.n, ratio: t.n / arr.length } : null; };
  const slots = (() => {
    const out = [];
    // 요일
    out.push((() => {
      let best = null;
      for (let w = 0; w < 7; w++) { const dd = days.filter(d => wd(d.date) === w); if (dd.length < 2) continue; const dm = domMood(dd); if (dm && dm.ratio >= 0.5 && (!best || dm.n * dm.ratio > best.score)) best = { w, ...dm, score: dm.n * dm.ratio }; }
      return best ? { key: "weekday", emoji: "📆", label: "요일", detail: `${WD_FULL[best.w]}요일`, moodV: best.mood, message: `이번 달 ${WD_FULL[best.w]}요일엔 ${Math.round(best.ratio * 100)}% '${MOOD[best.mood]}'가 나왔어요. 요일마다 나만의 리듬이 있네요!` } : { key: "weekday", emoji: "📆", label: "요일", message: "이번 달 요일 슬롯에선 특별한 발견이 없었어요." };
    })());
    // 날씨
    out.push((() => {
      const wDays = days.filter(d => d.weather && typeof d.weather.code === "number");
      const rain = wDays.filter(d => (d.weather.precip != null && d.weather.precip >= 1) || RAIN_CODES2.has(d.weather.code));
      if (rain.length >= 3) { const dm = domMood(rain); if (dm && dm.ratio >= 0.5) return { key: "weather", emoji: "🌤️", label: "날씨", detail: "비 오는 날", moodV: dm.mood, message: `비가 오는 날의 ${Math.round(dm.ratio * 100)}%는 기분이 '${MOOD[dm.mood]}'였어요. 궂은 날일수록 스스로를 더 챙겨봐요!` }; }
      return { key: "weather", emoji: "🌤️", label: "날씨", message: "이번 달 날씨 슬롯에선 특별한 발견이 없었어요." };
    })());
    // 수면
    out.push((() => {
      let best = null;
      for (let lv = 0; lv <= 3; lv++) { const dd = days.filter(d => d.sleep === lv); if (dd.length < 2) continue; const dm = domMood(dd); if (dm && dm.ratio >= 0.5 && (!best || dm.n * dm.ratio > best.score)) best = { lv, ...dm, score: dm.n * dm.ratio }; }
      return best ? { key: "sleep", emoji: "🛌", label: "수면", detail: SLEEP[best.lv], detailIcon: SLEEP_ICON[best.lv], moodV: best.mood, message: `이번 달 수면 슬롯이 '${SLEEP[best.lv]}'에 멈춘 날, 기분 슬롯은 ${Math.round(best.ratio * 100)}% '${MOOD[best.mood]}'가 나왔어요. 역시 잠이 최고의 보약이네요!` } : { key: "sleep", emoji: "🛌", label: "수면", message: "이번 달 수면 슬롯에선 특별한 발견이 없었어요." };
    })());
    // 태그
    out.push((() => {
      const tagDays = {}; days.forEach(d => (d.tags || []).forEach(tg => { if (TAG_ICON[tg]) (tagDays[tg] ||= []).push(d); }));
      let best = null;
      for (const [tg, dd] of Object.entries(tagDays)) { if (dd.length < 3) continue; const dm = domMood(dd); if (dm && dm.ratio >= 0.5 && (!best || dm.n * dm.ratio > best.score)) best = { tg, ...dm, score: dm.n * dm.ratio }; }
      return best ? { key: "tag", emoji: "🏷️", label: "태그", detail: best.tg, detailIcon: TAG_ICON[best.tg], moodV: best.mood, message: `#${best.tg}를 남긴 날엔 ${Math.round(best.ratio * 100)}% 기분이 '${MOOD[best.mood]}'였어요.` } : { key: "tag", emoji: "🏷️", label: "태그", message: "이번 달 태그 슬롯에선 특별한 발견이 없었어요." };
    })());
    // 활동
    out.push((() => {
      const cands = [
        { detail: "운동한 날", dd: days.filter(d => d.exercise?.did === true) },
        { detail: "무리한 날", dd: days.filter(d => d.overwork?.yes) },
        { detail: "쉬어간 날", dd: days.filter(d => d.exercise?.did === false) },
      ];
      let best = null;
      for (const c of cands) { if (c.dd.length < 2) continue; const dm = domMood(c.dd); if (dm && dm.ratio >= 0.5 && (!best || dm.n * dm.ratio > best.score)) best = { detail: c.detail, ...dm, score: dm.n * dm.ratio }; }
      return best ? { key: "activity", emoji: "🏃", label: "활동", detail: best.detail, moodV: best.mood, message: `${best.detail}의 ${Math.round(best.ratio * 100)}%는 '${MOOD[best.mood]}' 기분이었어요!` } : { key: "activity", emoji: "🏃", label: "활동", message: "이번 달 활동 슬롯에선 특별한 발견이 없었어요." };
    })());
    return out;
  })();

  // ── 2. 수면 나비효과 ──
  // ── 2. 나비 효과 — 불편함이 강했던 날을, 그 3일 안(-1~-3일)의 무리함·수면과 이어본다 ──
  const shiftDay = (ds, delta) => { const dt = new Date(ds + "T00:00:00"); dt.setDate(dt.getDate() + delta); const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`; return byDate[iso]; };
  const butterfly = (() => {
    // 하루 최고 불편 강도가 5점 이상이었던 '강한 불편' 날
    const strong = days.map(d => {
      const xs = (d.soreness || []).map(s => s.level).filter(v => typeof v === "number");
      return { d, max: xs.length ? Math.max(...xs) : null };
    }).filter(x => x.max != null && x.max >= 5);
    if (strong.length < 3) return null;
    const WIN = 3;
    let overBefore = 0, poorBefore = 0;
    strong.forEach(({ d }) => {
      let hasOver = false, hasPoor = false;
      for (let k = 1; k <= WIN; k++) { const pv = shiftDay(d.date, -k); if (!pv) continue; if (pv.overwork?.yes) hasOver = true; if (pv.sleep != null && pv.sleep <= 1) hasPoor = true; }
      if (hasOver) overBefore++;
      if (hasPoor) poorBefore++;
    });
    if (overBefore === 0 && poorBefore === 0) return null;
    const soreParts = {}; strong.forEach(({ d }) => (d.soreness || []).forEach(s => { if (s.level >= 5) soreParts[s.part] = (soreParts[s.part] || 0) + 1; }));
    const topSore = topOf(soreParts);
    const topLabel = topSore ? (PARTS[topSore.key] || topSore.key) : null;
    const partTxt = topLabel ? `${topLabel} ` : "";
    let message;
    if (overBefore && poorBefore) message = `${partTxt}불편함이 강했던 ${strong.length}일을 되짚어보니, 그 3일 안에 무리한 날이 ${overBefore}번, 잘 못 잔 날이 ${poorBefore}번 있었어요. 며칠 전의 무리함과 수면이 나비처럼 몸에 돌아오나 봐요.`;
    else if (overBefore) message = `${partTxt}불편함이 강했던 ${strong.length}일 중 ${overBefore}일은, 그 3일 안에 '무리했다'는 기록이 먼저 있었어요. 무리한 날의 여파가 며칠 뒤에 오나 봐요.`;
    else message = `${partTxt}불편함이 강했던 ${strong.length}일 중 ${poorBefore}일은, 그 3일 안에 잘 못 잔 밤이 먼저 있었어요. 수면의 흔적이 며칠 뒤 몸에 남나 봐요.`;
    return { strongN: strong.length, overBefore, poorBefore, topSore: topLabel, message };
  })();

  // ── 요일별 방전 패턴 — 요일마다 불편함 강도 평균, 가장 높은 요일 강조 ──
  const weekdaySore = (() => {
    const byWd = {};
    days.forEach(d => { const wd = new Date(d.date + "T00:00:00").getDay(); (d.soreness || []).forEach(s => { if (typeof s.level === "number") (byWd[wd] ||= []).push(s.level); }); });
    const wdAvg = [];
    for (let wd = 0; wd < 7; wd++) { const arr = byWd[wd] || []; wdAvg.push({ wd, avg: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0, n: arr.length }); }
    const withData = wdAvg.filter(x => x.n > 0);
    if (withData.length < 2) return null;
    const peak = withData.reduce((m, x) => (x.avg > m.avg ? x : m), withData[0]);
    const maxAvg = Math.max(...wdAvg.map(x => x.avg), 1);
    const peakLabel = WD_FULL[peak.wd], prevLabel = WD_FULL[(peak.wd + 6) % 7];
    const comment = `${prevLabel}요일까지 누적된 피로가 ${peakLabel}요일에 한꺼번에 몰려오나 봐요. ${peakLabel}요일 오후엔 꼭 스트레칭으로 몸을 풀어볼까요?`;
    return { wdAvg, peak, maxAvg, comment };
  })();

  // ── 마음과 몸의 연결고리 — '무리했어요'(신체) vs '스트레스·짜증'(감정) 날의 불편 강도 비교 ──
  const mindBody = (() => {
    const NEG = new Set(["스트레스", "긴장함", "방전됨"]);
    const dayAvg = (d) => { const xs = (d.soreness || []).map(s => s.level).filter(v => typeof v === "number"); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
    const physDays = days.filter(d => d.overwork?.yes);
    const emoDays = days.filter(d => (d.tags || []).some(tg => NEG.has(tg)));
    if (physDays.length < 2 || emoDays.length < 2) return null;
    const avgOf = (arr) => { const xs = arr.map(dayAvg).filter(v => v != null); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
    const physAvg = avgOf(physDays), emoAvg = avgOf(emoDays);
    if (physAvg == null || emoAvg == null) return null;
    const emoParts = {}; emoDays.forEach(d => (d.soreness || []).forEach(s => { emoParts[s.part] = (emoParts[s.part] || 0) + 1; }));
    const topEmoParts = Object.entries(emoParts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => PARTS[k] || k);
    const emoHigher = emoAvg > physAvg + 0.3;
    const comment = emoHigher
      ? `몸을 많이 움직인 날보다, 스트레스를 강하게 받은 날에 ${topEmoParts.length ? topEmoParts.join("와 ") : "몸"}의 불편함이 훨씬 높게 치솟았어요. 긴장해서 몸이 굳었나 봐요.`
      : `이번 달은 무리한 날과 스트레스받은 날의 불편함이 비슷하게 나타났어요. 몸과 마음을 함께 살펴봐요.`;
    return { physAvg, emoAvg, physN: physDays.length, emoN: emoDays.length, topEmoParts, emoHigher, comment };
  })();

  // ── 3. 기록의 정성 ──
  const effort = (() => {
    const withNote = days.filter(d => d.note?.text && d.note.text.trim().length > 0);
    if (withNote.length < 3) return null;
    const avgLen = Math.round(withNote.reduce((s, d) => s + d.note.text.trim().length, 0) / withNote.length);
    return { count: withNote.length, avgLen };
  })();

  // ── 4. 기록 시간대 ──
  const logged = (() => {
    const hrs = days.map(d => d.created_at ? new Date(d.created_at) : null).filter(dt => dt && !isNaN(dt.getTime())).map(dt => dt.getHours());
    if (hrs.length < 5) return report?.loggedTime ? { bucket: report.loggedTime.top, hour: null } : null;
    const c = {}; hrs.forEach(h => { c[h] = (c[h] || 0) + 1; });
    const th = topOf(c); return { bucket: null, hour: th ? Number(th.key) : null };
  })();

  // ── 5. 회복력 ──
  const recovery = (() => {
    let drops = 0, recovered = 0, totalDays = 0;
    for (let i = 0; i < days.length; i++) {
      if (days[i].mood <= 2) {
        drops++;
        for (let j = i + 1; j < Math.min(days.length, i + 6); j++) { if (days[j].mood >= 4) { recovered++; totalDays += (new Date(days[j].date) - new Date(days[i].date)) / 86400000; break; } }
      }
    }
    if (drops < 2) return null;
    const avgD = recovered ? Math.max(1, Math.round(totalDays / recovered)) : null;
    return { drops, recovered, avgDays: avgD };
  })();

  // ── 6. 무리 연속 ──
  const streak = (() => {
    let best = [], cur = [];
    for (let i = 0; i < days.length; i++) {
      if (days[i].overwork?.yes) {
        if (cur.length && (new Date(days[i].date) - new Date(cur[cur.length - 1].date)) === 86400000) cur.push(days[i]);
        else cur = [days[i]];
        if (cur.length > best.length) best = [...cur];
      } else cur = [];
    }
    if (best.length < 2) return null;
    const end = best[best.length - 1].date; const ws = new Date(end + "T00:00:00"); ws.setDate(ws.getDate() - ws.getDay());
    const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(d.getDate() + i); const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; return { iso, day: d.getDate(), over: !!byDate[iso]?.overwork?.yes }; });
    return { len: best.length, week };
  })();

  // ── 7. 프로필 팩트체크 ──
  // 내가 정한 일상 정보(빈도·목적·자세·부위) 4항목에, 이번 달 실제 기록을 이어 붙인 공감형 코멘트.
  // 각 코멘트 앞에 어울리는 이모지(📌 프로필 되짚기 / ⚖️ 팩트 체크)를 하나씩 붙인다.
  const factcheck = (() => {
    const rows = [];
    const bat = (w) => { const s = String(w || ""); const c = s.charCodeAt(s.length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
    const iga = (w) => (bat(w) ? "이" : "가");
    const eulreul = (w) => (bat(w) ? "을" : "를");

    // 1) 운동 빈도 ↔ 이번 달 실제 운동 횟수
    const moveN = days.filter(d => d.exercise?.did === true).length;
    const freq = userData?.exercise_frequency;
    if (freq && ONB_FREQ_LABEL[freq]) {
      const expect = { none: 0, sometimes: 4, weekly: 10, daily: 22 }[freq] ?? 8;
      if (moveN >= expect + 4) rows.push({ icon: "📌", text: `평소 운동은 '${ONB_FREQ_LABEL[freq]}' 한다고 하셨는데, 이번 달은 ${moveN}번이나 몸을 움직이셨어요. 평소보다 훨씬 부지런했네요!` });
      else if (moveN > 0) rows.push({ icon: "📌", text: `평소 운동을 '${ONB_FREQ_LABEL[freq]}' 한다고 하셨죠. 이번 달은 ${moveN}번 몸을 움직이셨어요.` });
      else rows.push({ icon: "📌", text: `평소 운동을 '${ONB_FREQ_LABEL[freq]}' 한다고 하셨어요. 이번 달은 운동 기록이 아직 없지만, 다음 달 첫 기록을 응원할게요!` });
    }
    // 2) 운동 목적 ↔ 불편함 강도 변화(월초→월말)
    const goals = userData?.exercise_goals || [];
    if (goals.length) {
      const goalLabel = ONB_GOAL_LABEL[goals[0]] || goals[0];
      const half = Math.floor(days.length / 2);
      const lv = (arr) => { const xs = arr.flatMap(d => (d.soreness || []).map(s => s.level)); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
      const a = lv(days.slice(0, half)), b = lv(days.slice(half));
      if (a != null && b != null && a - b >= 0.6) rows.push({ icon: "⚖️", text: `몸 관리에서 '${goalLabel}'를 신경 쓴다고 하셨죠. 다행히 불편함 강도가 월초 평균 ${a.toFixed(1)}점에서 월말 ${b.toFixed(1)}점으로 줄어들었어요.` });
      else if (a != null && b != null) rows.push({ icon: "⚖️", text: `몸 관리에서 '${goalLabel}'를 신경 쓴다고 하셨어요. 이번 달 불편함 강도는 월초 ${a.toFixed(1)}점, 월말 ${b.toFixed(1)}점으로 꾸준히 지켜보는 중이에요.` });
      else rows.push({ icon: "⚖️", text: `몸 관리에서 '${goalLabel}'를 신경 쓴다고 하셨죠. 불편함 기록이 조금 더 쌓이면 강도 변화를 짚어드릴게요.` });
    }
    // 3) 자주 하는 자세 ↔ 활동량(무리하게 부담이 실린 날)
    const loadC = {}; days.forEach(d => (d.overwork?.loads || []).forEach(l => { loadC[l] = (loadC[l] || 0) + 1; }));
    const tl = topOf(loadC);
    const posture = userData?.common_posture;
    if (posture && ONB_POSTURE_LABEL[posture]) {
      if (tl) rows.push({ icon: "📌", text: `'${ONB_POSTURE_LABEL[posture]}'라고 하셨던 자세대로, 이번 달은 '${LOADS[tl.key] || tl.key}'으로 무리한 날이 ${tl.n}일로 가장 많았어요. 그 부담을 덜어주는 관리가 필요해요.` });
      else rows.push({ icon: "📌", text: `'${ONB_POSTURE_LABEL[posture]}'라고 하셨죠. 이번 달은 무리하게 부담이 실린 날이 많지 않아 몸을 잘 아껴주셨어요.` });
    }
    // 4) 불편한 부위 ↔ 그 부위의 이번 달 기록
    const soreProfile = (userData?.mallang_sore || []).map(s => s?.part).filter(Boolean);
    if (soreProfile.length) {
      const labelToKey = {}; for (const [k, v] of Object.entries(PARTS)) labelToKey[v] = k;
      const soreC = {}; days.forEach(d => (d.soreness || []).forEach(s => { soreC[s.part] = (soreC[s.part] || 0) + 1; }));
      const profLabel = soreProfile[0];
      const key = labelToKey[profLabel] || profLabel;
      const cnt = soreC[key] || 0;
      if (cnt > 0) rows.push({ icon: "⚖️", text: `평소 '${profLabel}'${iga(profLabel)} 불편하다고 하셨는데, 이번 달도 ${cnt}번 신호를 보냈어요. 그 부위를 조금만 더 아껴주기로 해요.` });
      else rows.push({ icon: "⚖️", text: `평소 '${profLabel}'${iga(profLabel)} 불편하다고 하셨죠. 다행히 이번 달은 '${profLabel}' 불편함 기록이 많지 않았어요!` });
    }
    return rows.length ? rows.slice(0, 4) : null;
  })();

  // ── 8. 파트너의 편지 — 이번 달 실제 기록 신호(기분·부위·수면·운동·태그·일기)를 엮어 개인 맞춤으로 ──
  const letter = (() => {
    const nm = userData?.nickname || "회원";
    const soreC = {}; days.forEach(d => (d.soreness || []).forEach(s => { soreC[s.part] = (soreC[s.part] || 0) + 1; }));
    const ts = topOf(soreC); const topSore = ts ? (PARTS[ts.key] || ts.key) : null;
    const moodC = {}; days.forEach(d => { moodC[d.mood] = (moodC[d.mood] || 0) + 1; });
    const tm = topOf(moodC); const topMood = tm ? Number(tm.key) : null;
    const tagC = {}; days.forEach(d => (d.tags || []).forEach(tg => { if (TAG_ICON[tg]) tagC[tg] = (tagC[tg] || 0) + 1; }));
    const tt = topOf(tagC); const topTag = tt ? tt.key : null;
    const moveN = days.filter(d => d.exercise?.did === true).length;
    const noteN = days.filter(d => d.note?.text && d.note.text.trim()).length;

    // 받침 유무에 따른 조사
    const josa = (w, a, b) => { const s = String(w || ""); const c = s.charCodeAt(s.length - 1); const has = c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; return has ? a : b; };
    const P = [];
    // 1) 인사 + 성실도
    P.push(`${nm}님, 안녕하세요.${days.length ? ` 이번 달 ${days.length}일 동안 하루하루를 남겨주셨네요.` : ""} 바쁜 와중에도 자신의 몸과 마음을 들여다본 그 시간이 저는 참 뭉클했어요.`);
    // 2) 가장 많던 기분 (개인화)
    const moodLine = {
      1: `이번 달은 '힘들었어요' 말랑이가 자주 찾아왔죠. 그런 날에도 기록을 놓지 않은 ${nm}님이 정말 대단해요.`,
      2: `'지쳤어요' 말랑이가 유난히 자주 보였어요. 조금 지쳐도 스스로를 챙긴 한 달이었어요.`,
      3: `잔잔하게 '그냥저냥'인 날이 많았어요. 그 평온함도 잘 지내온 증거예요.`,
      4: `'괜찮았어요' 말랑이가 가장 많이 웃어준 달이었어요. 그 균형이 참 보기 좋더라고요.`,
      5: `'좋았어요' 말랑이가 제일 자주 찾아온 반짝이는 한 달이었네요!`,
    }[topMood];
    if (moodLine) P.push(moodLine);
    // 3) 몸 신호
    if (butterfly && butterfly.topSore) P.push(`기록을 보니 잘 못 잔 다음 날 유독 ${butterfly.topSore}${josa(butterfly.topSore, "이", "가")} 힘들어했어요. 몸은 밤사이 가장 많이 회복된다고 하니, 다음 달엔 잠을 먼저 챙겨주면 어떨까요.`);
    else if (topSore) P.push(`이번 달엔 ${topSore}${josa(topSore, "이", "가")} 자주 신호를 보냈어요. 다음 달엔 그 부위를 조금만 더 아껴주기로 해요.`);
    else if (recovery && recovery.recovered) P.push(`힘든 날에도 평균 ${recovery.avgDays || 2}일 만에 다시 일어선 회복력, 곁에서 지켜보며 감탄했어요.`);
    // 4) 습관
    if (moveN >= 3) P.push(`이번 달 ${moveN}일이나 몸을 움직였어요. 그 꾸준함, 분명 몸이 먼저 알아줄 거예요.`);
    else if (topTag) P.push(`'#${topTag}'와 함께한 날이 많았죠. 나를 이루는 작은 습관 하나까지 살펴본 한 달이었어요.`);
    else if (noteN >= 3) P.push(`짧게라도 남겨준 ${noteN}편의 일기에서 ${nm}님의 하루하루가 고스란히 느껴졌어요.`);
    // 5) 마무리
    P.push(`다음 달에도 ${nm}님의 몸과 마음 곁에서 함께 걸을게요. 우리, 또 만나요!`);
    return { nickname: nm, body: P.join(" ") };
  })();

  // ── 여성 전용: 생리 전(PMS) 마법의 D-Day ──
  const dday = (() => {
    const g = String(userData?.kakao_gender || userData?.kakaoGender || "").toLowerCase();
    // 관리자(BMTI)는 성별과 무관하게 PMS 카드를 볼 수 있다.
    const female = g.includes("female") || g.includes("여") || userData?.nickname === "BMTI";
    if (!female) return null;
    const shiftISO = (ds, n) => { const d = new Date(ds + "T00:00:00"); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
    const isPeriod = (d) => (d.tags || []).some(tg => tg === "생리 중" || tg === "생리함");
    const pset = new Set(days.filter(isPeriod).map(d => d.date));
    if (!pset.size) return null;
    const starts = [...pset].filter(dt => !pset.has(shiftISO(dt, -1))).sort();
    if (!starts.length) return null;
    const pmsDays = []; const pmsSet = new Set();
    starts.forEach(s => { for (let k = 1; k <= 7; k++) { const d = byDate[shiftISO(s, -k)]; if (d && !isPeriod(d)) { pmsDays.push(d); pmsSet.add(d.date); } } });
    if (pmsDays.length < 2) return null;
    const base = days.filter(d => !pmsSet.has(d.date) && !isPeriod(d));
    const cards = [];
    const tagRate = (arr, tag) => arr.length ? arr.filter(d => (d.tags || []).includes(tag)).length / arr.length : 0;
    // ① 식욕 — 생리 일주일 전 구간에서 야식·단 음식 태그가 늘었는지. 없으면 '변화 없음' 카드로.
    let foodCard = null;
    for (const tag of ["야식·과식", "달달 디저트"]) {
      const pr = tagRate(pmsDays, tag), br = tagRate(base, tag);
      const cnt = pmsDays.filter(d => (d.tags || []).includes(tag)).length;
      if (cnt >= 2 && pr >= br * 1.6 + 0.05) { const mult = br > 0 ? Math.max(2, Math.round(pr / br)) : 3; foodCard = { dlabel: "식욕 ↑", icon: "🍩", title: "식욕의 변화", text: `생리 일주일 전부터 평소보다 '#${tag}' 태그가 ${mult}배 많아졌어요. 호르몬이 에너지를 비축하려는 자연스러운 현상이니 자책 금지!` }; break; }
    }
    cards.push(foodCard || { dlabel: "식욕", icon: "🍽️", title: "식욕의 변화", text: "이번 달은 생리 일주일 전 식욕(야식·단 음식) 변화가 뚜렷하게 잡히진 않았어요. 기록이 더 쌓이면 나만의 패턴을 찾아드릴게요." });
    // ② 불편함 — 상관관계를 못 찾아도 박스 자체는 항상 보여준다.
    const soreRate = (arr, parts) => { let n = 0, t = 0; arr.forEach(d => (d.soreness || []).forEach(s => { t++; if (parts.includes(s.part)) n++; })); return t ? n / t : 0; };
    if (soreRate(pmsDays, ["pelvis", "waist"]) >= soreRate(base, ["pelvis", "waist"]) + 0.2) {
      cards.push({ dlabel: "불편함 ↑", icon: "⚡", title: "불편함의 이동", text: "평소엔 '목·어깨'가 불편했지만, 생리 일주일 전부터는 '골반·허리' 불편함이 더 자주 기록됐어요." });
    } else {
      cards.push({ dlabel: "불편함", icon: "🩹", title: "불편함의 변화", text: "이번 달은 생리 일주일 전 불편한 부위의 뚜렷한 변화(골반·허리 집중)는 발견되지 않았어요. 기록이 더 쌓이면 찾아드릴게요." });
    }
    return { cards };
  })();

  return { soreReport, weekdaySore, mindBody, slots, butterfly, effort, logged, recovery, streak, factcheck, dday, letter, recordedDays: days.length };
}

// ── 인사이트 카드 공통 껍데기 ──
function InsCard({ badge, title, sub, children, bg }) {
  return (
    <div style={{ background: bg || C.card, borderRadius: 20, padding: "18px 18px 20px", boxShadow: CARD_SHADOW, border: "1px solid #F1EEE8" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: getTypeAccent().accentDeep, letterSpacing: "0.02em", marginBottom: 3 }}>{badge}</div>
      <div style={{ fontSize: 16.5, fontWeight: 800, color: C.ink, letterSpacing: "-0.01em", wordBreak: "keep-all", textWrap: "balance" }}>{title}</div>
      {sub && <p style={{ fontSize: 12, color: C.sub, fontWeight: 600, margin: "3px 0 0", wordBreak: "keep-all", textWrap: "pretty" }}>{sub}</p>}
      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}
function Insight({ children }) {
  return <p style={{ fontSize: 13.5, color: "#3F3A31", fontWeight: 600, lineHeight: 1.62, margin: "14px 0 0", wordBreak: "keep-all", textWrap: "pretty" }}>{children}</p>;
}

function DiscoveryInsights({ report, entries, userData, nickname, bmtiCode, exIns, pdfMode = false, onWeatherUpdated }) {
  const ins = computeInsights(entries, userData, report);
  const isM = (bmtiCode ? bmtiCode.split("-")[0] : "").includes("M");
  const g = String(userData?.kakao_gender || userData?.kakaoGender || "").toLowerCase();
  const female = g.includes("female") || g.includes("여") || userData?.nickname === "BMTI";
  // 기록이 부족해 아직 못 찾은 발견은 하드 유저 예시를 블러로 보여주고, 커서를 올리면 풀린다.
  const LK = "이렇게 채워질 거예요 · 클릭해보세요";
  const lock = (node) => <LockedPreview label={LK}>{node}</LockedPreview>;
  const profileSummary = buildProfileSummary(userData);
  const hasProfile = !!(profileSummary.freq || profileSummary.goals.length || profileSummary.posture || profileSummary.sore.length);
  const exProfile = buildProfileSummary(EXAMPLE_USER);
  // 잠긴(아직 발견된 내용이 없는) 카드는 제일 밑으로 모은다. '회복력 탄성 지수' 카드는 제거.
  const items = [];
  const add = (key, cond, realNode, exNode) => {
    if (cond) items.push({ locked: false, node: <Fragment key={key}>{realNode}</Fragment> });
    else if (exNode) items.push({ locked: true, node: <Fragment key={key}>{lock(exNode)}</Fragment> });
  };
  const hasTrend = (entries || []).filter((e) => e && typeof e.mood === "number").length >= 2;
  items.push({ locked: !hasTrend, node: <TrendChartsCard key="trend" entries={entries} exampleEntries={EXAMPLE_ENTRIES} pdfMode={pdfMode} /> }); // 주간/일간/요일별(요일별 불편함 패턴 통합)
  items.push({ locked: false, node: <MallangNightCard key="night" entries={entries} nickname={nickname} pdfMode={pdfMode} /> }); // {닉네임}의 밤
  add("streak", ins.streak, <StreakCard data={ins.streak} />, exIns.streak && <StreakCard data={exIns.streak} />);
  add("effort", ins.effort, <EffortCard data={ins.effort} />, exIns.effort && <EffortCard data={exIns.effort} />);
  add("logged", ins.logged, <LampClockCard data={ins.logged} nickname={nickname} />, exIns.logged && <LampClockCard data={exIns.logged} nickname={nickname} />);
  if (female) add("dday", ins.dday, <DdayCard data={ins.dday} />, exIns.dday && <DdayCard data={exIns.dday} />);
  items.push({ locked: false, node: <WeatherFindingCards key="weather" entries={entries} onWeatherUpdated={onWeatherUpdated} /> });
  const fcUnlocked = !!(ins.factcheck || hasProfile);
  if (fcUnlocked) items.push({ locked: false, node: <FactCheckCard key="factcheck" rows={ins.factcheck || []} profile={profileSummary} userInfo={userData} isLoggedIn={!!userData?.id} /> });
  else if (exIns.factcheck) items.push({ locked: true, node: <Fragment key="factcheck">{lock(<FactCheckCard rows={exIns.factcheck} profile={exProfile} />)}</Fragment> });
  items.push({ locked: false, node: <LetterCard key="letter" data={ins.letter} isM={isM} bmtiCode={bmtiCode} pdfMode={pdfMode} /> });

  const ordered = [...items.filter((i) => !i.locked), ...items.filter((i) => i.locked)];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {ordered.map((i) => i.node)}
    </div>
  );
}

// 0. 내 몸 불편 신호 — 앱의 정체성인 '불편함 기록'에서 뽑은 대표 발견
function SoreReportCard({ data }) {
  const t = getTypeAccent();
  const { top, second, totalSoreDays, trend } = data;
  const trendBadge = trend ? (trend.dir === "down"
    ? { txt: "좋아지는 중", bg: "#E7F5EC", fg: "#2E8B57", arrow: "↓" }
    : { txt: "심해지는 중", bg: "#FDECEC", fg: "#D0544E", arrow: "↑" }) : null;
  return (
    <InsCard badge="내 몸 불편 신호" title="이번 달, 내 몸이 보낸 신호" sub="가장 자주 불편했던 곳과 그 이유를 찾아봤어요">
      <div style={{ display: "flex", gap: 10, alignItems: "stretch", marginBottom: 2 }}>
        {/* 가장 자주 불편했던 곳 */}
        <div style={{ flex: second ? 1.35 : 1, background: "linear-gradient(140deg,#FDECEC,#FADCDC)", borderRadius: 16, padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, position: "relative" }}>
          {trendBadge && <span style={{ position: "absolute", top: 8, right: 8, fontSize: 9.5, fontWeight: 800, color: trendBadge.fg, background: trendBadge.bg, borderRadius: 999, padding: "3px 7px" }}>{trendBadge.arrow} {trendBadge.txt}</span>}
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#E0554F", boxShadow: "0 0 0 5px rgba(224,85,79,0.16)" }} />
          <div style={{ fontSize: 21, fontWeight: 900, color: "#B23B36", letterSpacing: "-0.02em" }}>{top.label}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#C4726C" }}>총 <b style={{ fontSize: 15 }}>{top.count}</b>일 불편</div>
        </div>
        {second && (
          <div style={{ flex: 1, background: "#FCF4F4", border: "1px solid #F3DDDD", borderRadius: 16, padding: "16px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#E89A96" }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: "#B0736E" }}>{second.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C6A19D" }}>{second.count}일</div>
          </div>
        )}
      </div>
      <Insight>{data.insight}</Insight>
    </InsCard>
  );
}

// 1. 기분 자판기(슬롯) — 현재 미사용(불편 신호 카드로 대체)
function SlotCard({ slots }) {
  const [idx, setIdx] = useState(0);
  const [pulls, setPulls] = useState(0);
  const pull = () => { setIdx((idx + 1) % slots.length); setPulls(p => p + 1); };
  const cur = slots[idx];
  const found = !!cur.detail;
  const t = getTypeAccent();
  // 슬롯 3칸: [분석 기준] + [나의 기록] = [기분]
  const box = { flex: 1, minWidth: 0, position: "relative" };
  const win = { height: 66, borderRadius: 12, background: "linear-gradient(180deg,#FFFDF6,#F4EFE2)", border: "1.5px solid #EAE2CF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "4px 5px", boxShadow: "inset 0 6px 10px -8px rgba(0,0,0,0.2)", overflow: "hidden" };
  return (
    <InsCard badge="기분 연결고리" title="기분 자판기" sub="버튼을 눌러 5가지 기준을 하나씩 돌려보세요">
      <div key={idx} style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
        {/* 1. 분석 기준 — 이모지 없이 문구만 */}
        <div style={box}>
          <div style={{ ...win, animation: "slotSpin .5s cubic-bezier(.2,.7,.3,1) both" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{cur.label}</span>
          </div>
        </div>
        {/* 2. 나의 기록 */}
        <div style={box}>
          <div style={{ ...win, animation: "slotSpin .5s cubic-bezier(.2,.7,.3,1) .12s both" }}>
            {found ? <>
              {cur.detailIcon ? <DiaryIcon name={cur.detailIcon} size={22} /> : <span style={{ color: t.accentDeep, display: "flex" }}>{(() => { const I = SLOT_CAT_ICON[cur.key]; return I ? <I size={20} /> : <IconNotepad size={20} />; })()}</span>}
              <span style={{ fontSize: 10, fontWeight: 800, color: C.ink, marginTop: 2, lineHeight: 1.15, wordBreak: "keep-all" }}>{cur.detail}</span>
            </> : <span style={{ fontSize: 24, fontWeight: 900, color: "#C9C4BB" }}>?</span>}
          </div>
        </div>
        {/* 3. 기분 */}
        <div style={box}>
          <div style={{ ...win, animation: "slotSpin .5s cubic-bezier(.2,.7,.3,1) .24s both" }}>
            {found ? <>
              <Mallang v={cur.moodV} size={34} />
              <span style={{ fontSize: 9.5, fontWeight: 800, color: C.ink, marginTop: 1 }}>{MOOD[cur.moodV]}</span>
            </> : <span style={{ fontSize: 24, fontWeight: 900, color: "#C9C4BB" }}>?</span>}
          </div>
        </div>
      </div>

      {/* 3D 빨강 레버 — 누르면 내려갔다 올라오며 다음 기준으로 */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
        <button onClick={pull} aria-label="레버 당기기" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, lineHeight: 0 }}>
          <div key={pulls} style={{ animation: pulls ? "leverPull .5s cubic-bezier(.34,1.56,.64,1)" : "none" }}>
            <svg width="40" height="66" viewBox="0 0 42 72" fill="none">
              <defs>
                <linearGradient id="slotRod" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#9C968C" /><stop offset="0.5" stopColor="#EDE9E2" /><stop offset="1" stopColor="#8F897F" /></linearGradient>
                <radialGradient id="slotBall" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stopColor="#FF8A7E" /><stop offset="0.55" stopColor="#E23B2E" /><stop offset="1" stopColor="#A8241A" /></radialGradient>
              </defs>
              {/* 받침 */}
              <rect x="6" y="54" width="30" height="14" rx="5" fill="#57524C" />
              <ellipse cx="21" cy="55" rx="9" ry="3.6" fill="#3B3733" />
              {/* 로드 */}
              <rect x="18" y="20" width="6" height="36" rx="3" fill="url(#slotRod)" />
              {/* 빨강 3D 손잡이 */}
              <circle cx="21" cy="16" r="12.5" fill="url(#slotBall)" />
              <ellipse cx="16.5" cy="10.5" rx="4.2" ry="3" fill="rgba(255,255,255,0.55)" />
            </svg>
          </div>
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 4 }}>
        {slots.map((s, i) => <span key={i} style={{ width: i === idx ? 16 : 6, height: 6, borderRadius: 4, background: i === idx ? t.accent : "#E5E0D6", transition: "all .2s" }} />)}
      </div>

      <Insight>{cur.message}</Insight>
      <style>{`
        @keyframes slotSpin{0%{opacity:0;transform:translateY(-18px)}60%{transform:translateY(3px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes leverPull{0%{transform:translateY(0)}35%{transform:translateY(14px)}100%{transform:translateY(0)}}
      `}</style>
    </InsCard>
  );
}

// 2. 밤낮 연결 고리 — '잘 못 잔 밤'이 '다음날'에 남긴 흔적을 위→아래 흐름으로 보여준다
function ButterflyCard({ data }) {
  const t = getTypeAccent();
  return (
    <InsCard badge="나비 효과" title="며칠 전의 나 → 오늘의 몸" sub="불편함이 강했던 날, 그 3일 안의 무리함·수면을 되짚어봤어요">
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* 원인 패널 — 강한 불편 3일 이내의 무리함/수면 */}
        <div style={{ background: "linear-gradient(135deg,#37325C,#4B4477)", borderRadius: 16, padding: "14px 16px" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.62)", marginBottom: 9 }}>불편이 강했던 날의 3일 안에</div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 21, lineHeight: 1 }}>💦</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "#fff", marginTop: 5 }}>무리한 날 <b style={{ color: "#FFD98A", fontSize: 15 }}>{data.overBefore}번</b></div>
            </div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 21, lineHeight: 1 }}>🌙</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "#fff", marginTop: 5 }}>잘 못 잔 밤 <b style={{ color: "#FFD98A", fontSize: 15 }}>{data.poorBefore}번</b></div>
            </div>
          </div>
        </div>
        {/* 연결 화살표 + '며칠 뒤' 라벨 */}
        <div className="neg-margin" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "-4px 0" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: t.accentSoft, color: t.accentDeep, fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 999 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            며칠 뒤
          </span>
        </div>
        {/* 결과 패널 — 강한 불편 */}
        <div style={{ background: "linear-gradient(135deg,#FDECEC,#FADCDC)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 26, lineHeight: 1 }}>😣</span>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#B23B36", marginBottom: 2 }}>{data.topSore ? `${data.topSore} 불편이 강했던 날` : "불편이 강했던 날"}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#8E2E2A" }}>강한 불편이 <b style={{ fontSize: 17 }}>{data.strongN}일</b></div>
          </div>
        </div>
      </div>
      <Insight>{data.message}</Insight>
    </InsCard>
  );
}

// 막대 색 — 불편함도 늦게 잠든 정도도 '높을수록 안 좋은' 값이라 신호등처럼 읽히게 한다.
// 0(낮음) 초록 → 0.5(중간) 노랑 → 1(높음) 빨강.
// 부위 드롭다운의 '전체' 항목 키
const ALL_PARTS = "__all";

const RISK_BANDS = [
  { upto: 0.34, from: "#8CCB8F", to: "#59A863", text: "#3F7C48" },
  { upto: 0.67, from: "#F7D879", to: "#E9BC44", text: "#9A7A16" },
  { upto: 1.01, from: "#F0917C", to: "#E0554F", text: "#B23B36" },
];
const riskBand = (ratio) => RISK_BANDS.find((b) => (Number(ratio) || 0) <= b.upto) || RISK_BANDS[2];
const riskFill = (ratio) => { const b = riskBand(ratio); return `linear-gradient(180deg,${b.from},${b.to})`; };

// 기분·불편함 추이 — 불편함 막대그래프 + 기분 꺾은선(말랑이 표정). 주간/일간 스와이프 알약으로 전환.
const trendPillBtn = (active, t) => ({ position: "relative", zIndex: 1, border: "none", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 800, padding: "5px 13px", color: active ? t.accentDeep : C.sub, transition: "color .2s" });
const trendArrow = (disabled) => ({ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${C.line}`, background: "#fff", color: disabled ? "#CFC9BE" : C.ink, fontSize: 18, fontWeight: 800, lineHeight: 1, cursor: disabled ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 });

const TREND_MODES = ["daily", "weekly", "weekday"];
const TREND_LABELS = { weekly: "주간", daily: "일간", weekday: "요일별" };
function TrendSwitchPill({ mode, onSelect, t }) {
  const idx = Math.max(0, TREND_MODES.indexOf(mode));
  const W = 48; // 버튼 3개 고정폭 — 슬라이딩 배경이 정확히 버튼 가운데 오게
  return (
    <div style={{ position: "relative", display: "flex", background: "#FBF1C9", borderRadius: 999, padding: 3, flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, bottom: 3, left: 3, width: W, borderRadius: 999, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.16)", transform: `translateX(${idx * 100}%)`, transition: "transform .25s ease" }} />
      {TREND_MODES.map((m) => <button key={m} onClick={() => onSelect(m)} style={{ ...trendPillBtn(mode === m, t), width: W, padding: "5px 0", textAlign: "center", flexShrink: 0 }}>{TREND_LABELS[m]}</button>)}
    </div>
  );
}

function TrendChartsCard({ entries, exampleEntries, pdfMode = false }) {
  const t = getTypeAccent();
  const real = (entries || []).filter((e) => e && typeof e.mood === "number" && e.date);
  const hasEnough = real.length >= 2;
  const src = (hasEnough ? real : (exampleEntries || [])).filter((e) => e && typeof e.mood === "number" && e.date);

  const base = src[0]?.date || new Date().toISOString().slice(0, 10);
  const yy = Number(base.slice(0, 4)), mm = Number(base.slice(5, 7));
  const lastDay = new Date(yy, mm, 0).getDate();
  const weekRanges = [[1, 7], [8, 14], [15, 21], [22, lastDay]];

  // 불편함을 기록한 부위 목록(많이 기록한 순) — 우측 상단 드롭다운.
  // 맨 앞의 '전체'는 부위를 가리지 않고 그날 적은 불편함을 모두 평균 낸다.
  // 전체의 횟수는 '기록한 날 수' — 같은 날 세 부위를 적었어도 1번으로 센다.
  const partCounts = {};
  src.forEach((e) => (e.soreness || []).forEach((s) => { const k = sorePartKey(s); if (k) partCounts[k] = (partCounts[k] || 0) + 1; }));
  const soreDayCount = new Set(src.filter((e) => (e.soreness || []).length > 0).map((e) => e.date)).size;
  const partList = [ALL_PARTS, ...Object.keys(partCounts).sort((a, b) => partCounts[b] - partCounts[a])];
  const [sorePart, setSorePart] = useState(ALL_PARTS);   // 들어오면 '전체'부터 보인다
  const activePart = partList.includes(sorePart) ? sorePart : ALL_PARTS;

  const dayData = {};
  src.forEach((e) => {
    const dom = Number(e.date.slice(8, 10));
    const arr = (e.soreness || [])
      .filter((s) => activePart === ALL_PARTS || sorePartKey(s) === activePart)
      .map((s) => s.level).filter((v) => typeof v === "number");
    dayData[dom] = { mood: e.mood, sore: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 };
  });
  const [modeState, setMode] = useState("daily");
  const [lineOnTop, setLineOnTop] = useState(false); // 커서를 올리면 꺾은선을 앞으로
  const mode = pdfMode ? "weekly" : modeState; // PDF로 저장할 땐 주간 상태로 캡처
  const WD = ["일", "월", "화", "수", "목", "금", "토"];

  let cats, peakWd = null;
  if (mode === "weekly") {
    cats = weekRanges.map(([a, b], i) => {
      const moods = [], sores = [];
      for (let d = a; d <= b; d++) if (dayData[d]) { moods.push(dayData[d].mood); sores.push(dayData[d].sore); }
      const avg = (xs) => (xs.length ? xs.reduce((p, q) => p + q, 0) / xs.length : null);
      return { label: `${i + 1}주`, mood: avg(moods), sore: avg(sores), n: moods.length };
    });
  } else if (mode === "daily") {
    // 일간 = 이번 달 모든 날(가로 스크롤). 날짜 밑에 요일도 표시.
    cats = [];
    for (let d = 1; d <= lastDay; d++) { const r = dayData[d]; cats.push({ label: String(d), dow: new Date(yy, mm - 1, d).getDay(), mood: r ? r.mood : null, sore: r ? r.sore : null }); }
  } else {
    // 요일별 = 월~일 평균(불편함 막대 + 기분 꺾은선)
    const order = [1, 2, 3, 4, 5, 6, 0];
    const wdMoods = {}, wdSores = {};
    Object.keys(dayData).forEach((k) => { const dom = Number(k); const wd = new Date(yy, mm - 1, dom).getDay(); const r = dayData[dom]; (wdMoods[wd] ||= []).push(r.mood); if (r.sore > 0) (wdSores[wd] ||= []).push(r.sore); });
    const avg2 = (xs) => (xs && xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    cats = order.map((wd) => ({ label: WD[wd], wd, mood: avg2(wdMoods[wd]), sore: avg2(wdSores[wd]) }));
    const withSore = cats.filter((c) => c.sore != null);
    if (withSore.length) { const pk = withSore.reduce((m, c) => (c.sore > m.sore ? c : m), withSore[0]); peakWd = pk.wd; }
  }
  const scroll = mode === "daily";
  const isWeekday = mode === "weekday";
  const colW = 42;
  const N = cats.length || 1;
  const soreVals = cats.map((c) => c.sore).filter((v) => v != null);
  const maxSore = Math.max(4, ...soreVals.map((v) => Math.ceil(v)));
  const faceSize = N <= 4 ? 26 : N <= 7 ? 22 : 18;
  const hasAnyData = cats.some((c) => c.mood != null);
  const gap = N > 7 ? 3 : 6;

  const H = 168, barH = 118;
  const xOf = (i) => ((i + 0.5) / N) * 100;
  // 기분은 위쪽 영역에 그려 막대와 너무 겹치지 않게 한다.
  const yOf = (mood) => 11 + (1 - (Math.min(5, Math.max(1, mood)) - 1) / 4) * 54;
  let dPath = "", prev = false;
  cats.forEach((c, i) => { if (c.mood == null) { prev = false; return; } dPath += `${prev ? " L" : "M"}${xOf(i).toFixed(2)} ${yOf(c.mood).toFixed(2)}`; prev = true; });

  // 일간 가로 드래그 스크롤(클릭해서 좌우로)
  const scrollElRef = useRef(null);
  const dragRef = useRef({ down: false, x: 0, left: 0 });
  const onDragDown = (e) => { const el = scrollElRef.current; if (!el) return; dragRef.current = { down: true, x: e.clientX, left: el.scrollLeft }; };
  const onDragMove = (e) => { if (!dragRef.current.down || !scrollElRef.current) return; scrollElRef.current.scrollLeft = dragRef.current.left - (e.clientX - dragRef.current.x); };
  const onDragUp = () => { dragRef.current.down = false; };
  const colStyle = scroll ? { width: colW, flex: "0 0 auto" } : { flex: 1 };
  const dragHandlers = scroll ? { onPointerDown: onDragDown, onPointerMove: onDragMove, onPointerUp: onDragUp, onPointerLeave: onDragUp } : {};

  const rowGap = scroll ? 0 : gap;
  const body = (
    <div>
      {/* 범례(불편함·기분) + 부위 선택 드롭다운 — 고정 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: "#E0554F" }} /> 불편함</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: "#BF8FE9" }} /> 기분</span>
        </div>
        {partList.length > 0 && (
          <select value={activePart || ""} onChange={(e) => setSorePart(e.target.value)}
            style={{ fontSize: 11, fontWeight: 800, color: "#B23B36", background: "#FDECEC", border: "1px solid #F3CFCF", borderRadius: 999, padding: "3px 8px", outline: "none", cursor: "pointer" }}>
            {partList.map((pid) => (
              <option key={pid} value={pid}>
                {pid === ALL_PARTS ? `전체 (${soreDayCount}번)` : `${sorePartLabel(pid)} (${partCounts[pid]}번)`}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 요일별: 최고 요일 문구(다른 모드에선 높이만 확보해 전환 시 박스가 줄지 않게) */}
      <div style={{ minHeight: 46, marginBottom: 4 }}>
        {isWeekday && peakWd != null && (
          <p style={{ fontSize: 14, fontWeight: 800, color: C.ink, margin: 0, lineHeight: 1.5, wordBreak: "keep-all" }}>
            이번 달은 유독 <b style={{ color: "#E0554F" }}>{WD[peakWd]}요일</b>에 <b style={{ color: "#E0554F" }}>{activePart === ALL_PARTS ? "몸" : sorePartLabel(activePart)}</b> 불편함이 가장 컸어요.
          </p>
        )}
      </div>

      {/* 플롯 — 일간이면 가로 드래그 스크롤(좌우 끝 연회색 화살표로 힌트) */}
      <div style={{ position: "relative" }}>
        {scroll && <span style={{ position: "absolute", left: 0, top: "40%", transform: "translateY(-50%)", zIndex: 3, color: "#CFC9BE", fontSize: 22, fontWeight: 900, lineHeight: 1, pointerEvents: "none" }}>‹</span>}
        {scroll && <span style={{ position: "absolute", right: 0, top: "40%", transform: "translateY(-50%)", zIndex: 3, color: "#CFC9BE", fontSize: 22, fontWeight: 900, lineHeight: 1, pointerEvents: "none" }}>›</span>}
        <div ref={scrollElRef} {...dragHandlers} className="hide-scrollbar" style={{ overflowX: scroll ? "auto" : "visible", overflowY: "hidden", cursor: scroll ? "grab" : "default", touchAction: scroll ? "pan-x" : "auto", userSelect: "none" }}>
        <div style={{ width: scroll ? N * colW : "100%" }}>
          {/* 불편함 막대 + 기분 꺾은선을 한 그래프에 겹친다.
              평소엔 막대와 숫자가 위, 그래프에 커서를 올리면 꺾은선이 위로 올라온다. */}
          <div
            style={{ position: "relative", height: H }}
            onMouseEnter={() => setLineOnTop(true)}
            onMouseLeave={() => setLineOnTop(false)}
          >
            {/* 불편함 막대 */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: rowGap, padding: "0 2px", zIndex: lineOnTop ? 1 : 3 }}>
              {cats.map((c, i) => {
                const empty = c.sore == null;
                const isPeak = isWeekday && c.wd === peakWd && !empty;
                const ratio = empty ? 0 : Math.min(1, c.sore / maxSore);
                const band = riskBand(ratio);
                const h = empty ? 3 : Math.max(4, Math.round(ratio * barH));
                return (
                  <div key={i} style={{ ...colStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 3, height: "100%" }}>
                    {!empty && <span style={{ fontSize: 9.5, fontWeight: 800, color: band.text }}>{c.sore.toFixed(1)}</span>}
                    <div style={{ width: scroll ? 18 : "68%", maxWidth: 22, height: h, borderRadius: 6, background: empty ? "#EFEBE3" : riskFill(ratio), boxShadow: isPeak ? `0 3px 8px ${band.to}55` : "none", opacity: empty ? 0.55 : 1, transition: "height .3s" }} />
                  </div>
                );
              })}
            </div>

            {/* 기분 꺾은선(말랑이 표정) */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: lineOnTop ? 4 : 2, pointerEvents: "none" }}>
              {dPath && <path d={dPath} fill="none" stroke={t.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
            </svg>
            {cats.map((c, i) => (c.mood != null ? (
              <div key={i} style={{ position: "absolute", left: `${xOf(i)}%`, top: `${yOf(c.mood)}%`, transform: "translate(-50%,-50%)", zIndex: lineOnTop ? 4 : 2, pointerEvents: "none" }}>
                <Mallang v={Math.round(c.mood)} size={faceSize} noBlink />
              </div>
            ) : null))}
          </div>

          {/* x축 라벨 — 날짜 + 요일(일간). 요일줄은 항상 확보해 모드 전환 시 높이 일정 */}
          <div style={{ display: "flex", gap: rowGap, marginTop: 6, padding: "0 2px" }}>
            {cats.map((c, i) => {
              const wdPeak = isWeekday && c.wd === peakWd;
              return (
                <div key={i} style={{ ...colStyle, textAlign: "center" }}>
                  <div style={{ fontSize: scroll ? 10 : (N > 7 ? 9.5 : 11), fontWeight: wdPeak ? 800 : 700, color: wdPeak ? "#E0554F" : C.sub }}>{c.label}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, height: 11, color: c.dow === 0 ? "#E0554F" : c.dow === 6 ? "#2F6FE0" : "#BFB9AF", marginTop: 1 }}>{scroll ? WD[c.dow] : " "}</div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      {!hasAnyData && <p style={{ fontSize: 12, color: C.sub, fontWeight: 700, textAlign: "center", marginTop: 14 }}>아직 기록이 없어요.</p>}
    </div>
  );

  const card = (
    <div style={{ background: C.card, borderRadius: 20, padding: "18px 18px 20px", boxShadow: CARD_SHADOW, border: "1px solid #F1EEE8" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: t.accentDeep, letterSpacing: "0.02em", marginBottom: 3 }}>기분·불편함 추이</div>
          <div style={{ fontSize: 16.5, fontWeight: 800, color: C.ink, letterSpacing: "-0.01em" }}>📈 기분과 불편함 추이</div>
          <p style={{ fontSize: 12, color: C.sub, fontWeight: 600, margin: "3px 0 0", wordBreak: "keep-all", minHeight: 32, lineHeight: 1.35 }}>{mode === "weekly" ? "이번 달을 4주로 나눈 평균이에요" : mode === "daily" ? "하루하루의 기록 · 좌우로 넘겨보세요" : "요일별 평균으로 봤어요"}</p>
        </div>
        <TrendSwitchPill mode={mode} onSelect={setMode} t={t} />
      </div>

      <div style={{ marginTop: 16 }}>{body}</div>
    </div>
  );

  return hasEnough ? card : <LockedPreview label="이렇게 채워질 거예요 · 클릭해보세요">{card}</LockedPreview>;
}

// {닉네임}의 밤 — 주간/일간 토글(기분·불편함 추이와 동일). 잠든 시간대=막대, 수면의 질=꺾은선(4가지 수면 아이콘).
function MallangNightCard({ entries, nickname, pdfMode = false }) {
  // 훅은 아래 'return null'보다 먼저, 항상 같은 순서로 불러야 한다.
  const [modeState, setMode] = useState("daily");
  const [lineOnTop, setLineOnTop] = useState(false); // 커서를 올리면 꺾은선을 앞으로
  const scrollElRef = useRef(null);                  // 일간 가로 드래그 스크롤
  const dragRef = useRef({ down: false, x: 0, left: 0 });

  const setting = getSleepSetting();
  const irregular = setting?.mode === "irregular";
  const buckets = irregular ? SLEEP_IRREGULAR_OPTS : sleepWindow(setting?.base); // 이른→늦은 순
  // 잠든 시간대를 0(가장 이름)~1(가장 늦음) 늦음 정도로 환산 → 막대 높이
  const bedVal = (st) => { const i = buckets.indexOf(st); return i < 0 ? null : (buckets.length > 1 ? i / (buckets.length - 1) : 0.5); };
  // 막대 위에 적을 시각 — 일간은 '12'처럼 정시, 주간·요일별 평균은 '12:30'처럼 분까지.
  // 불규칙 수면은 시계 시각이 없으므로 고른 단계 이름을 짧게 보여준다.
  const centerIdx = Math.max(2, Math.min(SLEEP_HOURS.length - 3, sleepBaseIdx(setting?.base)));
  const hourNumOf = (label) => Number(String(label).replace(/[^0-9]/g, "")) || null;
  const bedLabel = (v, exact) => {
    if (v == null) return null;
    if (irregular) { const i = Math.round(v * (buckets.length - 1)); return (buckets[i] || "").replace(/\s*잤어요$/, ""); }
    const f = (centerIdx - 2) + v * (buckets.length - 1);          // SLEEP_HOURS 상의 위치
    const lo = Math.max(0, Math.min(SLEEP_HOURS.length - 1, Math.floor(f)));
    const h = hourNumOf(SLEEP_HOURS[lo]);
    if (h == null) return null;
    if (exact) return String(h);
    const mm = Math.round((f - lo) * 60);
    return mm === 0 ? String(h) : `${h}:${String(mm).padStart(2, "0")}`;
  };

  const real = (entries || []).filter((e) => e && e.date && (typeof e.sleep === "number" || (e.sleepTime && buckets.includes(e.sleepTime))));
  if (real.length < 1) return null;

  const base = real[0].date;
  const yy = Number(base.slice(0, 4)), mm = Number(base.slice(5, 7));
  const lastDay = new Date(yy, mm, 0).getDate();
  const weekRanges = [[1, 7], [8, 14], [15, 21], [22, lastDay]];

  const dayData = {};
  real.forEach((e) => {
    const dom = Number(e.date.slice(8, 10));
    dayData[dom] = { qual: typeof e.sleep === "number" ? e.sleep : null, bed: e.sleepTime ? bedVal(e.sleepTime) : null };
  });
  const mode = pdfMode ? "weekly" : modeState; // PDF로 저장할 땐 주간 상태로 캡처
  const WD = ["일", "월", "화", "수", "목", "금", "토"];

  let cats;
  if (mode === "weekly") {
    cats = weekRanges.map(([a, b], i) => {
      const quals = [], beds = [];
      for (let d = a; d <= b; d++) if (dayData[d]) { if (dayData[d].qual != null) quals.push(dayData[d].qual); if (dayData[d].bed != null) beds.push(dayData[d].bed); }
      const avg = (xs) => (xs.length ? xs.reduce((p, q) => p + q, 0) / xs.length : null);
      return { label: `${i + 1}주`, qual: avg(quals), bed: avg(beds) };
    });
  } else if (mode === "daily") {
    // 일간 = 이번 달 모든 날(가로 스크롤). 날짜 밑에 요일도 표시.
    cats = [];
    for (let d = 1; d <= lastDay; d++) { const r = dayData[d]; cats.push({ label: String(d), dow: new Date(yy, mm - 1, d).getDay(), qual: r ? r.qual : null, bed: r ? r.bed : null }); }
  } else {
    // 요일별 = 월~일 평균(잠든 시간대 막대 + 수면 질 꺾은선)
    const order = [1, 2, 3, 4, 5, 6, 0];
    const wdQuals = {}, wdBeds = {};
    Object.keys(dayData).forEach((k) => { const dom = Number(k); const wd = new Date(yy, mm - 1, dom).getDay(); const r = dayData[dom]; if (r.qual != null) (wdQuals[wd] ||= []).push(r.qual); if (r.bed != null) (wdBeds[wd] ||= []).push(r.bed); });
    const avg2 = (xs) => (xs && xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    cats = order.map((wd) => ({ label: WD[wd], wd, qual: avg2(wdQuals[wd]), bed: avg2(wdBeds[wd]) }));
  }
  const scroll = mode === "daily";
  const colW = 40;
  const N = cats.length || 1;
  const gap = N > 7 ? 3 : 8;
  const rowGap = scroll ? 0 : gap;
  const colStyle = scroll ? { width: colW, flex: "0 0 auto" } : { flex: 1 };
  const iconSize = N <= 4 ? 24 : N <= 7 ? 20 : 16;
  const hasAnyData = cats.some((c) => c.qual != null || c.bed != null);

  const H = 120, barH = 78;
  const xOf = (i) => ((i + 0.5) / N) * 100;
  const yOf = (q) => 14 + (1 - q / 3) * 72; // 수면 질 0~3, 높을수록 위
  // 기준 시간(가운데 시간대) = bed 0.5 → 이 높이에 점선을 긋고, 그보다 높으면 더 늦게 잔 날.
  const baseH = Math.round((0.18 + 0.5 * 0.82) * barH);
  const baseLabel = irregular ? "자야 하는 시간" : (setting?.base || "밤 12시");
  const barCaption = irregular
    ? "자야 하는 시간보다 늦게 잠든 날일수록 막대가 높아져요"
    : `기준 시간(${baseLabel})보다 늦게 잠든 날일수록 막대가 높아져요`;
  let dPath = "", prev = false;
  cats.forEach((c, i) => { if (c.qual == null) { prev = false; return; } dPath += `${prev ? " L" : "M"}${xOf(i).toFixed(2)} ${yOf(c.qual).toFixed(2)}`; prev = true; });

  const onDragDown = (e) => { const el = scrollElRef.current; if (!el) return; dragRef.current = { down: true, x: e.clientX, left: el.scrollLeft }; };
  const onDragMove = (e) => { if (!dragRef.current.down || !scrollElRef.current) return; scrollElRef.current.scrollLeft = dragRef.current.left - (e.clientX - dragRef.current.x); };
  const onDragUp = () => { dragRef.current.down = false; };
  const dragHandlers = scroll ? { onPointerDown: onDragDown, onPointerMove: onDragMove, onPointerUp: onDragUp, onPointerLeave: onDragUp } : {};

  const nightName = (nickname && String(nickname).trim()) ? String(nickname).trim() : "말랑이";

  return (
    <div style={{ background: "linear-gradient(180deg,#493F73,#61548F)", borderRadius: 20, padding: "18px 18px 20px", boxShadow: CARD_SHADOW, position: "relative", overflow: "hidden" }}>
      {["✦", "✧", "⋆", "✦", "✧"].map((s, i) => (<span key={i} style={{ position: "absolute", left: `${13 + i * 19}%`, top: `${8 + (i % 2) * 8}%`, color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{s}</span>))}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, position: "relative" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#FFD98A", letterSpacing: "0.02em", marginBottom: 3 }}>{nightName}의 밤</div>
          <div style={{ fontSize: 16.5, fontWeight: 800, color: "#fff" }}>🌙 {nightName}의 밤</div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600, margin: "3px 0 0", wordBreak: "keep-all", minHeight: 32, lineHeight: 1.35 }}>{mode === "weekly" ? "이번 달을 4주로 나눈 평균이에요" : mode === "daily" ? "하루하루의 수면 · 좌우로 넘겨보세요" : "요일별 평균으로 봤어요"}</p>
        </div>
        <TrendSwitchPill mode={mode} onSelect={setMode} t={getTypeAccent()} />
      </div>

      <div style={{ marginTop: 14, position: "relative" }}>
        <div style={{ position: "relative" }}>
        {scroll && <span style={{ position: "absolute", left: 0, top: "42%", transform: "translateY(-50%)", zIndex: 3, color: "rgba(255,255,255,0.55)", fontSize: 22, fontWeight: 900, lineHeight: 1, pointerEvents: "none" }}>‹</span>}
        {scroll && <span style={{ position: "absolute", right: 0, top: "42%", transform: "translateY(-50%)", zIndex: 3, color: "rgba(255,255,255,0.55)", fontSize: 22, fontWeight: 900, lineHeight: 1, pointerEvents: "none" }}>›</span>}
        <div ref={scrollElRef} {...dragHandlers} className="hide-scrollbar" style={{ overflowX: scroll ? "auto" : "visible", overflowY: "hidden", cursor: scroll ? "grab" : "default", touchAction: scroll ? "pan-x" : "auto", userSelect: "none" }}>
          <div style={{ width: scroll ? N * colW : "100%" }}>
            <div style={{ position: "relative", height: H }}
              onMouseEnter={() => setLineOnTop(true)} onMouseLeave={() => setLineOnTop(false)}>
              {/* 잠든 시간대 — 늦게 잘수록 막대가 높아요 */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: rowGap, paddingTop: 22, zIndex: lineOnTop ? 1 : 3 }}>
                {cats.map((c, i) => {
                  const h = c.bed == null ? 3 : Math.max(5, Math.round((0.18 + c.bed * 0.82) * barH));
                  const txt = bedLabel(c.bed, mode === "daily");
                  return (
                    <div key={i} style={{ ...colStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 3, height: "100%" }}>
                      {txt && <span style={{ fontSize: scroll ? 9 : 9.5, fontWeight: 800, color: "rgba(255,255,255,0.92)", whiteSpace: "nowrap" }}>{txt}</span>}
                      <div style={{ width: scroll ? 16 : "56%", maxWidth: 20, height: h, borderRadius: 6, background: c.bed == null ? "rgba(255,255,255,0.25)" : riskFill(c.bed), opacity: c.bed == null ? 0.4 : 1, transition: "height .3s" }} />
                    </div>
                  );
                })}
              </div>
              {/* 기준 시간 점선 — 이 선보다 막대가 높으면 그날 더 늦게 잠든 것 */}
              <div style={{ position: "absolute", left: 0, right: 0, bottom: baseH, borderTop: "1.5px dashed rgba(255,255,255,0.55)", pointerEvents: "none" }} />
              {/* 수면의 질 꺾은선 */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: lineOnTop ? 4 : 2, pointerEvents: "none" }}>
                {dPath && <path d={dPath} fill="none" stroke="#9CC6FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
              </svg>
              {/* 수면의 질 4가지 아이콘 */}
              {cats.map((c, i) => c.qual == null ? null : (
                <div key={i} style={{ position: "absolute", left: `${xOf(i)}%`, top: `${yOf(c.qual)}%`, transform: "translate(-50%,-50%)", background: "#493F73", borderRadius: "50%", padding: 1.5, boxShadow: "0 0 0 2px #9CC6FF", display: "flex", zIndex: lineOnTop ? 4 : 2, pointerEvents: "none" }}>
                  <DiaryIcon name={SLEEP_ICON[Math.max(0, Math.min(3, Math.round(c.qual)))]} size={iconSize} />
                </div>
              ))}
            </div>

            {/* x축 라벨 — 날짜 + 요일(일간). 요일줄은 항상 확보해 모드 전환 시 높이 일정 */}
            <div style={{ display: "flex", gap: rowGap, marginTop: 6 }}>
              {cats.map((c, i) => (
                <div key={i} style={{ ...colStyle, textAlign: "center" }}>
                  <div style={{ fontSize: (!scroll && N > 7) ? 9 : 10.5, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{c.label}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, height: 11, color: c.dow === 0 ? "#FF9B9B" : c.dow === 6 ? "#9CC6FF" : "rgba(255,255,255,0.45)", marginTop: 1 }}>{scroll ? WD[c.dow] : " "}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>

        {!hasAnyData && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 700, textAlign: "center", marginTop: 14 }}>이 기간엔 수면 기록이 없어요.</p>}

        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}><span style={{ width: 12, height: 8, borderRadius: 2, background: "linear-gradient(90deg,#59A863,#E9BC44,#E0554F)" }} />잠든 시간대</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}><span style={{ width: 12, height: 2, borderRadius: 2, background: "#9CC6FF" }} />수면의 질</span>
        </div>
        <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.6)", fontWeight: 600, textAlign: "center", margin: "8px 0 0", wordBreak: "keep-all" }}>
          <span style={{ display: "inline-block", width: 14, borderTop: "1.5px dashed rgba(255,255,255,0.55)", verticalAlign: "middle", marginRight: 5 }} />{barCaption}
        </p>
      </div>
    </div>
  );
}

// 부위별 요일 불편함 평균 — 특정 부위(또는 전체)만 걸러 요일별 평균을 낸다.
function computeWeekdaySore(entries, part) {
  const WDF = ["일", "월", "화", "수", "목", "금", "토"];
  const byWd = {};
  (entries || []).forEach((d) => { if (!d || !d.date) return; const wd = new Date(d.date + "T00:00:00").getDay(); (d.soreness || []).forEach((s) => { if (s && (!part || sorePartKey(s) === part) && typeof s.level === "number") (byWd[wd] ||= []).push(s.level); }); });
  const wdAvg = [];
  for (let wd = 0; wd < 7; wd++) { const arr = byWd[wd] || []; wdAvg.push({ wd, avg: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0, n: arr.length }); }
  const withData = wdAvg.filter((x) => x.n > 0);
  if (withData.length < 1) return null;
  const peak = withData.reduce((m, x) => (x.avg > m.avg ? x : m), withData[0]);
  const maxAvg = Math.max(...wdAvg.map((x) => x.avg), 1);
  const pk = WDF[peak.wd], pv = WDF[(peak.wd + 6) % 7];
  const comment = `${pv}요일까지 쌓인 불편함이 ${pk}요일에 한꺼번에 몰려오나 봐요. ${pk}요일 오후엔 꼭 스트레칭으로 몸을 풀어볼까요?`;
  return { wdAvg, peak, maxAvg, comment };
}

// 요일별 불편함 패턴 — 부위 선택 드롭다운 + 미니 막대그래프 + 최고 요일 강조
function WeekdayDrainCard({ entries }) {
  const t = getTypeAccent();
  const WD = ["일", "월", "화", "수", "목", "금", "토"];
  const order = [1, 2, 3, 4, 5, 6, 0]; // 월~일
  const partCounts = {};
  (entries || []).forEach((e) => (e.soreness || []).forEach((s) => { const k = sorePartKey(s); if (k) partCounts[k] = (partCounts[k] || 0) + 1; }));
  const partList = Object.keys(partCounts).sort((a, b) => partCounts[b] - partCounts[a]);
  const [sorePart, setSorePart] = useState(partList[0] || null);
  const activePart = sorePart && partCounts[sorePart] ? sorePart : (partList[0] || null);
  const data = computeWeekdaySore(entries, activePart);
  if (!data) return null;
  const peakWd = data.peak.wd;
  const partLabel = activePart ? sorePartLabel(activePart) : "몸";
  return (
    <InsCard badge="요일별 불편함 패턴" title="🗓️ 나의 요일별 불편함 패턴" sub="일주일 중 몸이 가장 많이 불편한 요일을 짚어봤어요">
      {partList.length > 0 && (
        <div className="neg-margin" style={{ display: "flex", justifyContent: "flex-end", marginTop: -6, marginBottom: 10 }}>
          <select value={activePart || ""} onChange={(e) => setSorePart(e.target.value)}
            style={{ fontSize: 11, fontWeight: 800, color: "#B23B36", background: "#FDECEC", border: "1px solid #F3CFCF", borderRadius: 999, padding: "3px 8px", outline: "none", cursor: "pointer" }}>
            {partList.map((pid) => <option key={pid} value={pid}>{sorePartLabel(pid)} ({partCounts[pid]}번)</option>)}
          </select>
        </div>
      )}
      <p style={{ fontSize: 14, fontWeight: 800, color: C.ink, margin: "0 0 18px", lineHeight: 1.5, wordBreak: "keep-all" }}>
        이번 달은 유독 <b style={{ color: "#E0554F" }}>{WD[peakWd]}요일</b>에 <b style={{ color: "#E0554F" }}>{partLabel}</b> 불편함이 가장 컸어요.
      </p>
      {/* 막대 위에 '최고조!'·🔴가 얹히므로, 최고 막대라도 그 라벨이 위 문구와 겹치지 않게
          컨테이너 높이를 넉넉히(128) 잡고 막대 최대 높이는 낮춘다(56). */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 6, height: 128, padding: "0 2px" }}>
        {order.map((wd) => {
          const rec = data.wdAvg[wd];
          const h = data.maxAvg ? Math.max(6, Math.round((rec.avg / data.maxAvg) * 56)) : 6;
          const isPeak = wd === peakWd && rec.n > 0;
          return (
            <div key={wd} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {isPeak && <span style={{ fontSize: 9.5, fontWeight: 800, color: "#E0554F", lineHeight: 1.1 }}>최고조!</span>}
              {isPeak && <span className="neg-margin" style={{ fontSize: 11, marginBottom: -2 }}>🔴</span>}
              <div style={{ width: "66%", maxWidth: 22, height: h, borderRadius: 6, background: isPeak ? "linear-gradient(180deg,#F0655F,#E0554F)" : "#E7E1D5", boxShadow: isPeak ? "0 3px 8px rgba(224,85,79,0.35)" : "none", transition: "height .3s" }} />
              <span style={{ fontSize: 11, fontWeight: isPeak ? 800 : 600, color: isPeak ? "#E0554F" : C.sub }}>{WD[wd]}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16, background: t.accentSoft, borderRadius: 14, padding: "13px 15px", display: "flex", gap: 9, alignItems: "flex-start" }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>💡</span>
        <p style={{ fontSize: 12.5, color: t.accentDeep, fontWeight: 700, lineHeight: 1.55, margin: 0, wordBreak: "keep-all" }}>{data.comment}</p>
      </div>
    </InsCard>
  );
}

// 마음과 몸의 연결고리 — 무리한 날 vs 스트레스받은 날의 불편 강도 비교
function MindBodyLinkCard({ data }) {
  const dots = (avg, color) => {
    const filled = Math.max(0, Math.min(5, Math.round(avg / 2)));
    return (
      <span style={{ display: "inline-flex", gap: 3 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: i < filled ? color : "#E7E1D5" }} />
        ))}
      </span>
    );
  };
  return (
    <InsCard badge="마음과 몸의 연결고리" title="🔗 마음과 몸의 연결고리" sub="몸의 무리함과 마음의 힘듦, 어느 쪽이 더 아프게 남았을까요">
      {data.emoHigher && (
        <p style={{ fontSize: 14, fontWeight: 800, color: C.ink, margin: "0 0 14px", lineHeight: 1.5, wordBreak: "keep-all" }}>
          몸보다 마음이 힘들 때, 내 몸은 더 크게 아파했어요.
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: "#FBFAF6", border: `1px solid ${C.line}`, borderRadius: 14, padding: "13px 15px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 8 }}>🏃 '무리했어요' 기록한 날 <span style={{ color: C.sub, fontWeight: 700 }}>({data.physN}일)</span></div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 12.5, color: C.sub, fontWeight: 700 }}>불편함 평균 ➔ <b style={{ color: "#C9973A", fontSize: 15 }}>{data.physAvg.toFixed(1)}점</b></span>
            {dots(data.physAvg, "#EEC24A")}
          </div>
        </div>
        <div style={{ background: "#FDF3F2", border: "1px solid #F3DDDD", borderRadius: 14, padding: "13px 15px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#B23B36", marginBottom: 8 }}>🌩️ '스트레스·짜증' 기록한 날 <span style={{ color: "#C6928F", fontWeight: 700 }}>({data.emoN}일)</span></div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 12.5, color: "#B0736E", fontWeight: 700 }}>불편함 평균 ➔ <b style={{ color: "#E0554F", fontSize: 15 }}>{data.emoAvg.toFixed(1)}점</b></span>
            {dots(data.emoAvg, "#E0554F")}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14, background: "#FDF3F2", borderRadius: 14, padding: "13px 15px", display: "flex", gap: 9, alignItems: "flex-start" }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>💡</span>
        <p style={{ fontSize: 12.5, color: "#8E2E2A", fontWeight: 700, lineHeight: 1.55, margin: 0, wordBreak: "keep-all" }}>{data.comment}</p>
      </div>
    </InsCard>
  );
}

// 5. 오뚝이 회복력
function RecoveryCard({ data }) {
  return (
    <InsCard badge="회복력 · 탄성 지수" title="나의 놀라운 회복력">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "6px 0 2px" }}>
        <div style={{ animation: "ottugi 1.8s ease-in-out infinite", transformOrigin: "bottom center" }}><Mallang v={4} size={54} /></div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, color: getTypeAccent().accentDeep, lineHeight: 1 }}>{data.recovered}/{data.drops}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, marginTop: 3 }}>다시 일어난 횟수</div>
        </div>
      </div>
      <Insight>놀라운 회복력! 이번 달 기분이 힘들게 떨어졌던 {data.drops}번 중 {data.recovered}번은 {data.avgDays ? `평균 ${data.avgDays}일 만에` : "곧"} 다시 '괜찮았어요'로 컨디션을 끌어올리셨어요. 스스로를 아주 잘 돌보고 계시네요!</Insight>
      <style>{`@keyframes ottugi{0%,100%{transform:rotate(-11deg)}50%{transform:rotate(11deg)}}`}</style>
    </InsCard>
  );
}

// 6. 주간 형광펜(연속 무리)
function StreakCard({ data }) {
  return (
    <InsCard badge="연속과 공백" title="브레이크가 필요한 순간">
      <div style={{ display: "flex", gap: 4, justifyContent: "space-between" }}>
        {data.week.map((c, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: i === 0 ? "#E0554F" : i === 6 ? "#2F6FE0" : C.sub, marginBottom: 4 }}>{WD_FULL[i]}</div>
            <div style={{ position: "relative", height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: c.over ? "#8A5A00" : C.ink, background: c.over ? "linear-gradient(180deg,#FFE98A,#FFDF5C)" : "#F5F2EC", boxShadow: c.over ? "0 1px 4px rgba(230,190,40,0.5)" : "none" }}>
              {c.day}{c.over && <span style={{ position: "absolute", top: -3, right: -1, fontSize: 10 }}>💦</span>}
            </div>
          </div>
        ))}
      </div>
      <Insight>이번 달 가장 길게 무리한 건 무려 <b style={{ color: "#D98A2B", fontWeight: 800 }}>{data.len}일 연속</b>이었어요. 열심히 달린 만큼, 다음 달엔 중간중간 꼭 쉼표를 찍어주세요.</Insight>
    </InsCard>
  );
}

// 3. 원고지 정성
function EffortCard({ data }) {
  return (
    <InsCard badge="나를 돌본 시간" title="기록을 남긴 정성">
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, borderRadius: 12, background: "#FBFAF4", backgroundImage: "linear-gradient(#EDE7D6 1px,transparent 1px),linear-gradient(90deg,#EDE7D6 1px,transparent 1px)", backgroundSize: "13px 13px", border: "1px solid #E7DFCB", padding: "14px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.ink }}>{data.count}편</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, marginTop: 2 }}>이번 달 일기</div>
        </div>
        <div style={{ flex: 1, borderRadius: 12, background: "#FBFAF4", backgroundImage: "linear-gradient(#EDE7D6 1px,transparent 1px),linear-gradient(90deg,#EDE7D6 1px,transparent 1px)", backgroundSize: "13px 13px", border: "1px solid #E7DFCB", padding: "14px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.ink }}>{data.avgLen}자</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, marginTop: 2 }}>평균 문장 길이</div>
        </div>
      </div>
      <Insight>이번 달 남겨주신 일기는 총 {data.count}편! 평균 {data.avgLen}자의 정성스러운 문장들로 하루를 돌아보셨어요. 나를 돌보기 위해 참 다정하게 노력한 한 달이네요.</Insight>
    </InsCard>
  );
}

// 4. 무드등 시계
function LampClockCard({ data, nickname }) {
  const timeText = data.hour != null ? `${data.hour < 12 ? "오전" : "오후"} ${((data.hour + 11) % 12) + 1}시` : `${data.bucket}`;
  return (
    <InsCard badge="나의 리듬" title="주로 기록을 남긴 시간대">
      <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 8px" }}>
        <div style={{ width: 108, height: 108, borderRadius: "50%", background: "radial-gradient(circle at 50% 40%,#FFE9B0,#F6C560)", boxShadow: "0 0 26px rgba(246,197,96,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "lampGlow 3s ease-in-out infinite" }}>
          <span style={{ fontSize: 20 }}>🕯️</span>
          <span style={{ fontSize: 17, fontWeight: 900, color: "#7A5A16", marginTop: 2 }}>{timeText}</span>
        </div>
      </div>
      <Insight>이번 달 {nickname || "회원"}님은 주로 {timeText}에 하루를 마무리하며 기록을 남기셨어요. 가장 차분해지는 나만의 시간이네요.</Insight>
      <style>{`@keyframes lampGlow{0%,100%{box-shadow:0 0 22px rgba(246,197,96,0.5)}50%{box-shadow:0 0 32px rgba(246,197,96,0.8)}}`}</style>
    </InsCard>
  );
}

// 7. 초심 저울(프로필 팩트체크) — 최근 저장한 '일상 정보' 선택을 보여주고, 그대로 이번 달이 어땠는지 이어본다
const FACT_CAT_ICON = { "운동 빈도": "🔁", "운동 목적": "🎯", "자주 하는 자세": "🧍", "불편한 부위": "📍" };
// 팩트체크 코멘트에서 핵심 문구(숫자·따옴표로 감싼 내가 정한 내용)를 연보라로 강조.
const FACT_HL = "#8B7BD8";
function hlFact(text) {
  if (typeof text !== "string") return text;
  return text.split(/('[^']*'|\d+(?:\.\d+)?[일번점%]?)/g).map((s, i) =>
    (/^'.*'$/.test(s) || /^\d/.test(s)) ? <b key={i} style={{ color: FACT_HL, fontWeight: 800 }}>{s}</b> : s);
}
function FactCheckCard({ rows = [], profile, userInfo, isLoggedIn }) {
  const t = getTypeAccent();
  const p = profile || {};
  const canEdit = isLoggedIn !== undefined; // 실제(잠금 아님) 카드에서만 입력 버튼 노출
  const hasHabits = !!(p.freq || (p.goals && p.goals.length) || p.posture);
  const [habitsPopup, setHabitsPopup] = useState(null); // 온보딩2·3 대체 팝업
  return (
    <InsCard badge="처음의 다짐 · 팩트 체크" title="내가 정한 것, 이번 달은 어땠을까" sub="내가 신경 쓴다고 한 것과 이번 달 기록을 이어봤어요">
      {/* 온보딩2·3 대체 — 운동 습관·자세 입력/월 갱신 버튼 */}
      {canEdit && (
        <button onClick={() => setHabitsPopup({ askReconfirm: hasHabits && !habitConfirmedThisMonth() })}
          style={{ width: "100%", marginBottom: 14, border: `1.5px solid ${t.accentSoft}`, background: hasHabits ? "#fff" : t.accentSoft, color: t.accentDeep, cursor: "pointer", borderRadius: 12, padding: "11px 0", fontSize: 12.5, fontWeight: 800, fontFamily: "inherit" }}>
          {hasHabits ? (habitConfirmedThisMonth() ? "운동 습관·자세 수정하기" : "이번 달 운동 습관·자세 확인하기") : "＋ 운동 습관·자세 입력하고 더 많은 발견 받기"}
        </button>
      )}
      {/* 화살표 라벨 */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "0 2px 10px" }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: t.accentDeep, background: t.accentSoft, borderRadius: 999, padding: "4px 11px" }}>→ 그래서 이번 달은</span>
        <span style={{ flex: 1, height: 1, background: C.line }} />
      </div>
      {rows.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start", background: "#FBFAF6", borderRadius: 13, padding: "13px 14px", borderLeft: `3px solid ${t.accent}` }}>
              <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>{typeof r === "string" ? "⚖️" : r.icon}</span>
              <p style={{ fontSize: 12.5, color: "#3F3A31", fontWeight: 600, lineHeight: 1.6, margin: 0, wordBreak: "keep-all", paddingTop: 2 }}>{hlFact(typeof r === "string" ? r : r.text)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, lineHeight: 1.55, margin: 0, background: "#FBFAF6", borderRadius: 12, padding: "12px 13px", wordBreak: "keep-all" }}>
          기록이 조금 더 쌓이면, 내가 정한 목표와 실제 이번 달 기록을 비교해서 알려드릴게요.
        </p>
      )}
      {habitsPopup && (
        <MallangInfoPopup mode="habits" userInfo={userInfo} isLoggedIn={isLoggedIn} setUserProfile={null}
          askReconfirm={habitsPopup.askReconfirm} onClose={() => setHabitsPopup(null)} />
      )}
    </InsCard>
  );
}

// 8. 코치의 편지
// 4-여성. 마법의 D-Day 카운트다운 — PMS 기간을 카드 스와이프로
function DdayCard({ data }) {
  const t = getTypeAccent();
  const ref = useRef(null);
  const [idx, setIdx] = useState(0);
  const drag = useRef({ on: false, x: 0, sl: 0 });
  const N = data.cards.length;
  // 마우스 드래그로도 넘길 수 있게(데스크톱). 터치는 네이티브 가로 스크롤이 담당.
  const onDown = (e) => { if (e.pointerType === "touch") return; const el = ref.current; drag.current = { on: true, x: e.clientX, sl: el.scrollLeft }; };
  const onMove = (e) => { if (!drag.current.on) return; ref.current.scrollLeft = drag.current.sl - (e.clientX - drag.current.x); };
  const onUp = () => { drag.current.on = false; };
  const onScroll = () => { const el = ref.current; if (!el) return; setIdx(Math.round(el.scrollLeft / (el.clientWidth * 0.86))); };
  const goTo = (i) => { const el = ref.current; if (!el) return; const to = Math.max(0, Math.min(N - 1, i)); el.scrollTo({ left: to * el.clientWidth * 0.86, behavior: "smooth" }); };
  return (
    <InsCard badge="여성 전용 · PMS 돋보기" title="마법의 D-Day 카운트다운" sub="생리 직전 일주일의 식욕·불편함 변화를 확대해서 봤어요">
      <div ref={ref} className="dday-scroll" onScroll={onScroll} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
        style={{ display: "flex", gap: 12, overflowX: "auto", padding: "2px 2px 8px", margin: "0 -2px", scrollSnapType: "x mandatory", touchAction: "pan-x pan-y", cursor: "grab" }}>
        {data.cards.map((c, i) => (
          <div key={i} style={{ flex: "0 0 86%", scrollSnapAlign: "center", background: "linear-gradient(180deg,#FFF3F6,#FBE7EE)", border: "1px solid #F4D3DE", borderRadius: 16, padding: "16px 15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#C4517A" }}>{c.dlabel}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{c.title}</div>
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: "#5A4048", fontWeight: 600, lineHeight: 1.6, margin: 0, wordBreak: "keep-all" }}>{c.text}</p>
          </div>
        ))}
      </div>
      {/* 좌우 화살표 + 점 인디케이터 — 넘길 수 있다는 걸 분명히 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 4 }}>
        <button onClick={() => goTo(idx - 1)} disabled={idx <= 0} aria-label="이전" style={{ border: "none", background: "transparent", color: idx <= 0 ? "#E0D6DA" : "#C4517A", fontSize: 18, fontWeight: 900, cursor: idx <= 0 ? "default" : "pointer", padding: "0 4px" }}>‹</button>
        <div style={{ display: "flex", gap: 5 }}>
          {data.cards.map((_, i) => <span key={i} style={{ width: i === idx ? 16 : 6, height: 6, borderRadius: 4, background: i === idx ? "#E8618C" : "#F4D3DE", transition: "all .2s" }} />)}
        </div>
        <button onClick={() => goTo(idx + 1)} disabled={idx >= N - 1} aria-label="다음" style={{ border: "none", background: "transparent", color: idx >= N - 1 ? "#E0D6DA" : "#C4517A", fontSize: 18, fontWeight: 900, cursor: idx >= N - 1 ? "default" : "pointer", padding: "0 4px" }}>›</button>
      </div>
      <style>{`.dday-scroll::-webkit-scrollbar{display:none}.dday-scroll{scrollbar-width:none}`}</style>
    </InsCard>
  );
}

// 편지 본문 — '기록을 보니/이번 달/다음 달/OO 말랑이' 처럼 시작하는 문장 앞에서 줄바꿈해 읽기 쉽게.
const letterBreaks = (s) => (s || "").replace(/\s+(기록을 보|이번 달|다음\s?달|'[^']+' 말랑이)/g, "\n$1");
function LetterCard({ data, isM, bmtiCode, pdfMode = false }) {
  const [openState, setOpen] = useState(false);
  const open = pdfMode || openState; // PDF로 저장할 땐 편지를 펼친 상태로 캡처
  const t = getTypeAccent();
  const axis = bmtiCode ? String(bmtiCode).split("-")[0] : "";
  const charData = CHARACTERS.find(c => c.id === axis);
  const charName = CHARACTER_NAMES[axis] ? String(CHARACTER_NAMES[axis]).replace(/\n/g, " ") : "말랑이";
  return (
    <div style={{ background: "linear-gradient(180deg,#FFFDF7,#FBF4E6)", borderRadius: 20, padding: "20px 18px 22px", boxShadow: CARD_SHADOW, border: "1px solid #EEE4CE", position: "relative", overflow: "hidden" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: t.accentDeep, letterSpacing: "0.02em", marginBottom: 3 }}>이번 달의 피날레</div>
      <div style={{ fontSize: 16.5, fontWeight: 800, color: C.ink, wordBreak: "keep-all", textWrap: "balance" }}>내 BMTI 유형의 편지</div>

      {/* 누끼 파트너 캐릭터 — 박스 안에 담는다 */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, margin: "16px 0 4px" }}>
        <div style={{ width: 96, height: 96, borderRadius: 24, background: `radial-gradient(circle at 50% 40%, #fff, ${t.accentSoft})`, border: `1px solid ${t.accentSoft}`, boxShadow: "inset 0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", animation: open ? "none" : "sealBob 2.6s ease-in-out infinite" }}>
          {charData
            ? <img src={charData.image} alt={charName} style={{ width: "82%", height: "82%", objectFit: "contain" }} />
            : <span style={{ fontSize: 40 }}>💌</span>}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: t.accentDeep }}>{charName} 파트너</div>
      </div>

      {!open ? (
        <button onClick={() => setOpen(true)} style={{ margin: "6px auto 0", display: "block", border: "none", background: t.accent, color: "#fff", cursor: "pointer", padding: "11px 20px", borderRadius: 999, fontSize: 13, fontWeight: 800, boxShadow: `0 4px 12px ${t.accentSoft}` }}>
          ✉️ 파트너의 편지 열어보기
        </button>
      ) : (
        <div style={{ marginTop: 12, animation: "letterOpen .4s ease-out" }}>
          {/* 편지지 — 가로 괘선 + 좌측 여백선 + 가운데 접힘선 */}
          <div style={{
            position: "relative", borderRadius: 10, padding: "16px 16px 18px", border: "1px solid #E7D8B0", overflow: "hidden",
            background: "#FFFDF5",
            boxShadow: "0 3px 12px rgba(180,150,80,0.16), inset 0 0 0 1px rgba(255,255,255,0.5)",
          }}>
            {/* 좌측 여백선 */}
            <div style={{ position: "absolute", top: 0, bottom: 0, left: 26, width: 1, background: "rgba(206,120,110,0.32)" }} />
            {/* 가운데 접힘선 */}
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 10, background: "linear-gradient(180deg, rgba(150,120,60,0.12), rgba(150,120,60,0) 65%)", pointerEvents: "none" }} />
            {/* 괘선을 본문과 같은 줄높이(28px)에 맞춰 '각 줄 아래 밑줄'로 그려, 글자를 가리지 않게 한다 */}
            <div style={{ position: "relative", paddingLeft: 26, backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 27px, #EBDCB6 27px, #EBDCB6 28px)" }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: t.accentDeep, lineHeight: "28px" }}>To. {data.nickname || "회원"}님</div>
              <p style={{ margin: 0, lineHeight: "28px", fontSize: 13.5, color: "#4A4436", fontWeight: 600, wordBreak: "keep-all", textWrap: "pretty", whiteSpace: "pre-line" }}>{letterBreaks(data.body)}</p>
              <div style={{ textAlign: "right", fontSize: 12.5, fontWeight: 800, color: t.accentDeep, lineHeight: "28px" }}>— 당신의 BMTI 유형, {charName} 드림</div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes sealBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes letterOpen{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
