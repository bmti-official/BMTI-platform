// 플리 만들기·고치기 — 바디카드를 골라 한 플리로 묶는다.
//
// 이용자의 마이플리도, 관리자의 공식 바디플리도 이 창 하나로 만든다(만드는 방식이 같아야 해서).
// 처음부터 만들 때도, 보관한 바디플리를 가져와 고칠 때도 쓴다.
// 가져와 고칠 땐 복사본을 고친다 — 원래 바디플리는 그대로 둔다.
import { useEffect, useRef, useState } from 'react';
import { CurationThumb } from './CurationCard';
import PliCover from './PliCover';
import { cardShortName, routineSummary, mmss } from './format';
import { cardSetup, cardTotalSec, REST_LIST } from './cardDefaults';
import { withRoutineSetup } from './routineSetup';
import { badNameReason } from '../../lib/nameFilter';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const GOLD = '#C9975A', YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A';
const MAX_CARDS = 12;
const COVER_MAX = 24;      // 표지 문구 — 두 줄, 스물네 자까지
// 바디카드와 같은 고르개 — 좌우는 카드가 좌우를 나누는 동작일 때만
const SIDE_OPTS = [['right', '우'], ['left', '좌'], ['both', '한쪽씩 둘 다'], ['alt', '좌우 번갈아']];
const GUIDE_OPTS = [['talk', '설명 들으며'], ['count', '숫자만']];

/**
 * initial: { id?, title, cards: [...], coverText? } · allCards: 고를 수 있는 바디카드
 * 관리자 화면에서 쓸 때만 넘기는 것 —
 *   official: 공식 바디플리(공개·비공개만 고르고, 만든 사람 표시는 없다)
 *   inline: 화면을 덮지 않고 그 자리에 놓는다 · heading: 머리글 · saving: 저장 중
 *   extra: 표지 문구 아래에 더 놓을 칸 · onPeek(지금 내용): 미리보기 · onDraft(지금 내용): 고칠 때마다 알림
 */
export default function MyPliEditor({ initial, allCards = [], tone = 'z', onSave, onCancel, onDelete = null,
  official = false, inline = false, heading = '', saving = false, extra = null, onPeek = null, onDraft = null }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [cards, setCards] = useState(initial?.cards || []);
  // 표지 문구 — 비워 두면 표지에 동작 그림만 보인다
  const [coverText, setCoverText] = useState(initial?.coverText || '');
  const [picking, setPicking] = useState(false);
  const [openSet, setOpenSet] = useState(null);      // 설정을 펼친 동작(id)
  // 바디플리에 올릴 때 만든 사람을 어떻게 보일지 — 기본은 유형 캐릭터만
  const [showNick, setShowNick] = useState(!!initial?.showNick);
  // 공개하면 바디플리에 올라가 다른 사람도 본다. 기본은 비공개.
  // 관리자가 숨긴 플리(hidden)는 다시 올릴 수 없다 — 고르개를 잠가 둔다.
  const hidden = initial?.share === 'hidden';
  const [share, setShare] = useState(initial?.share === 'public' ? 'public' : 'private');
  // 시간은 동작마다 고른 횟수·세트·쉬는 시간으로 센다
  const s = routineSummary(cards.map(withRoutineSetup));
  const setOf = (c) => cardSetup(withRoutineSetup(c));
  const change = (id, key, v) => setCards((p) => p.map((c) => (c.id === id ? { ...c, [key]: v } : c)));
  const guideOf = (c) => c.rc_guide || 'talk';
  const sideOf = (c) => c.rc_side || c.default_side || 'both';
  const pill = (on) => ({ border: 'none', cursor: 'pointer', fontFamily: 'inherit', height: 28, padding: '0 10px', borderRadius: 8,
    fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap', color: on ? GOLD_INK : SUB, background: on ? YELLOW : '#fff',
    boxShadow: on ? `inset 0 0 0 1.5px ${GOLD}` : `inset 0 0 0 1px ${LINE}` });
  const ok = title.trim().length > 0 && cards.length > 0 && !saving;
  const draft = () => ({ id: initial?.id, title: title.trim(), cards, coverText: coverText.trim(), showNick,
    sourceId: initial?.sourceId || null, share: hidden ? 'hidden' : share });
  // 관리자 화면 — 저장 안 한 내용이 있는지 알 수 있게, 고칠 때마다 지금 내용을 알린다
  useEffect(() => {
    if (onDraft) onDraft({ title, cards, coverText, share });
  }, [onDraft, title, cards, coverText, share]);
  // 표지 문구는 두 줄까지 — 셋째 줄부터는 받지 않는다
  const typeCover = (v) => setCoverText(v.split('\n').slice(0, 2).join('\n').slice(0, COVER_MAX));

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
    <div style={{ ...(inline ? { position: 'relative', borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden' } : { position: 'fixed', inset: 0, zIndex: 95 }),
      background: '#fff', display: 'flex', flexDirection: 'column',
      fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      {/* 머리 */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '14px 14px 10px', borderBottom: `1px solid ${LINE}` }}>
        <button type="button" onClick={onCancel} aria-label="닫기"
          style={{ border: 'none', background: 'transparent', fontSize: 20, fontWeight: 800, cursor: 'pointer', color: INK, padding: '0 6px' }}>‹</button>
        <span style={{ flex: 1, fontSize: 15.5, fontWeight: 900 }}>{heading || (initial?.id ? '마이플리 고치기' : '마이플리 만들기')}</span>
        {onPeek && (
          <button type="button" onClick={() => onPeek(draft())}
            style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 999, padding: '8px 14px',
              fontSize: 13, fontWeight: 800, background: '#fff', color: SUB, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
            미리보기
          </button>
        )}
        <button type="button" disabled={!ok} onClick={() => {
          // 이름과 표지 문구는 남에게 보일 수 있는 글 — 쓸 수 없는 말을 거른다(서버에서도 한 번 더 본다)
          if (!official) {
            const bad = badNameReason(title);
            if (bad) { window.alert(`플리 이름에 쓸 수 없는 말(${bad})이 들어 있어요. 다른 이름을 적어 주세요.`); return; }
            const badCover = badNameReason(coverText);
            if (badCover) { window.alert(`표지 문구에 쓸 수 없는 말(${badCover})이 들어 있어요. 다른 문구를 적어 주세요.`); return; }
          }
          onSave(draft());
        }}
          style={{ border: 'none', cursor: ok ? 'pointer' : 'default', fontFamily: 'inherit', borderRadius: 999, padding: '8px 16px',
            fontSize: 13, fontWeight: 800, background: ok ? GOLD : '#F1EEE8', color: ok ? '#fff' : '#C6C0B5' }}>
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: inline ? 'visible' : 'auto', padding: '14px 14px 30px' }}>
        {initial?.from && (
          <div style={{ fontSize: 11.5, fontWeight: 700, color: GOLD_INK, background: YELLOW, borderRadius: 10, padding: '8px 11px',
            marginBottom: 12, lineHeight: 1.6 }}>
            &lsquo;{initial.from}&rsquo;을 가져왔어요. 고친 것은 마이플리에 새로 저장되고, 원래 바디플리는 그대로예요.
          </div>
        )}
        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: SUB, marginBottom: 6 }}>플리 이름</label>
        <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 30))} placeholder="예: 퇴근 후 목·어깨 풀기"
          style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, padding: '11px 12px',
            borderRadius: 11, border: `1px solid ${LINE}`, marginBottom: 16 }} />

        {/* 표지 — 그림은 담은 동작에서 저절로 온다. 여기서 정하는 건 그 위에 얹을 문구뿐 */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: 16 }}>
          <div style={{ flex: '0 0 92px' }}>
            <PliCover pli={{ title_z: title }} cards={cards} radius={10} text={coverText.trim()} emptyText="동작을 담으면 보여요" />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="pli-cover-text" style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 12, fontWeight: 800, color: SUB, marginBottom: 6 }}>
              표지 문구 <span style={{ fontWeight: 700, color: '#B5AEA2' }}>안 적어도 돼요</span>
              <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, color: '#B5AEA2' }}>{coverText.length}/{COVER_MAX}</span>
            </label>
            <textarea id="pli-cover-text" value={coverText} onChange={(e) => typeCover(e.target.value)} rows={2}
              placeholder={'예: 자기 전\n10분'}
              style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, lineHeight: 1.45,
                padding: '10px 12px', borderRadius: 11, border: `1px solid ${LINE}`, resize: 'none' }} />
            <div style={{ fontSize: 11, fontWeight: 600, color: SUB, lineHeight: 1.6, marginTop: 6, wordBreak: 'keep-all' }}>
              표지는 담은 동작의 그림이 차례대로 3초마다 넘어가요. 문구를 비워 두면 그림만 보여요.
            </div>
          </div>
        </div>
        {extra}

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: SUB }}>담은 동작 {cards.length}개</span>
          {s.durationSec > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: GOLD_INK }}>다 하면 {mmss(s.durationSec)}</span>}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: SUB, fontWeight: 600 }}>최대 {MAX_CARDS}개</span>
        </div>

        {cards.length === 0 && (
          <div style={{ border: `1px dashed ${LINE}`, borderRadius: 12, padding: '22px 12px', textAlign: 'center', fontSize: 12.5,
            color: SUB, fontWeight: 600, marginBottom: 10 }}>아래 &lsquo;동작 더하기&rsquo;로 바디카드를 골라 담아 보세요.</div>
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
                <CurationThumb item={{ ...c, thumb_text: '' }} radius={7} ratio="4 / 5" showRead={false} clip="" still={c.poster_url || ''} emptyText="" />
              </div>
              <button type="button" onClick={() => setOpenSet(on ? null : c.id)}
                style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, lineHeight: 1.4, wordBreak: 'keep-all', color: INK }}>
                  {cardShortName(c, tone)}
                  {c.published === false && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: '#B23B36' }}>비공개 카드</span>}
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
            {/* 동작마다 바디카드와 같은 설정 — 횟수·세트·쉬는 시간·안내·좌우. 비워 두면 카드 기본값 */}
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

        {/* 바디카드 고르기 — 둘러보기와 같은 칸(영상·표지 문구·시간), 두 줄 둘씩 넷, 옆으로 넘긴다. 누르면 담기·빼기 */}
        {picking && <CardPicker allCards={allCards} chosen={cards} onToggle={toggle} cols={inline ? 4 : 2} />}
        {/* 공개·비공개 — 공개하면 바디플리에 바로 올라간다 */}
        <div style={{ marginTop: 16, padding: '11px 12px', borderRadius: 12, background: '#FAF7F0' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: INK, marginBottom: 8 }}>이 플리를 어떻게 저장할까요?</div>
          {hidden ? (
            <div style={{ fontSize: 12, fontWeight: 700, color: '#B23B36', lineHeight: 1.6 }}>
              운영 기준에 맞지 않아 바디플리에서 내려간 플리예요. 내 보관함에서는 그대로 쓸 수 있어요.
            </div>
          ) : (
            <>
              <div role="radiogroup" aria-label="공개 여부" style={{ display: 'flex', gap: 6 }}>
                {[['private', '🔒 비공개', official ? '이용자에게 안 보여요' : '나만 봐요'],
                  ['public', '🌐 공개', official ? '바디플리·추천에 보여요' : '바디플리에 올려요']].map(([k, lb, sub]) => (
                  <button key={k} type="button" role="radio" aria-checked={share === k} onClick={() => setShare(k)}
                    style={{ flex: 1, border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 11, padding: '10px 8px',
                      background: share === k ? YELLOW : '#fff', color: share === k ? GOLD_INK : SUB,
                      boxShadow: share === k ? `inset 0 0 0 1.5px ${GOLD}` : `inset 0 0 0 1px ${LINE}` }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 900 }}>{lb}</span>
                    <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, marginTop: 2 }}>{sub}</span>
                  </button>
                ))}
              </div>
              {share === 'public' && (
                <div style={{ fontSize: 11, fontWeight: 700, color: SUB, lineHeight: 1.6, marginTop: 8 }}>
                  {official
                    ? '저장하면 바로 이용자에게 보여요. 비공개 카드가 담겨 있으면 그 동작은 이용자에게 안 보여요.'
                    : '저장하면 바로 올라가 다른 사람도 보고 보관할 수 있어요. 언제든 비공개로 되돌릴 수 있어요.'}
                </div>
              )}
            </>
          )}
        </div>

        {/* 바디플리에 올릴 때 만든 사람 표시 — 공개일 때만. 기본은 유형 캐릭터만 */}
        <div style={{ marginTop: 10, padding: '11px 12px', borderRadius: 12, background: '#FAF7F0', display: share === 'public' && !hidden && !official ? 'block' : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: INK, marginBottom: 7 }}>바디플리에 올릴 때 만든 사람 표시</div>
          {[[false, '유형 캐릭터만'], [true, '닉네임 + 유형 캐릭터']].map(([v, lb]) => (
            <label key={lb} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: INK, padding: '3px 0', cursor: 'pointer' }}>
              <input type="radio" checked={showNick === v} onChange={() => setShowNick(v)} style={{ accentColor: GOLD }} />
              {lb}{!v && <span style={{ fontSize: 11, color: SUB }}>(기본)</span>}
            </label>
          ))}
        </div>

        {/* 고치는 중일 때만 — 지운 플리는 되살릴 수 없다 */}
        {onDelete && (
          <button type="button" onClick={() => { if (window.confirm(`'${title.trim() || '이 플리'}'를 지울까요?\n지운 플리는 되살릴 수 없어요.`)) onDelete(); }}
            style={{ display: 'block', margin: '22px auto 0', border: 'none', background: 'transparent', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, color: '#B23B36', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            이 플리 지우기
          </button>
        )}
      </div>
    </div>
  );
}

// 바디카드 고르개 — 한 쪽에 둘씩 두 줄(넷). 옆으로 밀거나 ‹ ›를 누르면 다음 넷으로 부드럽게 넘어간다.
// 영상은 보이는 쪽과 그 옆 쪽만 튼다(한꺼번에 다 틀면 무겁다).
// cols: 가로 칸 수 — 넓은 관리자 화면에서는 넷씩 두 줄(여덟)
function CardPicker({ allCards, chosen, onToggle, cols = 2 }) {
  const trackRef = useRef(null);
  const [page, setPage] = useState(0);
  const perPage = cols * 2;
  const pages = [];
  for (let i = 0; i < allCards.length; i += perPage) pages.push(allCards.slice(i, i + perPage));
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
    return <div style={{ marginTop: 12, fontSize: 12, color: SUB, fontWeight: 700, textAlign: 'center' }}>고를 수 있는 바디카드가 없어요.</div>;
  }
  const arrow = (dis) => ({ border: 'none', cursor: dis ? 'default' : 'pointer', fontFamily: 'inherit', width: 30, height: 30, borderRadius: '50%',
    background: '#fff', boxShadow: `inset 0 0 0 1px ${LINE}`, color: dis ? '#D8D2C8' : INK, fontSize: 16, fontWeight: 900 });
  return (
    <div style={{ marginTop: 12 }}>
      <div ref={trackRef} onScroll={onScroll} className="bmti-pick-track"
        style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <style>{'.bmti-pick-track::-webkit-scrollbar{display:none}'}</style>
        {pages.map((group, pi) => (
          <div key={pi} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 4, alignContent: 'start' }}>
            {group.map((c) => {
              const at = chosen.findIndex((x) => x.id === c.id);
              const sec = cardTotalSec(c);
              return (
                <button key={c.id} type="button" onClick={() => onToggle(c)}
                  style={{ position: 'relative', border: 'none', padding: 0, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <CurationThumb item={c} radius={2} ratio="4 / 5" showRead={false}
                    clip={Math.abs(pi - page) <= 1 ? (c.video_url || '') : ''} still={c.poster_url || ''} emptyText="" />
                  {sec > 0 && (
                    <span style={{ position: 'absolute', right: 5, bottom: 5, fontSize: 9.5, fontWeight: 800, color: INK, background: '#fff',
                      borderRadius: 6, padding: '2px 5px', lineHeight: 1.2 }}>{mmss(sec)}</span>
                  )}
                  {c.published === false && (
                    <span style={{ position: 'absolute', left: 5, top: 5, fontSize: 9.5, fontWeight: 800, color: '#fff', background: 'rgba(178,59,54,0.88)',
                      borderRadius: 6, padding: '2px 5px', lineHeight: 1.2 }}>비공개</span>
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
