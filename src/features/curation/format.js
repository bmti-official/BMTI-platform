// 큐레이션·바로카드 표시용 계산 — 컴포넌트 파일과 분리해 Fast Refresh를 살린다.
export const KIND_LABEL = { massage: '마사지', stretch: '스트레칭', exercise: '운동' };

// Z 유형은 담백한 글, M 유형은 다정한 글을 본다.
export const toneOf = (bmtiCode) => (String(bmtiCode || '').toUpperCase().endsWith('M') ? 'm' : 'z');

export const pickCurationTone = (item, tone) => ({
  title: (tone === 'm' ? item.title_m : item.title_z) || item.title_z || item.title_m || '',
  body: (tone === 'm' ? item.body_m : item.body_z) || '',
});
export const pickCardTone = (c, tone) => ({
  title: (tone === 'm' ? c.title_m : c.title_z) || c.title_z || c.title_m || '',
  script: (tone === 'm' ? c.script_m : c.script_z) || '',
});

export const fmtCount = (n) => (Number(n) || 0).toLocaleString('ko-KR');
export const mmss = (sec) => {
  const s = Math.max(0, Number(sec) || 0);
  return `${Math.floor(s / 60)}분 ${String(s % 60).padStart(2, '0')}초`;
};
// 완주율 — 시작한 사람 중 끝까지 한 비율. 시작 기록이 없으면 아직 알 수 없다.
export const finishRate = (c) => {
  const st = Number(c.start_count) || 0;
  return st > 0 ? Math.round(((Number(c.finish_count) || 0) / st) * 100) : null;
};
