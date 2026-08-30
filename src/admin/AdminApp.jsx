import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import CurationAdmin from './CurationAdmin';
import QuickCardAdmin from './QuickCardAdmin';
import RoutineAdmin from './RoutineAdmin';
import SearchPreview from './SearchPreview';
import MetricsView from './MetricsView';
import { confirmLeave } from './dirty';

// ─────────────────────────────────────────────
// BMTI 관리자 페이지 (별도 진입점 admin.html) — Supabase Auth로 관리자만 로그인해서
// 사용자(users)를 조회한다. 검색·기간 필터·CSV 내보내기 지원.
// 조회 권한은 Supabase의 RLS 정책(관리자 이메일만 SELECT)으로 서버에서 통제한다.
// ─────────────────────────────────────────────

const INK = '#1C1A17', SUB = '#6B7280', LINE = '#E5E7EB', BG = '#F8F9FB', ACCENT = '#6B5BB5';

const CARD = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const fmtDate = (s) => (s ? new Date(s).toLocaleString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
const GENDER_LABEL = { male: '남성', female: '여성' };
const TRACK = '#ECEAF4'; // 막대 배경(연보라 톤)
const AGE_ORDER = ['10대', '20대', '30대', '40대', '50대 이상'];

const normGender = (g) => (g === 'male' || g === '남성' ? '남성' : g === 'female' || g === '여성' ? '여성' : (g || '미상'));

// 라벨→개수를 세어 [{label, value}] 로 (order가 있으면 그 순서, 없으면 내림차순)
function tally(rows, getKey, order) {
  const m = new Map();
  rows.forEach(r => { const k = getKey(r); if (k == null || k === '') return; m.set(k, (m.get(k) || 0) + 1); });
  let arr = [...m.entries()].map(([label, value]) => ({ label, value }));
  if (order) arr.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  else arr.sort((a, b) => b.value - a.value);
  return arr;
}

// ── 지표 타일 ──
function StatTile({ label, value, sub }) {
  return (
    <div style={{ ...CARD, padding: '16px 18px', flex: '1 1 140px', minWidth: 140 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: SUB, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: INK, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, fontWeight: 600, color: ACCENT, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── 막대(단색 연보라) 그룹 — 각 막대에 값 직접 표기 ──
function BarGroup({ title, data, total }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div style={{ ...CARD, padding: '16px 18px' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: INK, marginBottom: 14 }}>{title}</div>
      {data.length === 0 ? (
        <div style={{ fontSize: 12.5, color: SUB, padding: '6px 0' }}>데이터 없음</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {data.map(d => {
            const pct = total ? Math.round((d.value / total) * 100) : 0;
            return (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 78, flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: INK, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
                <div style={{ flex: 1, height: 20, background: TRACK, borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(d.value / max) * 100}%`, minWidth: d.value > 0 ? 4 : 0, background: ACCENT, borderRadius: 6 }} />
                </div>
                <span style={{ width: 74, flexShrink: 0, fontSize: 12.5, fontWeight: 800, color: INK, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {d.value}{total ? <span style={{ color: SUB, fontWeight: 600 }}> ({pct}%)</span> : null}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 통계 탭 ──
function StatsView({ users, loading }) {
  const s = useMemo(() => {
    const total = users.length;
    const notif = users.filter(u => u.app_notification).length;
    const done = users.filter(u => u.bmti_type).length;
    return {
      total, notif, done,
      gender: tally(users, u => normGender(u.kakao_gender)),
      age: tally(users, u => u.kakao_age, AGE_ORDER),
      type: tally(users, u => (u.bmti_type ? String(u.bmti_type).split('-')[0] : null)),
    };
  }, [users]);

  if (loading) return <div style={{ ...CARD, padding: 28, textAlign: 'center', color: SUB, fontSize: 14 }}>불러오는 중…</div>;

  const pct = (n) => (s.total ? Math.round((n / s.total) * 100) : 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <StatTile label="총 회원 수" value={s.total.toLocaleString()} />
        <StatTile label="🔔 알림 동의" value={s.notif.toLocaleString()} sub={`전체의 ${pct(s.notif)}%`} />
        <StatTile label="BMTI 검사 완료" value={s.done.toLocaleString()} sub={`전체의 ${pct(s.done)}%`} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <BarGroup title="성별 분포" data={s.gender} total={s.total} />
        <BarGroup title="연령대 분포" data={s.age} total={s.total} />
        <BarGroup title="BMTI 유형 분포" data={s.type} total={s.done} />
      </div>
    </div>
  );
}

// ── 로그인 화면 ──────────────────────────────
function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    setLoading(false);
    if (error) setErr('로그인 실패: ' + error.message);
  };

  const input = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 15, border: `1px solid ${LINE}`, borderRadius: 10, outline: 'none', fontFamily: 'inherit' };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, padding: 20 }}>
      <form onSubmit={submit} style={{ ...CARD, width: '100%', maxWidth: 360, padding: '30px 26px' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: INK, marginBottom: 4 }}>🛠 BMTI 관리자</div>
        <div style={{ fontSize: 13, color: SUB, marginBottom: 22 }}>관리자 계정으로 로그인하세요.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={input} type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" />
          <input style={input} type="password" placeholder="비밀번호" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" />
          {err && <div style={{ fontSize: 12.5, color: '#C0392B', background: '#FDECEA', borderRadius: 9, padding: '10px 12px', lineHeight: 1.5 }}>{err}</div>}
          <button type="submit" disabled={loading} style={{ marginTop: 4, padding: 13, borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── CSV 유틸 ────────────────────────────────
function downloadCSV(name, columns, rows) {
  const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const head = columns.map(c => esc(c.label)).join(',');
  const body = rows.map(r => columns.map(c => esc(c.csv ? c.csv(r) : r[c.key])).join(',')).join('\n');
  const blob = new Blob(['﻿' + head + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${name}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ── 데이터 테이블 (검색·기간·CSV) ────────────
function DataTable({ title, columns, rows, loading, error }) {
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter(r => {
      if (from && (!r.created_at || r.created_at.slice(0, 10) < from)) return false;
      if (to && (!r.created_at || r.created_at.slice(0, 10) > to)) return false;
      if (!kw) return true;
      return columns.some(c => {
        const v = c.csv ? c.csv(r) : r[c.key];
        return v != null && String(v).toLowerCase().includes(kw);
      });
    });
  }, [rows, q, from, to, columns]);

  const ctrl = { padding: '8px 11px', fontSize: 13, border: `1px solid ${LINE}`, borderRadius: 8, outline: 'none', fontFamily: 'inherit', color: INK };
  return (
    <div style={{ ...CARD, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: INK, marginRight: 'auto' }}>{title} <span style={{ color: SUB, fontWeight: 600 }}>{filtered.length}건</span></div>
        <input style={{ ...ctrl, minWidth: 150 }} placeholder="검색" value={q} onChange={e => setQ(e.target.value)} />
        <input style={ctrl} type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <span style={{ color: SUB, fontSize: 12 }}>~</span>
        <input style={ctrl} type="date" value={to} onChange={e => setTo(e.target.value)} />
        <button onClick={() => downloadCSV(title, columns, filtered)} style={{ ...ctrl, cursor: 'pointer', fontWeight: 800, color: '#fff', background: ACCENT, border: 'none' }}>CSV 내려받기</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        {error ? (
          <div style={{ padding: 24, fontSize: 13.5, color: '#C0392B', lineHeight: 1.6 }}>
            조회 오류: {error}<br />
            관리자 조회 정책(RLS)이 아직 없거나 관리자 계정이 정책에 등록되지 않았을 수 있어요. 안내한 SQL을 실행했는지 확인해 주세요.
          </div>
        ) : loading ? (
          <div style={{ padding: 28, textAlign: 'center', color: SUB, fontSize: 14 }}>불러오는 중…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: SUB, fontSize: 14 }}>표시할 데이터가 없어요.</div>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
            <thead>
              <tr>{columns.map(c => (
                <th key={c.key} style={{ textAlign: 'left', fontSize: 12, fontWeight: 800, color: SUB, padding: '11px 14px', borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap', background: '#FBFBFC' }}>{c.label}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id ?? i} style={{ borderBottom: `1px solid ${LINE}` }}>
                  {columns.map(c => (
                    <td key={c.key} style={{ fontSize: 13, color: INK, padding: '11px 14px', verticalAlign: 'top', maxWidth: c.wide ? 380 : 220, whiteSpace: c.wide ? 'pre-wrap' : 'nowrap', overflow: 'hidden', textOverflow: c.wide ? 'clip' : 'ellipsis', wordBreak: c.wide ? 'break-word' : 'normal' }}>
                      {c.render ? c.render(r) : (r[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── 대시보드 ────────────────────────────────
function Dashboard({ session }) {
  const [tab, setTab] = useState('stats');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usrErr, setUsrErr] = useState(null);

  useEffect(() => {
    let alive = true;
    supabase.from('users').select('*').order('created_at', { ascending: false })
      .then((us) => {
        if (!alive) return;
        setLoading(false);
        if (us.error) setUsrErr(us.error.message); else setUsers(us.data || []);
      });
    return () => { alive = false; };
  }, []);

  const userCols = [
    { key: 'created_at', label: '가입일', csv: r => fmtDate(r.created_at), render: r => fmtDate(r.created_at) },
    { key: 'nickname', label: '닉네임' },
    { key: 'kakao_gender', label: '성별', csv: r => GENDER_LABEL[r.kakao_gender] || r.kakao_gender || '', render: r => GENDER_LABEL[r.kakao_gender] || r.kakao_gender || '—' },
    { key: 'kakao_age', label: '연령대' },
    { key: 'bmti_type', label: 'BMTI', render: r => r.bmti_type || '—' },
    { key: 'app_notification', label: '알림 동의', csv: r => (r.app_notification ? '동의' : '미동의'), render: r => (r.app_notification ? <span style={{ color: '#1F9D55', fontWeight: 700 }}>동의</span> : <span style={{ color: SUB }}>미동의</span>) },
    { key: 'kakao_id', label: '카카오 ID' },
  ];

  const tabBtn = (id, label) => (
    <button onClick={() => { if (confirmLeave()) setTab(id); }} style={{ padding: '9px 16px', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', borderRadius: 999, border: 'none', cursor: 'pointer', background: tab === id ? ACCENT : '#fff', color: tab === id ? '#fff' : SUB, boxShadow: tab === id ? 'none' : `inset 0 0 0 1px ${LINE}` }}>{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 22px', background: '#fff', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: INK }}>🛠 BMTI 관리자</div>
        <div style={{ marginLeft: 'auto', fontSize: 12.5, color: SUB }}>{session?.user?.email}</div>
        <button onClick={() => { if (confirmLeave()) supabase.auth.signOut(); }} style={{ padding: '7px 13px', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', borderRadius: 8, border: `1px solid ${LINE}`, background: '#fff', color: SUB, cursor: 'pointer' }}>로그아웃</button>
      </header>

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '22px 18px 60px' }}>
        <div style={{ display: 'flex', gap: 9, marginBottom: 18, flexWrap: 'wrap' }}>
          {tabBtn('stats', '📊 통계')}
          {tabBtn('metrics', '📈 지표')}
          {tabBtn('users', '👤 사용자')}
          {tabBtn('curation', '📚 큐레이션')}
          {tabBtn('cards', '⚡ 바로카드')}
          {tabBtn('routines', '🎵 플레이리스트')}
          {tabBtn('search', '🔎 검색 분류')}
        </div>
        {tab === 'stats' && <StatsView users={users} loading={loading} />}
        {tab === 'metrics' && <MetricsView />}
        {tab === 'users' && <DataTable title="사용자" columns={userCols} rows={users} loading={loading} error={usrErr} />}
        {tab === 'curation' && <CurationAdmin />}
        {tab === 'cards' && <QuickCardAdmin />}
        {tab === 'routines' && <RoutineAdmin />}
        {tab === 'search' && <SearchPreview />}
      </main>
    </div>
  );
}

export default function AdminApp() {
  const [session, setSession] = useState(undefined); // undefined=확인 중, null=로그아웃

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, color: SUB, fontFamily: "'Pretendard',sans-serif" }}>불러오는 중…</div>;
  }
  return session ? <Dashboard session={session} /> : <Login />;
}
