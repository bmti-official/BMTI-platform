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
