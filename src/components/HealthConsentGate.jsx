import { useState } from "react";
import { createPortal } from "react-dom";
import { updateHealthRecordConsent, setLocalHealthConsent } from "../lib/healthConsentSystem";

// 첫 다이어리 기록 전, 민감정보(기분·통증·수면=건강정보, PIPA §23) 별도 동의를 강제하는 게이트.
// (필수) 개인 리포트 제공 목적 수집·이용 / (선택) 가명처리 후 통계·연구·서비스 개선(B2B 포함).
const C = { ink: "#2A2622", sub: "#8A8378", line: "#EDE9E2", gold: "#C9975A" };

export default function HealthConsentGate({ userId, isLoggedIn, onAgree }) {
  const [required, setRequired] = useState(false);
  const [optional, setOptional] = useState(false);
  const [saving, setSaving] = useState(false);

  const agree = async () => {
    if (!required || saving) return;
    setSaving(true);
    if (isLoggedIn && userId) { try { await updateHealthRecordConsent(userId, true, optional); } catch (e) { console.error("건강정보 동의 저장 실패", e); } }
    setLocalHealthConsent(optional);
    setSaving(false);
    onAgree && onAgree();
  };

  const Row = ({ checked, onToggle, tag, children }) => (
    <button onClick={onToggle} style={{ width: "100%", display: "flex", gap: 11, alignItems: "flex-start", textAlign: "left", background: "#FBFAF6", border: `1px solid ${checked ? C.gold : C.line}`, borderRadius: 14, padding: "13px 14px", cursor: "pointer" }}>
      <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 7, border: `2px solid ${checked ? C.gold : "#D8D3C8"}`, background: checked ? C.gold : "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 900, marginTop: 1 }}>{checked ? "✓" : ""}</span>
      <span style={{ flex: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: tag === "필수" ? "#C0392B" : C.sub }}>[{tag}]</span>
        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.ink, lineHeight: 1.55, marginTop: 3, wordBreak: "keep-all" }}>{children}</span>
      </span>
    </button>
  );

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(28,26,23,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: "'Pretendard',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 460, maxHeight: "92vh", background: "#fff", borderRadius: "24px 24px 0 0", display: "flex", flexDirection: "column", color: C.ink }}>
        <div style={{ padding: "22px 20px 12px" }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>건강 기록, 시작하기 전에</div>
          <p style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, margin: "6px 0 0", lineHeight: 1.6, wordBreak: "keep-all" }}>
            기분·불편함·수면은 <b>민감정보(건강정보)</b>예요. 아래 동의가 있어야 안전하게 기록·분석해 드릴 수 있어요.
          </p>
        </div>
        <div style={{ overflowY: "auto", padding: "6px 20px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
          <Row checked={required} onToggle={() => setRequired(v => !v)} tag="필수">
            기분·통증·수면 등 건강정보를 <b>내 개인 리포트 제공</b> 목적으로 수집·이용하는 것에 동의합니다.
          </Row>
          <Row checked={optional} onToggle={() => setOptional(v => !v)} tag="선택">
            <b>가명처리</b> 후 통계·연구·서비스 개선(B2B 포함)에 활용하는 것에 동의합니다.
            <span style={{ display: "block", marginTop: 5, fontSize: 12, fontWeight: 800, color: C.gold }}>✨ 선택 동의를 해야 <u>기록·발견의 분석</u>을 모두 확인할 수 있어요.</span>
          </Row>
          <p style={{ fontSize: 11, color: C.sub, fontWeight: 600, lineHeight: 1.6, margin: "2px 2px 0", wordBreak: "keep-all" }}>
            동의는 마이페이지에서 언제든 철회할 수 있고, 철회 시 관련 기록은 파기돼요. 저장·처리는 위탁·국외이전 고지에 따릅니다.
          </p>
        </div>
        <div style={{ padding: "8px 20px 22px", flexShrink: 0 }}>
          <button onClick={agree} disabled={!required || saving}
            style={{ width: "100%", padding: 16, borderRadius: 15, border: "none", background: required ? C.gold : "#E7E2D8", color: required ? "#fff" : "#B7B2A9", fontSize: 15, fontWeight: 800, cursor: required && !saving ? "pointer" : "default" }}>
            {saving ? "저장 중…" : "동의하고 기록 시작하기"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
