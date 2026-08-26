// 손님에게 보이는 큐레이션 카드 — 유튜브 롱폼 목록처럼 위에 큰 이미지, 아래에 제목과 지표.
//
// 지금은 관리자 페이지의 미리보기에서만 불러 쓴다. 사용자 앱(main.jsx)이 아직 이 파일을
// import하지 않으므로 손님 번들에는 들어가지 않는다. 나중에 공개할 때 사용자 화면에서
// import 한 줄만 추가하면 그대로 쓰인다.
import { GROUP_LABEL } from '../../lib/bodyGroups';
import { pickCurationTone, fmtCount as fmt } from './format';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';

export default function CurationCard({ item, tone = 'z', onOpen }) {
  const { title } = pickCurationTone(item, tone);
  const groups = (item.body_groups || []).map((g) => GROUP_LABEL[g] || g);

  return (
    <button onClick={() => onOpen && onOpen(item)}
      style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: 0, cursor: onOpen ? 'pointer' : 'default', fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 14, overflow: 'hidden', background: '#F3F1EC' }}>
        {item.cover_url
          ? <img src={item.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUB, fontSize: 13, fontWeight: 700 }}>대표 이미지 없음</div>}
      </div>

      <div style={{ padding: '10px 2px 0' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: INK, lineHeight: 1.4, wordBreak: 'keep-all' }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: SUB, fontWeight: 600 }}>
          <span>조회 {fmt(item.view_count)}</span>
          <span style={{ color: LINE }}>·</span>
          <span>저장 {fmt(item.save_count)}</span>
        </div>
        {groups.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
            {groups.map((g) => (
              <span key={g} style={{ fontSize: 11, fontWeight: 700, color: '#8A6A3A', background: '#F3EAD8', borderRadius: 999, padding: '3px 9px' }}>{g}</span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

// 카드를 눌렀을 때 펼쳐지는 본문
export function CurationDetail({ item, tone = 'z' }) {
  const { title, body } = pickCurationTone(item, tone);
  return (
    <article style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      {item.cover_url && (
        <img src={item.cover_url} alt="" style={{ width: '100%', borderRadius: 14, display: 'block', marginBottom: 14 }} />
      )}
      <h1 style={{ fontSize: 19, fontWeight: 900, lineHeight: 1.35, margin: '0 0 8px', wordBreak: 'keep-all' }}>{title}</h1>
      <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginBottom: 16 }}>
        조회 {fmt(item.view_count)} · 저장 {fmt(item.save_count)}
      </div>
      {String(body || '').trim().split(/\n{2,}/).filter(Boolean).map((p, i) => (
        <p key={i} style={{ fontSize: 14.5, lineHeight: 1.75, margin: '0 0 14px', wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{p}</p>
      ))}
      {!String(body || '').trim() && <p style={{ fontSize: 13.5, color: SUB }}>본문이 아직 비어 있어요.</p>}
    </article>
  );
}
