import { useState, useRef, useEffect } from "react";
import MallangInfoPopup, { soreConfirmedThisMonth } from "./MallangInfoPopup";
import { readMallangProfile } from "../lib/mallangProfile";
import { Mallang } from "./Mallang";
import MallangStressPopup from "./MallangStressPopup";
import KakaoSavePromptPopup from "./KakaoSavePromptPopup";
import FeedbackModal from "./FeedbackModal";
import { DiaryIcon } from "./DiaryIcons";
import { MOODS as DAY_MOODS } from "../data";
import {
  SLEEP_LABELS, OVEREXERT_LOAD_KEY, EXERCISE_REASON_KEY, PART_KEY, WHEN_KEY, EXERCISE_TYPE_KEY,
  LOAD_TO_OVEREXERT_LABEL, REASON_TO_EXERCISE_LABEL, KEY_TO_PART_LABEL, KEY_TO_WHEN_LABEL, KEY_TO_EXERCISE_TYPE_LABEL,
} from "../lib/diaryEntryLabels";
import { getTypeAccent, GOLD, YELLOW, YELLOW_LINE } from "../lib/typeAccent";
import { getGuestMallang, getSleepSetting, setSleepSetting, canChangeSleepSetting, sleepOptionsFor, sleepWindowByIdx, sleepBaseIdx, SLEEP_HOURS, SLEEP_BASE_MIN, SLEEP_BASE_MAX } from "../lib/mallangProfile";

// ============================================
// BMTI 하루일기 작성 플로우
// 한 페이지 스크롤 + 아코디언 구조 — 전체화면
// ============================================

// 색감·톤은 사이트 전체(BMTI 하루일기 온보딩·캘린더, BMTI 라이브)와 통일한다.
// 색상 통일: 핵심 버튼 골드 / 박스·타일 연옐로우 / 선택·강조는 유형별(M 연분홍·Z 연보라).
// 기분(말랑이) 색은 데이터라 그대로 둔다.
const C = {
  bg: "#FFFFFF", card: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2",
  gold: GOLD, yellow: YELLOW, yellowLine: YELLOW_LINE,
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

// 잠든 시간대 — 정밀 시간 대신 원탭 칩(취침 리듬/다음날 발견용, 선택 사항)
const SLEEP_TIME_OPTS = ["~11시", "12시", "1시", "2시 이후"];

// 오늘의 태그 — 한 날에 같이 찍힌 기록으로 '함께 온 기록' 발견을 만든다(여러 개 선택, 선택 사항).
// 카테고리별로 가로 배치하고, 칸을 넘어가면 가로 스크롤한다. '생리 중'은 여성에게만 노출.
const TAG_CATEGORIES = [
  { title: "음식 섭취", tags: [
    { label: "카페인", icon: "caffeine" }, { label: "음주", icon: "alcohol" }, { label: "야식·과식", icon: "snacking" }, { label: "수분 보충", icon: "water" }, { label: "맵거나 짠 음식", icon: "spicy" }, { label: "달달 디저트", icon: "dessert" }, { label: "영양제", icon: "supplement" },
  ] },
  { title: "활동·환경", tags: [
    { label: "스마트폰·PC", icon: "phone" }, { label: "장거리 운전", icon: "driving" }, { label: "불편한 신발", icon: "shoes" }, { label: "무거운 짐", icon: "heavyBag" }, { label: "에어컨·추위", icon: "coldAir" },
  ] },
  { title: "상태·기타", tags: [
    { label: "스트레스", icon: "stress" }, { label: "긴장함", icon: "nervous" }, { label: "방전됨", icon: "drained" }, { label: "소화 불량", icon: "indigestion" }, { label: "생리 중", icon: "period", femaleOnly: true }, { label: "진통제", icon: "medicine" },
  ] },
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
// 인체 위 → 아래 순서로 나열 (기타는 항상 마지막)
const PARTS = ["머리", "목", "어깨", "팔꿈치", "손목", "등", "복부", "허리", "골반", "무릎", "발목", "기타"];
const WHEN_OPTS = ["오늘 아침 일어날 때", "움직일 때", "오래 앉아있을 때", "오래 서있을 때", "일할 때", "하루 종일"];

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
  sleep: "전날 밤 잘 잤어요",
  exercise: "오늘 운동 했나요",
  tags: "오늘의 태그",
  oneLine: "한 줄 일기",
  sore: "불편한 부위",
};

// ============================================
// 메인 컴포넌트
// ============================================
// initialEntry: 캘린더에서 '이전 기록 수정하기'로 들어온 경우, 그날 저장돼있던 전체 기록
// (mallangReportEngine.js가 쓰는 key 형태 그대로) — 이 화면의 라벨로 되돌려 폼을 미리 채운다.
export default function DiaryWriteFlow({ onClose, onFinish, initialPhase = "form", initialDayMood = null, targetDate = null, charImage = null, initialEntry = null, gender = null, mallangSore = null, isLoggedIn = true, onRequireLogin = null, userInfo = null, setUserProfile = null }) {
  const [phase, setPhase] = useState(initialPhase === "day" || initialPhase === "work" ? "form" : initialPhase);

  // ── 데이터 ──
  const [dayMood, setDayMood] = useState(initialDayMood);
  const [showKakaoPrompt, setShowKakaoPrompt] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  // 온보딩1 — 다이어리 입력 시 '불편한 부위' 프로필 입력/월 1회 재확인 팝업
  const [sorePopup, setSorePopup] = useState(null); // null | { askReconfirm }
  useEffect(() => {
    try {
      const sore = readMallangProfile(userInfo)?.sore;
      if (Array.isArray(sore) && sore.length && !soreConfirmedThisMonth()) setSorePopup({ askReconfirm: true });
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 평소보다 무리했는지
  const [overexertVal, setOverexertVal] = useState(() => (initialEntry?.overwork ? (initialEntry.overwork.yes ? "yes" : "no") : null));
  const [overexertPick, setOverexertPick] = useState(() => {
    const load = initialEntry?.overwork?.loads?.[0];
    if (!load) return null;
    return LOAD_TO_OVEREXERT_LABEL[load] || "other";
  });
  const [overexertOther, setOverexertOther] = useState("");
  // 수면의 질 + 잠든 시간대
  const [sleepVal, setSleepVal] = useState(() => (initialEntry?.sleep != null ? SLEEP_LABELS[initialEntry.sleep] : null));
  const [sleepTime, setSleepTime] = useState(() => initialEntry?.sleepTime ?? null);
  // 수면 기준 설정(수동 시간대 / 불규칙). 없으면 첫 진입 → 선택 화면부터 보여준다.
  const [sleepSetting, setSleepSettingState] = useState(() => getSleepSetting());
  const [sleepSetupOpen, setSleepSetupOpen] = useState(() => !getSleepSetting());
  const [setupMode, setSetupMode] = useState("manual"); // 'manual' | 'irregular'
  const [setupBaseIdx, setSetupBaseIdx] = useState(() => sleepBaseIdx(getSleepSetting()?.base));
  // 관리자(닉네임 BMTI)는 월 1회 제한 없이 항상 변경 가능
  const canChangeSleep = () => isAdmin || canChangeSleepSetting();
  const confirmSleepSetup = () => {
    if (!canChangeSleep() && sleepSetting) { alert("기본 수면시간은 한 달에 한 번만 바꿀 수 있어요. 다음 달에 다시 시도해주세요."); return; }
    const base = setupMode === "manual" ? SLEEP_HOURS[setupBaseIdx] : null;
    const v = setSleepSetting(setupMode, base);
    setSleepSettingState(v);
    setSleepTime(null); // 기준이 바뀌면 오늘 선택은 초기화
    setSleepSetupOpen(false);
  };
  const openSleepSetup = () => {
    if (!canChangeSleep()) { alert("기본 수면시간은 한 달에 한 번만 바꿀 수 있어요. 다음 달에 다시 시도해주세요."); return; }
    setSetupMode(sleepSetting?.mode || "manual");
    setSetupBaseIdx(sleepBaseIdx(sleepSetting?.base));
    setSleepSetupOpen(true);
  };
  // 시간 무한 스크롤 캐러셀 — 리스트를 여러 번 반복하고, 끝 근처에 가면 가운데 복사본으로 슬쩍 되돌린다.
  const SLEEP_SLOT = 96, SLEEP_REPEAT = 21;
  const sleepScrollRef = useRef(null);
  const sleepIdleRef = useRef(null);
  const [sleepCenterAbs, setSleepCenterAbs] = useState(() => Math.floor(SLEEP_REPEAT / 2) * SLEEP_HOURS.length + sleepBaseIdx(getSleepSetting()?.base));
  useEffect(() => {
    if (!sleepSetupOpen) return;
    const el = sleepScrollRef.current; if (!el) return;
    const mid = Math.floor(SLEEP_REPEAT / 2) * SLEEP_HOURS.length + setupBaseIdx;
    el.scrollLeft = mid * SLEEP_SLOT;
    setSleepCenterAbs(mid);
  }, [sleepSetupOpen]);
  const onSleepScroll = () => {
    const el = sleepScrollRef.current; if (!el) return;
    const total = SLEEP_REPEAT * SLEEP_HOURS.length;
    const idx = Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / SLEEP_SLOT)));
    setSleepCenterAbs(idx);
    const len = SLEEP_HOURS.length;
    setSetupBaseIdx(((idx % len) + len) % len);
    if (setupMode !== "manual") setSetupMode("manual");
    clearTimeout(sleepIdleRef.current);
    sleepIdleRef.current = setTimeout(() => {
      const e2 = sleepScrollRef.current; if (!e2) return;
      const i = Math.round(e2.scrollLeft / SLEEP_SLOT);
      if (i < len || i >= (SLEEP_REPEAT - 1) * len) {
        const m = ((i % len) + len) % len;
        const target = Math.floor(SLEEP_REPEAT / 2) * len + m;
        e2.scrollLeft = target * SLEEP_SLOT;
        setSleepCenterAbs(target);
      }
    }, 150);
  };
  // PC에서도 클릭·드래그로 좌우 스크롤
  const sleepDragRef = useRef({ down: false, x: 0, left: 0, moved: false });
  const onSleepDown = (e) => { const el = sleepScrollRef.current; if (!el) return; sleepDragRef.current = { down: true, x: e.clientX, left: el.scrollLeft, moved: false }; el.style.scrollSnapType = "none"; };
  const onSleepMove = (e) => { const d = sleepDragRef.current; if (!d.down) return; const el = sleepScrollRef.current; const dx = e.clientX - d.x; if (Math.abs(dx) > 3) d.moved = true; el.scrollLeft = d.left - dx; };
  const endSleepDrag = () => { const d = sleepDragRef.current; if (!d.down) return; d.down = false; const el = sleepScrollRef.current; if (!el) return; el.style.scrollSnapType = "x mandatory"; const i = Math.round(el.scrollLeft / SLEEP_SLOT); el.scrollTo({ left: i * SLEEP_SLOT, behavior: "smooth" }); };

  // 오늘의 태그(여러 개)
  const [tags, setTags] = useState(() => (Array.isArray(initialEntry?.tags) ? initialEntry.tags : []));
  const toggleTag = (tag) => setTags(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag]);
  const bmtiUser = (() => { try { return JSON.parse(localStorage.getItem("bmti_user") || "null"); } catch { return null; } })();
  const isAdmin = bmtiUser?.nickname === "BMTI";
  const nickname = bmtiUser?.nickname || null;
  const g = String(gender || "").toLowerCase();
  // 관리자는 성별과 무관하게 여성 전용 항목(생리 등)도 선택할 수 있다.
  const isFemale = g.includes("female") || g.includes("여") || isAdmin;

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
  // 불편한 부위
  // 소스 우선순위: 그날 기존 기록(initialEntry) > 저장된 말랑 정보(mallangSore/게스트 캐시).
  // profileParts = 말랑 정보에서 자동으로 불러온 부위(언제는 재질문하지 않고, '얼마나'만 조절).
  // whens[part] = 언제 배열(중복 선택) / levels[part] = 부위별 강도
  const [sore, setSore] = useState(() => {
    if (initialEntry?.soreness?.length) {
      const parts = initialEntry.soreness.map(s => KEY_TO_PART_LABEL[s.part] || s.part).slice(0, 2);
      const whens = {}, levels = {};
      initialEntry.soreness.forEach(s => {
        const p = KEY_TO_PART_LABEL[s.part] || s.part;
        whens[p] = [KEY_TO_WHEN_LABEL[s.situation] || "기타"];
        levels[p] = s.level ?? 5;
      });
      const etc = initialEntry.soreness.find(s => s.part === "etc");
      return { parts, levels, whens, whenOthers: {}, partOther: etc?.partOther || "", profileParts: [] };
    }
    // 저장된 말랑 정보 자동 불러오기 (로그인=props, 게스트=localStorage)
    const profile = (Array.isArray(mallangSore) && mallangSore.length) ? mallangSore : (getGuestMallang()?.sore || []);
    if (Array.isArray(profile) && profile.length) {
      const parts = profile.map(s => s.part).slice(0, 2);
      const whens = {}, whenOthers = {}, levels = {};
      profile.forEach(s => { whens[s.part] = Array.isArray(s.when) ? s.when : (s.when ? [s.when] : []); if (s.whenOther) whenOthers[s.part] = s.whenOther; levels[s.part] = 5; });
      return { parts, levels, whens, whenOthers, partOther: "", profileParts: parts.slice() };
    }
    return { parts: [], levels: {}, whens: {}, whenOthers: {}, partOther: "", profileParts: [] };
  });
  const [showPartPicker, setShowPartPicker] = useState(false);

  const selDate = targetDate ? new Date(`${targetDate}T00:00:00`) : new Date();

  // 블럭 순서·숨김·편집 모드
  // 일상 정보에서 불러온(profile) 부위의 '언제'를 이 화면에서 직접 고칠 수 있게 하는 편집 대상 목록
  const [whenEditParts, setWhenEditParts] = useState([]);

  const [blockOrder, setBlockOrder] = useState(["sore", "sleep", "tags", "exercise", "sitting", "oneLine"]);
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

  // 아코디언 (true = 펼쳐진 상태) — 이미 답이 있는 항목은 접어서 보여준다.
  const [expanded, setExpanded] = useState({
    mood: !initialDayMood,
    sitting: !initialEntry?.overwork,
    sleep: initialEntry?.sleep == null,
    exercise: !initialEntry?.exercise,
    tags: !(Array.isArray(initialEntry?.tags) && initialEntry.tags.length),
  });
  const toggle = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  const F = "'Pretendard', -apple-system, sans-serif";
  const t = getTypeAccent();

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
    const soreness = sore.parts.map(p => {
      const ws = Array.isArray(sore.whens[p]) ? sore.whens[p] : (sore.whens[p] ? [sore.whens[p]] : []);
      const firstWhen = ws[0];
      return {
        part: PART_KEY[p] || "back",
        ...(p === "기타" && sore.partOther.trim() ? { partOther: sore.partOther.trim() } : {}),
        level: sore.levels[p] ?? 5,
        situation: (firstWhen === "기타" ? "etc" : WHEN_KEY[firstWhen]) || "etc",
      };
    });
    const noteText = oneLine.text.trim();
    const note = noteText ? { category: CATEGORIES.find(c => c.id === oneLine.cat)?.label, text: noteText } : null;
    // 새 신호(선택 사항): 오늘의 태그·잠든 시간대 — '함께 온 기록', 취침 리듬 발견의 재료로 그대로 저장해 쌓는다.
    return { sleep: sleep >= 0 ? sleep : null, sleepTime, overwork, exercise, soreness, note, tags };
  };

  const finishFlow = () => {
    // 저장은 부모(AiChatHub)에 맡기고, 완료 말랑이 팝업은 캘린더로 돌아가 그 위에서 띄운다.
    // (onFinish가 상세 폼을 닫으므로 여기서 celebrate 단계를 띄우지 않는다.)
    if (onFinish) onFinish(dayMood, buildEntryExtra());
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
    // 아이콘만 골랐을 땐 접지 않는다 — 잠든 시간대까지 고르면 그때 접는다.
    setSleepVal(opt.label);
  };
  const handleSleepTimePick = (o) => {
    const next = sleepTime === o ? null : o;
    setSleepTime(next);
    if (next && sleepVal) setTimeout(() => setExpanded(e => ({ ...e, sleep: false })), 250);
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

  // 불편한 부위의 표시 이름 — '기타'는 직접 입력한 부위명으로 보여준다.
  const partDisplay = (p) => (p === "기타" ? (sore.partOther.trim() || "기타") : p);

  // 부위별 언제 배열을 사람이 읽는 한 줄로 — 기타는 직접 입력값으로 치환, 중복은 '·'로 잇는다.
  const whenText = (p) => {
    const ws = Array.isArray(sore.whens[p]) ? sore.whens[p] : (sore.whens[p] ? [sore.whens[p]] : []);
    return ws.map(w => (w === "기타" ? (sore.whenOthers[p] || "기타") : w)).join("·");
  };

  // 불편한 부위 헤드라인 — 부위마다 시점이 다를 수 있어 부위별로 문장을 따로 만든다.
  // 부위·불편 정도는 연보라로 강조하려고 구조화해 둔다.
  const soreClauseData = sore.parts.map(p => {
    const w = whenText(p);
    if (!w) return null;
    const pd = partDisplay(p);
    return { w, pd, suffix: hasBatchim(pd) ? "이" : "가", lvl: sore.levels[p] ?? 5 };
  }).filter(Boolean);

  // "오늘 [허리]와 [목]의 상태는 어땠나요?" — 말랑 정보로 불러온 부위 문구
  const soreQuestion = sore.parts.length > 0
    ? `오늘 ${sore.parts.map((p, i) => `[${partDisplay(p)}]` + (i === sore.parts.length - 1 ? "" : (hasBatchim(partDisplay(p)) ? "과 " : "와 "))).join("")}의 상태는 어땠나요?`
    : null;
  const addPart = (p) => setSore(s => ({ ...s, parts: s.parts.includes(p) ? s.parts.filter(x => x !== p) : (s.parts.length >= 2 ? s.parts : [...s.parts, p]) }));

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
              <EmojiTile icon="restNo" label="아니요!" on={overexertVal === "no"} onClick={pickOverexertNo} tint={C.yellow} />
              <EmojiTile icon="flex" label="맞아요!" on={false} onClick={() => setOverexertVal("yes")} tint={C.yellow} />
            </div>
          )}

          {overexertVal === "yes" && (
            <>
              <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginBottom: 10 }}>어떻게 무리했어요?</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", rowGap: 14, justifyItems: "center" }}>
                {OVEREXERT_REASONS.map(r => (
                  <EmojiTile key={r.label} icon={r.icon} label={r.label} on={overexertPick === r.label} onClick={() => pickOverexertReason(r.label)} tint={C.yellow} />
                ))}
                <EmojiTile icon="editPencil" label="기타(직접 입력)" on={overexertPick === "other"} onClick={() => pickOverexertReason("other")} tint={C.yellow} />
              </div>
              {overexertPick === "other" && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <input value={overexertOther} onChange={e => setOverexertOther(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && confirmOverexertOther()}
                    placeholder="짧게 적어주세요 (예: 무거운 짐 옮기기)"
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 14, border: `1px solid ${C.line}`, fontSize: 14, outline: "none", fontFamily: F }} />
                  <button onClick={confirmOverexertOther} disabled={!overexertOther.trim()}
                    style={{ padding: "10px 16px", borderRadius: 14, border: "none", background: C.gold, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: overexertOther.trim() ? 1 : 0.4 }}>확인</button>
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
        <AccordionCard question="전날 밤 잘 잤어요?" answerIcon={sleepOpt?.icon} answerText={sleepVal}
          expanded={expanded.sleep} onToggle={() => toggle("sleep")} done={!!sleepVal}>
          <div style={{ display: "flex", gap: 6 }}>
            {SLEEP_OPTS.map(opt => (
              <EmojiTile key={opt.label} icon={opt.icon} label={opt.label} on={sleepVal === opt.label} onClick={() => handleSleepPick(opt)} tint={C.yellow} />
            ))}
          </div>
          {sleepSetupOpen ? (
            /* 첫 진입/변경 — 기준 수면 설정 선택 화면 */
            <div style={{ marginTop: 16, background: C.yellow, border: `1px solid ${C.yellowLine}`, borderRadius: 16, padding: "16px 14px" }}>
              {/* 현재 선택 문구(버튼 아님) */}
              <div style={{ textAlign: "center", fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 10 }}>
                {setupMode === "irregular"
                  ? "저는 잠드는 시간이 불규칙해요."
                  : <>저는 주로 <span style={{ color: "#8B7BD8", fontWeight: 900 }}>{SLEEP_HOURS[setupBaseIdx]}</span>에 잠들어요.</>}
              </div>

              {/* 시간대 — 가운데만 크게(연보라), 좌우 얇은 연보라 선. 클릭·드래그·스크롤(무한) */}
              <div style={{ position: "relative", opacity: setupMode === "manual" ? 1 : 0.4 }}>
                <div ref={sleepScrollRef} onScroll={onSleepScroll} onPointerDown={onSleepDown} onPointerMove={onSleepMove} onPointerUp={endSleepDrag} onPointerLeave={endSleepDrag} className="sleep-scroll"
                  style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", paddingLeft: `calc(50% - ${SLEEP_SLOT / 2}px)`, paddingRight: `calc(50% - ${SLEEP_SLOT / 2}px)`, scrollbarWidth: "none", cursor: "grab", touchAction: "pan-x" }}>
                  {Array.from({ length: SLEEP_REPEAT * SLEEP_HOURS.length }).map((_, k) => {
                    const on = k === sleepCenterAbs;
                    return <div key={k} style={{ width: SLEEP_SLOT, flexShrink: 0, scrollSnapAlign: "center", textAlign: "center", padding: "14px 0", fontSize: on ? 21 : 13, fontWeight: on ? 900 : 600, color: on ? "#8B7BD8" : C.tileOffText, transition: "color .15s, font-size .15s", whiteSpace: "nowrap", userSelect: "none" }}>{SLEEP_HOURS[k % SLEEP_HOURS.length]}</div>;
                  })}
                </div>
                <div style={{ position: "absolute", top: 8, bottom: 8, left: `calc(50% - ${SLEEP_SLOT / 2}px)`, width: 2, background: "#C9BEF0", pointerEvents: "none", borderRadius: 2 }} />
                <div style={{ position: "absolute", top: 8, bottom: 8, left: `calc(50% + ${SLEEP_SLOT / 2}px)`, width: 2, background: "#C9BEF0", pointerEvents: "none", borderRadius: 2, transform: "translateX(-2px)" }} />
                <style>{`.sleep-scroll::-webkit-scrollbar{display:none} .sleep-scroll:active{cursor:grabbing}`}</style>
              </div>

              {/* 불규칙 — 박스 없이 체크박스 + 문구 */}
              <div onClick={() => setSetupMode(m => (m === "irregular" ? "manual" : "irregular"))}
                style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 16, cursor: "pointer" }}>
                <span style={{ width: 20, height: 20, flexShrink: 0, borderRadius: 6, border: `2px solid ${setupMode === "irregular" ? C.gold : "#D8D3C8"}`, background: setupMode === "irregular" ? C.gold : "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 900 }}>{setupMode === "irregular" ? "✓" : ""}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>저는 잠드는 시간이 불규칙해요</span>
              </div>

              {/* '이렇게 기억해줘요' — 문구 버튼, 불규칙 체크 밑 */}
              <button onClick={confirmSleepSetup}
                style={{ width: "100%", marginTop: 14, padding: "12px", borderRadius: 12, background: "#fff", color: C.ink, fontSize: 13.5, fontWeight: 800, cursor: "pointer", border: "2px solid #C9BEF0" }}>
                이렇게 기억해줘요
              </button>
            </div>
          ) : (
            <>
              {/* 오늘의 수면 시간대 — 설정(수동 5개 / 불규칙 3개)에 따라 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "16px 0 8px" }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: C.sub }}>{sleepSetting?.mode === "irregular" ? "자야 하는 시간보다 어떻게 잤어요?" : "몇 시쯤 잤어요?"}</span>
                <button onClick={openSleepSetup} style={{ fontSize: 10.5, fontWeight: 700, color: C.sub, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 999, padding: "3px 9px", cursor: "pointer" }}>기본 수면시간 변경</button>
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {(sleepOptionsFor(sleepSetting) || SLEEP_TIME_OPTS).map(o => (
                  <Chip key={o} label={o} on={sleepTime === o} onClick={() => handleSleepTimePick(o)} />
                ))}
              </div>
            </>
          )}
        </AccordionCard>
      );
    }
    if (id === "tags") {
      return (
        <AccordionCard question="오늘의 태그" answerText={tags.length ? `${tags.length}개 선택` : null}
          expanded={expanded.tags} onToggle={() => toggle("tags")} done={tags.length > 0}>
          <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, margin: "0 0 14px" }}>오늘 있었던 일을 가볍게 눌러두면, 나중에 뭐랑 자주 겹치는지 찾아드려요.</div>
          <style>{`@keyframes tagArrowBlink{0%,100%{opacity:.2}50%{opacity:.75}} .tag-scroll::-webkit-scrollbar{display:none}`}</style>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {TAG_CATEGORIES.map(cat => {
              const items = cat.tags.filter(tg => !tg.femaleOnly || isFemale);
              if (!items.length) return null;
              const arrow = { position: "absolute", top: "34%", fontSize: 22, fontWeight: 800, color: "#C9C4BB", pointerEvents: "none", animation: "tagArrowBlink 1.3s ease-in-out infinite" };
              return (
                <div key={cat.title}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: C.sub, marginBottom: 8 }}>{cat.title}</div>
                  <div style={{ position: "relative" }}>
                    <div className="tag-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, padding: "0 14px 4px", margin: "0 -14px", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
                      {items.map(tg => (
                        <TagBox key={tg.label} icon={tg.icon} label={tg.label} on={tags.includes(tg.label)} onClick={() => toggleTag(tg.label)} t={t} />
                      ))}
                    </div>
                    {/* 항목이 더 있다는 좌우 깜박이는 화살표 */}
                    <span style={{ ...arrow, left: -2 }}>‹</span>
                    <span style={{ ...arrow, right: -2 }}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
        </AccordionCard>
      );
    }
    if (id === "exercise") {
      return (
        <AccordionCard question="오늘 운동·스트레칭·산책 했나요?" answerIcon={exerciseAnswerIcon} answerText={exerciseAnswerText}
          expanded={expanded.exercise} onToggle={() => toggle("exercise")} done={exerciseComplete}>
          {exerciseDidIt === null && (
            <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "8px 0 4px" }}>
              <EmojiTile icon="restNo" label="안했어요!" on={false} onClick={() => setExerciseDidIt("no")} tint={C.yellow} />
              <EmojiTile icon="flex" label="했어요!" on={false} onClick={() => setExerciseDidIt("yes")} tint={C.yellow} />
            </div>
          )}

          {exerciseDidIt === "no" && (
            <>
              <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginBottom: 10 }}>오늘은 어떤 이유였어요?</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", rowGap: 14, justifyItems: "center" }}>
                {NO_EXERCISE_REASONS.map(r => (
                  <EmojiTile key={r.label} icon={r.icon} label={r.label} on={exerciseReason === r.label} onClick={() => pickExerciseReason(r.label)} iconSize={36} tint={C.yellow} />
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
                      return <Tile key={type} content={type} on={on} onClick={() => toggleExerciseType(type)} disabled={disabled} size={62} tint={C.yellow} />;
                    })}
                  </div>
                </div>
              ))}

              {/* 기타 — 조그만 하이퍼링크 느낌 버튼, 누르면 입력창이 아코디언으로 펼쳐짐 */}
              <button onClick={() => setShowCustomExercise(v => !v)} style={{ border: "none", background: "transparent", color: t.accentDeep, fontSize: 11.5, fontWeight: 700, textDecoration: "underline", cursor: "pointer", padding: "2px 0", display: "block", marginBottom: showCustomExercise ? 10 : 4 }}>
                기타 운동 직접 입력 {showCustomExercise ? "▾" : "▸"}
              </button>
              {showCustomExercise && (
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <input value={customExercise} onChange={e => setCustomExercise(e.target.value)} placeholder="운동 이름 입력"
                    onKeyDown={e => e.key === "Enter" && addCustomExercise()}
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 14, border: `1px solid ${C.line}`, fontSize: 14, outline: "none", fontFamily: F }} />
                  <button onClick={addCustomExercise} disabled={exerciseTypes.length >= 2}
                    style={{ padding: "10px 16px", borderRadius: 14, border: "none", background: C.gold, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: exerciseTypes.length >= 2 ? 0.4 : 1 }}>추가</button>
                </div>
              )}

              {/* 선택된 종목 표시 */}
              {exerciseTypes.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                  {exerciseTypes.map(et => (
                    <span key={et} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 14, background: t.accent, color: "#fff", fontSize: 12, fontWeight: 700 }}>
                      {et} <button onClick={() => toggleExerciseType(et)} style={{ border: "none", background: "transparent", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
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
      const pickable = PARTS.filter(p => !sore.parts.includes(p));
      const toggleWhen = (p, w) => setSore(s => {
        const cur = Array.isArray(s.whens[p]) ? s.whens[p] : (s.whens[p] ? [s.whens[p]] : []);
        return { ...s, whens: { ...s.whens, [p]: cur.includes(w) ? cur.filter(x => x !== w) : [...cur, w] } };
      });
      return (
        <Card title="불편한 부위" action={
          <button onClick={() => setSorePopup({ askReconfirm: false })}
            style={{ flexShrink: 0, border: `1.5px solid ${t.accentSoft}`, background: "#fff", color: t.accentDeep, cursor: "pointer", borderRadius: 999, padding: "6px 11px", fontSize: 11.5, fontWeight: 800, fontFamily: F, whiteSpace: "nowrap" }}>
            🩹 불편했던 곳 수정하기
          </button>
        }>
          {/* 일상 정보에서 불러온 부위로 만든 질문 */}
          {soreQuestion && (
            <div style={{ padding: "12px 14px", background: C.yellow, border: `1px solid ${C.yellowLine}`, borderRadius: 14, fontSize: 14, color: C.ink, fontWeight: 800, lineHeight: 1.5, marginBottom: 4 }}>
              {soreQuestion}
            </div>
          )}

          {sore.parts.length > 0 && sore.parts.map(p => {
            const fromProfile = (sore.profileParts || []).includes(p);
            const whens = Array.isArray(sore.whens[p]) ? sore.whens[p] : (sore.whens[p] ? [sore.whens[p]] : []);
            const lvl = sore.levels[p] ?? 5;
            return (
              <div key={p} style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 800 }}>{partDisplay(p)}</div>
                  <button onClick={() => setSore(s => ({ ...s, parts: s.parts.filter(x => x !== p), profileParts: (s.profileParts || []).filter(x => x !== p) }))}
                    style={{ border: "none", background: "transparent", color: C.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "2px 4px" }}>삭제 ✕</button>
                </div>
                {/* 부위별 강도 조절 — 두꺼운 게이지 + 좌우 -/+ 버튼 */}
                <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, margin: "10px 0 8px" }}>얼마나 불편했어요? ({lvl})</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => setSore(s => ({ ...s, levels: { ...s.levels, [p]: Math.max(0, lvl - 1) } }))} aria-label="줄이기"
                    style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 10, border: `1px solid ${C.line}`, background: "#fff", color: C.ink, fontSize: 20, fontWeight: 800, lineHeight: 1, cursor: "pointer" }}>−</button>
                  <div onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setSore(s => ({ ...s, levels: { ...s.levels, [p]: Math.max(0, Math.min(10, Math.round(((e.clientX - r.left) / r.width) * 10))) } })); }}
                    style={{ flex: 1, height: 16, borderRadius: 999, background: "#EFEBE3", position: "relative", cursor: "pointer" }}>
                    <div style={{ height: "100%", width: `${lvl * 10}%`, background: t.accent, borderRadius: 999, transition: "width .12s" }} />
                    <span style={{ position: "absolute", top: "50%", left: `${lvl * 10}%`, transform: "translate(-50%,-50%)", width: 22, height: 22, borderRadius: "50%", background: "#fff", border: `3px solid ${t.accent}`, boxShadow: "0 1px 4px rgba(0,0,0,.22)" }} />
                  </div>
                  <button onClick={() => setSore(s => ({ ...s, levels: { ...s.levels, [p]: Math.min(10, lvl + 1) } }))} aria-label="늘리기"
                    style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 10, border: `1px solid ${C.line}`, background: "#fff", color: C.ink, fontSize: 20, fontWeight: 800, lineHeight: 1, cursor: "pointer" }}>+</button>
                </div>
                {/* 언제 — 일상 정보에서 불러온 부위는 표시만 하되 '수정' 버튼으로 직접 고칠 수 있게, 추가한 부위는 중복 선택 */}
                {fromProfile && !whenEditParts.includes(p) ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>언제: {whenText(p) || "—"}</div>
                    <button onClick={() => setWhenEditParts(a => [...a, p])} aria-label="언제 수정"
                      style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2, display: "inline-flex", alignItems: "center", color: C.sub }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 3v5h-5" /><path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, margin: "12px 0 8px" }}>{partDisplay(p)}{hasBatchim(partDisplay(p)) ? "은" : "는"} 언제 그러셨어요? <span style={{ color: C.tileOffText, fontWeight: 600 }}>중복 선택</span></div>
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      {WHEN_OPTS.map(w => (
                        <Chip key={w} label={w} on={whens.includes(w)} onClick={() => toggleWhen(p, w)} />
                      ))}
                      <Chip label="기타" on={whens.includes("기타")} onClick={() => toggleWhen(p, "기타")} />
                    </div>
                    {whens.includes("기타") && (
                      <input value={sore.whenOthers[p] || ""} onChange={e => setSore(s => ({ ...s, whenOthers: { ...s.whenOthers, [p]: e.target.value } }))}
                        placeholder="예: 계단 오를 때"
                        style={{ width: "100%", marginTop: 8, padding: "10px 14px", borderRadius: 14, border: `1px solid ${C.line}`, fontSize: 14, outline: "none", fontFamily: F, boxSizing: "border-box" }} />
                    )}
                    {fromProfile && (
                      <button onClick={() => setWhenEditParts(a => a.filter(x => x !== p))}
                        style={{ marginTop: 10, border: "none", background: "transparent", color: t.accentDeep, fontSize: 12.5, fontWeight: 800, cursor: "pointer", padding: "2px 0" }}>완료</button>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* 다른 부위 추가하기 (최대 2) */}
          {sore.parts.length < 2 && (
            <button onClick={() => setShowPartPicker(v => !v)}
              style={{ marginTop: 16, width: "100%", padding: 12, borderRadius: 14, border: `1px dashed ${C.yellowLine}`, background: C.yellow, color: GOLD, fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
              {showPartPicker ? "부위 선택 닫기" : "+ 다른 부위 추가하기"}
            </button>
          )}
          {(showPartPicker || sore.parts.length === 0) && sore.parts.length < 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", rowGap: 14, justifyItems: "center", marginTop: 14 }}>
              {pickable.map(p => (
                <Tile key={p} content={p} on={false} disabled={false} tint={C.yellow}
                  onClick={() => { addPart(p); if (p !== "기타") setShowPartPicker(false); }} />
              ))}
            </div>
          )}
          {/* 기타 선택 시 부위 직접 입력 */}
          {sore.parts.includes("기타") && (
            <input value={sore.partOther} onChange={e => setSore(s => ({ ...s, partOther: e.target.value.slice(0, 20) }))}
              placeholder="어디가 불편했나요? 예: 손가락, 종아리"
              style={{ width: "100%", marginTop: 14, padding: "11px 14px", borderRadius: 14, border: `1px solid ${C.line}`, fontSize: 14, outline: "none", fontFamily: F, boxSizing: "border-box" }} />
          )}

          {soreClauseData.length > 0 && (
            <div style={{ marginTop: 14, padding: "12px 14px", background: "#FAF8F3", borderRadius: 14, fontSize: 13, color: C.sub, fontWeight: 700, lineHeight: 1.5 }}>
              "{soreClauseData.map((c, i) => (
                <span key={i}>{c.w} <span style={{ color: "#8B7BD8", fontWeight: 800 }}>{c.pd}</span>{c.suffix} <span style={{ color: "#8B7BD8", fontWeight: 800 }}>{c.lvl}정도</span>로 불편했{i === soreClauseData.length - 1 ? "어요" : "고, "}</span>
              ))}"
            </div>
          )}
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
          <button onClick={() => setEditMode(v => !v)} style={{ position: "absolute", right: 10, border: "none", background: "transparent", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", padding: "6px 8px", color: editMode ? t.accentDeep : C.sub }}>
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
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: C.ink, margin: 0 }}>오늘 {nickname || "말랑이"}의 기분은</h2>
                  {dayMood && !expanded.mood && moodData && (
                    <Mallang v={moodData.v} size={44} />
                  )}
                </div>
                {/* 펼쳐진 상태 */}
                <div style={{ overflow: "hidden", maxHeight: expanded.mood ? 200 : 0, transition: "max-height 0.35s ease", marginTop: expanded.mood ? 8 : 0 }}>
                  <p style={{ fontSize: 12, color: C.sub, margin: "0 0 8px" }}>지금 마음에 가장 가까운 표정을 골라주세요.</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 6 }}>
                    {DAY_MOODS.map(m => {
                      const on = dayMood === m.v;
                      // 고른 표정만 커지고 나머지는 작아져서, 균일한 크기의 원 5개가 늘어선
                      // 모양이 아니라 "고른 걸 도드라지게" 보여주는 위계가 생기게 한다.
                      const mallangSize = on ? 56 : 40;
                      return (
                        <button key={m.v} onClick={() => { setDayMood(m.v); setTimeout(() => setExpanded(e => ({ ...e, mood: false })), 300); }}
                          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "6px 0", borderRadius: 16, border: "none", background: "transparent", cursor: "pointer", transition: "all .2s cubic-bezier(.34,1.4,.64,1)", transform: on ? "scale(1.08)" : "scale(1)" }}>
                          <Mallang v={m.v} size={mallangSize} />
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
                    >
                      {editMode && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 2px 8px" }}>
                          <span onPointerDown={handleDragStart(id)} style={{ touchAction: "none", cursor: "grab", fontSize: 17, color: C.sub, padding: "6px 8px", lineHeight: 1 }}>⠿</span>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.sub }}>{REORDERABLE_LABEL[id]}</span>
                          <button onClick={() => toggleHideBlock(id)} style={{
                            width: 26, height: 26, borderRadius: "50%", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 800, lineHeight: 1,
                            background: hidden ? C.tileOff : t.accentSoft, color: hidden ? C.sub : t.accentDeep,
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

          {phase === "form" && (
            <button onClick={() => setShowFeedback(true)}
              style={{ display: "block", margin: "8px auto 0", border: "none", background: "transparent", color: C.sub, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              💬 다이어리의 개선 의견 보내기
            </button>
          )}
        </div>

        {/* ── 하단 고정 CTA 버튼 ── */}
        {phase === "form" && (
          <div style={{ flexShrink: 0, padding: "10px 14px 20px", background: `linear-gradient(transparent, ${C.bg} 20%)`, borderTop: `1px solid ${C.line}` }}>
            <button onClick={finishFlow} style={{ ...primaryBtn, background: C.gold, color: "#fff", opacity: dayMood ? 1 : 0.5 }} disabled={!dayMood}>이대로 기록하기</button>
          </div>
        )}

        {/* ── 완료 팝업 — 캐릭터가 말랑이를 눌러보라고 채팅하듯 안내 ── */}
        {phase === "celebrate" && moodData && (
          <MallangStressPopup mood={moodData.v} charImage={charImage} nextLabel="완료" onNext={() => { if (!isLoggedIn) setShowKakaoPrompt(true); else if (onClose) onClose(); }} />
        )}

        {showFeedback && (
          <FeedbackModal source="diary" userId={(() => { try { return JSON.parse(localStorage.getItem("bmti_user") || "null")?.id || null; } catch { return null; } })()} onClose={() => setShowFeedback(false)} />
        )}

        {sorePopup && (
          <MallangInfoPopup mode="sore" userInfo={userInfo} isLoggedIn={isLoggedIn} gender={gender} setUserProfile={setUserProfile}
            askReconfirm={sorePopup.askReconfirm} onClose={() => setSorePopup(null)} />
        )}

        {/* 로그인 안 한 게스트: 기록 후 카카오 저장 유도 */}
        {showKakaoPrompt && (
          <KakaoSavePromptPopup
            onLogin={() => { setShowKakaoPrompt(false); if (onRequireLogin) onRequireLogin(); if (onClose) onClose(); }}
            onClose={() => { setShowKakaoPrompt(false); if (onClose) onClose(); }}
          />
        )}

        {/* ── 나가기 전 확인 — 저장 안 한 답변이 있을 때만 뜬다 ── */}
        {showLeaveWarning && (
          <div onClick={() => setShowLeaveWarning(false)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(28,26,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 320, background: "#fff", borderRadius: 22, padding: "26px 22px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, lineHeight: 1.5 }}>지금 나가면 작성하던<br />내용이 사라져요</div>
              <p style={{ fontSize: 13, color: C.sub, fontWeight: 600, margin: "8px 0 20px" }}>그래도 나가시겠어요?</p>
              <button onClick={() => setShowLeaveWarning(false)} style={{ width: "100%", padding: 15, borderRadius: 15, border: "none", background: C.gold, color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>
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
        <span style={{ width: 24, height: 24, borderRadius: "50%", background: getTypeAccent().accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
        <span style={{ fontSize: 12, color: done ? getTypeAccent().accentDeep : C.sub, fontWeight: 700, flexShrink: 0, transition: "transform .2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>
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

function Card({ title, action, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "0 0 16px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: C.ink, margin: 0 }}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Chip({ label, on, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{ flex: "0 0 auto", padding: "9px 15px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: disabled ? "default" : "pointer",
      border: on ? "1px solid transparent" : `1px solid ${YELLOW_LINE}`, background: on ? getTypeAccent().accent : YELLOW, color: on ? "#fff" : "#8A7B3E", opacity: disabled ? 0.35 : 1, transition: "all .15s" }}>
      {label}
    </button>
  );
}

// 오늘의 태그 — 둥근 모서리 네모 박스(아이콘 + 라벨), 가로 스크롤 목록에 들어간다.
// '오늘 평소보다 무리했나요?'의 EmojiTile과 동일한 연한 옐로우 배경 스타일.
function TagBox({ icon, label, on, onClick, t }) {
  return (
    <button onClick={onClick} style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer", padding: 0, width: 72 }}>
      <div style={{
        width: 54, height: 54, borderRadius: "32%", background: on ? t.accent : C.yellow,
        display: "flex", alignItems: "center", justifyContent: "center",
        filter: on ? "none" : "grayscale(0.25) opacity(0.9)",
        boxShadow: on ? "0 4px 14px rgba(0,0,0,0.12)" : "none", transition: "all .15s",
      }}>
        <DiaryIcon name={icon} size={28} />
      </div>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: on ? C.ink : C.sub, textAlign: "center", lineHeight: 1.15, wordBreak: "keep-all" }}>{label}</span>
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
  const t = getTypeAccent();
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
        background: on ? t.accent : tint,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 5,
        boxShadow: on ? "0 4px 14px rgba(0,0,0,0.12)" : "none",
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
  const t = getTypeAccent();
  return (
    <button onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer", padding: 0, flex: 1 }}>
      <div style={{
        width: 54, height: 54, borderRadius: "32%", background: on ? t.accent : tint,
        display: "flex", alignItems: "center", justifyContent: "center",
        filter: on ? "none" : "grayscale(0.25) opacity(0.9)",
        boxShadow: on ? "0 4px 14px rgba(0,0,0,0.12)" : "none", transition: "all .15s",
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
