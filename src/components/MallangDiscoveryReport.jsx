import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Mallang } from "./Mallang";
import FeedbackModal from "./FeedbackModal";
import { DiaryIcon } from "./DiaryIcons";
import { SLEEP_ICON } from "../lib/diaryEntryLabels";

// 오늘의 태그 라벨 → 아이콘 이름 (DiaryWriteFlow의 TAG_CATEGORIES와 동일하게 유지)
const TAG_ICON = {
  "카페인": "caffeine", "음주": "alcohol", "야식·과식": "snacking", "수분 보충": "water", "맵거나 짠 음식": "spicy", "달달 디저트": "dessert",
  "스마트폰·PC": "phone", "장거리 운전": "driving", "불편한 신발": "shoes", "무거운 짐": "heavyBag", "에어컨·추위": "coldAir",
  "스트레스": "stress", "긴장함": "nervous", "방전됨": "drained", "소화 불량": "indigestion", "생리 중": "period", "약 복용": "medicine",
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
import bodyFemaleFront from "../assets/3d_body/female_front.png";
import bodyFemaleBack from "../assets/3d_body/female_back.png";
import bodyMaleFront from "../assets/3d_body/male_front.png";
import bodyMaleBack from "../assets/3d_body/male_back.png";

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

export default function MallangDiscoveryReport({ onClose, bmtiCode, userData }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [showExample, setShowExample] = useState(false);
  const [tab, setTab] = useState("records"); // "records" | "discovery"
  const [, forceWeatherRefresh] = useState(0); // 날씨를 붙인 뒤 리포트를 다시 읽게 하는 트리거
  const [savingPDF, setSavingPDF] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const contentRef = useRef(null);

  // 다음 페인트까지 대기(탭 전환 후 DOM 갱신 + 이미지 로딩)
  const nextPaint = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120))));
  const waitForImages = (el) => Promise.all(Array.from(el.querySelectorAll("img")).map((img) =>
    (img.complete && img.naturalWidth > 0) ? Promise.resolve() : new Promise((res) => { img.onload = res; img.onerror = res; })));

  // '이번달 기록' + '이번달 발견'을 한 PDF로 만들어 카카오톡(OS 공유 시트)으로 전달 (ResultView 패턴 재사용)
  const handleMonthlyPDF = async () => {
    if (savingPDF) return;
    setSavingPDF(true);
    const prevTab = tab;
    try {
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 32;
      const CARD_W = 330;               // 카드 폭을 페이지보다 좁혀 여러 장이 한 페이지에 담기도록
      const usableH = pageHeight - margin * 2;
      const gap = 14;
      let cursorY = margin;

      // 표지 제목
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(16);
      pdf.text(`${year}.${String(month).padStart(2, "0")}  Mallang Report`, margin, cursorY + 4);
      cursorY += 26;

      // 폰트가 완전히 로드된 뒤 캡처해야 텍스트 기준선이 어긋나지 않는다.
      if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch { /* noop */ } }

      for (const t of ["records", "discovery"]) {
        setTab(t);
        await nextPaint();
        const root = contentRef.current?.firstElementChild;
        if (!root) continue;
        await waitForImages(root);
        const cards = Array.from(root.children);
        for (const card of cards) {
          const canvas = await html2canvas(card, { scale: 2, useCORS: true, backgroundColor: "#ffffff", letterRendering: true, scrollX: 0, scrollY: -window.scrollY });
          if (!canvas.width || !canvas.height) continue;
          const imgData = canvas.toDataURL("image/jpeg", 0.92);
          let w = CARD_W;
          let h = (canvas.height * w) / canvas.width;
          if (h > usableH) { w *= usableH / h; h = usableH; }   // 한 장보다 큰 카드는 페이지에 맞게 축소
          if (cursorY !== margin && cursorY + h > pageHeight - margin) { pdf.addPage(); cursorY = margin; }
          pdf.addImage(imgData, "JPEG", (pageWidth - w) / 2, cursorY, w, h);
          cursorY += h + gap;
        }
      }

      const pdfBlob = pdf.output("blob");
      const fileName = `말랑리포트_${year}-${String(month).padStart(2, "0")}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({ files: [pdfFile], title: "말랑 리포트", text: `${year}년 ${month}월 말랑 리포트 — 이번 달 기록과 발견이에요.` });
      } else {
        const link = document.createElement("a");
        link.download = fileName; link.href = URL.createObjectURL(pdfBlob); link.click();
        URL.revokeObjectURL(link.href);
        alert("말랑 리포트 PDF가 저장되었어요. 카카오톡 채팅방에서 파일을 첨부해 보내주세요.");
      }
    } catch (e) {
      console.error("월간 리포트 PDF 생성 오류:", e);
      alert("리포트를 만드는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
    } finally {
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

        <div ref={contentRef}>
        {tab === "records" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(() => {
              const find = (id) => report.sections.find(x => x.id === id);
              const topMood = find("mood_distribution")?.data?.top || null;
              return report.sections.map((s) => {
                // 무리·움직임·쉬어감 세 카드는 '활동량 요약' 하나로, '불편했던 순간'은 '바디 스캔'에 합친다.
                if (s.id === "overwork" || s.id === "rest" || s.id === "sore_moments") return null;
                if (s.id === "movement") {
                  return <ActivityTrackCard key="activity" topMood={topMood} move={find("movement")} rest={find("rest")} over={find("overwork")} />;
                }
                return <SectionCard key={s.id} section={s} gender={userData?.kakao_gender || userData?.kakaoGender} entries={entries} topMood={topMood} moments={s.id === "sore_map" ? find("sore_moments")?.data : null} />;
              });
            })()}
          </div>
        ) : (
          <DiscoveryInsights report={report} entries={entries} userData={userData} nickname={userData?.nickname} bmtiCode={bmtiCode} />
        )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 22, padding: "12px 14px", background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 14 }}>
          <span style={{ display: "flex", color: C.sub, marginTop: 1 }}><IconInfo size={14} /></span>
          <p style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.6, margin: 0 }}>{report.disclaimer}</p>
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
        <button onClick={() => setShowFeedback(true)}
          style={{ display: "block", margin: "22px auto 0", border: "none", background: "transparent", color: C.sub, fontSize: 12.5, fontWeight: 700, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
          💬 말랑이의 발견, 개선 의견 보내기
        </button>
      </div>

      {showExample && <DiscoveryExamplePopup onClose={() => setShowExample(false)} />}
      {showFeedback && <FeedbackModal source="discovery" userId={userData?.id} onClose={() => setShowFeedback(false)} />}
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
            <span key={it.label} style={{ fontSize: 12.5, fontWeight: 700, background: t.accentSoft, color: t.accentDeep, borderRadius: 999, padding: "8px 13px", display: "inline-flex", alignItems: "center", gap: 5 }}>
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
function ActivityTrackCard({ topMood, move, rest, over }) {
  const t = getTypeAccent();
  const moveN = move?.data?.days || 0, restN = rest?.data?.days || 0, overN = over?.data?.days || 0;
  const maxDays = Math.max(moveN, restN, overN, 1);
  const mood = topMood || 4; // 이번 달 금메달 말랑이
  const exTop = move?.data?.byType?.[0];
  const restTop = rest?.data?.items?.[0];
  const overTop = over?.data?.items?.[0];
  const lanes = [
    { key: "move", emoji: "🏃‍♂️", label: "운동함", days: moveN, be: exTop ? (EX_EMOJI[exTop.label] || "🏃") : "", bl: exTop?.label },
    { key: "rest", emoji: "🛌", label: "쉬어감", days: restN, be: restTop ? (REASON_EMOJI[restTop.reason] || "🛌") : "", bl: restTop?.label },
    { key: "over", emoji: "💦", label: "무리함", days: overN, be: overTop ? (LOAD_EMOJI[overTop.load] || "💦") : "", bl: overTop?.label },
  ];
  const has = moveN + restN + overN > 0;
  return (
    <div style={{ background: C.card, borderRadius: 20, padding: "18px 18px 20px", boxShadow: CARD_SHADOW, border: "1px solid #F1EEE8" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: t.accentSoft, color: t.accentDeep }}><IconRun size={18} /></span>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", color: C.ink }}>활동량 요약</span>
      </div>
      <p style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, margin: "0 0 8px" }}>금메달 말랑이가 세 트랙을 달렸어요. 많이 한 트랙일수록 앞서 있어요 🏁</p>
      {has ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {lanes.map(l => (
            <ActLane key={l.key} emoji={l.emoji} label={l.label} days={l.days} maxDays={maxDays} bubbleEmoji={l.be} bubbleLabel={l.bl} mood={mood} />
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, margin: "10px 0 2px", textAlign: "center" }}>이번 달 활동 기록이 아직 없어요.</p>
      )}
      <style>{`@keyframes mallangRun{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-4px) rotate(3deg)}}`}</style>
    </div>
  );
}

function SectionCard({ section: s, gender, entries, topMood, moments }) {
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
          <SectionBody id={s.id} data={s.data} gender={gender} entries={entries} topMood={topMood} moments={moments} />
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

function SectionBody({ id, data, gender, entries, topMood, moments }) {
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
    case "notes": return <NotesBody data={data} entries={entries} />;
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
        <span key={i} style={{ position: "absolute", left: `${8 + i * 9}%`, top: "6%", fontSize: 12,
          animation: `awardPop 1.8s ease-out ${(i % 5) * 0.18}s infinite` }}>{["🎉", "✨", "🎊"][i % 3]}</span>
      ))}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 8, position: "relative", zIndex: 1 }}>
        {podium.sort((a, b) => a.order - b.order).map((p) => (
          <div key={p.rank} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0, maxWidth: 96 }}>
            {p.rank === 1 && <div style={{ fontSize: 20, marginBottom: -6, animation: "crownBob 2s ease-in-out infinite" }}>👑</div>}
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
const BODY_POS_3D = {
  head: { v: "front", x: 50, y: 11 }, shoulder: { v: "front", x: 50, y: 31 },
  elbow: { v: "front", x: 25, y: 49 }, wrist: { v: "front", x: 24, y: 61 },
  abdomen: { v: "front", x: 50, y: 47 }, pelvis: { v: "front", x: 50, y: 59 },
  knee: { v: "front", x: 50, y: 77 }, ankle: { v: "front", x: 50, y: 90 },
  neck: { v: "back", x: 50, y: 26 }, back: { v: "back", x: 50, y: 36 }, waist: { v: "back", x: 50, y: 53 },
  // etc(기타)는 몸 위치가 없어 지도에 표시하지 않는다.
};
function SoreMap({ data, gender, moments }) {
  const t = getTypeAccent();
  const isMale = gender === "male" || gender === "M" || gender === "남성";
  const imgFront = isMale ? bodyMaleFront : bodyFemaleFront;
  const imgBack = isMale ? bodyMaleBack : bodyFemaleBack;
  const top = [...data.parts].sort((a, b) => b.count - a.count)[0];
  const maxCount = data.maxCount || 1;
  const momentItems = moments?.items || [];

  const Figure = ({ src, view, label }) => (
    <div style={{ position: "relative", flex: 1, aspectRatio: "1 / 2", maxWidth: 150 }}>
      <img src={src} alt={label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
      {data.parts.map((p) => {
        const pos = BODY_POS_3D[p.part];
        if (!pos || pos.v !== view) return null;
        const size = 10 + 20 * (p.count / maxCount); // 누적 많을수록 큰 점
        const isTop = top && p.part === top.part;
        return (
          <span key={p.part} title={`${p.label} ${p.count}번`}
            style={{ position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, width: size, height: size,
              marginLeft: -size / 2, marginTop: -size / 2, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(230,60,55,0.95) 0%, rgba(230,60,55,0.55) 60%, rgba(230,60,55,0) 100%)",
              animation: isTop ? "soreDotPulse 1.8s ease-in-out infinite" : "none" }} />
        );
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

      {/* 불편했던 순간 — 바디 스캔에 함께 포함 */}
      {momentItems.length > 0 && (
        <div style={{ width: "100%", marginTop: 4, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: C.ink, marginBottom: 10, textAlign: "center" }}>언제 불편했나요?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {momentItems.map((it) => (
              <span key={it.situation} style={{ fontSize: 12.5, fontWeight: 700, background: t.accentSoft, color: t.accentDeep, borderRadius: 999, padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 5 }}>
                {it.label}<b style={{ fontWeight: 800 }}>{it.count}번</b>
              </span>
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
function NotesBody({ data, entries }) {
  const [open, setOpen] = useState(null);
  const items = data.items || [];
  const tagsByDate = {};
  (entries || []).forEach(e => { if (e?.date && Array.isArray(e.tags)) tagsByDate[e.date] = e.tags; });
  const tagLabels = (it) => (tagsByDate[it.date] || []);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", background: "#E7D6B8", backgroundImage: "radial-gradient(rgba(150,110,60,0.18) 1px, transparent 1px)", backgroundSize: "10px 10px", borderRadius: 14, padding: "16px 12px" }}>
        {items.map((it, i) => {
          const cat = NOTE_CAT[it.category] || { emoji: "📝", tint: "#F3F1EC" };
          const tilt = (i % 3 - 1) * 3.2;
          const tags = tagLabels(it);
          return (
            <button key={i} onClick={() => setOpen(it)}
              style={{ width: "44%", maxWidth: 150, background: "#fff", border: "none", borderRadius: 4, padding: "8px 8px 0", boxShadow: "0 3px 10px rgba(60,45,25,0.22)", cursor: "pointer", transform: `rotate(${tilt}deg)`, transition: "transform .15s" }}>
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

      {open && (() => {
        const cat = NOTE_CAT[open.category] || { emoji: "📝", tint: "#F3F1EC" };
        const tags = tagLabels(open);
        return (
          <div onClick={() => setOpen(null)} style={{ position: "fixed", inset: 0, zIndex: 85, background: "rgba(28,26,23,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 28 }}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 300, background: "#fff", borderRadius: 6, padding: "12px 12px 0", boxShadow: "0 12px 40px rgba(0,0,0,0.35)", animation: "polaroidPop .28s cubic-bezier(.22,.9,.32,1)" }}>
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
const RAIN_CODES2 = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

function topOf(map) { let k = null, n = 0; for (const [key, v] of Object.entries(map)) if (v > n) { n = v; k = key; } return k == null ? null : { key: k, n }; }

function computeInsights(entries, userData, report) {
  const days = [...(entries || [])].filter(e => e && typeof e.mood === "number").sort((a, b) => a.date.localeCompare(b.date));
  const byDate = Object.fromEntries(days.map(d => [d.date, d]));
  const nextOf = (ds) => { const d = new Date(ds + "T00:00:00"); d.setDate(d.getDate() + 1); const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; return byDate[iso]; };
  const wd = (ds) => new Date(ds + "T00:00:00").getDay();

  // ── 1. 기분 연결고리 (슬롯) ──
  const link = (() => {
    const exDays = days.filter(d => d.exercise?.did === true);
    if (exDays.length >= 4) { const r = exDays.filter(d => d.mood >= 4).length / exDays.length; if (r >= 0.6) return { slots: ["🏃 운동한 날", "몸을 움직이면", "😊 좋았어요"], message: `몸을 움직인 날의 ${Math.round(r * 100)}%는 '좋았어요·괜찮았어요' 기분으로 마무리했어요! 움직임이 확실한 기분 전환이 되었네요.` }; }
    const wdTired = {}; days.forEach(d => { if (d.mood <= 2) wdTired[wd(d.date)] = (wdTired[wd(d.date)] || 0) + 1; });
    const tw = topOf(wdTired); if (tw && tw.n >= 2) return { slots: [`📅 ${WD_FULL[tw.key]}요일`, "저녁이 되면", "😩 지쳤어요"], message: `이번 달은 ${WD_FULL[tw.key]}요일에 가장 많이 '지쳤어요'를 선택했네요. ${WD_FULL[tw.key]}요일엔 유독 더 맛있는 음식으로 스스로를 위로해 볼까요?` };
    const wDays = days.filter(d => d.weather && typeof d.weather.code === "number");
    if (wDays.length >= 4) { const rain = wDays.filter(d => (d.weather.precip != null && d.weather.precip >= 1) || RAIN_CODES2.has(d.weather.code)); if (rain.length >= 3) { const r = rain.filter(d => d.mood <= 3).length / rain.length; if (r >= 0.6) return { slots: ["🌧️ 비 오는 날", "하늘이 흐리면", "😐 그냥저냥 이하"], message: `비가 오는 날의 ${Math.round(r * 100)}%는 기분이 '그냥저냥' 이하로 떨어졌어요. 맑은 날을 더 알차게 즐겨봐요!` }; } }
    const nights = days.filter(d => (d.tags || []).includes("야식·과식") || d.sleepTime === "1시" || d.sleepTime === "2시 이후");
    if (nights.length >= 3) { const r = nights.map(d => nextOf(d.date)).filter(nx => nx && nx.mood <= 3).length / nights.length; if (r >= 0.55) return { slots: ["🍜 야식·늦잠", "그 다음 날엔", "😐 그냥저냥 이하"], message: `야식·과식 태그를 남기거나 밤 12시 이후에 잠든 날엔 다음 날 여지없이 기분이 '그냥저냥' 이하로 떨어졌어요.` }; }
    return null;
  })();

  // ── 2. 수면 나비효과 ──
  const butterfly = (() => {
    const poor = days.filter(d => d.sleep != null && d.sleep <= 1);
    if (poor.length < 3) return null;
    const nexts = poor.map(d => nextOf(d.date)).filter(Boolean);
    if (nexts.length < 3) return null;
    const overRate = nexts.filter(n => n.overwork?.yes).length / nexts.length;
    const soreParts = {}; nexts.forEach(n => (n.soreness || []).forEach(s => { soreParts[s.part] = (soreParts[s.part] || 0) + 1; }));
    const topSore = topOf(soreParts);
    const tagCnt = {}; nexts.forEach(n => (n.tags || []).forEach(tg => { tagCnt[tg] = (tagCnt[tg] || 0) + 1; }));
    const topTags = Object.entries(tagCnt).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t);
    let message;
    if (topSore && overRate >= 0.4) message = `'뒤척였어요·밤을 새웠어요'로 기록한 다음 날엔 유독 오래 앉아 무리하고, ${PARTS[topSore.key] || topSore.key}이(가) 뻐근하다는 기록이 많았어요. 피곤할수록 자세가 쉽게 무너지나 봐요.`;
    else if (topTags.length) message = `수면의 질이 좋지 않았던 다음 날엔 어김없이 ${topTags.map(t => `#${t}`).join("과 ")} 태그를 찾으셨네요!`;
    else if (topSore) message = `잘 못 잔 다음 날엔 ${PARTS[topSore.key] || topSore.key} 불편함을 더 자주 느끼셨어요.`;
    else return null;
    return { poorN: poor.length, topSore: topSore ? (PARTS[topSore.key] || topSore.key) : null, topTags, overRate, message };
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
  const factcheck = (() => {
    const rows = [];
    const moveN = days.filter(d => d.exercise?.did === true).length;
    const freq = userData?.exercise_frequency;
    if (freq && moveN > 0) {
      const expect = { none: 0, sometimes: 4, weekly: 10, daily: 22 }[freq] ?? 8;
      if (moveN >= expect + 4) rows.push(`처음엔 운동을 '${ONB_FREQ_LABEL[freq]}' 하겠다고 하셨는데, 이번 달 실제로는 ${moveN}일이나 몸을 움직이셨네요! 엄청난 발전이에요.`);
      else rows.push(`이번 달엔 ${moveN}일 몸을 움직이셨어요. 처음 목표 '${ONB_FREQ_LABEL[freq]}'와 나란히 가고 있어요.`);
    }
    const loadC = {}; days.forEach(d => (d.overwork?.loads || []).forEach(l => { loadC[l] = (loadC[l] || 0) + 1; }));
    const tl = topOf(loadC);
    const posture = userData?.common_posture;
    if (tl && posture && ONB_POSTURE_LABEL[posture]) rows.push(`'${ONB_POSTURE_LABEL[posture]}'라고 하셨던 프로필처럼, 이번 달도 '${LOADS[tl.key] || tl.key}'으로 무리한 날이 가장 많았어요. 그 부담을 덜어주는 관리가 필요해요.`);
    const goals = userData?.exercise_goals || [];
    if (goals.includes("flexibility")) {
      const half = Math.floor(days.length / 2);
      const lv = (arr) => { const xs = arr.flatMap(d => (d.soreness || []).map(s => s.level)); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
      const a = lv(days.slice(0, half)), b = lv(days.slice(half));
      if (a != null && b != null && a - b >= 0.6) rows.push(`건강 목표가 '뻐근함 줄이기'였죠! 다행히 이번 달 후반부로 갈수록 불편함 강도가 평균 ${a.toFixed(1)}점에서 ${b.toFixed(1)}점으로 줄어들고 있어요.`);
    }
    return rows.length ? rows.slice(0, 2) : null;
  })();

  // ── 8. 코치의 편지 ──
  const letter = (() => {
    const nm = userData?.nickname || "회원";
    const soreC = {}; days.forEach(d => (d.soreness || []).forEach(s => { soreC[s.part] = (soreC[s.part] || 0) + 1; }));
    const ts = topOf(soreC); const topSore = ts ? (PARTS[ts.key] || ts.key) : null;
    const parts = [];
    parts.push(topSore ? `${nm}님, 이번 달도 뻐근한 ${topSore}을(를) 이끌고 정말 고생 많으셨어요.` : `${nm}님, 이번 달도 하루하루 성실히 기록해주셔서 고마워요.`);
    if (butterfly && butterfly.topSore) parts.push(`기록을 보니 유독 잠을 못 잔 다음 날 ${butterfly.topSore} 불편함을 많이 느끼셨네요. 척추 주변 근육은 잘 자는 동안 가장 많이 회복된다는 사실, 알고 계셨나요?`);
    else if (recovery && recovery.recovered) parts.push(`힘들었던 날에도 스스로를 잘 다독여 평균 ${recovery.avgDays || 2}일 만에 컨디션을 끌어올리셨어요. 그 회복력이 정말 멋져요.`);
    parts.push(`다음 달엔 자기 전 5분만 따뜻한 물로 몸을 데워보세요. 수면의 질이 오르면 뻐근함도 훨씬 줄어들 거예요. 다음 달의 ${nm}님도 곁에서 응원할게요!`);
    return { nickname: nm, body: parts.join(" ") };
  })();

  return { link, butterfly, effort, logged, recovery, streak, factcheck, letter, recordedDays: days.length };
}

// ── 인사이트 카드 공통 껍데기 ──
function InsCard({ badge, title, sub, children, bg }) {
  return (
    <div style={{ background: bg || C.card, borderRadius: 20, padding: "18px 18px 20px", boxShadow: CARD_SHADOW, border: "1px solid #F1EEE8" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: getTypeAccent().accentDeep, letterSpacing: "0.02em", marginBottom: 3 }}>{badge}</div>
      <div style={{ fontSize: 16.5, fontWeight: 800, color: C.ink, letterSpacing: "-0.01em" }}>{title}</div>
      {sub && <p style={{ fontSize: 12, color: C.sub, fontWeight: 600, margin: "3px 0 0" }}>{sub}</p>}
      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}
function Insight({ children }) {
  return <p style={{ fontSize: 13.5, color: "#3F3A31", fontWeight: 600, lineHeight: 1.62, margin: "14px 0 0", wordBreak: "keep-all" }}>{children}</p>;
}

function DiscoveryInsights({ report, entries, userData, nickname, bmtiCode }) {
  const ins = computeInsights(entries, userData, report);
  const isM = (bmtiCode ? bmtiCode.split("-")[0] : "").includes("M");
  if (ins.recordedDays < 3) {
    return <div style={{ textAlign: "center", padding: "40px 20px", color: C.sub, fontSize: 13.5, fontWeight: 600, lineHeight: 1.6 }}>아직 발견을 찾을 만큼 기록이 모이지 않았어요.<br />며칠 더 기록하면 이번 달의 이야기를 들려드릴게요.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {ins.link && <SlotCard link={ins.link} />}
      {ins.butterfly && <ButterflyCard data={ins.butterfly} />}
      {ins.recovery && <RecoveryCard data={ins.recovery} />}
      {ins.streak && <StreakCard data={ins.streak} />}
      {ins.effort && <EffortCard data={ins.effort} />}
      {ins.logged && <LampClockCard data={ins.logged} nickname={nickname} />}
      {ins.factcheck && <FactCheckCard rows={ins.factcheck} />}
      <LetterCard data={ins.letter} isM={isM} />
    </div>
  );
}

// 1. 기분 자판기(슬롯)
function SlotCard({ link }) {
  return (
    <InsCard badge="기분 연결고리" title="기분 자판기" sub="어떤 하루가 어떤 기분을 불러왔을까요?">
      <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
        {link.slots.map((s, i) => (
          <div key={i} style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <div style={{ height: 62, borderRadius: 12, background: "linear-gradient(180deg,#FFFDF6,#F4EFE2)", border: "1.5px solid #EAE2CF", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "4px 5px", boxShadow: "inset 0 6px 10px -8px rgba(0,0,0,0.2)", overflow: "hidden" }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: C.ink, lineHeight: 1.25, wordBreak: "keep-all", animation: `slotSpin .6s cubic-bezier(.2,.7,.3,1) ${i * 0.15}s both` }}>{s}</span>
            </div>
            {i < link.slots.length - 1 && <span style={{ position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 900, color: C.sub, zIndex: 1 }}>{i === link.slots.length - 2 ? "=" : "+"}</span>}
          </div>
        ))}
      </div>
      <Insight>{link.message}</Insight>
      <style>{`@keyframes slotSpin{0%{opacity:0;transform:translateY(-16px) scale(.9)}100%{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </InsCard>
  );
}

// 2. 밤낮 연결 고리
function ButterflyCard({ data }) {
  return (
    <InsCard badge="수면 나비효과" title="오늘의 잠 → 내일의 나">
      <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #ECE7DC" }}>
        <div style={{ background: "linear-gradient(180deg,#3A3560,#4A4372)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 17 }}>🌙</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>잘 못 잔 밤 {data.poorN}번</span>
        </div>
        <div style={{ height: 18, background: "repeating-linear-gradient(90deg,#D8CFBE 0 6px,transparent 6px 12px)", opacity: 0.6 }} />
        <div style={{ background: "linear-gradient(180deg,#FFF6E4,#FDEFD2)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 17 }}>🌤️</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#8A6A2E" }}>{data.topSore ? `다음 날 ${data.topSore} 뻐근` : (data.topTags[0] ? `다음 날 #${data.topTags[0]}` : "다음 날 컨디션 저하")}</span>
        </div>
      </div>
      <Insight>{data.message}</Insight>
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

// 7. 초심 저울(프로필 팩트체크)
function FactCheckCard({ rows }) {
  return (
    <InsCard badge="처음의 다짐 · 팩트 체크" title="프로필과 이어보기">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "#FBFAF6", borderRadius: 12, padding: "12px 13px" }}>
            <span style={{ fontSize: 15, marginTop: 1 }}>⚖️</span>
            <p style={{ fontSize: 12.5, color: "#3F3A31", fontWeight: 600, lineHeight: 1.55, margin: 0, wordBreak: "keep-all" }}>{r}</p>
          </div>
        ))}
      </div>
    </InsCard>
  );
}

// 8. 코치의 편지
function LetterCard({ data, isM }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "linear-gradient(180deg,#FFFDF7,#FBF4E6)", borderRadius: 20, padding: "20px 18px 22px", boxShadow: CARD_SHADOW, border: "1px solid #EEE4CE", position: "relative", overflow: "hidden" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: getTypeAccent().accentDeep, letterSpacing: "0.02em", marginBottom: 3 }}>이번 달의 피날레</div>
      <div style={{ fontSize: 16.5, fontWeight: 800, color: C.ink }}>BMTI 코치의 편지</div>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{ margin: "16px auto 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, border: "none", background: "transparent", cursor: "pointer", width: "100%" }}>
          <span style={{ width: 56, height: 56, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%,#E0685E,#C0433B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 3px 10px rgba(160,50,40,0.4)", animation: "sealBob 2s ease-in-out infinite" }}>✉️</span>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: getTypeAccent().accentDeep }}>봉투를 열어 편지 확인하기</span>
        </button>
      ) : (
        <div style={{ marginTop: 14, animation: "letterOpen .4s ease-out" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "16px 15px", border: "1px dashed #E3D6B4", lineHeight: 1.7, fontSize: 13.5, color: "#3F3A31", fontWeight: 600, wordBreak: "keep-all" }}>
            {data.body}
          </div>
          <div style={{ textAlign: "right", fontSize: 12, fontWeight: 800, color: getTypeAccent().accentDeep, marginTop: 10 }}>— 당신의 BMTI 코치 드림</div>
        </div>
      )}
      <style>{`@keyframes sealBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes letterOpen{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
