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
  bun: { label: "호빵 말랑이", images: { 1: bun2, 2: bun1, 3: bun3, 4: bun4, 5: bun5 } }, // 힘들었어요/지쳤어요 캐릭터를 서로 바꿔서 배정
};

// 스킨별로 전체적인 표시 크기를 보정한다(호빵은 원본이 작게 잡혀있어 더 키움).
// "지쳤어요"가 유독 꽉 차게 잘려있던 감자/호빵 원본은 다른 무드와 같은 캔버스/여백을
// 갖도록 이미지 자체를 다시 맞춰뒀기 때문에(assets 스크립트로 재정렬), 더 이상 무드별
// 배율 예외가 필요 없다.
export const MALLANG_SIZE_ADJUST = {
  potato: { base: 1 },
  // 힘들었어요(1)는 그림 자체가 어둡고 거친 질감이라 다른 무드보다 작아 보여서 조금 더 키움
  ice: { base: 1.25, moods: { 1: 1.42 } },
  bun: { base: 1.35 },
};

// 무드별 눈 위치(캔버스 대비 비율) — 기본 말랑이처럼 감았다 뜨는 깜빡임 효과를 위해
// 원본 이미지에서 눈이 있는 사각 영역을 미리 계산해뒀다. 이 영역 위에 피부색과 비슷한
// 색(_color)의 조각을 덧그려 스케일 애니메이션으로 잠깐 덮었다 걷어내면 깜빡이는 것처럼 보인다.
export const MALLANG_EYE_RECT = {
  potato: {
    1: { x: 0.2632, y: 0.5518, w: 0.5029, h: 0.0736, cw: 474, ch: 516 },
    2: { x: 0.2547, y: 0.5742, w: 0.4946, h: 0.0748, cw: 482, ch: 510 },
    3: { x: 0.2547, y: 0.5742, w: 0.4946, h: 0.0748, cw: 482, ch: 510 },
    4: { x: 0.247, y: 0.5698, w: 0.4996, h: 0.0752, cw: 476, ch: 504 },
    5: { x: 0.26, y: 0.5588, w: 0.4717, h: 0.0751, cw: 498, ch: 506 },
    _color: "#eed187",
  },
  ice: {
    1: { x: 0.301, y: 0.473, w: 0.4106, h: 0.0695, cw: 538, ch: 462 },
    2: { x: 0.2863, y: 0.5661, w: 0.4099, h: 0.0702, cw: 526, ch: 440 },
    3: { x: 0.2974, y: 0.5381, w: 0.4047, h: 0.0736, cw: 534, ch: 428 },
    4: { x: 0.2825, y: 0.5377, w: 0.4141, h: 0.0699, cw: 536, ch: 462 },
    5: { x: 0.3161, y: 0.5732, w: 0.3724, h: 0.0687, cw: 596, ch: 470 },
    _color: "#efeff3",
  },
  bun: {
    1: { x: 0.3182, y: 0.5252, w: 0.3691, h: 0.0823, cw: 504, ch: 328 },
    2: { x: 0.3182, y: 0.5252, w: 0.3691, h: 0.0823, cw: 504, ch: 328 },
    3: { x: 0.3107, y: 0.5255, w: 0.3403, h: 0.0793, cw: 556, ch: 344 },
    4: { x: 0.3294, y: 0.5237, w: 0.3219, h: 0.0831, cw: 578, ch: 328 },
    5: { x: 0.2974, y: 0.5197, w: 0.4559, h: 0.0861, cw: 508, ch: 320 },
    _color: "#f9f8f4",
  },
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

// 스킨별로 위 기본 필터를 대신 쓰고 싶을 때만 여기에 예외를 둔다.
export const MALLANG_MOOD_FILTER_OVERRIDE = {
  bun: {
    1: "grayscale(0.4) brightness(0.62) saturate(0.7)", // 힘들었어요 — 더 어둡게
    2: "grayscale(0.85) brightness(1.08) saturate(0.25)", // 지쳤어요 — 연회색으로
    // 괜찮았어요/좋았어요는 원본이 흰 배경에 묻히는 크림색이라, 밝기를 더 올리는 대신
    // 채도/대비를 끌어올려 살구빛 톤이 도드라지게 한다(밝게만 하면 흰 배경에 더 묻힘).
    4: "saturate(1.65) brightness(0.94) contrast(1.12)",
    5: "saturate(1.55) brightness(0.98) contrast(1.1) drop-shadow(0 0 5px rgba(255,196,110,0.5))",
  },
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
