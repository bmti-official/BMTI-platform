// 큐레이션·바로카드·플레이리스트가 함께 쓰는 '부위 묶음' 정의.
// 다이어리는 부위를 잘게 기록하고(목·어깨·팔꿈치…), 콘텐츠는 묶음으로 분류한다(목-머리·팔-손…).
// 그 사이를 잇는 유일한 기준표라, 부위를 늘리거나 묶음을 바꿀 땐 여기만 고치면 된다.
//
// 한 부위가 여러 묶음에 들어갈 수 있다.
//   '팔'은 목-머리(어깨에서 이어지는 저림)와 팔-손 양쪽에,
//   '다리'는 허리-골반(허리에서 내려오는 방사통)과 다리-발 양쪽에 속한다.

// 콘텐츠 분류용 묶음 — 검색 화면에 이 순서로 노출된다.
export const BODY_GROUPS = [
  { id: "all", label: "전체", parts: [] },                                   // parts 비움 = 전체
  { id: "neck_head", label: "목-머리", parts: ["neck", "head", "arm"] },
  { id: "waist_pelvis", label: "허리-골반", parts: ["waist", "pelvis", "leg"] },
  { id: "back_shoulder", label: "등-어깨", parts: ["back", "shoulder"] },
  { id: "leg_foot", label: "다리-발", parts: ["knee", "ankle", "leg"] },
  { id: "arm_hand", label: "팔-손", parts: ["elbow", "wrist", "arm"] },
  { id: "etc", label: "기타", parts: ["etc"] },
];

export const GROUP_IDS = BODY_GROUPS.map((g) => g.id);
export const GROUP_LABEL = Object.fromEntries(BODY_GROUPS.map((g) => [g.id, g.label]));

// 다이어리 부위코드 → 속한 묶음 id들
const PART_TO_GROUPS = (() => {
  const m = {};
  for (const g of BODY_GROUPS) for (const p of g.parts) (m[p] ||= []).push(g.id);
  return m;
})();
export const groupsOfPart = (partKey) => PART_TO_GROUPS[partKey] || [];

// 다이어리 기록(soreness 배열들)에서 많이 기록한 순으로 묶음을 뽑는다.
// 큐레이션·바로카드의 '불편 부위 기본 설정'이 이 결과를 쓴다.
export function topGroupsFromSoreness(entries, limit = 3) {
  const count = {};
  for (const e of entries || []) {
    for (const s of e?.soreness || []) {
      for (const gid of groupsOfPart(s.part)) count[gid] = (count[gid] || 0) + 1;
    }
  }
  return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([gid]) => gid);
}

// 기본 부위 설정 — 이번 달 기록 → 없으면 이전 기록 → 그래도 없으면 '전체'.
export function defaultGroups(entries, { year, month } = {}) {
  const all = entries || [];
  if (year && month) {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    const thisMonth = all.filter((e) => String(e?.date || "").startsWith(prefix));
    const fromThisMonth = topGroupsFromSoreness(thisMonth);
    if (fromThisMonth.length) return fromThisMonth;
  }
  const fromAll = topGroupsFromSoreness(all);
  return fromAll.length ? fromAll : ["all"];
}

// ── 타겟 세분화 ────────────────────────────────────────────────
// C 유형은 아픈 곳만 집중(핵심), L 유형은 몸 전체를 함께 본다(연관).
export const TARGET_MODES = [
  { id: "core", label: "핵심 부위 위주" },
  { id: "related", label: "연관 부위 위주" },
];
export const defaultTargetMode = (bmtiCode) =>
  (String(bmtiCode || "").toUpperCase().includes("C") ? "core" : "related");

// ── 도구·성향 분류 ─────────────────────────────────────────────
// O 유형은 이완, A 유형은 활력. 유형이 없으면 전체.
export const TOOL_MODES = [
  { id: "all", label: "전체" },
  { id: "relax", label: "이완 도구 및 성향 위주" },
  { id: "active", label: "활력 도구 및 성향 위주" },
];
export const defaultToolMode = (bmtiCode) => {
  const c = String(bmtiCode || "").toUpperCase();
  if (c.startsWith("O")) return "relax";
  if (c.startsWith("A")) return "active";
  return "all";
};
