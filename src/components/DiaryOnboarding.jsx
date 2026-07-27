import { useState } from "react";
import BodySelector3D from "./BodySelector3D";
import { supabase } from "../lib/supabaseClient";
import { getTypeAccent, GOLD } from "../lib/typeAccent";
import {
  FREQ_OPTS, GOAL_OPTS, POSTURE_OPTS,
  setGuestMallang, pushGuestMallangHistory,
} from "../lib/mallangProfile";

// ─────────────────────────────────────────────
// BMTI 하루일기 — 첫 방문자용 온보딩 (3페이지)
// 1) 3D 캐릭터에서 불편한 부위 2초 꾹 눌러 선택 + 언제 그러셨어요
// 2) 평소 운동 빈도 + 몸 관리 목적(최대 2)
// 3) 요즘 하루 자세(무거운 물건 포함) → 완료 → 말랑 다이어리(캘린더)
// 딱 한 번만 물어보고 마이페이지 '말랑 정보'에 저장된다(한 달 2회 수정 가능).
// ─────────────────────────────────────────────

const C = { bg: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2", tileOff: "#F3F1EC" };

const ENCOURAGE = [
  "어디가 자주 불편한지 알면, 매일 기록이 훨씬 빨라져요.",
  "운동 습관을 알면 딱 맞는 말랑 루틴을 추천해드려요.",
  "거의 다 왔어요! 하루를 어떻게 보내는지만 알려주세요.",
];

export default function DiaryOnboarding({ isLoggedIn, onComplete, userId, gender, setUserProfile }) {
  const t = getTypeAccent();
  const [step, setStep] = useState(0); // 0,1,2
  const [saving, setSaving] = useState(false);

  const [sore, setSore] = useState([]); // [{part, when, whenOther}]
  const [freq, setFreq] = useState(null);
  const [goals, setGoals] = useState([]);
  const [posture, setPosture] = useState(null);
  const [postureCustom, setPostureCustom] = useState("");

  const toggleGoal = (id) => setGoals(g => g.includes(id) ? g.filter(x => x !== id) : (g.length >= 2 ? g : [...g, id]));

  const canNext = [
    sore.length > 0 && sore.every(s => s.when && !(s.when === "기타" && !(s.whenOther || "").trim())),
    freq && goals.length > 0,
    posture && !(posture === "other" && !postureCustom.trim()),
  ];

  const finish = async () => {
    const finalPosture = posture === "other" ? postureCustom.trim() : posture;
    const soreClean = sore.map(s => ({ part: s.part, when: s.when, whenOther: s.when === "기타" ? (s.whenOther || "").trim() : "" }));
    const payload = { mallang_sore: soreClean, exercise_frequency: freq, exercise_goals: goals, common_posture: finalPosture };

    if (isLoggedIn && userId) {
      setSaving(true);
      try {
        await supabase.from("users").update({ ...payload, mallang_info_updated_at: new Date().toISOString() }).eq("id", userId);
        await supabase.from("mallang_info_history").insert({ user_id: userId, sore: soreClean, exercise_frequency: freq, exercise_goals: goals, common_posture: finalPosture, source: "onboarding" });
        if (setUserProfile) {
          setUserProfile(prev => {
            const updated = { ...prev, ...payload };
            localStorage.setItem("bmti_user", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (e) { console.error("말랑 정보 저장 실패", e); }
      setSaving(false);
    } else {
      // 게스트 — 이 기기에만 저장
      setGuestMallang(payload);
      pushGuestMallangHistory({ ...payload, sore: soreClean, source: "onboarding" });
    }
    if (onComplete) onComplete();
  };

  const next = () => { if (step < 2) setStep(step + 1); else finish(); };
  const back = () => setStep(s => Math.max(0, s - 1));

  const remaining = (() => {
    // 이 페이지에서 아직 안 채운 필수 항목 수
    if (step === 0) return sore.length === 0 ? 1 : sore.filter(s => !s.when).length;
    if (step === 1) return (freq ? 0 : 1) + (goals.length > 0 ? 0 : 1);
    return posture ? 0 : 1;
  })();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", justifyContent: "center", fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>
      <div style={{ width: "100%", maxWidth: 420, minHeight: "100vh", display: "flex", flexDirection: "column", padding: "76px 24px 96px", position: "relative" }}>

        {/* 상단바: 이전 버튼 + 진행률 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 40, marginBottom: 6 }}>
          {step > 0 ? (
            <button onClick={back} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 15, color: C.ink, fontWeight: 800, padding: "6px 8px 6px 0", display: "flex", alignItems: "center", gap: 4 }}>
              ‹ 이전
            </button>
          ) : <span />}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 5, background: i <= step ? GOLD : C.line, transition: "all .2s" }} />
            ))}
            <span style={{ fontSize: 12, fontWeight: 800, color: C.sub, marginLeft: 4 }}>{step + 1}/3</span>
          </div>
        </div>

        {/* 독려 문구 */}
        <p style={{ fontSize: 13, color: C.sub, fontWeight: 700, margin: "2px 0 4px", lineHeight: 1.5 }}>
          {ENCOURAGE[step]}
          {remaining > 0 && <b style={{ color: t.accent }}> · {remaining}개 남았어요</b>}
        </p>

        <div key={step} style={{ flex: 1, animation: "fadeUp .3s ease-out" }}>
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 800, margin: "8px 0 14px" }}>요즘 어디가 불편하세요?</h2>
              <BodySelector3D gender={gender} value={sore} onChange={setSore} />
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 800, margin: "8px 0 20px" }}>운동 습관을 알려주세요</h2>
              <Question label="평소 운동, 어떻게 하세요?">
                {FREQ_OPTS.map(o => <Pill key={o.id} label={o.label} on={freq === o.id} onClick={() => setFreq(o.id)} />)}
              </Question>
              <Question label="몸 관리에서 제일 신경 쓰는 건? (최대 2개)">
                {GOAL_OPTS.map(o => <Pill key={o.id} label={o.label} on={goals.includes(o.id)} onClick={() => toggleGoal(o.id)} disabled={!goals.includes(o.id) && goals.length >= 2} />)}
              </Question>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 800, margin: "8px 0 20px" }}>요즘 하루 대부분 어떻게 지내요?</h2>
              <Question label="가장 가까운 걸 골라주세요">
                {POSTURE_OPTS.map(o => <Pill key={o.id} label={o.label} sub={o.sub} on={posture === o.id} onClick={() => setPosture(o.id)} />)}
              </Question>
              {posture === "other" && (
                <input type="text" value={postureCustom} onChange={e => setPostureCustom(e.target.value.slice(0, 20))}
                  placeholder="짧게 적어주세요 (예: 운전을 오래 해요)"
                  style={{ width: "100%", marginTop: -8, padding: "11px 14px", borderRadius: 14, border: `1px solid ${C.line}`, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              )}
            </div>
          )}
        </div>

        {/* 하단 CTA + 안내 문구 */}
        <div style={{ marginTop: 18 }}>
          <button onClick={next} disabled={!canNext[step] || saving}
            style={{ width: "100%", padding: 16, borderRadius: 15, border: "none", background: GOLD, color: "#fff", fontSize: 15, fontWeight: 800,
              cursor: canNext[step] ? "pointer" : "default", opacity: canNext[step] ? 1 : 0.4 }}>
            {saving ? "저장하는 중..." : step < 2 ? "다음" : "완료하고 말랑 다이어리 시작하기"}
          </button>
          <p style={{ textAlign: "center", fontSize: 11.5, color: C.sub, fontWeight: 600, margin: "12px 0 0" }}>
            마이페이지에서 한달에 2번 수정가능합니다.
          </p>
        </div>

        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    </div>
  );
}

function Question({ label, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

function Pill({ label, sub, on, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick}
      style={{ padding: sub ? "8px 15px" : "9px 15px", borderRadius: 18, fontSize: 13, fontWeight: 700, cursor: disabled ? "default" : "pointer",
        border: "none", background: on ? getTypeAccent().accent : C.tileOff, color: on ? "#fff" : C.sub, opacity: disabled ? 0.35 : 1, transition: "all .15s",
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
      <span>{label}</span>
      {sub && <span style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.75 }}>{sub}</span>}
    </button>
  );
}
