import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { INK, SUB, LINE, BG, box } from './theme';
import { PARTS } from '../lib/mallangReportEngine';
import { GROUP_LABEL, groupsOfPart } from '../lib/bodyGroups';
import { isBmtiCode } from '../lib/bmtiTypes';

// 📈 지표 — 다이어리 기록(지금 바로 되는 것)과 행동 기록(app_events)을 함께 본다.
const GOLD = '#9C6F26';
// 관리자 칭호 — 앱 곳곳에서 닉네임이 정확히 'BMTI'인 계정을 관리자로 본다.
const ADMIN_NICKNAME = 'BMTI';
const monthKey = (d) => String(d).slice(0, 7);
const ymLabel = (m) => `${m.slice(2, 4)}년 ${Number(m.slice(5, 7))}월`;

// 화면 이름을 사람 말로 — App.jsx가 쓰는 값과 짝을 맞춘다.
const SCREEN_LABEL = {
  home: '홈 (첫 화면)',
  quiz: 'BMTI 검사',
  result: '내 유형 결과',
  aichat: '건강 다이어리',
  mypage: '마이페이지',
};
const screenLabel = (k) => SCREEN_LABEL[k] || k;

// 어디서 들어왔는지 — 주소(referrer)를 보고 갈래를 나눈다.
function inflowLabel(ref) {
  const r = String(ref || '').toLowerCase();
  if (!r) return '직접 들어옴 (주소 입력·즐겨찾기·앱)';
  if (/google\.|naver\.|daum\.|bing\.|search|zum\.|duckduckgo/.test(r)) return '검색으로 들어옴';
  if (/instagram|facebook|youtube|threads|twitter|x\.com|tiktok|band\.us|blog\./.test(r)) return 'SNS·블로그에서';
  if (/kakao|talk|open\.kakao/.test(r)) return '카카오톡 공유 링크';
  if (/bmti-official/.test(r)) return '사이트 안에서 이동';
  return '그 밖의 링크';
}

// 기기·브라우저를 짧게 — 오류가 어디서 났는지 알아보기 쉽게.
function deviceLabel(ua) {
  const u = String(ua || '');
  if (!u) return '기기 정보 없음';
  const os = /iPhone|iPad/.test(u) ? '아이폰' : /Android/.test(u) ? '안드로이드'
    : /Macintosh/.test(u) ? '맥' : /Windows/.test(u) ? '윈도우' : '기타 기기';
  const br = /KAKAOTALK/i.test(u) ? '카카오톡 브라우저' : /NAVER|Whale/i.test(u) ? '네이버·웨일'
    : /CriOS|Chrome/.test(u) ? '크롬' : /Safari/.test(u) ? '사파리' : /Edg/.test(u) ? '엣지' : '기타 브라우저';
  return `${os} · ${br}`;
}
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

function Tile({ label, value, sub, tone }) {
  return (
    <div style={{ ...box, flex: '1 1 150px', minWidth: 150 }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: SUB, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: tone || INK, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: SUB, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Bars({ title, rows, total, note }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div style={box}>
      <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>{title}</div>
      {note && <div style={{ fontSize: 11.5, color: SUB, marginBottom: 10 }}>{note}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 8 }}>
        {rows.length === 0 && <div style={{ fontSize: 12.5, color: SUB }}>아직 데이터가 없습니다.</div>}
        {rows.map((r) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 92, flexShrink: 0, fontSize: 12, fontWeight: 700, color: INK, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
            <div style={{ flex: 1, height: 16, background: BG, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${(r.n / max) * 100}%`, height: '100%', background: r.color || GOLD, borderRadius: 999 }} />
            </div>
            <span style={{ width: 62, flexShrink: 0, fontSize: 12, fontWeight: 800, color: SUB, fontVariantNumeric: 'tabular-nums' }}>
              {r.n}{total ? ` · ${pct(r.n, total)}%` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 월별 막대 그래프 — 사업계획서에 그대로 캡처해 붙일 수 있게 값도 함께 적는다.
function TrendChart({ title, note, months, series }) {
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  return (
    <div style={box}>
      <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>{title}</div>
      {note && <div style={{ fontSize: 11.5, color: SUB, marginBottom: 10 }}>{note}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        {series.map((s) => (
          <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: SUB }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color }} />{s.label}
          </span>
        ))}
      </div>
      {months.length === 0 ? (
        <div style={{ fontSize: 12.5, color: SUB }}>아직 데이터가 없습니다.</div>
      ) : (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', overflowX: 'auto', paddingBottom: 4 }}>
          {months.map((m, i) => (
            <div key={m} style={{ flex: '1 0 54px', minWidth: 54, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
                {series.map((s) => (
                  <div key={s.key} title={`${s.label} ${s.values[i]}`}
                    style={{ width: 9, height: Math.max(2, (s.values[i] / max) * 120), background: s.color, borderRadius: '3px 3px 0 0' }} />
                ))}
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums' }}>
                {series[0].values[i]}
              </span>
              <span style={{ fontSize: 10, color: SUB, whiteSpace: 'nowrap' }}>{ymLabel(m)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 누적 꺾은선 — '얼마나 쌓였는지'를 한 줄로 보여 준다.
function CumulativeChart({ title, note, months, series }) {
  const W = 520, H = 150, PAD = 8;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const x = (i) => (months.length < 2 ? W / 2 : PAD + (i * (W - PAD * 2)) / (months.length - 1));
  const y = (v) => H - PAD - (v / max) * (H - PAD * 2);
  return (
    <div style={box}>
      <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>{title}</div>
      {note && <div style={{ fontSize: 11.5, color: SUB, marginBottom: 10 }}>{note}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
        {series.map((s) => (
          <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: SUB }}>
            <span style={{ width: 12, height: 3, borderRadius: 2, background: s.color }} />
            {s.label} <b style={{ color: INK }}>{(s.values[s.values.length - 1] || 0).toLocaleString()}</b>
          </span>
        ))}
      </div>
      {months.length === 0 ? (
        <div style={{ fontSize: 12.5, color: SUB }}>아직 데이터가 없습니다.</div>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 150, display: 'block' }}>
            {series.map((s) => (
              <g key={s.key}>
                <polyline fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
                  points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
                {s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={s.color} />)}
              </g>
            ))}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: SUB, marginTop: 2 }}>
            <span>{ymLabel(months[0])}</span>
            <span>{ymLabel(months[months.length - 1])}</span>
          </div>
        </>
      )}
    </div>
  );
}

// 월별 표를 CSV로 내려받는다 — 지원사업 서류에 증빙으로 붙일 때 쓴다.
function downloadCSV(rows) {
  const cols = ['월', '방문자수', '신규가입', '검사완료', '기록건수', '기록한사람', '누적회원', '누적기록'];
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const body = rows.map((r) => [r.m, r.visitors, r.signups, r.quizDone, r.entries, r.writers, r.cumUsers, r.cumEntries].map(esc).join(','));
  const blob = new Blob(['\ufeff' + cols.map(esc).join(',') + '\n' + body.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `BMTI_월별지표_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function MetricsView() {
  const [diary, setDiary] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [evErr, setEvErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState(0);   // 리텐션 계산 기준 시각
  const [staffIds, setStaffIds] = useState(new Set());
  const [month, setMonth] = useState(monthKey(new Date().toISOString()));

  useEffect(() => {
    let alive = true;
    (async () => {
      const d = await supabase.from('diary_entries').select('user_id,date,soreness');
      const u = await supabase.from('users').select('id,bmti_type,created_at,nickname');
      const e = await supabase.from('app_events').select('anon_id,user_id,name,meta,created_at')
        .order('created_at', { ascending: false }).limit(20000);
      if (!alive) return;
      setLoading(false);
      setLoadedAt(Date.now());
      // 관리자 칭호를 받은 계정(닉네임이 정확히 'BMTI')은 우리 쪽 시험 기록이라 지표에서 뺀다.
      // 앱의 관리자 판별(Navbar·MyPageView·DiaryWriteFlow)과 같은 기준을 쓴다.
      const staff = new Set((u.data || []).filter((x) => String(x.nickname || '').trim() === ADMIN_NICKNAME).map((x) => x.id));
      setStaffIds(staff);
      setDiary((d.data || []).filter((r) => !staff.has(r.user_id)));
      setUsers((u.data || []).filter((x) => !staff.has(x.id)));
      if (e.error) setEvErr(e.error.message); else setEvents((e.data || []).filter((x) => !x.user_id || !staff.has(x.user_id)));
    })();
    return () => { alive = false; };
  }, []);

  const months = useMemo(() => [...new Set(diary.map((r) => monthKey(r.date)))].sort().reverse(), [diary]);

  // ① 다이어리 이용자 3구간
  const seg = useMemo(() => {
    const byUser = {};
    diary.filter((r) => monthKey(r.date) === month).forEach((r) => { (byUser[r.user_id] ||= new Set()).add(r.date); });
    const days = Object.values(byUser).map((s) => s.size);
    return {
      taste: days.filter((n) => n >= 1 && n <= 4).length,
      habit: days.filter((n) => n >= 5 && n <= 14).length,
      settled: days.filter((n) => n >= 15).length,
      total: days.length,
    };
  }, [diary, month]);

  // ② 연속 기록이 끊긴 지점 — 며칠째에 그만두는지
  const streaks = useMemo(() => {
    const byUser = {};
    diary.forEach((r) => { (byUser[r.user_id] ||= []).push(r.date); });
    const lens = [];
    Object.values(byUser).forEach((ds) => {
      const sorted = [...new Set(ds)].sort();
      let run = 1;
      for (let i = 1; i <= sorted.length; i++) {
        const prev = new Date(sorted[i - 1]), cur = sorted[i] ? new Date(sorted[i]) : null;
        if (cur && (cur - prev) / 86400000 === 1) run++;
        else { lens.push(run); run = 1; }
      }
    });
    const bucket = { '1일': 0, '2~3일': 0, '4~6일': 0, '7~13일': 0, '14일+': 0 };
    lens.forEach((n) => {
      if (n === 1) bucket['1일']++; else if (n <= 3) bucket['2~3일']++;
      else if (n <= 6) bucket['4~6일']++; else if (n <= 13) bucket['7~13일']++; else bucket['14일+']++;
    });
    return Object.entries(bucket).map(([label, n]) => ({ label, n }));
  }, [diary]);

  // ③ 부위별 기록 분포 — 콘텐츠를 어느 부위부터 만들지 정하는 근거
  const parts = useMemo(() => {
    const c = {}, g = {};
    diary.forEach((r) => (r.soreness || []).forEach((s) => {
      if (!s?.part) return;
      c[s.part] = (c[s.part] || 0) + 1;
      groupsOfPart(s.part).forEach((gid) => { g[gid] = (g[gid] || 0) + 1; });
    }));
    const sort = (o, lab) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ label: lab(k), n }));
    return { byPart: sort(c, (k) => PARTS[k] || k), byGroup: sort(g, (k) => GROUP_LABEL[k] || k) };
  }, [diary]);

  // ④ 월별 성장 추이 — 지원사업 서류에 붙일 우상향 그래프의 원자료
  const trend = useMemo(() => {
    const all = new Set();
    users.forEach((u) => u.created_at && all.add(monthKey(u.created_at)));
    diary.forEach((r) => r.date && all.add(monthKey(r.date)));
    events.forEach((e) => e.created_at && all.add(monthKey(e.created_at)));
    const ms = [...all].sort().slice(-12);          // 최근 12개월

    const visitorSet = {}, quizSet = {}, writerSet = {};
    events.forEach((e) => {
      const m = monthKey(e.created_at);
      if (e.name === 'session_start') (visitorSet[m] ||= new Set()).add(e.anon_id);
      if (e.name === 'quiz_done') (quizSet[m] ||= new Set()).add(e.anon_id);
    });
    const signups = {}, entries = {};
    users.forEach((u) => { const m = monthKey(u.created_at); signups[m] = (signups[m] || 0) + 1; });
    diary.forEach((r) => {
      const m = monthKey(r.date);
      entries[m] = (entries[m] || 0) + 1;
      (writerSet[m] ||= new Set()).add(r.user_id);
    });

    const rows = ms.reduce((acc, m) => {
      const before = acc[acc.length - 1] || { cumUsers: 0, cumEntries: 0 };
      acc.push({
        m,
        visitors: visitorSet[m]?.size || 0,
        signups: signups[m] || 0,
        quizDone: quizSet[m]?.size || 0,
        entries: entries[m] || 0,
        writers: writerSet[m]?.size || 0,
        cumUsers: before.cumUsers + (signups[m] || 0),
        cumEntries: before.cumEntries + (entries[m] || 0),
      });
      return acc;
    }, []);
    // 이번 달이 지난달보다 얼마나 늘었는지
    const last = rows[rows.length - 1], prev = rows[rows.length - 2];
    const growth = prev && prev.visitors > 0 ? Math.round(((last.visitors - prev.visitors) / prev.visitors) * 100) : null;
    return { months: ms, rows, growth, last };
  }, [users, diary, events]);

  // ⑤ 자가 점검 — 오류로 잡히지 않는 '조용한 이상'을 찾는다
  const health = useMemo(() => {
    const badCode = users.filter((u) => u.bmti_type && !isBmtiCode(u.bmti_type));
    const noNick = users.filter((u) => !String(u.nickname || '').trim());
    const linked = users.filter((u) => u.auth_id).length;
    return { badCode, noNick, linked, total: users.length };
  }, [users]);

  // ⑥ 행동 기록에서 뽑는 것들
  const ev = useMemo(() => {
    const of = (n) => events.filter((e) => e.name === n);
    const uniq = (rows) => new Set(rows.map((r) => r.anon_id)).size;

    // 검사 이탈 — 문항별로 몇 명이 도달했는지
    const reach = {};
    of('quiz_step').forEach((e) => { const st = e.meta?.step; if (st) (reach[st] ||= new Set()).add(e.anon_id); });
    const steps = Object.keys(reach).map(Number).sort((a, b) => a - b);
    const first = steps.length ? reach[steps[0]].size : 0;
    const funnel = steps.map((st) => ({ label: `${st}번 문항`, n: reach[st].size }));

    // 화면별 체류 시간
    const stay = {};
    of('view_leave').forEach((e) => { const s = e.meta?.screen; if (s) (stay[s] ||= []).push(Number(e.meta.sec) || 0); });
    const stayRows = Object.entries(stay).map(([s, arr]) => ({
      label: screenLabel(s), n: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length), cnt: arr.length,
    })).sort((a, b) => b.n - a.n);

    // 재방문 — 첫 기록 이후 7·30일 뒤에도 온 익명 ID 비율
    const firstSeen = {}, lastSeen = {};
    events.forEach((e) => {
      const t = new Date(e.created_at).getTime();
      firstSeen[e.anon_id] = Math.min(firstSeen[e.anon_id] ?? t, t);
      lastSeen[e.anon_id] = Math.max(lastSeen[e.anon_id] ?? t, t);
    });
    const ids = Object.keys(firstSeen);
    const now = loadedAt;
    const eligible = (d) => ids.filter((id) => now - firstSeen[id] >= d * 86400000);
    const retained = (d) => eligible(d).filter((id) => lastSeen[id] - firstSeen[id] >= d * 86400000).length;

    const doneIds = new Set(of('quiz_done').map((e) => e.anon_id));
    const signedIds = new Set(of('signup_done').map((e) => e.anon_id));
    const sharedIds = new Set(of('share_click').map((e) => e.anon_id));

    return {
      sessions: uniq(of('session_start')),
      quizStart: first,
      quizDone: doneIds.size,
      shared: sharedIds.size,
      signed: signedIds.size,
      signedAfterQuiz: [...doneIds].filter((id) => signedIds.has(id)).length,
      funnel, stayRows,
      r7: { n: retained(7), d: eligible(7).length },
      r30: { n: retained(30), d: eligible(30).length },
      errors: of('js_error').slice(0, 12),
      // 오류는 아니지만 '이러면 안 되는데' 싶은 신호
      anomalies: Object.entries(of('anomaly').reduce((m, e) => {
        const k = e.meta?.kind || '알 수 없음'; m[k] = (m[k] || 0) + 1; return m;
      }, {})).sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n })),
      inflow: Object.entries(of('session_start').reduce((m, e) => {
        const k = inflowLabel(e.meta?.ref); m[k] = (m[k] || 0) + 1; return m;
      }, {})).sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n })),
      shareByChannel: Object.entries(of('share_click').reduce((m, e) => {
        const c = e.meta?.channel || '기타'; m[c] = (m[c] || 0) + 1; return m;
      }, {})).sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n })),
    };
  }, [events, loadedAt]);

  if (loading) return <div style={{ ...box, textAlign: 'center', color: SUB, fontSize: 14 }}>불러오는 중…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {evErr && (
        <div style={{ ...box, color: '#B23B36', fontSize: 13, fontWeight: 700 }}>
          행동 기록을 불러오지 못했습니다: {evErr}
          <div style={{ color: SUB, fontWeight: 600, marginTop: 6 }}>
            supabase/sql/02_analytics.sql 을 아직 실행하지 않았다면 먼저 실행해 주세요.
            아래 다이어리 기반 지표는 그대로 보입니다.
          </div>
        </div>
      )}

      {/* 성장 추이 — 지원사업 서류용 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: INK }}>월별 성장 추이</div>
          <div style={{ fontSize: 12, color: SUB }}>최근 12개월 · 지원사업 서류에 그대로 붙일 수 있어요</div>
          <button onClick={() => downloadCSV(trend.rows)} disabled={trend.rows.length === 0}
            style={{ marginLeft: 'auto', padding: '7px 13px', fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit', borderRadius: 8,
              border: 'none', cursor: trend.rows.length ? 'pointer' : 'default', background: trend.rows.length ? GOLD : '#fff',
              color: trend.rows.length ? '#fff' : SUB, boxShadow: trend.rows.length ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
            ⬇ 월별 표 내려받기 (CSV)
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <Tile label="이번 달 방문한 사람" value={(trend.last?.visitors || 0).toLocaleString()}
            sub={trend.growth == null ? '지난달 자료 없음' : `지난달보다 ${trend.growth >= 0 ? '+' : ''}${trend.growth}%`}
            tone={trend.growth != null && trend.growth >= 0 ? '#2F7A4F' : '#B23B36'} />
          <Tile label="지금까지 가입한 사람" value={(trend.last?.cumUsers || 0).toLocaleString()} sub="누적 회원 수" tone={GOLD} />
          <Tile label="지금까지 쌓인 건강 기록" value={(trend.last?.cumEntries || 0).toLocaleString()} sub="누적 다이어리 건수 — 데이터 자산" tone={GOLD} />
          <Tile label="이번 달 기록한 사람" value={(trend.last?.writers || 0).toLocaleString()} sub="한 번이라도 기록한 회원" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14 }}>
          <TrendChart title="달마다 얼마나 왔나" note="막대 위 숫자는 그달 방문한 사람 수입니다"
            months={trend.months}
            series={[
              { key: 'v', label: '방문한 사람', color: GOLD, values: trend.rows.map((r) => r.visitors) },
              { key: 's', label: '새로 가입', color: '#2F7A4F', values: trend.rows.map((r) => r.signups) },
              { key: 'q', label: '검사 마침', color: '#8B7BD8', values: trend.rows.map((r) => r.quizDone) },
              { key: 'e', label: '기록 건수', color: '#D9CDB6', values: trend.rows.map((r) => r.entries) },
            ]} />
          <CumulativeChart title="얼마나 쌓였나" note="계속 우상향해야 하는 선 — 회원과 기록이 얼마나 모였는지"
            months={trend.months}
            series={[
              { key: 'u', label: '누적 회원', color: GOLD, values: trend.rows.map((r) => r.cumUsers) },
              { key: 'e', label: '누적 기록', color: '#2F7A4F', values: trend.rows.map((r) => r.cumEntries) },
            ]} />
        </div>
      </div>

      {/* 행동 기록 기반 */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 900, color: INK, marginBottom: 8 }}>
          방문·검사·공유 <span style={{ fontWeight: 600, color: SUB, fontSize: 12 }}>· 비회원 포함, 익명 ID 기준</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Tile label="방문(사람 수)" value={ev.sessions.toLocaleString()} />
          <Tile label="검사 시작" value={ev.quizStart.toLocaleString()} />
          <Tile label="검사 완료" value={ev.quizDone.toLocaleString()} tone={GOLD}
            sub={ev.quizStart >= ev.quizDone && ev.quizStart > 0 ? `시작의 ${pct(ev.quizDone, ev.quizStart)}%` : '시작 기록이 모자라 비율 생략'} />
          <Tile label="공유 클릭" value={ev.shared.toLocaleString()} sub={`검사 완료의 ${pct(ev.shared, ev.quizDone)}%`} />
          <Tile label="검사 후 가입" value={ev.signedAfterQuiz.toLocaleString()} sub={`검사 완료의 ${pct(ev.signedAfterQuiz, ev.quizDone)}%`} tone="#2F7A4F" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <Bars title="검사 이탈 지점" note="문항별로 여기까지 온 사람 수 — 뚝 떨어지는 지점이 이탈 구간입니다" rows={ev.funnel} total={ev.quizStart} />
        <Bars title="어디서 들어왔나" note="광고 없이 검색·공유로 얼마나 들어오는지 — 지원사업에서 '오가닉 유입'으로 씁니다" rows={ev.inflow} total={ev.sessions} />
        <Bars title="공유 채널" note="공유 버튼을 눌렀을 때 고른 곳" rows={ev.shareByChannel} />
        <div style={box}>
          <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>화면별 평균 체류 시간</div>
          <div style={{ fontSize: 11.5, color: SUB, marginBottom: 10 }}>손님이 각 화면에서 평균 몇 분을 머무는지 · 오른쪽은 잰 횟수</div>
          {ev.stayRows.length === 0 && <div style={{ fontSize: 12.5, color: SUB }}>아직 데이터가 없습니다.</div>}
          {ev.stayRows.map((r) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: INK }}>{r.label}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: GOLD, fontVariantNumeric: 'tabular-nums' }}>{Math.floor(r.n / 60)}분 {r.n % 60}초</span>
              <span style={{ fontSize: 11, color: SUB, width: 46, textAlign: 'right' }}>{r.cnt}회</span>
            </div>
          ))}
        </div>
        <div style={box}>
          <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>재방문(리텐션)</div>
          <div style={{ fontSize: 11.5, color: SUB, marginBottom: 12 }}>첫 방문 뒤에도 다시 온 비율</div>
          {[['7일 뒤', ev.r7], ['30일 뒤', ev.r30]].map(([lb, r]) => (
            <div key={lb} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0' }}>
              <span style={{ width: 60, fontSize: 12.5, fontWeight: 700, color: INK }}>{lb}</span>
              <div style={{ flex: 1, height: 16, background: BG, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${pct(r.n, r.d)}%`, height: '100%', background: GOLD, borderRadius: 999 }} />
              </div>
              <span style={{ width: 86, fontSize: 12, fontWeight: 800, color: SUB, textAlign: 'right' }}>
                {r.d ? `${r.n}/${r.d} · ${pct(r.n, r.d)}%` : '기간 미도래'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 다이어리 기반 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: INK }}>다이어리</div>
        <select value={month} onChange={(e) => setMonth(e.target.value)}
          style={{ padding: '6px 10px', fontSize: 12.5, fontFamily: 'inherit', border: `1px solid ${LINE}`, borderRadius: 8, cursor: 'pointer' }}>
          {(months.length ? months : [month]).map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <Bars
        title="이용 깊이"
        note="맛보기 1~4일 · 습관화 5~14일 · 정착 15일 이상"
        total={seg.total}
        rows={[
          { label: '맛보기', n: seg.taste, color: '#D9CDB6' },
          { label: '습관화', n: seg.habit, color: GOLD },
          { label: '정착', n: seg.settled, color: '#2F7A4F' },
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <Bars title="연속 기록이 끊긴 지점" note="며칠째에 그만두는지 — 알림 시점을 정하는 근거" rows={streaks} />
        <Bars title="부위 묶음별 기록" note="큐레이션·바로카드를 어느 부위부터 만들지" rows={parts.byGroup} />
        <Bars title="부위별 기록" rows={parts.byPart} />
      </div>

      {/* 자가 점검 — 오류로는 안 잡히는 조용한 이상 */}
      <div style={box}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>자가 점검</div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 12, lineHeight: 1.7 }}>
          앱이 멈추지는 않았지만 이상한 값이 들어간 곳을 찾습니다.
          아래 오류 목록은 <b>앱이 멈췄을 때만</b> 쌓이므로, 조용히 잘못 도는 문제는 여기서 봅니다.
        </div>
        {[
          { label: '유형 코드가 이상한 회원', n: health.badCode.length,
            hint: health.badCode.slice(0, 3).map((u) => `${u.nickname || '이름없음'}: ${String(u.bmti_type).slice(0, 24)}`).join(' · ') },
          { label: '닉네임이 비어 있는 회원', n: health.noNick.length, hint: '' },
          { label: '로그인 계정이 아직 안 이어진 회원', n: health.total - health.linked,
            hint: `전체 ${health.total}명 중 ${health.linked}명 이어짐 — 다 이어지면 문을 잠글 수 있어요`, soft: true },
          ...ev.anomalies.map((a) => ({
            label: `이상 신호 · ${a.label === 'auth_hash' ? '주소에 로그인 부스러기' : a.label === 'bad_saved_code' ? '저장된 유형 코드 이상' : a.label}`,
            n: a.n, hint: '' })),
        ].map((r) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: `1px solid ${LINE}` }}>
            <span style={{ flexShrink: 0, width: 18, fontSize: 13 }}>{r.n === 0 ? '✅' : r.soft ? '⏳' : '⚠️'}</span>
            <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: INK }}>
              {r.label}
              {r.hint && <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: SUB, marginTop: 2 }}>{r.hint}</span>}
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: r.n === 0 ? '#2F7A4F' : r.soft ? SUB : '#B23B36' }}>{r.n}</span>
          </div>
        ))}
      </div>

      {/* 오류 */}
      <div style={box}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>손님 화면에서 난 오류</div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 10, lineHeight: 1.7 }}>
          어떤 기기·브라우저에서만 화면이 깨지는 걸 잡습니다. 한 건마다 세 줄이 나옵니다 —
          <b style={{ color: '#B23B36' }}> 빨간 줄</b>은 무엇이 잘못됐는지,
          그 아래는 <b>언제 · 어느 파일 몇째 줄</b>에서,
          맨 아래는 <b>어떤 기기와 브라우저</b>에서 났는지입니다.
          비어 있으면 아무 문제 없다는 뜻이니 그냥 두시면 됩니다.
        </div>
        {ev.errors.length === 0 && <div style={{ fontSize: 12.5, color: SUB }}>보고된 오류가 없습니다. 👍</div>}
        {ev.errors.map((e, i) => (
          <div key={i} style={{ padding: '9px 0', borderBottom: `1px solid ${LINE}`, fontSize: 12 }}>
            <div style={{ color: '#B23B36', fontWeight: 700, wordBreak: 'break-all' }}>{e.meta?.msg || '(내용 없음)'}</div>
            <div style={{ color: SUB, marginTop: 3 }}>
              {new Date(e.created_at).toLocaleString('ko-KR')}에 발생
              {e.meta?.src ? ` · ${e.meta.src} 파일 ${e.meta.line}째 줄` : ''}
            </div>
            {e.meta?.ua && (
              <div style={{ color: SUB, marginTop: 2, fontSize: 11 }}>
                {deviceLabel(e.meta.ua)}
                <span style={{ color: '#C4BCAE' }}> · {String(e.meta.ua).slice(0, 60)}…</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11.5, color: SUB, lineHeight: 1.7, margin: 0 }}>
        회원 {users.length}명 · 다이어리 기록 {diary.length}건 · 행동 기록 {events.length}건(최근 20,000건)
        {staffIds.size > 0 && ` · 관리자 계정 ${staffIds.size}개(닉네임 '${ADMIN_NICKNAME}')는 지표에서 제외했습니다`}
      </p>
    </div>
  );
}
