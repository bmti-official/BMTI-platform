import { useRef, useState } from "react";
import { Mallang } from "./Mallang";

// 말랑이를 고르거나 하루 기록을 마쳤을 때 뜨는 팝업 — 캐릭터가 채팅하듯
// "말랑이를 눌러서 스트레스를 풀어보세요"라고 말을 걸고, 가운데 큼직하게 뜬
// 말랑이를 누르면 눌렸다 펴지는 인터랙션이 재생된다.
//
// 연타 메커니즘: 짧은 간격(RAPID_MS 이내)으로 계속 누르면 힘들었어요→...→좋았어요로
// 한 단계씩 표정이 올라간다. 좋았어요(5)에 다다른 뒤에도 계속 연타하면, 지금 고른
// 말랑이 스킨(기본/감자/얼음/호빵)의 아기 버전이 양옆에 나타나 다같이 웃는다.
// 천천히 누르면(간격이 넓으면) 콤보가 끊겨서 단계가 오르지 않는다.
const RAPID_MS = 700;
const BABY_COUNT = 4;

export default function MallangStressPopup({ mood, charImage, onNext, nextLabel = "다음" }) {
  const [tapKey, setTapKey] = useState(0);
  const [level, setLevel] = useState(mood);
  const [showBabies, setShowBabies] = useState(false);
  const [babyTapKey, setBabyTapKey] = useState(0);
  const lastTapAt = useRef(0);

  const handleTap = () => {
    const now = Date.now();
    const isRapid = now - lastTapAt.current < RAPID_MS;
    lastTapAt.current = now;

    setTapKey(k => k + 1);
    if (navigator.vibrate) navigator.vibrate(15);

    if (!isRapid) return; // 느긋하게 누르면 그냥 통통 튀기만 하고 단계는 그대로

    if (level < 5) {
      setLevel(l => Math.min(5, l + 1));
    } else {
      setShowBabies(true);
      setBabyTapKey(k => k + 1);
    }
  };

  const label = showBabies ? "꺄아, 다같이 신났어요!" : "말랑이를 눌러서\n스트레스를 풀어보세요";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(28,26,23,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380, background: "#fff", borderRadius: 28, padding: "26px 24px 24px", textAlign: "center", animation: "mallangPopIn .32s cubic-bezier(.22,.9,.32,1)" }}>
        {/* 캐릭터가 말풍선으로 안내 */}
        <div style={{ display: "flex", gap: 9, alignItems: "flex-end", justifyContent: "center", marginBottom: 24, textAlign: "left" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FFEDF3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, overflow: "hidden" }}>
            {charImage ? <img src={charImage} alt="me" style={{ width: "85%", height: "85%", objectFit: "contain" }} /> : "🤖"}
          </div>
          <div style={{ maxWidth: 230, background: "#fff", border: "1px solid #EDE9E2", borderRadius: "16px 16px 16px 4px", padding: "12px 15px", fontSize: 13.5, lineHeight: 1.55, fontWeight: 700, color: "#1C1A17", whiteSpace: "pre-line" }}>
            {label}
          </div>
        </div>

        {/* 말랑이 + (연타 끝에 등장하는) 아기 말랑이들 */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, minHeight: 132 }}>
          {showBabies && Array.from({ length: BABY_COUNT / 2 }).map((_, i) => (
            <BabyMallang key={`l${i}`} index={i} tapKey={babyTapKey} />
          ))}

          <button
            onClick={handleTap}
            aria-label="말랑이 누르기"
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "block" }}
          >
            <Mallang v={level} size={132} tapKey={tapKey} />
          </button>

          {showBabies && Array.from({ length: BABY_COUNT / 2 }).map((_, i) => (
            <BabyMallang key={`r${i}`} index={i + BABY_COUNT / 2} tapKey={babyTapKey} />
          ))}
        </div>

        <button
          onClick={onNext}
          style={{ marginTop: 26, width: "100%", padding: 15, borderRadius: 15, border: "none", background: "#1C1A17", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}
        >
          {nextLabel}
        </button>
      </div>
      <style>{`
        @keyframes mallangPopIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
        @keyframes babyPopIn{from{opacity:0;transform:scale(.3) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes babyBounce{0%,100%{transform:translateY(0) rotate(var(--baby-tilt,0deg))}50%{transform:translateY(-7px) rotate(var(--baby-tilt,0deg))}}
      `}</style>
    </div>
  );
}

// 좋았어요(5) 표정 + 지금 고른 스킨을 그대로 물려받는 미니 말랑이 — 크기만 작게.
function BabyMallang({ index, tapKey }) {
  const tilt = (index % 2 === 0 ? -1 : 1) * (6 + (index % 3) * 2);
  const popDelay = index * 0.08;
  const bounceDuration = 1 + (index % 3) * 0.15;
  return (
    <div
      style={{
        "--baby-tilt": `${tilt}deg`,
        animation: `babyPopIn .3s ease-out ${popDelay}s both, babyBounce ${bounceDuration}s ease-in-out ${popDelay + 0.3}s infinite`,
      }}
    >
      <Mallang v={5} size={36} tapKey={tapKey} />
    </div>
  );
}
