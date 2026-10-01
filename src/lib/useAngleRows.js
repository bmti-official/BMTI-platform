// 각도 판 읽어 오기 — 이번달 기록의 각도기록 상자가 쓴다.
import { useEffect, useState } from 'react';
import { recentChecks, sundayOf } from './angleRecord';

const GOOD = 55;   // AngleBoxCard와 같은 기준 — 이보다 흐리게 잰 판은 쓰지 않는다
/** 쓸 만한 판이 하나라도 있는지 */
export const hasUsableAngle = (rows) => (rows || []).some((r) => r && (r.quality == null || r.quality >= GOOD));

/**
 * 밖에서 넘겨주면(관리자 미리보기) 그걸 쓰고, 아니면 직접 가져온다.
 * ready 는 다 읽었는지 — 읽는 동안 '아직 없어요' 예시가 잠깐 떴다 사라지지 않게 한다.
 */
export function useAngleRows(given, off = false) {
  const [fetched, setFetched] = useState(null);
  useEffect(() => {
    if (given || off) return undefined;
    let alive = true;
    recentChecks(20).then((r) => { if (alive) setFetched(r || []); });
    return () => { alive = false; };
  }, [given, off]);
  return { rows: given || fetched || [], ready: !!given || fetched !== null };
}

// 아직 잰 적이 없을 때 흐리게 보여 줄 예시 — 다섯 주 동안 조금씩 나아진 사람
function exampleWeeks(n) {
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const w = sundayOf(d);
    out.push({
      week: w, measured_at: `${w}T09:00:00Z`,
      neck_bend: Math.round((16 + i * 1.4 + (i % 2 ? 1.1 : -0.6)) * 10) / 10,
      trunk_flex: Math.round((72 - i * 2.2 + (i % 3 ? 1.5 : -1.2)) * 10) / 10,
      arm_raise: Math.round((148 - i * 1.8) * 10) / 10,
      arm_raise_l: Math.round((148 - i * 1.8) * 10) / 10,
      arm_raise_r: Math.round((136 - i * 2.4) * 10) / 10,
      quality: 82,
    });
  }
  return out;
}
export const ANGLE_EXAMPLE = exampleWeeks(5);
