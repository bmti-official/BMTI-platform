import { useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient";
import { getTypeAccent, GOLD } from "../lib/typeAccent";
import BodySelector3D from "./BodySelector3D";
import {
  FREQ_OPTS, GOAL_OPTS, POSTURE_OPTS, SINCE_OPTS,
  setGuestMallang, pushGuestMallangHistory, readMallangProfile, markHealthSheetChecked,
} from "../lib/mallangProfile";
import { soreFromDiary } from "../lib/healthSheet";

// 건강 정보를 받는 창.
//   mode "all"    건강 정보 한 장 — 불편한 부위·얼마나 됐는지·자세·운동 빈도·목적을 한 번에(마이페이지, 둘러보기, 강사 연결)
//   mode "sore"   불편한 부위만(다이어리에서 월 1회 재확인)
//   mode "habits" 운동 습관·자세만(이번달 기록에서)
// 세 모드가 같은 자리에 저장한다. 게스트는 이 기기에, 회원은 서버에.
const C = { ink: "#2A2622", sub: "#8A8378", line: "#EDE9E2" };
const monthKey = () => new Date().toISOString().slice(0, 7);
export const soreConfirmedThisMonth = () => { try { return localStorage.getItem("mallang_sore_confirm_month") === monthKey(); } catch { return false; } };
export const habitConfirmedThisMonth = () => { try { return localStorage.getItem("mallang_habit_confirm_month") === monthKey(); } catch { return false; } };
const markMonth = (mode) => {
  try {
    if (mode !== "habits") localStorage.setItem("mallang_sore_confirm_month", monthKey());
    if (mode !== "sore") localStorage.setItem("mallang_habit_confirm_month", monthKey());
  } catch { /* 무시 */ }
  if (mode === "all") markHealthSheetChecked();
};
const TITLE = { all: "건강 정보 한 장", sore: "불편한 부위", habits: "운동 습관·자세" };

export default function MallangInfoPopup({ mode, userInfo, isLoggedIn, gender, setUserProfile, askReconfirm = false, onClose, onSaved,
  // 강사에게 미리 알릴 말 — 강사와 연결하는 기능이 나올 때 켠다. 쓸 곳이 없는 동안에는 받지 않는다.
  withCoachNote = false }) {
  const t = getTypeAccent();
  const existing = readMallangProfile(userInfo);
  const all = mode === "all", withSore = mode !== "habits", withHabits = mode !== "sore";
  // 한 장을 처음 여는데 적어 둔 부위가 없으면, 최근 다이어리에서 가져와 채워 둔다
  const [fromDiary] = useState(() => (all && !(existing.sore || []).length ? soreFromDiary() : []));
  const [phase, setPhase] = useState(askReconfirm ? "ask" : "edit"); // ask | edit
  const [saving, setSaving] = useState(false);
  const [sore, setSore] = useState(() => ((existing.sore || []).length ? existing.sore : fromDiary));
  const [since, setSince] = useState(existing.sore_since || null);
  const [note, setNote] = useState(existing.coach_note || "");
  const [freq, setFreq] = useState(existing.exercise_frequency || null);
  const [goals, setGoals] = useState(existing.exercise_goals || []);
  const known = POSTURE_OPTS.some((o) => o.id === existing.common_posture);
  const [posture, setPosture] = useState(existing.common_posture ? (known ? existing.common_posture : "other") : null);
  const [postureCustom, setPostureCustom] = useState(existing.common_posture && !known ? existing.common_posture : "");
  const toggleGoal = (id) => setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : (g.length >= 2 ? g : [...g, id])));

  const save = async () => {
    setSaving(true);
    const finalPosture = posture === "other" ? postureCustom.trim() : posture;
    const soreClean = (withSore ? sore : (existing.sore || [])).map((s) => ({
      part: s.part, when: Array.isArray(s.when) ? s.when : (s.when ? [s.when] : []),
      whenOther: (Array.isArray(s.when) ? s.when : []).includes("기타") ? (s.whenOther || "").trim() : "",
      // '기타' 부위는 직접 적은 이름을 함께 남긴다 — 기록·발견에서 '기타(엉덩이)'로 보여준다.
      ...(s.part === "기타" && String(s.partOther || "").trim() ? { partOther: String(s.partOther).trim() } : {}),
    }));
    // 이 모드가 다루는 필드만 갱신(나머지는 기존 값 유지).
    const payload = {
      mallang_sore: soreClean,
      exercise_frequency: withHabits ? freq : existing.exercise_frequency,
      exercise_goals: withHabits ? goals : (existing.exercise_goals || []),
      common_posture: withHabits ? (finalPosture || null) : (existing.common_posture || null),
    };
    // 한 장에서만 받는 것 — 불편한 곳이 없으면 기간도 비운다
    const extra = all ? { sore_since: soreClean.length ? since : null, ...(withCoachNote ? { coach_note: note.trim().slice(0, 200) } : {}) } : {};
    try {
      if (isLoggedIn && userInfo?.id) {
        const stamp = { mallang_info_updated_at: new Date().toISOString() };
        let { error } = await supabase.from("users").update({ ...payload, ...extra, ...stamp }).eq("id", userInfo.id);
        // 65번 SQL(sore_since·coach_note 칸) 전이면 그 칸만 빼고 저장한다
        if (error && /sore_since|coach_note/.test(error.message || "")) {
          ({ error } = await supabase.from("users").update({ ...payload, ...stamp }).eq("id", userInfo.id));
        }
        if (error) throw error;
        const hist = { user_id: userInfo.id, sore: payload.mallang_sore, exercise_frequency: payload.exercise_frequency, exercise_goals: payload.exercise_goals, common_posture: payload.common_posture, source: "edit" };
        const h = await supabase.from("mallang_info_history").insert({ ...hist, ...extra });
        if (h.error && /sore_since|coach_note/.test(h.error.message || "")) await supabase.from("mallang_info_history").insert(hist);
        if (setUserProfile) setUserProfile((prev) => { const u = { ...prev, ...payload, ...extra, ...stamp }; try { localStorage.setItem("bmti_user", JSON.stringify(u)); } catch { /* 무시 */ } return u; });
      } else {
        setGuestMallang({ ...payload, ...extra, sore: soreClean });
        pushGuestMallangHistory({ ...payload, ...extra, sore: soreClean, source: "edit" });
      }
    } catch (e) {
      console.error("건강 정보 저장 실패", e);
      setSaving(false);
      window.alert("저장하지 못했어요. 잠시 후 다시 해 주세요.");
      return;
    }
    markMonth(mode);
    setSaving(false);
    onSaved && onSaved();
    onClose && onClose();
  };

  const keepSame = () => { markMonth(mode); onSaved && onSaved(); onClose && onClose(); };

  const lead = all ? "한 번만 적어 두면 돼요. 1~2분이면 끝나요."
    : askReconfirm
      ? (mode === "sore" ? "최근에는 어디가, 어느 상황에서 많이 불편했나요?" : "최근에는 운동 습관·자세가 어땠나요?")
      : (mode === "sore" ? "요즘 계속 불편했던 곳을 기억해둘게요." : "운동 습관·자세를 알려주면 발견이 더 풍부해져요.");

  const habits = (
    <>
      <Q label="요즘 하루 대부분 어떻게 지내요?">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{POSTURE_OPTS.map((o) => <Pill key={o.id} label={o.label} sub={o.sub} on={posture === o.id} onClick={() => setPosture(o.id)} t={t} />)}</div>
        {posture === "other" && <input value={postureCustom} onChange={(e) => setPostureCustom(e.target.value.slice(0, 20))} placeholder="예: 운전을 오래 해요" style={{ width: "100%", marginTop: 10, padding: "11px 13px", borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />}
      </Q>
      <Q label="평소 운동, 어떻게 하세요?"><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{FREQ_OPTS.map((o) => <Pill key={o.id} label={o.label} on={freq === o.id} onClick={() => setFreq(o.id)} t={t} />)}</div></Q>
      <Q label="몸 관리에서 제일 신경 쓰는 건? (최대 2)"><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{GOAL_OPTS.map((o) => <Pill key={o.id} label={o.label} on={goals.includes(o.id)} onClick={() => toggleGoal(o.id)} disabled={!goals.includes(o.id) && goals.length >= 2} t={t} />)}</div></Q>
    </>
  );

  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(28,26,23,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: "'Pretendard',sans-serif" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "92vh", background: "#fff", borderRadius: "24px 24px 0 0", display: "flex", flexDirection: "column", color: C.ink }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px", borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900 }}>{TITLE[mode] || TITLE.all}</div>
          <button onClick={onClose} aria-label="닫기" style={{ border: "none", background: "transparent", fontSize: 20, color: C.sub, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "16px 18px 24px" }}>
          {phase === "ask" ? (
            <div style={{ textAlign: "center", padding: "14px 6px 6px" }}>
              <div style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.55, wordBreak: "keep-all", color: C.ink }}>
                {all ? "적어 둔 건강 정보가 있어요." : mode === "sore" ? "최근 불편했던 곳을 기억하고 있어요." : "저장해둔 운동 습관·자세가 있어요."}<br />그때와 비슷한가요?
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button onClick={() => setPhase("edit")} style={{ flex: 1, padding: 14, borderRadius: 14, border: "none", background: t.accentDeep, color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer" }}>바뀌었어요</button>
                <button onClick={keepSame} style={{ flex: 1, padding: 14, borderRadius: 14, border: `1.5px solid ${C.line}`, background: "#fff", color: C.ink, fontSize: 14.5, fontWeight: 800, cursor: "pointer" }}>비슷해요</button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: t.accentDeep, fontWeight: 800, margin: "0 0 14px", lineHeight: 1.5, wordBreak: "keep-all" }}>{lead}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {withSore && (
                  <div>
                    {all && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 9 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>어디가, 언제 불편한가요? (최대 3곳)</span>
                        <button type="button" onClick={() => { setSore([]); setSince(null); }}
                          style={{ flexShrink: 0, border: sore.length === 0 ? "none" : `1.5px solid ${C.line}`, background: sore.length === 0 ? t.accentSoft : "#fff", color: sore.length === 0 ? t.accentDeep : C.sub, borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                          불편한 곳 없음
                        </button>
                      </div>
                    )}
                    {all && fromDiary.length > 0 && sore === fromDiary && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, background: "#FBF7EC", borderRadius: 10, padding: "8px 11px", marginBottom: 10, lineHeight: 1.55, wordBreak: "keep-all" }}>
                        최근 다이어리에서 가져왔어요. 맞는지 봐 주세요.
                      </div>
                    )}
                    <BodySelector3D gender={gender} value={sore} onChange={setSore} />
                  </div>
                )}
                {all && sore.length > 0 && (
                  <Q label="얼마나 됐나요?"><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{SINCE_OPTS.map((o) => <Pill key={o.id} label={o.label} on={since === o.id} onClick={() => setSince(o.id)} t={t} />)}</div></Q>
                )}
                {withHabits && habits}
                {all && withCoachNote && (
                  <Q label="강사에게 미리 알릴 말 (선택)">
                    <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} rows={3} placeholder="예: 오른쪽 무릎을 다친 적이 있어요."
                      style={{ width: "100%", padding: "11px 13px", borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 }} />
                  </Q>
                )}
              </div>
              <button onClick={save} disabled={saving} style={{ width: "100%", marginTop: 20, padding: 15, borderRadius: 15, border: "none", background: GOLD, color: "#fff", fontSize: 15, fontWeight: 800, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "저장 중…" : "저장하기"}</button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
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
