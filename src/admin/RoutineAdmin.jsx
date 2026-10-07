import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { INK, SUB, LINE, BG, box, label, btn, smallBtn } from './theme';
import { PublishBadge, TagsInput } from './ui';
import PreviewModal from './PreviewModal';
import { useUnsavedGuard, confirmLeave } from './dirty';
import { SearchBox, MoveButtons } from './listTools';
import { useSearch } from './useSearch';
import { moveRow, duplicateRow } from './listActions';
import { missingForPublish, useSavedNote } from './editorState';
import RoutineView, { RoutineDetail } from '../features/curation/RoutineView';
import BrowseView from '../features/curation/BrowseView';
import BoxView from '../features/curation/BoxView';
import MyPliEditor from '../features/curation/MyPliEditor';
import { routineSummary, mmss } from '../features/curation/format';
import { pliCardRow } from '../lib/myPli';

// 플레이리스트(루틴) 등록 화면 — 바디카드를 골라 순서를 정하면 하나의 루틴이 된다.
// 만드는 창은 이용자의 '마이플리 만들기'와 같은 것이다(MyPliEditor). 이용자가 만드는 방식을 그대로 겪으며 만든다.
// 제목은 하나(Z·M 공통), 표지는 담긴 동작의 그림이 차례로 나오고 문구만 적는다.
// 총 소요시간·도구·타겟 부위는 담긴 카드에서 자동으로 계산되므로 따로 입력하지 않는다.

// 저장 안 한 내용이 있는지 가리는 지문 — 제목·표지 문구·공개 여부·담긴 동작과 그 설정
const sigOf = (d) => JSON.stringify([d.title, d.coverText, d.share,
  (d.cards || []).map((c) => [c.id, c.rc_reps ?? null, c.rc_sets ?? null, c.rc_rest ?? null, c.rc_side || '', c.rc_guide || ''])]);

function Editor({ row, allCards, onSaved, onCancel, onDelete, onPreview }) {
  const r = row.routine || {};
  const [initial] = useState(() => ({ id: r.id, title: r.title_z || r.title_m || '', cards: row.cards || [],
    coverText: r.thumb_text || '', share: r.published ? 'public' : 'private' }));
  const [keywords, setKeywords] = useState(() => r.keywords || []);
  const [sig, setSig] = useState(() => sigOf(initial));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  useUnsavedGuard(sig, keywords);
  const onDraft = useCallback((d) => setSig(sigOf(d)), []);

  const save = async (p) => {
    const published = p.share === 'public';
    // 빈 플레이리스트가 손님에게 보이지 않게 한다.
    const missing = published ? missingForPublish('routine', { cardCount: p.cards.length }) : [];
    if (missing.length) {
      setErr(`${missing.join(' · ')}이(가) 비어 있어 공개할 수 없습니다. 채운 뒤 다시 눌러 주세요.`);
      return;
    }
    setSaving(true); setErr('');
    const payload = {
      published, title_z: p.title, title_m: p.title,     // 제목은 하나 — 두 칸에 같은 글을 넣는다
      thumb_text: p.coverText || null,
      keywords,
      owner_id: null,                        // 관리자가 만드는 공식 추천 루틴
      updated_at: new Date().toISOString(),
    };
    if (!p.id) payload.skip_opening = true;
    let id = p.id;
    const write = () => (id
      ? supabase.from('routines').update(payload).eq('id', id).select('id').single()
      : supabase.from('routines').insert(payload).select('id').single());
    let { data, error } = await write();
    // 64번 SQL(keywords 칸) 전 — 검색어를 안 적었으면 그 칸만 빼고 저장하고, 적었으면 알려 준다
    if (error && /keywords/.test(error.message || '')) {
      if ((payload.keywords || []).length) {
        setSaving(false);
        setErr('검색어를 담을 칸이 아직 없습니다. 64번 SQL을 한 번 실행한 뒤 다시 저장해 주세요.');
        return;
      }
      delete payload.keywords;
      ({ data, error } = await write());
    }
    if (error) { setSaving(false); setErr('저장 실패: ' + error.message); return; }
    id = data.id;
    // 담긴 동작은 통째로 갈아끼운다 — 순서까지 그대로 맞추는 가장 단순한 방법.
    await supabase.from('routine_cards').delete().eq('routine_id', id);
    if (p.cards.length) {
      const { error: e2 } = await supabase.from('routine_cards').insert(p.cards.map((c, i) => pliCardRow(c, i, id)));
      if (e2) { setSaving(false); setErr('동작 저장 실패: ' + e2.message); return; }
    }
    setSaving(false);
    onSaved(published ? '공개로 저장했습니다.' : '비공개로 저장했습니다.');
  };

  return (
    <div style={{ ...box, marginBottom: 16 }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {err && <div style={{ fontSize: 13, color: '#B23B36', fontWeight: 700, marginBottom: 10 }}>{err}</div>}
        <MyPliEditor official inline initial={initial} allCards={allCards} saving={saving}
          heading={r.id ? `루틴 #${r.id} 수정` : '새 루틴'}
          onDraft={onDraft}
          onSave={save}
          onCancel={() => { if (confirmLeave()) onCancel(); }}
          onDelete={r.id ? () => onDelete(r.id) : null}
          // 미리보기 — 아직 저장 안 한 지금 내용 그대로
          onPeek={(d) => onPreview({ routine: { ...r, title_z: d.title, title_m: d.title, thumb_text: d.coverText }, cards: d.cards })}
          // 이용자 창에는 없는 칸 — 찾기에 걸릴 말
          extra={(
            <div style={{ marginBottom: 16 }}>
              <span style={label}>검색어 <span style={{ fontWeight: 600 }}>— 손님이 이 말로 찾으면 나오게 · 쉼표로 구분</span></span>
              <TagsInput value={keywords} onChange={setKeywords} placeholder="예: 아침, 출근 전, 자기 전" />
            </div>
          )} />
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
  const [screen, setScreen] = useState(false);   // 손님이 보는 바디플리 화면 통째로
  const [box, setBox] = useState(false);         // 손님이 보는 내 보관함 화면
  const [myPlis, setMyPlis] = useState([]);      // 미리보기용 마이플리 — 창 안에서만 산다
  const [saved, setSaved] = useSavedNote();
  const [shown, q, setQ] = useSearch(rows, ['title_z', 'title_m']);
  const [busy, setBusy] = useState(false);
  // 차례 바꾸기 · 복제 — 끝나면 목록을 다시 읽는다
  const move = async (i, d) => {
    if (busy || q.trim()) return;
    setBusy(true);
    const e = await moveRow('routines', rows, i, d);
    setBusy(false);
    if (e) { alert('차례 바꾸기 실패: ' + e); return; }
    load();
  };
  // 플레이리스트는 담긴 동작까지 함께 본떠야 한다.
  const copy = async (row) => {
    if (busy) return;
    setBusy(true);
    const r = await duplicateRow('routines', row, ['cards']);
    if (!r.err && (row.cards || []).length) {
      await supabase.from('routine_cards').insert(row.cards.map((c, i) => pliCardRow(c, i, r.id)));
    }
    setBusy(false);
    if (r.err) { alert('복제 실패: ' + r.err); return; }
    load();
    setSaved('복제했습니다. 비공개로 들어갔어요.');
  };

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
        cards: (links.data || []).filter((l) => l.routine_id === r.id)
          .map((l) => (byId[l.card_id] ? { ...byId[l.card_id], rc_reps: l.reps, rc_sets: l.sets, rc_rest: l.rest, rc_side: l.side || '', rc_guide: l.guide || '' } : null))
          .filter(Boolean),
      })));
    })();
    return () => { alive = false; };
  }, [tick]);

  // asked: 편집 창의 '이 플리 지우기'에서 이미 물어봤으면 다시 묻지 않는다
  const remove = async (id, asked = false) => {
    if (!asked && !window.confirm(`루틴 #${id}을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return;
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
        {saved && (
          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#2F7A4F', background: '#E8F3EC', borderRadius: 999, padding: '5px 12px' }}>
            ✓ {saved}
          </div>
        )}
        <SearchBox q={q} onChange={setQ} count={shown.length} total={0} placeholder="제목으로 찾기" />
        <button onClick={() => setScreen(true)} style={{ ...btn(false), marginLeft: 'auto' }}>📱 바디플리 화면</button>
        <button onClick={() => setBox(true)} style={btn(false)}>📦 내 보관함 화면</button>
        <button onClick={() => { if (confirmLeave()) setEditing({ routine: null, cards: [] }); }} style={btn(true)}>+ 새 루틴</button>
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
        // key: 다른 루틴을 고치러 넘어가면 창을 새로 연다(앞 루틴에 적던 내용이 따라오지 않게)
        <Editor key={editing.routine?.id || 'new'} row={editing} allCards={allCards} onCancel={() => setEditing(null)}
          onSaved={(msg) => { setEditing(null); load(); setSaved(msg || '저장했습니다.'); }}
          onDelete={(id) => { remove(id, true); setEditing(null); }} onPreview={(d) => setPreview(d)} />
      )}

      {screen && (
        <PreviewModal navActive="browse" title={`둘러보기의 바디플리 — 플리 ${rows.length}개 · 동작 ${allCards.length}개 (비공개 포함)`} onClose={() => setScreen(false)}>
          {(tone) => (
            <BrowseView tone={tone} bmtiCode={tone === 'm' ? 'OCDM' : 'ACDZ'} cards={allCards} routines={rows} initialTab="pli" />
          )}
        </PreviewModal>
      )}

      {/* 내 보관함 — 담아 둔 것이 어떻게 보이는지. 여기선 모든 플리·카드를 담은 셈 친다 */}
      {box && (
        <PreviewModal navActive="box" title="내 보관함 화면 — 담아 둔 것이 이렇게 보입니다" onClose={() => setBox(false)}>
          {(tone) => (
            <BoxView nickname="회원" bmtiCode={tone === 'm' ? 'OCDM' : 'ACDZ'} tone={tone}
              plis={rows.slice(0, 3)} cards={allCards.slice(0, 9)} reads={[]}
              // 마이플리 — 미리보기에선 서버에 쓰지 않고 이 창 안에서만 담는다
              myPlis={myPlis} allCards={allCards.filter((c) => c.published)}
              onSaveMine={(p) => setMyPlis((prev) => {
                const row = { id: p.id || `mine-${Date.now()}`, title_z: p.title, title_m: p.title, thumb_text: p.coverText || '', cards: p.cards, mine: true, show_nick: !!p.showNick };
                return p.id ? prev.map((x) => (x.id === p.id ? row : x)) : [row, ...prev];
              })} />
          )}
        </PreviewModal>
      )}

      {preview && (
        <PreviewModal navActive="browse" title="루틴 미리보기" onClose={() => setPreview(null)}>
          {(tone) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: SUB, marginBottom: 8 }}>목록에서</div>
                <RoutineView routine={preview.routine} cards={preview.cards} tone={tone}
                  bmtiCode={tone === 'm' ? 'OCDM' : 'ACDZ'} />
              </div>
              <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: SUB, marginBottom: 10 }}>담긴 동작 한눈에 — ‘일단 구경하기’는 위 표지에서 바로 눌러 보세요</div>
                <RoutineDetail routine={preview.routine} cards={preview.cards} tone={tone} />
              </div>
            </div>
          )}
        </PreviewModal>
      )}

      <MemberPlis />

      <div style={{ ...box, padding: 0, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 780 }}>
          <thead>
            <tr style={{ background: BG }}>
              {['차례', '상태', '#', '제목', '표지 문구', '동작', '총 시간', '조회', '저장', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11.5, fontWeight: 800, color: SUB, borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={10} style={{ padding: 20, color: SUB, fontSize: 13 }}>불러오는 중…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={10} style={{ padding: 20, color: SUB, fontSize: 13 }}>아직 등록된 루틴이 없습니다.</td></tr>}
            {shown.map((r, i) => {
              const s = routineSummary(r.cards);
              const td = { padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB };
              return (
                <tr key={r.id}>
                  <td style={{ ...td, padding: '6px 10px' }}>
                    <MoveButtons up={!q.trim() && i > 0} down={!q.trim() && i < shown.length - 1} onMove={(d) => move(i, d)} />
                  </td>
                  <td style={{ ...td }}><PublishBadge published={r.published} onClick={() => togglePublish(r)} /></td>
                  <td style={td}>{r.id}</td>
                  <td style={{ ...td, fontSize: 13, fontWeight: 700, color: INK }}>{r.title_z}</td>
                  <td style={td}>{String(r.thumb_text || '').replace(/\n/g, ' ') || '—'}</td>
                  <td style={td}>{s.count}개</td>
                  <td style={td}>{s.durationSec > 0 ? mmss(s.durationSec) : '—'}</td>
                  <td style={td}>{r.view_count ?? 0}</td>
                  <td style={td}>{r.save_count ?? 0}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <button onClick={() => setPreview({ routine: r, cards: r.cards })} style={smallBtn}>미리보기</button>
                    <button onClick={() => { if (confirmLeave()) setEditing({ routine: r, cards: r.cards }); }} style={{ ...smallBtn, marginLeft: 6 }}>수정</button>
                    <button onClick={() => copy(r)} style={{ ...smallBtn, marginLeft: 6 }}>복제</button>
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

// 회원이 바디플리에 공개한 마이플리 — 검토 없이 바로 올라가므로, 문제가 있으면 여기서 내린다.
// 내리면(hidden) 바디플리에서 사라지고, 만든 사람의 보관함에는 그대로 남는다. 만든 사람은 스스로 다시 올릴 수 없다.
function MemberPlis() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    supabase.from('routines').select('id,title_z,share_state,shared_at,author_nick,author_code,save_count,view_count')
      .not('owner_id', 'is', null).in('share_state', ['public', 'hidden'])
      .order('shared_at', { ascending: false, nullsFirst: false }).limit(300)
      .then(({ data }) => { if (alive) setRows(data || []); });
    return () => { alive = false; };
  }, [tick]);
  const flip = async (r) => {
    const to = r.share_state === 'hidden' ? 'public' : 'hidden';
    if (to === 'hidden' && !window.confirm(`'${r.title_z}'을(를) 바디플리에서 내릴까요?`)) return;
    const { error } = await supabase.from('routines').update({ share_state: to }).eq('id', r.id);
    if (error) { alert('바꾸지 못했습니다: ' + error.message); return; }
    setTick((n) => n + 1);
  };
  const live = rows.filter((r) => r.share_state === 'public').length;
  return (
    <div style={{ ...box, marginBottom: 14 }}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
          fontSize: 13.5, fontWeight: 900, color: INK }}>
        회원이 올린 플리 <span style={{ fontWeight: 700, color: SUB }}>— 공개 {live} · 내린 것 {rows.length - live} {open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
          {rows.length === 0 && <div style={{ fontSize: 12.5, color: SUB }}>아직 회원이 올린 플리가 없습니다.</div>}
          {rows.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
              <span style={{ width: 54, color: SUB }}>#{r.id}</span>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 800, color: INK }}>{r.title_z}</span>
              <span style={{ color: SUB }}>{r.author_code || '—'}{r.author_nick ? ` · ${r.author_nick}` : ''}</span>
              <span style={{ color: SUB, whiteSpace: 'nowrap' }}>조회 {r.view_count ?? 0} · 저장 {r.save_count ?? 0}</span>
              <span style={{ color: r.share_state === 'hidden' ? '#B23B36' : '#2E7D50', fontWeight: 800, width: 44 }}>
                {r.share_state === 'hidden' ? '내림' : '공개'}
              </span>
              <button type="button" onClick={() => flip(r)} style={smallBtn}>{r.share_state === 'hidden' ? '되살리기' : '내리기'}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
