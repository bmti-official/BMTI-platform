// 바로플리 격자 — 가로 둘씩. 표지가 커서 무엇이 담겼는지 눈에 들어온다.
//
// 시간은 담긴 동작을 기본 설정대로 다 했을 때 걸리는 값이다.
import { CurationThumb } from './CurationCard';
import { isClip } from './media';
import { routineSummary, mmss, pickRoutineTone } from './format';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A';

// action: 칸마다 밑에 붙는 작은 버튼 { label, onClick(r) } — 마이플리 '고치기', 바로플리 '가져와 고치기'
export default function PliGrid({ plis = [], tone = 'z', onOpen, empty = '아직 담긴 플리가 없어요.', action = null }) {
  if (plis.length === 0) {
    return (
      <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: '30px 16px', textAlign: 'center',
        fontSize: 12.5, color: SUB, fontWeight: 600, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{empty}</div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
      {plis.map((r) => {
        const cards = r.cards || [];
        const s = routineSummary(cards);
        const cover = r.cover_url ? r : { ...(cards[0] || {}), thumb_text: r.thumb_text };
        const clip = r.cover_url ? (isClip(r.cover_url) ? r.cover_url : '') : ((cards[0] || {}).video_url || '');
        return (
          <div key={r.id}>
          <button type="button" onClick={() => onOpen && onOpen(r)}
            style={{ width: '100%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <div style={{ position: 'relative' }}>
              <CurationThumb item={{ ...cover, thumb_text: r.thumb_text || cover.thumb_text }}
                radius={12} ratio="4 / 5" showRead={false} clip={clip} emptyText="표지 없음" />
              {/* 오른쪽 아래 — 다 하면 걸리는 시간 */}
              <span style={{ position: 'absolute', right: 6, bottom: 6, fontSize: 10, fontWeight: 800,
                color: GOLD_INK, background: YELLOW, borderRadius: 7, padding: '3px 7px', lineHeight: 1.2 }}>
                {s.durationSec > 0 ? mmss(s.durationSec) : '시간 미정'}
              </span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: INK, lineHeight: 1.4, marginTop: 6,
              wordBreak: 'keep-all', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {pickRoutineTone(r, tone).title}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: SUB, marginTop: 2 }}>동작 {s.count}개</div>
          </button>
          {action && (
            <button type="button" onClick={() => action.onClick(r)}
              style={{ marginTop: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: '#fff', borderRadius: 8,
                padding: '5px 10px', fontSize: 11, fontWeight: 800, color: GOLD_INK, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
              {action.label}
            </button>
          )}
          </div>
        );
      })}
    </div>
  );
}
