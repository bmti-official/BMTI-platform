// 바로플리 격자 — 가로 둘씩. 표지가 커서 무엇이 담겼는지 눈에 들어온다.
//
// 시간은 담긴 동작을 기본 설정대로 다 했을 때 걸리는 값이다.
import { CurationThumb } from './CurationCard';
import { isClip } from './media';
import { routineSummary, mmss, pickRoutineTone } from './format';
import { plMaker } from './plMaker';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A';

// action: 칸마다 밑에 붙는 작은 버튼 { label, onClick(r) } — 바로플리 '가져와 고치기'
// maker: 만든 사람(캐릭터·닉네임)을 붙일지 — 마이플리는 모두 내 것이라 끈다
// editMode: 마이플리 편집하기 — 표지 위에 '✎ 고치기'를 얹어 누르면 고친다는 걸 보인다
export default function PliGrid({ plis = [], tone = 'z', onOpen, empty = '아직 담긴 플리가 없어요.', action = null, editMode = false, maker = true }) {
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
        const who = maker ? plMaker(r) : null;
        const clip = r.cover_url ? (isClip(r.cover_url) ? r.cover_url : '') : ((cards[0] || {}).video_url || '');
        return (
          <div key={r.id}>
          <button type="button" onClick={() => onOpen && onOpen(r)}
            style={{ width: '100%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <div style={{ position: 'relative' }}>
              <CurationThumb item={{ ...cover, thumb_text: r.thumb_text || cover.thumb_text }}
                radius={12} ratio="4 / 5" showRead={false} clip={clip} still={r.cover_url ? '' : ((cards[0] || {}).poster_url || '')} emptyText="표지 없음" />
              {/* 오른쪽 아래 — 다 하면 걸리는 시간 */}
              <span style={{ position: 'absolute', right: 6, bottom: 6, fontSize: 10, fontWeight: 800,
                color: GOLD_INK, background: YELLOW, borderRadius: 7, padding: '3px 7px', lineHeight: 1.2 }}>
                {s.durationSec > 0 ? mmss(s.durationSec) : '시간 미정'}
              </span>
              {/* 내가 공개로 올린 플리 — 왼쪽 위에 작게 */}
              {r.mine && r.share_state === 'public' && (
                <span style={{ position: 'absolute', left: 6, top: 6, fontSize: 10, fontWeight: 800, color: '#fff',
                  background: 'rgba(28,26,23,0.62)', borderRadius: 7, padding: '3px 7px', lineHeight: 1.2 }}>🌐 공개</span>
              )}
              {r.mine && r.share_state === 'hidden' && (
                <span style={{ position: 'absolute', left: 6, top: 6, fontSize: 10, fontWeight: 800, color: '#fff',
                  background: 'rgba(178,59,54,0.85)', borderRadius: 7, padding: '3px 7px', lineHeight: 1.2 }}>내려감</span>
              )}
              {editMode && (
                <span style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'rgba(28,26,23,0.38)',
                  boxShadow: `inset 0 0 0 2px ${GOLD_INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ background: '#fff', color: GOLD_INK, borderRadius: 999, padding: '6px 12px',
                    fontSize: 12, fontWeight: 900 }}>✎ 고치기</span>
                </span>
              )}
            </div>
            {/* 제목 왼쪽에 만든 사람의 유형 캐릭터 — 제목이 두 줄이어도 첫 줄 옆에 둔다 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 6 }}>
              {who?.img && <img src={who.img} alt="" style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0, marginTop: -2 }} />}
              <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, color: INK, lineHeight: 1.4,
                wordBreak: 'keep-all', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {pickRoutineTone(r, tone).title}
              </div>
            </div>
            {/* 닉네임을 보이기로 한 플리면 둘째 줄 앞에 */}
            <div style={{ fontSize: 11, fontWeight: 700, color: SUB, marginTop: 2, paddingLeft: who?.img ? 27 : 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {who?.nick && <span style={{ color: GOLD_INK }}>{who.nick} · </span>}동작 {s.count}개
            </div>
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
