// 손님에게 보이는 큐레이션 —
//  목록 카드: 가로로 꽉 찬 썸네일(문구 + 우측 하단 가독시간) → 아래에 누끼 캐릭터 + 제목 → 지표 줄
//  본문:     같은 썸네일 → 제목 → 초록 → 네 마디(이미지+글) → 추천 바로카드
import { useEffect, useRef, useState } from 'react';
import { GROUP_LABEL } from '../../lib/bodyGroups';
import { pickCurationTone, fmtCount } from './format';
import { F, fontStack, thumbPos, thumbShadow, readMinutes, timeAgo } from './fonts';
import { charBox } from '../../lib/charBox';
import { isClip } from './media';
import AiNote from './AiNote';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2', KEY_BAR = '#D9B96A';
const HILITE = '#E7E0F7';   // 형광펜 연보라
const MARKER = '#FBEFB6';   // 목차에 대충 그은 옐로우 형광펜
const PURPLE = '#7E6FC9';   // 답변에서 짚어 주는 연보라 글씨
const KEEP_BG = '#FDF2CE', KEEP_INK = '#6E5A1C';   // 보관 버튼 — 연한 옐로우
const DOTS = 'repeating-linear-gradient(90deg, #DCD6CC 0 5px, transparent 5px 11px)';

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

// 가로로 꽉 찬 썸네일 — 문구는 Z/M 구분 없이 하나만 쓴다.
export function CurationThumb({ item, radius = 14, big = false, ratio = '16 / 9', badge, showRead = true, clip = '', peekSec = 5, emptyText = '대표 이미지 없음' }) {
  // 표지에 영상을 깔면, 화면에 들어올 때 0~5초를 소리 없이 돌려 준다.
  const boxRef = useRef(null);
  const vidRef = useRef(null);
  useEffect(() => {
    if (!clip) return undefined;
    const box = boxRef.current;
    if (!box || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => {
      const v = vidRef.current;
      if (!v) return;
      if (e.isIntersecting) { try { v.currentTime = 0; v.play().catch(() => {}); } catch { /* 무시 */ } }
      else { try { v.pause(); } catch { /* 무시 */ } }
    }, { threshold: 0.35 });
    io.observe(box);
    return () => io.disconnect();
  }, [clip]);
  return (
    <div ref={boxRef} style={{ position: 'relative', width: '100%', aspectRatio: ratio, borderRadius: radius, overflow: 'hidden', background: '#EDE9E2' }}>
      {clip ? (
        <video ref={vidRef} src={clip} muted playsInline autoPlay preload="metadata"
          poster={item.cover_url || undefined}
          onTimeUpdate={(e) => { if (e.currentTarget.currentTime >= peekSec) { try { e.currentTarget.currentTime = 0; } catch { /* 무시 */ } } }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : item.cover_url
        ? <img src={item.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUB, fontSize: 13, fontWeight: 700 }}>{emptyText}</div>}

      {item.thumb_text && (() => {
        const pos = thumbPos(item.thumb_pos);
        const color = item.thumb_color || '#FFFFFF';
        // 사장님이 정한 문구 크기 — 100이 기본이고, 목록/본문 기준 크기에 곱해 준다.
        const scale = Math.min(200, Math.max(50, Number(item.thumb_scale) || 100)) / 100;
        // 가독시간표는 오른쪽 아래에 있다. 문구가 아래쪽에 놓일 땐 그만큼 자리를 비워 둔다.
        const pad = big ? 18 : 12;
        // 아래쪽에는 가독시간표(목록에서만)와 누끼 캐릭터가 있으니 그만큼 비켜 준다.
        const bottomPad = pos.align === 'flex-end' && (badge || showRead) ? pad + 30 : pad;
        return (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: pos.align, justifyContent: pos.justify,
            padding: `${pad}px ${pad}px ${bottomPad}px`, pointerEvents: 'none' }}>
            <span style={{ fontSize: Math.round((big ? 30 : 21) * scale), fontWeight: 900, color, lineHeight: 1.2, letterSpacing: '-0.02em', wordBreak: 'keep-all',
              textAlign: pos.text, fontFamily: fontStack(item.thumb_font), textShadow: thumbShadow(color),
              // 아홉 칸 자리에서 가로·세로로 조금씩 더 민다
              transform: `translate(${Number(item.thumb_dx) || 0}%, ${Number(item.thumb_dy) || 0}%)` }}>
              {item.thumb_text}
            </span>
          </div>
        );
      })()}

      {/* 우측 하단 표 — 큐레이션은 가독시간, 바로카드는 소요 시간 */}
      {(badge || (showRead && !big)) && (
        <span style={{ position: 'absolute', right: 7, bottom: 7, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
          color: '#fff', borderRadius: 6, padding: '4px 7px', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.05, whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.04em', opacity: 0.92 }}>{badge ? badge.label : '가독시간'}</span>
          <span style={{ fontSize: 12.5, fontWeight: 800 }}>{badge ? badge.value : `${readMinutes(item)}분`}</span>
        </span>
      )}
    </div>
  );
}

// 누끼 캐릭터 줄 — 대표 이미지와 제목 사이에 선다.
export function CharRow({ chars = [], codes = [], h = 30 }) {
  if (!chars.length) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, padding: '9px 2px 3px' }}>
      <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, color: SUB, paddingBottom: 2, whiteSpace: 'nowrap' }}>
        추천 유형
      </span>
      <span style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
        {chars.map((src, i) => <CharPic key={i} src={src} code={codes[i]} h={h} />)}
      </span>
    </div>
  );
}

// 보관하기 — 작고 끝이 둥근 버튼
export function KeepChip({ onSave }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); if (onSave) onSave(); }}
      style={{ flexShrink: 0, padding: '6px 10px', fontSize: 11, fontWeight: 800, fontFamily: 'inherit', borderRadius: 14,
        border: 'none', background: KEEP_BG, color: KEEP_INK, cursor: 'pointer', lineHeight: 1.2,
        display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span>보관</span>
      <span>하기</span>
    </button>
  );
}

// 목록 카드
export default function CurationCard({ item, tone = 'z', charImage, charImages, charCodes, onOpen, onSave }) {
  const { title } = pickCurationTone(item, tone);
  // 누끼 캐릭터는 최대 4개까지 — 여러 마리면 조금씩 겹쳐 세운다.
  const chars = (charImages && charImages.length ? charImages : (charImage ? [charImage] : [])).slice(0, 4);
  const codes = charCodes || [];
  return (
    <button onClick={() => onOpen && onOpen(item)}
      style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: 0, cursor: onOpen ? 'pointer' : 'default', fontFamily: F.title }}>
      <CurationThumb item={item} />
      <CharRow chars={chars} codes={codes} h={30} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '2px 2px 0' }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: INK, lineHeight: 1.4, wordBreak: 'keep-all' }}>{title}</span>
          <span style={{ display: 'block', fontSize: 12, color: SUB, fontWeight: 600, marginTop: 5 }}>
            by. BMTI · 조회수 {fmtCount(item.view_count)}회 · 저장수 {fmtCount(item.save_count)}회
            {item.created_at ? ` · ${timeAgo(item.created_at)}` : ''}
          </span>
        </span>
        <KeepChip onSave={onSave} />
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
  tipz: `s${n}_tip_z`, tipm: `s${n}_tip_m`,
  tipqz: `s${n}_tipq_z`, tipqm: `s${n}_tipq_m`,
}));

// 마디에 딸린 사진들 — 여러 장 칸이 비어 있으면 옛 한 장짜리 칸을 쓴다.
const sectionImages = (item, sec) => {
  const many = item[sec.imgs];
  if (Array.isArray(many) && many.length) return many;
  return item[sec.img] ? [item[sec.img]] : [];
};

// 사진 한 장 또는 영상 한 편 — 영상은 소리 없이 저절로 반복된다.
function Shot({ src, alt, style }) {
  if (isClip(src)) {
    return (
      <video src={src} autoPlay loop muted playsInline preload="metadata"
        style={{ width: '100%', display: 'block', background: '#EDE9E2', ...style }} />
    );
  }
  return <img src={src} alt={alt || ''} style={{ width: '100%', display: 'block', ...style }} />;
}

// 마디에 딸린 사진·영상 — 하나면 그대로, 여럿이면 가로로 넘겨 본다.
function SectionImages({ imgs, caps, alt }) {
  const ref = useRef(null);
  const [at, setAt] = useState(0);
  if (imgs.length === 0) return null;

  if (imgs.length === 1) {
    return (
      <figure style={{ margin: '0 0 12px' }}>
        <Shot src={imgs[0]} alt={caps[0] || alt} style={{ borderRadius: 14 }} />
        {caps[0] && <figcaption style={CAP}>{caps[0]}</figcaption>}
      </figure>
    );
  }

  const onScroll = (e) => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    if (i !== at) setAt(Math.min(imgs.length - 1, Math.max(0, i)));
  };

  return (
    <figure style={{ margin: '0 0 12px' }}>
      <div ref={ref} onScroll={onScroll} className="cur-hscroll"
        style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', borderRadius: 14, WebkitOverflowScrolling: 'touch' }}>
        {imgs.map((src, k) => (
          <span key={k} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', display: 'block' }}>
            <Shot src={src} alt={caps[k] || alt} />
          </span>
        ))}
      </div>
      {/* 몇 번째 사진인지 — 점으로 알려 준다 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 8 }}>
        {imgs.map((_, k) => (
          <span key={k} style={{ width: k === at ? 14 : 5, height: 5, borderRadius: 3, background: k === at ? '#8A8378' : '#DCD6CC', transition: 'width 0.18s' }} />
        ))}
      </div>
      {caps[at] && <figcaption style={CAP}>{caps[at]}</figcaption>}
      <style>{`.cur-hscroll{scrollbar-width:none;-ms-overflow-style:none}.cur-hscroll::-webkit-scrollbar{display:none}`}</style>
    </figure>
  );
}

const CAP = { fontSize: 11.5, color: SUB, fontWeight: 600, textAlign: 'center', marginTop: 7, lineHeight: 1.5, wordBreak: 'keep-all' };

// 글 안의 두 가지 표시
//   ==이렇게==  → 연보라 형광펜
//   __이렇게__  → 연보라 글씨
const Marked = ({ text }) => String(text).split(/(==[^=]+==|__[^_]+__)/g).filter(Boolean).map((chunk, i) => {
  if (chunk.startsWith('==') && chunk.endsWith('==')) {
    return <mark key={i} style={{ background: HILITE, color: 'inherit', padding: '1px 2px', borderRadius: 3 }}>{chunk.slice(2, -2)}</mark>;
  }
  if (chunk.startsWith('__') && chunk.endsWith('__')) {
    return <span key={i} style={{ color: PURPLE, fontWeight: 800 }}>{chunk.slice(2, -2)}</span>;
  }
  return <span key={i}>{chunk}</span>;
});

// 관리자 화면에서 '이렇게 보여요'로 쓴다 — 손님 화면과 똑같은 규칙으로 그린다.
export function BodyPreview({ text }) {
  if (!String(text || '').trim()) return null;
  return <div style={{ fontFamily: F.body, color: INK }}><Paras text={text} /></div>;
}

const Paras = ({ text }) => String(text || '').trim().split(/\n{2,}/).filter(Boolean).map((p, i) => (
  <p key={i} style={{ fontSize: 14.5, lineHeight: 1.85, margin: '0 0 15px', wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>
    <Marked text={p} />
  </p>
));

// 본문
export function CurationDetail({ item, tone = 'z', cards = [], renderCard, charImage, charImages, charCodes, onSave }) {
  const { title, body } = pickCurationTone(item, tone);
  const chars = (charImages && charImages.length ? charImages : (charImage ? [charImage] : [])).slice(0, 4);
  const codes = charCodes || [];
  // 목차 — 소제목이 있는 마디만 줄지어 세운다.
  const toc = SECTIONS
    .map((sec) => ({ n: sec.n, label: (tone === 'm' ? item[sec.hm] : item[sec.hz]) || '' }))
    .filter((t) => t.label);
  const groups = (item.body_groups || []).map((g) => GROUP_LABEL[g] || g);

  return (
    <article style={{ fontFamily: F.title, color: INK }}>
      <CurationThumb item={item} radius={16} big />
      <CharRow chars={chars} codes={codes} h={36} />

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '4px 0 16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 21, fontWeight: 900, lineHeight: 1.35, letterSpacing: '-0.02em', margin: '0 0 7px', wordBreak: 'keep-all' }}>{title}</h1>
          <div style={{ fontSize: 12, color: SUB, fontWeight: 600 }}>
            by. BMTI · 조회수 {fmtCount(item.view_count)}회 · 저장수 {fmtCount(item.save_count)}회
            {item.created_at ? ` · ${timeAgo(item.created_at)}` : ''}
          </div>
        </div>
        <KeepChip onSave={onSave} />
      </div>

      {/* 초록 자리 — 마디 소제목 목차. 누르면 그 마디로 내려간다 */}
      {toc.length > 0 && (
        <nav style={{ background: '#fff', borderRadius: 14, padding: '2px 8px 8px', margin: '0 0 26px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: SUB, padding: '0 10px 4px' }}>소제목 바로가기</div>
          {toc.map((t) => (
            <button key={t.n} type="button"
              onClick={() => document.getElementById(`cur-sec-${t.n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '11px 10px',
                border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: F.head, color: INK,
                borderTop: t.n === 1 ? 'none' : '1px solid rgba(0,0,0,0.045)' }}>
              <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: '#EFE4C6', color: '#8A6E2F',
                fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.n}</span>
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, lineHeight: 1.5, wordBreak: 'keep-all' }}>
                <span style={{
                  // 손으로 대충 그은 형광펜처럼 — 양 끝이 흐리고 글자 아래쪽만 덮는다
                  background: `linear-gradient(101deg, ${MARKER}00 0.4%, ${MARKER} 2.4%, ${MARKER} 96%, ${MARKER}00 99.4%)`,
                  backgroundSize: '100% 62%', backgroundPosition: '0 82%', backgroundRepeat: 'no-repeat',
                  padding: '0 2px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',
                }}>{t.label}</span>
              </span>
              <span style={{ flexShrink: 0, color: '#C4BCAE', fontSize: 13 }}>›</span>
            </button>
          ))}
        </nav>
      )}

      {SECTIONS.map((sec, i) => {
        const text = (tone === 'm' ? item[sec.m] : item[sec.z]) || '';
        const heading = (tone === 'm' ? item[sec.hm] : item[sec.hz]) || '';
        const keyLine = (tone === 'm' ? item[sec.keym] : item[sec.keyz]) || '';
        const imgs = sectionImages(item, sec);
        const caps = Array.isArray(item[sec.caps]) ? item[sec.caps] : [];
        const tip = (tone === 'm' ? item[sec.tipm] : item[sec.tipz]) || '';
        const tipQ = (tone === 'm' ? item[sec.tipqm] : item[sec.tipqz]) || '';
        if (!text && !heading && !keyLine && !tip && !tipQ && imgs.length === 0) return null;
        return (
          <section key={i} id={`cur-sec-${sec.n}`} style={{ marginBottom: 30, fontFamily: F.body, scrollMarginTop: 12 }}>
            {heading && (
              <h2 style={{ fontFamily: F.head, fontSize: 18.5, fontWeight: 900, lineHeight: 1.45, letterSpacing: '-0.015em',
                margin: '0 0 13px', wordBreak: 'keep-all' }}>{sec.n}. {heading}</h2>
            )}
            <SectionImages imgs={imgs} caps={caps} alt={heading} />
            <Paras text={text} />
            {keyLine && (
              <p style={{ margin: '2px 0 0', padding: '2px 0 2px 14px', borderLeft: `4px solid ${KEY_BAR}`,
                fontFamily: F.key, fontSize: 14.5, fontWeight: 800, fontStyle: 'italic', lineHeight: 1.7, color: INK, wordBreak: 'keep-all' }}>
                {keyLine}
              </p>
            )}
            {/* 곁다리 팁 — 본문에서 살짝 비켜난 정보 */}
            {(tipQ || tip) && (
              <div style={{ marginTop: 16, background: '#fff', borderRadius: 13, padding: '15px 16px',
                boxShadow: '0 2px 4px rgba(220,188,86,0.16), 0 8px 20px rgba(233,203,110,0.34)' }}>
                {tipQ && (
                  <p style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.55, margin: tip ? '0 0 8px' : 0,
                    color: INK, wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>
                    <Marked text={tipQ} />
                  </p>
                )}
                {tip && (
                  <p style={{ fontSize: 13.5, lineHeight: 1.75, margin: 0, color: '#3F3A31', wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>
                    <Marked text={tip} />
                  </p>
                )}
              </div>
            )}
            {/* 마디가 끝났다는 시각적 쉼표 */}
            <div aria-hidden="true" style={{ height: 2, margin: '28px 0 0', background: DOTS }} />
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

      {/* 글을 다 읽은 뒤 — 나중에 다시 보게 담아 둔다 */}
      <button type="button" onClick={() => { if (onSave) onSave(); }}
        style={{ width: '100%', marginTop: 16, padding: '14px 16px', fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
          borderRadius: 999, border: 'none', background: KEEP_BG, color: KEEP_INK, cursor: 'pointer' }}>
        보관하고 나중에 다시 보기
      </button>

      <AiNote align="center" />
    </article>
  );
}
