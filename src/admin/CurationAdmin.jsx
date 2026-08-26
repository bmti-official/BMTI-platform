import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BODY_GROUPS, TOOL_MODES } from '../lib/bodyGroups';
import { PART_KEY } from '../lib/diaryEntryLabels';

// 큐레이션 등록·수정 화면 — 관리자 페이지에서만 쓴다.
// 이 파일은 사용자 앱(main.jsx)이 import하지 않으므로 사용자 번들에 들어가지 않는다.
const INK = '#17150F', SUB = '#6C665A', LINE = '#E3DED1', ACCENT = '#9C6F26', BG = '#FBFAF8';

const PART_OPTIONS = Object.entries(PART_KEY).map(([label, key]) => ({ key, label }));

const box = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 18 };
const input = { width: '100%', padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', border: `1px solid ${LINE}`, borderRadius: 9, outline: 'none', boxSizing: 'border-box' };
const label = { display: 'block', fontSize: 12, fontWeight: 800, color: SUB, marginBottom: 6 };
const btn = (primary) => ({ padding: '9px 16px', fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit', borderRadius: 9, cursor: 'pointer', border: 'none', background: primary ? ACCENT : '#fff', color: primary ? '#fff' : SUB, boxShadow: primary ? 'none' : `inset 0 0 0 1px ${LINE}` });

const EMPTY = {
  published: false, sort_order: 0,
  title_z: '', title_m: '', body_z: '', body_m: '', cover_url: '',
  body_groups: [], core_parts: [], related_parts: [], tool_mode: 'all',
};

// 여러 개 고르는 알약 버튼 묶음
function PillPicker({ options, value, onChange, max }) {
  const toggle = (v) => {
    if (value.includes(v)) return onChange(value.filter((x) => x !== v));
    if (max && value.length >= max) return;
    onChange([...value, v]);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => {
        const on = value.includes(o.key);
        const full = !on && max && value.length >= max;
        return (
          <button key={o.key} type="button" onClick={() => toggle(o.key)} disabled={full}
            style={{ padding: '6px 12px', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', borderRadius: 999, cursor: full ? 'default' : 'pointer',
              border: 'none', background: on ? ACCENT : '#fff', color: on ? '#fff' : SUB,
              boxShadow: on ? 'none' : `inset 0 0 0 1px ${LINE}`, opacity: full ? 0.4 : 1 }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Editor({ row, onSaved, onCancel }) {
  const [f, setF] = useState(row || EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.title_z.trim() || !f.title_m.trim()) { setErr('Z·M 제목을 모두 입력해 주세요.'); return; }
    setSaving(true); setErr('');
    const payload = { ...f, updated_at: new Date().toISOString() };
    delete payload.view_count; delete payload.save_count; delete payload.created_at;
    const q = f.id
      ? supabase.from('curation_items').update(payload).eq('id', f.id)
      : supabase.from('curation_items').insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) { setErr('저장 실패: ' + error.message); return; }
    onSaved();
  };

  return (
    <div style={{ ...box, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 14 }}>
        {f.id ? `큐레이션 #${f.id} 수정` : '새 큐레이션'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <span style={label}>제목 · Z 유형 <span style={{ color: '#B23B36' }}>담백하게</span></span>
          <input style={input} value={f.title_z} onChange={(e) => set('title_z')(e.target.value)}
            placeholder="목이 굳었을 때 3분 이완법" />
        </div>
        <div>
          <span style={label}>제목 · M 유형 <span style={{ color: '#B23B36' }}>다정하게</span></span>
          <input style={input} value={f.title_m} onChange={(e) => set('title_m')(e.target.value)}
            placeholder="목이 뻐근한 날, 3분만 같이 풀어봐요" />
        </div>
        <div>
          <span style={label}>본문 · Z 유형</span>
          <textarea style={{ ...input, minHeight: 120, resize: 'vertical' }} value={f.body_z || ''} onChange={(e) => set('body_z')(e.target.value)} />
        </div>
        <div>
          <span style={label}>본문 · M 유형</span>
          <textarea style={{ ...input, minHeight: 120, resize: 'vertical' }} value={f.body_m || ''} onChange={(e) => set('body_m')(e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <span style={label}>대표 이미지 주소</span>
        <input style={input} value={f.cover_url || ''} onChange={(e) => set('cover_url')(e.target.value)} placeholder="https://..." />
      </div>

      <div style={{ marginBottom: 14 }}>
        <span style={label}>부위 묶음 <span style={{ fontWeight: 600 }}>— 검색 분류에 쓰입니다</span></span>
        <PillPicker options={BODY_GROUPS.map((g) => ({ key: g.id, label: g.label }))} value={f.body_groups} onChange={set('body_groups')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <span style={label}>핵심 부위 <span style={{ fontWeight: 600 }}>— 최대 3개</span></span>
          <PillPicker options={PART_OPTIONS} value={f.core_parts} onChange={set('core_parts')} max={3} />
        </div>
        <div>
          <span style={label}>연관 부위 <span style={{ fontWeight: 600 }}>— 최대 6개</span></span>
          <PillPicker options={PART_OPTIONS} value={f.related_parts} onChange={set('related_parts')} max={6} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <span style={label}>도구·성향</span>
          <PillPicker options={TOOL_MODES.map((t) => ({ key: t.id, label: t.label }))}
            value={[f.tool_mode]} onChange={(v) => set('tool_mode')(v[v.length - 1] || 'all')} />
        </div>
        <div>
          <span style={label}>정렬 순서</span>
          <input style={{ ...input, width: 90 }} type="number" value={f.sort_order}
            onChange={(e) => set('sort_order')(Number(e.target.value) || 0)} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: INK, cursor: 'pointer', paddingBottom: 9 }}>
          <input type="checkbox" checked={f.published} onChange={(e) => set('published')(e.target.checked)} />
          공개 <span style={{ fontWeight: 600, color: SUB }}>(체크해야 이용자에게 보입니다)</span>
        </label>
      </div>

      {err && <div style={{ fontSize: 13, color: '#B23B36', fontWeight: 700, marginBottom: 12 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} disabled={saving} style={btn(true)}>{saving ? '저장 중…' : '저장'}</button>
        <button onClick={onCancel} style={btn(false)}>취소</button>
      </div>
    </div>
  );
}

export default function CurationAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null); // null=안 열림, {}=새로, {…}=수정

  // 목록 읽기 — tick을 올리면 다시 읽는다.
  // 결과 처리를 .then 안에서 해야 effect 본문에서 동기로 setState 하지 않게 되고,
  // 화면을 떠난 뒤 응답이 와도 alive 플래그로 걸러진다.
  const [tick, setTick] = useState(0);
  const load = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    supabase.from('curation_items')
      .select('*').order('sort_order', { ascending: true }).order('id', { ascending: false })
      .then(({ data, error }) => {
        if (!alive) return;
        setLoading(false);
        if (error) { setErr(error.message); return; }
        setErr(''); setRows(data || []);
      });
    return () => { alive = false; };
  }, [tick]);

  const remove = async (id) => {
    if (!window.confirm(`큐레이션 #${id}을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const { error } = await supabase.from('curation_items').delete().eq('id', id);
    if (error) { alert('삭제 실패: ' + error.message); return; }
    load();
  };

  const togglePublish = async (row) => {
    const { error } = await supabase.from('curation_items')
      .update({ published: !row.published, updated_at: new Date().toISOString() }).eq('id', row.id);
    if (error) { alert('변경 실패: ' + error.message); return; }
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: INK }}>큐레이션</div>
        <div style={{ fontSize: 12.5, color: SUB }}>공개 {rows.filter((r) => r.published).length} · 전체 {rows.length}</div>
        <button onClick={() => setEditing({ ...EMPTY })} style={{ ...btn(true), marginLeft: 'auto' }}>+ 새 큐레이션</button>
      </div>

      {err && (
        <div style={{ ...box, marginBottom: 14, color: '#B23B36', fontSize: 13, fontWeight: 700 }}>
          불러오지 못했습니다: {err}
          <div style={{ color: SUB, fontWeight: 600, marginTop: 6 }}>
            supabase/sql/01_curation.sql 을 아직 실행하지 않았다면 먼저 실행해 주세요.
          </div>
        </div>
      )}

      {editing && <Editor row={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      <div style={{ ...box, padding: 0, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
          <thead>
            <tr style={{ background: BG }}>
              {['상태', '#', '제목(Z)', '부위 묶음', '조회', '저장', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11.5, fontWeight: 800, color: SUB, borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ padding: 20, color: SUB, fontSize: 13 }}>불러오는 중…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={7} style={{ padding: 20, color: SUB, fontSize: 13 }}>아직 등록된 큐레이션이 없습니다.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}` }}>
                  <button onClick={() => togglePublish(r)}
                    style={{ padding: '3px 9px', fontSize: 11, fontWeight: 800, fontFamily: 'inherit', borderRadius: 999, border: 'none', cursor: 'pointer',
                      background: r.published ? '#E8F3EC' : '#F3F1EC', color: r.published ? '#2F7A4F' : SUB }}>
                    {r.published ? '공개' : '비공개'}
                  </button>
                </td>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB }}>{r.id}</td>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 13, fontWeight: 700, color: INK }}>{r.title_z}</td>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12, color: SUB }}>
                  {(r.body_groups || []).map((g) => BODY_GROUPS.find((x) => x.id === g)?.label || g).join(', ') || '—'}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB }}>{r.view_count}</td>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB }}>{r.save_count}</td>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap' }}>
                  <button onClick={() => setEditing(r)} style={{ ...btn(false), padding: '5px 11px', fontSize: 12 }}>수정</button>
                  <button onClick={() => remove(r.id)} style={{ ...btn(false), padding: '5px 11px', fontSize: 12, marginLeft: 6, color: '#B23B36' }}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
