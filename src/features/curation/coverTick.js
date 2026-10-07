// 표지가 넘어가는 박자 — 화면의 모든 플리 표지가 같은 순간에 다음 그림으로 넘어간다.
// 표지마다 시계를 따로 돌리면 제각각 깜빡여 어지럽고, 시계 수만큼 일이 늘어난다.
import { useSyncExternalStore } from 'react';

const STEP_MS = 3000;
let tick = 0;
let timer = null;
const subs = new Set();

function subscribe(fn) {
  subs.add(fn);
  if (!timer) timer = setInterval(() => { tick += 1; subs.forEach((f) => f()); }, STEP_MS);
  return () => {
    subs.delete(fn);
    if (subs.size === 0 && timer) { clearInterval(timer); timer = null; }
  };
}

/** 3초마다 1씩 오르는 수 */
export function useCoverTick() {
  return useSyncExternalStore(subscribe, () => tick, () => 0);
}
