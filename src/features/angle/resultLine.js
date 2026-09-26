// 재고 난 뒤 한 문장 — 숫자 대신 '지난번과 견줘 어떻게 됐는지'를 말한다.
//
// 숫자 셋을 늘어놓으면 손님은 무엇이 좋은지 스스로 판단해야 한다. 그 판단을 대신 해 준다.
// 차이가 작을 때 '좋아졌다'고 하면 측정 흔들림을 몸의 변화로 착각하게 되니,
// 2도 미만은 '비슷해요'로 묶는다.
import { toCVA } from '../../lib/angleView';

// 세 항목 모두 클수록 좋은 값이다(목은 CVA로 본다).
// '조금/많이'와 붙여 읽혀야 해서 항목마다 통째로 적는다. 끼워 맞추면 '많이 더 깊이'처럼 꼬인다.
const WORD = {
  neck: { up: ['조금 곧아졌어요', '많이 곧아졌어요'], down: ['조금 앞으로 나왔어요', '많이 앞으로 나왔어요'] },
  trunk: { up: ['조금 더 숙여졌어요', '훨씬 더 숙여졌어요'], down: ['조금 덜 숙여졌어요', '훨씬 덜 숙여졌어요'] },
  arm: { up: ['조금 더 올라갔어요', '훨씬 더 올라갔어요'], down: ['조금 덜 올라갔어요', '훨씬 덜 올라갔어요'] },
};
const FIELD = { neck: 'neck_bend', trunk: 'trunk_flex', arm: 'arm_raise' };

const SAME = 2;   // 이보다 작으면 '비슷해요' — 재는 흔들림 안쪽이다
const BIG = 5;    // 이보다 크면 '많이'

/** 화면 값으로 바꿔 준다 — 목만 CVA */
export const viewVal = (take, raw) => {
  if (raw == null || raw === '' || !Number.isFinite(Number(raw))) return null;
  return take === 'neck' ? toCVA(raw) : Math.round(Number(raw) * 10) / 10;
};

/** 지난번 값 — 이번 주 판은 건너뛴다(같은 주에 다시 재면 덮어쓰므로 자기 자신과 견주게 된다) */
export function prevVal(rows, take, thisWeek) {
  const f = FIELD[take];
  const hit = (rows || []).find((r) => String(r.week) !== thisWeek && r[f] != null
    && Number.isFinite(Number(r[f])) && (r.quality == null || r.quality >= 55));
  return hit ? { v: viewVal(take, hit[f]), week: String(hit.week) } : null;
}

/** 한 문장 */
export function resultLine(take, now, prev) {
  if (now == null) return '이번엔 잡히지 않았어요.';
  if (!prev || prev.v == null) return '첫 기록이에요. 다음에 재면 견줘 드려요.';
  const d = Math.round((now - prev.v) * 10) / 10;
  if (Math.abs(d) < SAME) return '지난번과 비슷해요.';
  const big = Math.abs(d) >= BIG ? 1 : 0;
  return `지난번보다 ${(d > 0 ? WORD[take].up : WORD[take].down)[big]}.`;
}
