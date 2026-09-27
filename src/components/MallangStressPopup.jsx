import { useRef, useState } from "react";
import { Mallang } from "./Mallang";
import { getTypeAccent } from "../lib/typeAccent";

// 말랑이를 고르거나 하루 기록을 마쳤을 때 뜨는 팝업 — 캐릭터가 채팅하듯
// "말랑이를 눌러서 스트레스를 풀어보세요"라고 말을 걸고, 가운데 큼직하게 뜬
// 말랑이를 누르면 눌렸다 펴지는 인터랙션이 재생된다.
//
// 연타 메커니즘: 짧은 간격(RAPID_MS 이내)으로 계속 누르면 콤보가 쌓이고, 콤보가
// TAPS_PER_LEVEL번 쌓일 때마다 힘들었어요→...→좋았어요로 한 단계씩 표정이 올라간다.
// 좋았어요(5)에 다다른 뒤에도 같은 박자로 계속 연타하면, 지금 고른 말랑이 스킨
// (기본/감자/얼음/호빵)의 아기 버전이 양옆에 나타나 다같이 웃는다.
// 천천히 누르면(간격이 넓으면) 콤보가 끊겨서 단계가 오르지 않는다.
const RAPID_MS = 700;
const TAPS_PER_LEVEL = 3; // 한 단계 올리는 데 필요한 연속 연타 횟수
const BABY_COUNT = 4;

export default function MallangStressPopup({ mood, charImage, onNext, nextLabel = "다음",
  // 오늘 기록을 마쳤을 때 — 내 파트너가 건네는 한마디. 넘기지 않으면 안 뜬다.
  word = "", partner = "",
  // 처음부터 매일 한마디 책을 펼쳐 둘지 — '매일 한마디 →' 버튼으로 바로 들어올 때
  initialOpenWord = false }) {
  const t = getTypeAccent();
  const [tapKey, setTapKey] = useState(0);
  const [level, setLevel] = useState(mood);
  const [showBabies, setShowBabies] = useState(false);
  const [babyTapKey, setBabyTapKey] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | press | release — 젤리 스쿼시&스트레치
  const [openWord, setOpenWord] = useState(initialOpenWord && !!word);
  const lastTapAt = useRef(0);
  const comboRef = useRef(0);
  const releaseTimer = useRef(null);

  // 누르면 눌린 쪽으로 납작+옆으로 퍼짐, 떼면 살짝 길쭉해졌다가 오버슛으로 복귀(부피 보존).
  const onPressDown = () => { clearTimeout(releaseTimer.current); setPhase("press"); };
  const onPressUp = () => { setPhase("release"); clearTimeout(releaseTimer.current); releaseTimer.current = setTimeout(() => setPhase("idle"), 240); };
  const bodyTf = phase === "press" ? "scaleX(1.15) scaleY(0.85)" : phase === "release" ? "scaleX(0.93) scaleY(1.07)" : "scale(1)";

  const handleTap = () => {
    const now = Date.now();
    const isRapid = now - lastTapAt.current < RAPID_MS;
    lastTapAt.current = now;

    setTapKey(k => k + 1);
    if (navigator.vibrate) navigator.vibrate(15);

    if (!isRapid) {
      comboRef.current = 0; // 느긋하게 누르면 콤보가 끊겨서 그냥 통통 튀기만 한다
      return;
    }

    comboRef.current += 1;
    if (comboRef.current < TAPS_PER_LEVEL) return;
    comboRef.current = 0;

    if (level < 5) {
      setLevel(l => Math.min(5, l + 1));
    } else {
      setShowBabies(true);
      setBabyTapKey(k => k + 1);
    }
  };

  const label = showBabies ? "꺄아, 다같이 신났어요!" : "말랑이를 눌러서\n스트레스를 풀어보세요";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "transparent", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {/* 우측 상단 닫기 — 흰 배경 동그란 X */}
      <button onClick={onNext} aria-label="닫기" style={{ position: "absolute", top: 64, right: 16, zIndex: 2, width: 40, height: 40, borderRadius: "50%", border: "none", background: "#fff", color: "#8B857B", fontSize: 18, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.18)" }}>✕</button>
      <div style={{ width: "100%", maxWidth: 380, background: "transparent", padding: "8px 4px", textAlign: "center", animation: "mallangPopIn .32s cubic-bezier(.22,.9,.32,1)" }}>
        {/* 캐릭터가 말풍선으로 안내 — 책이 펼쳐지면 자리를 내준다 */}
        {!openWord && (
        <div style={{ display: "flex", gap: 9, alignItems: "flex-end", justifyContent: "center", marginBottom: 24, textAlign: "left" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: t.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, overflow: "hidden" }}>
            {charImage ? <img src={charImage} alt="me" style={{ width: "85%", height: "85%", objectFit: "contain" }} /> : "🤖"}
          </div>
          <div style={{ maxWidth: 230, background: "#fff", border: "1px solid #EDE9E2", borderRadius: "16px 16px 16px 4px", padding: "12px 15px", fontSize: 13.5, lineHeight: 1.55, fontWeight: 700, color: "#1C1A17", whiteSpace: "pre-line" }}>
            {label}
          </div>
        </div>
        )}

        {/* 말랑이 + (연타 끝에 등장하는) 아기 말랑이들 — 한마디를 펼치면 책이 대신 선다 */}
        {openWord ? (
          <DailyBook word={word} partner={partner} charImage={charImage} accent={t} onBack={() => setOpenWord(false)} />
        ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 250 }}>
          {showBabies && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              {Array.from({ length: BABY_COUNT / 2 }).map((_, i) => (
                <BabyMallang key={`l${i}`} index={i} tapKey={babyTapKey} />
              ))}
            </div>
          )}

          <button
            onClick={handleTap}
            onPointerDown={onPressDown}
            onPointerUp={onPressUp}
            onPointerLeave={onPressUp}
            aria-label="말랑이 누르기"
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "block", position: "relative", touchAction: "manipulation" }}
          >
            {/* 무대(은은한 조명) */}
            <div style={{ position: "absolute", left: "50%", top: "52%", transform: "translate(-50%,-50%)", width: 240, height: 240, borderRadius: "50%", background: `radial-gradient(circle, ${t.accentSoft} 0%, rgba(255,255,255,0) 68%)`, pointerEvents: "none" }} />
            {/* 젤리 몸통 — 스쿼시&스트레치(부피 보존) + 오버슛 복귀 */}
            <div style={{ position: "relative", filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.14))", transformOrigin: "50% 100%", transform: bodyTf, transition: "transform .42s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
              <Mallang v={level} size={248} skinOverride="malang2d" noBlink />
            </div>
          </button>

          {showBabies && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              {Array.from({ length: BABY_COUNT / 2 }).map((_, i) => (
                <BabyMallang key={`r${i}`} index={i + BABY_COUNT / 2} tapKey={babyTapKey} />
              ))}
            </div>
          )}
        </div>
        )}

        {/* 매일 한마디 — 누르면 말랑이가 물러나고 그 자리에 책이 펼쳐진다.
            빨리 나가려는 사람을 붙잡지는 않는다. */}
        {word && !openWord && (
          <div style={{ marginTop: 4 }}>
            <button onClick={() => setOpenWord(true)}
              style={{ border: "none", cursor: "pointer", fontFamily: "inherit", background: "#fff",
                borderRadius: 999, padding: "11px 18px", fontSize: 12.5, fontWeight: 800, color: "#1C1A17",
                boxShadow: "0 3px 12px rgba(0,0,0,0.12)" }}>
              {partner ? `'${partner}'의 매일 한마디` : "매일 한마디"} →
            </button>
          </div>
        )}

      </div>
      <style>{`
        @keyframes mallangPopIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
        @keyframes babyPopIn{from{opacity:0;transform:scale(.3) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes babyBounce{0%,100%{transform:translateY(0) rotate(var(--baby-tilt,0deg))}50%{transform:translateY(-7px) rotate(var(--baby-tilt,0deg))}}
        /* 책 — 덮개가 왼쪽으로 젖혀지며 오른쪽 면이 드러난다 */
        @keyframes bookRise{from{opacity:0;transform:translateY(14px) scale(.94)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes bookCover{from{transform:rotateY(0deg)}to{transform:rotateY(-172deg)}}
        @keyframes bookShade{0%{opacity:1}70%{opacity:.45}100%{opacity:0}}
        @keyframes bookInk{0%,55%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:translateY(0)}}
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
      <Mallang v={5} size={48} tapKey={tapKey} skinOverride="malang2d" noBlink />
    </div>
  );
}

// 매일 한마디를 담는 책 — 말랑이가 있던 자리에 하얀 책이 펼쳐진다.
//
// 말풍선으로 두면 말랑이 밑에 꼬리처럼 붙어 곁다리로 읽힌다.
// 한마디는 오늘 기록의 마무리라, 화면 가운데를 차지해야 그렇게 읽힌다.
//
// 왼쪽 면에는 누가 하는 말인지, 오른쪽 면에는 글. 덮개가 왼쪽으로 젖혀지며 열린다.
function DailyBook({ word, partner, charImage, accent, onBack }) {
  const PAGE = "#FFFFFF";
  const EDGE = "#EFEAE0";      // 종이 옆면
  const line = "#F3F0E9";
  return (
    <div style={{ minHeight: 250, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", perspective: 1100, animation: "bookRise .36s cubic-bezier(.22,.9,.32,1) both" }}>
        <div style={{ position: "relative", display: "flex", borderRadius: 10, overflow: "hidden",
          boxShadow: "0 10px 30px rgba(28,26,23,0.22), 0 2px 6px rgba(28,26,23,0.12)" }}>

          {/* 왼쪽 면 — 누가 하는 말인지 */}
          {/* 폭을 38%로 못 박는다 — 안 그러면 글자 폭만큼 넓어져, 책등(38%)보다 오른쪽에 가운데가 잡힌다 */}
          <div style={{ flex: "0 0 38%", minWidth: 0, boxSizing: "border-box", background: PAGE, padding: "18px 10px", display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9,
            borderRight: `1px solid ${line}`, minHeight: 210 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: accent.accentSoft, display: "flex",
              alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: 22 }}>
              {charImage ? <img src={charImage} alt="" style={{ width: "86%", height: "86%", objectFit: "contain" }} /> : "🤖"}
            </div>
            {partner && (
              <div style={{ fontSize: 12, fontWeight: 900, color: "#1C1A17", textAlign: "center", wordBreak: "keep-all", lineHeight: 1.4 }}>
                {partner}
              </div>
            )}
            <div style={{ fontSize: 10.5, fontWeight: 800, color: "#B4ADA2", letterSpacing: "0.06em" }}>매일 한마디</div>
          </div>

          {/* 오른쪽 면 — 글 */}
          <div style={{ flex: 1, minWidth: 0, position: "relative", background: PAGE, padding: "20px 18px", minHeight: 210,
            display: "flex", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.95, fontWeight: 700, color: "#1C1A17",
              whiteSpace: "pre-line", wordBreak: "keep-all", textWrap: "pretty", textAlign: "left",
              animation: "bookInk .8s ease both" }}>
              {word}
            </p>
            {/* 넘어가는 면 — 왼쪽 등을 축으로 젖혀진다.
                뒷면을 감춰 둔다. 안 그러면 다 젖혀진 뒤에 왼쪽 면을 덮어 가린다.
                종이 색을 살짝 눕혀 둬야 흰 바탕 위에서 넘어가는 게 보인다. */}
            <div aria-hidden style={{ position: "absolute", inset: 0, transformOrigin: "left center",
              backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
              background: `linear-gradient(100deg, ${EDGE} 0%, #FBF8F1 30%, #FFFFFF 100%)`,
              borderRight: `1px solid ${EDGE}`,
              animation: "bookCover .82s cubic-bezier(.42,.02,.24,1) both", pointerEvents: "none",
              boxShadow: "-10px 0 24px rgba(28,26,23,0.16)" }} />
            {/* 넘어가는 동안 오른쪽 면에 지는 그림자 */}
            <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(100deg, rgba(28,26,23,0.16) 0%, rgba(28,26,23,0) 55%)",
              animation: "bookShade .82s ease-out both" }} />
          </div>

          {/* 책등 — 가운데 접힌 자리 */}
          <div aria-hidden style={{ position: "absolute", left: "38%", top: 0, bottom: 0, width: 14, marginLeft: -7,
            background: "linear-gradient(90deg, rgba(28,26,23,0) 0%, rgba(28,26,23,0.07) 45%, rgba(28,26,23,0.07) 55%, rgba(28,26,23,0) 100%)",
            pointerEvents: "none" }} />
        </div>
      </div>

      <button onClick={onBack}
        style={{ marginTop: 14, border: "none", cursor: "pointer", fontFamily: "inherit", background: "transparent",
          fontSize: 12, fontWeight: 800, color: "#8B857B", padding: "6px 10px" }}>
        말랑이로 돌아가기
      </button>
    </div>
  );
}
