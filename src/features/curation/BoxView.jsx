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
import { readMin } from './browseOrder';
import { CHARACTERS } from '../../data';
import { CHARACTER_NAMES } from '../../lib/bmtiTypes';
import { axisOf } from './typeTint';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A';

const TABS = [['pli', '플리'], ['card', '바로카드'], ['read', '읽을거리']];
const EMPTY_WORD = {
  pli: '담아 둔 플리가 없어요.\n마음에 드는 묶음을 만나면 보관해 두세요.',
  card: '담아 둔 동작이 없어요.\n다시 하고 싶은 동작을 보관해 두세요.',
  read: '담아 둔 읽을거리가 없어요.\n두고두고 볼 글을 보관해 두세요.',
};

export default function BoxView({ nickname = '회원', bmtiCode, tone = 'z',
  plis = [], cards = [], reads = [], onOpenRead }) {
  const [tab, setTab] = useState('pli');
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
            플리 {plis.length} · 카드 {cards.length} · 읽을거리 {reads.length}
          </div>
        </div>
      </div>

      {/* 갈래 고르개 — 둘러보기와 같은 모양으로 */}
      <PickRow tabs={TABS} value={tab} onPick={setTab} />

      {tab === 'pli' ? (
        <PliGrid plis={plis} tone={tone} onOpen={(r) => setOpenPli(r)} empty={EMPTY_WORD.pli} />
      ) : grid.length === 0 ? <Empty text={EMPTY_WORD[tab]} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
          {grid.map((item) => {
            const read = tab === 'read';
            const slides = (item.slides || []).length;
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
        <PliFeed plis={plis} startId={openPli.id} tone={tone} bmtiCode={bmtiCode}
          onClose={() => setOpenPli(null)} />
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
