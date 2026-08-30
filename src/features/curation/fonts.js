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

// 자리마다 글씨체를 못박아 둔다 — 글마다 달라지지 않게.
// 썸네일 문구만 관리자가 고른다.
export const F = {
  title: fontStack("pretendard"),   // 제목
  head:  fontStack("pretendard"),   // 소제목
  body:  fontStack("system"),       // 본문
  key:   fontStack("serif"),        // 핵심 한 줄
};

// 썸네일 문구에서 고를 수 있는 글씨체 세 가지
export const THUMB_FONTS = FONTS.filter((f) => ["pretendard", "serif", "rounded"].includes(f.key));

// 썸네일 문구를 놓을 자리 아홉 곳
export const THUMB_POS = [
  { key: "tl", label: "왼쪽 위",   align: "flex-start", justify: "flex-start", text: "left" },
  { key: "tc", label: "가운데 위", align: "flex-start", justify: "center",     text: "center" },
  { key: "tr", label: "오른쪽 위", align: "flex-start", justify: "flex-end",   text: "right" },
  { key: "ml", label: "왼쪽",      align: "center",     justify: "flex-start", text: "left" },
  { key: "mc", label: "가운데",    align: "center",     justify: "center",     text: "center" },
  { key: "mr", label: "오른쪽",    align: "center",     justify: "flex-end",   text: "right" },
  { key: "bl", label: "왼쪽 아래",   align: "flex-end", justify: "flex-start", text: "left" },
  { key: "bc", label: "가운데 아래", align: "flex-end", justify: "center",     text: "center" },
  { key: "br", label: "오른쪽 아래", align: "flex-end", justify: "flex-end",   text: "right" },
];
export const thumbPos = (key) => THUMB_POS.find((p) => p.key === key) || THUMB_POS[0];

// 밝은 글씨엔 어두운 그림자를, 어두운 글씨엔 밝은 그림자를 깐다.
export function thumbShadow(color) {
  const c = String(color || "#FFFFFF").replace("#", "");
  const n = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return Number.isNaN(lum) || lum > 0.55
    ? "0 2px 10px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.5)"
    : "0 2px 10px rgba(255,255,255,0.75), 0 1px 2px rgba(255,255,255,0.6)";
}

// 평균 가독시간 — 관리자가 비워두면 본문 글자 수로 어림한다(분당 약 500자).
export const readMinutes = (item) => {
  if (Number(item?.read_min) > 0) return Number(item.read_min);
  const text = ["s1_z", "s2_z", "s3_z", "s4_z"].map((k) => item?.[k] || "").join("");
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
