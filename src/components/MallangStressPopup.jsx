import { useState } from "react";
import { Mallang } from "./Mallang";

// 말랑이를 고르거나 하루 기록을 마쳤을 때 뜨는 팝업 — 캐릭터가 채팅하듯
// "말랑이를 눌러서 스트레스를 풀어보세요"라고 말을 걸고, 가운데 큼직하게 뜬
// 말랑이를 누르면 눌렸다 펴지는 임시 인터랙션이 재생된다.
// (실제 3D 말랑이가 나오기 전까지의 간단한 임시 버전.)
export default function MallangStressPopup({ mood, charImage, onNext, nextLabel = "다음" }) {
  const [tapKey, setTapKey] = useState(0);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(28,26,23,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380, background: "#fff", borderRadius: 28, padding: "26px 24px 24px", textAlign: "center", animation: "mallangPopIn .32s cubic-bezier(.22,.9,.32,1)" }}>
        {/* 캐릭터가 말풍선으로 안내 */}
        <div style={{ display: "flex", gap: 9, alignItems: "flex-end", justifyContent: "center", marginBottom: 24, textAlign: "left" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FFEDF3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, overflow: "hidden" }}>
            {charImage ? <img src={charImage} alt="me" style={{ width: "85%", height: "85%", objectFit: "contain" }} /> : "🤖"}
          </div>
          <div style={{ maxWidth: 210, background: "#fff", border: "1px solid #EDE9E2", borderRadius: "16px 16px 16px 4px", padding: "12px 15px", fontSize: 13.5, lineHeight: 1.55, fontWeight: 700, color: "#1C1A17" }}>
            말랑이를 눌러서<br />스트레스를 풀어보세요
          </div>
        </div>

        <button
          onClick={() => {
            setTapKey(k => k + 1);
            // 지원하는 기기(주로 안드로이드)에서만 아주 짧게 울리고, 미지원 기기(iOS 등)에서는
            // 조용히 무시된다 — 누르는 손맛을 살짝 더해주는 용도.
            if (navigator.vibrate) navigator.vibrate(15);
          }}
          aria-label="말랑이 누르기"
          style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "block", margin: "0 auto" }}
        >
          <Mallang v={mood} size={132} tapKey={tapKey} />
        </button>

        <button
          onClick={onNext}
          style={{ marginTop: 26, width: "100%", padding: 15, borderRadius: 15, border: "none", background: "#1C1A17", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}
        >
          {nextLabel}
        </button>
      </div>
      <style>{`@keyframes mallangPopIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
