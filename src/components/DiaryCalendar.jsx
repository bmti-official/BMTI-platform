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
import { KEY_TO_PART_LABEL, KEY_TO_EXERCISE_TYPE_LABEL, REASON_TO_EXERCISE_LABEL, SLEEP_LABELS, SLEEP_ICON, TAG_LABEL_TO_ICON } from "../lib/diaryEntryLabels";
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
  const nickname = (() => { try { return JSON.parse(localStorage.getItem("bmti_user") || "null")?.nickname || null; } catch { return null; } })();
  const moodQuestionTitle = nickname ? `${nickname} 님, 오늘 기분은 어떠신가요?` : "오늘 기분은 어떠신가요?";
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
  // 현재 달/주 카드 기준으로 위/아래 어디에 있는지 → 떠 있는 '현재로 이동' 버튼 방향
  const [curBtn, setCurBtn] = useState(null); // 'up' | 'down' | null

  const restTopOfCurrent = () => {
    const el = scrollRef.current; if (!el) return null;
    const cur = el.querySelector('[data-current="true"]');
    return cur ? Math.max(0, cur.offsetTop - 100) : null;
  };
  const updateCurBtn = () => {
    const el = scrollRef.current; if (!el) return;
    const rest = restTopOfCurrent();
    if (rest == null) { setCurBtn(null); return; }
    const delta = el.scrollTop - rest;
    if (delta > 140) setCurBtn('up');        // 현재보다 아래(미래)에 있음 → 위로 올라가 현재로
    else if (delta < -140) setCurBtn('down'); // 현재보다 위(과거)에 있음 → 아래로 내려가 현재로
    else setCurBtn(null);
  };
  const goCurrent = () => {
    const el = scrollRef.current; const rest = restTopOfCurrent();
    if (!el || rest == null) return;
    try { el.scrollTo({ top: rest, behavior: 'smooth' }); } catch { el.scrollTop = rest; }
  };

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
    setCurBtn(null);
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
    const el = scrollRef.current; if (!el) return;
    updateCurBtn();
    if (loadingRef.current) return;
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
  const [futureToast, setFutureToast] = useState(false); // 미래 날짜를 눌렀을 때 2초 안내
  const futureTimer = useRef(null);
  const showFutureToast = () => {
    setFutureToast(true);
    clearTimeout(futureTimer.current);
    futureTimer.current = setTimeout(() => setFutureToast(false), 2000);
  };

  const quickSaveMood = () => { saveDiaryEntry(todayStr, poppedMood); setStressMood(poppedMood); setShowMoodPopup(false); setPoppedMood(null); setShowStressPopup(true); };
  // 기분을 고르고 '네, 조금 더 기록할게요'를 누르면, 상세 입력을 완료하지 않고 나가더라도
  // 최소한 오늘의 기분(말랑이)은 남도록 먼저 저장해둔다. (상세 완료 시 같은 날짜로 덮어써짐)
  const continueToFullForm = () => { saveDiaryEntry(todayStr, poppedMood); setShowMoodPopup(false); const v = poppedMood; setPoppedMood(null); onPickMood && onPickMood(v); };

  // 그날 기록 요약 — 저장된 key를 다시 사람이 읽을 라벨로 되돌린다.
  const buildEntrySummary = (entry) => {
    const items = [];
    if (entry.sleep != null) items.push({ icon: SLEEP_ICON[entry.sleep], text: `어제 잠은 '${SLEEP_LABELS[entry.sleep]}'` });
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
                  onToday={() => setShowMoodPopup(true)} onFuture={showFutureToast} calView={view} onHelp={() => setShowHelp(true)} onToggleView={() => setView(view === "month" ? "week" : "month")} onFeedback={() => setShowFeedback(true)} />
              ))
            : weeks.map(w => (
                <WeekSection key={toISO(w)} weekStart={w} isCurrent={w.getTime() === startOfWeek(today).getTime()} todayStr={todayStr} today={today} history={history} t={t} isM={isM} buildEntrySummary={buildEntrySummary} onEditDay={onEditDay}
                  calView={view} onHelp={() => setShowHelp(true)} onToggleView={() => setView(view === "month" ? "week" : "month")} onFeedback={() => setShowFeedback(true)} />
              ))}
          {loading === "bottom" && <CalLoader />}
        </div>
      </div>

      {/* '현재 달/주로 이동' 떠 있는 버튼 — 현재보다 아래면 '맨 위로', 위면 '맨 아래로' */}
      {curBtn && (
        <button onClick={goCurrent} aria-label={curBtn === 'up' ? '현재 달로 올라가기' : '현재 달로 내려가기'}
          style={{ position: "fixed", right: 12, bottom: 100, zIndex: 40, width: 44, height: 44, borderRadius: "50%", border: "1px solid #EDE9E2", background: "rgba(255,255,255,0.96)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", boxShadow: "0 3px 12px rgba(0,0,0,0.16)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ transform: curBtn === 'down' ? 'rotate(180deg)' : 'none' }}>
            <path d="M12 19V7M6 13l6-6 6 6" stroke="#6B6459" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {showHelp && (
        <DiaryHelpPopup onClose={() => setShowHelp(false)} isLoggedIn={isLoggedIn} onRequireLogin={onRequireLogin} />
      )}

      {showFeedback && (
        <FeedbackModal source="diary" userId={(() => { try { return JSON.parse(localStorage.getItem("bmti_user") || "null")?.id || null; } catch { return null; } })()} onClose={() => setShowFeedback(false)} />
      )}

      {showMoodPopup && (
        <>
          {/* 배경 — 캐릭터 스포트라이트/글로우 없이, 뒤의 캘린더가 약하게 블러 처리되어 비치게 한다. */}
          <div
            onClick={() => { setShowMoodPopup(false); setPoppedMood(null); }}
            style={{
              position: "fixed", inset: 0, zIndex: 55, background: "rgba(255,255,255,0.22)",
              backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)",
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
                  <div style={{ fontSize: 12.5, color: "#9585D0", textAlign: "center", fontWeight: 700, marginBottom: 18 }}>{moodQuestionSub}</div>
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
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 340, background: C.yellow, border: `1px solid ${C.yellowLine}`, borderRadius: 24, position: "relative", maxHeight: "85vh", overflow: "hidden" }}>
              {/* 우측 상단 X — 카드에 고정(스크롤돼도 항상 보임) */}
              <button
                onClick={() => setPreviewDay(null)}
                aria-label="닫기"
                style={{ position: "absolute", top: 10, right: 10, zIndex: 2, width: 30, height: 30, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.9)", color: C.sub, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
              >
                ✕
              </button>

              {/* 스크롤 영역 — 내용이 길어도 팝업 높이를 넘지 않게 */}
              <div style={{ maxHeight: "85vh", overflowY: "auto", padding: "18px 20px 22px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, marginBottom: 18 }}>
                <Mallang v={previewDay.entry.mood} size={60} />
                <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 700, marginTop: 10 }}>
                  {previewDay.dateStr.slice(5, 7)}월 {previewDay.dateStr.slice(8, 10)}일
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{moodInfo?.label}</div>
              </div>

              {/* 오늘의 태그 — 아이콘으로 미리보기 */}
              {(() => {
                const tags = (previewDay.entry.tags || []).filter(tg => TAG_LABEL_TO_ICON[tg]);
                if (!tags.length) return null;
                return (
                  <div style={{ background: "#fff", border: `1px solid ${C.yellowLine}`, borderRadius: 16, padding: "12px 14px", marginBottom: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: C.sub, marginBottom: 8 }}>오늘의 태그</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {tags.map(tg => (
                        <span key={tg} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.yellow, borderRadius: 999, padding: "5px 11px 5px 7px" }}>
                          <DiaryIcon name={TAG_LABEL_TO_ICON[tg]} size={18} />
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.ink }}>{tg}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {items.length > 0 ? (
                <div style={{ background: "#fff", border: `1px solid ${C.yellowLine}`, borderRadius: 16, padding: "2px 14px", marginBottom: 22 }}>
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
          </div>
        );
      })()}

      {/* 미래 날짜 안내 토스트 — 2초 후 사라짐 */}
      {futureToast && (
        <div style={{ position: "fixed", left: "50%", bottom: 118, transform: "translateX(-50%)", zIndex: 80, maxWidth: "calc(100% - 48px)", background: "rgba(28,26,23,0.92)", color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1.5, padding: "12px 18px", borderRadius: 14, textAlign: "center", whiteSpace: "pre-line", boxShadow: "0 6px 22px rgba(0,0,0,0.22)", animation: "calToastUp .26s cubic-bezier(.22,.9,.32,1)" }}>
          {"지금은 기록할 수 없지만,\n미래엔 무슨 일이 있을까요?"}
          <style>{`@keyframes calToastUp{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
        </div>
      )}
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

// 오늘이 든 달·주 카드 — 흰 배경 + 연한 옐로우 그림자 박스('기분 달력' 박스와 같은 형태).
const CUR_CARD = {
  background: "#fff", borderRadius: 24, border: "1px solid #F3ECCE",
  boxShadow: "0 2px 6px rgba(220,188,86,0.20), 0 12px 30px rgba(233,203,110,0.48)",
};
function MonthSection({ monthDate, isCurrent, todayStr, today, history, t, isM, onDayPreview, onEditDay, onToday, onFuture, calView, onHelp, onToggleView, onFeedback }) {
  const year = monthDate.getFullYear(), month = monthDate.getMonth();
  const monthKey = `${year}-${pad(month + 1)}`;
  const count = history.filter(e => e.date.startsWith(monthKey)).length;
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  return (
    <div data-current={isCurrent ? "true" : undefined} style={{ background: "#fff", width: "100%" }}>
      <div style={{ maxWidth: 460, position: "relative", padding: "26px 18px 32px", ...(isCurrent ? { width: "calc(100% - 28px)", margin: "6px auto 16px", ...CUR_CARD } : { margin: "0 auto" }) }}>
        {isCurrent && <CalControls calView={calView} onHelp={onHelp} onToggleView={onToggleView} t={t} />}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", color: "#5E594F" }}>{year}년 {month + 1}월</h1>
          <p style={{ fontSize: 13, color: t.accent, fontWeight: 700, margin: "7px 0 0" }}>{count > 0 ? getRecordMessage(count, isM) : "아직 기록이 없어요"}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: i === 0 ? "#E79A95" : i === 6 ? "#93B2E6" : "#B8B3AA", padding: "6px 0" }}>{w}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 16 }}>
          {cells.map((d, idx) => {
            if (!d) return <div key={idx} />;
            const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
            const entry = getEntryForDate(dateStr);
            const isToday = dateStr === todayStr;
            const dow = idx % 7;
            const writable = isDayWritable(dateStr);
            const future = dateStr > todayStr;
            const locked = entry && isEntryLocked(dateStr);

            // 위쪽 동그라미 + 아래쪽 날짜(작게). 상태별로 동그라미 모양/클릭 동작이 달라진다.
            let top, onClick, ariaLabel;
            if (entry) {
              top = <Mallang v={entry.mood} size={30} />;
              if (!locked) onClick = () => onDayPreview({ dateStr, entry });
            } else if (isToday) {
              top = <div style={{ width: 34, height: 34, borderRadius: "50%", border: `2px solid ${C.ink}`, background: t.accentSoft }} />;
              onClick = () => onToday && onToday(); ariaLabel = "오늘 기록하기";
            } else if (writable) {
              top = <div style={{ width: 34, height: 34, borderRadius: "50%", border: `1.5px solid ${t.accent}` }} />;
              onClick = () => onEditDay && onEditDay(dateStr, null);
            } else if (future) {
              // 미래 날짜 — 회색 테두리 동그라미, 누르면 가벼운 안내
              top = <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid #D8D4CC" }} />;
              onClick = () => onFuture && onFuture(); ariaLabel = "아직 기록할 수 없는 날";
            } else {
              // 지난날 중 기록 못 하는 날 — 옅은 회색 동그라미
              top = <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid #EFEBE3" }} />;
            }

            // 미래 날짜는 일·토도 톤다운(연한 빨강·파랑), 나머지 미래는 연회색.
            const numColor = future
              ? (dow === 0 ? "#EBB6B2" : dow === 6 ? "#AEC4EE" : "#C9C4BB")
              : (weekdayColor(dow) || C.ink);
            const dateLabel = (
              <span style={{ fontSize: isToday ? 8.5 : 10.5, fontWeight: 800, letterSpacing: isToday ? "0.03em" : 0, color: isToday ? t.accentDeep : numColor, marginTop: 5, lineHeight: 1 }}>{isToday ? "today" : d}</span>
            );
            return (
              <div key={idx} style={{ display: "flex", justifyContent: "center" }}>
                {onClick ? (
                  <button onClick={onClick} aria-label={ariaLabel}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>
                    {top}{dateLabel}
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {top}{dateLabel}
                  </div>
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
  // 주간 요약 문구도 '월간 기준'으로 — 그 주의 대표 월(가운데 날짜)의 총 기록 일수를 쓴다.
  const monthRef = days[3];
  const monthKey = `${monthRef.getFullYear()}-${pad(monthRef.getMonth() + 1)}`;
  const count = history.filter(e => e.date.startsWith(monthKey)).length;
  return (
    <div data-current={isCurrent ? "true" : undefined} style={{ background: "#fff", width: "100%" }}>
      <div style={{ maxWidth: 460, position: "relative", padding: "26px 18px 30px", ...(isCurrent ? { width: "calc(100% - 28px)", margin: "6px auto 16px", ...CUR_CARD } : { margin: "0 auto" }) }}>
        {isCurrent && <CalControls calView={calView} onHelp={onHelp} onToggleView={onToggleView} t={t} />}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <h1 style={{ fontSize: 21, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", color: "#5E594F" }}>{title}</h1>
          <p style={{ fontSize: 13, color: t.accent, fontWeight: 700, margin: "7px 0 0" }}>{count > 0 ? getRecordMessage(count, isM) : "아직 기록이 없어요"}</p>
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
          <div style={{ fontSize: isToday ? 12 : 19, fontWeight: 800, letterSpacing: isToday ? "0.03em" : 0, color: isToday ? t.accentDeep : dayColor, marginTop: isToday ? 3 : 1 }}>{isToday ? "today" : date.getDate()}</div>
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
