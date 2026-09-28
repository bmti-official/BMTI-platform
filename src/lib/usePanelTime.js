// 창·갈래 단위로 머문 시간을 잰다.
//
// 큰 화면(trackScreen)은 홈·검사·결과·다이어리·마이페이지 다섯뿐이라,
// 그 안에서 여닫는 창(기록·발견, 편지, 각도기록)과 자기점검 갈래는 따로 잰다.
//   panel_enter { panel }        처음 열었을 때 한 번
//   panel_leave { panel, sec }   닫을 때, 그리고 탭이 가려질 때마다 그때까지 머문 만큼
// 탭이 가려진 동안은 세지 않는다. 한 번 열어 둔 동안의 합 = 같은 panel 의 sec 합.
import { useEffect } from 'react';
import { track, flushNow } from './analytics';

export function usePanelTime(panel, on = true) {
  useEffect(() => {
    if (!on || !panel) return undefined;
    let from = document.visibilityState === 'hidden' ? 0 : Date.now();
    const leave = () => {
      if (!from) return;
      const sec = Math.round((Date.now() - from) / 1000);
      from = 0;
      if (sec >= 1 && sec <= 60 * 60) track('panel_leave', { panel, sec });
    };
    track('panel_enter', { panel });
    const vis = () => {
      if (document.visibilityState === 'hidden') { leave(); flushNow(); } else if (!from) from = Date.now();
    };
    document.addEventListener('visibilitychange', vis);
    return () => { document.removeEventListener('visibilitychange', vis); leave(); };
  }, [panel, on]);
}
