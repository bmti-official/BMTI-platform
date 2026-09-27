// 내 BMTI 유형의 편지 — A안(문장 은행 조합). 용어집(letterTerms)의 말만 쓴다.
//
// 기록한 날 수로 세 갈래:
//   꾸준한 달(10일~)     4장, 1,200~1,800자 — 인사·성실함 / 마음 흐름·인용 / 몸·부담·잠 / 잘한 것·다음 달 약속·맺음
//   띄엄띄엄 적은 달(5~9) 3장, 800~1,100자
//   잠깐 들른 달(1~4)     2장, 정해 둔 편지
// 같은 사람·같은 달이면 늘 같은 편지(문장 고르기에 이름·달을 씨앗으로 쓴다).
import { pickBy, toneKey } from './letterVoice';
import { strainTrend } from './strainTrend';
import { josa } from './josa';
import {
  MOOD_DAY, MOOD_EMP, PART_KO, SIT_WHEN, TAG_DAY, GOOD_TAGS, EX_KO, WEEK_KO, weekOfDay,
  SEASON, NEXT_TIP, holidayIn, PARTNER_IN_TEXT, QUOTE_BLOCK, lateNight, PART_CARE, WEEKDAY_KO,
} from './letterTerms';

const dayNum = (iso) => Number(String(iso).slice(8, 10));
const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0] || null;
const avg = (arr) => (arr.length ? arr.reduce((s, d) => s + d.mood, 0) / arr.length : null);

/** 인용할 한 줄 — 괜찮았어요·좋았어요인 날, 첫 문장 5~40자, 민감한 말 없는 것 */
export function pickQuote(days) {
  const cand = days.filter((d) => d.mood >= 4 && d.note?.text)
    .map((d) => {
      const first = String(d.note.text).trim().split(/(?<=[.!?。])\s|\n/)[0].trim().replace(/[.。]+$/, '');
      return { d, text: first };
    })
    .filter(({ text }) => text.length >= 5 && text.length <= 40 && !QUOTE_BLOCK.some((w) => text.includes(w)));
  cand.sort((a, b) => (b.d.mood - a.d.mood) || (a.text.length - b.text.length) || String(b.d.date).localeCompare(String(a.d.date)));
  return cand[0] || null;
}

/** 편지 재료 — 기록에서 뽑은 사실만 */
function facts(entries, year, month) {
  const days = (entries || []).filter((e) => e && typeof e.mood === 'number')
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const n = days.length;
  // 주마다 며칠
  const perWeek = [0, 0, 0, 0, 0];
  days.forEach((d) => { perWeek[weekOfDay(dayNum(d.date))] += 1; });
  const bestW = perWeek.reduce((b, v, i) => (v >= perWeek[b] ? i : b), 0);
  // 가장 긴 연속
  let streak = 0, run = 0, prev = null;
  days.forEach((d) => {
    const cur = new Date(`${d.date}T00:00:00`);
    run = prev && (cur - prev) / 864e5 === 1 ? run + 1 : 1;
    streak = Math.max(streak, run); prev = cur;
  });
  // 기분 — 월초(1~10) · 중순(11~20) · 월말(21~)
  const early = avg(days.filter((d) => dayNum(d.date) <= 10));
  const mid = avg(days.filter((d) => dayNum(d.date) > 10 && dayNum(d.date) <= 20));
  const late = avg(days.filter((d) => dayNum(d.date) > 20));
  const moodC = {}; days.forEach((d) => { moodC[d.mood] = (moodC[d.mood] || 0) + 1; });
  const topMood = Number((top(moodC) || [3])[0]);
  // 몸
  const partC = {}, sitC = {};
  days.forEach((d) => (d.soreness || []).forEach((s) => {
    if (!s?.part) return;
    partC[s.part] = (partC[s.part] || 0) + 1;
    if (s.situation && SIT_WHEN[s.situation]) sitC[s.situation] = (sitC[s.situation] || 0) + 1;
  }));
  const parts = Object.entries(partC).sort((a, b) => b[1] - a[1]);
  const topSit = top(sitC);
  // 부담이 가장 몰린 주 + 그 주에 잦았던 태그
  const st = strainTrend(days, 'weekly');
  let heavy = null;
  if (st?.top && st.top.strain > 0) {
    const wi = Number(String(st.top.key).replace('w', ''));
    const tagC = {};
    days.filter((d) => weekOfDay(dayNum(d.date)) === wi).forEach((d) => (d.tags || []).forEach((t) => {
      if (TAG_DAY[t] && !GOOD_TAGS.includes(t)) tagC[t] = (tagC[t] || 0) + 1;
    }));
    heavy = { week: WEEK_KO[Math.min(4, wi)], tags: Object.entries(tagC).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => TAG_DAY[t]) };
  }
  // 잠
  const lateN = days.filter((d) => lateNight(d.sleepTime) === true).length;
  const goodSleep = days.filter((d) => d.sleep === 3).length;
  const badSleep = days.filter((d) => d.sleep === 0 || d.sleep === 1).length;
  // 움직임
  const moved = days.filter((d) => d.exercise?.did);
  const exC = {}; moved.forEach((d) => (d.exercise.types || []).forEach((t) => { if (EX_KO[t]) exC[t] = (exC[t] || 0) + 1; }));
  const topEx = top(exC);
  // 잘 챙긴 것
  const goodTag = {}; days.forEach((d) => (d.tags || []).forEach((t) => { if (GOOD_TAGS.includes(t)) goodTag[t] = (goodTag[t] || 0) + 1; }));
  // 명절
  const hol = holidayIn(year, month);
  const holWrote = hol ? days.some((d) => hol.days.includes(d.date)) : false;
  // 좋은 날·무거운 날 수, 가장 좋았던 날, 요일마다 기분, 한 달 내내 잦았던 태그
  const upN = days.filter((d) => d.mood >= 4).length;
  const downN = days.filter((d) => d.mood <= 2).length;
  const bestDay = [...days].sort((a, b) => (b.mood - a.mood) || String(b.date).localeCompare(String(a.date)))[0];
  const wd = {}; days.forEach((d) => { const w = new Date(`${d.date}T00:00:00`).getDay(); (wd[w] ||= []).push(d.mood); });
  const wdAvg = Object.entries(wd).filter(([, v]) => v.length >= 2).map(([w, v]) => ({ w: Number(w), a: v.reduce((x, y) => x + y, 0) / v.length }));
  const lowWd = wdAvg.length >= 3 ? wdAvg.sort((a, b) => a.a - b.a)[0] : null;
  const allTag = {}; days.forEach((d) => (d.tags || []).forEach((t) => { if (TAG_DAY[t] && !GOOD_TAGS.includes(t)) allTag[t] = (allTag[t] || 0) + 1; }));
  const topTag = top(allTag);
  return { days, n, perWeek, bestW, streak, early, mid, late, topMood, parts, topSit, heavy, lateN, goodSleep, badSleep,
    moveN: moved.length, topEx: topEx ? EX_KO[topEx[0]] : null, goodTag, hol, holWrote, quote: pickQuote(days),
    upN, downN, bestDay, lowWd, topTag: topTag && topTag[1] >= 3 ? { day: TAG_DAY[topTag[0]], c: topTag[1] } : null,
    first: days[0].date, last: days[days.length - 1].date };
}

const md = (iso) => { const [, mm, dd] = String(iso).split('-'); return `${Number(mm)}월 ${Number(dd)}일`; };
// 인용 조사 — 받침이 있으면 '이라고'
// 받침이 있으면 '이었', 없으면 '였' — '8월 30일이었지요', '9월 2일이었어요'
const was = (w) => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0 ? '이었' : '였'; };
const quoteJ = (t) => { const c = String(t).charCodeAt(String(t).length - 1); const has = c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; return has ? '이라고' : '라고'; };

/**
 * @returns { tier, pages: [문단…], month, next, sign } 또는 null(기록 없음)
 *   sign: 서명 줄 — 마지막 장 아래에 따로 붙인다
 */
export function buildLetterA(entries, { year, month, nickname, bmtiCode, partnerName = '말랑이' }) {
  const F = facts(entries, year, month);
  if (!F.n) return null;
  const tk = toneKey(bmtiCode);
  const m = tk.endsWith('M');           // 다정
  const q = tk.startsWith('Q');         // 궁금파 — 장마다 물음을 한 번 섞는다
  const nm = nickname || '회원';
  const next = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const axis = String(bmtiCode || '').split('-')[0].toUpperCase();
  const pn = PARTNER_IN_TEXT[axis] || partnerName;       // 문장 속 파트너 이름
  const seed = `${nm}|${year}-${month}|${bmtiCode || ''}`;
  const pick = (salt, list) => pickBy(seed, salt, list);
  const sign = `— 당신의 BMTI 유형, ${partnerName} 드림`;
  const tier = F.n >= 10 ? 'full' : F.n >= 5 ? 'sparse' : 'visit';
  const M = (a, b) => (m ? a : b);      // 다정 / 담백

  // ── 공통 조각 ──
  const greet = () => {
    const out = [];
    if (F.hol) {
      out.push(M(`${F.hol.name} 연휴는 편히 보내셨지요. 오가는 길이 고단하진 않으셨는지요.`, `${F.hol.name} 연휴가 있던 달이었어요.`));
      if (F.holWrote) out.push(M('연휴에도 잊지 않고 적어 주셨더라고요.', '연휴에도 기록을 남기셨어요.'));
    } else out.push(SEASON[m ? 'm' : 'z'][month]);
    return out.join(' ');
  };
  const quoteLine = () => {
    if (!F.quote) return '';
    const t = F.quote.text;
    return M(`${md(F.quote.d.date)}에는 '${t}'${quoteJ(t)} 적으셨지요. 짧은 한 줄인데도 그날의 표정이 보이는 것 같아 오래 마음에 남더라고요.`,
      `${md(F.quote.d.date)}에 '${t}'${quoteJ(t)} 적으셨어요. 그날의 기록이 선명하게 남아 있어요.`);
  };
  const nextHol = holidayIn(nextYear, next);
  const nextLine = () => (nextHol
    ? M(`다음 달엔 ${nextHol.name}이 있어요. 오래 앉아 있게 되는 날이 많을 테니, 틈틈이 일어나 몸을 펴 주세요.`,
      `다음 달엔 ${nextHol.name} 연휴가 있어요. 오래 앉아 있을 때 틈틈이 일어나세요.`)
    : NEXT_TIP(next));
  const moodFlow = (a, b) => {
    if (a == null || b == null) return '';
    const d = b - a;
    if (d >= 0.5) return M('달이 흘러갈수록 마음이 한결 가벼워졌어요.', '뒤로 갈수록 기분이 나아졌어요.');
    if (d <= -0.5) return M('뒤로 갈수록 조금 지치셨던 것 같아요. 그만큼 애쓰셨다는 뜻이겠지요.', '뒤로 갈수록 기분이 조금 가라앉았어요.');
    return M('한 달 내내 마음이 고르게 이어졌어요.', '기분은 한 달 내내 고르게 이어졌어요.');
  };
  const topPart = F.parts[0] ? { key: F.parts[0][0], ko: PART_KO[F.parts[0][0]] || '다른 곳', c: F.parts[0][1] } : null;
  const qLine = (salt, list) => (q ? pick(salt, list) : '');
  // 주마다 며칠 — '첫째 주 3일, 둘째 주 5일, …'
  const weekList = F.perWeek.map((c, i) => (c ? `${WEEK_KO[i]} ${c}일` : null)).filter(Boolean).join(', ');
  // 기분 다섯 가지가 각각 며칠 — 많은 순
  const moodList = [5, 4, 3, 2, 1].map((v) => ({ v, c: F.days.filter((d) => d.mood === v).length }))
    .filter((x) => x.c).sort((a, b) => b.c - a.c).map((x) => `${MOOD_DAY[x.v]} ${x.c}일`).join(', ');
  // 월초·월말의 대표 기분(가장 많이 고른 것)
  const modeOf = (arr) => { const c = {}; arr.forEach((d) => { c[d.mood] = (c[d.mood] || 0) + 1; }); const t = top(c); return t ? Number(t[0]) : null; };
  const earlyMood = modeOf(F.days.filter((d) => dayNum(d.date) <= 10));
  const lateMood = modeOf(F.days.filter((d) => dayNum(d.date) > 20));
  // 주로 잠든 시간 — 적은 날이 셋 이상일 때
  const sleepTimes = F.days.map((d) => d.sleepTime).filter(Boolean);
  const lateShare = sleepTimes.length >= 3 ? sleepTimes.filter((t) => lateNight(t) === true).length / sleepTimes.length : null;

  // ── 잠깐 들른 달(1~4일) — 정해 둔 편지 ──
  if (tier === 'visit') {
    const lastMood = F.days[F.days.length - 1].mood;
    const p1 = [greet(),
      M(`${nm}님, ${month}월에는 ${F.n}일을 적어 주셨어요. 바쁜 한 달 사이에 잠깐이라도 들러 주신 게 참 반가웠어요.`,
        `${nm}님, ${month}월에는 ${F.n}일을 적으셨어요. 짧게라도 들러 주셔서 반가웠습니다.`),
      M(`처음 적으신 날은 ${md(F.first)}${was(md(F.first))}지요. 그날 문을 열어 주신 덕분에 이렇게 편지를 쓸 수 있게 되었어요.`,
        `처음 적은 날은 ${md(F.first)}${was(md(F.first))}어요.`),
      M(`기록이 많지 않아도 괜찮아요. 적어 주신 ${F.n}일 덕분에 ${month}월의 ${nm}님을 조금은 알게 되었거든요.`,
        `기록이 적어도 괜찮아요. ${F.n}일의 기록으로도 ${month}월의 모습이 조금은 보였어요.`),
      `마지막으로 적으신 날은 ${MOOD_DAY[lastMood]}이었어요. ${MOOD_EMP[m ? 'm' : 'z'][lastMood]}`,
      M(`적어 주신 날들을 모아 보면 ${moodList}이었어요. 짧은 기록 속에서도 그날그날의 ${nm}님이 보였어요.`,
        `적은 날의 기분은 ${moodList}이었어요. 기록이 적어도 편지는 이렇게 도착합니다. 더 적은 달엔 더 자세한 편지를 드릴게요.`),
      quoteLine()];
    const p2 = [
      M(`${next}월엔 이렇게 시작해 보면 어떨까요? 긴 글이 부담스러우면 말랑이 하나만 골라도 충분해요. 그것만으로도 그날의 ${nm}님이 남으니까요.`,
        `${next}월엔 가볍게 시작해 보세요. 말랑이 하나만 골라도 기록이 됩니다.`),
      M(`일주일에 세 번만 들러 주시면, ${next}월 말엔 ${nm}님의 몸과 마음이 어떤 흐름으로 움직이는지 처음으로 보여 드릴 수 있어요. 어느 요일에 지치는지, 어느 주에 몸이 무거운지 같은 것들이요.`,
        `일주일에 세 번이면 충분해요. ${next}월 말엔 어느 요일에 지치는지, 어느 주에 몸이 무거운지 같은 흐름을 처음으로 보여 드릴 수 있어요.`),
      M('처음엔 기분만 골라도 좋아요. 조금 익숙해지면 불편한 곳과 잠든 시간까지 적어 보세요. 그러면 몸이 무거운 날들의 공통점이 조금씩 보이기 시작해요.',
        '처음엔 기분만 고르고, 익숙해지면 불편한 곳과 잠든 시간까지 적어 보세요. 몸이 무거운 날들의 공통점이 보이기 시작합니다.'),
      M('주간 알림을 켜 두시면, 그 주에 아직 안 적었을 때만 한 번 살짝 알려 드릴게요.', '주간 알림을 켜 두면 그 주에 안 적었을 때만 한 번 알려 드려요.'),
      nextLine(),
      M('저는 늘 여기서 기다리고 있을게요. 생각날 때 편하게 들러 주세요.', `${next}월 기록에서 만나요.`)];
    return { tier, month, next, sign, pages: [p1, p2].map((p) => p.filter(Boolean).join(' ')) };
  }

  // ── 1장: 인사 + 성실함 ──
  const p1 = [greet()];
  p1.push(M(`${nm}님, ${month}월에는 ${F.n}일을 적어 주셨어요.`, `${nm}님, ${month}월에는 ${F.n}일을 적으셨어요.`));
  p1.push(M(`처음 적으신 날은 ${md(F.first)}, 마지막으로 적으신 날은 ${md(F.last)}${was(md(F.last))}지요.`, `처음은 ${md(F.first)}, 마지막은 ${md(F.last)}${was(md(F.last))}어요.`));
  p1.push(M(`주마다 보면 ${weekList}이었어요.`, `주마다 보면 ${weekList}이었어요.`));
  if (tier === 'full') {
    p1.push(M(`그중에서도 ${WEEK_KO[F.bestW]}에는 ${F.perWeek[F.bestW]}일을 적으셨더라고요. 가장 꾸준했던 한 주였어요.`,
      `${WEEK_KO[F.bestW]}에 ${F.perWeek[F.bestW]}일로 가장 꾸준했어요.`));
    if (F.streak >= 3) p1.push(M(`${F.streak}일 연속으로 이어 적은 때도 있었지요. 마음먹는다고 쉽게 되는 일이 아니에요.`, `${F.streak}일 연속으로 적은 때도 있었어요.`));
  }
  p1.push(pick('p1c', m ? [
    '하루를 돌아보는 그 몇 분이 모여 한 달이 되었어요. 바쁜 와중에도 스스로를 챙긴 시간이라고 생각하면 참 든든하지요.',
    '기록은 결국 나를 한 번 더 바라봐 주는 일이에요. 그 일을 한 달 동안 해내셨어요.',
    '매일 같은 자리에 들러 하루를 남긴다는 게 생각보다 어려운 일이에요. 그래서 이 숫자가 더 반가웠어요.',
  ] : [
    '하루를 돌아본 시간이 모여 한 달이 되었어요. 스스로를 챙긴 시간입니다.',
    '적어 둔 날들이 모여 한 달의 흐름이 보이기 시작했어요. 기록이 있어야 보이는 것들이에요.',
    '짧은 기록이라도 쌓이면 흐름이 됩니다. 그 흐름이 이번 달에 제법 선명해졌어요.',
  ]));
  p1.push(qLine('p1q', ['기록을 이어 온 힘은 어디서 나왔을까요?', '어떤 날에 더 적고 싶어지셨나요?']));
  p1.push(M(`이번 편지에는 그 ${F.n}일 동안 ${nm}님이 지나온 길을 제가 옆에서 본 대로 적어 볼게요. 천천히 넘겨 보세요.`,
    `${F.n}일의 기록으로 ${month}월을 차례로 짚어 볼게요.`));

  // ── 2장: 마음의 흐름 + 인용 ──
  const p2 = [];
  if (tier === 'full') {
    const flow = [F.early, F.mid, F.late].filter((x) => x != null);
    p2.push(M(`${month}월의 마음을 따라가 보면,`, `${month}월의 기분은 이렇게 흘렀어요.`));
    p2.push(moodFlow(flow[0], flow[flow.length - 1]));
    if (F.mid != null && F.early != null && F.late != null && F.mid < F.early - 0.4 && F.mid < F.late - 0.4) {
      p2.push(M('중순쯤 한 번 크게 가라앉았다가 다시 올라오셨지요. 그 고비를 스스로 넘기셨어요.', '중순에 한 번 가라앉았다가 다시 올라왔어요.'));
    }
  } else {
    p2.push(moodFlow(avg(F.days.slice(0, Math.ceil(F.n / 2))), avg(F.days.slice(Math.ceil(F.n / 2)))));
  }
  if (earlyMood && lateMood && earlyMood !== lateMood) p2.push(M(`월초엔 ${MOOD_DAY[earlyMood]}이 많았고, 월말엔 ${MOOD_DAY[lateMood]}이 많았어요.`,
    `월초엔 ${MOOD_DAY[earlyMood]}, 월말엔 ${MOOD_DAY[lateMood]}이 많았어요.`));
  p2.push(M(`가장 자주 고르신 기분은 '${MOOD_DAY[F.topMood]}'이었어요. ${MOOD_EMP.m[F.topMood]}`,
    `가장 자주 고른 기분은 '${MOOD_DAY[F.topMood]}'이었어요. ${MOOD_EMP.z[F.topMood]}`));
  if (F.upN && F.downN) p2.push(M(`괜찮거나 좋은 날이 ${F.upN}일, 지치거나 마음이 무거웠던 날이 ${F.downN}일이었어요.`,
    `괜찮거나 좋은 날 ${F.upN}일, 지치거나 무거웠던 날 ${F.downN}일이었어요.`));
  else if (F.upN) p2.push(M(`지치거나 마음이 무거웠던 날 없이, 괜찮거나 좋은 날이 ${F.upN}일이었어요.`, `무거웠던 날 없이 괜찮거나 좋은 날이 ${F.upN}일이었어요.`));
  if (!m) p2.push(`하나씩 보면 ${moodList}이었어요.`);
  if (F.bestDay && F.bestDay.mood >= 4) p2.push(M(`그중 가장 마음이 밝았던 날은 ${md(F.bestDay.date)}${was(md(F.bestDay.date))}어요.`, `가장 기분이 좋았던 날은 ${md(F.bestDay.date)}${was(md(F.bestDay.date))}어요.`));
  if (tier === 'full' && F.lowWd) p2.push(M(`${WEEKDAY_KO[F.lowWd.w]}요일마다 조금 더 지쳐 보이셨어요. 한 주의 무게가 그날 몰렸던 걸까요.`,
    `${WEEKDAY_KO[F.lowWd.w]}요일에 기분이 가장 낮았어요.`));
  p2.push(qLine('p2q', ['그 기분들 사이에는 어떤 하루들이 있었을까요?', '기분이 가벼웠던 날엔 무엇이 달랐을까요?']));
  p2.push(quoteLine());
  p2.push(pick('p2c', m ? [
    '좋았던 날의 한 줄은 힘든 날 다시 꺼내 볼 수 있는 작은 선물이 되기도 해요. 마음은 날마다 달라도 괜찮아요.',
    '마음은 날마다 달라도 괜찮아요. 그걸 알아채고 적어 둔 것만으로 충분해요.',
    '기분이 오르내리는 건 자연스러운 일이에요. 그 모든 날을 지나온 게 대단한 거예요.',
  ] : [
    '기분은 날마다 달라도 괜찮아요. 알아채고 적어 둔 것이 중요합니다.',
    '좋았던 날의 기록은 다음 달의 힘이 됩니다. 힘든 날 다시 꺼내 보세요.',
    '오르내림을 알아챈 것만으로 충분해요. 그게 흐름을 바꾸는 시작입니다.',
  ]));

  // ── 3장: 몸이 보낸 신호 · 부담 · 잠 ──
  const p3 = [];
  if (topPart) {
    p3.push(M(`몸은 ${josa(topPart.ko, '이')} 가장 자주 신호를 보냈어요. 한 달 동안 ${topPart.c}번이었지요.`,
      `몸은 ${josa(topPart.ko, '이')} ${topPart.c}번으로 가장 자주 신호를 보냈어요.`));
    if (F.topSit) p3.push(M(`특히 ${SIT_WHEN[F.topSit[0]]} 자주 무거워졌더라고요.`, `주로 ${SIT_WHEN[F.topSit[0]]} 무거웠어요.`));
    if (tier === 'full' && F.parts[1]) p3.push(M(`그다음으로는 ${josa(PART_KO[F.parts[1][0]] || '다른 곳', '이')} ${F.parts[1][1]}번 뻐근했어요.`,
      `다음은 ${PART_KO[F.parts[1][0]] || '다른 곳'} ${F.parts[1][1]}번이었어요.`));
  } else {
    p3.push(M(`${month}월엔 몸이 불편하다고 적으신 날이 없었어요. 참 다행이에요.`, `${month}월엔 불편한 곳 기록이 없었어요.`));
  }
  if (F.topTag) p3.push(M(`한 달 동안 가장 자주 겹친 날은 '${F.topTag.day}'로, ${F.topTag.c}번이었어요.`, `가장 잦았던 건 '${F.topTag.day}'로 ${F.topTag.c}번이었어요.`));
  if (tier === 'full' && F.heavy) {
    const tags = F.heavy.tags;
    p3.push(tags.length
      ? M(`${F.heavy.week}에 부담이 가장 몰렸어요. 그 주엔 ${tags.join('과 ')}이 겹쳤지요.`, `${F.heavy.week}에 부담이 가장 몰렸어요. ${tags.join('과 ')}이 겹친 주였어요.`)
      : M(`${F.heavy.week}에 부담이 가장 몰렸어요. 유난히 바쁜 한 주였지요.`, `${F.heavy.week}에 부담이 가장 몰렸어요.`));
  }
  if (tier === 'full') {
    if (F.lateN >= 3) p3.push(M(`자정을 넘겨 잠든 밤도 ${F.lateN}번 있었어요. 하루가 길었던 날이 많았나 봐요.`, `자정을 넘겨 잠든 밤이 ${F.lateN}번 있었어요.`));
    if (F.goodSleep >= 3) p3.push(M(`그래도 푹 잔 밤이 ${F.goodSleep}번 있었지요. 그런 밤이 몸을 다시 세워 줘요.`, `푹 잔 밤은 ${F.goodSleep}번이었어요.`));
    else if (F.badSleep >= 3) p3.push(M(`뒤척인 밤이 ${F.badSleep}번 있었어요. 잠이 얕았던 날엔 몸도 더 무거웠을 거예요.`, `뒤척인 밤이 ${F.badSleep}번이었어요.`));
  }
  // 자정을 넘긴 밤을 이미 짚었으면 '그래도 대체로는'으로 잇는다(두 문장이 부딪치지 않게)
  const saidLate = tier === 'full' && F.lateN >= 3;
  if (lateShare != null) p3.push(lateShare >= 0.5
    ? M('대체로 자정을 넘겨 잠드셨어요. 하루를 마무리하는 시간이 늦어진 달이었어요.', '대체로 자정을 넘겨 잠들었어요.')
    : saidLate
      ? M('그래도 대체로는 자정 전에 잠드셨어요. 잠드는 시간이 크게 흐트러지진 않았어요.', '그래도 대체로는 자정 전에 잠들었어요.')
      : M('대체로 자정 전에 잠드셨어요. 잠드는 시간이 크게 흐트러지지 않았어요.', '대체로 자정 전에 잠들었어요. 잠드는 시간은 고르게 지켜졌어요.'));
  p3.push(qLine('p3q', ['몸이 무거웠던 날들에는 어떤 공통점이 있었을까요?', '그 신호들은 어떤 날에 모였을까요?']));
  p3.push(pick('p3c', m ? [
    '몸이 보내는 신호는 탓하라는 게 아니라 알아 달라는 말이에요. 적어 두신 것만으로 이미 알아주신 거예요.',
    '무거웠던 날을 적어 둔 덕분에, 다음 달엔 미리 챙길 수 있어요. 기록이 몸을 지키는 방법이 되는 거지요.',
  ] : [
    '신호를 적어 둔 덕분에 다음 달엔 미리 챙길 수 있어요.',
    '몸의 신호는 알아채는 것부터가 시작이에요. 이번 달엔 그걸 해내셨어요.',
  ]));
  if (topPart && PART_CARE[topPart.key]) p3.push(M(`${josa(topPart.ko, '이')} 무거운 날엔, ${PART_CARE[topPart.key]}.`, `${josa(topPart.ko, '이')} 무거운 날엔 ${PART_CARE[topPart.key]}.`));

  // ── 잘한 것 · 약속 ──
  const good = [];
  if (F.streak >= 3) good.push(`${F.streak}일 연속으로 적으신 것`);
  if (F.moveN >= 3) good.push(F.topEx ? `${josa(F.topEx, '을')} 포함해 ${F.moveN}일을 움직이신 것` : `${F.moveN}일을 움직이신 것`);
  const gt = top(F.goodTag);
  if (gt) good.push(`${TAG_DAY[gt[0]].replace(/ 날$/, '')} 날이 ${gt[1]}번 있었던 것`);
  if (F.goodSleep >= 3) good.push(`푹 잔 밤을 ${F.goodSleep}번 만드신 것`);
  if (F.upN >= 3) good.push(`괜찮은 날을 ${F.upN}일 만드신 것`);
  if (good.length < 3) good.push(`${F.n}일을 적으신 것`);
  const promises = [];
  if (topPart) promises.push(`${josa(topPart.ko, '이')} 무거운 날엔 1분만 풀어 주기`);
  if (F.heavy) promises.push('바쁜 주가 오면 쉬는 시간부터 먼저 적어 두기');
  if (F.lateN >= 3) promises.push('일주일에 이틀은 자정 전에 눕기');
  if (F.moveN < 3) promises.push('가볍게 걷는 날 두세 번 넣기');
  promises.push('기록은 일주일에 세 번이면 충분하다고 여기기');

  // ── 띄엄띄엄 적은 달 — 3장 끝에 약속과 맺음 ──
  if (tier === 'sparse') {
    p3.push(nextLine());
    p3.push(M(`${next}월엔 두 가지만 약속해요. ${promises[0]}, 그리고 ${promises[1]}.`, `${next}월엔 두 가지만 해 보세요. ${promises[0]}, ${promises[1]}.`));
    p3.push(M(`기록이 조금만 더 쌓이면, 다음 편지엔 ${nm}님만의 흐름을 더 자세히 적어 드릴 수 있어요. ${next}월에도 ${josa(pn, '이')} 곁에서 응원할게요.`,
      `기록이 조금 더 쌓이면 다음 편지엔 흐름을 더 자세히 알려 드릴게요. ${next}월 기록에서 만나요.`));
    return { tier, month, next, sign, pages: [p1, p2, p3].map((p) => p.filter(Boolean).join(' ')) };
  }

  // ── 4장: 잘해 낸 것 · 다음 달 · 약속 · 맺음 ──
  const p4 = [];
  p4.push(M(`${month}월에 ${nm}님이 잘해 낸 것을 세 가지만 꼽아 볼게요.`, `${month}월에 잘한 것 세 가지예요.`));
  p4.push(good.slice(0, 3).map((g, i) => `${['첫째', '둘째', '셋째'][i]}, ${g}.`).join(' '));
  p4.push(M('작아 보여도 이런 것들이 쌓여 몸의 흐름을 바꿔요. 스스로에게 칭찬 한마디 건네 주셨으면 해요.', '작은 것들이 쌓여 흐름이 바뀝니다.'));
  p4.push(nextLine());
  p4.push(M(`그래서 ${next}월엔 이렇게 해 보면 어떨까요.`, `${next}월엔 이렇게 해 보세요.`));
  p4.push(promises.slice(0, 3).map((x, i) => `${['하나', '둘', '셋'][i]}, ${x}.`).join(' '));
  p4.push(qLine('p4q', ['셋 중에 가장 먼저 해 보고 싶은 건 무엇인가요?', `${next}월의 첫 주엔 무엇부터 해 볼까요?`]));
  p4.push(M(`${next}월의 첫 주엔 셋 중 하나만 골라 시작해 보세요.`, `${next}월 첫 주엔 셋 중 하나만 골라 시작해 보세요. 한 주가 지나면 두 번째를 더해 보세요.`));
  p4.push(pick('p4c', m ? [
    `다 지키지 못해도 괜찮아요. 하나만 해도 ${next}월의 ${nm}님은 조금 더 가벼울 거예요.`,
    '욕심내지 않아도 돼요. 생각날 때 하나씩만 해 보세요. 그걸로 충분해요.',
  ] : [
    '다 하지 않아도 됩니다. 하나씩이면 충분해요.',
    '생각날 때 하나만 해 보세요. 그걸로 충분합니다.',
  ]));
  p4.push(M(`${month}월 한 달, 정말 수고 많으셨어요. 편지를 다 읽으셨다면 오늘은 어깨를 한 번 크게 돌려 보세요. ${next}월에도 제가 곁에서 응원할게요.`,
    `${month}월 한 달, 수고하셨어요. 오늘은 어깨를 한 번 크게 돌려 보세요. ${next}월 기록에서 만나요.`));
  return { tier, month, next, sign, pages: [p1, p2, p3, p4].map((p) => p.filter(Boolean).join(' ')) };
}
