// 바로플리 — 플레이리스트와 바로카드를 한 화면에서 오간다.
//  · 바로플리 : 인스타 게시물처럼 한 줄에 하나씩
//  · 바로카드 : 인스타 돋보기처럼 가로 셋씩
// 위쪽 알약을 누르거나 좌우로 밀어 옮긴다.
import { useRef, useState } from 'react';
import { CurationThumb } from './CurationCard';
import RoutineView from './RoutineView';
import { KIND_LABEL, fmtCount } from './format';
import { CHARACTERS } from '../../data';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC';
const KIND_INK = { exercise: '#8B7BD8', massage: '#E08B57', stretch: '#6FAE6A' };

const TABS = [['pli', '바로플리'], ['card', '바로카드']];

// 골라 둔 누끼 캐릭터를 그림 주소로 바꿔 넘긴다.
function charProps(r, tone) {
  const codes = ((tone === 'm' ? r?.chars_m : r?.chars_z) || []).filter(Boolean);
  return { charCodes: codes, charImages: codes.map((id) => CHARACTERS.find((c) => c.id === id)?.image).filter(Boolean) };
}

export default function BaroPliView({ routines = [], cards = [], tone = 'z', onOpenRoutine, onOpenCard }) {
  const [tab, setTab] = useState('pli');
  // 좌우로 밀어서도 옮긴다 — 알약을 누르지 않아도 되게.
  const swipe = useRef({ x: 0, on: false });
  const onDown = (e) => { swipe.current = { x: e.clientX, on: true }; };
  const onUp = (e) => {
    if (!swipe.current.on) return;
    const dx = e.clientX - swipe.current.x;
    swipe.current.on = false;
    if (Math.abs(dx) < 48) return;
    setTab(dx < 0 ? 'card' : 'pli');
  };

  return (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}
      onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { swipe.current.on = false; }}>

      {/* 알약 — 고른 쪽으로 흰 칸이 미끄러진다 */}
      <div style={{ position: 'relative', display: 'flex', background: YELLOW, borderRadius: 999, padding: 4, marginBottom: 14 }}>
        <div style={{ position: 'absolute', top: 4, bottom: 4, left: 4, width: 'calc((100% - 8px) / 2)',
          transform: `translateX(${tab === 'card' ? 100 : 0}%)`, background: '#fff', borderRadius: 999,
          boxShadow: '0 1px 3px rgba(28,26,23,0.12)', transition: 'transform .3s cubic-bezier(.34,1.45,.5,1)' }} />
        {TABS.map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            style={{ position: 'relative', zIndex: 1, flex: 1, border: 'none', cursor: 'pointer', borderRadius: 999,
              padding: '9px 0', fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit', background: 'transparent',
              color: tab === key ? INK : SUB, transition: 'color .2s' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'pli' ? (
        // 게시물처럼 한 줄에 하나씩
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {routines.length === 0 && <Empty text="아직 담긴 플리가 없어요." />}
          {routines.map((r) => (
            <RoutineView key={r.id} routine={r} cards={r.cards || []} tone={tone}
              onStart={() => onOpenRoutine && onOpenRoutine(r)}
              onBrowse={() => onOpenRoutine && onOpenRoutine(r)}
              {...charProps(r, tone)} />
          ))}
        </div>
      ) : (
        // 돋보기처럼 가로 셋씩
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
          {cards.length === 0 && <div style={{ gridColumn: '1 / -1' }}><Empty text="아직 등록된 동작이 없어요." /></div>}
          {cards.map((c) => (
            <button key={c.id} type="button" onClick={() => onOpenCard && onOpenCard(c)}
              style={{ position: 'relative', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
              <CurationThumb item={c} radius={2} ratio="4 / 5" showRead={false} clip={c.video_url || ''} emptyText="" />
              {/* 왼쪽 위 종류 — 색만으로도 갈래가 보인다 */}
              <span style={{ position: 'absolute', top: 5, left: 5, fontSize: 9.5, fontWeight: 900,
                color: KIND_INK[c.kind] || SUB, background: '#fff', borderRadius: 6, padding: '2px 5px', lineHeight: 1.2 }}>
                {KIND_LABEL[c.kind] || c.kind}
              </span>
              {/* 오른쪽 아래 조회 */}
              <span style={{ position: 'absolute', right: 5, bottom: 5, fontSize: 9.5, fontWeight: 800,
                color: INK, background: '#fff', borderRadius: 6, padding: '2px 5px', lineHeight: 1.2 }}>
                {fmtCount(c.view_count)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: '26px 16px', textAlign: 'center',
      fontSize: 13, color: SUB, fontWeight: 600 }}>{text}</div>
  );
}
