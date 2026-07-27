import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { GOLD } from "../lib/typeAccent";

// '말랑 다이어리' / '말랑이의 발견' 개선 의견을 받는 모달.
// source: 'diary' | 'discovery' — 어느 기능에 대한 의견인지 함께 저장한다.
const SOURCE_LABEL = { diary: "말랑 다이어리", discovery: "말랑이의 발견" };

export default function FeedbackModal({ source = "diary", userId = null, onClose }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    try {
      await supabase.from("feedback").insert({ user_id: userId || null, source, message: msg });
    } catch (e) {
      console.error("피드백 저장 실패", e);
    }
    setSending(false);
    setDone(true);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(28,26,23,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, background: "#fff", borderRadius: 24, padding: "24px 22px 20px", animation: "fbPop .28s cubic-bezier(.22,.9,.32,1)" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>💛</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1C1A17", margin: "0 0 8px" }}>의견 고마워요!</h3>
            <p style={{ fontSize: 13, color: "#8A8378", fontWeight: 600, margin: "0 0 20px", lineHeight: 1.6 }}>
              보내주신 의견은 {SOURCE_LABEL[source]}을(를)<br />더 좋게 만드는 데 소중히 쓸게요.
            </p>
            <button onClick={onClose} style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: GOLD, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>닫기</button>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1C1A17", margin: "0 0 4px" }}>{SOURCE_LABEL[source]} 개선 의견</h3>
            <p style={{ fontSize: 12.5, color: "#9B9489", fontWeight: 600, margin: "0 0 14px", lineHeight: 1.55 }}>
              불편했던 점, 추가되면 좋을 기능 등 무엇이든 편하게 남겨주세요.
            </p>
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 500))} rows={5}
              placeholder="예: 기록할 때 사진도 같이 넣고 싶어요"
              style={{ width: "100%", borderRadius: 14, border: "1px solid #EDE9E2", background: "#F9F9F9", padding: 13, fontSize: 14, resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.55 }} />
            <div style={{ textAlign: "right", fontSize: 11, color: "#B7B2A9", fontWeight: 600, margin: "4px 2px 12px" }}>{text.length}/500</div>
            <button onClick={submit} disabled={!text.trim() || sending}
              style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: GOLD, color: "#fff", fontSize: 15, fontWeight: 800, cursor: text.trim() && !sending ? "pointer" : "default", opacity: text.trim() && !sending ? 1 : 0.4 }}>
              {sending ? "보내는 중..." : "의견 보내기"}
            </button>
            <button onClick={onClose} style={{ width: "100%", marginTop: 10, padding: 6, border: "none", background: "transparent", color: "#9B9489", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>다음에 할게요</button>
          </>
        )}
      </div>
      <style>{`@keyframes fbPop{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
