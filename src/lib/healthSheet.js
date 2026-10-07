// 건강 정보 한 장 — 다이어리에서 미리 채워 올 것을 뽑는다.
//
// 이미 다이어리에 적은 것을 한 장에서 다시 묻지 않는다. 최근 기록에서 자주 불편했던 곳을
// 가져와 채워 두고, 손님은 맞는지만 본다.
import { getDiaryHistory } from './diaryHistory';
import { KEY_TO_PART_LABEL, KEY_TO_WHEN_LABEL } from './diaryEntryLabels';

const DAYS = 14;   // 얼마 전까지의 기록을 볼지
const MAX = 3;     // 한 장에 담는 부위 수

/** 최근 2주 다이어리에서 자주 적은 불편 부위(많은 순, 최대 3곳)를 한 장의 모양으로 돌려준다. */
export function soreFromDiary() {
  const since = Date.now() - DAYS * 864e5;
  const by = {};
  (getDiaryHistory() || []).forEach((e) => {
    if (!e?.date || Date.parse(e.date) < since) return;
    (e.soreness || []).forEach((s) => {
      const part = KEY_TO_PART_LABEL[s.part] || null;
      if (!part || part === '기타') return;
      const o = (by[part] ||= { n: 0, when: new Set() });
      o.n += 1;
      const w = KEY_TO_WHEN_LABEL[s.situation];
      if (w) o.when.add(w);
    });
  });
  return Object.entries(by).sort((a, b) => b[1].n - a[1].n).slice(0, MAX)
    .map(([part, o]) => ({ part, when: [...o.when], whenOther: '' }));
}
