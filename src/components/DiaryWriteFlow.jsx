import { useState } from "react";
import { Mallang } from "./Mallang";
import MallangStressPopup from "./MallangStressPopup";
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

// ── 평소보다 무리한 이유 ──
const OVEREXERT_REASONS = [
  { label: "오래 앉음", icon: "chair" },
  { label: "오래 선 자세", icon: "standing" },
  { label: "많이 걸음", icon: "walk" },
  { label: "무거운 물건 들기", icon: "heavyLift" },
];

// ── 수면의 질 ──
const SLEEP_OPTS = [
  { label: "밤을 새웠어요", icon: "allNighter" },
  { label: "뒤척였어요", icon: "toss" },
  { label: "그냥 그랬어요", icon: "mehMoon" },
  { label: "푹 잤어요", icon: "sleepWell" },
];

// ── 운동 카테고리 (개인 집중형에 스트레칭 포함) ──
const EXERCISE_CATS = [
  { name: "개인 집중형 (실내)", items: ["헬스·PT", "요가", "필라테스", "스트레칭", "명상·호흡", "수영"] },
  { name: "야외 활동형 (실외)", items: ["걷기/산책", "러닝·조깅", "자전거", "등산"] },
  { name: "그룹 및 파트너형", items: ["축구", "농구", "배드민턴", "테니스", "크로스핏", "댄스"] },
];

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
const WHEN_OPTS = ["오늘 아침 일어날 때", "움직일 때", "오래 앉아있을 때", "오래 서있을 때", "하루 종일"];

// ── 받침 유무로 이/가 조사 고르는 헬퍼 ──
function hasBatchim(word) {
  if (!word) return false;
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xAC00 || code > 0xD7A3) return false;
  return (code - 0xAC00) % 28 !== 0;
}
const CATEGORIES = [
  { id: "exercise", label: "운동습관", on: "#3F9F5B", bg: "#E4F5E7", border: "#B6E4C0", ph: "예: 🧍🏻‍♀️아침마다 50점프 챌린지 하기로 했다." },
  { id: "daily", label: "일상", on: "#B8912A", bg: "#FDF6D3", border: "#F2E3A0", ph: "예: 🛍️ 퇴근하고 친구랑 만나서 저녁 먹고 카페 갔다." },
  { id: "worry", label: "고민", on: "#8A3FD1", bg: "#F0E6FB", border: "#DAC2F5", ph: "예: 요즘 어깨가 자꾸 뭉치는데 신경 쓰여요 😭" },
];

// ── 말랑이의 발견(월간 리포트, mallangReportEngine.js)이 기대하는 key로 바꾸는 표 ──
// 이 화면의 라벨과 엔진의 key가 순서상 1:1로 대응한다.
const OVEREXERT_LOAD_KEY = { "오래 앉음": "sit", "오래 선 자세": "stand", "많이 걸음": "walk", "무거운 물건 들기": "lift" };
const EXERCISE_REASON_KEY = { "바빴어요": "busy", "피곤해요": "tired", "몸이 안 좋아요": "sick", "그냥 쉬고 싶었어요": "rest", "깜빡했어요": "forgot" };
const PART_KEY = { "목": "neck", "어깨": "shoulder", "등": "back", "허리": "waist", "손목": "wrist", "무릎": "knee", "골반": "pelvis", "발목": "ankle" };
const WHEN_KEY = { "오늘 아침 일어날 때": "morning", "움직일 때": "moving", "오래 앉아있을 때": "sitting", "오래 서있을 때": "standing", "하루 종일": "allday" };
const EXERCISE_TYPE_KEY = {
  "헬스·PT": "gym", "요가": "yoga", "필라테스": "pilates", "스트레칭": "stretch", "명상·호흡": "meditation", "수영": "swim",
  "걷기/산책": "walk", "러닝·조깅": "run", "자전거": "bike", "등산": "hike",
  "축구": "soccer", "농구": "basketball", "배드민턴": "badminton", "테니스": "tennis", "크로스핏": "crossfit", "댄스": "dance",
};

// ============================================
// 메인 컴포넌트
// ============================================
export default function DiaryWriteFlow({ onClose, onFinish, initialPhase = "form", initialDayMood = null, targetDate = null, charImage = null }) {
  const [phase, setPhase] = useState(initialPhase === "day" || initialPhase === "work" ? "form" : initialPhase);

  // ── 데이터 ──
  const [dayMood, setDayMood] = useState(initialDayMood);

  // 평소보다 무리했는지
  const [overexertVal, setOverexertVal] = useState(null); // null | 'no' | 'yes'
  const [overexertPick, setOverexertPick] = useState(null); // OVEREXERT_REASONS 중 하나 | 'other' | null
  const [overexertOther, setOverexertOther] = useState("");
  // 수면의 질
  const [sleepVal, setSleepVal] = useState(null);

  // 운동
  const [exerciseDidIt, setExerciseDidIt] = useState(null); // null | 'no' | 'yes'
  const [exerciseReason, setExerciseReason] = useState(null); // 안 했을 때 이유
  const [exerciseTypes, setExerciseTypes] = useState([]); // max 2
  const [customExercise, setCustomExercise] = useState("");
  const [showCustomExercise, setShowCustomExercise] = useState(false);

  // 한 줄 일기
  const [oneLine, setOneLine] = useState({ cat: "daily", text: "" });
  // 뻐근한 부위
  const [sore, setSore] = useState({ parts: [], level: 5, whens: {}, whenOthers: {} });

  const selDate = targetDate ? new Date(`${targetDate}T00:00:00`) : new Date();
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

  // 기록 저장 → 말랑이 스트레스 해소 팝업 → '다음'을 누르면 캘린더로 복귀
  // 말랑이의 발견(월간 리포트, mallangReportEngine.js)이 sleep/overwork/exercise/soreness/note를
  // 읽어야 하는데, 지금까지는 이 화면에서 모은 답변이 mood만 저장되고 나머지는 버려지고 있었다.
  // 여기서 리포트 엔진이 기대하는 형태로 변환해 onFinish로 같이 넘긴다.
  const buildEntryExtra = () => {
    const sleep = SLEEP_OPTS.findIndex(o => o.label === sleepVal);
    const overwork = overexertVal === "yes"
      ? { yes: true, loads: [OVEREXERT_LOAD_KEY[overexertPick] || "etc"] }
      : overexertVal === "no" ? { yes: false, loads: [] } : null;
    const exercise = exerciseDidIt === "yes"
      ? { did: true, types: exerciseTypes.map(t => EXERCISE_TYPE_KEY[t] || t).slice(0, 2) }
      : exerciseDidIt === "no" ? { did: false, reason: EXERCISE_REASON_KEY[exerciseReason] || "forgot" } : null;
    const soreness = sore.parts.map(p => ({
      part: PART_KEY[p] || "back",
      level: sore.level,
      situation: (sore.whens[p] === "기타" ? "etc" : WHEN_KEY[sore.whens[p]]) || "etc",
    }));
    const noteText = oneLine.text.trim();
    const note = noteText ? { category: CATEGORIES.find(c => c.id === oneLine.cat)?.label, text: noteText } : null;
    return { sleep: sleep >= 0 ? sleep : null, overwork, exercise, soreness, note };
  };

  const finishFlow = () => {
    if (onFinish) onFinish(dayMood, buildEntryExtra());
    setPhase("celebrate");
  };

  // ── 운동 종목 토글 (최대 2) ──
  const toggleExerciseType = (type) => {
    setExerciseTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
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
  const pickOverexertNo = () => {
    setOverexertVal("no");
    setOverexertPick(null);
    setOverexertOther("");
    setTimeout(() => setExpanded(e => ({ ...e, sitting: false })), 250);
  };
  const pickOverexertReason = (r) => {
    setOverexertPick(r);
    if (r !== "other") {
      setTimeout(() => setExpanded(e => ({ ...e, sitting: false })), 250);
    }
  };
  const confirmOverexertOther = () => {
    if (!overexertOther.trim()) return;
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

  // 운동 완료 체크 — 안 했으면 이유 선택, 했으면 종목 하나 이상 선택
  const exerciseComplete = exerciseDidIt === "no"
    ? !!exerciseReason
    : exerciseDidIt === "yes"
      ? exerciseTypes.length > 0
      : false;

  // 무리했는지 완료 체크 — 아니요는 바로 완료, 맞아요는 이유(또는 직접 입력)까지 골라야 완료
  const overexertReason = overexertPick === "other" ? overexertOther.trim() : overexertPick;
  const overexertComplete = overexertVal === "no" || (overexertVal === "yes" && !!overexertReason);
  let overexertAnswerText = null;
  if (overexertVal === "no") overexertAnswerText = "무리하지 않았어요";
  else if (overexertVal === "yes" && overexertReason) overexertAnswerText = overexertReason;

  // ── 선택하면 제목 자리에 아이콘+내용으로 바뀌는 답변 정보 ──
  const sleepOpt = SLEEP_OPTS.find(o => o.label === sleepVal);
  const exerciseReasonOpt = NO_EXERCISE_REASONS.find(r => r.label === exerciseReason);

  let exerciseAnswerIcon = null;
  let exerciseAnswerText = null;
  if (exerciseDidIt === "no" && exerciseReasonOpt) {
    exerciseAnswerIcon = exerciseReasonOpt.icon;
    exerciseAnswerText = `오늘은 ${exerciseReasonOpt.label}`;
  } else if (exerciseDidIt === "yes" && exerciseComplete) {
    exerciseAnswerIcon = "flex";
    exerciseAnswerText = `오늘 ${exerciseTypes.join(", ")} 했어요`;
  }

  // 뻐근한 부위 헤드라인 — 부위마다 시점이 다를 수 있어 부위별로 문장을 따로 만들어 이어붙인다.
  const soreClauses = sore.parts.map(p => {
    const w = sore.whens[p] === "기타" ? (sore.whenOthers[p] || "").trim() : sore.whens[p];
    if (!w) return null;
    return `${w} ${p}${hasBatchim(p) ? "이" : "가"} ${sore.level}정도로 불편했`;
  }).filter(Boolean);
  const soreHeadline = soreClauses.length > 0
    ? soreClauses.map((c, i) => i === soreClauses.length - 1 ? `${c}어요` : `${c}고, `).join("")
    : null;

  // ── 말랑이 기분 ──
  const moodData = DAY_MOODS.find(m => m.v === dayMood);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: C.bg, display: "flex", justifyContent: "center", fontFamily: F, color: C.ink }}>
      <div style={{ width: "100%", maxWidth: 420, height: "100%", background: C.bg, position: "relative", display: "flex", flexDirection: "column" }}>

        {/* ── 헤더 ── */}
        {phase === "form" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 14px", background: C.bg, flexShrink: 0, position: "relative" }}>
          <button onClick={goBack} style={{ position: "absolute", left: 6, width: 38, height: 38, borderRadius: "50%", border: "none", background: "transparent", color: C.ink, fontSize: 24, cursor: "pointer" }}>‹</button>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 16, fontWeight: 800, color: C.ink }}>
            {selDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
          </span>
          <button onClick={() => setShowSettings(true)} style={{ position: "absolute", right: 10, width: 38, height: 38, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <DiaryIcon name="gear" size={22} />
          </button>
        </div>
        )}

        {/* ── 스크롤 영역 ── */}
        <div className="thin-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "14px 14px 100px", display: "flex", flexDirection: "column", gap: 14 }}>
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
                            <Mallang v={m.v} size={38} />
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

              {/* ━━━ 2. 평소보다 무리했나요 (아코디언) ━━━ */}
              <AccordionCard question="오늘 평소보다 무리했나요?" answerText={overexertAnswerText}
                expanded={expanded.sitting} onToggle={() => toggle("sitting")} done={overexertComplete}>
                {(overexertVal === null || overexertVal === "no") && (
                  <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "8px 0 4px" }}>
                    <EmojiTile icon="restNo" label="아니요!" on={overexertVal === "no"} onClick={pickOverexertNo} />
                    <EmojiTile icon="flex" label="맞아요!" on={false} onClick={() => setOverexertVal("yes")} />
                  </div>
                )}

                {overexertVal === "yes" && (
                  <>
                    <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginBottom: 10 }}>어떻게 무리했어요?</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", rowGap: 14, justifyItems: "center" }}>
                      {OVEREXERT_REASONS.map(r => (
                        <EmojiTile key={r.label} icon={r.icon} label={r.label} on={overexertPick === r.label} onClick={() => pickOverexertReason(r.label)} />
                      ))}
                      <EmojiTile icon="editPencil" label="기타(직접 입력)" on={overexertPick === "other"} onClick={() => pickOverexertReason("other")} />
                    </div>
                    {overexertPick === "other" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <input value={overexertOther} onChange={e => setOverexertOther(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && confirmOverexertOther()}
                          placeholder="짧게 적어주세요 (예: 무거운 짐 옮기기)"
                          style={{ flex: 1, padding: "10px 14px", borderRadius: 14, border: `1px solid ${C.line}`, fontSize: 14, outline: "none", fontFamily: F }} />
                        <button onClick={confirmOverexertOther} disabled={!overexertOther.trim()}
                          style={{ padding: "10px 16px", borderRadius: 14, border: "none", background: C.ink, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: overexertOther.trim() ? 1 : 0.4 }}>확인</button>
                      </div>
                    )}
                    <button onClick={() => { setOverexertVal(null); setOverexertPick(null); setOverexertOther(""); }} style={{ marginTop: 14, border: "none", background: "transparent", color: C.sub, fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>‹ 다시 고르기</button>
                  </>
                )}
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
                        <EmojiTile key={r.label} icon={r.icon} label={r.label} on={exerciseReason === r.label} onClick={() => pickExerciseReason(r.label)} iconSize={36} />
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

              {/* ━━━ 6. 뻐근한 부위 (최대 2군데) ━━━ */}
              <Card title="뻐근한 부위">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", rowGap: 14, justifyItems: "center" }}>
                  {PARTS.map(p => {
                    const on = sore.parts.includes(p);
                    const disabled = !on && sore.parts.length >= 2;
                    return (
                      <Tile key={p} content={p} on={on} disabled={disabled} onClick={() => setSore(s => ({
                        ...s,
                        parts: s.parts.includes(p) ? s.parts.filter(x => x !== p) : (s.parts.length >= 2 ? s.parts : [...s.parts, p]),
                      }))} />
                    );
                  })}
                </div>
                {sore.parts.length > 0 && <>
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, margin: "14px 0 8px" }}>얼마나 불편했어요? ({sore.level})</div>
                  <input type="range" min="0" max="10" value={sore.level} onChange={e => setSore(s => ({ ...s, level: +e.target.value }))} style={{ width: "100%", accentColor: C.pink }} />

                  {sore.parts.map(p => (
                    <div key={p}>
                      <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, margin: "14px 0 8px" }}>{p}{hasBatchim(p) ? "은" : "는"} 언제 그러셨어요?</div>
                      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                        {WHEN_OPTS.map(w => (
                          <Chip key={w} label={w} on={sore.whens[p] === w} onClick={() => setSore(s => ({ ...s, whens: { ...s.whens, [p]: w } }))} />
                        ))}
                        <Chip label="기타" on={sore.whens[p] === "기타"} onClick={() => setSore(s => ({ ...s, whens: { ...s.whens, [p]: "기타" } }))} />
                      </div>
                      {sore.whens[p] === "기타" && (
                        <input value={sore.whenOthers[p] || ""} onChange={e => setSore(s => ({ ...s, whenOthers: { ...s.whenOthers, [p]: e.target.value } }))}
                          placeholder="예: 계단 오를 때"
                          style={{ width: "100%", marginTop: 8, padding: "10px 14px", borderRadius: 14, border: `1px solid ${C.line}`, fontSize: 14, outline: "none", fontFamily: F, boxSizing: "border-box" }} />
                      )}
                    </div>
                  ))}

                  {soreHeadline && (
                    <div style={{ marginTop: 14, padding: "12px 14px", background: C.sageSoft, borderRadius: 14, fontSize: 13, color: C.ink, fontWeight: 700, lineHeight: 1.5 }}>
                      "{soreHeadline}"
                    </div>
                  )}
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

        {/* ── 완료 팝업 — 캐릭터가 말랑이를 눌러보라고 채팅하듯 안내 ── */}
        {phase === "celebrate" && moodData && (
          <MallangStressPopup mood={moodData.v} charImage={charImage} nextLabel="완료" onNext={() => { if (onClose) onClose(); }} />
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
function EmojiTile({ icon, label, on, onClick, iconSize = 28 }) {
  return (
    <button onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer", padding: 0, flex: 1 }}>
      <div style={{
        width: 54, height: 54, borderRadius: "50%", background: on ? C.pink : C.tileOff,
        display: "flex", alignItems: "center", justifyContent: "center",
        filter: on ? "none" : "grayscale(0.4) opacity(0.85)",
        boxShadow: on ? "0 4px 14px rgba(255,107,157,0.35)" : "none", transition: "all .15s",
      }}>
        <DiaryIcon name={icon} size={iconSize} />
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
  { id: "sitting", label: "오늘 평소보다 무리했나요", removable: true },
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
  if (id === "sitting") {
    return (
      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
        {[{ label: "아니요!", icon: "restNo" }, { label: "맞아요!", icon: "flex" }].map(o => (
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
  if (id === "sleep") {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        {SLEEP_OPTS.map(o => (
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
