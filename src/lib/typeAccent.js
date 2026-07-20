// 전체 페이지 색상 통일 규칙의 '강조 요소' 색 — 사용자의 BMTI 어투 축(Z/M)에 따라
// M 유형은 연분홍, Z 유형은 연보라를 강조색으로 쓴다.
// (기본 배경=화이트 / 기본 문구=검정 / 핵심 버튼=골드 / 박스=연옐로우는 컴포넌트에서 공통 상수로 사용)
export const GOLD = "#C9975A";
export const YELLOW = "#FDF6DC";
export const YELLOW_LINE = "#F0E4B8";

export function getTypeAccent(bmtiCode) {
  let code = bmtiCode;
  // 인자가 없으면 저장된 코드를 읽어 쓴다 — 컴포넌트마다 bmtiCode를 넘기지 않아도
  // 어디서든 같은 유형별 강조색을 얻을 수 있게 한다.
  if (!code && typeof localStorage !== "undefined") {
    try { code = localStorage.getItem("bmti_code"); } catch { /* noop */ }
  }
  const axis = code ? String(code).split("-")[0] : "";
  const isM = axis.includes("M");
  return isM
    ? { key: "M", accent: "#E86A9E", accentSoft: "#FCE7EF", accentDeep: "#C4517A" }   // 연분홍
    : { key: "Z", accent: "#8B7BD8", accentSoft: "#EDE8F9", accentDeep: "#6B5BB5" };  // 연보라
}
