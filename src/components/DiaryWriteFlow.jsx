import { useState } from "react";
import { DAY_MOODS } from "../data";
import workStamp1 from "../assets/work_stamps/work_1_relaxed.jpg";
import workStamp2 from "../assets/work_stamps/work_2_manageable.jpg";
import workStamp3 from "../assets/work_stamps/work_3_average.jpg";
import workStamp4 from "../assets/work_stamps/work_4_overloaded.jpg";
import workStamp5 from "../assets/work_stamps/work_5_exploded.jpg";

// ============================================
// BMTI 일기 작성 플로우
// 헤더: 좌 이전 / 우 환경설정(글씨체, 일기장 색상, 선택항목 +/-)
// 필수: 오늘 하루(무드 5) → 오늘 얼마나 바빴어요(5)
// 선택질문: 한 화면에 하나씩 (켜둔 항목만 순서대로)
// → AI 정리 일기장 → 완료
// * 플로우 확인용 프로토타입. 이모지는 임시(추후 이미지로 교체). AI 정리는 mock.
// ============================================

const C = {
  bg: "#F5F5F7", card: "#FFFFFF", ink: "#1A1A1A", sub: "#9B9B9B", line: "#EFEFEF",
  main: "#111111", accent: "#FF6B9D", accentSoft: "#FDECF2",
  warn: "#FF6B6B", yellow: "#FFF3C4", pink: "#FF6B9D", pinkSoft: "#FEE7EF",
};

// 일기장 색상 옵션
const PAPER_COLORS = {
  white: { label: "화이트", bg: "#FFFFFF", line: "#F0F0F0" },
  pink: { label: "핑크", bg: "#FFF5F8", line: "#FBE0EC" },
  ivory: { label: "아이보리", bg: "#FBF7EE", line: "#EFE7D5" },
  green: { label: "그린", bg: "#F2F8F3", line: "#DDEBDF" },
};
// 글씨체 옵션
const FONTS = {
  round: { label: "둥근체", css: "'Pretendard', sans-serif" },
  serif: { label: "명조체", css: "'Nanum Myeongjo', serif" },
  hand: { label: "손글씨", css: "'Gaegu', cursive" },
  gothic: { label: "고딕체", css: "'Noto Sans KR', sans-serif" },
};

const WORK_LEVELS = [
  { v: 1, icon: "🌱", label: "여유로웠어요", image: workStamp1 },
  { v: 2, icon: "📖", label: "할 만했어요", image: workStamp2 },
  { v: 3, icon: "⚖️", label: "보통이었어요", image: workStamp3 },
  { v: 4, icon: "🔥", label: "과부하왔어요", image: workStamp4 },
  { v: 5, icon: "🌪️", label: "폭발했어요", image: workStamp5 },
];
const PARTS = ["목", "어깨", "등", "허리", "손목", "무릎", "골반", "발목"];
const WHEN_OPTS = ["오늘 아침 일어날 때", "자고 일어났을 때", "움직일 때", "특정 자세일 때", "하루 종일"];
const CATEGORIES = [
  { id: "exercise", label: "운동습관", on: "#3F9F5B", bg: "#E4F5E7", border: "#B6E4C0", ph: "예: 오늘 아침에 스트레칭 10분 했어요 🧘" },
  { id: "daily", label: "일상", on: "#B8912A", bg: "#FDF6D3", border: "#F2E3A0", ph: "예: 오후에 커피 마시면서 잠깐 여유 부렸어요 ☕" },
  { id: "worry", label: "고민", on: "#8A3FD1", bg: "#F0E6FB", border: "#DAC2F5", ph: "예: 요즘 어깨가 자꾸 뭉치는데 신경 쓰여요 😭" },
];
const TIMESLOTS = [
  { label: "아침", range: "6~11시" },
  { label: "점심", range: "11~14시" },
  { label: "오후", range: "14~18시" },
  { label: "저녁", range: "18~22시" },
  { label: "밤", range: "22~6시" },
];

// 선택 질문 항목 정의 (켜보면/끄면서 순서대로 물어봄)
const OPTIONAL_QUESTIONS = [
  { id: "oneline", title: "오늘 한 줄", emoji: "✏️" },
  { id: "sore", title: "뻐근한 부위", emoji: "🐢" },
  { id: "sitting", title: "오늘 앉아있었어요", short: "앉아있던 시간", emoji: "🪑", unit: "시간", opts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], def: 6 },
  { id: "sleep", title: "잠은 얼마나 주무셨어요", short: "수면", emoji: "😴", unit: "시간", opts: [3, 4, 5, 6, 7, 8, 9, 10], def: 7 },
  { id: "exercise", title: "운동했어요", short: "운동", emoji: "🏃", unit: "분", opts: [0, 10, 20, 30, 45, 60, 90], def: 0 },
  { id: "selfcare", title: "스트레칭·마사지했어요", short: "스트레칭·마사지", emoji: "🤸", unit: "분", opts: [0, 5, 10, 15, 20, 30, 45], def: 0 },
];

export default function DiaryWriteFlow({ onClose, charName = "AI 캐릭터", initialPhase = "day", initialDayMood = null }) {
  // phase: day | work | opt | writing | diary | done
  const [phase, setPhase] = useState(initialPhase);
  const [optIdx, setOptIdx] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // 설정
  const [font, setFont] = useState("round");
  const [paper, setPaper] = useState("white");
  const [enabledQ, setEnabledQ] = useState(["oneline", "sore", "sitting", "sleep"]); // 켠 선택질문

  // 데이터
  const [dayMood, setDayMood] = useState(initialDayMood);
  const [workLevel, setWorkLevel] = useState(null);
  const [oneLine, setOneLine] = useState({ slot: "오후", cat: "daily", text: "" });
  const [sore, setSore] = useState({ part: null, level: 5, when: null });
  const [numVals, setNumVals] = useState(Object.fromEntries(OPTIONAL_QUESTIONS.filter(q => q.opts).map(q => [q.id, q.def])));
  const [selDate, setSelDate] = useState(new Date());
  const [showDatePick, setShowDatePick] = useState(false);

  const activeOpts = OPTIONAL_QUESTIONS.filter(q => enabledQ.includes(q.id));
  const totalSteps = 2 + activeOpts.length + 1; // day, work, opts..., diary
  const curStep = phase === "day" ? 0 : phase === "work" ? 1 : phase === "diary" ? 2 + activeOpts.length : phase === "done" ? totalSteps : 2 + optIdx;

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
      setDiaryBody(buildDiary({ dayMood, workLevel, oneLine, sore, numVals, enabledQ }));
      setPhase("diary");
    }, 2000);
  };

  // 뒤로가기 (첫 단계에서는 플로우 자체를 닫는다)
  const goBack = () => {
    if (phase === "day") { if (onClose) onClose(); }
    else if (phase === "work") setPhase("day");
    else if (phase === "opt") { if (optIdx === 0) setPhase("work"); else setOptIdx(i => i - 1); }
    else if (phase === "done") setPhase("diary");
  };
  const startOpts = () => { if (activeOpts.length) { setPhase("opt"); setOptIdx(0); } else goDiary(); };
  const nextOpt = () => { if (optIdx < activeOpts.length - 1) setOptIdx(i => i + 1); else goDiary(); };

  const reset = () => {
    setPhase("day"); setOptIdx(0); setDayMood(null); setWorkLevel(null);
    setOneLine({ slot: "오후", cat: "daily", text: "" }); setSore({ part: null, level: 5, when: null });
    setNumVals(Object.fromEntries(OPTIONAL_QUESTIONS.filter(q => q.opts).map(q => [q.id, q.def])));
    setDiaryTitle(""); setEditMode(false);
  };

  const finishFlow = () => {
    reset();
    if (onClose) onClose();
  };

  return (
    <div className="min-h-screen pt-40 pb-10" style={{ background: C.bg, display: "flex", justifyContent: "center", fontFamily: F, color: C.ink }}>
      <div style={{ width: "100%", maxWidth: 420, minHeight: "70vh", background: phase === "diary" || phase === "writing" ? PAPER_COLORS[paper].bg : C.bg, position: "relative", display: "flex", flexDirection: "column" }}>

        {/* ── 헤더 (일기장/작성중/완료 화면에서는 숨김 — 자체 헤더 사용) ── */}
        {phase !== "diary" && phase !== "writing" && phase !== "done" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 8px" }}>
          <button onClick={goBack} style={{ width: 38, height: 38, borderRadius: "50%", border: "none",
            background: `${C.card}CC`, color: C.ink, fontSize: 18, cursor: "pointer" }}>‹</button>

          {/* 가운데 날짜 아이콘버튼 */}
          <button onClick={() => setShowDatePick(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "transparent", cursor: "pointer", fontSize: 16, fontWeight: 800, color: C.ink }}>
            {selDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            <span style={{ fontSize: 11, color: C.sub, transform: showDatePick ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span>
          </button>

          {/* 설정 버튼 */}
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

        {/* ── 진행바 (일기장/작성중/완료 제외) ── */}
        {phase !== "diary" && phase !== "writing" && phase !== "done" && (
        <div style={{ display: "flex", gap: 4, padding: "4px 4px 4px" }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: curStep >= i ? C.ink : C.line }} />
          ))}
        </div>
        )}

        <div style={{ flex: 1, padding: "14px 4px 40px" }}>
          {/* ── 필수 1: 오늘 하루 ── */}
          {phase === "day" && (
            <>
              <Badge>오늘의 BMTI 일기</Badge>
              <h1 style={h1}>오늘 하루,<br />어떠셨어요?</h1>
              <p style={sub}>지금 마음에 가장 가까운 표정을 골라주세요.</p>
              <FaceRow items={DAY_MOODS} value={dayMood} onPick={setDayMood} render={m => m.face} />
              <button onClick={() => dayMood && setPhase("work")} style={{ ...primary, opacity: dayMood ? 1 : 0.35 }}>다음</button>
            </>
          )}

          {/* ── 필수 2: 업무/공부 ── */}
          {phase === "work" && (
            <>
              <Badge>오늘의 BMTI 일기</Badge>
              <h1 style={h1}>오늘 얼마나<br />바빴어요?</h1>
              <p style={sub}>일이든 공부든, 오늘 하루 부담이 어느 정도인지 골라주세요.</p>
              <FaceRow items={WORK_LEVELS} value={workLevel} onPick={setWorkLevel} render={w => w.icon} />
              <button onClick={() => workLevel && startOpts()} style={{ ...primary, opacity: workLevel ? 1 : 0.35 }}>다음</button>
            </>
          )}

          {/* ── 선택질문: 한 화면에 하나씩 ── */}
          {phase === "opt" && activeOpts[optIdx] && (() => {
            const q = activeOpts[optIdx];
            return (
              <>
                <div style={{ fontSize: 13, color: C.sub, fontWeight: 700, marginBottom: 10 }}>선택 기록 {optIdx + 1} / {activeOpts.length}</div>
                <h1 style={h1}>{q.emoji} {q.title}</h1>

                {/* 오늘 한 줄 */}
                {q.id === "oneline" && (<>
                  <p style={sub}>언제, 어떤 이야기인지 편하게 남겨요.</p>
                  <Label>언제 있었던 일이에요?</Label>
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                    {TIMESLOTS.map(t => {
                      const on = oneLine.slot === t.label;
                      return (
                        <button key={t.label} onClick={() => setOneLine(s => ({ ...s, slot: t.label }))} style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 14px", borderRadius: 16, cursor: "pointer",
                          border: on ? `2px solid ${C.ink}` : `1px solid ${C.line}`, background: on ? C.ink : C.card }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: on ? "#fff" : C.sub }}>{t.label}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: on ? "rgba(255,255,255,0.7)" : C.sub }}>{t.range}</span>
                        </button>
                      );
                    })}
                  </div>
                  <Label>어떤 이야기예요?</Label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {CATEGORIES.map(c => {
                      const on = oneLine.cat === c.id;
                      return (
                        <button key={c.id} onClick={() => setOneLine(s => ({ ...s, cat: c.id }))} style={{ padding: "11px 20px", borderRadius: 22, fontSize: 14, fontWeight: 800, cursor: "pointer",
                          border: on ? `2px solid ${c.border}` : "2px solid transparent", background: on ? c.bg : "#F2F2F4", color: on ? c.on : C.sub }}>{c.label}</button>
                      );
                    })}
                  </div>
                  <textarea value={oneLine.text} onChange={e => setOneLine(s => ({ ...s, text: e.target.value }))} placeholder={CATEGORIES.find(c => c.id === oneLine.cat)?.ph}
                    style={{ width: "100%", marginTop: 12, minHeight: 80, borderRadius: 14, border: `1px solid ${C.line}`, background: C.card, padding: 14, fontSize: 14.5, resize: "none", outline: "none", fontFamily: F, boxSizing: "border-box" }} />
                </>)}

                {/* 뻐근한 부위 */}
                {q.id === "sore" && (<>
                  <p style={sub}>불편한 곳이 있으면 알려주세요. 없으면 넘어가도 돼요.</p>
                  <Label>어디가 불편했어요?</Label>
                  <ChipRow opts={PARTS} value={sore.part} onPick={v => setSore(s => ({ ...s, part: v }))} wrap />
                  {sore.part && <>
                    <Label>얼마나 불편했어요? ({sore.level})</Label>
                    <input type="range" min="0" max="10" value={sore.level} onChange={e => setSore(s => ({ ...s, level: +e.target.value }))} style={{ width: "100%", accentColor: C.warn }} />
                    <Label>언제 그러셨어요?</Label>
                    <ChipRow opts={WHEN_OPTS} value={sore.when} onPick={v => setSore(s => ({ ...s, when: v }))} wrap />
                  </>}
                </>)}

                {/* 시간대 (숫자 스크롤) */}
                {q.opts && (<>
                  <p style={sub}>간편하게 골라주세요.</p>
                  <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginTop: 6 }}>
                    {q.opts.map(o => (
                      <button key={o} onClick={() => setNumVals(s => ({ ...s, [q.id]: o }))} style={{ flex: "0 0 auto", minWidth: 58, padding: "16px 12px", borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: "pointer",
                        border: numVals[q.id] === o ? `2px solid ${C.ink}` : `1px solid ${C.line}`, background: numVals[q.id] === o ? C.ink : C.card, color: numVals[q.id] === o ? "#fff" : C.sub }}>
                        {o}<span style={{ fontSize: 10, fontWeight: 600 }}> {q.unit}</span>
                      </button>
                    ))}
                  </div>
                </>)}

                <button onClick={nextOpt} style={primary}>{optIdx < activeOpts.length - 1 ? "다음" : "일기 정리하기"}</button>
                <button onClick={nextOpt} style={ghost}>이건 건너뛸게요</button>
              </>
            );
          })()}

          {/* ── 작성중 (2초 로딩) ── */}
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
              <h1 style={{ ...h1, textAlign: "center" }}>오늘도 잘 채웠어요</h1>
              <p style={{ ...sub, textAlign: "center" }}>{charName}이 답장을 남겼어요. 조금 뒤 일기장에서 만나요 📩</p>
              <div style={{ background: C.pinkSoft, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16, margin: "20px 0", textAlign: "left", display: "flex", gap: 12 }}>
                <Char />
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  {dayMood <= 2 ? "오늘 많이 힘드셨죠. 그런 날도 있는 거예요. 오늘은 어깨 팡팡 하고 일찍 쉬어요 🫂" : "오늘 하루도 잘 보내셨네요! 내일 또 이야기 들려주세요 🌿"}
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>📊 3일만 쌓이면, 한 주를 정리한 리포트를 받아볼 수 있어요</div>
              <button onClick={finishFlow} style={primary}>오늘 기록 마치기</button>
            </div>
          )}
        </div>

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

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "6px 18px 14px", gap: 10, borderBottom: `1px solid ${PAPER_COLORS[paper].line}` }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 52 }}>
                <span style={{ fontSize: 26 }}>{DAY_MOODS.find(m => m.v === dayMood)?.face}</span>
                <span style={{ fontSize: 10, color: C.sub, fontWeight: 700 }}>{DAY_MOODS.find(m => m.v === dayMood)?.label}</span>
              </div>
              <div style={{ flex: 1, textAlign: "center", paddingTop: 2 }}>
                {editMode ? (
                  <input value={diaryTitle} onChange={e => setDiaryTitle(e.target.value)} placeholder="제목"
                    style={{ width: "100%", textAlign: "center", fontSize: 16, fontWeight: 800, border: "none", borderBottom: `2px solid ${C.pink}`, background: "transparent", outline: "none", fontFamily: F, color: C.ink, padding: "2px 0" }} />
                ) : (
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, lineHeight: 1.3 }}>{diaryTitle}</div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 52 }}>
                <span style={{ fontSize: 26 }}>{WORK_LEVELS.find(w => w.v === workLevel)?.icon}</span>
                <span style={{ fontSize: 10, color: C.sub, fontWeight: 700 }}>{WORK_LEVELS.find(w => w.v === workLevel)?.label}</span>
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
              <button onClick={() => setPhase("done")} style={{ ...primary, marginTop: 0 }}>맞아요, 이렇게 기억해주세요</button>
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

              {/* 글씨체 */}
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>글씨체</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
                {Object.entries(FONTS).map(([k, v]) => (
                  <button key={k} onClick={() => setFont(k)} style={{ padding: "13px 0", borderRadius: 14, cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: v.css,
                    border: font === k ? `2px solid ${C.ink}` : `1px solid ${C.line}`, background: font === k ? C.ink : C.card, color: font === k ? "#fff" : C.ink }}>{v.label}</button>
                ))}
              </div>

              {/* 일기장 색상 */}
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>일기장 색상</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                {Object.entries(PAPER_COLORS).map(([k, v]) => (
                  <button key={k} onClick={() => setPaper(k)} style={{ flex: 1, cursor: "pointer", border: "none", background: "none", padding: 0 }}>
                    <div style={{ height: 52, borderRadius: 14, background: v.bg, border: paper === k ? `3px solid ${C.ink}` : `1px solid ${C.line}`, marginBottom: 6 }} />
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: paper === k ? C.ink : C.sub, textAlign: "center" }}>{v.label}</div>
                  </button>
                ))}
              </div>

              {/* 선택 기록 항목 +/- */}
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>선택 기록 항목</div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>매일 기록할 항목을 켜고 끌 수 있어요.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {OPTIONAL_QUESTIONS.map(q => {
                  const on = enabledQ.includes(q.id);
                  return (
                    <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: C.card, borderRadius: 14, border: `1px solid ${C.line}` }}>
                      <span style={{ fontSize: 14.5, fontWeight: 700 }}>{q.emoji} {q.title}</span>
                      <button onClick={() => setEnabledQ(e => on ? e.filter(x => x !== q.id) : [...e, q.id])}
                        style={{ width: 30, height: 30, borderRadius: "50%", border: "none", cursor: "pointer", fontSize: 18, fontWeight: 800,
                          background: on ? C.ink : C.accentSoft, color: on ? "#fff" : C.pink }}>{on ? "✕" : "+"}</button>
                    </div>
                  );
                })}
              </div>

              <button onClick={() => setShowSettings(false)} style={{ ...primary, marginTop: 24 }}>완료</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 일기 제목 mock 생성
function makeTitle({ dayMood, sore, oneLine }) {
  if (sore.part) return `${sore.part}가 뻐근한 하루`;
  if (oneLine.text.trim()) return oneLine.text.trim().slice(0, 14) + (oneLine.text.length > 14 ? "…" : "");
  const t = { 1: "조금 버거웠던 하루", 2: "지친 하루", 3: "그저 그런 하루", 4: "괜찮았던 하루", 5: "기분 좋은 하루" }[dayMood];
  return t || "오늘의 일기";
}

// AI 일기 mock
function buildDiary({ dayMood, workLevel, oneLine, sore, numVals, enabledQ }) {
  const parts = [];
  const moodTxt = { 1: "많이 힘든", 2: "조금 지친", 3: "그저 그런", 4: "괜찮은", 5: "기분 좋은" }[dayMood];
  const workTxt = (WORK_LEVELS.find(w => w.v === workLevel)?.label || "").replace(/어요$/, "");
  parts.push(`오늘은 ${moodTxt} 하루였어요. 일이든 공부든 ${workTxt}고요.`);
  if (enabledQ.includes("oneline") && oneLine.text.trim()) parts.push(`${oneLine.slot}엔 ${oneLine.text.trim()}.`);
  if (enabledQ.includes("sore") && sore.part) parts.push(`${sore.part}가 ${sore.when || "하루 종일"} 뻐근했어요 (${sore.level}/10).`);
  const timeItems = OPTIONAL_QUESTIONS.filter(q => q.opts && enabledQ.includes(q.id));
  if (timeItems.length) parts.push(timeItems.map(q => `${q.short} ${numVals[q.id]}${q.unit}`).join(", ") + ".");
  parts.push("오늘도 나를 채운 하루였어요. 잘하고 있어요 🌿");
  return parts.join(" ");
}

// 표정/아이콘 한 줄 — image가 있으면(무드 스탬프) 문구가 이미지에 포함돼 있어 라벨은 생략
function FaceRow({ items, value, onPick, render }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginTop: 8 }}>
      {items.map(m => (
        <button key={m.v} onClick={() => onPick(m.v)} style={faceBtn(value === m.v)}>
          {m.image ? (
            <img src={m.image} alt={m.label} style={{ width: 48, height: 48, objectFit: "contain" }} />
          ) : (
            <>
              <span style={{ fontSize: 28 }}>{render(m)}</span>
              <span style={{ fontSize: 10.5, color: value === m.v ? C.ink : C.sub, fontWeight: 700 }}>{m.label}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}
function ChipRow({ opts, value, onPick, wrap }) {
  return (
    <div style={{ display: "flex", gap: 7, flexWrap: wrap ? "wrap" : "nowrap", overflowX: wrap ? "visible" : "auto", paddingBottom: 2 }}>
      {opts.map(o => (
        <button key={o} onClick={() => onPick(o)} style={{ flex: "0 0 auto", padding: "9px 15px", borderRadius: 20, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
          border: value === o ? `2px solid ${C.ink}` : `1px solid ${C.line}`, background: value === o ? C.ink : C.card, color: value === o ? "#fff" : C.sub }}>{o}</button>
      ))}
    </div>
  );
}
function Label({ children }) { return <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 700, margin: "14px 0 8px" }}>{children}</div>; }
function Char({ big }) { const s = big ? 80 : 38; return <div style={{ width: s, height: s, borderRadius: "50%", background: C.pinkSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: big ? 40 : 19, flexShrink: 0 }}>🐧</div>; }
function Badge({ children }) { return <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.pinkSoft, color: C.pink, fontSize: 12.5, fontWeight: 800, padding: "7px 14px", borderRadius: 20, marginBottom: 16 }}>📝 {children}</div>; }

const faceBtn = (on) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "16px 0", borderRadius: 20, cursor: "pointer", transition: "all .15s",
  border: on ? `2px solid ${C.ink}` : `1px solid ${C.line}`, background: "#fff", boxShadow: on ? "0 2px 12px rgba(0,0,0,0.08)" : "none" });
const h1 = { fontSize: 25, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.32, margin: "0 0 10px" };
const sub = { fontSize: 14, color: C.sub, margin: "0 0 18px", lineHeight: 1.55 };
const primary = { width: "100%", marginTop: 26, padding: 17, borderRadius: 16, border: "none", background: C.ink, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer" };
const ghost = { width: "100%", marginTop: 10, padding: 14, borderRadius: 16, border: "none", background: "transparent", color: C.sub, fontSize: 14, fontWeight: 600, cursor: "pointer" };
