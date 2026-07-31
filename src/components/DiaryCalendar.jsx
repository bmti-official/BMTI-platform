import { useState, useRef, useLayoutEffect } from "react";
import { Mallang } from "./Mallang";
import MallangStressPopup from "./MallangStressPopup";
import { DiaryIcon } from "./DiaryIcons";
import DiaryHelpPopup from "./DiaryHelpPopup";
import KakaoSavePromptPopup from "./KakaoSavePromptPopup";
import FeedbackModal from "./FeedbackModal";
import { MOODS, CHARACTERS } from "../data";
import {
  getDiaryHistory, getEntryForDate, todayISO, saveDiaryEntry,
  isDayWritable, isEntryLocked,
} from "../lib/diaryHistory";
import { KEY_TO_PART_LABEL, KEY_TO_EXERCISE_TYPE_LABEL, REASON_TO_EXERCISE_LABEL, SLEEP_LABELS, SLEEP_ICON } from "../lib/diaryEntryLabels";
import { getTypeAccent, GOLD, YELLOW, YELLOW_LINE } from "../lib/typeAccent";

// 색상 통일: 핵심 버튼 골드 / 박스 연옐로우 / 강조 요소는 유형별(M 연분홍·Z 연보라).
// 단, 기분(말랑이)·요일 색 등 '데이터 색'은 의미가 있어 그대로 둔다.
const C = {
  bg: "#FFFFFF", card: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2",
  gold: GOLD, yellow: YELLOW, yellowLine: YELLOW_LINE,
};
const SAT_BLUE = "#2F6FE0";
const SUN_RED = "#E0554F";
const MIN_YEAR = 2026;
const MIN_MONTH = 7; // 2026년 7월 이전은 선택 불가

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n) => String(n).padStart(2, "0");
const weekdayColor = (dow) => (dow === 0 ? SUN_RED : dow === 6 ? SAT_BLUE : null);

// 오늘에 해당하는 달/주만 좌우 전체를 덮는 연한 옐로우, 나머지는 흰색.
const YELLOW_BG = "#FFFBEA";
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const startOfWeek = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x; };
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const addWeeks = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n * 7); return x; };
const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const MONTH_MIN_DATE = new Date(MIN_YEAR, MIN_MONTH - 1, 1);

// M유형 — 따뜻하고 다정한 응원 문구
const RECORD_MSG_M = [
  "", "첫걸음을 응원해요.", "오늘도 잊지 않았군요!", "내 마음 돌보기 3일 차.", "차곡차곡 쌓이는 하루.",
  "조금씩 쌓이는 내 모습.", "나의 내면과 친해져요.", "일주일 달성! 멋져요.", "새로운 주도 활기차게!", "매일 더 나아지고 있어요.",
  "꾸준한 모습이 예뻐요.", "오늘도 수고 많았어요.", "당신의 하루를 응원해요.", "좋은 습관이 생겼네요.", "벌써 2주! 수고했어요.",
  "절반을 넘어섰네요!", "스스로를 안아주세요.", "반환점을 돌아 순항 중!", "내 마음의 소리에 집중.", "나를 알아가는 즐거움.",
  "20일의 기적, 대단해요.", "매일의 당신이 빛나요.", "습관이 자리 잡았어요.", "오늘도 다정한 하루.", "흔들림 없는 발걸음.",
  "거의 다 왔어요. 화이팅!", "나를 위한 최고의 선물.", "끝까지 응원할게요!", "한 달이 코앞이에요!", "조금만 더 힘을 내요.",
  "찬란한 한 달의 완성.", "수고한 나를 토닥여요.",
];

// Z유형 — 담백하고 냉철한 동기부여 문구
const RECORD_MSG_Z = [
  "", "작심삼일은 넘겨봅시다.", "아직 갈 길이 멉니다.", "작심삼일 고비 넘기기.", "페이스 유지하세요.",
  "아직 초반입니다. 집중.", "루틴이 되어갑니다.", "겨우 일주일, 더 가야죠.", "흐름 끊기지 않게 주의.", "데이터가 쌓이고 있어요.",
  "이제야 두 자릿수 진입.", "꾸준함도 실력입니다.", "나태해지지 마세요.", "목표에 집중할 시간.", "절반 왔네요. 킵고잉.",
  "딱 절반 지났습니다.", "후반전 시작입니다.", "절반 넘김. 흐름 유지.", "기록은 배신하지 않죠.", "확실한 패턴 분석 가능.",
  "20일 달성. 계속 진행.", "데이터 확보. 페이스 유지.", "완주가 눈앞입니다.", "변수 통제 잘하세요.", "무리 없이 달성 중.",
  "고지가 눈앞. 긴장 유지.", "막판까지 집중하세요.", "유종의 미를 거둡시다.", "막판 스퍼트 올리세요.", "단 며칠 남았습니다.",
  "사실상 목표 달성.", "완주 성공. 다음 달 준비.",
];

function getRecordMessage(count, isM) {
  if (count <= 0) return "";
  const msgs = isM ? RECORD_MSG_M : RECORD_MSG_Z;
  const idx = Math.min(count, msgs.length - 1);
  return `총 ${count}일 기록했어요. ${msgs[idx]}`;
}

export default function DiaryCalendar({ onPickMood, onEditDay, bmtiCode, isLoggedIn, onRequireLogin }) {
  const [view, setView] = useState("month"); // "month" | "week"
  const [showHelp, setShowHelp] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const t = getTypeAccent(bmtiCode);
  const axisCode = bmtiCode ? bmtiCode.split("-")[0] : "";
  const charImage = CHARACTERS.find(c => c.id === axisCode)?.image;
  const isM = axisCode.includes("M");
  const moodQuestionTitle = isM ? "오늘 기분, 어떤 말랑이예요?" : "오늘의 기분을 선택하세요";
  const moodQuestionSub = isM ? "정답은 없어요. 지금 느낌그대로면 돼요" : "기록이 쌓이면 주간 패턴을 찾아드립니다";
  const moodPickedMessage = isM ? "오늘은 그랬군요. 기억해둘게요" : "기록을 완료했습니다";
  const todayStr = todayISO();
  const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const history = getDiaryHistory();

  // ── 무한 스크롤: 앞뒤 여러 달/주를 이어 렌더하고, 끝에 가까워지면 조금 로딩 후 더 불러온다 ──
  const monthMax = addMonths(startOfMonth(today), 12);
  const weekMin = startOfWeek(MONTH_MIN_DATE);
  const weekMax = addWeeks(startOfWeek(today), 12);
  const [months, setMonths] = useState(() => { const cur = startOfMonth(today); return [addMonths(cur, -1), cur, addMonths(cur, 1)].filter(d => d >= MONTH_MIN_DATE && d <= monthMax); });
  const [weeks, setWeeks] = useState(() => { const cur = startOfWeek(today); return [addWeeks(cur, -1), cur, addWeeks(cur, 1)].filter(d => d >= weekMin && d <= weekMax); });
  const [loading, setLoading] = useState(null); // 'top' | 'bottom' | null

  const scrollRef = useRef(null);
  const loadingRef = useRef(false);
  const prevHeightRef = useRef(0);
  const topLoadRef = useRef(false);

  // 위로 더 불러오면 스크롤 위치를 보정해 튐 없이 이어지게 한다.
  useLayoutEffect(() => {
    const el = scrollRef.current; if (!el) return;
    if (topLoadRef.current) { el.scrollTop += el.scrollHeight - prevHeightRef.current; topLoadRef.current = false; }
  }, [months, weeks]);

  // 뷰 전환/첫 진입 시 '오늘' 기간으로 스크롤을 맞춘다.
  useLayoutEffect(() => {
    const el = scrollRef.current; if (!el) return;
    const cur = el.querySelector('[data-current="true"]');
    if (cur) el.scrollTop = Math.max(0, cur.offsetTop - 100);
  }, [view]);

  const list = view === "month" ? months : weeks;
  const minEdge = view === "month" ? MONTH_MIN_DATE : weekMin;
  const maxEdge = view === "month" ? monthMax : weekMax;
  const canTop = list[0] > minEdge;
  const canBottom = list[list.length - 1] < maxEdge;

  const loadMore = (dir) => {
    if (loadingRef.current) return;
    if (dir === "top" && !canTop) return;
    if (dir === "bottom" && !canBottom) return;
    loadingRef.current = true; setLoading(dir);
    if (dir === "top") { prevHeightRef.current = scrollRef.current.scrollHeight; topLoadRef.current = true; }
    setTimeout(() => {
      if (view === "month") setMonths(p => dir === "top" ? [addMonths(p[0], -1), ...p] : [...p, addMonths(p[p.length - 1], 1)]);
      else setWeeks(p => dir === "top" ? [addWeeks(p[0], -1), ...p] : [...p, addWeeks(p[p.length - 1], 1)]);
      setLoading(null); loadingRef.current = false;
    }, 380);
  };
  const onScroll = () => {
    const el = scrollRef.current; if (!el || loadingRef.current) return;
    if (el.scrollTop < 160) loadMore("top");
    else if (el.scrollTop + el.clientHeight > el.scrollHeight - 160) loadMore("bottom");
  };

  // 오늘 기분 팝업 — 오늘 기록이 없으면 탭에 들어오자마자 자동으로 뜬다.
  const [showMoodPopup, setShowMoodPopup] = useState(() => !getEntryForDate(todayISO()));
  const [poppedMood, setPoppedMood] = useState(null);
  const [showStressPopup, setShowStressPopup] = useState(false);
  const [stressMood, setStressMood] = useState(null);
  const [showKakaoPrompt, setShowKakaoPrompt] = useState(false);
  const [previewDay, setPreviewDay] = useState(null); // { dateStr, entry }

  const quickSaveMood = () => { saveDiaryEntry(todayStr, poppedMood); setStressMood(poppedMood); setShowMoodPopup(false); setPoppedMood(null); setShowStressPopup(true); };
  const continueToFullForm = () => { setShowMoodPopup(false); const v = poppedMood; setPoppedMood(null); onPickMood && onPickMood(v); };

  // 그날 기록 요약 — 저장된 key를 다시 사람이 읽을 라벨로 되돌린다.
  const buildEntrySummary = (entry) => {
    const items = [];
    if (entry.sleep != null) items.push({ icon: SLEEP_ICON[entry.sleep], text: SLEEP_LABELS[entry.sleep] });
    if (entry.overwork?.yes) items.push({ icon: "warn", text: "평소보다 무리했어요" });
    if (entry.exercise?.did === true) { const types = (entry.exercise.types || []).map(x => KEY_TO_EXERCISE_TYPE_LABEL[x] || x).join(", "); items.push({ icon: "walk", text: `운동: ${types}` }); }
    else if (entry.exercise?.did === false) items.push({ icon: "sofa", text: `운동 안 함 · ${REASON_TO_EXERCISE_LABEL[entry.exercise.reason] || entry.exercise.reason}` });
    if (entry.soreness?.length) { const parts = entry.soreness.map(s => (s.part === "etc" && s.partOther ? s.partOther : (KEY_TO_PART_LABEL[s.part] || s.part))).join(", "); items.push({ icon: "bandage", text: `불편함: ${parts}` }); }
    if (entry.note?.text) items.push({ icon: "editPencil", text: entry.note.text });
    return items;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#FFFFFF", fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>

      {/* '?' / 월·주 전환 버튼은 '오늘' 달·주 카드 안 좌우에 붙어(sticky) 그 기간이 보이는 동안 고정된다.
         (아래 MonthSection·WeekSection의 CalControls 참고) */}

      {/* 떠 있는 상·하단 네비 버튼 높이에 맞춘 위/아래 블러 페이드 */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 64, background: "linear-gradient(#FFFFFF, rgba(255,255,255,0))", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", zIndex: 34, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(rgba(255,255,255,0), #FFFFFF)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", zIndex: 34, pointerEvents: "none" }} />

      {/* 스크롤 영역 — 앞뒤 달/주가 이어져 있고, 위/아래로 넘기면 과거·미래가 나온다 */}
      <div ref={scrollRef} onScroll={onScroll} data-scroll-top style={{ position: "absolute", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ paddingTop: 84, paddingBottom: 96 }}>
          {loading === "top" && <CalLoader />}
          {view === "month"
            ? months.map(m => (
                <MonthSection key={toISO(m)} monthDate={m} isCurrent={sameMonth(m, today)} todayStr={todayStr} today={today} history={history} t={t} isM={isM} onDayPreview={setPreviewDay} onEditDay={onEditDay}
                  onToday={() => setShowMoodPopup(true)} calView={view} onHelp={() => setShowHelp(true)} onToggleView={() => setView(view === "month" ? "week" : "month")} onFeedback={() => setShowFeedback(true)} />
              ))
            : weeks.map(w => (
                <WeekSection key={toISO(w)} weekStart={w} isCurrent={w.getTime() === startOfWeek(today).getTime()} todayStr={todayStr} today={today} history={history} t={t} isM={isM} buildEntrySummary={buildEntrySummary} onEditDay={onEditDay}
                  calView={view} onHelp={() => setShowHelp(true)} onToggleView={() => setView(view === "month" ? "week" : "month")} onFeedback={() => setShowFeedback(true)} />
              ))}
          {loading === "bottom" && <CalLoader />}
        </div>
      </div>

      {showHelp && (
        <DiaryHelpPopup onClose={() => setShowHelp(false)} isLoggedIn={isLoggedIn} onRequireLogin={onRequireLogin} />
      )}

      {showFeedback && (
        <FeedbackModal source="diary" userId={(() => { try { return JSON.parse(localStorage.getItem("bmti_user") || "null")?.id || null; } catch { return null; } })()} onClose={() => setShowFeedback(false)} />
      )}

      {showMoodPopup && (
        <>
          {/* 배경은 하단 네비 바까지 포함해서 전부 톤다운하되, 캐릭터가 떠 있는 자리만 원형으로 뚫는다. */}
          <div
            onClick={() => { setShowMoodPopup(false); setPoppedMood(null); }}
            style={{
              position: "fixed", inset: 0, zIndex: 55, background: "rgba(28,26,23,0.4)",
              WebkitMaskImage: "radial-gradient(circle 42px at 50% calc(100% - 58px), transparent 98%, black 100%)",
              maskImage: "radial-gradient(circle 42px at 50% calc(100% - 58px), transparent 98%, black 100%)",
            }}
          />
          <div style={{ position: "fixed", left: "50%", bottom: 108, transform: "translateX(-50%)", width: "calc(100% - 48px)", maxWidth: 340, zIndex: 60 }}>
            <div style={{ background: "#fff", borderRadius: 22, padding: "18px 20px 20px", position: "relative", boxShadow: "0 10px 34px rgba(0,0,0,0.16)", animation: "diaryPopupUp .28s cubic-bezier(.22,.9,.32,1)" }}>
              <button
                onClick={() => { setShowMoodPopup(false); setPoppedMood(null); }}
                style={{ position: "absolute", top: 10, right: 12, width: 26, height: 26, border: "none", background: "transparent", color: C.sub, fontSize: 15, cursor: "pointer" }}
              >
                ✕
              </button>

              {poppedMood === null ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, textAlign: "center", margin: "2px 0 4px", lineHeight: 1.4 }}>{moodQuestionTitle}</div>
                  <div style={{ fontSize: 12.5, color: C.sub, textAlign: "center", fontWeight: 600, marginBottom: 18 }}>{moodQuestionSub}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    {MOODS.map(m => (
                      <button key={m.v} onClick={() => setPoppedMood(m.v)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                        padding: "6px 2px", borderRadius: 14, border: "none", background: "transparent", cursor: "pointer" }}>
                        <Mallang v={m.v} size={40} />
                        <span style={{ fontSize: 9.5, color: C.sub, fontWeight: 700, whiteSpace: "nowrap" }}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", paddingTop: 2 }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Mallang v={poppedMood} size={58} /></div>
                  <div style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 18 }}>{moodPickedMessage}</div>
                  <button onClick={continueToFullForm} style={{ width: "100%", padding: 15, borderRadius: 15, border: "none", background: C.gold, color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer", marginBottom: 8, boxShadow: "0 4px 14px rgba(201,151,90,0.28)" }}>
                    네, 조금 더 기록할게요
                  </button>
                  <button onClick={quickSaveMood} style={{ width: "100%", padding: 12, borderRadius: 15, border: "none", background: "transparent", color: C.sub, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                    오늘은 여기까지 할게요
                  </button>
                </div>
              )}

              <div style={{ position: "absolute", left: "50%", bottom: -8, transform: "translateX(-50%) rotate(45deg)", width: 16, height: 16, background: "#fff" }} />
            </div>
          </div>
          <style>{`@keyframes diaryPopupUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </>
      )}

      {showStressPopup && (
        <MallangStressPopup mood={stressMood} charImage={charImage} onNext={() => { setShowStressPopup(false); if (!isLoggedIn) setShowKakaoPrompt(true); }} />
      )}

      {showKakaoPrompt && (
        <KakaoSavePromptPopup onLogin={() => { setShowKakaoPrompt(false); onRequireLogin && onRequireLogin(); }} onClose={() => setShowKakaoPrompt(false)} />
      )}

      {previewDay && (() => {
        const items = buildEntrySummary(previewDay.entry);
        const moodInfo = MOODS.find(m => m.v === previewDay.entry.mood);
        return (
          <div onClick={() => setPreviewDay(null)} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(28,26,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 340, background: "#fff", borderRadius: 24, padding: "18px 20px 22px", position: "relative" }}>
              <button
                onClick={() => setPreviewDay(null)}
                aria-label="닫기"
                style={{ position: "absolute", top: 12, right: 14, border: "none", background: "transparent", color: C.sub, fontSize: 16, cursor: "pointer", padding: 4 }}
              >
                ✕
              </button>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, marginBottom: 18 }}>
                <Mallang v={previewDay.entry.mood} size={60} />
                <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 700, marginTop: 10 }}>
                  {previewDay.dateStr.slice(5, 7)}월 {previewDay.dateStr.slice(8, 10)}일
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{moodInfo?.label}</div>
              </div>

              {items.length > 0 ? (
                <div style={{ background: C.yellow, border: `1px solid ${C.yellowLine}`, borderRadius: 16, padding: "2px 14px", marginBottom: 22 }}>
                  {items.map((it, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i > 0 ? `1px solid ${C.yellowLine}` : "none" }}>
                      <div style={{ flexShrink: 0, display: "flex" }}><DiaryIcon name={it.icon} size={22} /></div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, lineHeight: 1.45, flex: 1, textAlign: "left" }}>{it.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: "center", fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 22 }}>기분만 짧게 남겨둔 날이에요.</p>
              )}

              <button
                onClick={() => { onEditDay && onEditDay(previewDay.dateStr, previewDay.entry); setPreviewDay(null); }}
                style={{ width: "100%", padding: 15, borderRadius: 15, border: "none", background: C.gold, color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer", marginBottom: 6, boxShadow: "0 4px 14px rgba(201,151,90,0.28)" }}
              >
                이 기록 수정할래요
              </button>
              <button
                onClick={() => setPreviewDay(null)}
                style={{ width: "100%", padding: 12, borderRadius: 15, border: "none", background: "transparent", color: C.sub, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
              >
                괜찮아요, 그냥 볼게요
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// 무한 스크롤 로딩 표시
function CalLoader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2.5px solid #EDE9E2", borderTopColor: GOLD, animation: "calspin .7s linear infinite" }} />
      <style>{`@keyframes calspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// 월간/주간 전환 아이콘
const IconWeek = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="7.2" cy="9.2" r="1.15" fill="currentColor" /><path d="M10 9.2h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="7.2" cy="13" r="1.15" fill="currentColor" /><path d="M10 13h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="7.2" cy="16.8" r="1.15" fill="currentColor" /><path d="M10 16.8h5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const IconMonth = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3.5 9.5h17M9.2 9.5v10M14.8 9.5v10" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// ── 월간 섹션 — 오늘의 달만 좌우 전체 노랑, 나머진 흰색 ──
// '오늘' 달·주 카드 안 좌우에 붙는 '?'/전환 버튼 — 그 기간이 화면에 보이는 동안 상단에 고정(sticky).
function CalControls({ calView, onHelp, onToggleView, t }) {
  const btn = { pointerEvents: "auto", width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", boxShadow: "0 2px 10px rgba(0,0,0,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
  return (
    <div style={{ position: "sticky", top: 70, zIndex: 36, height: 0, pointerEvents: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={onHelp} aria-label="말랑 다이어리 도움말" style={{ ...btn, color: C.sub, fontSize: 15, fontWeight: 800 }}>?</button>
        <button onClick={onToggleView} aria-label={calView === "month" ? "주간 캘린더 보기" : "월간 캘린더 보기"} style={{ ...btn, color: t.accentDeep }}>
          {calView === "month" ? <IconWeek /> : <IconMonth />}
        </button>
      </div>
    </div>
  );
}

// 현재(오늘) 달·주 카드의 연옐로우 배경 — 위아래 끝부분만 흰색으로 살짝 페이드.
const CUR_BG = `linear-gradient(180deg, #FFFFFF 0px, ${YELLOW_BG} 22px, ${YELLOW_BG} calc(100% - 22px), #FFFFFF 100%)`;
function MonthSection({ monthDate, isCurrent, todayStr, today, history, t, isM, onDayPreview, onEditDay, onToday, calView, onHelp, onToggleView, onFeedback }) {
  const year = monthDate.getFullYear(), month = monthDate.getMonth();
  const monthKey = `${year}-${pad(month + 1)}`;
  const count = history.filter(e => e.date.startsWith(monthKey)).length;
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  return (
    <div data-current={isCurrent ? "true" : undefined} style={{ background: isCurrent ? CUR_BG : "#fff", width: "100%" }}>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "26px 18px 32px", position: "relative" }}>
        {isCurrent && <CalControls calView={calView} onHelp={onHelp} onToggleView={onToggleView} t={t} />}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", color: C.ink }}>{year}년 {month + 1}월</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: "7px 0 0" }}>{count > 0 ? getRecordMessage(count, isM) : "아직 기록이 없어요"}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: weekdayColor(i) || C.sub, padding: "6px 0" }}>{w}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 26 }}>
          {cells.map((d, idx) => {
            if (!d) return <div key={idx} />;
            const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
            const entry = getEntryForDate(dateStr);
            const isToday = dateStr === todayStr;
            const dow = idx % 7;
            const writable = isDayWritable(dateStr);
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {entry && !isEntryLocked(dateStr) ? (
                  <button onClick={() => onDayPreview({ dateStr, entry })} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, border: "none", background: "transparent", cursor: "pointer", padding: 2 }}>
                    <Mallang v={entry.mood} size={30} />
                  </button>
                ) : entry ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: 2 }}>
                    <Mallang v={entry.mood} size={30} />
                  </div>
                ) : isToday ? (
                  <button onClick={() => onToday && onToday()} aria-label="오늘 기록하기"
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: weekdayColor(dow) || C.ink }}>{d}</div>
                    <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.04em", color: t.accentDeep }}>today</span>
                  </button>
                ) : writable ? (
                  <button onClick={() => onEditDay && onEditDay(dateStr, null)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${t.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: weekdayColor(dow) || C.ink }}>{d}</div>
                  </button>
                ) : (
                  <span style={{ fontSize: 15, color: weekdayColor(dow) || "#C9C4BB", fontWeight: 500 }}>{d}</span>
                )}
              </div>
            );
          })}
        </div>
        {isCurrent && onFeedback && (
          <button onClick={onFeedback}
            style={{ display: "block", margin: "22px auto 0", border: "none", background: "transparent", color: C.sub, fontSize: 12.5, fontWeight: 700, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
            💬 다이어리의 개선 의견 보내기
          </button>
        )}
      </div>
    </div>
  );
}

// ── 주간 섹션 — 오늘의 주만 좌우 전체 노랑, 나머진 흰색 ──
function WeekSection({ weekStart, isCurrent, todayStr, today, history, t, isM, buildEntrySummary, onEditDay, calView, onHelp, onToggleView, onFeedback }) {
  const days = Array.from({ length: 7 }, (_, i) => { const x = new Date(weekStart); x.setDate(x.getDate() + i); return x; });
  const end = days[6];
  const title = weekStart.getMonth() === end.getMonth()
    ? `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 – ${end.getDate()}일`
    : `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 – ${end.getMonth() + 1}월 ${end.getDate()}일`;
  const count = days.filter(d => history.some(e => e.date === toISO(d))).length;
  return (
    <div data-current={isCurrent ? "true" : undefined} style={{ background: isCurrent ? CUR_BG : "#fff", width: "100%" }}>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "26px 18px 30px", position: "relative" }}>
        {isCurrent && <CalControls calView={calView} onHelp={onHelp} onToggleView={onToggleView} t={t} />}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <h1 style={{ fontSize: 21, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", color: C.ink }}>{title}</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: "7px 0 0" }}>{count > 0 ? getRecordMessage(count, isM) : "아직 기록이 없어요"}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {days.map((d, i) => {
            const dateStr = toISO(d);
            const entry = getEntryForDate(dateStr);
            const locked = isEntryLocked(dateStr);
            const writable = isDayWritable(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <WeekDayRow
                key={i} date={d} dow={d.getDay()} entry={entry} isToday={isToday} today={today}
                writable={writable} locked={locked} items={entry ? buildEntrySummary(entry) : []} t={t}
                onEdit={() => onEditDay && onEditDay(dateStr, entry || null)}
              />
            );
          })}
        </div>
        {isCurrent && onFeedback && (
          <button onClick={onFeedback}
            style={{ display: "block", margin: "22px auto 0", border: "none", background: "transparent", color: C.sub, fontSize: 12.5, fontWeight: 700, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
            💬 다이어리의 개선 의견 보내기
          </button>
        )}
      </div>
    </div>
  );
}

// ── 주간 하루 카드 (아코디언) — 클릭하면 그날 선택 기록들이 펼쳐진다 ──
function WeekDayRow({ date, dow, entry, isToday, today, writable, locked, items, t, onEdit }) {
  const [open, setOpen] = useState(false);
  const future = date > today;
  const dayColor = weekdayColor(dow) || C.ink;
  const moodLabel = entry ? (MOODS.find(m => m.v === entry.mood)?.label) : null;
  const hasDetails = !!entry && items.length > 0;
  const onHeaderClick = () => {
    if (hasDetails) setOpen(o => !o);
    else if ((entry && !locked) || (!entry && writable)) onEdit();
  };
  const interactive = hasDetails || (entry && !locked) || (!entry && writable);
  return (
    <div style={{ borderRadius: 16, border: `1px solid ${isToday ? t.accent : C.line}`, background: isToday ? t.accentSoft : "#fff", opacity: future ? 0.55 : 1, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div onClick={interactive ? onHeaderClick : undefined}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: interactive ? "pointer" : "default", minHeight: 62 }}>
        {/* 날짜 */}
        <div style={{ width: 34, flexShrink: 0, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: weekdayColor(dow) || C.sub }}>{WEEKDAYS[dow]}</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: dayColor, marginTop: 1 }}>{date.getDate()}</div>
        </div>
        {/* 무드 */}
        <div style={{ width: 40, flexShrink: 0, display: "flex", justifyContent: "center" }}>
          {entry ? <Mallang v={entry.mood} size={28} /> : <div style={{ width: 34, height: 34, borderRadius: "50%", border: `1.5px dashed ${C.line}` }} />}
        </div>
        {/* 요약(접힘) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {entry ? (
            <>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>{moodLabel}</div>
              <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, marginTop: 3 }}>{hasDetails ? `기록 ${items.length}가지 · 눌러서 보기` : "기분만 짧게 남긴 날이에요"}</div>
            </>
          ) : (
            <div style={{ fontSize: 12.5, color: writable ? t.accentDeep : C.sub, fontWeight: 700 }}>
              {future ? "아직 다가오지 않은 날" : writable ? "아직 기록이 없어요 · 눌러서 남겨요" : "기록 없음"}
            </div>
          )}
        </div>
        {/* 펼침 화살표 */}
        {hasDetails && <span style={{ flexShrink: 0, fontSize: 12, color: C.sub, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>}
      </div>

      {/* 아코디언 바디 */}
      {hasDetails && (
        <div style={{ maxHeight: open ? 600 : 0, overflow: "hidden", transition: "max-height .3s ease" }}>
          <div style={{ padding: "2px 14px 14px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {items.map((it, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#FBFAF6", border: `1px solid ${C.line}`, borderRadius: 9, padding: "6px 10px", maxWidth: "100%" }}>
                  <span style={{ display: "flex", flexShrink: 0 }}><DiaryIcon name={it.icon} size={14} /></span>
                  <span style={{ fontSize: 12, color: C.ink, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.text}</span>
                </span>
              ))}
            </div>
            {!locked && (
              <button onClick={onEdit} style={{ marginTop: 10, border: "none", background: "transparent", color: t.accentDeep, fontSize: 12, fontWeight: 800, cursor: "pointer", padding: "2px 0" }}>수정하기 ›</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
