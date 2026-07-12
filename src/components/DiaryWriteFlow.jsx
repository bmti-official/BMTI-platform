import { useState } from "react";
import { Mallang } from "./Mallang";
import { DiaryIcon } from "./DiaryIcons";
import { MOODS as DAY_MOODS } from "../data";

// ============================================
// BMTI 하루일기 작성 플로우
// 한 페이지 스크롤 + 아코디언 구조 — 전체화면
// ============================================

// 색감·톤은 사이트 전체(BMTI 하루일기 온보딩·캘린더, BMTI 라이브)와 통일한다.
const C = {
  bg: "#FFFFFF", card: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2",
  pink: "#FF6B9D", pinkSoft: "#FFEDF3", sage: "#5F8A76", sageSoft: "#E9F1EC",
  tileOff: "#F3F1EC", tileOffText: "#B7B2A9",
};

// ── 앉아있던 정도 ──
const SITTING_OPTS = [
  { label: "거의 안 앉음", icon: "walk" },
  { label: "보통이었어요", icon: "chair" },
  { label: "많이 앉았어요", icon: "sofa" },
  { label: "하루 종일 앉음", icon: "slump" },
];

// ── 수면의 질 ──
const SLEEP_OPTS = [
  { label: "뒤척였어요", icon: "toss" },
  { label: "그냥 그랬어요", icon: "mehMoon" },
  { label: "푹 잤어요", icon: "sleepWell" },
];

// ── 운동 카테고리 (개인 집중형에 스트레칭 포함) ──
const EXERCISE_CATS = [
  { name: "개인 집중형 (실내)", items: ["헬스·PT", "웨이트", "요가", "필라테스", "스트레칭", "명상·호흡", "수영"] },
  { name: "야외 활동형 (실외)", items: ["걷기/산책", "러닝·조깅", "자전거", "등산"] },
  { name: "그룹 및 파트너형", items: ["축구", "농구", "배드민턴", "테니스", "크로스핏", "댄스"] },
];
const EXERCISE_TIME_LABELS = ["30분 미만", "1시간 미만", "2시간 미만", "2시간 이상"];

// ── 운동을 안 한 이유 ──
const NO_EXERCISE_REASONS = [
  { label: "바빴어요", icon: "clock" },
  { label: "피곤해요", icon: "yawn" },
  { label: "몸이 안 좋아요", icon: "bandage" },
  { label: "그냥 쉬고 싶었어요", icon: "blanket" },
  { label: "깜빡했어요", icon: "forgot" },
];

// ── 기타 상수 ──
const PARTS = ["목", "어깨", "등", "허리", "손목", "무릎", "골반", "발목"];
const WHEN_OPTS = ["오늘 아침 일어날 때", "자고 일어났을 때", "움직일 때", "특정 자세일 때", "하루 종일"];
const CATEGORIES = [
  { id: "exercise", label: "운동습관", on: "#3F9F5B", bg: "#E4F5E7", border: "#B6E4C0", ph: "예: 오늘 아침에 스트레칭 10분 했어요 🧘" },
  { id: "daily", label: "일상", on: "#B8912A", bg: "#FDF6D3", border: "#F2E3A0", ph: "예: 🧍🏻‍♀️아침마다 50점프 챌린지 하기로 했다." },
  { id: "worry", label: "고민", on: "#8A3FD1", bg: "#F0E6FB", border: "#DAC2F5", ph: "예: 요즘 어깨가 자꾸 뭉치는데 신경 쓰여요 😭" },
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
export default function DiaryWriteFlow({ onClose, onFinish, initialPhase = "form", initialDayMood = null, targetDate = null }) {
  const [phase, setPhase] = useState(initialPhase === "day" || initialPhase === "work" ? "form" : initialPhase);

  // ── 데이터 ──
  const [dayMood, setDayMood] = useState(initialDayMood);

  // 앉아있던 정도
  const [sittingVal, setSittingVal] = useState(null);
  // 수면의 질
  const [sleepVal, setSleepVal] = useState(null);

  // 운동
  const [exerciseDidIt, setExerciseDidIt] = useState(null); // null | 'no' | 'yes'
  const [exerciseReason, setExerciseReason] = useState(null); // 안 했을 때 이유
  const [exerciseTypes, setExerciseTypes] = useState([]); // max 2
  const [exerciseTimes, setExerciseTimes] = useState({}); // { "요가": "1시간 미만" }
  const [customExercise, setCustomExercise] = useState("");
  const [showCustomExercise, setShowCustomExercise] = useState(false);

  // 한 줄 일기
  const [oneLine, setOneLine] = useState({ cat: "daily", text: "" });
  // 뻐근한 부위
  const [sore, setSore] = useState({ part: null, level: 5, when: null });

  const [selDate, setSelDate] = useState(() => targetDate ? new Date(`${targetDate}T00:00:00`) : new Date());
  const [showDatePick, setShowDatePick] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 아코디언 (true = 펼쳐진 상태)
  const [expanded, setExpanded] = useState({
    mood: !initialDayMood, // 초기값이 있으면 접힘
    sitting: true,
    sleep: true,
    exercise: true,
  });
  const toggle = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  const F = "'Pretendard', -apple-system, sans-serif";

  const goBack = () => {
    if (phase === "form" && onClose) onClose();
  };

  // 기록 저장 → 3초짜리 완료 팝업 → 캘린더로 복귀
  const finishFlow = () => {
    if (onFinish) onFinish(dayMood);
    setPhase("celebrate");
    setTimeout(() => { if (onClose) onClose(); }, 3000);
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

  // ── 아코디언 자동 접기 ──
  const handleSittingPick = (opt) => {
    setSittingVal(opt.label);
    setTimeout(() => setExpanded(e => ({ ...e, sitting: false })), 250);
  };
  const handleSleepPick = (opt) => {
    setSleepVal(opt.label);
    setTimeout(() => setExpanded(e => ({ ...e, sleep: false })), 250);
  };
  const pickExerciseReason = (label) => {
    setExerciseReason(label);
    setTimeout(() => setExpanded(e => ({ ...e, exercise: false })), 250);
  };

  // 운동 완료 체크 — 안 했으면 이유 선택, 했으면 종목+시간 모두 선택
  const exerciseComplete = exerciseDidIt === "no"
    ? !!exerciseReason
    : exerciseDidIt === "yes"
      ? (exerciseTypes.length > 0 && exerciseTypes.every(t => exerciseTimes[t]))
      : false;

  // ── 선택하면 제목 자리에 아이콘+내용으로 바뀌는 답변 정보 ──
  const sittingOpt = SITTING_OPTS.find(o => o.label === sittingVal);
  const sleepOpt = SLEEP_OPTS.find(o => o.label === sleepVal);
  const exerciseReasonOpt = NO_EXERCISE_REASONS.find(r => r.label === exerciseReason);

  let exerciseAnswerIcon = null;
  let exerciseAnswerText = null;
  if (exerciseDidIt === "no" && exerciseReasonOpt) {
    exerciseAnswerIcon = exerciseReasonOpt.icon;
    exerciseAnswerText = `오늘은 ${exerciseReasonOpt.label}`;
  } else if (exerciseDidIt === "yes" && exerciseComplete) {
    exerciseAnswerIcon = "flex";
    exerciseAnswerText = `오늘 ${exerciseTypes.map(t => `${t}${eulReul(t)} ${exerciseTimes[t]}`).join(", ")} 했어요`;
  }

  // ── 말랑이 기분 ──
  const moodData = DAY_MOODS.find(m => m.v === dayMood);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: C.bg, display: "flex", justifyContent: "center", fontFamily: F, color: C.ink }}>
      <div style={{ width: "100%", maxWidth: 420, height: "100%", background: C.bg, position: "relative", display: "flex", flexDirection: "column" }}>

        {/* ── 헤더 ── */}
        {phase === "form" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 14px", background: C.bg, flexShrink: 0, position: "relative" }}>
          <button onClick={goBack} style={{ position: "absolute", left: 6, width: 38, height: 38, borderRadius: "50%", border: "none", background: "transparent", color: C.ink, fontSize: 24, cursor: "pointer" }}>‹</button>
          <button onClick={() => setShowDatePick(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "transparent", cursor: "pointer", fontSize: 16, fontWeight: 800, color: C.ink }}>
            {selDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            <span style={{ fontSize: 11, color: C.sub, transform: showDatePick ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span>
          </button>
          <button onClick={() => setShowSettings(true)} style={{ position: "absolute", right: 10, width: 38, height: 38, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <DiaryIcon name="gear" size={22} />
          </button>

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
              <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: C.ink, margin: 0 }}>오늘의 말랑이 기분은</h2>
                  {dayMood && !expanded.mood && moodData && (
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: moodData.circleBg || moodData.fill, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Mallang v={moodData.v} size={34} />
                    </div>
                  )}
                </div>
                {/* 펼쳐진 상태 */}
                <div style={{ overflow: "hidden", maxHeight: expanded.mood ? 200 : 0, transition: "max-height 0.35s ease", marginTop: expanded.mood ? 8 : 0 }}>
                  <p style={{ fontSize: 12, color: C.sub, margin: "0 0 8px" }}>지금 마음에 가장 가까운 표정을 골라주세요.</p>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    {DAY_MOODS.map(m => {
                      const on = dayMood === m.v;
                      const circleBg = m.circleBg || m.fill;
                      return (
                        <button key={m.v} onClick={() => { setDayMood(m.v); setTimeout(() => setExpanded(e => ({ ...e, mood: false })), 300); }}
                          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "6px 0", borderRadius: 16, border: "none", background: "transparent", cursor: "pointer" }}>
                          <div style={{ width: 54, height: 54, borderRadius: "50%", background: on ? circleBg : C.tileOff, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: on ? `0 4px 14px ${circleBg}99` : "none", transition: "all .15s" }}>
                            <div style={{ filter: on ? "none" : "grayscale(1) opacity(0.55)", transition: "filter .15s" }}>
                              <Mallang v={m.v} size={38} />
                            </div>
                          </div>
                          <span style={{ fontSize: 10, color: on ? C.ink : C.sub, fontWeight: 700 }}>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* 수정하기 버튼 */}
                {dayMood && !expanded.mood && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <button onClick={() => toggle("mood")} style={{ border: "none", background: "transparent", color: C.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "4px 0" }}>수정하기 ▾</button>
                  </div>
                )}
              </div>

              {/* ━━━ 2. 얼마나 앉았어요 (아코디언) ━━━ */}
              <AccordionCard question="얼마나 앉았어요?" answerIcon={sittingOpt?.icon} answerText={sittingVal}
                expanded={expanded.sitting} onToggle={() => toggle("sitting")} done={!!sittingVal}>
                <div style={{ display: "flex", gap: 6 }}>
                  {SITTING_OPTS.map(opt => (
                    <EmojiTile key={opt.label} icon={opt.icon} label={opt.label} on={sittingVal === opt.label} onClick={() => handleSittingPick(opt)} />
                  ))}
                </div>
              </AccordionCard>

              {/* ━━━ 3. 얼마나 푹 잤나요 (아코디언) ━━━ */}
              <AccordionCard question="얼마나 푹 잤나요?" answerIcon={sleepOpt?.icon} answerText={sleepVal}
                expanded={expanded.sleep} onToggle={() => toggle("sleep")} done={!!sleepVal}>
                <div style={{ display: "flex", gap: 6 }}>
                  {SLEEP_OPTS.map(opt => (
                    <EmojiTile key={opt.label} icon={opt.icon} label={opt.label} on={sleepVal === opt.label} onClick={() => handleSleepPick(opt)} />
                  ))}
                </div>
              </AccordionCard>

              {/* ━━━ 4. 운동 (했다/안했다 → 이유 또는 종목) ━━━ */}
              <AccordionCard question="오늘 운동 했나요?" answerIcon={exerciseAnswerIcon} answerText={exerciseAnswerText}
                expanded={expanded.exercise} onToggle={() => toggle("exercise")} done={exerciseComplete}>
                {exerciseDidIt === null && (
                  <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "8px 0 4px" }}>
                    <EmojiTile icon="restNo" label="안했어요!" on={false} onClick={() => setExerciseDidIt("no")} />
                    <EmojiTile icon="flex" label="했어요!" on={false} onClick={() => setExerciseDidIt("yes")} />
                  </div>
                )}

                {exerciseDidIt === "no" && (
                  <>
                    <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginBottom: 10 }}>오늘은 어떤 이유였어요?</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", rowGap: 14, justifyItems: "center" }}>
                      {NO_EXERCISE_REASONS.map(r => (
                        <EmojiTile key={r.label} icon={r.icon} label={r.label} on={exerciseReason === r.label} onClick={() => pickExerciseReason(r.label)} />
                      ))}
                    </div>
                    <button onClick={() => setExerciseDidIt(null)} style={{ marginTop: 14, border: "none", background: "transparent", color: C.sub, fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>‹ 다시 고르기</button>
                  </>
                )}

                {exerciseDidIt === "yes" && (
                  <>
                    <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginBottom: 16 }}>제일 많이 한 운동 최대 2가지를 골라주세요</div>
                    {EXERCISE_CATS.map(cat => (
                      <div key={cat.name} style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{cat.name}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", rowGap: 14, justifyItems: "center" }}>
                          {cat.items.map(type => {
                            const on = exerciseTypes.includes(type);
                            const disabled = !on && exerciseTypes.length >= 2;
                            return <Tile key={type} content={type} on={on} onClick={() => toggleExerciseType(type)} disabled={disabled} size={62} />;
                          })}
                        </div>
                      </div>
                    ))}

                    {/* 기타 — 조그만 하이퍼링크 느낌 버튼, 누르면 입력창이 아코디언으로 펼쳐짐 */}
                    <button onClick={() => setShowCustomExercise(v => !v)} style={{ border: "none", background: "transparent", color: C.sage, fontSize: 11.5, fontWeight: 700, textDecoration: "underline", cursor: "pointer", padding: "2px 0", display: "block", marginBottom: showCustomExercise ? 10 : 4 }}>
                      기타 운동 직접 입력 {showCustomExercise ? "▾" : "▸"}
                    </button>
                    {showCustomExercise && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                        <input value={customExercise} onChange={e => setCustomExercise(e.target.value)} placeholder="운동 이름 입력"
                          onKeyDown={e => e.key === "Enter" && addCustomExercise()}
                          style={{ flex: 1, padding: "10px 14px", borderRadius: 14, border: `1px solid ${C.line}`, fontSize: 14, outline: "none", fontFamily: F }} />
                        <button onClick={addCustomExercise} disabled={exerciseTypes.length >= 2}
                          style={{ padding: "10px 16px", borderRadius: 14, border: "none", background: C.ink, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: exerciseTypes.length >= 2 ? 0.4 : 1 }}>추가</button>
                      </div>
                    )}

                    {/* 선택된 종목 표시 */}
                    {exerciseTypes.length > 0 && (
                      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                        {exerciseTypes.map(t => (
                          <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 14, background: C.pink, color: "#fff", fontSize: 12, fontWeight: 700 }}>
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
                                border: "none", background: on ? C.pink : C.tileOff, color: on ? "#fff" : C.sub }}>{t}</button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setExerciseDidIt(null)} style={{ marginTop: 4, border: "none", background: "transparent", color: C.sub, fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>‹ 다시 고르기</button>
                  </>
                )}
              </AccordionCard>

              {/* ━━━ 5. 한 줄 일기 ━━━ */}
              <Card title="한 줄 일기">
                <div style={{ display: "flex", gap: 8 }}>
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

              {/* ━━━ 6. 뻐근한 부위 ━━━ */}
              <Card title="뻐근한 부위">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", rowGap: 14, justifyItems: "center" }}>
                  {PARTS.map(p => <Tile key={p} content={p} on={sore.part === p} onClick={() => setSore(s => ({ ...s, part: s.part === p ? null : p }))} />)}
                </div>
                {sore.part && <>
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, margin: "14px 0 8px" }}>얼마나 불편했어요? ({sore.level})</div>
                  <input type="range" min="0" max="10" value={sore.level} onChange={e => setSore(s => ({ ...s, level: +e.target.value }))} style={{ width: "100%", accentColor: C.pink }} />
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, margin: "14px 0 8px" }}>언제 그러셨어요?</div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {WHEN_OPTS.map(w => <Chip key={w} label={w} on={sore.when === w} onClick={() => setSore(s => ({ ...s, when: w }))} />)}
                  </div>
                </>}
              </Card>
            </>
          )}

        </div>

        {/* ── 하단 고정 CTA 버튼 ── */}
        {phase === "form" && (
          <div style={{ flexShrink: 0, padding: "10px 14px 20px", background: `linear-gradient(transparent, ${C.bg} 20%)`, borderTop: `1px solid ${C.line}` }}>
            <button onClick={finishFlow} style={{ ...primaryBtn, background: C.sage, color: "#fff", opacity: dayMood ? 1 : 0.5 }} disabled={!dayMood}>이대로 기록하기</button>
          </div>
        )}

        {/* ── 완료 축하 팝업 (3초 뒤 자동으로 캘린더로 이동) ── */}
        {phase === "celebrate" && moodData && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(28,26,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30 }}>
            <div style={{ background: "#fff", borderRadius: 28, padding: "36px 32px", textAlign: "center", animation: "pop .4s ease-out", boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <Mallang v={moodData.v} size={72} />
              </div>
              <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0, color: C.ink }}>오늘 기록 완료!</h1>
              <p style={{ fontSize: 13.5, color: C.sub, margin: "8px 0 0" }}>오늘도 나를 채운 하루였어요 🌿</p>
            </div>
            <style>{`@keyframes pop{0%{transform:scale(.85);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>
          </div>
        )}

        {/* ── 환경설정(내 블럭 커스텀) ── */}
        {showSettings && (
          <BlockSettingsModal onClose={() => setShowSettings(false)} />
        )}
      </div>
    </div>
  );
}

// ============================================
// 헬퍼 컴포넌트
// ============================================

// 답변 전에는 질문 텍스트만, 답변하면 그 답의 아이콘+내용으로 바뀌는 제목.
function AccordionTitle({ question, answerIcon, answerText, muted }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15, fontWeight: 800, color: muted ? C.tileOffText : C.ink, lineHeight: 1.4, flex: 1, paddingRight: 12 }}>
      {answerIcon && (
        <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.pinkSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <DiaryIcon name={answerIcon} size={16} />
        </span>
      )}
      {answerText || question}
    </span>
  );
}

function AccordionCard({ question, answerIcon, answerText, expanded, onToggle, done, children }) {
  return (
    // flexShrink:0 필수 — 부모가 flex-direction:column인데 이 div에 overflow:hidden이 걸려 있으면
    // 플렉스 아이템의 자동 최소 높이가 auto 대신 0이 되어 버려서, 브라우저가 이 카드를 통째로
    // height:0으로 찌그러뜨리는 문제가 있었다(앉은 시간/수면/운동/스트레칭 카드가 안 보이고 클릭도 안 되던 원인).
    <div style={{ position: "relative", background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.02)", overflow: "hidden", flexShrink: 0 }}>
      <button onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
        <AccordionTitle question={question} answerIcon={answerIcon} answerText={answerText} />
        <span style={{ fontSize: 12, color: done ? C.sage : C.sub, fontWeight: 700, flexShrink: 0, transition: "transform .2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>
          {done && !expanded ? "✓" : "▾"}
        </span>
      </button>
      <div style={{ overflow: "hidden", maxHeight: expanded ? 700 : 0, transition: "max-height 0.35s ease" }}>
        <div style={{ padding: "0 24px 20px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: C.ink, margin: "0 0 16px" }}>{title}</h2>
      {children}
    </div>
  );
}

function Chip({ label, on, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{ flex: "0 0 auto", padding: "9px 15px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: disabled ? "default" : "pointer",
      border: "none", background: on ? C.pink : C.tileOff, color: on ? "#fff" : C.sub, opacity: disabled ? 0.35 : 1, transition: "all .15s" }}>
      {label}
    </button>
  );
}

// 답 선택 하나하나를 동그란 타일로 보여주는 공용 컴포넌트 — "하루콩" 벤치마킹의 핵심 패턴.
// content가 짧으면 큼직하게, 길면 두 줄까지 자동으로 줄여서 원 안에 담는다.
function fitTileFontSize(text) {
  const len = (text || "").length;
  if (len <= 1) return 19;
  if (len <= 2) return 15;
  if (len <= 4) return 11.5;
  return 10;
}

function Tile({ content, label, on, onClick, disabled, size = 60 }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        border: "none", background: "transparent", cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1, padding: 0, width: size + 12, flexShrink: 0,
      }}
    >
      <div style={{
        width: size, height: size, borderRadius: "50%", boxSizing: "border-box",
        background: on ? C.pink : C.tileOff,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 5,
        boxShadow: on ? "0 4px 14px rgba(255,107,157,0.35)" : "none",
        transition: "background .15s, box-shadow .15s",
      }}>
        <span style={{ fontSize: fitTileFontSize(content), fontWeight: 800, color: on ? "#fff" : C.sub, textAlign: "center", lineHeight: 1.15, wordBreak: "keep-all" }}>
          {content}
        </span>
      </div>
      {label && <span style={{ fontSize: 10, fontWeight: 700, color: on ? C.ink : C.sub, textAlign: "center", lineHeight: 1.2 }}>{label}</span>}
    </button>
  );
}

// 원 안에 2D 아이콘을 넣는 타일(시간대·감정·이유 등 실제 아이콘이 있는 항목용).
function EmojiTile({ icon, label, on, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer", padding: 0, flex: 1 }}>
      <div style={{
        width: 54, height: 54, borderRadius: "50%", background: on ? C.pink : C.tileOff,
        display: "flex", alignItems: "center", justifyContent: "center",
        filter: on ? "none" : "grayscale(0.4) opacity(0.85)",
        boxShadow: on ? "0 4px 14px rgba(255,107,157,0.35)" : "none", transition: "all .15s",
      }}>
        <DiaryIcon name={icon} size={28} />
      </div>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: on ? C.ink : C.sub, textAlign: "center", lineHeight: 1.2 }}>{label}</span>
    </button>
  );
}

// ============================================
// 내 블럭 커스텀 (환경설정)
// ============================================

const DEFAULT_BLOCKS = [
  { id: "mood", label: "오늘의 말랑이 기분", removable: false },
  { id: "sitting", label: "얼마나 앉았어요", removable: true },
  { id: "sleep", label: "얼마나 푹 잤나요", removable: true },
  { id: "exercise", label: "오늘 운동 했나요", removable: true },
  { id: "oneLine", label: "한 줄 일기", removable: true },
  { id: "sore", label: "뻐근한 부위", removable: true },
];

// 각 블럭의 실제 색·아이콘을 그대로 보여주는 미리보기.
function BlockPreview({ id }) {
  if (id === "mood") {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        {DAY_MOODS.map(m => (
          <div key={m.v} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: m.circleBg || m.fill, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mallang v={m.v} size={30} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (id === "sitting" || id === "sleep") {
    const opts = id === "sitting" ? SITTING_OPTS : SLEEP_OPTS;
    return (
      <div style={{ display: "flex", gap: 8 }}>
        {opts.map(o => (
          <div key={o.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.tileOff, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DiaryIcon name={o.icon} size={20} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.sub, textAlign: "center" }}>{o.label}</span>
          </div>
        ))}
      </div>
    );
  }
  if (id === "exercise") {
    return (
      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
        {[{ label: "안했어요!", icon: "restNo" }, { label: "했어요!", icon: "flex" }].map(o => (
          <div key={o.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.tileOff, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DiaryIcon name={o.icon} size={20} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.sub }}>{o.label}</span>
          </div>
        ))}
      </div>
    );
  }
  if (id === "oneLine") {
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {CATEGORIES.map(c => (
          <span key={c.id} style={{ padding: "7px 13px", borderRadius: 14, fontSize: 11.5, fontWeight: 700, background: c.bg, color: c.on, border: `1.5px solid ${c.border}` }}>{c.label}</span>
        ))}
      </div>
    );
  }
  if (id === "sore") {
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PARTS.slice(0, 5).map(p => (
          <span key={p} style={{ padding: "7px 13px", borderRadius: 14, fontSize: 11.5, fontWeight: 700, background: C.pinkSoft, color: C.pink }}>{p}</span>
        ))}
      </div>
    );
  }
  return null;
}

function BlockSettingsModal({ onClose }) {
  const [tab, setTab] = useState("active"); // active | hidden
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS.map(b => ({ ...b, hidden: false })));

  const activeBlocks = blocks.filter(b => !b.hidden);
  const hiddenBlocks = blocks.filter(b => b.hidden);

  const hideBlock = (id) => {
    if (window.confirm("숨긴 블럭으로 이동할까요?")) {
      setBlocks(bs => bs.map(b => b.id === id ? { ...b, hidden: true } : b));
    }
  };
  const showBlock = (id) => setBlocks(bs => bs.map(b => b.id === id ? { ...b, hidden: false } : b));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: C.bg, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 14px 8px", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", left: 6, width: 38, height: 38, borderRadius: "50%", border: "none", background: "transparent", color: C.ink, fontSize: 24, cursor: "pointer" }}>‹</button>
          <h1 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>내 블럭 커스텀</h1>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", padding: "10px 20px 0", gap: 24 }}>
          {[["active", "사용 중인 블럭"], ["hidden", "숨긴 블럭"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: "6px 0 12px", fontSize: 14.5, fontWeight: 800,
              color: tab === k ? C.sage : C.sub, borderBottom: tab === k ? `2px solid ${C.sage}` : "2px solid transparent" }}>{label}</button>
          ))}
        </div>

        {/* 목록 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {tab === "active" && activeBlocks.map(block => (
            <BlockCard key={block.id} block={block} onHide={block.removable ? () => hideBlock(block.id) : null} />
          ))}
          {tab === "hidden" && (
            hiddenBlocks.length === 0
              ? <p style={{ fontSize: 13, color: C.sub, textAlign: "center", marginTop: 20 }}>숨긴 블럭이 없어요.</p>
              : hiddenBlocks.map(block => (
                <BlockCard key={block.id} block={block} onShow={() => showBlock(block.id)} />
              ))
          )}
        </div>

        {/* 저장 */}
        <div style={{ padding: "10px 20px 24px" }}>
          <button onClick={onClose} style={{ ...primaryBtn, background: C.sage }}>변경 사항 저장</button>
        </div>
      </div>
    </div>
  );
}

function BlockCard({ block, onHide, onShow }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: "16px 18px 20px" }}>
      <div style={{ width: 36, height: 4, background: C.line, borderRadius: 4, margin: "0 auto 12px", cursor: "grab" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>{block.label}</span>
        {onHide && (
          <button onClick={onHide} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: C.pinkSoft, color: C.pink, fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>−</button>
        )}
        {onShow && (
          <button onClick={onShow} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: C.sageSoft, color: C.sage, fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>+</button>
        )}
      </div>
      <BlockPreview id={block.id} />
    </div>
  );
}

// ============================================
// 스타일
// ============================================

const primaryBtn = { width: "100%", padding: 17, borderRadius: 16, border: "none", background: C.ink, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer" };
