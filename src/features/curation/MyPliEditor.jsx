// 마이플리 만들기·고치기 — 이용자가 바로카드를 골라 자기 플리로 묶는다.
//
// 처음부터 만들 때도, 보관한 바로플리를 가져와 고칠 때도 이 창을 쓴다.
// 가져와 고칠 땐 복사본을 고친다 — 원래 바로플리는 그대로 둔다.
import { useRef, useState } from 'react';
import { CurationThumb } from './CurationCard';
import { pickCardTone, routineSummary, mmss } from './format';
import { cardSetup, cardTotalSec, REST_LIST } from './cardDefaults';
import { withRoutineSetup } from './routineSetup';
import { badNameReason } from '../../lib/nameFilter';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const GOLD = '#C9975A', YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A';
const MAX_CARDS = 12;
const PER_PAGE = 4;
// 바로카드와 같은 고르개 — 좌우는 카드가 좌우를 나누는 동작일 때만
const SIDE_OPTS = [['right', '우'], ['left', '좌'], ['both', '한쪽씩 둘 다'], ['alt', '좌우 번갈아']];
const GUIDE_OPTS = [['talk', '설명 들으며'], ['count', '숫자만']];

/** initial: { id?, title, cards: [...] } · allCards: 고를 수 있는 바로카드 */
export default function MyPliEditor({ initial, allCards = [], tone = 'z', onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [cards, setCards] = useState(initial?.cards || []);
  const [picking, setPicking] = useState(false);
  const [openSet, setOpenSet] = useState(null);      // 설정을 펼친 동작(id)
  // 바로플리에 올릴 때 만든 사람을 어떻게 보일지 — 기본은 유형 캐릭터만
  const [showNick, setShowNick] = useState(!!initial?.showNick);
  // 시간은 동작마다 고른 횟수·세트·쉬는 시간으로 센다
  const s = routineSummary(cards.map(withRoutineSetup));
  const setOf = (c) => cardSetup(withRoutineSetup(c));
  const change = (id, key, v) => setCards((p) => p.map((c) => (c.id === id ? { ...c, [key]: v } : c)));
  const guideOf = (c) => c.rc_guide || 'talk';
  const sideOf = (c) => c.rc_side || c.default_side || 'both';
  const pill = (on) => ({ border: 'none', cursor: 'pointer', fontFamily: 'inherit', height: 28, padding: '0 10px', borderRadius: 8,
    fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap', color: on ? GOLD_INK : SUB, background: on ? YELLOW : '#fff',
    boxShadow: on ? `inset 0 0 0 1.5px ${GOLD}` : `inset 0 0 0 1px ${LINE}` });
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
        <button type="button" disabled={!ok} onClick={() => {
          const bad = badNameReason(title);
          if (bad) { window.alert(`플리 이름에 쓸 수 없는 말(${bad})이 들어 있어요. 다른 이름을 적어 주세요.`); return; }
          onSave({ id: initial?.id, title: title.trim(), cards, showNick });
        }}
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
          {cards.map((c, i) => {
            const cs = setOf(c);
            const on = openSet === c.id;
            const sel = { fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, padding: '5px 6px', borderRadius: 8, border: `1px solid ${LINE}`, background: '#fff' };
            return (
            <div key={c.id} style={{ borderRadius: 12, background: '#FAF7F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 6 }}>
              <span style={{ width: 22, textAlign: 'center', fontSize: 12, fontWeight: 900, color: GOLD_INK }}>{i + 1}</span>
              <div style={{ width: 44, flexShrink: 0 }}>
                <CurationThumb item={c} radius={7} ratio="4 / 5" showRead={false} clip="" emptyText="" />
              </div>
              <button type="button" onClick={() => setOpenSet(on ? null : c.id)}
                style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, lineHeight: 1.4, wordBreak: 'keep-all', color: INK }}>
                  {pickCardTone(c, tone).title}
                </span>
                <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: GOLD_INK, marginTop: 2 }}>
                  {cs.reps}회 · {cs.sets}세트 · 쉬기 {cs.rest}초{guideOf(c) === 'count' ? ' · 숫자만' : ''}
                  {c.has_side ? ` · ${(SIDE_OPTS.find(([k]) => k === sideOf(c)) || [])[1] || ''}` : ''} {on ? '▴' : '▾'}
                </span>
              </button>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로" style={{ ...chip, opacity: i === 0 ? 0.35 : 1 }}>↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === cards.length - 1} aria-label="아래로"
                style={{ ...chip, opacity: i === cards.length - 1 ? 0.35 : 1 }}>↓</button>
              <button type="button" onClick={() => drop(i)} aria-label="빼기" style={{ ...chip, color: '#B23B36' }}>✕</button>
            </div>
            {/* 동작마다 바로카드와 같은 설정 — 횟수·세트·쉬는 시간·안내·좌우. 비워 두면 카드 기본값 */}
            <div style={{ display: 'grid', gridTemplateRows: on ? '1fr' : '0fr', transition: 'grid-template-rows .25s ease, visibility .25s', visibility: on ? 'visible' : 'hidden' }}>
              <div style={{ overflow: 'hidden', minHeight: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '2px 10px 10px 38px', fontSize: 11.5, fontWeight: 800, color: SUB }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    횟수
                    <select value={cs.reps} onChange={(e) => change(c.id, 'rc_reps', Number(e.target.value))} style={sel}>
                      {cs.repList.map((n) => <option key={n} value={n}>{n}회</option>)}
                    </select>
                    세트
                    <select value={cs.sets} onChange={(e) => change(c.id, 'rc_sets', Number(e.target.value))} style={sel}>
                      {cs.setList.map((n) => <option key={n} value={n}>{n}세트</option>)}
                    </select>
                    쉬는 시간
                    <select value={cs.rest} onChange={(e) => change(c.id, 'rc_rest', Number(e.target.value))} style={sel}>
                      {REST_LIST.map((n) => <option key={n} value={n}>{n}초</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    안내
                    {GUIDE_OPTS.map(([k, lb]) => (
                      <button key={k} type="button" onClick={() => change(c.id, 'rc_guide', k)} style={pill(guideOf(c) === k)}>{lb}</button>
                    ))}
                  </div>
                  {c.has_side && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      좌우
                      {SIDE_OPTS.filter(([k]) => k !== 'alt' || c.can_alternate).map(([k, lb]) => (
                        <button key={k} type="button" onClick={() => change(c.id, 'rc_side', k)} style={pill(sideOf(c) === k)}>{lb}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
            );
          })}
        </div>

        <button type="button" onClick={() => setPicking((v) => !v)}
          style={{ width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 12, padding: 12,
            fontSize: 13, fontWeight: 800, background: '#fff', color: INK, boxShadow: '0 3px 10px rgba(217,185,106,0.45)' }}>
          {picking ? '동작 고르기 닫기 ▴' : '＋ 동작 더하기'}
        </button>

        {/* 바로카드 고르기 — 둘러보기와 같은 칸(영상·표지 문구·시간), 두 줄 둘씩 넷, 옆으로 넘긴다. 누르면 담기·빼기 */}
        {picking && <CardPicker allCards={allCards} chosen={cards} onToggle={toggle} />}
        {/* 바로플리에 올릴 때 만든 사람 표시 — 기본은 유형 캐릭터만 */}
        <div style={{ marginTop: 16, padding: '11px 12px', borderRadius: 12, background: '#FAF7F0' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: INK, marginBottom: 7 }}>바로플리에 올릴 때 만든 사람 표시</div>
          {[[false, '유형 캐릭터만'], [true, '닉네임 + 유형 캐릭터']].map(([v, lb]) => (
            <label key={lb} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: INK, padding: '3px 0', cursor: 'pointer' }}>
              <input type="radio" checked={showNick === v} onChange={() => setShowNick(v)} style={{ accentColor: GOLD }} />
              {lb}{!v && <span style={{ fontSize: 11, color: SUB }}>(기본)</span>}
            </label>
          ))}
        </div>

      </div>
    </div>
  );
}

// 바로카드 고르개 — 한 쪽에 둘씩 두 줄(넷). 옆으로 밀거나 ‹ ›를 누르면 다음 넷으로 부드럽게 넘어간다.
// 영상은 보이는 쪽과 그 옆 쪽만 튼다(한꺼번에 다 틀면 무겁다).
function CardPicker({ allCards, chosen, onToggle }) {
  const trackRef = useRef(null);
  const [page, setPage] = useState(0);
  const pages = [];
  for (let i = 0; i < allCards.length; i += PER_PAGE) pages.push(allCards.slice(i, i + PER_PAGE));
  const go = (n) => {
    const t = trackRef.current;
    if (!t) return;
    const k = Math.max(0, Math.min(pages.length - 1, n));
    t.scrollTo({ left: k * t.clientWidth, behavior: 'smooth' });
  };
  const onScroll = () => {
    const t = trackRef.current;
    if (t && t.clientWidth) setPage(Math.round(t.scrollLeft / t.clientWidth));
  };
  if (allCards.length === 0) {
    return <div style={{ marginTop: 12, fontSize: 12, color: SUB, fontWeight: 700, textAlign: 'center' }}>고를 수 있는 바로카드가 없어요.</div>;
  }
  const arrow = (dis) => ({ border: 'none', cursor: dis ? 'default' : 'pointer', fontFamily: 'inherit', width: 30, height: 30, borderRadius: '50%',
    background: '#fff', boxShadow: `inset 0 0 0 1px ${LINE}`, color: dis ? '#D8D2C8' : INK, fontSize: 16, fontWeight: 900 });
  return (
    <div style={{ marginTop: 12 }}>
      <div ref={trackRef} onScroll={onScroll} className="bmti-pick-track"
        style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <style>{'.bmti-pick-track::-webkit-scrollbar{display:none}'}</style>
        {pages.map((group, pi) => (
          <div key={pi} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 4, alignContent: 'start' }}>
            {group.map((c) => {
              const at = chosen.findIndex((x) => x.id === c.id);
              const sec = cardTotalSec(c);
              return (
                <button key={c.id} type="button" onClick={() => onToggle(c)}
                  style={{ position: 'relative', border: 'none', padding: 0, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <CurationThumb item={c} radius={2} ratio="4 / 5" showRead={false}
                    clip={Math.abs(pi - page) <= 1 ? (c.video_url || '') : ''} emptyText="" />
                  {sec > 0 && (
                    <span style={{ position: 'absolute', right: 5, bottom: 5, fontSize: 9.5, fontWeight: 800, color: INK, background: '#fff',
                      borderRadius: 6, padding: '2px 5px', lineHeight: 1.2 }}>{mmss(sec)}</span>
                  )}
                  {at >= 0 && (
                    <>
                      <span style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 0 3px ${GOLD}`, pointerEvents: 'none' }} />
                      <span style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: GOLD,
                        color: '#fff', fontSize: 11.5, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {at + 1}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {pages.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
          <button type="button" aria-label="이전" disabled={page === 0} onClick={() => go(page - 1)} style={arrow(page === 0)}>‹</button>
          <span style={{ display: 'flex', gap: 5 }}>
            {pages.map((_, i) => (
              <span key={i} style={{ width: i === page ? 14 : 6, height: 6, borderRadius: 3, background: i === page ? GOLD : '#E4DED3',
                transition: 'width .2s' }} />
            ))}
          </span>
          <button type="button" aria-label="다음" disabled={page >= pages.length - 1} onClick={() => go(page + 1)}
            style={arrow(page >= pages.length - 1)}>›</button>
        </div>
      )}
    </div>
  );
}
