// 손님에게 보이는 바로카드 — 인스타 게시물처럼 위에 정보, 가운데 영상, 아래에 지표와 원클릭 버튼.
// 관리자 미리보기에서 먼저 쓰고, 공개할 때 사용자 화면에서 그대로 import한다.
import { GROUP_LABEL } from '../../lib/bodyGroups';
import { KEY_TO_PART_LABEL } from '../../lib/diaryEntryLabels';
import { KIND_LABEL, pickCardTone, fmtCount as fmt, mmss, finishRate } from './format';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2', GOLD = '#C9975A';

const partLabels = (keys) => (keys || []).map((k) => KEY_TO_PART_LABEL[k] || k);

export default function QuickCardView({ card, tone = 'z', onStart, onCopy }) {
  const { title, script } = pickCardTone(card, tone);
  const rate = finishRate(card);
  const core = partLabels(card.core_parts);
  const related = partLabels(card.related_parts);
  const groups = (card.body_groups || []).map((g) => GROUP_LABEL[g] || g);

  return (
    <article style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK, border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
      <div style={{ padding: '14px 15px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#8A6A3A', background: '#F3EAD8', borderRadius: 999, padding: '3px 9px' }}>
            {KIND_LABEL[card.kind] || card.kind}
          </span>
          {card.duration_sec > 0 && <span style={{ fontSize: 11.5, color: SUB, fontWeight: 700 }}>{mmss(card.duration_sec)}</span>}
        </div>
        <h3 style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.4, margin: '0 0 7px', wordBreak: 'keep-all' }}>{title}</h3>
        <div style={{ fontSize: 12, color: SUB, fontWeight: 600 }}>
          {rate != null ? `완주율 ${rate}%` : '아직 기록이 쌓이지 않았어요'}
          {card.finish_count > 0 && ` · 완주 ${fmt(card.finish_count)}회`}
        </div>
        {(card.tools || []).length > 0 && (
          <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginTop: 6 }}>도구 · {card.tools.join(', ')}</div>
        )}
        {(core.length > 0 || related.length > 0) && (
          <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginTop: 4 }}>
            {core.length > 0 && <>타겟 <b style={{ color: INK }}>{core.join(', ')}</b></>}
            {related.length > 0 && <> · 연관 {related.join(', ')}</>}
          </div>
        )}
      </div>

      <div style={{ width: '100%', aspectRatio: '1 / 1', background: '#F3F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {card.video_url
          ? <video src={card.video_url} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: SUB, fontSize: 13, fontWeight: 700 }}>영상 없음</span>}
      </div>

      <div style={{ padding: '12px 15px 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: SUB, fontWeight: 600, marginBottom: 12 }}>
          <span>조회 {fmt(card.view_count)}</span><span style={{ color: LINE }}>·</span><span>저장 {fmt(card.save_count)}</span>
          {groups.length > 0 && <span style={{ marginLeft: 'auto' }}>{groups.join(' · ')}</span>}
        </div>
        <button onClick={onStart}
          style={{ width: '100%', padding: 13, borderRadius: 13, border: 'none', background: GOLD, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          바로 시작하기 →
        </button>
        <button onClick={onCopy}
          style={{ width: '100%', padding: 11, marginTop: 7, borderRadius: 13, border: `1px solid ${LINE}`, background: '#fff', color: SUB, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          내 루틴으로 복사해 편집하기
        </button>
        {script && (
          <details style={{ marginTop: 10 }}>
            <summary style={{ fontSize: 11.5, color: SUB, fontWeight: 700, cursor: 'pointer' }}>음성 안내 대본 보기</summary>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: INK, whiteSpace: 'pre-line', margin: '8px 0 0' }}>{script}</p>
          </details>
        )}
      </div>
    </article>
  );
}
