// '설명 보기' — 어디서 누르든 아래에서 올라오는 같은 창.
// 예전엔 카드 뒤집은 뒷면 · 영상 아래 펼친 상자 · 접는 상자 · 전체 화면 창, 네 모양이었다.
//
// 차례는 늘 ⛔ 하지 마세요 → 👍 좋습니다 → 🎯 쓰는 곳. 다치지 않게 하는 말이 먼저다.
//   머리   종류 이름표 · 동작 이름, 그 아래 한 줄 요약(걸리는 시간 · 도구 · 타겟 부위)
//   ⛔     연한 붉은 바탕, 굵은 글씨, 늘 다 펼친다
//   👍 🎯  세 줄까지 보이고 넘치면 '더 보기'
//   🎯     몸 그림 위에 부위마다 동그란 점을 찍는다(핵심은 진한 보라·크게, 연관은 연한 보라·작게)
//   이렇게 해요  시작 전 그림을 원본 그대로 나란히, 그 아래 시작 전 설명(멘트 자막)
//   아래   고정 버튼 하나(표지에선 바로 따라하기, 하는 중엔 이어서 하기)
//
// 창은 body에 붙인다 — 카드가 들어 있는 틀(넘겨 보기·전체 화면)의 높이나 겹침 순서에 갇히지 않게.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { KIND_LABEL, cardShortName, introImgs, toneField } from './format';
import { KEY_TO_PART_LABEL } from '../../lib/diaryEntryLabels';
import { HOTSPOTS } from '../../lib/mallangProfile';
import femaleFront from '../../assets/3d_body/female_front.png';
import femaleBack from '../../assets/3d_body/female_back.png';
import maleFront from '../../assets/3d_body/male_front.png';
import maleBack from '../../assets/3d_body/male_back.png';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
// 머리의 종류 이름표 색 — 카드 표지의 이름표와 같다.
const KIND_INK = { exercise: '#8B7BD8', massage: '#E08B57', stretch: '#6FAE6A' };
const AVOID_INK = '#B23B36', AVOID_BG = '#FDEEEC';
const GOOD_INK = '#3F7F5B';
// 🎯 몸 그림의 점 — 종류와 상관없이 보라. 핵심은 진하게, 연관은 연하게.
const CORE_DOT = '#6E5BD0', RELATED_DOT = '#C7BDF3';
const FOLD = 3;   // 세 줄까지 보이고 넘치면 '더 보기'

const LINES = (t) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean);

// 몸 그림은 내 성별로(모르면 여성 그림). 로그인할 때 적어 둔 내 정보에서 읽는다.
const isMale = () => {
  try {
    const u = JSON.parse(localStorage.getItem('bmti_user') || 'null') || {};
    return ['male', 'm', '남성', '남'].includes(String(u.gender || u.kakao_gender || '').toLowerCase());
  } catch { return false; }
};

// 부위 키(neck 등) → 앞·뒤 그림 위 자리. 건강 정보 한 장에서 누르는 자리와 같은 좌표다.
function spotsOf(keys) {
  const out = { front: [], back: [] };
  (keys || []).forEach((k) => {
    const label = KEY_TO_PART_LABEL[k] || k;
    ['front', 'back'].forEach((v) => {
      (HOTSPOTS[v] || []).filter((z) => z.part === label).forEach((z) => out[v].push({ key: k, x: z.x + z.w / 2, y: z.y + z.h / 2 }));
    });
  });
  return out;
}

function BodyFocus({ card }) {
  const core = spotsOf(card.core_parts);
  // 핵심 부위와 겹치는 연관 부위는 그리지 않는다(핵심이 이미 칠해져 있다)
  const related = spotsOf((card.related_parts || []).filter((k) => !(card.core_parts || []).includes(k)));
  const male = isMale();
  const imgs = { front: male ? maleFront : femaleFront, back: male ? maleBack : femaleBack };
  if (!core.front.length && !core.back.length && !related.front.length && !related.back.length) return null;

  // 동그란 점 — 흰 테두리를 둘러 어두운 옷 위에서도 또렷하게
  const dot = (s, strong, i) => (
    <span key={`${s.key}-${i}-${strong ? 'c' : 'r'}`}
      style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: strong ? '17%' : '12%', aspectRatio: '1 / 1',
        transform: 'translate(-50%,-50%)', borderRadius: '50%', pointerEvents: 'none', boxSizing: 'border-box',
        background: strong ? CORE_DOT : RELATED_DOT, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.22)' }} />
  );
  const figure = (view, label) => (
    <div style={{ flex: '0 1 112px', minWidth: 0 }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 2', borderRadius: 14, overflow: 'hidden',
        background: 'linear-gradient(180deg,#FAF8F3,#F3F1EC)' }}>
        <img src={imgs[view]} alt="" draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
        {related[view].map((s, i) => dot(s, false, i))}
        {core[view].map((s, i) => dot(s, true, i))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: SUB, marginTop: 4 }}>{label}</div>
    </div>
  );
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
        {figure('front', '앞모습')}
        {figure('back', '뒷모습')}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 6, fontSize: 11, fontWeight: 700, color: SUB }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: CORE_DOT, marginRight: 4, verticalAlign: '-1px' }} />핵심 부위</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: RELATED_DOT, marginRight: 4, verticalAlign: '-1px' }} />연관 부위</span>
      </div>
    </div>
  );
}

function Rows({ items, color, bold = false }) {
  return (
    <ul style={{ margin: '7px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 5 }}>
      {items.map((x) => (
        <li key={x} style={{ display: 'flex', gap: 7, fontSize: 13, lineHeight: 1.5, color: INK, fontWeight: bold ? 700 : 500, wordBreak: 'keep-all' }}>
          <span style={{ flexShrink: 0, color, fontWeight: 900 }}>•</span>
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

// 세 줄까지 보이고 넘치면 '더 보기'
function Folded({ items, color }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, FOLD);
  return (
    <>
      <Rows items={shown} color={color} />
      {items.length > FOLD && (
        <button type="button" onClick={() => setAll((v) => !v)}
          style={{ marginTop: 6, padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 800, color: SUB }}>
          {all ? '접기 ▲' : `더 보기 (${items.length - FOLD}) ▼`}
        </button>
      )}
    </>
  );
}

/**
 * card       바디카드 한 장
 * tone       제목을 고를 말투(z·m)
 * totalSec   지금 설정대로 다 했을 때 걸리는 시간(0이면 적지 않는다)
 * action     아래 고정 버튼 글씨 · onAction 그 버튼
 * onClose    닫기(바깥을 눌러도 닫힌다)
 */
export default function CardInfoSheet({ card, tone = 'z', totalSec = 0, action = '닫기', onAction, onClose }) {
  // 뒤 화면이 같이 굴러가지 않게
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const avoid = LINES(card?.avoid_when);
  const good = LINES(card?.good_when);
  const focus = LINES(card?.focus_body);
  const kindColor = KIND_INK[card?.kind] || '#8B7BD8';
  const parts = (card?.core_parts || []).map((k) => KEY_TO_PART_LABEL[k] || k);
  const tools = (card?.tools || []).filter(Boolean);
  const mm = totalSec > 0 ? `${Math.floor(totalSec / 60)}분${totalSec % 60 ? ` ${totalSec % 60}초` : ''}` : '';
  const summary = [mm, tools.length ? tools.join(', ') : '도구 없음', parts.join(', ')].filter(Boolean).join(' · ');
  const stills = introImgs(card || {}).slice(0, 3);
  // 시작 전 설명 — 멘트 자막의 첫 자리. 한 벌로 쓴 카드는 Z 칸에만 있다.
  const introText = String((toneField(card || {}, 'sub_sets', tone) || [])[0] || '').trim();
  const head = (txt, color) => <div style={{ fontSize: 13, fontWeight: 900, color, letterSpacing: '-0.01em' }}>{txt}</div>;

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(28,26,23,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      <style>{'@keyframes bmtiInfoUp{from{transform:translateY(28px);opacity:.5}to{transform:none;opacity:1}}'}</style>
      <div role="dialog" aria-modal="true" aria-label="설명 보기" onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: '#fff',
          borderRadius: '22px 22px 0 0', color: INK, animation: 'bmtiInfoUp .22s ease-out', boxSizing: 'border-box' }}>

        {/* 머리 — 종류 · 동작 이름, 한 줄 요약 */}
        <div style={{ padding: '16px 18px 10px', borderBottom: `1px solid ${LINE}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 900, color: kindColor, background: '#fff', borderRadius: 10,
              padding: '5px 10px', boxShadow: `inset 0 0 0 1px ${LINE}`, whiteSpace: 'nowrap' }}>
              {KIND_LABEL[card?.kind] || '동작'}
            </span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 15.5, fontWeight: 900, lineHeight: 1.35, wordBreak: 'keep-all' }}>
              {cardShortName(card || {}, tone)}
            </span>
            <button type="button" onClick={onClose} aria-label="닫기"
              style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#F4F1EB',
                fontSize: 16, fontWeight: 800, color: INK, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>✕</button>
          </div>
          {summary && (
            <div style={{ marginTop: 7, fontSize: 12, fontWeight: 700, color: SUB, lineHeight: 1.45, wordBreak: 'keep-all' }}>{summary}</div>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 18px 14px', display: 'grid', gap: 10, alignContent: 'start' }}>
          {avoid.length > 0 && (
            <section style={{ padding: '12px 14px', borderRadius: 14, background: AVOID_BG }}>
              {head('⛔ 이럴 땐 하지 마세요', AVOID_INK)}
              <Rows items={avoid} color={AVOID_INK} bold />
            </section>
          )}
          {good.length > 0 && (
            <section style={{ padding: '12px 14px', borderRadius: 14, background: '#F5FAF6' }}>
              {head('👍 이럴 때 좋습니다', GOOD_INK)}
              <Folded items={good} color={GOOD_INK} />
            </section>
          )}
          {(focus.length > 0 || (card?.core_parts || []).length > 0) && (
            <section style={{ padding: '12px 14px', borderRadius: 14, background: '#FAF7F0' }}>
              {head('🎯 쓰는 곳', '#8A6A3A')}
              <BodyFocus card={card} />
              {focus.length > 0 && <Folded items={focus} color="#8A6A3A" />}
            </section>
          )}
          {(stills.length > 0 || introText) && (
            <section style={{ padding: '12px 14px', borderRadius: 14, background: '#FAF7F0' }}>
              {head('이렇게 해요', INK)}
              {stills.length > 0 && (
                // 그림은 원본 그대로 — 동작 화면에서 자막 자리를 비우려고 줄이거나 내려 둔 값은 여기서 따르지 않는다
                <div style={{ display: 'flex', gap: 7, marginTop: 8, alignItems: 'flex-start' }}>
                  {stills.map((m, i) => (
                    <div key={m.url} style={{ flex: '1 1 0', minWidth: 0, position: 'relative', borderRadius: 11, overflow: 'hidden', background: '#fff' }}>
                      <img src={m.url} alt={`시작 전 그림 ${i + 1}`} draggable={false}
                        style={{ width: '100%', height: 'auto', display: 'block' }} />
                      <span style={{ position: 'absolute', left: 6, top: 6, fontSize: 10.5, fontWeight: 900, color: INK,
                        background: 'rgba(255,255,255,0.9)', borderRadius: 7, padding: '1px 6px' }}>{i + 1}</span>
                    </div>
                  ))}
                </div>
              )}
              {introText && (
                <p style={{ margin: stills.length ? '10px 0 0' : '8px 0 0', fontSize: 13, lineHeight: 1.6, color: INK,
                  wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{introText}</p>
              )}
            </section>
          )}
        </div>

        {/* 아래 고정 버튼 */}
        <div style={{ padding: '10px 18px calc(14px + env(safe-area-inset-bottom))', borderTop: `1px solid ${LINE}` }}>
          <button type="button" onClick={onAction || onClose}
            style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 14.5, fontWeight: 800, background: '#fff', color: INK, boxShadow: '0 3px 10px rgba(217,185,106,0.45)' }}>
            {action}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** 카드 안에 두는 입구 — ⛔ 첫 줄을 늘 보여 주고, 누르면 창을 연다. */
export function CardInfoEntry({ card, onOpen }) {
  const avoid = LINES(card?.avoid_when);
  return (
    <button type="button" onClick={onOpen}
      style={{ width: '100%', marginTop: 10, padding: '11px 13px', borderRadius: 13, border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', textAlign: 'left', background: avoid.length ? AVOID_BG : '#FAF7F0', display: 'block' }}>
      {avoid.length > 0 && (
        <>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 900, color: AVOID_INK }}>⛔ 이럴 땐 하지 마세요</span>
          <span style={{ display: 'block', marginTop: 4, fontSize: 12.5, fontWeight: 700, color: INK, lineHeight: 1.45, wordBreak: 'keep-all',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>• {avoid[0]}</span>
        </>
      )}
      <span style={{ display: 'block', marginTop: avoid.length ? 6 : 0, fontSize: 12, fontWeight: 800, color: SUB }}>
        이 동작 알아 두기 모두 보기 ›
      </span>
    </button>
  );
}
