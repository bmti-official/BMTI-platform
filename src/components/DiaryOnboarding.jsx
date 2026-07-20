import { useState } from "react";
import { Mallang } from "./Mallang";
import MallangStressPopup from "./MallangStressPopup";
import { MOODS } from "../data";
import { supabase } from "../lib/supabaseClient";
import { getTypeAccent, GOLD } from "../lib/typeAccent";

// ─────────────────────────────────────────────
// BMTI 하루일기 — 첫 방문자용 온보딩 대화
// 한 화면에 하나의 대화만. 탭하면 다음으로.
// 마지막에 말랑이 5개 → 첫 기록 → (운동 정보 팝업, 1회) → 완료
// ─────────────────────────────────────────────

const C = {
  bg: "#FFFFFF", card: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2",
  tileOff: "#F3F1EC",
};

const FREQ_OPTS = [
  { id: "none", label: "거의 안 해요" },
  { id: "sometimes", label: "가끔 생각날 때" },
  { id: "weekly", label: "일주일에 몇 번" },
  { id: "daily", label: "거의 매일" },
];
const GOAL_OPTS = [
  { id: "flexibility", label: "💢 뻐근함 줄이기" },
  { id: "posture", label: "🧘🏻‍♀️ 자세 바로잡기" },
  { id: "health", label: "🏃🏻 체력 기르기" },
  { id: "stress", label: "💥 스트레스 풀기" },
];
const POSTURE_OPTS = [
  { id: "sitting", label: "🪑 주로 앉아 있어요", sub: "사무직, 공부 등" },
  { id: "standing", label: "🧍 주로 서 있어요", sub: "판매, 요리, 미용 등" },
  { id: "moving", label: "🚶 계속 움직여요", sub: "간호, 육아, 서비스 등" },
  { id: "mixed", label: "🔄 앉았다 섰다 해요", sub: "다양" },
  { id: "other", label: "기타" },
];

export default function DiaryOnboarding({ nickname, bmtiCode, charImage, charName, isLoggedIn, onRequireLogin, setView, onComplete, userId, setUserProfile }) {
  const [i, setI] = useState(0);
  const [mood, setMood] = useState(null);
  const [phase, setPhase] = useState("talk"); // talk | pick | react | save
  const t = getTypeAccent(bmtiCode);

  // 첫 진입 마지막에 딱 한 번만 물어보는 운동 정보 팝업
  const [showExerciseInfo, setShowExerciseInfo] = useState(false);
  const [freq, setFreq] = useState(null);
  const [goals, setGoals] = useState([]);
  const [posture, setPosture] = useState(null);
  const [postureCustom, setPostureCustom] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const toggleGoal = (id) => setGoals(g => g.includes(id) ? g.filter(x => x !== id) : (g.length >= 2 ? g : [...g, id]));

  const finishOnboarding = () => {
    setShowExerciseInfo(false);
    if (onComplete) onComplete(mood);
  };

  const submitExerciseInfo = async () => {
    const finalPosture = posture === "other" ? postureCustom.trim() : posture;
    if (userId) {
      setSavingInfo(true);
      try {
        await supabase.from("users").update({
          exercise_frequency: freq,
          exercise_goals: goals,
          common_posture: finalPosture,
        }).eq("id", userId);
        if (setUserProfile) {
          setUserProfile(prev => {
            const updated = { ...prev, exercise_frequency: freq, exercise_goals: goals, common_posture: finalPosture };
            localStorage.setItem("bmti_user", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (e) {
        console.error("운동 정보 저장 실패", e);
      }
      setSavingInfo(false);
    }
    finishOnboarding();
  };

  const STEPS = [
    {
      id: "intro",
      title: isLoggedIn ? (
        <><span style={{ color: t.accentDeep }}>{nickname}</span> 님,<br />이제 당신의 <Mark>성향을 알았어요.</Mark></>
      ) : (
        <>당신의 성향 알려줘요.</>
      ),
      sub: isLoggedIn ? "근데 이건 시작일 뿐이에요." : "",
      lead: "이제부터 매일 조금씩, 진짜 내 몸을 알아가요.",
    },
    {
      id: "lazy",
      badge: "⏱️ 하루 10초",
      me: "몸이 계속 무겁긴 한데...\n뭘 또 챙겨야 한다고 생각하니 벌써 지쳐요 🥲",
      bot: "뭘 챙기라고 안 할게요.\n그냥 오늘 어땠는지만 알려주세요.\n10초면 충분해요. 나머지는 제가 기억할게요. 🧠",
    },
    {
      id: "blame",
      badge: "🌱 당신 탓이 아니에요",
      me: "운동도 해봤고 앱도 깔아봤는데\n결국 다 흐지부지됐어요...",
      bot: "지금까지 잘 안 됐던 건, 의지 탓이 아니에요.\n남들 방식에 나를 맞추려 했을 뿐이죠.\n\n성격이 다 다르듯,\n내 몸에 맞는 방식은 따로 있어요.",
    },
    {
      id: "safety",
      badge: "🏥 건강이 먼저예요",
      me: "요즘 목이 계속 뻐근한데...\n이거 괜찮은 걸까요?",
      bot: "저는 의사가 아니라, 진단은 못 해요.\n많이 아플 땐 병원에 먼저 가주세요. 🏥\n\n대신 언제 병원에 가야 할지는\n꼭 알려드릴게요.",
    },
    {
      id: "secret",
      badge: "🔒 여기만의 이야기",
      me: "근데 이거... 다른 사람이 볼 수도 있어요? 👀",
      bot: "여기 남긴 이야기는 아무에게도 보이지 않아요.\n오직 당신과 저만 아는 비밀이에요. 🔒",
    },
  ];

  const step = STEPS[i];
  const next = () => {
    if (i < STEPS.length - 1) setI(i + 1);
    else setPhase("pick");
  };

  const pickMood = (v) => {
    if (!isLoggedIn) {
      alert('카카오톡 로그인이 필요해요.');
      if (onRequireLogin) onRequireLogin();
      return;
    }
    if (!bmtiCode) {
      alert('먼저 BMTI 설문을 완료해주세요.');
      if (setView) setView('quiz');
      return;
    }
    setMood(v);
    setPhase("react");
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", justifyContent: "center",
      fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>
      <div style={{ width: "100%", maxWidth: 420, minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* 진행 점 */}
        {phase === "talk" && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "96px 0 0" }}>
            {STEPS.map((_, n) => (
              <div key={n} style={{ width: n === i ? 18 : 6, height: 6, borderRadius: 6, transition: "all .3s",
                background: n <= i ? t.accent : C.line }} />
            ))}
          </div>
        )}

        {/* ── 대화 단계 ── */}
        {phase === "talk" && (
          <div key={step.id} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
            padding: "20px 24px 110px", animation: "fadeUp .4s ease-out", overflowY: "auto" }}>

            {step.id === "intro" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 22, animation: "pop .5s ease-out" }}>
                  <Mallang v={5} size={96} />
                </div>
                <h1 style={{ fontSize: "clamp(26px,6.5vw,32px)", fontWeight: 800, lineHeight: 1.45, letterSpacing: "-0.03em", margin: 0 }}>
                  {step.title}
                </h1>
                <p style={{ fontSize: 15, color: C.sub, margin: "18px 0 0" }}>{step.sub}</p>
                <p style={{ fontSize: 16, fontWeight: 600, margin: "28px 0 0", lineHeight: 1.6 }}>{step.lead}</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 26 }}>{step.badge}</div>

                {/* 나의 말 (검정 말풍선, 우측) */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                  <div style={{ maxWidth: "88%", background: C.ink, color: "#fff", borderRadius: "18px 18px 4px 18px",
                    padding: "15px 17px", fontSize: 14.5, lineHeight: 1.65, whiteSpace: "pre-line" }}>
                    {step.me}
                  </div>
                </div>

                {/* 캐릭터의 말 (흰 말풍선, 좌측) */}
                <div style={{ display: "flex", gap: 9, alignItems: "flex-end" }}>
                  <Companion image={charImage} />
                  <div style={{ maxWidth: "85%", background: C.card, border: `1px solid ${C.line}`, borderRadius: "18px 18px 18px 4px",
                    padding: "15px 17px", fontSize: 14.5, lineHeight: 1.7, whiteSpace: "pre-line",
                    animation: "fadeUp .5s ease-out .25s both" }}>
                    {step.bot}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 말랑이 고르기 (첫 기록) — 캐릭터가 채팅하듯 말풍선으로 물어보는 형태 ── */}
        {phase === "pick" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px 60px", animation: "fadeUp .4s ease-out" }}>
            <div style={{ textAlign: "center", marginBottom: 30 }}>
              <div style={{ position: "relative", display: "inline-block", maxWidth: "90%" }}>
                <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: "16px 22px",
                  fontSize: 17, fontWeight: 800, lineHeight: 1.5, letterSpacing: "-0.01em", boxShadow: "0 2px 14px rgba(0,0,0,0.04)" }}>
                  내 마음에 가까운<br />말랑이를 선택해요 !
                </div>
                <div style={{ position: "absolute", left: "50%", bottom: -8, transform: "translateX(-50%) rotate(45deg)",
                  width: 16, height: 16, background: C.card, borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }} />
              </div>
              <div style={{ marginTop: 24, display: "flex", justifyContent: "center", animation: "pop .5s ease-out" }}>
                {charImage ? (
                  <img src={charImage} alt="me" style={{ width: 64, height: 64, objectFit: "contain" }} />
                ) : (
                  <div style={{ fontSize: 46 }}>🤖</div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
              {MOODS.map(m => (
                <button key={m.v} onClick={() => pickMood(m.v)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  padding: "10px 2px", borderRadius: 16, border: "none", background: "transparent", cursor: "pointer" }}>
                  <Mallang v={m.v} size={50} />
                  <span style={{ fontSize: 9.5, color: C.sub, fontWeight: 700, whiteSpace: "nowrap" }}>{m.label}</span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: C.sub, textAlign: "center", marginTop: 30 }}>딱 한 번만 누르면, 오늘 기록이 시작돼요.</p>
          </div>
        )}

        {/* ── 첫 기록 직후 반응 — 캐릭터가 말랑이를 눌러보라고 채팅하듯 안내하는 팝업 ── */}
        {phase === "react" && (
          <MallangStressPopup mood={mood} charImage={charImage} onNext={() => setPhase("save")} />
        )}

        {/* ── 저장(완료) ── */}
        {phase === "save" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px 60px", animation: "fadeUp .4s ease-out" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><Mallang v={mood} size={70} /></div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>오늘 하루, 기억했어요</h1>
              <p style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.7, margin: "14px 0 0" }}>
                내일도 물어봐도 될까요?<br />
                {charName ? `${charName}이` : "제가"} 계속 이어서 기록해둘게요.
              </p>
            </div>

            {/* 7일 뒤 예고 (블러) */}
            <div style={{ marginTop: 30, background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "18px 18px 16px", position: "relative", overflow: "hidden" }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 12 }}>📖 7일 뒤, 이런 걸 알게 돼요</div>
              <div style={{ filter: "blur(3.5px)", opacity: 0.55, pointerEvents: "none" }}>
                <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                  {[3, 2, 4, 2, 1, 4, 5].map((v, n) => <div key={n} style={{ flex: 1 }}><Mallang v={v} size={26} /></div>)}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: C.ink }}>
                  바쁜 날마다 목이 뻐근해지는 패턴이 보여요.
                  긴장하면 어깨에 힘이 들어가는 것 같아요.
                </div>
              </div>
              <div style={{ position: "absolute", right: 16, bottom: 14, fontSize: 11, fontWeight: 700, color: C.sub }}>기록이 쌓이면 열려요</div>
            </div>

            <button onClick={() => setShowExerciseInfo(true)} style={{ width: "100%", marginTop: 26, padding: 17, borderRadius: 15, border: "none",
              background: GOLD, color: "#fff", fontSize: 15.5, fontWeight: 800, cursor: "pointer" }}>
              캘린더에서 계속 기록하기
            </button>
          </div>
        )}

        {/* ── 운동 정보 팝업 (첫 진입 시 딱 한 번) ── */}
        {showExerciseInfo && (
          <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(28,26,23,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 420, maxHeight: "88vh", overflowY: "auto", background: "#fff", borderRadius: "26px 26px 0 0", padding: "26px 22px 22px", animation: "fadeUp .3s ease-out" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px", textAlign: "center" }}>운동 습관을 알려주세요</h2>
              <p style={{ fontSize: 12.5, color: C.sub, textAlign: "center", margin: "0 0 22px" }}>딱 한 번만 물어볼게요. 앞으로의 기록에 참고할게요.</p>

              <ExerciseQuestion label="평소 운동, 어떻게 하세요?">
                {FREQ_OPTS.map(o => (
                  <PillOption key={o.id} label={o.label} on={freq === o.id} onClick={() => setFreq(o.id)} />
                ))}
              </ExerciseQuestion>

              <ExerciseQuestion label="몸 관리에서 제일 신경 쓰는 건? (최대 2개)">
                {GOAL_OPTS.map(o => (
                  <PillOption key={o.id} label={o.label} on={goals.includes(o.id)} onClick={() => toggleGoal(o.id)} disabled={!goals.includes(o.id) && goals.length >= 2} />
                ))}
              </ExerciseQuestion>

              <ExerciseQuestion label="요즘 하루 대부분 어떻게 지내요?">
                {POSTURE_OPTS.map(o => (
                  <PillOption key={o.id} label={o.label} sub={o.sub} on={posture === o.id} onClick={() => setPosture(o.id)} />
                ))}
                {posture === "other" && (
                  <input
                    type="text"
                    value={postureCustom}
                    onChange={(e) => setPostureCustom(e.target.value.slice(0, 20))}
                    placeholder="짧게 적어주세요 (예: 운전을 오래 해요)"
                    style={{ width: "100%", marginTop: 4, padding: "10px 13px", borderRadius: 14, border: `1px solid ${C.line}`, fontSize: 13, outline: "none" }}
                  />
                )}
              </ExerciseQuestion>

              <button
                onClick={submitExerciseInfo}
                disabled={!freq || !posture || (posture === "other" && !postureCustom.trim()) || goals.length === 0 || savingInfo}
                style={{ width: "100%", marginTop: 8, padding: 16, borderRadius: 15, border: "none", background: GOLD, color: "#fff",
                  fontSize: 15, fontWeight: 800, cursor: "pointer", opacity: (!freq || !posture || (posture === "other" && !postureCustom.trim()) || goals.length === 0) ? 0.4 : 1 }}
              >
                {savingInfo ? "저장하는 중..." : "저장하고 계속하기"}
              </button>
              <button onClick={finishOnboarding} style={{ display: "block", width: "100%", textAlign: "center", marginTop: 14, border: "none", background: "transparent", color: C.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 4 }}>
                다음에 입력할게요
              </button>
            </div>
          </div>
        )}

        {/* 하단 버튼 (대화 단계에서만) */}
        {phase === "talk" && (
          <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, padding: "14px 24px 28px", background: `linear-gradient(transparent, ${C.bg} 30%)`, zIndex: 45 }}>
            {!isLoggedIn ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <button onClick={() => { if (onRequireLogin) onRequireLogin(); }} style={{ width: "100%", padding: 17, borderRadius: 15, border: "none", background: "#FEE500", color: "#3C1E1E", fontSize: 15.5, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "#3C1E1E" }}><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" /></svg>
                  카카오로 3초 기록
                </button>
                <p style={{ fontSize: 11, color: C.sub, marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>🔕</span> 광고 안 보냄 · 결과만 저장
                </p>
              </div>
            ) : (
              <button onClick={next} style={{ width: "100%", padding: 17, borderRadius: 15, border: "none", background: GOLD, color: "#fff", fontSize: 15.5, fontWeight: 800, cursor: "pointer" }}>
                {i < STEPS.length - 1 ? "다음" : "그럼 시작해볼까요"}
              </button>
            )}
          </div>
        )}

        <style>{`
          @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
          @keyframes pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        `}</style>
      </div>
    </div>
  );
}

// 형광펜 강조
function Mark({ children }) {
  return <span style={{ background: getTypeAccent().accentSoft, padding: "0 4px", borderRadius: 3, boxDecorationBreak: "clone" }}>{children}</span>;
}

// AI 동반자 아바타 — 로그인/설문 전에는 유형을 몰라 기본 아이콘으로 대체
function Companion({ image }) {
  return (
    <div style={{ width: 34, height: 34, borderRadius: "50%", background: getTypeAccent().accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, overflow: "hidden" }}>
      {image ? <img src={image} alt="AI" style={{ width: "85%", height: "85%", objectFit: "contain" }} /> : "🤖"}
    </div>
  );
}

function ExerciseQuestion({ label, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

function PillOption({ label, sub, on, onClick, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ padding: sub ? "8px 15px" : "9px 15px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: disabled ? "default" : "pointer",
        border: "none", background: on ? getTypeAccent().accent : C.tileOff, color: on ? "#fff" : C.sub, opacity: disabled ? 0.35 : 1, transition: "all .15s",
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}
    >
      <span>{label}</span>
      {sub && <span style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.75 }}>{sub}</span>}
    </button>
  );
}
