import { useState, useRef } from "react";
import { Mallang } from "./Mallang";
import MallangStressPopup from "./MallangStressPopup";
import { DiaryIcon } from "./DiaryIcons";
import { MOODS as DAY_MOODS } from "../data";
import {
  SLEEP_LABELS, OVEREXERT_LOAD_KEY, EXERCISE_REASON_KEY, PART_KEY, WHEN_KEY, EXERCISE_TYPE_KEY,
  LOAD_TO_OVEREXERT_LABEL, REASON_TO_EXERCISE_LABEL, KEY_TO_PART_LABEL, KEY_TO_WHEN_LABEL, KEY_TO_EXERCISE_TYPE_LABEL,
} from "../lib/diaryEntryLabels";

// ============================================
// BMTI 하루일기 작성 플로우
// 한 페이지 스크롤 + 아코디언 구조 — 전체화면
// ============================================

// 색감·톤은 사이트 전체(BMTI 하루일기 온보딩·캘린더, BMTI 라이브)와 통일한다.
const C = {
  bg: "#FFFFFF", card: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2",
  pink: "#FF6B9D", pinkSoft: "#FFEDF3", sage: "#5F8A76", sageSoft: "#E9F1EC",
  tileOff: "#F3F1EC", tileOffText: "#B7B2A9",
  ocherSoft: "#F3E7D2", blueGraySoft: "#E3EAF0",
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

// 블럭 켜고 끄기 — 메인 화면에서 직접 길게 눌러 순서를 바꾸고 숨기는 방식(별도 설정 화면 없음).
// "기분" 블럭은 항상 맨 위 고정, 나머지 5개만 순서 변경·숨기기 대상이다.
const REORDERABLE_LABEL = {
  sitting: "오늘 평소보다 무리했나요",
  sleep: "얼마나 푹 잤나요",
  exercise: "오늘 운동 했나요",
  oneLine: "한 줄 일기",
  sore: "뻐근한 부위",
};

// 길게 누르면(500ms) onFire를 호출하고, 그 전에 손을 떼면 원래 탭 동작(아코디언 펼치기 등)이
// 그대로 진행되게 한다. 편집 모드에 들어간 경우에만 onClickCapture로 원래 클릭을 막는다.
function makeLongPress(onFire) {
  let timer = null;
  let fired = false;
  return {
    onPointerDown: () => { fired = false; timer = setTimeout(() => { fired = true; onFire(); }, 500); },
    onPointerUp: () => { if (timer) clearTimeout(timer); },
    onPointerLeave: () => { if (timer) clearTimeout(timer); },
    onClickCapture: (e) => { if (fired) { e.preventDefault(); e.stopPropagation(); } },
  };
}

// ============================================
// 메인 컴포넌트
// ============================================
// initialEntry: 캘린더에서 '이전 기록 수정하기'로 들어온 경우, 그날 저장돼있던 전체 기록
// (mallangReportEngine.js가 쓰는 key 형태 그대로) — 이 화면의 라벨로 되돌려 폼을 미리 채운다.
export default function DiaryWriteFlow({ onClose, onFinish, initialPhase = "form", initialDayMood = null, targetDate = null, charImage = null, initialEntry = null }) {
  const [phase, setPhase] = useState(initialPhase === "day" || initialPhase === "work" ? "form" : initialPhase);

  // ── 데이터 ──
  const [dayMood, setDayMood] = useState(initialDayMood);

  // 평소보다 무리했는지
  const [overexertVal, setOverexertVal] = useState(() => (initialEntry?.overwork ? (initialEntry.overwork.yes ? "yes" : "no") : null));
  const [overexertPick, setOverexertPick] = useState(() => {
    const load = initialEntry?.overwork?.loads?.[0];
    if (!load) return null;
    return LOAD_TO_OVEREXERT_LABEL[load] || "other";
  });
  const [overexertOther, setOverexertOther] = useState("");
  // 수면의 질
  const [sleepVal, setSleepVal] = useState(() => (initialEntry?.sleep != null ? SLEEP_LABELS[initialEntry.sleep] : null));

  // 운동
  const [exerciseDidIt, setExerciseDidIt] = useState(() => (initialEntry?.exercise ? (initialEntry.exercise.did ? "yes" : "no") : null));
  const [exerciseReason, setExerciseReason] = useState(() => (
    initialEntry?.exercise?.did === false ? (REASON_TO_EXERCISE_LABEL[initialEntry.exercise.reason] || null) : null
  ));
  const [exerciseTypes, setExerciseTypes] = useState(() => (
    initialEntry?.exercise?.did === true ? (initialEntry.exercise.types || []).map(t => KEY_TO_EXERCISE_TYPE_LABEL[t] || t).slice(0, 2) : []
  ));
  const [customExercise, setCustomExercise] = useState("");
  const [showCustomExercise, setShowCustomExercise] = useState(false);

  // 한 줄 일기
  const [oneLine, setOneLine] = useState(() => {
    if (!initialEntry?.note) return { cat: "daily", text: "" };
    const cat = CATEGORIES.find(c => c.label === initialEntry.note.category)?.id || "daily";
    return { cat, text: initialEntry.note.text || "" };
  });
  // 뻐근한 부위
  const [sore, setSore] = useState(() => {
    if (!initialEntry?.soreness?.length) return { parts: [], level: 5, whens: {}, whenOthers: {} };
    const parts = initialEntry.soreness.map(s => KEY_TO_PART_LABEL[s.part] || s.part).slice(0, 2);
    const whens = {};
    initialEntry.soreness.forEach(s => {
      const p = KEY_TO_PART_LABEL[s.part] || s.part;
      whens[p] = KEY_TO_WHEN_LABEL[s.situation] || "기타";
    });
    return { parts, level: initialEntry.soreness[0]?.level ?? 5, whens, whenOthers: {} };
  });

  const selDate = targetDate ? new Date(`${targetDate}T00:00:00`) : new Date();

  // 블럭 순서·숨김·편집 모드
  const [blockOrder, setBlockOrder] = useState(["sitting", "sleep", "exercise", "oneLine", "sore"]);
  const [hiddenBlocks, setHiddenBlocks] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const blocksContainerRef = useRef(null);
  const orderRef = useRef(blockOrder);
  orderRef.current = blockOrder;
  const dragIdRef = useRef(null);

  const handleDragMove = (e) => {
    const id = dragIdRef.current;
    if (!id || !blocksContainerRef.current) return;
    const y = e.clientY;
    const slots = Array.from(blocksContainerRef.current.querySelectorAll("[data-block-id]"));
    const current = orderRef.current;
    const draggedIdx = current.indexOf(id);
    for (const slot of slots) {
      const otherId = slot.getAttribute("data-block-id");
      if (otherId === id) continue;
      const rect = slot.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const otherIdx = current.indexOf(otherId);
      const crossedDown = y > mid && draggedIdx < otherIdx;
      const crossedUp = y < mid && draggedIdx > otherIdx;
      if (crossedDown || crossedUp) {
        const next = [...current];
        next.splice(draggedIdx, 1);
        const insertAt = next.indexOf(otherId) + (crossedDown ? 1 : 0);
        next.splice(insertAt, 0, id);
        setBlockOrder(next);
        break;
      }
    }
  };
  const handleDragEnd = () => {
    dragIdRef.current = null;
    setDraggingId(null);
    window.removeEventListener("pointermove", handleDragMove);
    window.removeEventListener("pointerup", handleDragEnd);
  };
  const handleDragStart = (id) => (e) => {
    e.preventDefault();
    dragIdRef.current = id;
    setDraggingId(id);
    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  };
  const toggleHideBlock = (id) => setHiddenBlocks(hs => hs.includes(id) ? hs.filter(x => x !== id) : [...hs, id]);
  const enterEditMode = () => setEditMode(true);

  // 아코디언 (true = 펼쳐진 상태) — 이미 답이 있는 항목은 접어서 보여준다.
  const [expanded, setExpanded] = useState({
    mood: !initialDayMood,
    sitting: !initialEntry?.overwork,
    sleep: initialEntry?.sleep == null,
    exercise: !initialEntry?.exercise,
  });
  const toggle = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  const F = "'Pretendard', -apple-system, sans-serif";

  // 나가기 전 저장 여부 확인 — 처음 화면을 열었을 때의 답변 상태를 스냅샷으로 남겨두고,
  // 뒤로가기를 누른 시점에 지금 답변과 비교해서 실제로 바뀐 게 있을 때만 경고를 띄운다.
  const snapshotAnswers = () => JSON.stringify({
    dayMood, overexertVal, overexertPick, overexertOther, sleepVal,
    exerciseDidIt, exerciseReason, exerciseTypes, oneLine, sore,
  });
  const initialSnapshotRef = useRef(null);
  if (initialSnapshotRef.current === null) initialSnapshotRef.current = snapshotAnswers();
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);

  const goBack = () => {
    if (phase !== "form") return;
    if (snapshotAnswers() !== initialSnapshotRef.current) {
      setShowLeaveWarning(true);
      return;
    }
    if (onClose) onClose();
  };
  const discardAndLeave = () => { setShowLeaveWarning(false); if (onClose) onClose(); };

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

  // 순서 변경·숨기기 대상 5개 블럭의 실제 내용 — 기존 아코디언/카드 내용 그대로,
  // id로 매핑해서 blockOrder 순서대로 그릴 수 있게 한다.
  const renderBlockContent = (id) => {
    if (id === "sitting") {
      return (
        <AccordionCard question="오늘 평소보다 무리했나요?" answerText={overexertAnswerText}
          expanded={expanded.sitting} onToggle={() => toggle("sitting")} done={overexertComplete}>
          {(overexertVal === null || overexertVal === "no") && (
            <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "8px 0 4px" }}>
              <EmojiTile icon="restNo" label="아니요!" on={overexertVal === "no"} onClick={pickOverexertNo} tint={C.ocherSoft} />
              <EmojiTile icon="flex" label="맞아요!" on={false} onClick={() => setOverexertVal("yes")} tint={C.ocherSoft} />
            </div>
          )}

          {overexertVal === "yes" && (
            <>
              <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginBottom: 10 }}>어떻게 무리했어요?</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", rowGap: 14, justifyItems: "center" }}>
                {OVEREXERT_REASONS.map(r => (
                  <EmojiTile key={r.label} icon={r.icon} label={r.label} on={overexertPick === r.label} onClick={() => pickOverexertReason(r.label)} tint={C.ocherSoft} />
                ))}
                <EmojiTile icon="editPencil" label="기타(직접 입력)" on={overexertPick === "other"} onClick={() => pickOverexertReason("other")} tint={C.ocherSoft} />
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
      );
    }
    if (id === "sleep") {
      return (
        <AccordionCard question="얼마나 푹 잤나요?" answerIcon={sleepOpt?.icon} answerText={sleepVal}
          expanded={expanded.sleep} onToggle={() => toggle("sleep")} done={!!sleepVal}>
          <div style={{ display: "flex", gap: 6 }}>
            {SLEEP_OPTS.map(opt => (
              <EmojiTile key={opt.label} icon={opt.icon} label={opt.label} on={sleepVal === opt.label} onClick={() => handleSleepPick(opt)} tint={C.blueGraySoft} />
            ))}
          </div>
        </AccordionCard>
      );
    }
    if (id === "exercise") {
      return (
        <AccordionCard question="오늘 운동 했나요?" answerIcon={exerciseAnswerIcon} answerText={exerciseAnswerText}
          expanded={expanded.exercise} onToggle={() => toggle("exercise")} done={exerciseComplete}>
          {exerciseDidIt === null && (
            <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "8px 0 4px" }}>
              <EmojiTile icon="restNo" label="안했어요!" on={false} onClick={() => setExerciseDidIt("no")} tint={C.sageSoft} />
              <EmojiTile icon="flex" label="했어요!" on={false} onClick={() => setExerciseDidIt("yes")} tint={C.sageSoft} />
            </div>
          )}

          {exerciseDidIt === "no" && (
            <>
              <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginBottom: 10 }}>오늘은 어떤 이유였어요?</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", rowGap: 14, justifyItems: "center" }}>
                {NO_EXERCISE_REASONS.map(r => (
                  <EmojiTile key={r.label} icon={r.icon} label={r.label} on={exerciseReason === r.label} onClick={() => pickExerciseReason(r.label)} iconSize={36} tint={C.sageSoft} />
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
                      return <Tile key={type} content={type} on={on} onClick={() => toggleExerciseType(type)} disabled={disabled} size={62} tint={C.sageSoft} />;
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
      );
    }
    if (id === "oneLine") {
      return (
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
      );
    }
    if (id === "sore") {
      return (
        <Card title="뻐근한 부위">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", rowGap: 14, justifyItems: "center" }}>
            {PARTS.map(p => {
              const on = sore.parts.includes(p);
              const disabled = !on && sore.parts.length >= 2;
              return (
                <Tile key={p} content={p} on={on} disabled={disabled} tint={C.pinkSoft} onClick={() => setSore(s => ({
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
      );
    }
    return null;
  };

  const visibleOrder = editMode ? blockOrder : blockOrder.filter(id => !hiddenBlocks.includes(id));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: C.bg, display: "flex", justifyContent: "center", fontFamily: F, color: C.ink }}>
      <div style={{ width: "100%", maxWidth: 420, height: "100%", background: C.bg, position: "relative", display: "flex", flexDirection: "column" }}>

        {/* ── 헤더 ── */}
        {phase === "form" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 14px", background: C.bg, flexShrink: 0, position: "relative" }}>
          <button onClick={goBack} style={{ position: "absolute", left: 6, width: 38, height: 38, borderRadius: "50%", border: "none", background: "transparent", color: C.ink, fontSize: 24, cursor: "pointer" }}>‹</button>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 800, color: C.ink, background: C.tileOff, borderRadius: 999, padding: "8px 16px" }}>
            {selDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
          </span>
          <button onClick={() => setEditMode(v => !v)} style={{ position: "absolute", right: 10, border: "none", background: "transparent", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", padding: "6px 8px", color: editMode ? C.sage : C.sub }}>
            {editMode ? (
              <span style={{ fontSize: 13, fontWeight: 800 }}>완료</span>
            ) : (
              <>
                <DiaryIcon name="gear" size={19} />
                <span style={{ fontSize: 11.5, fontWeight: 700 }}>편집</span>
              </>
            )}
          </button>
        </div>
        )}

        {/* ── 스크롤 영역 ── */}
        <div className="thin-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "14px 14px 100px", display: "flex", flexDirection: "column", gap: 14 }}>
          {phase === "form" && (
            <>
              {/* ━━━ 오늘의 말랑이 기분 — 항상 맨 위 고정, 순서변경/숨기기 대상 아님 ━━━ */}
              <div
                style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}
                {...(editMode ? {} : makeLongPress(enterEditMode))}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: C.ink, margin: 0 }}>오늘의 말랑이 기분은</h2>
                  {dayMood && !expanded.mood && moodData && (
                    <div style={{ width: 44, height: 44, borderRadius: "30%", background: moodData.circleBg || moodData.fill, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Mallang v={moodData.v} size={34} />
                    </div>
                  )}
                </div>
                {/* 펼쳐진 상태 */}
                <div style={{ overflow: "hidden", maxHeight: expanded.mood ? 200 : 0, transition: "max-height 0.35s ease", marginTop: expanded.mood ? 8 : 0 }}>
                  <p style={{ fontSize: 12, color: C.sub, margin: "0 0 8px" }}>지금 마음에 가장 가까운 표정을 골라주세요.</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 6 }}>
                    {DAY_MOODS.map(m => {
                      const on = dayMood === m.v;
                      const circleBg = m.circleBg || m.fill;
                      // 고른 표정만 커지고 나머지는 작아져서, 균일한 크기의 원 5개가 늘어선
                      // 모양이 아니라 "고른 걸 도드라지게" 보여주는 위계가 생기게 한다.
                      const badgeSize = on ? 62 : 44;
                      const mallangSize = on ? 44 : 30;
                      return (
                        <button key={m.v} onClick={() => { setDayMood(m.v); setTimeout(() => setExpanded(e => ({ ...e, mood: false })), 300); }}
                          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "6px 0", borderRadius: 16, border: "none", background: "transparent", cursor: "pointer" }}>
                          <div style={{ width: badgeSize, height: badgeSize, borderRadius: "30%", background: on ? circleBg : C.tileOff, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: on ? `0 6px 16px ${circleBg}99` : "none", transition: "all .2s cubic-bezier(.34,1.4,.64,1)" }}>
                            <Mallang v={m.v} size={mallangSize} />
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

              {/* ━━━ 순서 변경·숨기기 가능한 5개 블럭 ━━━ */}
              <div ref={blocksContainerRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {visibleOrder.map(id => {
                  const hidden = hiddenBlocks.includes(id);
                  return (
                    <div
                      key={id}
                      data-block-id={id}
                      style={{ flexShrink: 0, opacity: hidden ? 0.4 : draggingId === id ? 0.55 : 1, transition: "opacity .15s" }}
                      {...(editMode ? {} : makeLongPress(enterEditMode))}
                    >
                      {editMode && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 2px 8px" }}>
                          <span onPointerDown={handleDragStart(id)} style={{ touchAction: "none", cursor: "grab", fontSize: 17, color: C.sub, padding: "6px 8px", lineHeight: 1 }}>⠿</span>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.sub }}>{REORDERABLE_LABEL[id]}</span>
                          <button onClick={() => toggleHideBlock(id)} style={{
                            width: 26, height: 26, borderRadius: "50%", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 800, lineHeight: 1,
                            background: hidden ? C.sageSoft : C.pinkSoft, color: hidden ? C.sage : C.pink,
                          }}>
                            {hidden ? "+" : "−"}
                          </button>
                        </div>
                      )}
                      <div style={{ pointerEvents: editMode ? "none" : "auto" }}>
                        {renderBlockContent(id)}
                      </div>
                    </div>
                  );
                })}
              </div>
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

        {/* ── 나가기 전 확인 — 저장 안 한 답변이 있을 때만 뜬다 ── */}
        {showLeaveWarning && (
          <div onClick={() => setShowLeaveWarning(false)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(28,26,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 320, background: "#fff", borderRadius: 22, padding: "26px 22px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, lineHeight: 1.5 }}>지금 나가면 작성하던<br />내용이 사라져요</div>
              <p style={{ fontSize: 13, color: C.sub, fontWeight: 600, margin: "8px 0 20px" }}>그래도 나가시겠어요?</p>
              <button onClick={() => setShowLeaveWarning(false)} style={{ width: "100%", padding: 15, borderRadius: 15, border: "none", background: C.sage, color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>
                계속 쓸게요
              </button>
              <button onClick={discardAndLeave} style={{ width: "100%", padding: 12, borderRadius: 15, border: "none", background: "transparent", color: C.sub, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                나갈래요
              </button>
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

function Tile({ content, label, on, onClick, disabled, size = 60, tint = C.tileOff }) {
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
        width: size, height: size, borderRadius: "32%", boxSizing: "border-box",
        background: on ? C.pink : tint,
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
// tint: 꺼진 상태의 배지 배경 — 블럭마다 고유한 톤을 줘서 획일적인 회색 원으로 안 보이게 한다.
function EmojiTile({ icon, label, on, onClick, iconSize = 28, tint = C.tileOff }) {
  return (
    <button onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer", padding: 0, flex: 1 }}>
      <div style={{
        width: 54, height: 54, borderRadius: "32%", background: on ? C.pink : tint,
        display: "flex", alignItems: "center", justifyContent: "center",
        filter: on ? "none" : "grayscale(0.25) opacity(0.9)",
        boxShadow: on ? "0 4px 14px rgba(255,107,157,0.35)" : "none", transition: "all .15s",
      }}>
        <DiaryIcon name={icon} size={iconSize} />
      </div>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: on ? C.ink : C.sub, textAlign: "center", lineHeight: 1.2 }}>{label}</span>
    </button>
  );
}

// ============================================
// 스타일
// ============================================

const primaryBtn = { width: "100%", padding: 17, borderRadius: 16, border: "none", background: C.ink, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer" };
