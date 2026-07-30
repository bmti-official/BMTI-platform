// 말랑이 스킨(외형) — BMTI 하루일기 무드 마스코트의 이미지.
// 이제 유저가 고르는 기능은 없고, 기본은 2D 말랑이 하나로 통일한다.
// (스트레스 해소 팝업에서만 컴포넌트가 skinOverride로 3D 말랑이를 지정해 쓴다.)

// 기본 말랑이(2D)
import m2d1 from "../assets/2d_malang/malang_2D_힘들었어요.png";
import m2d2 from "../assets/2d_malang/malang_2D_지쳤어요.png";
import m2d3 from "../assets/2d_malang/malang_2D_그냥저냥.png";
import m2d4 from "../assets/2d_malang/malang_2D_괜찮았어요.png";
import m2d5 from "../assets/2d_malang/malang_2D_좋았어요.png";

// 3D 말랑이 — 스트레스 해소 팝업용
import m3d1 from "../assets/3d_malang/malang_3D_힘들었어요.PNG";
import m3d2 from "../assets/3d_malang/malang_3D_지쳤어요.png";
import m3d3 from "../assets/3d_malang/malang_3D_그냥저냥.png";
import m3d4 from "../assets/3d_malang/malang_3D_괜찮았어요.PNG";
import m3d5 from "../assets/3d_malang/malang_3D_좋았어요.png";

export const MALLANG_SKINS = {
  malang2d: { label: "말랑이", images: { 1: m2d1, 2: m2d2, 3: m2d3, 4: m2d4, 5: m2d5 } },
  malang3d: { label: "3D 말랑이", images: { 1: m3d1, 2: m3d2, 3: m3d3, 4: m3d4, 5: m3d5 } },
  default: { label: "기본 말랑이", images: null }, // SVG 폴백(현재 미사용, 안전용)
};

// 3D 말랑이는 배경 없는 투명 컷아웃이라 별도 모서리 둥글림이 필요 없다.
export const MALLANG_IMG_RADIUS = {};

// 스킨별 전체 표시 크기 보정.
// malang3d의 '그냥저냥'만 캔버스를 꽉 채워 그려져 다른 무드보다 커 보이므로, 그 무드만 줄여 맞춘다.
export const MALLANG_SIZE_ADJUST = {
  malang2d: { base: 1.18 }, // 400x400 정사각형으로 통일 — 얼굴이 캔버스의 ~80%
  malang3d: { base: 1.12, moods: { 3: 0.68 } },
};

// 무드별 눈 위치(캔버스 대비 비율) — 기본 말랑이처럼 감았다 뜨는 깜빡임을 위해
// 눈이 있는 사각 영역 위에 몸 색(color)의 조각을 잠깐 덮었다 걷어낸다.
// 2D 말랑이는 무드마다 몸 색이 달라 color도 무드별로 둔다.
export const MALLANG_EYE_RECT = {
  malang2d: {
    1: { x: 0.25, y: 0.40, w: 0.50, h: 0.11, cw: 400, ch: 400, color: "#5C4250" },
    2: { x: 0.25, y: 0.40, w: 0.50, h: 0.11, cw: 400, ch: 400, color: "#D0C8A3" },
    3: { x: 0.25, y: 0.40, w: 0.50, h: 0.11, cw: 400, ch: 400, color: "#FFFFFF" },
    4: { x: 0.25, y: 0.40, w: 0.50, h: 0.11, cw: 400, ch: 400, color: "#D8F0D8" },
    5: { x: 0.25, y: 0.40, w: 0.50, h: 0.11, cw: 400, ch: 400, color: "#EFE08A" },
    _color: "#FFFFFF",
  },
};

// 힘들었어요(1)→좋았어요(5)로 갈수록 색감이 살아나게 씌우는 필터(현재 스킨은 모두 필터 없음).
export const MALLANG_MOOD_FILTER = {
  1: "none", 2: "none", 3: "none", 4: "none", 5: "none",
};

const NO_FILTER = { 1: "none", 2: "none", 3: "none", 4: "none", 5: "none" };
// 2D·3D 말랑이는 무드별로 이미 색이 다르게 그려져 있어 추가 필터를 걸지 않는다.
// 단, 2D '지쳤어요'는 채도를 낮춰 조금 더 연한 연분홍으로 보이게 한다.
export const MALLANG_MOOD_FILTER_OVERRIDE = {
  malang2d: { ...NO_FILTER, 2: "saturate(0.5) brightness(1.05)" },
  malang3d: NO_FILTER,
};

const SKIN_KEY = "bmti_mallang_skin";
export const MALLANG_SKIN_EVENT = "mallang_skin_changed";

export function getMallangSkin() {
  // 말랑이 선택 기능을 없앴으므로 항상 기본 2D 말랑이로 보여준다.
  return "malang2d";
}

export function setMallangSkin(skin) {
  localStorage.setItem(SKIN_KEY, skin);
  window.dispatchEvent(new Event(MALLANG_SKIN_EVENT));
}
