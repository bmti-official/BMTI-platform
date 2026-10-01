// 자기점검 — 손님 화면. 둘러보기 · 바로플리 · 내 보관함 세 갈래를 한자리에서 돌린다.
//
// 관리자 미리보기에서 쓰던 부품(BrowseView·BaroPliView·BoxView)을 그대로 쓰고,
// 여기서는 공개된 콘텐츠를 읽어 오고 보관함·마이플리를 서버와 잇는 일만 한다.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import BrowseView from '../curation/BrowseView';
import BaroPliView from '../curation/BaroPliView';
import BoxView from '../curation/BoxView';
import { CurationDetail } from '../curation/CurationCard';
import { KeepContext } from '../curation/keep';
import { toneOf } from '../curation/format';
import { axisOf } from '../curation/typeTint';
import { loadSaved, setSaved } from '../../lib/savedItems';
import { loadMyPlis, saveMyPli, deleteMyPli } from '../../lib/myPli';
import { viewOnce } from '../../lib/counters';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const key = (type, id) => `${type}:${id}`;

// 플리에 담긴 동작을 붙인다(동작별 설정까지). 공개된 바로카드만 남고, 동작이 하나도 없으면 뺀다.
const withCards = (rows, links, byId) => (rows || []).map((r) => ({
  ...r,
  cards: (links || []).filter((l) => l.routine_id === r.id)
    .map((l) => (byId[l.card_id] ? { ...byId[l.card_id], rc_reps: l.reps, rc_sets: l.sets, rc_rest: l.rest, rc_side: l.side || '', rc_guide: l.guide || '' } : null))
    .filter(Boolean),
})).filter((r) => r.cards.length > 0);

// 회원이 공개로 올린 마이플리 — 새로 올린 것부터
async function loadShared(byId) {
  const rts = await supabase.from('routines').select('*').not('owner_id', 'is', null).eq('share_state', 'public')
    .order('shared_at', { ascending: false }).limit(200);
  const ids = (rts.data || []).map((r) => r.id);
  if (!ids.length) return [];
  const links = await supabase.from('routine_cards').select('*').in('routine_id', ids).order('position', { ascending: true });
  return withCards(rts.data, links.data, byId);
}

// 공개된 것만 — 바로카드, 바로플리(공식 + 회원이 공개한 것), 읽을거리
async function loadPublic() {
  const [cards, rts, links, reads] = await Promise.all([
    supabase.from('quick_cards').select('*').eq('published', true).order('sort_order', { ascending: true }),
    supabase.from('routines').select('*').is('owner_id', null).eq('published', true)
      .order('sort_order', { ascending: true }).order('id', { ascending: false }),
    supabase.from('routine_cards').select('*').order('position', { ascending: true }),
    supabase.from('curation_items').select('*').eq('published', true).order('sort_order', { ascending: true }),
  ]);
  const cardRows = cards.data || [];
  const byId = Object.fromEntries(cardRows.map((c) => [c.id, c]));
  // 공식 플리가 먼저, 그 뒤에 회원이 올린 플리
  const plis = [...withCards(rts.data, links.data, byId), ...await loadShared(byId)];
  return { cards: cardRows, byId, plis, reads: reads.data || [] };
}

export default function SelfCheckView({ tab = 'browse', bmtiCode, userProfile, isLoggedIn, onRequireLogin }) {
  const tone = toneOf(axisOf(bmtiCode));
  const userId = isLoggedIn ? userProfile?.id || null : null;
  const [pub, setPub] = useState(null);           // 공개 콘텐츠
  const [saved, setSavedList] = useState([]);     // [{item_type,item_id}] 새 것부터
  const [mine, setMine] = useState([]);           // 내 마이플리
  const [openRead, setOpenRead] = useState(null); // 긴 글 읽을거리
  const [note, setNote] = useState('');

  useEffect(() => {
    let alive = true;
    loadPublic().then((d) => { if (alive) setPub(d); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!userId || !pub) return undefined;
    loadSaved(userId).then((rows) => { if (alive) setSavedList(rows); });
    loadMyPlis(userId, pub.byId).then((rows) => { if (alive) setMine(rows); });
    return () => { alive = false; };
  }, [userId, pub]);

  // 잠깐 뜨는 알림
  useEffect(() => {
    if (!note) return undefined;
    const t = setTimeout(() => setNote(''), 2200);
    return () => clearTimeout(t);
  }, [note]);

  // 서버 숫자는 서버가 올리고, 화면에 보이는 숫자는 여기서 바로 맞춰 준다(새로고침 없이 보이게)
  const LIST = { card: 'cards', routine: 'plis', curation: 'reads' };
  const bumpLocal = useCallback((type, id, field, d) => setPub((p) => (p && LIST[type] ? {
    ...p, [LIST[type]]: p[LIST[type]].map((x) => (x.id === id ? { ...x, [field]: Math.max(0, (Number(x[field]) || 0) + d) } : x)),
  } : p)), []);   // eslint-disable-line react-hooks/exhaustive-deps
  const view = useCallback((type, id) => viewOnce(type, id, () => bumpLocal(type, id, 'view_count', 1)), [bumpLocal]);

  const savedSet = useMemo(() => new Set(saved.map((s) => key(s.item_type, s.item_id))), [saved]);
  const toggle = useCallback(async (type, id) => {
    if (!userId) { if (onRequireLogin) onRequireLogin(); return; }
    const on = !savedSet.has(key(type, id));
    // 먼저 화면을 바꾸고, 서버가 못 받으면 되돌린다
    setSavedList((p) => (on ? [{ item_type: type, item_id: id }, ...p] : p.filter((s) => key(s.item_type, s.item_id) !== key(type, id))));
    setNote(on ? '내 보관함에 담았어요' : '보관함에서 뺐어요');
    const ok = await setSaved(userId, type, id, on);
    if (ok) bumpLocal(type, id, 'save_count', on ? 1 : -1);
    if (!ok) {
      setSavedList((p) => (on ? p.filter((s) => key(s.item_type, s.item_id) !== key(type, id)) : [{ item_type: type, item_id: id }, ...p]));
      setNote('담지 못했어요. 다시 해 주세요.');
    }
  }, [userId, savedSet, onRequireLogin, bumpLocal]);
  const keep = useMemo(() => ({ has: (type, id) => savedSet.has(key(type, id)), toggle, view }), [savedSet, toggle, view]);

  // 보관함에 보일 것 — 보관한 차례대로
  const box = useMemo(() => {
    if (!pub) return { plis: [], cards: [], reads: [] };
    const pick = (type, list) => saved.filter((s) => s.item_type === type)
      .map((s) => list.find((x) => x.id === s.item_id)).filter(Boolean);
    return { plis: pick('routine', pub.plis), cards: pick('card', pub.cards), reads: pick('curation', pub.reads) };
  }, [pub, saved]);

  // 회원이 올린 플리 목록을 다시 읽는다 — 공개·비공개를 바꾸거나 지운 뒤 바로플리에 바로 반영되게
  const reloadShared = async () => {
    const shared = await loadShared(pub.byId);
    setPub((p) => (p ? { ...p, plis: [...p.plis.filter((r) => !r.owner_id), ...shared] } : p));
  };
  // 바로플리 목록 — 내가 올린 것은 '내 것'으로 표시해 보관 버튼을 두지 않는다
  const baroList = useMemo(() => (pub ? pub.plis.map((r) => (r.owner_id && r.owner_id === userId ? { ...r, mine: true } : r)) : []), [pub, userId]);

  const onSaveMine = async (p) => {
    if (!userId) { if (onRequireLogin) onRequireLogin(); return; }
    const r = await saveMyPli(userId, p);
    if (!r.ok) { window.alert(r.why); return; }
    setNote(p.share === 'public' ? '바로플리에 올렸어요' : p.id ? '마이플리를 고쳤어요' : '마이플리를 만들었어요');
    setMine(await loadMyPlis(userId, pub.byId));
    reloadShared();
  };
  const onDeleteMine = async (id) => {
    const ok = await deleteMyPli(userId, id);
    if (!ok) { window.alert('지우지 못했어요. 잠시 후 다시 해 주세요.'); return; }
    setNote('마이플리를 지웠어요');
    setMine((p) => p.filter((x) => x.id !== id));
    reloadShared();
  };

  if (!pub) {
    return <div style={{ padding: '40px 0', textAlign: 'center', color: SUB, fontSize: 13, fontWeight: 700 }}>불러오는 중…</div>;
  }

  return (
    <KeepContext.Provider value={keep}>
      <div style={{ paddingBottom: 20 }}>
        {tab === 'browse' && (
          <BrowseView cards={pub.cards} reads={pub.reads} tone={tone} bmtiCode={bmtiCode} onOpenRead={(r) => { view('curation', r.id); setOpenRead(r); }} />
        )}
        {tab === 'baro' && <BaroPliView routines={baroList} tone={tone} bmtiCode={bmtiCode} />}
        {tab === 'box' && (userId ? (
          <BoxView nickname={userProfile?.nickname || '회원'} bmtiCode={bmtiCode} tone={tone}
            plis={box.plis} cards={box.cards} reads={box.reads} myPlis={mine} allCards={pub.cards}
            onOpenRead={setOpenRead} onSaveMine={onSaveMine} onDeleteMine={onDeleteMine} />
        ) : (
          <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: '34px 16px', textAlign: 'center', color: SUB,
            fontSize: 13, fontWeight: 700, lineHeight: 1.7 }}>
            로그인하면 마음에 드는 바로카드·플리·읽을거리를<br />보관하고, 나만의 마이플리를 만들 수 있어요.
            <div>
              <button type="button" onClick={onRequireLogin}
                style={{ marginTop: 14, border: 'none', borderRadius: 999, padding: '10px 18px', background: '#FEE500', color: '#3C1E1E',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>3초 로그인/회원가입</button>
            </div>
          </div>
        ))}
      </div>

      {/* 긴 글 읽을거리 — 카드뉴스가 아닌 글은 한 장으로 펼쳐 본다 */}
      {openRead && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#fff', overflowY: 'auto', padding: '16px 16px 40px' }}>
          <button type="button" onClick={() => setOpenRead(null)} aria-label="닫기"
            style={{ position: 'sticky', top: 0, zIndex: 2, width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#F4F1EB',
              fontSize: 18, fontWeight: 800, color: INK, cursor: 'pointer', marginBottom: 10 }}>‹</button>
          <CurationDetail item={openRead} tone={tone} onSave={() => keep.toggle('curation', openRead.id)} />
        </div>
      )}

      {note && (
        <div role="status" style={{ position: 'fixed', left: '50%', bottom: 96, transform: 'translateX(-50%)', zIndex: 90,
          background: 'rgba(28,26,23,0.9)', color: '#fff', borderRadius: 999, padding: '9px 16px', fontSize: 12.5, fontWeight: 700,
          whiteSpace: 'nowrap' }}>{note}</div>
      )}
    </KeepContext.Provider>
  );
}
