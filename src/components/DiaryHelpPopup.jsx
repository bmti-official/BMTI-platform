import { useState } from "react";
import { Mallang } from "./Mallang";
import { getTypeAccent, GOLD, YELLOW, YELLOW_LINE } from "../lib/typeAccent";

// ─────────────────────────────────────────────
// 말랑 다이어리 '?' 도움말 팝업 — 처음 로그인 후 온보딩에서 보여주던
// 대화형 소개 화면(DiaryOnboarding.jsx)을 언제든 다시 볼 수 있는 팝업으로 옮긴 것.
// 실제 기록(무드 선택 등)은 하지 않고, 소개 문구만 다시 보여준다.
// 마지막 페이지에서만 로그인 여부에 따라 버튼이 달라진다 — 로그인 상태면 "확인"으로 닫고,
// 로그인 전이면 카카오 3초 로그인 버튼을 보여준다.
// ─────────────────────────────────────────────

const C = {
  bg: "#FFFFFF", card: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2",
  pink: "#FF6B9D", pinkSoft: "#FFEDF3", lime: "#DFF56B",
};

const STEPS = [
  {
    id: "intro",
    title: <>말랑 다이어리는<br /><Mark>이런 곳이에요.</Mark></>,
    lead: "매일 조금씩, 진짜 내 몸을 알아가요.",
  },
  {
    id: "lazy",
    badge: "⏱️ 하루 10초",
    me: "몸이 계속 무겁긴 한데...\n뭘 또 챙겨야 한다고 생각하니 벌써 지쳐요 🥲",
    bot: "뭘 챙기라고 안 할게요.\n그냥 오늘 어땠는지만 알려주세요.\n10초면 충분해요. 나머지는 제가 기억할게요. 🧠",
  },
  {
    id: "blame",
    badge: "🌱 당신 탓이 아니에요",
    me: "운동도 해봤고 앱도 깔아봤는데\n결국 다 흐지부지됐어요...",
    bot: "지금까지 잘 안 됐던 건, 의지 탓이 아니에요.\n남들 방식에 나를 맞추려 했을 뿐이죠.\n\n성격이 다 다르듯,\n내 몸에 맞는 방식은 따로 있어요.",
  },
  {
    id: "safety",
    badge: "🏥 건강이 먼저예요",
    me: "요즘 목이 계속 뻐근한데...\n이거 괜찮은 걸까요?",
    bot: "저는 의사가 아니라, 진단은 못 해요.\n많이 아플 땐 병원에 먼저 가주세요. 🏥\n\n대신 언제 병원에 가야 할지는\n꼭 알려드릴게요.",
  },
  {
    id: "secret",
    badge: "🔒 여기만의 이야기",
    me: "근데 이거... 다른 사람이 볼 수도 있어요? 👀",
    bot: "여기 남긴 이야기는 아무에게도 보이지 않아요.\n오직 당신과 저만 아는 비밀이에요. 🔒",
  },
];

export default function DiaryHelpPopup({ onClose, isLoggedIn, onRequireLogin }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const isLast = i === STEPS.length - 1;
  const next = () => { if (!isLast) setI(i + 1); };

  const goLogin = () => {
    onClose();
    if (onRequireLogin) onRequireLogin();
  };

  const t = getTypeAccent();

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(28,26,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, maxHeight: "82vh", background: "#fff", borderRadius: 24, position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <button onClick={onClose} aria-label="닫기" style={{ position: "absolute", top: 10, right: 12, zIndex: 2, border: "none", background: "transparent", color: C.sub, fontSize: 16, cursor: "pointer", padding: 6 }}>✕</button>

        {/* 진행 점 */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "20px 0 4px", flexShrink: 0 }}>
          {STEPS.map((_, n) => (
            <div key={n} style={{ width: n === i ? 18 : 6, height: 6, borderRadius: 6, transition: "all .3s", background: n <= i ? t.accent : C.line }} />
          ))}
        </div>

        {/* 대화 카드 */}
        <div key={step.id} style={{ flex: 1, overflowY: "auto", padding: "18px 24px 8px", animation: "diaryHelpFade .3s ease-out" }}>
          {step.id === "intro" ? (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <Mallang v={5} size={72} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.45, letterSpacing: "-0.02em", margin: 0 }}>{step.title}</h1>
              <p style={{ fontSize: 14.5, fontWeight: 600, margin: "18px 0 0", lineHeight: 1.6 }}>{step.lead}</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 18 }}>{step.badge}</div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <div style={{ maxWidth: "88%", background: C.ink, color: "#fff", borderRadius: "18px 18px 4px 18px", padding: "13px 15px", fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-line" }}>
                  {step.me}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: t.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🤖</div>
                <div style={{ maxWidth: "85%", background: YELLOW, border: `1px solid ${YELLOW_LINE}`, borderRadius: "18px 18px 18px 4px", padding: "13px 15px", fontSize: 13.5, lineHeight: 1.65, whiteSpace: "pre-line" }}>
                  {step.bot}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 하단 버튼 */}
        <div style={{ flexShrink: 0, padding: "12px 22px 22px" }}>
          {isLast && !isLoggedIn ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <button onClick={goLogin} style={{ width: "100%", padding: 16, borderRadius: 15, border: "none", background: "#FEE500", color: "#3C1E1E", fontSize: 14.5, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                <svg viewBox="0 0 24 24" style={{ width: 19, height: 19, fill: "#3C1E1E" }}><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" /></svg>
                카카오로 3초 기록
              </button>
              <p style={{ fontSize: 10.5, color: C.sub, marginTop: 9 }}>🔕 광고 안 보냄 · 결과만 저장</p>
            </div>
          ) : (
            <button onClick={isLast ? onClose : next} style={{ width: "100%", padding: 16, borderRadius: 15, border: "none", background: GOLD, color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer" }}>
              {isLast ? "확인" : "다음"}
            </button>
          )}
        </div>

        <style>{`@keyframes diaryHelpFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    </div>
  );
}

function Mark({ children }) {
  return <span style={{ background: getTypeAccent().accentSoft, padding: "0 4px", borderRadius: 3, boxDecorationBreak: "clone" }}>{children}</span>;
}
