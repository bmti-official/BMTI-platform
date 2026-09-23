// 각도기록 — 주마다 한 줄. 읽고 쓰고, 지난주·지난달과 견준다.
import { supabase } from './supabaseClient';

/** 그 날이 속한 주의 일요일. 주를 세는 기준을 한 군데로 모은다. */
export function sundayOf(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

const me = () => {
  try { return JSON.parse(localStorage.getItem('bmti_user') || 'null')?.id || null; } catch { return null; }
};

/** 최근 기록을 새 것부터 읽는다. */
export async function recentChecks(weeks = 14) {
  const userId = me();
  if (!userId) return [];
  const { data, error } = await supabase.from('posture_checks')
    .select('*').eq('user_id', userId).order('week', { ascending: false }).limit(weeks);
  return error ? [] : (data || []);
}

/** 이번 주 것을 담는다. 같은 주에 다시 재면 덮어쓴다. */
export async function saveCheck(vals) {
  const userId = me();
  if (!userId) return { ok: false, why: '로그인한 뒤에 잴 수 있어요.' };
  const { error } = await supabase.from('posture_checks').upsert({
    user_id: userId, week: sundayOf(), measured_at: new Date().toISOString(),
    neck_bend: vals.neckBend ?? null, trunk_flex: vals.trunkFlex ?? null, arm_raise: vals.armRaise ?? null,
    quality: vals.quality ?? null, retries: vals.retries ?? 0,
    device: (navigator.userAgent || '').slice(0, 120),
  }, { onConflict: 'user_id,week' });
  return error ? { ok: false, why: '담지 못했어요: ' + error.message } : { ok: true };
}

// 화면에 쓰는 세 항목
export const ITEMS = [
  { key: 'neck_bend', label: '목 숙임', unit: '도', less: '덜 숙였어요', more: '더 숙였어요' },
  { key: 'trunk_flex', label: '허리 굽힘', unit: '도', less: '덜 굽혔어요', more: '더 굽혔어요' },
  { key: 'arm_raise', label: '어깨 들림', unit: '도', less: '덜 올렸어요', more: '더 올렸어요' },
];

// 품질이 낮은 판은 견주지 않는다. 흔들림을 변화로 읽으면 안 된다.
const GOOD = 55;
const usable = (r) => r && (r.quality == null || r.quality >= GOOD);

/** 지난주와 견준다. 값이 없으면 null. */
export function vsLastWeek(rows, key) {
  const ok = rows.filter(usable);
  if (ok.length < 2) return null;
  const a = Number(ok[0][key]), b = Number(ok[1][key]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((a - b) * 10) / 10;
}

/** 이번 달 평균과 지난달 평균을 견준다. 두 달치가 쌓여야 나온다. */
export function vsLastMonth(rows, key, now = new Date()) {
  const month = (w) => w.slice(0, 7);
  const thisM = month(sundayOf(now));
  const prev = new Date(now); prev.setMonth(prev.getMonth() - 1);
  const lastM = month(sundayOf(prev));
  const avg = (m) => {
    const vs = rows.filter((r) => usable(r) && month(r.week) === m)
      .map((r) => Number(r[key])).filter(Number.isFinite);
    return vs.length ? vs.reduce((n, v) => n + v, 0) / vs.length : null;
  };
  const a = avg(thisM), b = avg(lastM);
  if (a == null || b == null) return null;
  return Math.round((a - b) * 10) / 10;
}

/** 꺾은선을 그릴 만큼 쌓였나 — 네 판부터. */
export const TREND_FROM = 4;
export const canTrend = (rows) => rows.filter(usable).length >= TREND_FROM;
