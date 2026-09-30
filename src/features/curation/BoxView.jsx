// 내 보관함 — 담아 둔 것을 한자리에서 본다.
//
// 위는 읽기만 하는 요약이다. 고치는 건 화면 위쪽 마이페이지에서 한다.
// 두 군데서 고치게 두면 어디가 진짜인지 헷갈린다.
import { useState } from 'react';
import { CurationThumb } from './CurationCard';
import CardFeed from './CardFeed';
import PliFeed from './PliFeed';
import PickRow from './PickRow';
import PliGrid from './PliGrid';
import { mmss } from './format';
import { cardTotalSec } from './cardDefaults';
import { cardCount } from './newsSlides';
import { readMin } from './browseOrder';
import { CHARACTERS } from '../../data';
import { CHARACTER_NAMES } from '../../lib/bmtiTypes';
import { axisOf } from './typeTint';
import MyPliEditor from './MyPliEditor';
import { usePanelTime } from '../../lib/usePanelTime';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A';

// 플리는 둘로 나눈다.
//   마이플리 … 내가 만들었거나 고친 것. 여기서 고친다.
//   바로플리 … 공식·다른 이용자가 올린 것을 보관만 한 것. 고치지 않는다 —
//             고치고 싶으면 '가져와 고치기'로 복사본을 마이플리에 만든다.
const TABS = [['mine', '마이플리'], ['pli', '바로플리'], ['card', '바로카드'], ['read', '읽을거리']];
const EMPTY_WORD = {
  mine: '아직 만든 플리가 없어요.\n좋아하는 바로카드를 골라 나만의 플리를 만들어 보세요.',
  pli: '담아 둔 바로플리가 없어요.\n마음에 드는 묶음을 만나면 보관해 두세요.',
  card: '담아 둔 동작이 없어요.\n다시 하고 싶은 동작을 보관해 두세요.',
  read: '담아 둔 읽을거리가 없어요.\n두고두고 볼 글을 보관해 두세요.',
};

export default function BoxView({ nickname = '회원', bmtiCode, tone = 'z',
  plis = [], myPlis = [], cards = [], reads = [], allCards = [], onOpenRead, onSaveMine, onDeleteMine }) {
  usePanelTime('box');   // 행동 기록 — 이 창에 머문 시간
  const [tab, setTab] = useState('mine');
  const [editing, setEditing] = useState(null);   // 마이플리 만들기·고치기 창 { id?, title, cards, from? }
  const [editMode, setEditMode] = useState(false);   // 마이플리 편집하기 — 켜면 플리를 눌러 고친다
  const [openId, setOpenId] = useState(null);
  const [openPli, setOpenPli] = useState(null);   // 한 편씩 넘겨 보는 창

  const myCode = axisOf(bmtiCode);
  const ch = CHARACTERS.find((c) => c.id === myCode);
  const partner = String(CHARACTER_NAMES[myCode] || '').replace(/\n/g, ' ');
  const grid = tab === 'card' ? cards : tab === 'read' ? reads : [];

  return (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      {/* 위 — 읽기만 하는 요약. 고치는 건 위쪽 마이페이지에서 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 14px' }}>
        <span style={{ width: 62, height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {ch ? <img src={ch.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span style={{ fontSize: 34 }}>⭐️</span>}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 900, letterSpacing: '-0.02em' }}>{nickname}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: SUB, marginTop: 2 }}>
            {partner || '내 파트너'}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: GOLD_INK, marginTop: 6 }}>
            마이플리 {myPlis.length} · 바로플리 {plis.length} · 카드 {cards.length} · 읽을거리 {reads.length}
          </div>
        </div>
      </div>

      {/* 갈래 고르개 — 둘러보기와 같은 모양으로 */}
      <PickRow tabs={TABS} value={tab} onPick={setTab} />

      {tab === 'mine' ? (
        <>
          {/* 새로 만들기와 편집하기를 나란히 — 편집하기를 누르면 플리를 눌러 고친다 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button type="button" onClick={() => { setEditMode(false); setEditing({ title: '', cards: [] }); }}
              style={{ flex: 1, border: `1.5px dashed ${LINE}`, background: '#fff', borderRadius: 12, padding: 12,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, color: GOLD_INK }}>
              ＋ 새 플리 만들기
            </button>
            <button type="button" disabled={myPlis.length === 0} onClick={() => setEditMode((v) => !v)}
              style={{ flex: 1, border: editMode ? 'none' : `1.5px solid ${LINE}`, borderRadius: 12, padding: 12,
                background: editMode ? GOLD_INK : '#fff', color: editMode ? '#fff' : (myPlis.length ? GOLD_INK : SUB),
                cursor: myPlis.length ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
                opacity: myPlis.length ? 1 : 0.6 }}>
              {editMode ? '✓ 편집 끝내기' : '✎ 편집하기'}
            </button>
          </div>
          {editMode && (
            <div style={{ fontSize: 11.5, fontWeight: 700, color: SUB, textAlign: 'center', margin: '0 0 10px' }}>
              고칠 플리를 눌러 주세요.
            </div>
          )}
          <PliGrid plis={myPlis} tone={tone} empty={EMPTY_WORD.mine} editMode={editMode} maker={false}
            onOpen={(r) => (editMode
              ? setEditing({ id: r.id, title: r.title_z, cards: r.cards || [], showNick: !!r.show_nick })
              : setOpenPli(r))} />
        </>
      ) : tab === 'pli' ? (
        <PliGrid plis={plis} tone={tone} onOpen={(r) => setOpenPli(r)} empty={EMPTY_WORD.pli}
          action={{ label: '가져와 고치기', onClick: (r) => {
            const t = tone === 'm' ? (r.title_m || r.title_z) : (r.title_z || r.title_m);
            if (window.confirm(`'${t}'을 마이플리로 가져와 고칠까요?\n원래 바로플리는 그대로 두고, 고친 것은 마이플리에 새로 저장돼요.`)) {
              setEditing({ title: t, cards: [...(r.cards || [])], from: t, sourceId: r.id });
            }
          } }} />
      ) : grid.length === 0 ? <Empty text={EMPTY_WORD[tab]} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
          {grid.map((item) => {
            const read = tab === 'read';
            const slides = cardCount((tone === 'm' ? item.slides_m : item.slides_z) || []);
            const mark = read ? (slides > 0 ? `${slides}장` : `${readMin(item, tone)}분`)
              : (cardTotalSec(item) > 0 ? mmss(cardTotalSec(item)) : '');
            return (
              <button key={item.id} type="button"
                onClick={() => (read ? onOpenRead && onOpenRead(item) : setOpenId(item.id))}
                style={{ position: 'relative', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
                <CurationThumb item={item} radius={2} ratio="4 / 5" showRead={false}
                  clip={read ? '' : (item.video_url || '')} emptyText="" />
                {mark && (
                  <span style={{ position: 'absolute', right: 5, bottom: 5, fontSize: 9.5, fontWeight: 800,
                    color: read ? GOLD_INK : INK, background: read ? YELLOW : '#fff',
                    borderRadius: 6, padding: '2px 5px', lineHeight: 1.2 }}>
                    {mark}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {openId != null && (
        <CardFeed cards={cards} startId={openId} tone={tone} bmtiCode={bmtiCode} onClose={() => setOpenId(null)} />
      )}
      {openPli && (
        <PliFeed plis={tab === 'mine' ? myPlis : plis} startId={openPli.id} tone={tone} bmtiCode={bmtiCode}
          onClose={() => setOpenPli(null)} />
      )}
      {editing && (
        <MyPliEditor initial={editing} allCards={allCards} tone={tone} onCancel={() => setEditing(null)}
          onDelete={editing.id && onDeleteMine ? () => { onDeleteMine(editing.id); setEditing(null); setEditMode(false); } : null}
          onSave={(p) => { setEditing(null); setEditMode(false); setTab('mine'); onSaveMine && onSaveMine(p); }} />
      )}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: '30px 16px', textAlign: 'center',
      fontSize: 12.5, color: SUB, fontWeight: 600, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{text}</div>
  );
}
