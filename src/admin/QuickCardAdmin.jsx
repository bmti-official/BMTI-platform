import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BODY_GROUPS, TOOL_MODES } from '../lib/bodyGroups';
import { PART_KEY } from '../lib/diaryEntryLabels';
import { INK, SUB, LINE, BG, box, input, area, label, btn, smallBtn } from './theme';
import { PillPicker, OnePicker, TagsInput, PublishBadge } from './ui';
import PreviewModal from './PreviewModal';
import { useUnsavedGuard, confirmLeave } from './dirty';
import { NEEDS_CHECK, countNeedsCheck, withDraft, useAutoDraft, dropDraft } from './editorState';
import { CharCount, HiliteBox, DraftMark } from './editorBits';
import { parseCard } from './pasteCard';
import MotionInput from './MotionInput';
import ImageInput from './ImageInput';
import { CurationThumb } from '../features/curation/CurationCard';
import { fontStack, THUMB_FONTS, THUMB_POS } from '../features/curation/fonts';
import { ACCENT } from './theme';
import QuickCardView from '../features/curation/QuickCardView';
import { KIND_LABEL, finishRate } from '../features/curation/format';

// 바로카드 등록·수정 화면 — 관리자 페이지에서만 쓴다.
const PART_OPTIONS = Object.entries(PART_KEY).map(([ko, key]) => ({ key, label: ko }));
const KIND_OPTIONS = Object.entries(KIND_LABEL).map(([key, lb]) => ({ key, label: lb }));

const EMPTY = {
  published: false, sort_order: 0, kind: 'stretch',
  title_z: '', title_m: '', script_z: '', script_m: '', video_url: '', duration_sec: 0,
  motion_url: '', cover_url: '', thumb_text: '',
  thumb_font: 'pretendard', thumb_pos: 'tl', thumb_color: '#FFFFFF', thumb_dx: 0, thumb_dy: 0,
  tools: [], body_groups: [], core_parts: [], related_parts: [], tool_mode: 'all',
};

// 아홉 칸 자리에서 조금 더 미세하게 미는 슬라이더
function ThumbNudge({ dx, dy, onDx, onDy }) {
  const row = (label, v, on) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ width: 34, flexShrink: 0, fontSize: 11, fontWeight: 800, color: SUB }}>{label}</span>
      <input type="range" min={-40} max={40} step={2} value={Number(v) || 0}
        onChange={(e) => on(Number(e.target.value))} style={{ flex: 1, minWidth: 0, accentColor: ACCENT }} />
      <span style={{ width: 34, flexShrink: 0, fontSize: 11, fontWeight: 800, color: INK, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {Number(v) || 0}
      </span>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 7 }}>
      {row('좌우', dx, onDx)}
      {row('위아래', dy, onDy)}
      {(Number(dx) || Number(dy)) ? (
        <button type="button" onClick={() => { onDx(0); onDy(0); }}
          style={{ alignSelf: 'flex-start', padding: 0, border: 'none', background: 'transparent', fontFamily: 'inherit',
            fontSize: 11, fontWeight: 700, color: SUB, cursor: 'pointer', textDecoration: 'underline' }}>
          가운데로 되돌리기
        </button>
      ) : null}
    </div>
  );
}

function Editor({ row, onSaved, onCancel, onPreview, onDelete }) {
  const [f, setF] = useState(() => withDraft({ ...EMPTY, ...(row || {}) }, 'card', row));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteNote, setPasteNote] = useState('');
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const draftAt = useAutoDraft('card', row, f);
  useUnsavedGuard(f);

  // 통째로 붙여넣은 대본을 칸마다 나눠 담는다.
  const applyPaste = () => {
    const { fields, report, count } = parseCard(pasteText);
    if (!count) {
      setPasteNote('형식을 알아보지 못했습니다. [제목 · Z] 처럼 대괄호 머리말이 들어 있는지 확인해 주세요.');
      return;
    }
    setF((prev) => ({ ...prev, ...fields }));
    const need = countNeedsCheck(fields);
    setPasteNote(`${report.join(' · ')} — 채웠습니다. 아래에서 확인하고 저장해 주세요.`
      + (need ? ` / ${NEEDS_CHECK} 표시가 ${need}군데 있습니다. 사실을 확인하고 표시를 지워야 공개할 수 있어요.` : ''));
    setPasteOpen(false);
    setPasteText('');
  };

  const save = async () => {
    if (!f.title_z.trim() || !f.title_m.trim()) { setErr('Z·M 제목을 모두 입력해 주세요.'); return; }
    const unchecked = countNeedsCheck(f);
    if (f.published && unchecked > 0) {
      setErr(`'${NEEDS_CHECK}' 표시가 ${unchecked}군데 남아 있습니다. 사실을 확인하고 표시를 지운 뒤 공개해 주세요.`);
      return;
    }
    setSaving(true); setErr('');
    const payload = { ...f, updated_at: new Date().toISOString() };
    ['view_count', 'save_count', 'finish_count', 'start_count', 'created_at'].forEach((k) => delete payload[k]);
    const q = f.id
      ? supabase.from('quick_cards').update(payload).eq('id', f.id)
      : supabase.from('quick_cards').insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) { setErr('저장 실패: ' + error.message); return; }
    dropDraft('card', row?.id);
    onSaved();
  };

  return (
    <div style={{ ...box, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: INK }}>
          {f.id ? `바로카드 #${f.id} 수정` : '새 바로카드'}
        </div>
        <button onClick={() => { setPasteNote(''); setPasteOpen(true); }} style={{ ...btn(false), marginLeft: 'auto' }}>
          📋 대본 붙여넣기
        </button>
      </div>

      {pasteNote && (
        <div style={{ fontSize: 12.5, fontWeight: 700, color: pasteNote.startsWith('형식') ? '#B23B36' : '#2E7D50',
          background: pasteNote.startsWith('형식') ? '#FDECEA' : '#EDF7F0', borderRadius: 9, padding: '10px 12px', marginBottom: 14, lineHeight: 1.5 }}>
          {pasteNote}
        </div>
      )}

      {pasteOpen && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setPasteOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,14,0.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 18, width: '100%', maxWidth: 760, maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>대본 붙여넣기</div>
            <div style={{ fontSize: 12, color: SUB, marginBottom: 10, lineHeight: 1.6 }}>
              AI에게 받은 대본을 통째로 붙여넣고 &lsquo;칸 채우기&rsquo;를 누르세요. 제목·대본·종류·소요 시간·도구·검색 분류가 각 칸으로 들어갑니다.
              <br />채팅창에서 딸려오는 <b>MD</b>, <b>+ 1</b> 같은 줄은 알아서 버립니다. 동작 데이터는 따로 올려 주세요.
            </div>
            <textarea autoFocus value={pasteText} onChange={(e) => setPasteText(e.target.value)}
              placeholder={'[제목 · Z] …\n[제목 · M] …\n종류: 스트레칭\n소요 시간: 3분\n[대본 · Z] …'}
              style={{ ...area, flex: 1, minHeight: 320, fontSize: 12.5, lineHeight: 1.6 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={applyPaste} disabled={!pasteText.trim()} style={{ ...btn(true), opacity: pasteText.trim() ? 1 : 0.45 }}>칸 채우기</button>
              <button onClick={() => setPasteOpen(false)} style={btn(false)}>닫기</button>
              <span style={{ fontSize: 11.5, color: SUB, alignSelf: 'center', marginLeft: 'auto' }}>이미 적은 칸은 새 내용으로 바뀝니다</span>
            </div>
          </div>
        </div>
      )}

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

      {/* 썸네일 — 인스타 게시물 비율(4:5). 실제 동작은 쇼츠 비율(9:16)로 따로 나갑니다 */}
      <div style={{ ...box, background: BG, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>썸네일 <span style={{ fontWeight: 600, color: SUB }}>— 세로 4:5</span></div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 10 }}>목록에서 보이는 표지입니다. &lsquo;바로 시작하기&rsquo;를 누르면 9:16 동작으로 바뀝니다.</div>
        <div style={{ marginBottom: 12 }}>
          <span style={label}>이미지 <span style={{ fontWeight: 600 }}>— 세로로 긴 4:5 사진을 권합니다</span></span>
          <ImageInput value={f.cover_url} onChange={set('cover_url')}
            hint="사진을 끌어다 놓거나 '사진 올리기'를 누르세요. 주소를 직접 붙여넣어도 됩니다." />
        </div>
        <div style={{ marginBottom: 12 }}>
          <span style={label}>썸네일 문구 <span style={{ fontWeight: 600 }}>— Z·M 공통</span></span>
          <input style={{ ...input, fontSize: 16, fontWeight: 800, padding: '12px 14px' }} value={f.thumb_text || ''}
            onChange={(e) => set('thumb_text')(e.target.value)} placeholder="굳은 어깨 1분에 풀기" />
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', minWidth: 260, display: 'grid', gridTemplateColumns: '1fr 132px', gap: 12 }}>
            <div>
              <span style={label}>썸네일 글씨체</span>
              <select value={f.thumb_font || 'pretendard'} onChange={(e) => set('thumb_font')(e.target.value)}
                style={{ ...input, cursor: 'pointer', fontFamily: fontStack(f.thumb_font) }}>
                {THUMB_FONTS.map((ft) => <option key={ft.key} value={ft.key}>{ft.label}</option>)}
              </select>
            </div>
            <div>
              <span style={label}>문구 색</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={f.thumb_color || '#FFFFFF'} onChange={(e) => set('thumb_color')(e.target.value)}
                  style={{ width: 38, height: 38, padding: 2, border: `1px solid ${LINE}`, borderRadius: 8, background: '#fff', cursor: 'pointer', flexShrink: 0 }} />
                <input style={{ ...input, flex: 1, minWidth: 0, padding: '10px 8px', fontSize: 12.5 }} value={f.thumb_color || '#FFFFFF'}
                  onChange={(e) => set('thumb_color')(e.target.value)} />
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={label}>문구 자리 <span style={{ fontWeight: 600 }}>— 아홉 칸 중 하나</span></span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 46px)', gap: 4 }}>
                {THUMB_POS.map((tp) => {
                  const on = (f.thumb_pos || 'tl') === tp.key;
                  return (
                    <button key={tp.key} type="button" title={tp.label} onClick={() => set('thumb_pos')(tp.key)}
                      style={{ height: 22, borderRadius: 5, border: 'none', cursor: 'pointer', padding: 0,
                        background: on ? ACCENT : '#fff', boxShadow: on ? 'none' : `inset 0 0 0 1px ${LINE}` }} />
                  );
                })}
              </div>
              <ThumbNudge dx={f.thumb_dx} dy={f.thumb_dy} onDx={set('thumb_dx')} onDy={set('thumb_dy')} />
            </div>
          </div>
          <div style={{ flex: '0 0 200px', maxWidth: '100%' }}>
            <span style={label}>썸네일 미리보기 <span style={{ fontWeight: 600 }}>— 4:5</span></span>
            <CurationThumb item={f} ratio="4 / 5" showRead={false} clip={f.video_url || ''}
              badge={f.duration_sec > 0 ? { label: '소요시간', value: `${Math.floor(f.duration_sec / 60)}:${String(f.duration_sec % 60).padStart(2, '0')}` } : null} />
          </div>
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
          <HiliteBox placeholder="바르게 앉아 어깨를 내립니다." minHeight={120} value={f.script_z} onChange={set('script_z')}>
            <CharCount a={f.script_z} b={f.script_m} maxPara={160} />
          </HiliteBox>
        </div>
        <div>
          <span style={label}>음성 대본 · M 유형</span>
          <HiliteBox placeholder="편하게 앉아서 어깨에 힘을 빼 보세요." minHeight={120} value={f.script_m} onChange={set('script_m')}>
            <CharCount a={f.script_m} b={f.script_z} maxPara={160} />
          </HiliteBox>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <span style={label}>반복 동작 <span style={{ fontWeight: 600 }}>— 카드 가운데에서 계속 돌아갑니다</span></span>
          <MotionInput value={f.motion_url} onChange={set('motion_url')} />
        </div>
        <div>
          <span style={label}>영상 <span style={{ fontWeight: 600 }}>— 동작 대신 영상을 쓸 때만 (선택)</span></span>
          <ImageInput allowVideo value={f.video_url} onChange={set('video_url')}
            placeholder="영상을 끌어다 놓거나 주소를 붙여넣으세요"
            hint="mp4·webm 파일을 올릴 수 있어요. 세로 9:16, 20MB 이하를 권합니다." />
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
        <DraftMark at={draftAt} />
        {f.id && (
          <button onClick={() => onDelete(f.id)}
            style={{ ...btn(false), marginLeft: 'auto', color: '#B23B36', boxShadow: 'inset 0 0 0 1px #E7C3C0' }}>
            이 바로카드 삭제
          </button>
        )}
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
  const [previewMotion, setPreviewMotion] = useState(null);

  // 미리보기를 열면 그 카드의 동작 데이터도 함께 읽어 온다.
  useEffect(() => {
    let alive = true;
    (preview?.motion_url ? fetch(preview.motion_url) : Promise.reject(new Error('없음')))
      .then((r) => r.json())
      .then((m) => { if (alive) setPreviewMotion(m); })
      .catch(() => { if (alive) setPreviewMotion(null); });
    return () => { alive = false; };
  }, [preview]);

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

  const remove = async (id, after) => {
    if (!window.confirm(`바로카드 #${id}을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return;
    // select()를 붙여야 정말 지워졌는지 알 수 있다.
    const { data, error } = await supabase.from('quick_cards').delete().eq('id', id).select('id');
    if (error) { alert('삭제 실패: ' + error.message); return; }
    if (!data || data.length === 0) { alert('삭제되지 않았습니다. 관리자 계정으로 로그인했는지 확인해 주세요.'); return; }
    dropDraft('card', id);
    if (after) after();
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
          onDelete={(id) => remove(id, () => setEditing(null))}
          onPreview={(draft) => setPreview(draft)} />
      )}

      {preview && (
        <PreviewModal title="바로카드 미리보기" onClose={() => setPreview(null)}>
          {(tone) => <QuickCardView card={preview} tone={tone} motion={previewMotion} />}
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
