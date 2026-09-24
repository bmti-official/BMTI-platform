// 매일 한마디 — 기록을 마친 그 자리에서 내 파트너가 건네는 말.
//
// 월말 편지와 성격을 가른다.
//   매일  … 두세 문장. 오늘 적은 것만 본다.
//   월말  … 긴 편지. 한 달을 되짚는다.
//
// **오늘 적은 것을 반드시 짚는다.** 범용 응원 문구는 이틀이면 들킨다.
// 기분·잠·불편한 곳·태그·운동 가운데 그날 가장 두드러진 것을 골라 말한다.
import { KEY_TO_PART_LABEL } from './diaryEntryLabels';
import { strainScore, TAG_BY_LABEL } from './diaryTags';

// 받침이 있는지만 보면 '을/를'도 '과/와'도 '이/가'도 같이 풀린다.
// 조사가 틀리면 사람이 쓴 글로 안 읽힌다.
const hasJong = (w) => {
  const c = String(w || '').trim().slice(-1).charCodeAt(0);
  return !Number.isNaN(c) && c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
};
const eul = (w) => `${w}${hasJong(w) ? '을' : '를'}`;
const gwa = (a, b) => `${a}${hasJong(a) ? '과' : '와'} ${b}`;

// 같은 날엔 같은 말이 나오게, 날마다는 달라지게 — 씨앗으로 고른다.
const seedOf = (s) => {
  let n = 0;
  for (let i = 0; i < String(s).length; i += 1) n = (n * 31 + String(s).charCodeAt(i)) % 100000;
  return n;
};
const pick = (arr, seed) => arr[seed % arr.length];

// 기분 0(힘듦) ~ 4(좋음)
const OPEN = {
  z: [
    ['오늘은 버거웠군요.', '고단한 하루였네요.', '쉽지 않은 하루였습니다.'],
    ['지친 하루였네요.', '기운이 빠진 날이었군요.', '힘이 덜 남은 하루였네요.'],
    ['그냥 그런 하루였군요.', '무난한 하루였네요.', '평범하게 지나간 날이었네요.'],
    ['괜찮은 하루였네요.', '나쁘지 않은 하루였군요.', '무리 없이 지나갔네요.'],
    ['좋은 하루였군요.', '기분 좋은 날이었네요.', '잘 지나간 하루입니다.'],
  ],
  m: [
    ['오늘 많이 버거우셨죠.', '고단한 하루였어요.', '오늘은 참 쉽지 않았죠.'],
    ['많이 지치셨겠어요.', '기운이 빠지는 날이었죠.', '힘이 덜 남은 하루였어요.'],
    ['그냥 그런 하루였죠.', '무난하게 지나갔네요.', '평범한 하루였어요.'],
    ['괜찮은 하루였네요.', '나쁘지 않았죠.', '무리 없이 지나갔어요.'],
    ['좋은 하루였어요.', '기분 좋은 날이었네요.', '오늘 참 잘 지나갔어요.'],
  ],
};

const CLOSE = {
  z: ['내일 또 적어 주세요.', '기록은 쌓일수록 보입니다.', '오늘 것도 잘 담아 두었습니다.'],
  m: ['내일도 들러 주세요.', '쌓일수록 보이는 게 많아져요.', '오늘 것도 잘 담아 뒀어요.'],
};

const SLEEP_WORD = {
  z: ['밤을 새우셨군요. 오늘은 일찍 눕는 게 좋겠습니다.', '뒤척인 밤이었네요. 몸이 먼저 압니다.'],
  m: ['밤을 새우셨네요. 오늘은 좀 일찍 누워 보실까요.', '뒤척이셨군요. 몸이 먼저 알더라고요.'],
};

/** 오늘 적은 것 가운데 가장 두드러진 한 가지를 짚는다. */
function gist(e, tone, seed) {
  const z = tone !== 'm';
  const strain = strainScore(e.tags || []);
  const heavy = (e.tags || []).filter((lb) => (TAG_BY_LABEL[lb]?.strain ?? 0) >= 2);
  const parts = (e.soreness?.parts || e.sore || []).map((p) => KEY_TO_PART_LABEL[p?.part || p] || p?.part || p).filter(Boolean);
  const didMove = e.exercise?.did === true;
  const baro = (e.exercise?.types || []).includes('baro') || (e.exercise?.types || []).includes('바로카드');

  // 몸이 먼저 신호를 보낸 날 — 이게 가장 급하다
  if (heavy.length) {
    return z ? `${eul(heavy[0])} 적어 두셨네요. 오늘은 몸이 먼저 신호를 보낸 날입니다.`
      : `${eul(heavy[0])} 적어 두셨네요. 오늘은 몸이 먼저 신호를 보냈나 봐요.`;
  }
  if (parts.length) {
    const p = parts.length > 1 ? gwa(parts[0], parts[1]) : parts[0];
    const last = parts.length > 1 ? parts[1] : parts[0];
    return z ? `${p}${hasJong(last) ? '이' : '가'} 불편했군요. 그 자리는 기억해 두겠습니다.`
      : `${p}${hasJong(last) ? '이' : '가'} 불편하셨죠. 그 자리는 제가 기억해 둘게요.`;
  }
  if (Number(e.sleep) === 0 || Number(e.sleep) === 1) return pick(SLEEP_WORD[z ? 'z' : 'm'], seed);
  if (baro) return z ? '바로카드까지 하셨네요. 오늘 몫은 충분합니다.' : '바로카드까지 하셨네요. 오늘 몫은 충분해요.';
  if (didMove) return z ? '오늘 몸을 움직이셨군요. 그게 제일 어렵습니다.' : '오늘 몸을 움직이셨네요. 그게 제일 어려운데요.';
  if (strain >= 4) return z ? '오늘은 쌓인 게 좀 많았습니다. 내일은 한 칸 덜어 보죠.' : '오늘은 좀 많이 쌓였어요. 내일은 한 칸만 덜어 볼까요.';
  if ((e.tags || []).length) {
    const t = (e.tags || [])[seed % (e.tags || []).length];
    return z ? `${eul(t)} 적어 두셨군요. 며칠 모이면 무엇과 겹치는지 보입니다.`
      : `${eul(t)} 적어 두셨네요. 며칠 모이면 뭐랑 겹치는지 보여요.`;
  }
  return z ? '오늘은 담담한 하루였네요. 그런 날도 기록입니다.' : '오늘은 담담한 하루였네요. 그런 날도 기록이에요.';
}

/** 오늘 한마디 — 두세 문장. */
export function dailyWord(entry, tone = 'z', dateISO = '') {
  const e = entry || {};
  const t = tone === 'm' ? 'm' : 'z';
  const seed = seedOf(`${dateISO}-${t}`);
  const mood = Number.isFinite(Number(e.mood)) ? Math.max(0, Math.min(4, Number(e.mood))) : 2;
  return [
    pick(OPEN[t][mood], seed),
    gist(e, t, seed + 7),
    pick(CLOSE[t], seed + 13),
  ].join('\n');
}
