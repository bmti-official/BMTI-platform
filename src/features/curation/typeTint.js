// 유형마다 다른 옅은 바탕색 — 오프닝 화면에서 '내 파트너의 자리'처럼 보이게 한다.
// 활력형(A)은 따뜻한 쪽, 이완형(O)은 서늘한 쪽으로 묶었다.
// 전부 아주 옅어서 검은 글씨가 그대로 읽힌다.
const TINT = {
  ACDZ: '#F6E3DC', ACDM: '#FCE6E9', ACQZ: '#FBEEDC', ACQM: '#FDE9D6',
  ALDZ: '#F3E4D2', ALDM: '#FBE4DB', ALQZ: '#F7EAD4', ALQM: '#FDEBE2',
  OCDZ: '#DFEAEA', OCDM: '#E6E9F7', OCQZ: '#DEE9F1', OCQM: '#EDE6F6',
  OLDZ: '#E2EDE4', OLDM: '#E9F0E5', OLQZ: '#DFEDF0', OLQM: '#EAE7F4',
};
const DEFAULT = '#F3F1EC';

export const axisOf = (code) => String(code || '').split('-')[0].toUpperCase();

/** 오프닝 화면 바탕 — 위는 하얗게, 아래로 갈수록 유형 색이 번진다. */
export function tintBg(code) {
  const c = TINT[axisOf(code)] || DEFAULT;
  return `linear-gradient(180deg, #FFFFFF 0%, ${c} 100%)`;
}
export const tintOf = (code) => TINT[axisOf(code)] || DEFAULT;
