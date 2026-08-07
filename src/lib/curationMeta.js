// 큐레이션 카테고리 메타 — 사진 대신 브랜드 톤 파스텔 그라데이션 + 이모지 썸네일.
// CurationView(피드)와 CurationAdmin(관리자 등록)에서 함께 쓴다.
export const CURATION_THEME = {
  "자세교정": { grad: "linear-gradient(135deg,#DFF3EA,#B6E0CD)", emoji: "🧘" },
  "회복·수면": { grad: "linear-gradient(135deg,#4A4372,#6B5BB5)", emoji: "🌙" },
  "스트레칭": { grad: "linear-gradient(135deg,#EDE8F9,#CBBBF0)", emoji: "🪑" },
  "계절 관리": { grad: "linear-gradient(135deg,#E3EEFB,#BAD6F1)", emoji: "🧊" },
  "아이템": { grad: "linear-gradient(135deg,#FBE7EE,#F3C7D9)", emoji: "🎁" },
  "루틴": { grad: "linear-gradient(135deg,#FDF3D2,#F3DE9E)", emoji: "☀️" },
  "마음챙김": { grad: "linear-gradient(135deg,#EFEAFA,#D6C4F3)", emoji: "🫧" },
};

export const CURATION_CATEGORIES = Object.keys(CURATION_THEME);

// 큐레이션 태그 축 — 부위 × 유형 × 성격(글 종류). 한 글에 여러 개를 달 수 있다.
export const CURATION_BODY_PARTS = ["목·어깨", "허리·골반", "무릎", "손목"];
export const CURATION_TYPES = ["AZ", "AM", "OZ", "OM"];
export const CURATION_KINDS = ["구별해주는 글", "경계 알려주는 글", "속설"];

// BMTI 4글자 코드 → 큐레이션 2글자 유형(첫 글자 A/O + 끝 글자 Z/M). 예: OLQM → OM
export const toCurationType = (bmtiCode) => {
  const c = (bmtiCode ? String(bmtiCode).split("-")[0] : "").toUpperCase();
  return c.length >= 2 ? c[0] + c[c.length - 1] : "";
};

export const curationTheme = (cat) =>
  CURATION_THEME[cat] || { grad: "linear-gradient(135deg,#F1EEE8,#E4DECF)", emoji: "✨" };
