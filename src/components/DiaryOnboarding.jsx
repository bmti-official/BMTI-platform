import { useState } from "react";
import { Mallang } from "./Mallang";
import { supabase } from "../lib/supabaseClient";
import { getTypeAccent, GOLD } from "../lib/typeAccent";

// ─────────────────────────────────────────────
// BMTI 하루일기 — 첫 방문자용 온보딩 (한 화면)
// 예전엔 5개의 대화 페이지를 넘겼지만, 지금은 마지막 '여기만의 이야기' 한 페이지만 남기고
// 그 아래에서 바로: (미로그인) 카카오 로그인 → (로그인) 운동 습관 3가지 → 말랑 다이어리로 이동.
// 운동 습관(빈도·목적·자주 하는 자세)은 딱 한 번만 물어보고 마이페이지에 저장된다.
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

export default function DiaryOnboarding({ isLoggedIn, onRequireLogin, onComplete, userId, setUserProfile }) {
  const [freq, setFreq] = useState(null);
  const [goals, setGoals] = useState([]);
  const [posture, setPosture] = useState(null);
  const [postureCustom, setPostureCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const toggleGoal = (id) => setGoals(g => g.includes(id) ? g.filter(x => x !== id) : (g.length >= 2 ? g : [...g, id]));

  const finish = () => { if (onComplete) onComplete(); };

  const submitExerciseInfo = async () => {
    const finalPosture = posture === "other" ? postureCustom.trim() : posture;
    if (userId) {
      setSaving(true);
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
      setSaving(false);
    }
    finish();
  };

  const canSubmit = freq && posture && goals.length > 0 && !(posture === "other" && !postureCustom.trim());

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", justifyContent: "center",
      fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>
      <div style={{ width: "100%", maxWidth: 420, minHeight: "100vh", display: "flex", flexDirection: "column", padding: "96px 24px 48px", animation: "fadeUp .4s ease-out" }}>

        {/* 마스코트 */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
          <Mallang v={5} size={84} />
        </div>

        {!isLoggedIn ? (
          /* 미로그인 — 카카오 로그인 먼저 */
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>기록을 시작할까요?</h2>
            <p style={{ fontSize: 13, color: C.sub, margin: "0 0 22px", lineHeight: 1.6 }}>
              카카오로 로그인하면 운동 습관을 여쭤보고,<br />오늘부터 매일 기록을 저장해드려요.
            </p>
            <button onClick={() => { if (onRequireLogin) onRequireLogin(); }}
              style={{ width: "100%", padding: 17, borderRadius: 15, border: "none", background: "#FEE500", color: "#3C1E1E", fontSize: 15.5, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "#3C1E1E" }}><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" /></svg>
              카카오로 3초 기록
            </button>
            <p style={{ fontSize: 11, color: C.sub, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <span>🔕</span> 광고 안 보냄 · 결과만 저장
            </p>
          </div>
        ) : (
          /* 로그인 — 운동 습관 3가지 (딱 한 번, 마이페이지에 저장) */
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>운동 습관을 알려주세요</h2>
            <p style={{ fontSize: 12.5, color: C.sub, margin: "0 0 22px" }}>딱 한 번만 물어볼게요. 앞으로의 기록에 참고할게요.</p>

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
                  style={{ width: "100%", marginTop: 4, padding: "10px 13px", borderRadius: 14, border: `1px solid ${C.line}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              )}
            </ExerciseQuestion>

            <button
              onClick={submitExerciseInfo}
              disabled={!canSubmit || saving}
              style={{ width: "100%", marginTop: 8, padding: 16, borderRadius: 15, border: "none", background: GOLD, color: "#fff",
                fontSize: 15, fontWeight: 800, cursor: canSubmit ? "pointer" : "default", opacity: canSubmit ? 1 : 0.4 }}
            >
              {saving ? "저장하는 중..." : "저장하고 말랑 다이어리 시작하기"}
            </button>
            <button onClick={finish} style={{ display: "block", width: "100%", textAlign: "center", marginTop: 14, border: "none", background: "transparent", color: C.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 4 }}>
              다음에 입력할게요
            </button>
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
