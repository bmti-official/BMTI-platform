import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getTypeAccent, GOLD } from "../lib/typeAccent";
import BodySelector3D from "./BodySelector3D";
import {
  FREQ_OPTS, GOAL_OPTS, POSTURE_OPTS,
  setGuestMallang, pushGuestMallangHistory, readMallangProfile,
} from "../lib/mallangProfile";

// 온보딩 3페이지를 대체하는 모달 — 불편 부위(sore) / 운동 습관·자세(habits)를 나눠 입력.
// 월 1회 재확인(바뀌었어요/비슷해요)과 게스트·로그인 저장을 모두 처리한다.
const C = { ink: "#2A2622", sub: "#8A8378", line: "#EDE9E2" };
const monthKey = () => new Date().toISOString().slice(0, 7);
export const soreConfirmedThisMonth = () => { try { return localStorage.getItem("mallang_sore_confirm_month") === monthKey(); } catch { return false; } };
export const habitConfirmedThisMonth = () => { try { return localStorage.getItem("mallang_habit_confirm_month") === monthKey(); } catch { return false; } };
const markMonth = (mode) => { try { localStorage.setItem(mode === "sore" ? "mallang_sore_confirm_month" : "mallang_habit_confirm_month", monthKey()); } catch {} };

export default function MallangInfoPopup({ mode, userInfo, isLoggedIn, gender, setUserProfile, askReconfirm = false, onClose, onSaved }) {
  const t = getTypeAccent();
  const existing = readMallangProfile(userInfo);
  const [phase, setPhase] = useState(askReconfirm ? "ask" : "edit"); // ask | edit
  const [saving, setSaving] = useState(false);
  const [sore, setSore] = useState(existing.sore || []);
  const [freq, setFreq] = useState(existing.exercise_frequency || null);
  const [goals, setGoals] = useState(existing.exercise_goals || []);
  const known = POSTURE_OPTS.some((o) => o.id === existing.common_posture);
  const [posture, setPosture] = useState(existing.common_posture ? (known ? existing.common_posture : "other") : null);
  const [postureCustom, setPostureCustom] = useState(existing.common_posture && !known ? existing.common_posture : "");
  const toggleGoal = (id) => setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : (g.length >= 2 ? g : [...g, id])));

  const save = async () => {
    setSaving(true);
    const finalPosture = posture === "other" ? postureCustom.trim() : posture;
    const soreClean = (mode === "sore" ? sore : (existing.sore || [])).map((s) => ({
      part: s.part, when: Array.isArray(s.when) ? s.when : (s.when ? [s.when] : []),
      whenOther: (Array.isArray(s.when) ? s.when : []).includes("기타") ? (s.whenOther || "").trim() : "",
    }));
    // 이 모드가 다루는 필드만 갱신(나머지는 기존 값 유지).
    const payload = {
      mallang_sore: soreClean,
      exercise_frequency: mode === "habits" ? freq : existing.exercise_frequency,
      exercise_goals: mode === "habits" ? goals : (existing.exercise_goals || []),
      common_posture: mode === "habits" ? (finalPosture || null) : (existing.common_posture || null),
    };
    try {
      if (isLoggedIn && userInfo?.id) {
        await supabase.from("users").update({ ...payload, mallang_info_updated_at: new Date().toISOString() }).eq("id", userInfo.id);
        await supabase.from("mallang_info_history").insert({ user_id: userInfo.id, sore: payload.mallang_sore, exercise_frequency: payload.exercise_frequency, exercise_goals: payload.exercise_goals, common_posture: payload.common_posture, source: "edit" });
        if (setUserProfile) setUserProfile((prev) => { const u = { ...prev, ...payload }; try { localStorage.setItem("bmti_user", JSON.stringify(u)); } catch {} return u; });
      } else {
        setGuestMallang({ ...payload, sore: soreClean });
        pushGuestMallangHistory({ ...payload, sore: soreClean, source: "edit" });
      }
    } catch (e) { console.error("말랑 정보 저장 실패", e); }
    markMonth(mode);
    setSaving(false);
    onSaved && onSaved();
    onClose && onClose();
  };

  const keepSame = () => { markMonth(mode); onSaved && onSaved(); onClose && onClose(); };

  const lead = askReconfirm
    ? (mode === "sore" ? "최근에는 어디가, 어느 상황에서 많이 불편했나요?" : "최근에는 운동 습관·자세가 어땠나요?")
    : (mode === "sore" ? "요즘 계속 불편했던 곳을 기억해둘게요." : "운동 습관·자세를 알려주면 발견이 더 풍부해져요.");

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 95, background: "rgba(28,26,23,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: "'Pretendard',sans-serif" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "92vh", background: "#fff", borderRadius: "24px 24px 0 0", display: "flex", flexDirection: "column", color: C.ink }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px", borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900 }}>{mode === "sore" ? "불편한 부위" : "운동 습관·자세"}</div>
          <button onClick={onClose} aria-label="닫기" style={{ border: "none", background: "transparent", fontSize: 20, color: C.sub, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "16px 18px 24px" }}>
          {phase === "ask" ? (
            <div style={{ textAlign: "center", padding: "14px 6px 6px" }}>
              <div style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.55, wordBreak: "keep-all", color: C.ink }}>
                {mode === "sore" ? "최근 불편했던 곳을 기억하고 있어요." : "저장해둔 운동 습관·자세가 있어요."}<br />그때와 비슷한가요?
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button onClick={() => setPhase("edit")} style={{ flex: 1, padding: 14, borderRadius: 14, border: "none", background: t.accentDeep, color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer" }}>바뀌었어요</button>
                <button onClick={keepSame} style={{ flex: 1, padding: 14, borderRadius: 14, border: `1.5px solid ${C.line}`, background: "#fff", color: C.ink, fontSize: 14.5, fontWeight: 800, cursor: "pointer" }}>비슷해요</button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: t.accentDeep, fontWeight: 800, margin: "0 0 14px", lineHeight: 1.5, wordBreak: "keep-all" }}>{lead}</p>
              {mode === "sore" ? (
                <BodySelector3D gender={gender} value={sore} onChange={setSore} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <Q label="평소 운동, 어떻게 하세요?"><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{FREQ_OPTS.map((o) => <Pill key={o.id} label={o.label} on={freq === o.id} onClick={() => setFreq(o.id)} t={t} />)}</div></Q>
                  <Q label="몸 관리에서 제일 신경 쓰는 건? (최대 2)"><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{GOAL_OPTS.map((o) => <Pill key={o.id} label={o.label} on={goals.includes(o.id)} onClick={() => toggleGoal(o.id)} disabled={!goals.includes(o.id) && goals.length >= 2} t={t} />)}</div></Q>
                  <Q label="요즘 하루 대부분 어떻게 지내요?">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{POSTURE_OPTS.map((o) => <Pill key={o.id} label={o.label} sub={o.sub} on={posture === o.id} onClick={() => setPosture(o.id)} t={t} />)}</div>
                    {posture === "other" && <input value={postureCustom} onChange={(e) => setPostureCustom(e.target.value)} placeholder="예: 운전을 오래 해요" style={{ width: "100%", marginTop: 10, padding: "11px 13px", borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />}
                  </Q>
                </div>
              )}
              <button onClick={save} disabled={saving} style={{ width: "100%", marginTop: 20, padding: 15, borderRadius: 15, border: "none", background: GOLD, color: "#fff", fontSize: 15, fontWeight: 800, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "저장 중…" : "저장하기"}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Q({ label, children }) { return (<div><div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 9, color: C.ink }}>{label}</div>{children}</div>); }
function Pill({ label, sub, on, onClick, disabled, t }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ border: on ? "none" : `1.5px solid ${C.line}`, background: on ? t.accentSoft : "#fff", color: on ? t.accentDeep : (disabled ? "#C9C4BB" : C.ink), cursor: disabled ? "default" : "pointer", borderRadius: 12, padding: "10px 13px", fontSize: 13, fontWeight: 800, textAlign: "left", fontFamily: "inherit" }}>
      {label}{sub && <span style={{ display: "block", fontSize: 10.5, color: on ? t.accentDeep : C.sub, fontWeight: 600, marginTop: 2 }}>{sub}</span>}
    </button>
  );
}
