// 내 BMTI 유형의 편지(10월 판) — 그달이 끝나면 한 통 도착한다.
//
// 아무 때나 열 수 있으면 '이번 달 요약'과 다를 게 없다. 한 달을 다 보낸 뒤에
// 두 가지만 말한다.
//   1) 이번 달은 어땠는지 — 공감하고 되짚는다(기록한 날, 기분, 몸이 보낸 신호, 부담이 몰린 주)
//   2) 다음 달은 어떻게 — 위로하고 북돋는다(버거웠던 곳을 달래고, 작게 해 볼 것 하나씩)
// 문장은 기록에서만 뽑는다. 없는 이야기를 지어내지 않는다.
// 같은 사람·같은 달이면 늘 같은 편지가 나온다(글귀 고르기에 이름·달을 씨앗으로 쓴다).
import { pickBy, toneKey } from './letterVoice';
import { strainTrend } from './strainTrend';

const MOOD_NAME = { 1: '힘들었어요', 2: '지쳤어요', 3: '그냥저냥', 4: '괜찮았어요', 5: '좋았어요' };

// 받침에 따라 조사를 고른다
const has = (w) => { const s = String(w || ''); const c = s.charCodeAt(s.length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
const j = (w, a, b) => `${w}${has(w) ? a : b}`;

/** 편지가 도착했는가 — 그달이 끝난 다음 날(다음 달 1일)부터 */
export function letterArrival(year, month, now = new Date()) {
  const at = new Date(year, month, 1);          // month는 1~12, Date는 0부터라 이게 곧 다음 달 1일
  const left = Math.ceil((at - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
  return { at, open: left <= 0, left: Math.max(0, left) };
}

/**
 * @param entries 그달 기록
 * @param opts { year, month, nickname, bmtiCode, parts: { key: 한글 이름 } }
 * @returns { look: [문장], ahead: [문장], month, next, tone } 또는 기록이 없으면 null
 */
export function buildMonthLetter(entries, { year, month, nickname, bmtiCode, parts = {} }) {
  const days = (entries || []).filter((e) => e && typeof e.mood === 'number')
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (!days.length) return null;
  const nm = nickname || '회원';
  const tk = toneKey(bmtiCode);                 // DZ·DM·QZ·QM
  const warm = tk.endsWith('M');                // 다정(M) / 담백(Z)
  const next = month === 12 ? 1 : month + 1;
  const seed = `${nm}|${year}-${month}|${bmtiCode || ''}`;
  const pick = (salt, list) => pickBy(seed, salt, list);

  // ── 기록에서 뽑는 것 ──
  const n = days.length;
  const moodC = {}; days.forEach((d) => { moodC[d.mood] = (moodC[d.mood] || 0) + 1; });
  const topMood = Number(Object.entries(moodC).sort((a, b) => b[1] - a[1])[0][0]);
  const half = Math.floor(n / 2);
  const avg = (arr) => (arr.length ? arr.reduce((s, d) => s + d.mood, 0) / arr.length : null);
  const early = avg(days.slice(0, half)), late = avg(days.slice(half));
  const turn = n >= 6 && early != null && late != null ? late - early : 0;
  const soreC = {}; days.forEach((d) => (d.soreness || []).forEach((s) => { if (s?.part) soreC[s.part] = (soreC[s.part] || 0) + 1; }));
  const topSoreKey = Object.entries(soreC).sort((a, b) => b[1] - a[1])[0];
  const sorePart = topSoreKey ? (parts[topSoreKey[0]] || topSoreKey[0]) : null;
  const soreN = topSoreKey ? topSoreKey[1] : 0;
  const strain = strainTrend(days, 'weekly');
  const heavyWeek = strain?.top?.label ? `${strain.top.label}차` : null;   // '3주차'
  const moveN = days.filter((d) => d.exercise?.did === true).length;
  const low = topMood <= 2;

  // ── 1) 이번 달은 어땠는지 — 공감 + 되짚기 ──
  const look = [];
  look.push(warm
    ? pick('open', [`${nm}님, ${month}월 한 달 정말 수고 많으셨어요.`, `${nm}님, ${month}월도 무사히 건너오셨네요. 고생 많으셨어요.`])
    : pick('open', [`${nm}님, ${month}월 한 달 고생하셨어요.`, `${month}월이 끝났어요, ${nm}님. 한 달 동안 수고하셨어요.`]));
  look.push(n >= 20 ? `${month}월에는 ${n}일을 기록하셨어요. 거의 매일 스스로를 들여다본 셈이에요.`
    : n >= 10 ? `${month}월에는 ${n}일을 기록하셨어요. 바쁜 와중에도 틈틈이 나를 챙기셨네요.`
      : `${month}월에는 ${n}일을 기록하셨어요. 짧은 기록도 모이면 흐름이 돼요.`);
  look.push(`가장 자주 고른 기분은 '${MOOD_NAME[topMood]}'였어요.`
    + (low ? (warm ? ' 마음이 무거운 날이 많았을 텐데, 그래도 기록을 놓지 않은 게 대단해요.' : ' 버거운 날이 많았지만 기록은 이어졌어요.')
      : topMood === 3 ? ' 크게 흔들리지 않고 잔잔하게 흘러간 달이었어요.'
        : (warm ? ' 웃는 날이 많았던 달이라 저도 덩달아 기뻤어요.' : ' 괜찮은 날이 많았던 달이에요.')));
  if (turn >= 0.5) look.push('특히 월말로 갈수록 기분이 한결 나아졌어요.');
  else if (turn <= -0.5) look.push(warm ? '월말로 갈수록 조금 지쳐 보였어요. 그만큼 애쓰셨다는 뜻이에요.' : '월말로 갈수록 기분이 조금 가라앉았어요.');
  if (sorePart && heavyWeek) look.push(`몸은 ${j(sorePart, '이', '가')} ${soreN}번 신호를 보냈고, ${heavyWeek}에 부담이 가장 많이 쌓였어요.`);
  else if (sorePart) look.push(`몸은 ${j(sorePart, '이', '가')} ${soreN}번 신호를 보냈어요.`);
  else if (heavyWeek) look.push(`${heavyWeek}에 부담이 가장 많이 쌓였어요.`);

  // ── 2) 다음 달은 어떻게 — 위로 + 동기부여 ──
  const ahead = [];
  ahead.push(pick('ahead', [`${next}월에는 이렇게 보내 보면 어떨까요?`, `${next}월을 위해 작은 약속 몇 가지만 남길게요.`]));
  if (low) ahead.push(warm ? '힘든 날이 또 와도 괜찮아요. 그런 날엔 말랑이 하나만 골라도 오늘 할 일을 다 한 거예요.' : '힘든 날엔 기분 하나만 골라도 충분해요.');
  if (heavyWeek) ahead.push(`${heavyWeek}처럼 바쁜 주가 오면, 그 주엔 욕심내지 말고 쉬는 시간을 먼저 적어 두세요.`);
  if (sorePart) ahead.push(`${j(sorePart, '은', '는')} ${next}월에도 조금만 더 아껴 주세요. 하루 한 번, 1분만 풀어 줘도 달라져요.`);
  ahead.push(moveN >= 3 ? `${month}월에 움직인 ${moveN}일이 몸에 좋은 흔적을 남겼어요. 그 리듬을 ${next}월에도 이어 가 봐요.`
    : `${next}월엔 가볍게 걷는 날을 일주일에 두세 번만 넣어 봐요.`);
  ahead.push(n < 10 ? `기록은 일주일에 세 번이면 충분해요. ${next}월 말엔 더 선명한 흐름이 보일 거예요.`
    : `지금처럼만 이어 가면 ${next}월 말엔 몸과 마음의 흐름이 더 또렷하게 보일 거예요.`);
  ahead.push(warm
    ? pick('close', [`${nm}님이 스스로를 돌보는 모습, 제가 늘 곁에서 보고 있을게요.`, `${next}월의 ${nm}님도 제가 옆에서 응원할게요.`])
    : pick('close', [`${next}월 기록에서 또 만나요.`, `${next}월도 한 줄씩, 같이 가 봐요.`]));

  return { look, ahead, month, next, tone: tk };
}

// ── 편지 도착 팝업을 띄울지 ──
// 조건: 로그인 · 지난달에 일기를 한 번이라도 적음 · 이번 달 들어 아직 안 띄움
const SEEN_KEY = (y, m) => `bmti_letter_seen_${y}-${String(m).padStart(2, '0')}`;

/** 지금 띄울 편지가 있나 — { year, month, entries } 또는 null. 지난달 편지다. */
export function letterDue(history, { isLoggedIn, now = new Date() } = {}) {
  if (!isLoggedIn) return null;
  const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const m = now.getMonth() === 0 ? 12 : now.getMonth();
  const pre = `${y}-${String(m).padStart(2, '0')}-`;
  const entries = (history || []).filter((e) => e && String(e.date || '').startsWith(pre));
  if (!entries.length) return null;
  try { if (localStorage.getItem(SEEN_KEY(y, m))) return null; } catch { /* 무시 */ }
  return { year: y, month: m, entries };
}
export function markLetterSeen(year, month) {
  try { localStorage.setItem(SEEN_KEY(year, month), new Date().toISOString()); } catch { /* 무시 */ }
}

