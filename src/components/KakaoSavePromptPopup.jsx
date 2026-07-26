import { GOLD } from "../lib/typeAccent";

// 로그인 없이 기록을 마친 뒤 뜨는 팝업 — 이 기기에만 저장된 기록을
// 카카오 로그인으로 안전하게 이어 보관하도록 부드럽게 유도한다.
export default function KakaoSavePromptPopup({ onLogin, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(28,26,23,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 340, background: "#fff", borderRadius: 26, padding: "26px 22px 20px", textAlign: "center", animation: "kspPop .3s cubic-bezier(.22,.9,.32,1)" }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>💾</div>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1C1A17", margin: "0 0 8px", lineHeight: 1.4 }}>지금 기록, 이 기기에만 있어요</h3>
        <p style={{ fontSize: 13, color: "#8A8378", fontWeight: 600, margin: "0 0 20px", lineHeight: 1.6, wordBreak: "keep-all" }}>
          카카오로 3초만에 로그인하면 기록이 사라지지 않고,<br />다른 기기에서도 이어서 볼 수 있어요.
        </p>
        <button onClick={onLogin} style={{ width: "100%", padding: 16, borderRadius: 15, border: "none", background: "#FEE500", color: "#3C1E1E", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
          <svg viewBox="0 0 24 24" style={{ width: 19, height: 19, fill: "#3C1E1E" }}><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" /></svg>
          카카오로 3초 기록
        </button>
        <p style={{ fontSize: 11, color: "#9B9489", fontWeight: 600, margin: "10px 0 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <span>🔕</span> 광고 안 보냄 · 결과만 저장
        </p>
        <button onClick={onClose} style={{ width: "100%", marginTop: 14, padding: 8, border: "none", background: "transparent", color: "#9B9489", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
          다음에 할게요
        </button>
      </div>
      <style>{`@keyframes kspPop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
