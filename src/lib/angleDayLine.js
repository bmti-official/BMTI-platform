// 일기장(그날 창)에 적는 각도기록 한 줄 — 날씨 적듯 항목과 수치만, 달라진 게 있으면 한 문장.
//
// 일기장은 내가 쓴 글의 자리다. 긴 문단을 지어 붙이면 리포트처럼 읽히고, 매주 같은 말이 되풀이된다.
// 그래서 수치는 한 줄로, 지난주보다 2도 넘게 달라진 곳이 있을 때만 그 한 곳을 짚는다.
// 각도는 주 한 번 재므로 '잰 날'의 일기장에만 붙는다.
import { toCVA } from './angleView';

const GOOD = 55;          // 흐리게 잡힌 판은 견주지 않는다(angleRecord와 같은 기준)
const NOTE_MIN = 2;       // 이만큼은 달라져야 한 문장을 붙인다

const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayOf = (r) => { const t = r?.measured_at || r?.created_at; if (!t) return null; const d = new Date(t); return Number.isNaN(d.getTime()) ? null : iso(d); };

// 화면에 보이는 값 — 목은 CVA(클수록 곧다)
const view = (r) => r && ({
  neck_bend: toCVA(r.neck_bend),
  trunk_flex: num(r.trunk_flex),
  arm_raise: num(r.arm_raise),
  arm_l: num(r.arm_raise_l), arm_r: num(r.arm_raise_r),
});
const R = (v) => Math.round(v);
// 일기장 말투 — 몸이 주어다. (값은 셋 다 '클수록 좋다'로 읽는다)
const SAY = {
  neck_bend: { up: (n) => `목이 지난주보다 ${n}° 더 곧아졌어요.`, down: (n) => `목이 지난주보다 ${n}° 더 앞으로 나왔어요.` },
  trunk_flex: { up: (n) => `허리가 지난주보다 ${n}° 더 깊이 숙여졌어요.`, down: (n) => `허리가 지난주보다 ${n}° 덜 숙여졌어요.` },
  arm_raise: { up: (n) => `팔이 지난주보다 ${n}° 더 올라갔어요.`, down: (n) => `팔이 지난주보다 ${n}° 덜 올라갔어요.` },
};

/** 그날 잰 각도가 있으면 { chips: ['목 72°', …], note: '허리가 지난주보다 4° 더 깊이 숙여졌어요.' | null } */
export function angleDayLine(rows, dateStr) {
  const list = (rows || []).filter((r) => dayOf(r))
    .sort((a, b) => String(b.measured_at || b.created_at).localeCompare(String(a.measured_at || a.created_at)));
  const i = list.findIndex((r) => dayOf(r) === dateStr);
  if (i < 0) return null;
  const now = view(list[i]);
  const chips = [];
  if (now.neck_bend != null) chips.push(`목 ${R(now.neck_bend)}°`);
  if (now.trunk_flex != null) chips.push(`허리 ${R(now.trunk_flex)}°`);
  if (now.arm_l != null && now.arm_r != null) chips.push(`팔 왼 ${R(now.arm_l)}° / 오 ${R(now.arm_r)}°`);
  else if (now.arm_raise != null) chips.push(`팔 ${R(now.arm_raise)}°`);
  if (!chips.length) return null;

  // 지난번(그 전에 잰 판) — 흐리게 잡힌 판은 빼고
  let note = null;
  const blurry = (r) => r?.quality != null && r.quality < GOOD;
  const prevRow = !blurry(list[i]) ? list.slice(i + 1).find((r) => !blurry(r)) : null;
  if (prevRow) {
    const prev = view(prevRow);
    let best = null;
    Object.keys(SAY).forEach((k) => {
      const a = now[k], b = prev[k];
      if (a == null || b == null) return;
      const d = a - b;
      if (Math.abs(d) >= NOTE_MIN && (!best || Math.abs(d) > Math.abs(best.d))) best = { k, d };
    });
    if (best) note = (best.d > 0 ? SAY[best.k].up : SAY[best.k].down)(R(Math.abs(best.d)));
  }
  return { chips, note };
}
