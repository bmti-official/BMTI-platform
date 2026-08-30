import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CHARACTER_NAMES } from '../lib/bmtiTypes';
import { INK, SUB, LINE, BG, box, input, label, btn, smallBtn } from './theme';
import { PublishBadge } from './ui';
import PreviewModal from './PreviewModal';
import { useUnsavedGuard, confirmLeave } from './dirty';
import RoutineView, { RoutineDetail } from '../features/curation/RoutineView';
import { KIND_LABEL, routineSummary, mmss, finishRate } from '../features/curation/format';

// 플레이리스트(루틴) 등록 화면 — 바로카드를 골라 순서를 정하면 하나의 루틴이 된다.
// 총 소요시간·도구·타겟 부위는 담긴 카드에서 자동으로 계산되므로 따로 입력하지 않는다.
const EMPTY = { published: false, sort_order: 0, title_z: '', title_m: '', bmti_code: '' };

const BMTI_OPTIONS = Object.keys(CHARACTER_NAMES);

function CardPicker({ all, chosen, onChange }) {
  const chosenIds = chosen.map((c) => c.id);
  const rest = all.filter((c) => !chosenIds.includes(c.id));

  const move = (i, d) => {
    const next = [...chosen];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div>
        <span style={label}>담긴 동작 <span style={{ fontWeight: 600 }}>— 위에서부터 순서대로</span></span>
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 8, minHeight: 120, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {chosen.length === 0 && <div style={{ fontSize: 12.5, color: SUB, padding: 10 }}>오른쪽에서 동작을 눌러 담아주세요.</div>}
          {chosen.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 7, background: BG, borderRadius: 8, padding: '7px 9px' }}>
              <span style={{ width: 18, fontSize: 12, fontWeight: 800, color: SUB, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.title_z}
              </span>
              <span style={{ fontSize: 11, color: SUB, whiteSpace: 'nowrap' }}>{c.duration_sec > 0 ? mmss(c.duration_sec) : '—'}</span>
              <button onClick={() => move(i, -1)} disabled={i === 0} style={{ ...smallBtn, padding: '3px 7px', opacity: i === 0 ? 0.35 : 1 }}>↑</button>
              <button onClick={() => move(i, 1)} disabled={i === chosen.length - 1} style={{ ...smallBtn, padding: '3px 7px', opacity: i === chosen.length - 1 ? 0.35 : 1 }}>↓</button>
              <button onClick={() => onChange(chosen.filter((x) => x.id !== c.id))} style={{ ...smallBtn, padding: '3px 7px', color: '#B23B36' }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span style={label}>담을 수 있는 바로카드</span>
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 8, maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rest.length === 0 && <div style={{ fontSize: 12.5, color: SUB, padding: 10 }}>담을 수 있는 카드가 없습니다. 먼저 ⚡ 바로카드에서 만들어 주세요.</div>}
          {rest.map((c) => (
            <button key={c.id} onClick={() => onChange([...chosen, c])}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 8, padding: '7px 9px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#8A6A3A', background: '#F3EAD8', borderRadius: 999, padding: '2px 7px', whiteSpace: 'nowrap' }}>
                {KIND_LABEL[c.kind] || c.kind}
              </span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title_z}</span>
              <span style={{ fontSize: 11, color: SUB, whiteSpace: 'nowrap' }}>{c.duration_sec > 0 ? mmss(c.duration_sec) : '—'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Editor({ row, allCards, onSaved, onCancel, onPreview }) {
  const [f, setF] = useState(row.routine || EMPTY);
  const [chosen, setChosen] = useState(row.cards || []);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  useUnsavedGuard(f, chosen);
  const s = routineSummary(chosen);

  const save = async () => {
    if (!f.title_z.trim() || !f.title_m.trim()) { setErr('Z·M 제목을 모두 입력해 주세요.'); return; }
    setSaving(true); setErr('');
    const payload = {
      published: f.published, sort_order: f.sort_order,
      title_z: f.title_z, title_m: f.title_m,
      bmti_code: f.bmti_code || null,
      owner_id: null,                        // 관리자가 만드는 공식 추천 루틴
      updated_at: new Date().toISOString(),
    };
    let id = f.id;
    if (id) {
      const { error } = await supabase.from('routines').update(payload).eq('id', id);
      if (error) { setSaving(false); setErr('저장 실패: ' + error.message); return; }
    } else {
      const { data, error } = await supabase.from('routines').insert(payload).select('id').single();
      if (error) { setSaving(false); setErr('저장 실패: ' + error.message); return; }
      id = data.id;
    }
    // 담긴 동작은 통째로 갈아끼운다 — 순서까지 그대로 맞추는 가장 단순한 방법.
    await supabase.from('routine_cards').delete().eq('routine_id', id);
    if (chosen.length) {
      const rows = chosen.map((c, i) => ({ routine_id: id, card_id: c.id, position: i }));
      const { error } = await supabase.from('routine_cards').insert(rows);
      if (error) { setSaving(false); setErr('동작 저장 실패: ' + error.message); return; }
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div style={{ ...box, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 14 }}>
        {f.id ? `루틴 #${f.id} 수정` : '새 루틴'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <span style={label}>제목 · Z 유형 <span style={{ color: '#B23B36' }}>담백하게</span></span>
          <input style={input} value={f.title_z} onChange={(e) => set('title_z')(e.target.value)}
            placeholder="퇴근 후 굳은 몸 녹이는 침대-폼롤러 이완 루틴" />
        </div>
        <div>
          <span style={label}>제목 · M 유형 <span style={{ color: '#B23B36' }}>다정하게</span></span>
          <input style={input} value={f.title_m} onChange={(e) => set('title_m')(e.target.value)}
            placeholder="오늘 하루 수고한 몸, 침대에서 천천히 풀어봐요" />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <CardPicker all={allCards} chosen={chosen} onChange={setChosen} />
      </div>

      {/* 담긴 카드에서 자동으로 계산되는 값들 — 관리자가 따로 입력하지 않는다 */}
      <div style={{ ...box, background: BG, padding: '11px 14px', marginBottom: 14, fontSize: 12.5, color: SUB, fontWeight: 600 }}>
        총 <b style={{ color: INK }}>{s.durationSec > 0 ? mmss(s.durationSec) : '—'}</b> · 동작 {s.count}개
        {s.tools.length > 0 && <> · 도구 {s.tools.join(', ')}</>}
        {s.coreParts.length > 0 && <> · 타겟 {s.coreParts.length}곳</>}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <span style={label}>BEST 루틴 배너용 유형 <span style={{ fontWeight: 600 }}>— 비워두면 배너에 안 씀</span></span>
          <select value={f.bmti_code || ''} onChange={(e) => set('bmti_code')(e.target.value)}
            style={{ ...input, width: 220, cursor: 'pointer' }}>
            <option value="">지정 안 함</option>
            {BMTI_OPTIONS.map((c) => <option key={c} value={c}>{c} · {CHARACTER_NAMES[c]}</option>)}
          </select>
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
        <button onClick={() => onPreview({ routine: f, cards: chosen })} style={btn(false)}>미리보기</button>
        <button onClick={() => { if (confirmLeave()) onCancel(); }} style={btn(false)}>취소</button>
      </div>
    </div>
  );
}

export default function RoutineAdmin() {
  const [rows, setRows] = useState([]);      // { ...routine, cards: [] }
  const [allCards, setAllCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);

  const [tick, setTick] = useState(0);
  const load = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const cards = await supabase.from('quick_cards').select('*').order('sort_order', { ascending: true });
      const rt = await supabase.from('routines').select('*').is('owner_id', null)
        .order('sort_order', { ascending: true }).order('id', { ascending: false });
      const links = await supabase.from('routine_cards').select('*').order('position', { ascending: true });
      if (!alive) return;
      setLoading(false);
      const e = cards.error || rt.error || links.error;
      if (e) { setErr(e.message); return; }
      setErr('');
      const byId = Object.fromEntries((cards.data || []).map((c) => [c.id, c]));
      setAllCards(cards.data || []);
      setRows((rt.data || []).map((r) => ({
        ...r,
        cards: (links.data || []).filter((l) => l.routine_id === r.id).map((l) => byId[l.card_id]).filter(Boolean),
      })));
    })();
    return () => { alive = false; };
  }, [tick]);

  const remove = async (id) => {
    if (!window.confirm(`루틴 #${id}을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const { error } = await supabase.from('routines').delete().eq('id', id);
    if (error) { alert('삭제 실패: ' + error.message); return; }
    load();
  };

  const togglePublish = async (row) => {
    const { error } = await supabase.from('routines')
      .update({ published: !row.published, updated_at: new Date().toISOString() }).eq('id', row.id);
    if (error) { alert('변경 실패: ' + error.message); return; }
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: INK }}>플레이리스트</div>
        <div style={{ fontSize: 12.5, color: SUB }}>공개 {rows.filter((r) => r.published).length} · 전체 {rows.length}</div>
        <button onClick={() => { if (confirmLeave()) setEditing({ routine: { ...EMPTY }, cards: [] }); }} style={{ ...btn(true), marginLeft: 'auto' }}>+ 새 루틴</button>
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
        <Editor row={editing} allCards={allCards} onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }} onPreview={(d) => setPreview(d)} />
      )}

      {preview && (
        <PreviewModal title="루틴 미리보기" onClose={() => setPreview(null)}>
          {(tone) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: SUB, marginBottom: 8 }}>목록에서</div>
                <RoutineView routine={preview.routine} cards={preview.cards} tone={tone} />
              </div>
              <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: SUB, marginBottom: 10 }}>‘일단 구경하기’를 눌렀을 때</div>
                <RoutineDetail routine={preview.routine} cards={preview.cards} tone={tone} />
              </div>
            </div>
          )}
        </PreviewModal>
      )}

      <div style={{ ...box, padding: 0, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 780 }}>
          <thead>
            <tr style={{ background: BG }}>
              {['상태', '#', '제목(Z)', '동작', '총 시간', 'BEST 유형', '완주율', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11.5, fontWeight: 800, color: SUB, borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{ padding: 20, color: SUB, fontSize: 13 }}>불러오는 중…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={8} style={{ padding: 20, color: SUB, fontSize: 13 }}>아직 등록된 루틴이 없습니다.</td></tr>}
            {rows.map((r) => {
              const s = routineSummary(r.cards);
              const rate = finishRate(r);
              const td = { padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB };
              return (
                <tr key={r.id}>
                  <td style={{ ...td }}><PublishBadge published={r.published} onClick={() => togglePublish(r)} /></td>
                  <td style={td}>{r.id}</td>
                  <td style={{ ...td, fontSize: 13, fontWeight: 700, color: INK }}>{r.title_z}</td>
                  <td style={td}>{s.count}개</td>
                  <td style={td}>{s.durationSec > 0 ? mmss(s.durationSec) : '—'}</td>
                  <td style={td}>{r.bmti_code || '—'}</td>
                  <td style={td}>{rate != null ? `${rate}%` : '—'}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <button onClick={() => setPreview({ routine: r, cards: r.cards })} style={smallBtn}>미리보기</button>
                    <button onClick={() => { if (confirmLeave()) setEditing({ routine: r, cards: r.cards }); }} style={{ ...smallBtn, marginLeft: 6 }}>수정</button>
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
