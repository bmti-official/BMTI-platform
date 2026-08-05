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

export const curationTheme = (cat) =>
  CURATION_THEME[cat] || { grad: "linear-gradient(135deg,#F1EEE8,#E4DECF)", emoji: "✨" };
