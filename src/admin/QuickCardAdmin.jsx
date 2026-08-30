import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BODY_GROUPS, TOOL_MODES } from '../lib/bodyGroups';
import { PART_KEY } from '../lib/diaryEntryLabels';
import { INK, SUB, LINE, BG, box, input, area, label, btn, smallBtn } from './theme';
import { PillPicker, OnePicker, TagsInput, PublishBadge } from './ui';
import PreviewModal from './PreviewModal';
import { useUnsavedGuard, confirmLeave } from './dirty';
import QuickCardView from '../features/curation/QuickCardView';
import { KIND_LABEL, finishRate } from '../features/curation/format';

// 바로카드 등록·수정 화면 — 관리자 페이지에서만 쓴다.
const PART_OPTIONS = Object.entries(PART_KEY).map(([ko, key]) => ({ key, label: ko }));
const KIND_OPTIONS = Object.entries(KIND_LABEL).map(([key, lb]) => ({ key, label: lb }));

const EMPTY = {
  published: false, sort_order: 0, kind: 'stretch',
  title_z: '', title_m: '', script_z: '', script_m: '', video_url: '', duration_sec: 0,
  tools: [], body_groups: [], core_parts: [], related_parts: [], tool_mode: 'all',
};

function Editor({ row, onSaved, onCancel, onPreview }) {
  const [f, setF] = useState(row || EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  useUnsavedGuard(f);

  const save = async () => {
    if (!f.title_z.trim() || !f.title_m.trim()) { setErr('Z·M 제목을 모두 입력해 주세요.'); return; }
    setSaving(true); setErr('');
    const payload = { ...f, updated_at: new Date().toISOString() };
    ['view_count', 'save_count', 'finish_count', 'start_count', 'created_at'].forEach((k) => delete payload[k]);
    const q = f.id
      ? supabase.from('quick_cards').update(payload).eq('id', f.id)
      : supabase.from('quick_cards').insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) { setErr('저장 실패: ' + error.message); return; }
    onSaved();
  };

  return (
    <div style={{ ...box, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 14 }}>
        {f.id ? `바로카드 #${f.id} 수정` : '새 바로카드'}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <span style={label}>종류</span>
          <OnePicker options={KIND_OPTIONS} value={f.kind} onChange={set('kind')} />
        </div>
        <div>
          <span style={label}>소요 시간(초)</span>
          <input style={{ ...input, width: 110 }} type="number" value={f.duration_sec}
            onChange={(e) => set('duration_sec')(Number(e.target.value) || 0)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <span style={label}>제목 · Z 유형 <span style={{ color: '#B23B36' }}>담백하게</span></span>
          <input style={input} value={f.title_z} onChange={(e) => set('title_z')(e.target.value)}
            placeholder="퇴근 후 굳은 몸 녹이는 침대-폼롤러 이완법" />
        </div>
        <div>
          <span style={label}>제목 · M 유형 <span style={{ color: '#B23B36' }}>다정하게</span></span>
          <input style={input} value={f.title_m} onChange={(e) => set('title_m')(e.target.value)}
            placeholder="오늘 하루 고생한 몸, 침대에서 폼롤러로 풀어봐요" />
        </div>
        <div>
          <span style={label}>음성 대본 · Z 유형</span>
          <textarea style={area} value={f.script_z || ''} onChange={(e) => set('script_z')(e.target.value)} />
        </div>
        <div>
          <span style={label}>음성 대본 · M 유형</span>
          <textarea style={area} value={f.script_m || ''} onChange={(e) => set('script_m')(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <span style={label}>영상 주소</span>
          <input style={input} value={f.video_url || ''} onChange={(e) => set('video_url')(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <span style={label}>포함 도구 <span style={{ fontWeight: 600 }}>— 쉼표로 구분</span></span>
          <TagsInput value={f.tools} onChange={set('tools')} placeholder="폼롤러, 매트" />
        </div>
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
          <OnePicker options={TOOL_MODES.map((t) => ({ key: t.id, label: t.label }))} value={f.tool_mode} onChange={set('tool_mode')} />
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
      <div style={{ position: 'sticky', bottom: 0, zIndex: 5, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        background: '#fff', margin: '4px -18px -18px', padding: '12px 18px', borderTop: `1px solid ${LINE}`,
        borderRadius: '0 0 13px 13px', boxShadow: '0 -6px 14px rgba(23,21,15,0.06)' }}>
        <button onClick={save} disabled={saving} style={btn(true)}>{saving ? '저장 중…' : '저장'}</button>
        <button onClick={() => onPreview(f)} style={btn(false)}>미리보기</button>
        <button onClick={() => { if (confirmLeave()) onCancel(); }} style={btn(false)}>취소</button>
      </div>
    </div>
  );
}

export default function QuickCardAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);

  const [tick, setTick] = useState(0);
  const load = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    supabase.from('quick_cards')
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
    if (!window.confirm(`바로카드 #${id}을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const { error } = await supabase.from('quick_cards').delete().eq('id', id);
    if (error) { alert('삭제 실패: ' + error.message); return; }
    load();
  };

  const togglePublish = async (row) => {
    const { error } = await supabase.from('quick_cards')
      .update({ published: !row.published, updated_at: new Date().toISOString() }).eq('id', row.id);
    if (error) { alert('변경 실패: ' + error.message); return; }
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: INK }}>바로카드</div>
        <div style={{ fontSize: 12.5, color: SUB }}>공개 {rows.filter((r) => r.published).length} · 전체 {rows.length}</div>
        <button onClick={() => { if (confirmLeave()) setEditing({ ...EMPTY }); }} style={{ ...btn(true), marginLeft: 'auto' }}>+ 새 바로카드</button>
      </div>

      {err && (
        <div style={{ ...box, marginBottom: 14, color: '#B23B36', fontSize: 13, fontWeight: 700 }}>
          불러오지 못했습니다: {err}
          <div style={{ color: SUB, fontWeight: 600, marginTop: 6 }}>
            supabase/sql/01_curation.sql 을 아직 실행하지 않았다면 먼저 실행해 주세요.
          </div>
        </div>
      )}

      {editing && (
        <Editor row={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }}
          onPreview={(draft) => setPreview(draft)} />
      )}

      {preview && (
        <PreviewModal title="바로카드 미리보기" onClose={() => setPreview(null)}>
          {(tone) => <QuickCardView card={preview} tone={tone} />}
        </PreviewModal>
      )}

      <div style={{ ...box, padding: 0, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 760 }}>
          <thead>
            <tr style={{ background: BG }}>
              {['상태', '#', '종류', '제목(Z)', '완주율', '조회', '저장', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11.5, fontWeight: 800, color: SUB, borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{ padding: 20, color: SUB, fontSize: 13 }}>불러오는 중…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={8} style={{ padding: 20, color: SUB, fontSize: 13 }}>아직 등록된 바로카드가 없습니다.</td></tr>}
            {rows.map((r) => {
              const rate = finishRate(r);
              return (
                <tr key={r.id}>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}` }}>
                    <PublishBadge published={r.published} onClick={() => togglePublish(r)} />
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB }}>{r.id}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB }}>{KIND_LABEL[r.kind] || r.kind}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 13, fontWeight: 700, color: INK }}>{r.title_z}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB }}>{rate != null ? `${rate}%` : '—'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB }}>{r.view_count}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB }}>{r.save_count}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap' }}>
                    <button onClick={() => setPreview(r)} style={smallBtn}>미리보기</button>
                    <button onClick={() => { if (confirmLeave()) setEditing(r); }} style={{ ...smallBtn, marginLeft: 6 }}>수정</button>
                    <button onClick={() => remove(r.id)} style={{ ...smallBtn, marginLeft: 6, color: '#B23B36' }}>삭제</button>
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
