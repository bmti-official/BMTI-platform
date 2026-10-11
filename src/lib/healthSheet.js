// 건강 정보 한 장 — 다이어리에서 미리 채워 올 것을 뽑는다.
//
// 이미 다이어리에 적은 것을 한 장에서 다시 묻지 않는다. 최근 기록에서 자주 불편했던 곳을
// 가져와 채워 두고, 손님은 맞는지만 본다.
import { getDiaryHistory } from './diaryHistory';
import { KEY_TO_PART_LABEL, KEY_TO_WHEN_LABEL } from './diaryEntryLabels';
import { soreSummary, SINCE_LABELS, POSTURE_LABELS, FREQ_LABELS, GOAL_LABELS } from './mallangProfile';

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

// 고르개의 글 앞에 붙은 그림 글자를 뗀다 — '🪑 주로 앉아 있어요' → '주로 앉아 있어요'
const plain = (t) => String(t || '').replace(/^[^\w가-힣]+\s*/, '');

/**
 * 건강 정보 한 장을 몇 줄로 — 강사에게 보내기 전에 회원이 확인하는 자리와, 강사가 받아 보는 자리에서 쓴다.
 * p: { sore, sore_since, common_posture, exercise_frequency, exercise_goals, coach_note }
 * 돌려주는 것: [[이름, 내용], …] — 적지 않은 줄은 뺀다
 */
export function sheetLines(p = {}) {
  const out = [];
  const sore = Array.isArray(p.sore) ? p.sore : [];
  if (sore.length) out.push(['불편한 곳', `${soreSummary(sore)}${SINCE_LABELS[p.sore_since] ? ` · ${SINCE_LABELS[p.sore_since]}` : ''}`]);
  if (p.common_posture) out.push(['자주 하는 자세', plain(POSTURE_LABELS[p.common_posture] || p.common_posture)]);
  if (p.exercise_frequency) out.push(['운동', FREQ_LABELS[p.exercise_frequency] || p.exercise_frequency]);
  const goals = (p.exercise_goals || []).map((g) => plain(GOAL_LABELS[g] || g));
  if (goals.length) out.push(['목적', goals.join(', ')]);
  if (String(p.coach_note || '').trim()) out.push(['미리 알릴 말', String(p.coach_note).trim()]);
  return out;
}
