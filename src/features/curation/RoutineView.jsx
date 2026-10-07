// 손님에게 보이는 루틴(플레이리스트) — 총 소요시간·도구·타겟을 한눈에 보여주고
// '바로 시작하기'와 '일단 구경하기'로 이어진다.
import { useState } from 'react';
import { KEY_TO_PART_LABEL } from '../../lib/diaryEntryLabels';
import AiNote from './AiNote';
import CardPeek from './CardPeek';
import { CharRow, CurationThumb } from './CurationCard';
import { isClip } from './media';
import { plMaker } from './plMaker';
import { useKeep, useViewMark } from './keep';
import { pickRoutineTone, pickCardTone, routineSummary, fmtCount, mmss, KIND_LABEL } from './format';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2', GOLD = '#C9975A';
const partLabels = (keys) => (keys || []).map((k) => KEY_TO_PART_LABEL[k] || k);

// 표지 모서리에 얹는 글씨 — 판 없이 글씨만 얹고,
// 사진 위에서도 읽히게 흰 번짐을 둘러 준다. 바디카드 표지와 같은 방식이다.
const SHADE = '0 1px 3px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.75)';
const coverTag = (side) => ({
  position: 'absolute', top: 12, [side]: 12, zIndex: 2, pointerEvents: 'none',
  fontSize: 12, fontWeight: 800, lineHeight: 1.35, letterSpacing: '-0.01em',
  color: GOLD, textAlign: side === 'right' ? 'right' : 'left', maxWidth: '44%', wordBreak: 'keep-all',
  textShadow: SHADE,
});


export default function RoutineView({ routine, cards, tone = 'z', bmtiCode, onStart, onBrowse, charImages, charCodes }) {
  const { title } = pickRoutineTone(routine, tone);
  const who = plMaker(routine);
  const keep = useKeep('routine', routine?.mine ? null : routine?.id);
  const seenRef = useViewMark('routine', routine?.mine ? null : routine?.id);
  const s = routineSummary(cards);
  // 구경하기 — 표지는 그대로 두고 그 위에 창만 띄워, 옆으로 넘겨 가며 훑어본다.
  const [peek, setPeek] = useState(false);
  // 표지 영상 — 담긴 동작을 차례대로 한 편씩 돌린다. 끝까지 가면 처음으로.
  const clips = (cards || []).map((c) => c.video_url).filter(Boolean);
  // 나머지로 돌려 쓰므로 편수가 달라져도 자리를 되돌릴 일이 없다.
  const [clipAt, setClipAt] = useState(0);
  // 표지를 따로 올렸으면 그것만 쓰고, 아니면 담긴 영상을 돌린다.
  const ownClip = routine.cover_url && isClip(routine.cover_url) ? routine.cover_url : '';
  const coverClip = routine.cover_url ? ownClip : (clips[clipAt % Math.max(1, clips.length)] || '');
  const browse = () => {
    if ((cards || []).length === 0) { if (onBrowse) onBrowse(); return; }
    setPeek(true);
  };

  return (
    <article ref={seenRef} style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK, border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
      {/* 표지 — 없으면 담긴 첫 동작의 것을 빌려 쓴다 */}
      <div style={{ position: 'relative' }}>
      {/* 문구·자리·색은 플리에 적어 둔 것만 쓴다. 담긴 바디카드의 문구는 따라오지 않는다. */}
      <CurationThumb item={routine} radius={0} ratio="4 / 5" showRead={false}
        clip={coverClip}
        onClipEnd={routine.cover_url || clips.length < 2 ? undefined : () => setClipAt((n) => n + 1)}
        emptyText="표지 없음" />
      {/* 왼쪽 위 타겟 부위 · 오른쪽 위 도구 — 바디카드와 같은 자리에 둔다 */}
      {s.coreParts.length > 0 && (
        <div style={coverTag('left')}>{partLabels(s.coreParts).join(', ')}</div>
      )}
      {s.tools.length > 0 && (
        <div style={coverTag('right')}>{s.tools.map((t, i) => <div key={i}>{t}</div>)}</div>
      )}
      </div>
      <div style={{ padding: '15px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: '#8A6A3A', background: '#F3EAD8', borderRadius: 999, padding: '3px 10px' }}>
          {s.durationSec > 0 ? mmss(s.durationSec) : '시간 미정'}
        </span>
        <span style={{ fontSize: 11.5, color: SUB, fontWeight: 700 }}>동작 {s.count}개</span>
      </div>

      {/* 묶음은 유형을 보고 고르기 때문에, 여기서만 추천 유형을 보여 준다 */}
      {(charImages || []).length > 0 && <CharRow chars={(charImages || []).slice(0, 4)} codes={charCodes || []} h={30} />}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <h3 style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 800, lineHeight: 1.4, margin: '0 0 7px', wordBreak: 'keep-all' }}>{title}</h3>
        {keep && <KeepToggle keep={keep} />}
      </div>
      {/* 회원이 올린 플리 — 만든 사람 */}
      {who && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '-2px 0 8px', fontSize: 12.5, fontWeight: 700, color: SUB }}>
          {who.img && <img src={who.img} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />}
          {who.nick ? <span><b style={{ color: '#8A6A3A', fontWeight: 800 }}>{who.nick}</b>님이 만든 플리</span> : <span>회원이 만든 플리</span>}
        </div>
      )}

      {/* 완주율·완주 수는 초기엔 숫자가 작아 뜻이 없어 보이지 않게 뺐다. 바디카드처럼 조회·저장만 적는다.
          내가 만든 마이플리는 세지 않으니 적지 않는다. */}
      {!routine.mine && (
        <div style={{ fontSize: 12, color: SUB, fontWeight: 600 }}>
          조회 {fmtCount(routine.view_count)} · 저장 {fmtCount(routine.save_count)}
        </div>
      )}

      <div style={{ display: 'flex', gap: 7, marginTop: 14 }}>
        <button onClick={onStart}
          style={{ flex: 3, padding: 13, borderRadius: 13, border: 'none', background: '#fff', color: INK,
            fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 3px 10px rgba(217,185,106,0.45)' }}>
          바로 시작하기 →
        </button>
        <button onClick={browse}
          style={{ flexShrink: 0, padding: '13px 12px', borderRadius: 13, border: `1px solid ${LINE}`, background: '#fff',
            color: SUB, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          일단 구경하기
        </button>
      </div>
      </div>

      {peek && (
        <CardPeek cards={cards || []} tone={tone} bmtiCode={bmtiCode}
          onClose={() => setPeek(false)} />
      )}
    </article>
  );
}

// '일단 구경하기'로 펼쳐 보는 내용 — 어떤 동작이 어떤 순서로 들어 있는지
export function RoutineDetail({ routine, cards, tone = 'z', onStart, onCopy, charImages, charCodes }) {
  const { title } = pickRoutineTone(routine, tone);
  const s = routineSummary(cards);
  return (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      {(charImages || []).length > 0 && <CharRow chars={(charImages || []).slice(0, 4)} codes={charCodes || []} h={34} />}
      <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 6px', lineHeight: 1.35, wordBreak: 'keep-all' }}>{title}</h2>
      <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginBottom: 14 }}>
        {s.durationSec > 0 ? mmss(s.durationSec) : '시간 미정'} · 동작 {s.count}개
        {s.tools.length > 0 && ` · ${s.tools.join(', ')}`}
        {routine.skip_opening !== false && ' · 오프닝 설명은 건너뜁니다'}
      </div>

      <ol style={{ listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(cards || []).map((c, i) => {
          const { title: ct } = pickCardTone(c, tone);
          return (
            <li key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: `1px solid ${LINE}`, borderRadius: 12, padding: '10px 12px' }}>
              <span style={{ flexShrink: 0, width: 20, fontSize: 12.5, fontWeight: 800, color: GOLD, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, lineHeight: 1.4, wordBreak: 'keep-all' }}>{ct}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: SUB, fontWeight: 600, marginTop: 3 }}>
                  {KIND_LABEL[c.kind] || c.kind}{c.duration_sec > 0 && ` · ${mmss(c.duration_sec)}`}
                </span>
              </span>
            </li>
          );
        })}
        {(cards || []).length === 0 && <li style={{ fontSize: 13, color: SUB }}>아직 담긴 동작이 없어요.</li>}
      </ol>

      <button onClick={onStart}
        style={{ width: '100%', padding: 13, borderRadius: 13, border: 'none', background: GOLD, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
        바로 시작하기 →
      </button>
      <button onClick={onCopy}
        style={{ width: '100%', padding: 11, marginTop: 7, borderRadius: 13, border: `1px solid ${LINE}`, background: '#fff', color: SUB, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
        내 루틴으로 복사해 편집하기
      </button>

      <AiNote />
    </div>
  );
}

// 보관 — 누르면 담기고, 다시 누르면 빠진다
function KeepToggle({ keep }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); keep.toggle(); }} aria-pressed={keep.saved}
      style={{ flexShrink: 0, padding: '6px 10px', fontSize: 11.5, fontWeight: 800, fontFamily: 'inherit', borderRadius: 14,
        border: 'none', cursor: 'pointer', background: '#FDF2CE', color: '#6E5A1C', whiteSpace: 'nowrap' }}>
      {keep.saved ? '보관됨 ✓' : '보관하기'}
    </button>
  );
}
