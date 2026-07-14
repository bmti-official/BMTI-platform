// 말랑이 — BMTI 하루일기의 무드 마스코트 (SVG, 5단계 표정)
import { useRef } from "react";
import { MOODS } from "../data";

export function Mallang({ v, size = 44, tapKey = 0 }) {
  const m = MOODS.find(x => x.v === v) || MOODS[2];
  // 힘들었어요(v=1)는 배경이 짙은 검붉은색이라 기본 잉크색 선화가 거의 안 보여서,
  // 무드별로 밝은 선 색을 따로 지정할 수 있게 함 (없으면 기존 어두운 잉크색 사용).
  const eye = m.line || "#2B2A28";
  // 캘린더처럼 여러 마리가 동시에 떠 있을 때 전부 같은 박자로 깜박이면 부자연스러워서,
  // 인스턴스마다 한 번만 랜덤 지연을 뽑아 서로 어긋나게 만든다.
  const blinkDelay = useRef(-(Math.random() * 5).toFixed(2) + "s").current;
  const eyeStyle = { animationDelay: blinkDelay };
  return (
    // key에 tapKey를 같이 섞어서, 표정(무드)이 바뀔 때뿐 아니라 (기본 동작 그대로 유지)
    // 외부에서 tapKey를 올려주는 경우(예: 스트레스 해소 팝업에서 말랑이를 꾹 눌렀을 때)에도
    // svg가 다시 마운트되어 squish 애니메이션이 재생된다.
    <svg key={`${v}-${tapKey}`} className="mallang-squish" viewBox="0 0 100 82" width={size} height={size * 0.82}
      style={{ display: "block", margin: "0 auto", overflow: "visible", transformBox: "fill-box", transformOrigin: "50% 100%" }}>
      <path d="M9 58 C9 22, 32 9, 51 9 C71 9, 92 24, 92 56 C92 68, 74 74, 50 74 C26 74, 9 69, 9 58 Z"
        fill={m.fill} stroke={m.stroke} strokeWidth="1.6" strokeLinejoin="round" />
      {v === 1 && <>
        <path className="mallang-eye" style={eyeStyle} d="M27 37 Q34 30 41 39" stroke={eye} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path className="mallang-eye" style={eyeStyle} d="M59 37 Q66 30 73 39" stroke={eye} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        {/* 힘들어서 입을 벌리고 앓는 소리를 내는 열린 입 */}
        <ellipse cx="50" cy="58" rx="9" ry="10.5" fill={eye} />
        <path d="M79 30 q3 5 0 8 q-3-3 0-8Z" fill="#BFE0F2" />
        <path d="M21 33 q2.5 4 0 6.5 q-2.5-2.5 0-6.5Z" fill="#BFE0F2" />
      </>}
      {v === 2 && <>
        <path className="mallang-eye" style={eyeStyle} d="M28 40 Q34 36 40 40" stroke={eye} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path className="mallang-eye" style={eyeStyle} d="M60 40 Q66 36 72 40" stroke={eye} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <line x1="43" y1="55" x2="57" y2="55" stroke={eye} strokeWidth="2.6" strokeLinecap="round" />
      </>}
      {v === 3 && <>
        <circle className="mallang-eye" style={eyeStyle} cx="35" cy="40" r="3.4" fill={eye} />
        <circle className="mallang-eye" style={eyeStyle} cx="65" cy="40" r="3.4" fill={eye} />
        <line x1="43" y1="55" x2="57" y2="55" stroke={eye} strokeWidth="2.6" strokeLinecap="round" />
      </>}
      {v === 4 && <>
        <circle className="mallang-eye" style={eyeStyle} cx="35" cy="39" r="3.4" fill={eye} />
        <circle className="mallang-eye" style={eyeStyle} cx="65" cy="39" r="3.4" fill={eye} />
        <path d="M42 52 Q50 60 58 52" stroke={eye} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </>}
      {v === 5 && <>
        <path className="mallang-eye" style={eyeStyle} d="M28 42 Q34 34 40 42" stroke={eye} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path className="mallang-eye" style={eyeStyle} d="M60 42 Q66 34 72 42" stroke={eye} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        {/* 활짝 벌리고 기뻐서 웃는 입 — 바깥 웃음 라인 + 크게 벌어진 안쪽 */}
        <path d="M35 48 Q50 68 65 48" stroke={eye} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path d="M39 50 Q50 63 61 50 Z" fill={eye} opacity="0.9" />
        <path d="M82 24 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6-4 -4-1.6 4-1.6Z" fill="#2B2A28" />
        <path d="M22 28 l1.1 2.8 2.8 1.1 -2.8 1.1 -1.1 2.8 -1.1-2.8 -2.8-1.1 2.8-1.1Z" fill="#2B2A28" opacity="0.7" />
      </>}
    </svg>
  );
}
