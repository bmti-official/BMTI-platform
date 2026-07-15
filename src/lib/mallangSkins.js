// 말랑이 스킨(외형) — 기본 SVG 말랑이 대신 고를 수 있는 이미지 스킨들.
// 선택한 스킨은 localStorage에 저장되고, Mallang 컴포넌트가 어디서 쓰이든
// (캘린더, 하루일기 작성, 하단 네비 등) 전부 같은 스킨으로 반영된다.

import potato1 from "../assets/감자 말랑이_힘들었어요.png";
import potato2 from "../assets/감자 말랑이_지쳤어요.png";
import potato3 from "../assets/감자 말랑이_그냥저냥.png";
import potato4 from "../assets/감자 말랑이_괜찮았어요.png";
import potato5 from "../assets/감자 말랑이_좋았어요.png";

import ice1 from "../assets/얼름말랑이_힘들었어요.png";
import ice2 from "../assets/얼름말랑이_지쳤어요.png";
import ice3 from "../assets/얼름말랑이_그냥저냥.png";
import ice4 from "../assets/얼름말랑이_괜찮았어요.png";
import ice5 from "../assets/얼름말랑이_좋았어요.png";

import bun1 from "../assets/호빵말랑이_힘들었어요.png";
import bun2 from "../assets/호빵 말랑이_지쳤어요.png";
import bun3 from "../assets/호빵 말랑이_그냥저냥.png";
import bun4 from "../assets/호빵말랑이_괜찮았어요.png";
import bun5 from "../assets/호빵 말랑이_좋았어요.png";

export const MALLANG_SKINS = {
  default: { label: "기본 말랑이", images: null },
  potato: { label: "감자 말랑이", images: { 1: potato1, 2: potato2, 3: potato3, 4: potato4, 5: potato5 } },
  ice: { label: "얼음 말랑이", images: { 1: ice1, 2: ice2, 3: ice3, 4: ice4, 5: ice5 } },
  bun: { label: "호빵 말랑이", images: { 1: bun1, 2: bun2, 3: bun3, 4: bun4, 5: bun5 } },
};

// 스킨별 원본 이미지 크롭이 서로 달라(특히 "지쳤어요"가 유독 꽉 차게 잘려있어) 그대로 두면
// 같은 표시 크기(size)에서 유독 크거나 작아 보인다. 원본 파일을 건드리지 않고 스킨/무드별로
// 보이는 크기를 보정한다. moods에 없는 무드는 base 배율을 그대로 쓴다.
export const MALLANG_SIZE_ADJUST = {
  potato: { base: 1, moods: { 2: 0.74 } },
  ice: { base: 1, moods: {} },
  bun: { base: 1.25, moods: { 2: 0.6 } }, // 호빵은 전체적으로 더 키우되, 지쳤어요는 이미 꽉 차게 잘려있어 덜 키움
};

// 힘들었어요(1) → 좋았어요(5)로 갈수록 색감이 살아나도록 스킨 이미지에 씌우는 필터.
// 기본(SVG) 말랑이는 이미 무드별로 색이 다르게 그려져 있어 대상에서 제외.
export const MALLANG_MOOD_FILTER = {
  1: "grayscale(0.35) brightness(0.82) saturate(0.75)",
  2: "grayscale(0.15) brightness(0.92) saturate(0.88)",
  3: "none",
  4: "brightness(1.05) saturate(1.12)",
  5: "brightness(1.12) saturate(1.3) drop-shadow(0 0 5px rgba(255,196,110,0.5))",
};

const SKIN_KEY = "bmti_mallang_skin";
export const MALLANG_SKIN_EVENT = "mallang_skin_changed";

export function getMallangSkin() {
  const saved = localStorage.getItem(SKIN_KEY);
  return saved && MALLANG_SKINS[saved] ? saved : "default";
}

export function setMallangSkin(skin) {
  localStorage.setItem(SKIN_KEY, skin);
  window.dispatchEvent(new Event(MALLANG_SKIN_EVENT));
}
