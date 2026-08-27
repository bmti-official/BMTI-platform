import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { INK, SUB, LINE, BG, box } from './theme';
import { PARTS } from '../lib/mallangReportEngine';
import { GROUP_LABEL, groupsOfPart } from '../lib/bodyGroups';

// 📈 지표 — 다이어리 기록(지금 바로 되는 것)과 행동 기록(app_events)을 함께 본다.
const GOLD = '#9C6F26';
const monthKey = (d) => String(d).slice(0, 7);
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

export default function MetricsView() {
  const [diary, setDiary] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [evErr, setEvErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState(0);   // 리텐션 계산 기준 시각
  const [month, setMonth] = useState(monthKey(new Date().toISOString()));

  useEffect(() => {
    let alive = true;
    (async () => {
      const d = await supabase.from('diary_entries').select('user_id,date,soreness');
      const u = await supabase.from('users').select('id,bmti_type,created_at');
      const e = await supabase.from('app_events').select('anon_id,user_id,name,meta,created_at')
        .order('created_at', { ascending: false }).limit(5000);
      if (!alive) return;
      setLoading(false);
      setLoadedAt(Date.now());
      setDiary(d.data || []);
      setUsers(u.data || []);
      if (e.error) setEvErr(e.error.message); else setEvents(e.data || []);
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

  // ④ 행동 기록에서 뽑는 것들
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
      label: s, n: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length), cnt: arr.length,
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

      {/* 행동 기록 기반 */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 900, color: INK, marginBottom: 8 }}>
          방문·검사·공유 <span style={{ fontWeight: 600, color: SUB, fontSize: 12 }}>· 비회원 포함, 익명 ID 기준</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Tile label="방문(사람 수)" value={ev.sessions.toLocaleString()} />
          <Tile label="검사 시작" value={ev.quizStart.toLocaleString()} />
          <Tile label="검사 완료" value={ev.quizDone.toLocaleString()} sub={`시작의 ${pct(ev.quizDone, ev.quizStart)}%`} tone={GOLD} />
          <Tile label="공유 클릭" value={ev.shared.toLocaleString()} sub={`검사 완료의 ${pct(ev.shared, ev.quizDone)}%`} />
          <Tile label="검사 후 가입" value={ev.signedAfterQuiz.toLocaleString()} sub={`검사 완료의 ${pct(ev.signedAfterQuiz, ev.quizDone)}%`} tone="#2F7A4F" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <Bars title="검사 이탈 지점" note="문항별로 여기까지 온 사람 수 — 뚝 떨어지는 지점이 이탈 구간입니다" rows={ev.funnel} total={ev.quizStart} />
        <Bars title="공유 채널" rows={ev.shareByChannel} />
        <div style={box}>
          <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>화면별 평균 체류 시간</div>
          <div style={{ fontSize: 11.5, color: SUB, marginBottom: 10 }}>기록·발견 탭에 얼마나 머무는지</div>
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

      {/* 오류 */}
      <div style={box}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>최근 자바스크립트 오류</div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 10 }}>특정 기기에서만 깨지는 걸 잡습니다</div>
        {ev.errors.length === 0 && <div style={{ fontSize: 12.5, color: SUB }}>보고된 오류가 없습니다.</div>}
        {ev.errors.map((e, i) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${LINE}`, fontSize: 12 }}>
            <div style={{ color: '#B23B36', fontWeight: 700, wordBreak: 'break-all' }}>{e.meta?.msg || '(내용 없음)'}</div>
            <div style={{ color: SUB, marginTop: 3 }}>
              {new Date(e.created_at).toLocaleString('ko-KR')}
              {e.meta?.src && ` · ${e.meta.src}:${e.meta.line}`}
            </div>
            {e.meta?.ua && <div style={{ color: SUB, marginTop: 2, fontSize: 11, wordBreak: 'break-all' }}>{e.meta.ua}</div>}
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11.5, color: SUB, lineHeight: 1.7, margin: 0 }}>
        회원 {users.length}명 · 다이어리 기록 {diary.length}건 · 행동 기록 {events.length}건(최근 5,000건)
      </p>
    </div>
  );
}
