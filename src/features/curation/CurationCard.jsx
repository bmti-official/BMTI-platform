// 손님에게 보이는 큐레이션 —
//  목록 카드: 가로로 꽉 찬 썸네일(문구 + 우측 하단 가독시간) → 아래에 누끼 캐릭터 + 제목 → 지표 줄
//  본문:     같은 썸네일 → 제목 → 초록 → 네 마디(이미지+글) → 추천 바로카드
import { GROUP_LABEL } from '../../lib/bodyGroups';
import { pickCurationTone, fmtCount } from './format';
import { F, fontStack, thumbPos, thumbShadow, readMinutes, timeAgo } from './fonts';
import { charBox } from '../../lib/charBox';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2', KEY_BAR = '#D9B96A';

// 가로로 꽉 찬 썸네일 — 문구는 Z/M 구분 없이 하나만 쓴다.
export function CurationThumb({ item, radius = 14, big = false }) {
  const min = readMinutes(item);
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: radius, overflow: 'hidden', background: '#EDE9E2' }}>
      {item.cover_url
        ? <img src={item.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUB, fontSize: 13, fontWeight: 700 }}>대표 이미지 없음</div>}

      {item.thumb_text && (() => {
        const pos = thumbPos(item.thumb_pos);
        const color = item.thumb_color || '#FFFFFF';
        return (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: pos.align, justifyContent: pos.justify, padding: big ? 18 : 12 }}>
            <span style={{ fontSize: big ? 30 : 21, fontWeight: 900, color, lineHeight: 1.2, letterSpacing: '-0.02em', wordBreak: 'keep-all',
              textAlign: pos.text, fontFamily: fontStack(item.thumb_font), textShadow: thumbShadow(color) }}>
              {item.thumb_text}
            </span>
          </div>
        );
      })()}

      {/* 우측 하단 평균 가독시간 */}
      <span style={{ position: 'absolute', right: 7, bottom: 7, background: 'rgba(0,0,0,0.78)', color: '#fff', fontSize: big ? 12.5 : 11.5, fontWeight: 700, borderRadius: 5, padding: '2px 6px', letterSpacing: '0.02em' }}>
        {min}분
      </span>
    </div>
  );
}

// 누끼 캐릭터 한 마리 — 그림 파일마다 다른 여백을 걷어내고 키를 맞춰 세운다.
function CharPic({ src, code, h = 38 }) {
  const b = charBox(code);
  if (!b) return <img src={src} alt="" style={{ width: h, height: h, objectFit: 'contain', display: 'block' }} />;
  const full = h * b.size;   // 그림 영역이 h가 되도록 파일 전체를 키운 크기
  return (
    <span style={{ position: 'relative', display: 'block', width: h * b.ar, height: h, overflow: 'hidden', flexShrink: 0 }}>
      <img src={src} alt="" style={{ position: 'absolute', width: full, height: full, maxWidth: 'none',
        left: -b.left * full, top: -b.top * full, display: 'block' }} />
    </span>
  );
}

// 목록 카드
export default function CurationCard({ item, tone = 'z', charImage, charImages, charCodes, onOpen }) {
  const { title } = pickCurationTone(item, tone);
  // 누끼 캐릭터는 최대 4개까지 — 여러 마리면 조금씩 겹쳐 세운다.
  const chars = (charImages && charImages.length ? charImages : (charImage ? [charImage] : [])).slice(0, 4);
  const codes = charCodes || [];
  return (
    <button onClick={() => onOpen && onOpen(item)}
      style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: 0, cursor: onOpen ? 'pointer' : 'default', fontFamily: F.title }}>
      <CurationThumb item={item} />
      <div style={{ display: 'flex', gap: 10, padding: '11px 2px 0' }}>
        {/* 유형 누끼 캐릭터 — 동그란 테두리 없이 그림만, 여러 개면 겹쳐서 */}
        {chars.length > 0 && (
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
            {chars.map((src, i) => (
              <CharPic key={i} src={src} code={codes[i]} h={34} />
            ))}
          </span>
        )}
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

const SECTIONS = [1, 2, 3, 4].map((n) => ({
  n,
  imgs: `s${n}_imgs`, img: `s${n}_img`, caps: `s${n}_caps`,
  z: `s${n}_z`, m: `s${n}_m`,
  hz: `s${n}_h_z`, hm: `s${n}_h_m`,
  keyz: `s${n}_key_z`, keym: `s${n}_key_m`,
}));

// 마디에 딸린 사진들 — 여러 장 칸이 비어 있으면 옛 한 장짜리 칸을 쓴다.
const sectionImages = (item, sec) => {
  const many = item[sec.imgs];
  if (Array.isArray(many) && many.length) return many;
  return item[sec.img] ? [item[sec.img]] : [];
};

// 숫자 카드 — '12kg / 15도' 처럼 숫자와 한 줄 설명을 가로로 세운다.
function StatCards({ stats }) {
  const list = (Array.isArray(stats) ? stats : []).filter((s) => s && (s.num || s.text));
  if (list.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, margin: '4px 0 16px', fontFamily: F.stat }}>
      {list.slice(0, 3).map((s, i) => (
        <div key={i} style={{ flex: 1, minWidth: 0, background: '#F6F4EF', borderRadius: 13, padding: '14px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: INK, lineHeight: 1.1, letterSpacing: '-0.02em', wordBreak: 'keep-all' }}>{s.num}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: SUB, marginTop: 6, lineHeight: 1.4, wordBreak: 'keep-all' }}>{s.text}</div>
        </div>
      ))}
    </div>
  );
}

const Paras = ({ text }) => String(text || '').trim().split(/\n{2,}/).filter(Boolean).map((p, i) => (
  <p key={i} style={{ fontSize: 14.5, lineHeight: 1.8, margin: '0 0 14px', wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{p}</p>
));

// 본문
export function CurationDetail({ item, tone = 'z', cards = [], renderCard }) {
  const { title, body } = pickCurationTone(item, tone);
  const lead = (tone === 'm' ? item.lead_m : item.lead_z) || '';
  const groups = (item.body_groups || []).map((g) => GROUP_LABEL[g] || g);

  return (
    <article style={{ fontFamily: F.title, color: INK }}>
      <CurationThumb item={item} radius={16} big />

      <h1 style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.32, margin: '16px 0 8px', wordBreak: 'keep-all' }}>{title}</h1>
      <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginBottom: 16 }}>
        by. BMTI · 조회수 {fmtCount(item.view_count)}회 · 저장수 {fmtCount(item.save_count)}회
        {item.created_at ? ` · ${timeAgo(item.created_at)}` : ''}
      </div>

      {lead && (
        <p style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.7, margin: '0 0 20px', padding: '16px 16px', background: '#FBF6E9', borderRadius: 14, wordBreak: 'keep-all', fontFamily: F.lead }}>
          {lead}
        </p>
      )}

      {SECTIONS.map((sec, i) => {
        const text = (tone === 'm' ? item[sec.m] : item[sec.z]) || '';
        const heading = (tone === 'm' ? item[sec.hm] : item[sec.hz]) || '';
        const keyLine = (tone === 'm' ? item[sec.keym] : item[sec.keyz]) || '';
        const imgs = sectionImages(item, sec);
        const caps = Array.isArray(item[sec.caps]) ? item[sec.caps] : [];
        const stats = sec.n === 2 ? item.stats : null;
        const hasStats = Array.isArray(stats) && stats.some((x) => x && (x.num || x.text));
        if (!text && !heading && !keyLine && !hasStats && imgs.length === 0) return null;
        return (
          <section key={i} style={{ marginBottom: 26, fontFamily: F.body }}>
            {heading && (
              <h2 style={{ fontFamily: F.head, fontSize: 19, fontWeight: 900, lineHeight: 1.4, letterSpacing: '-0.01em',
                margin: '0 0 12px', wordBreak: 'keep-all' }}>{heading}</h2>
            )}
            {imgs.map((src, k) => (
              <figure key={k} style={{ margin: '0 0 12px' }}>
                <img src={src} alt={caps[k] || heading || ''} style={{ width: '100%', borderRadius: 14, display: 'block' }} />
                {caps[k] && (
                  <figcaption style={{ fontSize: 11.5, color: SUB, fontWeight: 600, textAlign: 'center', marginTop: 7, lineHeight: 1.5, wordBreak: 'keep-all' }}>
                    {caps[k]}
                  </figcaption>
                )}
              </figure>
            ))}
            <Paras text={text} />
            {hasStats && <StatCards stats={stats} />}
            {keyLine && (
              <p style={{ margin: '2px 0 0', padding: '2px 0 2px 14px', borderLeft: `4px solid ${KEY_BAR}`,
                fontFamily: F.key, fontSize: 16.5, fontWeight: 800, lineHeight: 1.6, color: INK, wordBreak: 'keep-all' }}>
                {keyLine}
              </p>
            )}
          </section>
        );
      })}

      {body && <section style={{ marginBottom: 22, fontFamily: F.body }}><Paras text={body} /></section>}

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
