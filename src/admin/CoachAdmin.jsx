// 강사 — 면허를 직접 확인한 회원을 관리자가 강사로 지정한다 (강사–회원 연결 1단계).
//
// 강사는 먼저 카카오로 가입한 회원이어야 한다. 닉네임으로 찾아 지정한다.
// 면허증 사본은 여기에 올리지 않는다 — 따로 받아 확인한 뒤 지우고, '확인한 날'만 적는다.
// 쉬게 하거나 지정을 풀면 강사 화면과 회원 정보 열람이 곧바로 닫힌다(권한은 서버의 is_coach()가 본다).
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { INK, SUB, LINE, BG, box, input, label, btn, smallBtn } from './theme';
import { COACH_AREAS, needsRecheck } from './coachAreas';

const RED = '#B23B36', GREEN = '#2F7A4F';
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const day = (s) => (s ? new Date(s).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }) : '');

// 지정·고치기 창 — user: 지정할 회원, row: 고칠 때의 강사 줄
function Form({ user, row, onSaved, onCancel }) {
  const [f, setF] = useState(() => ({
    display_name: row?.display_name || user?.nickname || '',
    center_name: row?.center_name || '',
    area: row?.area || '',
    license_checked_on: row?.license_checked_on || '',
  }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    const name = f.display_name.trim();
    if (!name) { setErr('회원에게 보일 이름을 적어 주세요.'); return; }
    if (!f.license_checked_on) { setErr('면허를 확인한 날을 적어 주세요. 확인하지 않은 회원은 강사로 지정하지 않습니다.'); return; }
    if (f.license_checked_on > today()) { setErr('면허를 확인한 날이 오늘보다 뒤예요.'); return; }
    setSaving(true); setErr('');
    const payload = { display_name: name.slice(0, 20), center_name: f.center_name.trim().slice(0, 30), area: f.area,
      license_checked_on: f.license_checked_on, updated_at: new Date().toISOString() };
    const { error } = row
      ? await supabase.from('coaches').update(payload).eq('user_id', row.user_id)
      : await supabase.from('coaches').insert({ ...payload, user_id: user.id, active: true });
    setSaving(false);
    if (error) { setErr(/duplicate|23505/.test(`${error.message}${error.code}`) ? '이미 강사로 지정된 회원이에요.' : `저장 실패: ${error.message}`); return; }
    onSaved(row ? '고쳤습니다.' : `${name} 님을 강사로 지정했습니다.`);
  };

  return (
    <div style={{ ...box, marginBottom: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>{row ? '강사 정보 고치기' : '강사로 지정'}</div>
      <div style={{ fontSize: 12.5, color: SUB, marginBottom: 14 }}>
        회원 <b style={{ color: INK }}>{user?.nickname || '(닉네임 없음)'}</b>
        {user?.created_at && <> · 가입 {day(user.created_at)}</>}{user?.bmti_type && <> · {user.bmti_type}</>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
        <div>
          <span style={label}>표시 이름 <span style={{ fontWeight: 600 }}>— 회원에게 보이는 이름</span></span>
          <input style={input} value={f.display_name} onChange={set('display_name')} maxLength={20} placeholder="예: 김바른" />
        </div>
        <div>
          <span style={label}>센터 이름</span>
          <input style={input} value={f.center_name} onChange={set('center_name')} maxLength={30} placeholder="예: 바른움직임 스튜디오" />
        </div>
        <div>
          <span style={label}>동네</span>
          <select style={{ ...input, cursor: 'pointer' }} value={f.area} onChange={set('area')}>
            <option value="">정하지 않음</option>
            {COACH_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <span style={label}>면허를 확인한 날</span>
          <input style={input} type="date" max={today()} value={f.license_checked_on} onChange={set('license_checked_on')} />
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: SUB, lineHeight: 1.7, marginBottom: 12 }}>
        면허증 사본은 여기에 올리지 않습니다. 따로 받아 확인한 뒤 지우고, 확인한 날만 적어 주세요. 한 해가 지나면 목록에 &lsquo;다시 확인&rsquo;이 뜹니다.
      </div>
      {err && <div style={{ fontSize: 13, color: RED, fontWeight: 700, marginBottom: 10 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} disabled={saving} style={btn(true)}>{saving ? '저장 중…' : row ? '저장' : '강사로 지정'}</button>
        <button onClick={onCancel} style={btn(false)}>취소</button>
      </div>
    </div>
  );
}

/** users: 관리자 화면이 이미 읽어 둔 회원 목록 */
export default function CoachAdmin({ users = [] }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);     // { user, row? }
  const [note, setNote] = useState('');

  useEffect(() => {
    let alive = true;
    supabase.from('coaches').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!alive) return;
      setLoading(false);
      // 67번 SQL 전이면 표가 없다
      if (error) { setErr(/coaches|42P01|PGRST205/.test(`${error.message}${error.code}`) ? 'need-sql' : error.message); return; }
      setErr(''); setRows(data || []);
    });
    return () => { alive = false; };
  }, [tick]);

  const byId = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const coachIds = useMemo(() => new Set(rows.map((r) => r.user_id)), [rows]);
  // 닉네임으로 찾기 — 이미 강사인 회원은 빼고 여덟 명까지
  const found = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return [];
    return users.filter((u) => !coachIds.has(u.id) && String(u.nickname || '').toLowerCase().includes(kw)).slice(0, 8);
  }, [q, users, coachIds]);

  const done = (msg) => { setForm(null); setQ(''); setNote(msg); setTick((n) => n + 1); };
  const setActive = async (r, on) => {
    if (!on && !window.confirm(`${r.display_name} 님을 쉬게 할까요?\n강사 화면과 회원 정보 열람이 바로 닫힙니다. 다시 켜면 그대로 돌아옵니다.`)) return;
    const { error } = await supabase.from('coaches').update({ active: on, updated_at: new Date().toISOString() }).eq('user_id', r.user_id);
    if (error) { alert('바꾸지 못했습니다: ' + error.message); return; }
    done(on ? `${r.display_name} 님을 다시 켰습니다.` : `${r.display_name} 님을 쉬게 했습니다.`);
  };
  const remove = async (r) => {
    if (!window.confirm(`${r.display_name} 님의 강사 지정을 풀까요?\n강사 정보가 지워지고 되돌릴 수 없습니다. 잠깐 멈추는 것이라면 '쉬게 하기'를 쓰세요.`)) return;
    const { error } = await supabase.from('coaches').delete().eq('user_id', r.user_id);
    if (error) { alert('풀지 못했습니다: ' + error.message); return; }
    done(`${r.display_name} 님의 강사 지정을 풀었습니다.`);
  };

  if (err === 'need-sql') {
    return (
      <div style={{ ...box, fontSize: 13.5, fontWeight: 700, color: RED, lineHeight: 1.7 }}>
        강사를 담을 표가 아직 없습니다. 67번 SQL을 한 번 실행한 뒤 이 탭을 다시 눌러 주세요.
      </div>
    );
  }

  const td = { padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB, whiteSpace: 'nowrap' };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: INK }}>강사</div>
        <div style={{ fontSize: 12.5, color: SUB }}>활동 {rows.filter((r) => r.active).length} · 전체 {rows.length}</div>
        {note && <div style={{ fontSize: 12.5, fontWeight: 800, color: GREEN, background: '#E8F3EC', borderRadius: 999, padding: '5px 12px' }}>✓ {note}</div>}
      </div>

      {/* 회원을 찾아 지정 */}
      {!form && (
        <div style={{ ...box, marginBottom: 14 }}>
          <span style={label}>강사로 지정할 회원 찾기 <span style={{ fontWeight: 600 }}>— 닉네임으로 · 먼저 카카오로 가입해 있어야 합니다</span></span>
          <input style={{ ...input, maxWidth: 340 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="닉네임" />
          {q.trim() && found.length === 0 && (
            <div style={{ fontSize: 12.5, color: SUB, marginTop: 10, lineHeight: 1.7 }}>
              찾은 회원이 없습니다. 방금 가입했다면 이 페이지를 새로 고쳐 주세요. 이미 강사인 회원은 아래 목록에 있습니다.
            </div>
          )}
          {found.length > 0 && (
            <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
              {found.map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: BG, borderRadius: 9, padding: '8px 11px', fontSize: 12.5, color: SUB }}>
                  <b style={{ color: INK, fontSize: 13 }}>{u.nickname || '(닉네임 없음)'}</b>
                  <span>가입 {day(u.created_at)}</span>
                  {u.bmti_type && <span>{u.bmti_type}</span>}
                  <button onClick={() => setForm({ user: u })} style={{ ...smallBtn, marginLeft: 'auto' }}>이 회원을 강사로</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {form && (
        <Form key={form.row?.user_id || form.user?.id} user={form.user} row={form.row} onSaved={done} onCancel={() => setForm(null)} />
      )}

      {err && <div style={{ ...box, marginBottom: 14, color: RED, fontSize: 13, fontWeight: 700 }}>불러오지 못했습니다: {err}</div>}

      <div style={{ ...box, padding: 0, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 840 }}>
          <thead>
            <tr style={{ background: BG }}>
              {['상태', '표시 이름', '센터', '동네', '회원(닉네임)', '면허 확인한 날', '약관 동의', '지정한 날', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11.5, fontWeight: 800, color: SUB, borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={9} style={{ padding: 20, color: SUB, fontSize: 13 }}>불러오는 중…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={9} style={{ padding: 20, color: SUB, fontSize: 13 }}>아직 지정한 강사가 없습니다. 위에서 회원을 찾아 지정해 주세요.</td></tr>}
            {rows.map((r) => {
              const u = byId[r.user_id];
              const again = needsRecheck(r.license_checked_on);
              return (
                <tr key={r.user_id}>
                  <td style={td}>
                    <span style={{ fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '3px 9px',
                      background: r.active ? '#E8F3EC' : '#F3F1EC', color: r.active ? GREEN : SUB }}>{r.active ? '활동' : '쉼'}</span>
                  </td>
                  <td style={{ ...td, fontSize: 13, fontWeight: 800, color: INK }}>{r.display_name}</td>
                  <td style={td}>{r.center_name || '—'}</td>
                  <td style={td}>{r.area || '—'}</td>
                  <td style={td}>{u ? (u.nickname || '(닉네임 없음)') : '—'}</td>
                  <td style={{ ...td, color: again ? RED : SUB, fontWeight: again ? 800 : 400 }}>
                    {day(r.license_checked_on)}{again && ' · 다시 확인'}
                  </td>
                  <td style={{ ...td, color: r.terms_at ? SUB : RED, fontWeight: r.terms_at ? 400 : 800 }}>{r.terms_at ? day(r.terms_at) : '아직'}</td>
                  <td style={td}>{day(r.created_at)}</td>
                  <td style={td}>
                    <button onClick={() => setForm({ user: u || { id: r.user_id, nickname: '' }, row: r })} style={smallBtn}>고치기</button>
                    <button onClick={() => setActive(r, !r.active)} style={{ ...smallBtn, marginLeft: 6 }}>{r.active ? '쉬게 하기' : '다시 켜기'}</button>
                    <button onClick={() => remove(r)} style={{ ...smallBtn, marginLeft: 6, color: RED }}>지정 풀기</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
