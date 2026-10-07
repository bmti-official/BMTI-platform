// 둘러보기 격자의 차례 — 화면 부품이 아니라 값과 셈만 담는다.
import { gridOrder } from './gridOrder';

// 플리·읽을거리를 몇 칸마다 한 장씩 끼워 넣을지.
// 동작만 줄줄이 나오면 읽을거리가 묻히고, 너무 자주 끼우면 동작 흐름이 끊긴다.
const EVERY = 5;

// 읽는 데 걸리는 시간 — 우리말은 1분에 300자 안팎을 읽는다.
export const readMin = (item, tone) => {
  const body = String((tone === 'm' ? item.body_m : item.body_z) || item.body_z || item.body_m || '');
  return Math.max(1, Math.round(body.replace(/\s+/g, '').length / 300));
};

/** 플리와 읽을거리를 동작 사이사이에 끼워 넣는다. 동작 차례는 유형 규칙을 그대로 따른다. */
export function mixGrid(cards, reads, code, seed, plis = []) {
  const moves = gridOrder(cards, code, seed);
  // 끼워 넣을 것 — 플리와 읽을거리를 번갈아 세운다
  const extra = [];
  for (let i = 0; i < Math.max(plis.length, reads.length); i += 1) {
    if (i < plis.length) extra.push({ kind: 'pli', item: plis[i] });
    if (i < reads.length) extra.push({ kind: 'read', item: reads[i] });
  }
  const out = [];
  let r = 0;
  moves.forEach((c, i) => {
    out.push({ kind: 'card', item: c });
    if ((i + 1) % EVERY === 0 && r < extra.length) { out.push(extra[r]); r += 1; }
  });
  while (r < extra.length) { out.push(extra[r]); r += 1; }   // 남은 것은 뒤에
  return out;
}
