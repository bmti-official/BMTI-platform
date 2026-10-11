// 강사·회원에게 보이는 글의 기준 — "누가 가르치는가만 말하고, 무엇을 고치는가는 말하지 않는다."
export const BADGE = '물리치료사 면허 보유 · 확인';
export const SCOPE = '운동을 지도합니다. 진단·치료는 하지 않습니다.';

// 강사가 회원에게 쓰는 글에서 피하는 말 — 운동 지도의 범위를 넘는 것으로 읽힌다
const AVOID = ['치료', '도수', '교정', '처방', '진단', '환자', '낫게', '완치'];
/** 피할 말이 들어 있으면 그 말, 없으면 '' */
export const avoidWord = (text) => AVOID.find((w) => String(text || '').includes(w)) || '';
