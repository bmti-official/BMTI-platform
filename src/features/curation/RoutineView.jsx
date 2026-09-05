// 손님에게 보이는 루틴(플레이리스트) — 총 소요시간·완주율·도구·타겟을 한눈에 보여주고
// '바로 시작하기'와 '일단 구경하기'로 이어진다.
import { KEY_TO_PART_LABEL } from '../../lib/diaryEntryLabels';
import AiNote from './AiNote';
import { pickRoutineTone, pickCardTone, routineSummary, fmtCount, mmss, finishRate, KIND_LABEL } from './format';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2', GOLD = '#C9975A';
const partLabels = (keys) => (keys || []).map((k) => KEY_TO_PART_LABEL[k] || k);

export default function RoutineView({ routine, cards, tone = 'z', onStart, onBrowse }) {
  const { title } = pickRoutineTone(routine, tone);
  const s = routineSummary(cards);
  const rate = finishRate(routine);

  return (
    <article style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK, border: `1px solid ${LINE}`, borderRadius: 16, padding: '15px 16px', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: '#8A6A3A', background: '#F3EAD8', borderRadius: 999, padding: '3px 10px' }}>
          {s.durationSec > 0 ? mmss(s.durationSec) : '시간 미정'}
        </span>
        <span style={{ fontSize: 11.5, color: SUB, fontWeight: 700 }}>동작 {s.count}개</span>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.4, margin: '0 0 7px', wordBreak: 'keep-all' }}>{title}</h3>

      <div style={{ fontSize: 12, color: SUB, fontWeight: 600 }}>
        {rate != null ? `완주율 ${rate}%` : '아직 기록이 쌓이지 않았어요'}
        {routine.finish_count > 0 && ` · 완주 ${fmtCount(routine.finish_count)}회`}
      </div>
      {s.tools.length > 0 && <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginTop: 5 }}>도구 · {s.tools.join(', ')}</div>}
      {(s.coreParts.length > 0 || s.relatedParts.length > 0) && (
        <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginTop: 4 }}>
          {s.coreParts.length > 0 && <>타겟 <b style={{ color: INK }}>{partLabels(s.coreParts).join(', ')}</b></>}
          {s.relatedParts.length > 0 && <> · 연관 {partLabels(s.relatedParts).join(', ')}</>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 7, marginTop: 14 }}>
        <button onClick={onStart}
          style={{ flex: 1, padding: 13, borderRadius: 13, border: 'none', background: GOLD, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          바로 시작하기 →
        </button>
        <button onClick={onBrowse}
          style={{ flex: 1, padding: 13, borderRadius: 13, border: `1px solid ${LINE}`, background: '#fff', color: SUB, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          일단 구경하기
        </button>
      </div>
    </article>
  );
}

// '일단 구경하기'로 펼쳐 보는 내용 — 어떤 동작이 어떤 순서로 들어 있는지
export function RoutineDetail({ routine, cards, tone = 'z', onStart, onCopy }) {
  const { title } = pickRoutineTone(routine, tone);
  const s = routineSummary(cards);
  return (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
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
