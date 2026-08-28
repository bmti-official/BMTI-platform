// 손님에게 보이는 큐레이션 —
//  목록 카드: 가로로 꽉 찬 썸네일(문구 + 우측 하단 가독시간) → 아래에 누끼 캐릭터 + 제목 → 지표 줄
//  본문:     같은 썸네일 → 제목 → 초록 → 네 마디(이미지+글) → 추천 바로카드
import { GROUP_LABEL } from '../../lib/bodyGroups';
import { pickCurationTone, fmtCount } from './format';
import { fontStack, readMinutes, timeAgo } from './fonts';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';

// 가로로 꽉 찬 썸네일 — 문구는 Z/M 구분 없이 하나만 쓴다.
export function CurationThumb({ item, radius = 14, big = false }) {
  const min = readMinutes(item);
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: radius, overflow: 'hidden', background: '#EDE9E2' }}>
      {item.cover_url
        ? <img src={item.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUB, fontSize: 13, fontWeight: 700 }}>대표 이미지 없음</div>}

      {item.thumb_text && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', padding: big ? '18px 18px 0' : '12px 12px 0' }}>
          <span style={{ fontSize: big ? 30 : 21, fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.02em', wordBreak: 'keep-all',
            textShadow: '0 2px 10px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.5)' }}>
            {item.thumb_text}
          </span>
        </div>
      )}

      {/* 우측 하단 평균 가독시간 */}
      <span style={{ position: 'absolute', right: 7, bottom: 7, background: 'rgba(0,0,0,0.78)', color: '#fff', fontSize: big ? 12.5 : 11.5, fontWeight: 700, borderRadius: 5, padding: '2px 6px', letterSpacing: '0.02em' }}>
        {min}분
      </span>
    </div>
  );
}

// 목록 카드
export default function CurationCard({ item, tone = 'z', charImage, onOpen }) {
  const { title } = pickCurationTone(item, tone);
  return (
    <button onClick={() => onOpen && onOpen(item)}
      style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: 0, cursor: onOpen ? 'pointer' : 'default', fontFamily: fontStack(item.font_key) }}>
      <CurationThumb item={item} />
      <div style={{ display: 'flex', gap: 10, padding: '11px 2px 0' }}>
        {/* 유형 누끼 캐릭터 — 동그란 테두리 없이 그림만 */}
        <span style={{ width: 38, height: 38, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {charImage && <img src={charImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: INK, lineHeight: 1.4, wordBreak: 'keep-all' }}>{title}</span>
          <span style={{ display: 'block', fontSize: 12, color: SUB, fontWeight: 600, marginTop: 5 }}>
            by. BMTI · 조회수 {fmtCount(item.view_count)}회 · 저장수 {fmtCount(item.save_count)}회
            {item.created_at ? ` · ${timeAgo(item.created_at)}` : ''}
          </span>
        </span>
      </div>
    </button>
  );
}

const SECTIONS = [
  { img: 's1_img', z: 's1_z', m: 's1_m' },
  { img: 's2_img', z: 's2_z', m: 's2_m' },
  { img: 's3_img', z: 's3_z', m: 's3_m' },
  { img: 's4_img', z: 's4_z', m: 's4_m' },
];

const Paras = ({ text }) => String(text || '').trim().split(/\n{2,}/).filter(Boolean).map((p, i) => (
  <p key={i} style={{ fontSize: 14.5, lineHeight: 1.8, margin: '0 0 14px', wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{p}</p>
));

// 본문
export function CurationDetail({ item, tone = 'z', cards = [], renderCard }) {
  const { title, body } = pickCurationTone(item, tone);
  const lead = (tone === 'm' ? item.lead_m : item.lead_z) || '';
  const groups = (item.body_groups || []).map((g) => GROUP_LABEL[g] || g);

  return (
    <article style={{ fontFamily: fontStack(item.font_key), color: INK }}>
      <CurationThumb item={item} radius={16} big />

      <h1 style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.32, margin: '16px 0 8px', wordBreak: 'keep-all' }}>{title}</h1>
      <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginBottom: 16 }}>
        by. BMTI · 조회수 {fmtCount(item.view_count)}회 · 저장수 {fmtCount(item.save_count)}회
        {item.created_at ? ` · ${timeAgo(item.created_at)}` : ''}
      </div>

      {lead && (
        <p style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.65, margin: '0 0 20px', padding: '14px 15px', background: '#FBF6E9', borderRadius: 14, wordBreak: 'keep-all' }}>
          {lead}
        </p>
      )}

      {SECTIONS.map((sec, i) => {
        const text = (tone === 'm' ? item[sec.m] : item[sec.z]) || '';
        const img = item[sec.img];
        if (!text && !img) return null;
        return (
          <section key={i} style={{ marginBottom: 22 }}>
            {img && <img src={img} alt="" style={{ width: '100%', borderRadius: 14, display: 'block', marginBottom: 12 }} />}
            <Paras text={text} />
          </section>
        );
      })}

      {body && <section style={{ marginBottom: 22 }}><Paras text={body} /></section>}

      {cards.length > 0 && (
        <section style={{ borderTop: `1px solid ${LINE}`, paddingTop: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>이 글과 함께 해보면 좋아요</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cards.map((c) => <div key={c.id}>{renderCard ? renderCard(c) : null}</div>)}
          </div>
        </section>
      )}

      {groups.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 18 }}>
          {groups.map((g) => (
            <span key={g} style={{ fontSize: 11, fontWeight: 700, color: '#8A6A3A', background: '#F3EAD8', borderRadius: 999, padding: '3px 9px' }}>{g}</span>
          ))}
        </div>
      )}
    </article>
  );
}
