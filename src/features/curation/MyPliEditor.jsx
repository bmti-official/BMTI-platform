// 마이플리 만들기·고치기 — 이용자가 바로카드를 골라 자기 플리로 묶는다.
//
// 처음부터 만들 때도, 보관한 바로플리를 가져와 고칠 때도 이 창을 쓴다.
// 가져와 고칠 땐 복사본을 고친다 — 원래 바로플리는 그대로 둔다.
import { useState } from 'react';
import { CurationThumb } from './CurationCard';
import { pickCardTone, routineSummary, mmss } from './format';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const GOLD = '#C9975A', YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A';
const MAX_CARDS = 12;

/** initial: { id?, title, cards: [...] } · allCards: 고를 수 있는 바로카드 */
export default function MyPliEditor({ initial, allCards = [], tone = 'z', onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [cards, setCards] = useState(initial?.cards || []);
  const [picking, setPicking] = useState(false);
  const s = routineSummary(cards);
  const ok = title.trim().length > 0 && cards.length > 0;

  const move = (i, d) => setCards((p) => {
    const n = [...p]; const j = i + d;
    if (j < 0 || j >= n.length) return p;
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });
  const drop = (i) => setCards((p) => p.filter((_, k) => k !== i));
  const toggle = (c) => setCards((p) => (p.some((x) => x.id === c.id)
    ? p.filter((x) => x.id !== c.id)
    : p.length >= MAX_CARDS ? p : [...p, c]));

  const chip = { border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: '#fff', borderRadius: 8,
    boxShadow: `inset 0 0 0 1px ${LINE}`, color: SUB, fontSize: 12, fontWeight: 900, width: 28, height: 28 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 95, background: '#fff', display: 'flex', flexDirection: 'column',
      fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      {/* 머리 */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '14px 14px 10px', borderBottom: `1px solid ${LINE}` }}>
        <button type="button" onClick={onCancel} aria-label="닫기"
          style={{ border: 'none', background: 'transparent', fontSize: 20, fontWeight: 800, cursor: 'pointer', color: INK, padding: '0 6px' }}>‹</button>
        <span style={{ flex: 1, fontSize: 15.5, fontWeight: 900 }}>{initial?.id ? '마이플리 고치기' : '마이플리 만들기'}</span>
        <button type="button" disabled={!ok} onClick={() => onSave({ id: initial?.id, title: title.trim(), cards })}
          style={{ border: 'none', cursor: ok ? 'pointer' : 'default', fontFamily: 'inherit', borderRadius: 999, padding: '8px 16px',
            fontSize: 13, fontWeight: 800, background: ok ? GOLD : '#F1EEE8', color: ok ? '#fff' : '#C6C0B5' }}>
          저장
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 14px 30px' }}>
        {initial?.from && (
          <div style={{ fontSize: 11.5, fontWeight: 700, color: GOLD_INK, background: YELLOW, borderRadius: 10, padding: '8px 11px',
            marginBottom: 12, lineHeight: 1.6 }}>
            &lsquo;{initial.from}&rsquo;을 가져왔어요. 고친 것은 마이플리에 새로 저장되고, 원래 바로플리는 그대로예요.
          </div>
        )}
        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: SUB, marginBottom: 6 }}>플리 이름</label>
        <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 30))} placeholder="예: 퇴근 후 목·어깨 풀기"
          style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, padding: '11px 12px',
            borderRadius: 11, border: `1px solid ${LINE}`, marginBottom: 16 }} />

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: SUB }}>담은 동작 {cards.length}개</span>
          {s.durationSec > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: GOLD_INK }}>다 하면 {mmss(s.durationSec)}</span>}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: SUB, fontWeight: 600 }}>최대 {MAX_CARDS}개</span>
        </div>

        {cards.length === 0 && (
          <div style={{ border: `1px dashed ${LINE}`, borderRadius: 12, padding: '22px 12px', textAlign: 'center', fontSize: 12.5,
            color: SUB, fontWeight: 600, marginBottom: 10 }}>아래 &lsquo;동작 더하기&rsquo;로 바로카드를 골라 담아 보세요.</div>
        )}
        <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
          {cards.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 6, borderRadius: 12, background: '#FAF7F0' }}>
              <span style={{ width: 22, textAlign: 'center', fontSize: 12, fontWeight: 900, color: GOLD_INK }}>{i + 1}</span>
              <div style={{ width: 44, flexShrink: 0 }}>
                <CurationThumb item={c} radius={7} ratio="4 / 5" showRead={false} clip="" emptyText="" />
              </div>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, lineHeight: 1.4, wordBreak: 'keep-all' }}>
                {pickCardTone(c, tone).title}
              </span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로" style={{ ...chip, opacity: i === 0 ? 0.35 : 1 }}>↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === cards.length - 1} aria-label="아래로"
                style={{ ...chip, opacity: i === cards.length - 1 ? 0.35 : 1 }}>↓</button>
              <button type="button" onClick={() => drop(i)} aria-label="빼기" style={{ ...chip, color: '#B23B36' }}>✕</button>
            </div>
          ))}
        </div>

        <button type="button" onClick={() => setPicking((v) => !v)}
          style={{ width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 12, padding: 12,
            fontSize: 13, fontWeight: 800, background: '#fff', color: INK, boxShadow: '0 3px 10px rgba(217,185,106,0.45)' }}>
          {picking ? '동작 고르기 닫기 ▴' : '＋ 동작 더하기'}
        </button>

        {/* 바로카드 고르기 — 누르면 담기·빼기 */}
        {picking && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 12 }}>
            {allCards.map((c) => {
              const on = cards.some((x) => x.id === c.id);
              return (
                <button key={c.id} type="button" onClick={() => toggle(c)}
                  style={{ position: 'relative', border: 'none', padding: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'inherit' }}>
                  <div style={{ borderRadius: 9, overflow: 'hidden', boxShadow: on ? `0 0 0 2.5px ${GOLD}` : 'none' }}>
                    <CurationThumb item={c} radius={0} ratio="4 / 5" showRead={false} clip="" emptyText="" />
                  </div>
                  {on && (
                    <span style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: '50%', background: GOLD,
                      color: '#fff', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {cards.findIndex((x) => x.id === c.id) + 1}
                    </span>
                  )}
                  <div style={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1.35, marginTop: 4, wordBreak: 'keep-all',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {pickCardTone(c, tone).title}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
