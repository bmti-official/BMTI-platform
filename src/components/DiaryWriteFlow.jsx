import { useState } from "react";
import { Mallang } from "./Mallang";
import { MOODS as DAY_MOODS } from "../data";

// ============================================
// BMTI 하루일기 작성 플로우
// 한 페이지 스크롤 + 아코디언 구조 — 전체화면
// ============================================

const C = {
  bg: "#F5F5F7", card: "#FFFFFF", ink: "#1A1A1A", sub: "#9B9B9B", line: "#EFEFEF",
  main: "#111111", accent: "#FF6B9D", accentSoft: "#FDECF2",
  warn: "#FF6B6B", yellow: "#FFF3C4", pink: "#FF6B9D", pinkSoft: "#FEE7EF",
};

const PAPER_COLORS = {
  white: { label: "화이트", bg: "#FFFFFF", line: "#F0F0F0" },
  pink: { label: "핑크", bg: "#FFF5F8", line: "#FBE0EC" },
  ivory: { label: "아이보리", bg: "#FBF7EE", line: "#EFE7D5" },
  green: { label: "그린", bg: "#F2F8F3", line: "#DDEBDF" },
};
const FONTS = {
  round: { label: "둥근체", css: "'Pretendard', sans-serif" },
  serif: { label: "명조체", css: "'Nanum Myeongjo', serif" },
  hand: { label: "손글씨", css: "'Gaegu', cursive" },
  gothic: { label: "고딕체", css: "'Noto Sans KR', sans-serif" },
};

// ── 앉아있던 시간 (통계적으로 3시간 미만 / 10시간 이상이 극단값) ──
const SITTING_OPTS = [
  { label: "3시간 미만", title: "3시간 미만" },
  { label: "3시간", title: "3시간" },
  { label: "4시간", title: "4시간" },
  { label: "5시간", title: "5시간" },
  { label: "6시간", title: "6시간" },
  { label: "7시간", title: "7시간" },
  { label: "8시간", title: "8시간" },
  { label: "9시간", title: "9시간" },
  { label: "10시간 이상", title: "10시간 이상" },
];

// ── 수면 시간 (통계적으로 4시간 미만 / 9시간 이상이 극단값) ──
const SLEEP_OPTS = [
  { label: "4시간 미만", title: "4시간 미만" },
  { label: "4시간", title: "4시간" },
  { label: "5시간", title: "5시간" },
  { label: "6시간", title: "6시간" },
  { label: "7시간", title: "7시간" },
  { label: "8시간", title: "8시간" },
  { label: "9시간 이상", title: "9시간 이상" },
];

// ── 운동 카테고리 ──
const EXERCISE_CATS = [
  { name: "개인 집중형 (실내)", items: ["헬스·PT", "웨이트", "요가", "필라테스", "명상·호흡", "수영"] },
  { name: "야외 활동형 (실외)", items: ["걷기/산책", "러닝·조깅", "자전거", "등산"] },
  { name: "그룹 및 파트너형", items: ["축구", "농구", "배드민턴", "테니스", "크로스핏", "댄스"] },
];
const EXERCISE_TIME_LABELS = ["30분 미만", "1시간 미만", "2시간 미만", "2시간 이상"];

// ── 스트레칭·마사지 카테고리 ──
const SELFCARE_CATS = [
  { name: "상체", items: ["목", "어깨", "등(상부)", "가슴", "팔·손목"] },
  { name: "하체", items: ["허리", "엉덩이·골반", "허벅지", "종아리", "발목·발"] },
];
const SELFCARE_TIME_LABELS = ["30분 미만", "1시간 미만", "1시간 이상"];

// ── 기타 상수 ──
const PARTS = ["목", "어깨", "등", "허리", "손목", "무릎", "골반", "발목"];
const WHEN_OPTS = ["오늘 아침 일어날 때", "자고 일어났을 때", "움직일 때", "특정 자세일 때", "하루 종일"];
const CATEGORIES = [
  { id: "exercise", label: "운동습관", on: "#3F9F5B", bg: "#E4F5E7", border: "#B6E4C0", ph: "예: 오늘 아침에 스트레칭 10분 했어요 🧘" },
  { id: "daily", label: "일상", on: "#B8912A", bg: "#FDF6D3", border: "#F2E3A0", ph: "예: 오후에 커피 마시면서 잠깐 여유 부렸어요 ☕" },
  { id: "worry", label: "고민", on: "#8A3FD1", bg: "#F0E6FB", border: "#DAC2F5", ph: "예: 요즘 어깨가 자꾸 뭉치는데 신경 쓰여요 😭" },
];
const TIMESLOTS = [
  { label: "아침" }, { label: "점심" }, { label: "오후" }, { label: "저녁" }, { label: "밤" },
];

// ── 을/를 조사 헬퍼 ──
function eulReul(word) {
  if (!word) return "를";
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xAC00 || code > 0xD7A3) return "를";
  return (code - 0xAC00) % 28 !== 0 ? "을" : "를";
}

// ============================================
// 메인 컴포넌트
// ============================================
export default function DiaryWriteFlow({ onClose, onFinish, charName = "AI 캐릭터", initialPhase = "form", initialDayMood = null }) {
  const [phase, setPhase] = useState(initialPhase === "day" || initialPhase === "work" ? "form" : initialPhase);
  const [showSettings, setShowSettings] = useState(false);

  // 설정
  const [font, setFont] = useState("round");
  const [paper, setPaper] = useState("white");

  // ── 데이터 ──
  const [dayMood, setDayMood] = useState(initialDayMood);

  // 앉아있던 시간
  const [sittingVal, setSittingVal] = useState(null);
  // 수면 시간
  const [sleepVal, setSleepVal] = useState(null);

  // 운동
  const [exerciseTypes, setExerciseTypes] = useState([]); // max 2
  const [exerciseTimes, setExerciseTimes] = useState({}); // { "요가": "1시간 미만" }
  const [exerciseCatIdx, setExerciseCatIdx] = useState(0);
  const [customExercise, setCustomExercise] = useState("");

  // 스트레칭·마사지
  const [selfcareParts, setSelfcareParts] = useState([]); // max 3
  const [selfcareTime, setSelfcareTime] = useState(null);
  const [selfcareCatIdx, setSelfcareCatIdx] = useState(0);

  // 한 줄 일기
  const [oneLine, setOneLine] = useState({ slot: "오후", cat: "daily", text: "" });
  // 뻐근한 부위
  const [sore, setSore] = useState({ part: null, level: 5, when: null });

  const [selDate, setSelDate] = useState(new Date());
  const [showDatePick, setShowDatePick] = useState(false);

  // 아코디언 (true = 펼쳐진 상태)
  const [expanded, setExpanded] = useState({
    mood: !initialDayMood, // 초기값이 있으면 접힘
    sitting: true,
    sleep: true,
    exercise: true,
    selfcare: true,
  });
  const toggle = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  const F = FONTS[font].css;

  // 일기 제목 & 직접 수정
  const [diaryTitle, setDiaryTitle] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [diaryBody, setDiaryBody] = useState("");

  // writing → 2초 후 diary
  const goDiary = () => {
    setPhase("writing");
    setTimeout(() => {
      setDiaryTitle(makeTitle({ dayMood, sore, oneLine }));
      setDiaryBody(buildDiary({ dayMood, oneLine, sore, sittingVal, sleepVal, exerciseTypes, exerciseTimes, selfcareParts, selfcareTime }));
      setPhase("diary");
    }, 2000);
  };

  const goBack = () => {
    if (phase === "form") { if (onClose) onClose(); }
    else if (phase === "done") setPhase("diary");
  };

  const reset = () => {
    setPhase("form"); setDayMood(null);
    setSittingVal(null); setSleepVal(null);
    setExerciseTypes([]); setExerciseTimes({}); setCustomExercise("");
    setSelfcareParts([]); setSelfcareTime(null);
    setOneLine({ slot: "오후", cat: "daily", text: "" }); setSore({ part: null, level: 5, when: null });
    setDiaryTitle(""); setEditMode(false);
    setExpanded({ mood: true, sitting: true, sleep: true, exercise: true, selfcare: true });
  };

  const finishFlow = () => {
    if (onFinish) onFinish(dayMood);
    reset();
    if (onClose) onClose();
  };

  // ── 운동 종목 토글 (최대 2) ──
  const toggleExerciseType = (type) => {
    setExerciseTypes(prev => {
      if (prev.includes(type)) {
        const next = prev.filter(t => t !== type);
        setExerciseTimes(times => { const copy = { ...times }; delete copy[type]; return copy; });
        return next;
      }
      if (prev.length >= 2) return prev; // 최대 2개
      return [...prev, type];
    });
  };

  // 기타 운동 추가
  const addCustomExercise = () => {
    const name = customExercise.trim();
    if (!name || exerciseTypes.includes(name) || exerciseTypes.length >= 2) return;
    setExerciseTypes(prev => [...prev, name]);
    setCustomExercise("");
  };

  // ── 스트레칭 부위 토글 (최대 3, 전신은 exclusive) ──
  const toggleSelfcarePart = (part) => {
    if (part === "전신") {
      setSelfcareParts(prev => prev.includes("전신") ? [] : ["전신"]);
      return;
    }
    setSelfcareParts(prev => {
      if (prev.includes("전신")) return [part]; // 전신 해제하고 새 부위
      if (prev.includes(part)) return prev.filter(p => p !== part);
      if (prev.length >= 3) return prev;
      return [...prev, part];
    });
  };

  // ── 아코디언 자동 접기 ──
  const handleSittingPick = (opt) => {
    setSittingVal(opt.label);
    setTimeout(() => setExpanded(e => ({ ...e, sitting: false })), 250);
  };
  const handleSleepPick = (opt) => {
    setSleepVal(opt.label);
    setTimeout(() => setExpanded(e => ({ ...e, sleep: false })), 250);
  };

  // 운동 완료 체크 (종목 + 각 종목별 시간 모두 선택)
  const exerciseComplete = exerciseTypes.length > 0 && exerciseTypes.every(t => exerciseTimes[t]);
  // 스트레칭 완료 체크 (부위 + 총 시간)
  const selfcareComplete = selfcareParts.length > 0 && selfcareTime;

  // ── 운동 아코디언 제목 ──
  const exerciseTitle = () => {
    if (!exerciseComplete) return "🏃 오늘 운동 했어요?";
    const parts = exerciseTypes.map(t => `${t}${eulReul(t)} ${exerciseTimes[t]}`);
    return `🏃 오늘 ${parts.join(", ")} 했어요`;
  };

  // ── 스트레칭 아코디언 제목 ──
  const selfcareTitle = () => {
    if (!selfcareComplete) return "🤸 오늘 스트레칭·마사지 했어요?";
    const lastPart = selfcareParts[selfcareParts.length - 1];
    const partStr = selfcareParts.length === 1
      ? `${lastPart}${eulReul(lastPart)}`
      : `${selfcareParts.slice(0, -1).join(", ")}, ${lastPart}${eulReul(lastPart)}`;
    return `🤸 오늘 ${partStr} ${selfcareTime} 스트레칭·마사지 했어요`;
  };

  // ── 앉아있는 시간 제목 ──
  const sittingTitle = () => {
    if (!sittingVal) return "🪑 오늘 얼마나 앉아있었어요?";
    return `🪑 오늘 ${sittingVal} 앉아있었어요`;
  };

  // ── 수면 시간 제목 ──
  const sleepTitle = () => {
    if (!sleepVal) return "💤 오늘 얼마나 잤어요?";
    return `💤 오늘 ${sleepVal} 잤어요`;
  };

  // ── 말랑이 기분 제목 ──
  const moodData = DAY_MOODS.find(m => m.v === dayMood);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: C.bg, display: "flex", justifyContent: "center", fontFamily: F, color: C.ink }}>
      <div style={{ width: "100%", maxWidth: 420, height: "100%", background: phase === "diary" || phase === "writing" ? PAPER_COLORS[paper].bg : C.bg, position: "relative", display: "flex", flexDirection: "column" }}>

        {/* ── 헤더 ── */}
        {phase !== "diary" && phase !== "writing" && phase !== "done" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: C.bg, flexShrink: 0 }}>
          <button onClick={goBack} style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "transparent", color: C.ink, fontSize: 24, cursor: "pointer" }}>‹</button>
          <button onClick={() => setShowDatePick(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "transparent", cursor: "pointer", fontSize: 16, fontWeight: 800, color: C.ink }}>
            {selDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            <span style={{ fontSize: 11, color: C.sub, transform: showDatePick ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span>
          </button>
          <button onClick={() => setShowSettings(true)} style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "transparent", fontSize: 20, cursor: "pointer", opacity: 0.7 }}>⚙️</button>

          {showDatePick && (
            <div style={{ position: "absolute", top: 52, left: "50%", transform: "translateX(-50%)", background: C.card, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", padding: 8, zIndex: 40, minWidth: 200 }}>
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(); d.setDate(d.getDate() - i);
                const on = d.toDateString() === selDate.toDateString();
                return (
                  <button key={i} onClick={() => { setSelDate(d); setShowDatePick(false); }} style={{ width: "100%", textAlign: "left", padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: on ? C.ink : "transparent", color: on ? "#fff" : C.ink, fontSize: 14, fontWeight: on ? 800 : 600 }}>
                    {d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}{i === 0 && <span style={{ fontSize: 11, color: on ? "rgba(255,255,255,0.7)" : C.sub }}> · 오늘</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* ── 스크롤 영역 ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 100px", display: "flex", flexDirection: "column", gap: 14 }}>
          {phase === "form" && (
            <>
              {/* ━━━ 1. 오늘의 말랑이 기분 ━━━ */}
              <div style={{ background: C.card, borderRadius: 20, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: C.ink, margin: 0 }}>오늘의 말랑이 기분은</h2>
                  {dayMood && !expanded.mood && moodData && (
                    <Mallang v={moodData.v} size={42} />
                  )}
                </div>
                {/* 펼쳐진 상태 */}
                <div style={{ overflow: "hidden", maxHeight: expanded.mood ? 200 : 0, transition: "max-height 0.35s ease", marginTop: expanded.mood ? 8 : 0 }}>
                  <p style={{ fontSize: 12, color: C.sub, margin: "0 0 8px" }}>지금 마음에 가장 가까운 표정을 골라주세요.</p>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    {DAY_MOODS.map(m => (
                      <button key={m.v} onClick={() => { setDayMood(m.v); setTimeout(() => setExpanded(e => ({ ...e, mood: false })), 300); }} style={faceBtn(dayMood === m.v)}>
                        <Mallang v={m.v} size={42} />
                        <span style={{ fontSize: 10, color: dayMood === m.v ? C.ink : C.sub, fontWeight: 700, marginTop: 3 }}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* 수정하기 버튼 */}
                {dayMood && !expanded.mood && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <button onClick={() => toggle("mood")} style={{ border: "none", background: "transparent", color: C.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "4px 0" }}>수정하기 ▼</button>
                  </div>
                )}
              </div>

              {/* ━━━ 2. 앉아있던 시간 (아코디언) ━━━ */}
              <AccordionCard title={sittingTitle()} expanded={expanded.sitting} onToggle={() => toggle("sitting")} done={!!sittingVal}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {SITTING_OPTS.map(opt => {
                    const on = sittingVal === opt.label;
                    return <Chip key={opt.label} label={opt.label} on={on} onClick={() => handleSittingPick(opt)} />;
                  })}
                </div>
              </AccordionCard>

              {/* ━━━ 3. 수면 시간 (아코디언) ━━━ */}
              <AccordionCard title={sleepTitle()} expanded={expanded.sleep} onToggle={() => toggle("sleep")} done={!!sleepVal}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {SLEEP_OPTS.map(opt => {
                    const on = sleepVal === opt.label;
                    return <Chip key={opt.label} label={opt.label} on={on} onClick={() => handleSleepPick(opt)} />;
                  })}
                </div>
              </AccordionCard>

              {/* ━━━ 4. 운동 (카테고리 + 아코디언) ━━━ */}
              <AccordionCard title={exerciseTitle()} expanded={expanded.exercise} onToggle={() => toggle("exercise")} done={exerciseComplete}>
                <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginBottom: 10 }}>제일 많이 한 운동 최대 2가지를 골라주세요</div>
                {/* 카테고리 가로 스크롤 탭 */}
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 8 }}>
                  {EXERCISE_CATS.map((cat, i) => (
                    <button key={cat.name} onClick={() => setExerciseCatIdx(i)} style={{ flex: "0 0 auto", padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                      border: exerciseCatIdx === i ? `2px solid ${C.ink}` : `1px solid ${C.line}`, background: exerciseCatIdx === i ? C.ink : C.card, color: exerciseCatIdx === i ? "#fff" : C.sub }}>{cat.name}</button>
                  ))}
                  <button onClick={() => setExerciseCatIdx(99)} style={{ flex: "0 0 auto", padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                    border: exerciseCatIdx === 99 ? `2px solid ${C.ink}` : `1px solid ${C.line}`, background: exerciseCatIdx === 99 ? C.ink : C.card, color: exerciseCatIdx === 99 ? "#fff" : C.sub }}>기타</button>
                </div>
                {/* 종목 목록 */}
                {exerciseCatIdx !== 99 && EXERCISE_CATS[exerciseCatIdx] && (
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 8 }}>
                    {EXERCISE_CATS[exerciseCatIdx].items.map(type => {
                      const on = exerciseTypes.includes(type);
                      const disabled = !on && exerciseTypes.length >= 2;
                      return <Chip key={type} label={type} on={on} onClick={() => toggleExerciseType(type)} disabled={disabled} />;
                    })}
                  </div>
                )}
                {/* 기타 입력 */}
                {exerciseCatIdx === 99 && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input value={customExercise} onChange={e => setCustomExercise(e.target.value)} placeholder="운동 이름 입력"
                      onKeyDown={e => e.key === "Enter" && addCustomExercise()}
                      style={{ flex: 1, padding: "10px 14px", borderRadius: 14, border: `1px solid ${C.line}`, fontSize: 14, outline: "none", fontFamily: FONTS[font].css }} />
                    <button onClick={addCustomExercise} disabled={exerciseTypes.length >= 2}
                      style={{ padding: "10px 16px", borderRadius: 14, border: "none", background: C.ink, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: exerciseTypes.length >= 2 ? 0.4 : 1 }}>추가</button>
                  </div>
                )}
                {/* 선택된 종목 표시 */}
                {exerciseTypes.length > 0 && (
                  <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                    {exerciseTypes.map(t => (
                      <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 14, background: C.ink, color: "#fff", fontSize: 12, fontWeight: 700 }}>
                        {t} <button onClick={() => toggleExerciseType(t)} style={{ border: "none", background: "transparent", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
                {/* 각 종목별 시간 */}
                {exerciseTypes.map(type => (
                  <div key={type} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 6 }}>{type} — 얼마나 했어요?</div>
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                      {EXERCISE_TIME_LABELS.map(t => {
                        const on = exerciseTimes[type] === t;
                        return (
                          <button key={t} onClick={() => {
                            setExerciseTimes(s => ({ ...s, [type]: t }));
                            // 모든 종목 시간 선택 완료 시 자동 접기
                            const updated = { ...exerciseTimes, [type]: t };
                            if (exerciseTypes.every(et => updated[et])) {
                              setTimeout(() => setExpanded(e => ({ ...e, exercise: false })), 300);
                            }
                          }}
                          style={{ flex: "0 0 auto", padding: "10px 14px", borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
                            border: on ? `2px solid ${C.ink}` : `1px solid ${C.line}`, background: on ? C.ink : C.card, color: on ? "#fff" : C.sub }}>{t}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </AccordionCard>

              {/* ━━━ 5. 스트레칭·마사지 (카테고리 + 아코디언) ━━━ */}
              <AccordionCard title={selfcareTitle()} expanded={expanded.selfcare} onToggle={() => toggle("selfcare")} done={selfcareComplete}>
                <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginBottom: 10 }}>풀어준 부위 최대 3가지를 골라주세요</div>
                {/* 카테고리 탭 */}
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 8 }}>
                  {SELFCARE_CATS.map((cat, i) => (
                    <button key={cat.name} onClick={() => setSelfcareCatIdx(i)} style={{ flex: "0 0 auto", padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                      border: selfcareCatIdx === i ? `2px solid ${C.ink}` : `1px solid ${C.line}`, background: selfcareCatIdx === i ? C.ink : C.card, color: selfcareCatIdx === i ? "#fff" : C.sub }}>{cat.name}</button>
                  ))}
                  <button onClick={() => setSelfcareCatIdx(99)} style={{ flex: "0 0 auto", padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                    border: selfcareCatIdx === 99 ? `2px solid ${C.ink}` : `1px solid ${C.line}`, background: selfcareCatIdx === 99 ? C.ink : C.card, color: selfcareCatIdx === 99 ? "#fff" : C.sub }}>전신</button>
                </div>
                {/* 부위 목록 */}
                {selfcareCatIdx !== 99 && SELFCARE_CATS[selfcareCatIdx] && (
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 8 }}>
                    {SELFCARE_CATS[selfcareCatIdx].items.map(part => {
                      const on = selfcareParts.includes(part);
                      const disabled = !on && (selfcareParts.includes("전신") || selfcareParts.length >= 3);
                      return <Chip key={part} label={part} on={on} onClick={() => toggleSelfcarePart(part)} disabled={disabled} />;
                    })}
                  </div>
                )}
                {/* 전신 */}
                {selfcareCatIdx === 99 && (
                  <div style={{ marginBottom: 8 }}>
                    <Chip label="전신" on={selfcareParts.includes("전신")} onClick={() => toggleSelfcarePart("전신")} />
                    {selfcareParts.includes("전신") && <p style={{ fontSize: 11, color: C.sub, marginTop: 6 }}>전신을 선택하면 다른 부위는 선택할 수 없어요.</p>}
                  </div>
                )}
                {/* 선택된 부위 표시 */}
                {selfcareParts.length > 0 && (
                  <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                    {selfcareParts.map(p => (
                      <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 14, background: C.ink, color: "#fff", fontSize: 12, fontWeight: 700 }}>
                        {p} <button onClick={() => toggleSelfcarePart(p)} style={{ border: "none", background: "transparent", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
                {/* 총 시간 */}
                {selfcareParts.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 6 }}>총 얼마나 했어요?</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {SELFCARE_TIME_LABELS.map(t => {
                        const on = selfcareTime === t;
                        return (
                          <button key={t} onClick={() => {
                            setSelfcareTime(t);
                            setTimeout(() => setExpanded(e => ({ ...e, selfcare: false })), 300);
                          }}
                          style={{ flex: 1, padding: "10px 8px", borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
                            border: on ? `2px solid ${C.ink}` : `1px solid ${C.line}`, background: on ? C.ink : C.card, color: on ? "#fff" : C.sub }}>{t}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </AccordionCard>

              {/* ━━━ 6. 한 줄 일기 ━━━ */}
              <Card title="✏️ 한 줄 일기">
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                  {TIMESLOTS.map(t => {
                    const on = oneLine.slot === t.label;
                    return <Chip key={t.label} label={t.label} on={on} onClick={() => setOneLine(s => ({ ...s, slot: t.label }))} />;
                  })}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  {CATEGORIES.map(c => {
                    const on = oneLine.cat === c.id;
                    return (
                      <button key={c.id} onClick={() => setOneLine(s => ({ ...s, cat: c.id }))} style={{ padding: "8px 14px", borderRadius: 16, fontSize: 13, fontWeight: 700, cursor: "pointer",
                        border: on ? `2px solid ${c.border}` : "2px solid transparent", background: on ? c.bg : "#F2F2F4", color: on ? c.on : C.sub }}>{c.label}</button>
                    );
                  })}
                </div>
                <textarea value={oneLine.text} onChange={e => setOneLine(s => ({ ...s, text: e.target.value }))} placeholder={CATEGORIES.find(c => c.id === oneLine.cat)?.ph}
                  style={{ width: "100%", marginTop: 12, minHeight: 80, borderRadius: 14, border: `1px solid ${C.line}`, background: "#F9F9F9", padding: 14, fontSize: 14, resize: "none", outline: "none", fontFamily: F, boxSizing: "border-box" }} />
              </Card>

              {/* ━━━ 7. 뻐근한 부위 ━━━ */}
              <Card title="🐢 뻐근한 부위">
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {PARTS.map(p => <Chip key={p} label={p} on={sore.part === p} onClick={() => setSore(s => ({ ...s, part: s.part === p ? null : p }))} />)}
                </div>
                {sore.part && <>
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, margin: "14px 0 8px" }}>얼마나 불편했어요? ({sore.level})</div>
                  <input type="range" min="0" max="10" value={sore.level} onChange={e => setSore(s => ({ ...s, level: +e.target.value }))} style={{ width: "100%", accentColor: C.ink }} />
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, margin: "14px 0 8px" }}>언제 그러셨어요?</div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {WHEN_OPTS.map(w => <Chip key={w} label={w} on={sore.when === w} onClick={() => setSore(s => ({ ...s, when: w }))} />)}
                  </div>
                </>}
              </Card>
            </>
          )}

          {/* ── 작성중 ── */}
          {phase === "writing" && (
            <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
              <div style={{ fontSize: 52, animation: "pulse 1.2s ease-in-out infinite" }}>📝</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>일기장을 작성하고 있어요...</div>
              <div style={{ fontSize: 13, color: C.sub }}>오늘 하루를 예쁘게 정리하는 중이에요</div>
              <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.6}}`}</style>
            </div>
          )}

          {/* ── 완료 ── */}
          {phase === "done" && (
            <div style={{ textAlign: "center", paddingTop: 20 }}>
              <div style={{ margin: "10px auto" }}><Char big /></div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", textAlign: "center" }}>오늘도 잘 채웠어요</h1>
              <p style={{ fontSize: 14, color: C.sub, margin: "0 0 18px", lineHeight: 1.55, textAlign: "center" }}>{charName}이 답장을 남겼어요. 조금 뒤 일기장에서 만나요 📩</p>
              <div style={{ background: C.pinkSoft, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16, margin: "20px 0", textAlign: "left", display: "flex", gap: 12 }}>
                <Char />
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  {dayMood <= 2 ? "오늘 많이 힘드셨죠. 그런 날도 있는 거예요. 오늘은 어깨 팡팡 하고 일찍 쉬어요 🫂" : "오늘 하루도 잘 보내셨네요! 내일 또 이야기 들려주세요 🌿"}
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>📊 3일만 쌓이면, 한 주를 정리한 리포트를 받아볼 수 있어요</div>
              <button onClick={finishFlow} style={primaryBtn}>오늘 기록 마치기</button>
            </div>
          )}
        </div>

        {/* ── 하단 고정 CTA 버튼 ── */}
        {phase === "form" && (
          <div style={{ flexShrink: 0, padding: "10px 14px 20px", background: `linear-gradient(transparent, ${C.bg} 20%)`, borderTop: `1px solid ${C.line}` }}>
            <button onClick={goDiary} style={{ ...primaryBtn, background: "#51A351", color: "#fff", opacity: dayMood ? 1 : 0.5 }} disabled={!dayMood}>📔 이대로 저장하기</button>
          </div>
        )}

        {/* ── 전체화면 일기장 (diary) ── */}
        {phase === "diary" && (
          <div style={{ position: "absolute", inset: 0, background: PAPER_COLORS[paper].bg, display: "flex", flexDirection: "column", zIndex: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 6px" }}>
              <button onClick={() => setEditMode(e => !e)} style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 800, color: editMode ? C.pink : C.sub }}>
                {editMode ? "✓ 완료" : "✎ 고쳐주기"}
              </button>
              <button onClick={() => setShowDatePick(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "transparent", cursor: "pointer", fontSize: 15, fontWeight: 800, color: C.ink }}>
                {selDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
              </button>
              <button onClick={() => setShowSettings(true)} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "transparent", fontSize: 19, cursor: "pointer", opacity: 0.7 }}>⚙️</button>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "6px 18px 14px", gap: 10, borderBottom: `1px solid ${PAPER_COLORS[paper].line}` }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 52 }}>
                {moodData && <Mallang v={moodData.v} size={26} />}
                <span style={{ fontSize: 10, color: C.sub, fontWeight: 700 }}>{moodData?.label}</span>
              </div>
              <div style={{ flex: 1, textAlign: "center", paddingTop: 2 }}>
                {editMode ? (
                  <input value={diaryTitle} onChange={e => setDiaryTitle(e.target.value)} placeholder="제목"
                    style={{ width: "100%", textAlign: "center", fontSize: 16, fontWeight: 800, border: "none", borderBottom: `2px solid ${C.pink}`, background: "transparent", outline: "none", fontFamily: F, color: C.ink, padding: "2px 0" }} />
                ) : (
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, lineHeight: 1.3 }}>{diaryTitle}</div>
                )}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px",
              backgroundImage: `repeating-linear-gradient(transparent 0 31px, ${PAPER_COLORS[paper].line} 31px 32px)`, lineHeight: "32px" }}>
              {editMode ? (
                <textarea value={diaryBody} onChange={e => setDiaryBody(e.target.value)}
                  style={{ width: "100%", minHeight: "50vh", border: "none", background: "transparent", outline: "none", resize: "none", fontSize: 15.5, lineHeight: "32px", fontFamily: F, color: C.ink }} />
              ) : (
                <p style={{ fontSize: 15.5, lineHeight: "32px", margin: 0, color: C.ink, fontFamily: F, whiteSpace: "pre-wrap" }}>{diaryBody}</p>
              )}
            </div>
            <div style={{ padding: "12px 18px 20px", borderTop: `1px solid ${PAPER_COLORS[paper].line}` }}>
              {!editMode && <p style={{ fontSize: 12, color: C.sub, textAlign: "center", margin: "0 0 10px" }}>고치고 싶으면 왼쪽 위 '고쳐주기'를 눌러 직접 수정할 수 있어요.</p>}
              <button onClick={() => setPhase("done")} style={{ ...primaryBtn, marginTop: 0 }}>맞아요, 이렇게 기억해주세요</button>
            </div>
            {showDatePick && (
              <div style={{ position: "absolute", top: 52, left: "50%", transform: "translateX(-50%)", background: C.card, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", padding: 8, zIndex: 40, minWidth: 200 }}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - i);
                  const on = d.toDateString() === selDate.toDateString();
                  return (
                    <button key={i} onClick={() => { setSelDate(d); setShowDatePick(false); }} style={{ width: "100%", textAlign: "left", padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: on ? C.ink : "transparent", color: on ? "#fff" : C.ink, fontSize: 14, fontWeight: on ? 800 : 600 }}>
                      {d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}{i === 0 && <span style={{ fontSize: 11, color: on ? "rgba(255,255,255,0.7)" : C.sub }}> · 오늘</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 환경설정 모달 ── */}
        {showSettings && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 60 }} onClick={() => setShowSettings(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: C.bg, borderRadius: "24px 24px 0 0", padding: "20px 20px 30px", maxHeight: "85vh", overflowY: "auto" }}>
              <div style={{ width: 40, height: 4, background: C.line, borderRadius: 4, margin: "0 auto 18px" }} />
              <h2 style={{ fontSize: 19, fontWeight: 800, margin: "0 0 20px" }}>환경 설정</h2>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>글씨체</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
                {Object.entries(FONTS).map(([k, v]) => (
                  <button key={k} onClick={() => setFont(k)} style={{ padding: "13px 0", borderRadius: 14, cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: v.css,
                    border: font === k ? `2px solid ${C.ink}` : `1px solid ${C.line}`, background: font === k ? C.ink : C.card, color: font === k ? "#fff" : C.ink }}>{v.label}</button>
                ))}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>일기장 색상</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                {Object.entries(PAPER_COLORS).map(([k, v]) => (
                  <button key={k} onClick={() => setPaper(k)} style={{ flex: 1, cursor: "pointer", border: "none", background: "none", padding: 0 }}>
                    <div style={{ height: 52, borderRadius: 14, background: v.bg, border: paper === k ? `3px solid ${C.ink}` : `1px solid ${C.line}`, marginBottom: 6 }} />
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: paper === k ? C.ink : C.sub, textAlign: "center" }}>{v.label}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowSettings(false)} style={{ ...primaryBtn, marginTop: 24 }}>완료</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 헬퍼 컴포넌트
// ============================================

function AccordionCard({ title, expanded, onToggle, done, children }) {
  return (
    // flexShrink:0 필수 — 부모가 flex-direction:column인데 이 div에 overflow:hidden이 걸려 있으면
    // 플렉스 아이템의 자동 최소 높이가 auto 대신 0이 되어 버려서, 브라우저가 이 카드를 통째로
    // height:0으로 찌그러뜨리는 문제가 있었다(앉은 시간/수면/운동/스트레칭 카드가 안 보이고 클릭도 안 되던 원인).
    <div style={{ background: C.card, borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.02)", overflow: "hidden", flexShrink: 0 }}>
      <button onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: C.ink, lineHeight: 1.4, flex: 1, paddingRight: 8 }}>{title}</span>
        <span style={{ fontSize: 12, color: done ? "#51A351" : C.sub, fontWeight: 700, flexShrink: 0, transition: "transform .2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>
          {done && !expanded ? "✓" : "▼"}
        </span>
      </button>
      <div style={{ overflow: "hidden", maxHeight: expanded ? 600 : 0, transition: "max-height 0.35s ease" }}>
        <div style={{ padding: "0 24px 20px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: C.card, borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: C.ink, margin: "0 0 16px" }}>{title}</h2>
      {children}
    </div>
  );
}

function Chip({ label, on, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{ flex: "0 0 auto", padding: "9px 15px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: disabled ? "default" : "pointer",
      border: on ? `2px solid ${C.ink}` : `1px solid ${C.line}`, background: on ? C.ink : C.card, color: on ? "#fff" : C.sub, opacity: disabled ? 0.35 : 1, transition: "all .15s" }}>
      {label}
    </button>
  );
}

function Char({ big }) { const s = big ? 80 : 38; return <div style={{ width: s, height: s, borderRadius: "50%", background: C.pinkSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: big ? 40 : 19, flexShrink: 0 }}>🐧</div>; }

// ============================================
// Mock 일기 생성
// ============================================

function makeTitle({ dayMood, sore, oneLine }) {
  if (sore.part) return `${sore.part}가 뻐근한 하루`;
  if (oneLine.text.trim()) return oneLine.text.trim().slice(0, 14) + (oneLine.text.length > 14 ? "…" : "");
  const t = { 1: "조금 버거웠던 하루", 2: "지친 하루", 3: "그저 그런 하루", 4: "괜찮았던 하루", 5: "기분 좋은 하루" }[dayMood];
  return t || "오늘의 일기";
}

function buildDiary({ dayMood, oneLine, sore, sittingVal, sleepVal, exerciseTypes, exerciseTimes, selfcareParts, selfcareTime }) {
  const parts = [];
  const moodTxt = { 1: "많이 힘든", 2: "조금 지친", 3: "그저 그런", 4: "괜찮은", 5: "기분 좋은" }[dayMood];
  parts.push(`오늘은 ${moodTxt} 하루였어요.`);

  if (sittingVal) parts.push(`오늘 ${sittingVal} 앉아있었어요.`);
  if (sleepVal) parts.push(`어젯밤엔 ${sleepVal} 잤어요.`);

  if (exerciseTypes.length > 0) {
    const exDetails = exerciseTypes.map(t => exerciseTimes[t] ? `${t} ${exerciseTimes[t]}` : t).join(", ");
    parts.push(`운동은 ${exDetails} 했어요.`);
  }
  if (selfcareParts.length > 0) {
    parts.push(`${selfcareParts.join(", ")}를 스트레칭·마사지했어요${selfcareTime ? ` (총 ${selfcareTime})` : ""}.`);
  }
  if (oneLine.text.trim()) parts.push(`${oneLine.slot}엔 ${oneLine.text.trim()}.`);
  if (sore.part) parts.push(`${sore.part}가 ${sore.when || "하루 종일"} 뻐근했어요 (${sore.level}/10).`);
  parts.push("오늘도 나를 채운 하루였어요. 잘하고 있어요 🌿");
  return parts.join(" ");
}

// ============================================
// 스타일
// ============================================

const faceBtn = (on) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 0", borderRadius: 16, cursor: "pointer", transition: "all .15s",
  border: on ? `2px solid ${C.ink}` : `1px solid ${C.line}`, background: "#fff", boxShadow: on ? "0 2px 12px rgba(0,0,0,0.08)" : "none" });
const primaryBtn = { width: "100%", padding: 17, borderRadius: 16, border: "none", background: C.ink, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer" };
