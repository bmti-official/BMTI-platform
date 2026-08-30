// 큐레이션 글씨체 — 관리자가 글마다 고른다.
// 외부에서 새로 받아오지 않고, 이미 사이트가 쓰고 있는 폰트와 기기 기본 폰트만 조합한다.
// (새 웹폰트를 더하면 첫 화면이 느려지고, 한글 폰트는 파일이 특히 크다.)
export const FONTS = [
  { key: "pretendard", label: "기본 (프리텐다드)", stack: "'Pretendard',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif" },
  { key: "serif",      label: "명조 (노토 세리프)", stack: "'Noto Serif KR','Nanum Myeongjo',serif" },
  { key: "system",     label: "기기 기본",          stack: "-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif" },
  { key: "rounded",    label: "둥근 고딕",          stack: "'Apple SD Gothic Neo','Malgun Gothic','Pretendard',sans-serif" },
];
export const fontStack = (key) => (FONTS.find((f) => f.key === key) || FONTS[0]).stack;

// 제목·썸네일과 본문은 글씨체를 따로 고른다.
// 본문 칸을 비워 두면 제목 글씨체를 그대로 쓴다.
export const titleFont = (item) => fontStack(item?.font_key);
export const bodyFont = (item) => fontStack(item?.font_body_key || item?.font_key);

// 평균 가독시간 — 관리자가 비워두면 본문 글자 수로 어림한다(분당 약 500자).
export const readMinutes = (item) => {
  if (Number(item?.read_min) > 0) return Number(item.read_min);
  const text = ["lead_z", "body_z", "s1_z", "s2_z", "s3_z", "s4_z"].map((k) => item?.[k] || "").join("");
  return Math.max(1, Math.round(text.length / 500));
};

// '6시간 전' · '3일 전'
export function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  const mo = Math.floor(d / 30);
  return mo < 12 ? `${mo}개월 전` : `${Math.floor(mo / 12)}년 전`;
}
