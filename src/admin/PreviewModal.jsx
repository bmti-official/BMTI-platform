import { useState } from 'react';
import { INK, SUB, LINE, ACCENT, btn } from './theme';
import { CHARACTERS } from '../data';
import { Mallang } from '../components/Mallang';

// 손님 화면 미리보기 창 — 휴대폰 틀 안에 넣어 실제로 보일 모습 그대로 확인한다.
// Z/M 말투를 토글해 두 벌이 각각 어떻게 읽히는지 바로 비교할 수 있다.

const SIZES = [
  { key: 'phone', label: '휴대폰 390', w: 390, h: 760 },
  { key: 'big', label: '큰 폰 430', w: 430, h: 800 },
];

// 실제 앱의 화면 껍데기를 그대로 흉내 낸다 — 홈 버튼 · 마이페이지 · 하단 알약.
// 손님이 보는 자리를 가리지 않는지 여기서 바로 확인한다. 누를 수는 없다.

// 홈 버튼 — 실제 앱과 같은 집 모양. 아래에 작게 이름만 붙인다.
const HomeMark = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
    <path d="M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1v-8.8Z" fill="currentColor" />
  </svg>
);
const PersonMark = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="4" fill="currentColor" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8Z" fill="currentColor" />
  </svg>
);
// 하단 알약 네 칸의 그림
const BookMark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
    <path d="M12 6.2C10.3 5 7.4 4.5 4.3 5v12.6C7.4 17.1 10.3 17.6 12 18.8" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    <path d="M12 6.2C13.7 5 16.6 4.5 19.7 5v12.6C16.6 17.1 13.7 17.6 12 18.8" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    <path d="M12 6.2V18.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);
const BoltMark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
    <path d="M13.4 2.5 5.2 13.4h5.6l-.9 8.1 8.5-11.2h-5.8l.8-7.8Z" fill="currentColor" />
  </svg>
);
const PlayListMark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
    <path d="M4 6.5h11M4 11h11M4 15.5h7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <circle cx="17.5" cy="17" r="3" stroke="currentColor" strokeWidth="1.9" />
    <path d="M20.5 17V7.6l2.5.9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NAV = [
  { key: 'curation', label: '큐레이션', icon: <BookMark /> },
  { key: 'cards', label: '바로카드', icon: <BoltMark /> },
  { key: 'char' },
  { key: 'routines', label: '건강플리', icon: <PlayListMark /> },
  { key: 'diary', label: '다이어리', icon: <Mallang v={4} size={22} noBlink /> },
];

// 손님 화면 껍데기 — 위 두 버튼과 아래 알약
function AppChrome({ tone, active }) {
  const code = tone === 'm' ? 'OCDM' : 'ACDZ';
  const ch = CHARACTERS.find((c) => c.id === code);
  const off = { color: '#9CA3AF' };
  return (
    <>
      {/* 왼쪽 위 홈 — 동그란 버튼 아래에 이름 한 줄 */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 30, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44,
          borderRadius: '50%', background: 'rgba(255,255,255,0.95)', border: '1px solid #F1F1F1',
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)', color: '#111' }}>
          <HomeMark />
        </span>
        <span style={{ fontSize: 9.5, fontWeight: 900, color: '#6B7280', letterSpacing: '0.02em' }}>BMTI</span>
      </div>

      {/* 오른쪽 위 마이페이지 */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 30, pointerEvents: 'none' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, height: 44, paddingLeft: 13, paddingRight: 6,
          borderRadius: 999, background: 'rgba(255,255,255,0.95)', border: '1px solid #F1F1F1', boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', background: '#8B7BD8', borderRadius: 8, padding: '2px 7px' }}>{code}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#374151' }}>회원</span>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
            <PersonMark />
          </span>
        </span>
      </div>

      {/* 아래 알약 */}
      <div style={{ position: 'absolute', left: 8, right: 8, bottom: 12, zIndex: 30, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.95)', borderRadius: 999,
          border: '1px solid #F1F1F1', boxShadow: '0 4px 16px rgba(0,0,0,0.14)', padding: '4px 6px' }}>
          {NAV.map((t) => (t.key === 'char' ? (
            <span key="char" style={{ width: 56, flexShrink: 0 }} />
          ) : (
            <span key={t.key} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '6px 0', borderRadius: 16, background: active === t.key ? '#F3F1EC' : 'transparent' }}>
              <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...(active === t.key ? { color: '#111' } : { ...off, opacity: 0.45, filter: 'grayscale(1)' }) }}>{t.icon}</span>
              <span style={{ fontSize: 9.5, fontWeight: 800, whiteSpace: 'nowrap', color: active === t.key ? '#000' : '#9CA3AF' }}>{t.label}</span>
            </span>
          )))}
        </div>
      </div>

      {/* 가운데 누끼 캐릭터 — 알약 위로 떠 있다 */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 20, zIndex: 31, pointerEvents: 'none' }}>
        <span style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.18))' }}>
          {ch ? <img src={ch.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 30 }}>⭐️</span>}
        </span>
      </div>
    </>
  );
}

export default function PreviewModal({ title, onClose, children, navActive = 'curation' }) {
  const [tone, setTone] = useState('z');
  const [size, setSize] = useState(SIZES[0]);

  const chip = (on) => ({
    padding: '5px 11px', fontSize: 12, fontWeight: 800, fontFamily: 'inherit', borderRadius: 999, border: 'none', cursor: 'pointer',
    background: on ? ACCENT : '#fff', color: on ? '#fff' : SUB, boxShadow: on ? 'none' : `inset 0 0 0 1px ${LINE}`,
  });

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(20,18,14,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '96vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14.5, fontWeight: 900, color: '#fff' }}>{title}</div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
            {[['z', 'Z 유형 (담백)'], ['m', 'M 유형 (다정)']].map(([k, lb]) => (
              <button key={k} onClick={() => setTone(k)} style={chip(tone === k)}>{lb}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {SIZES.map((sz) => (
              <button key={sz.key} onClick={() => setSize(sz)} style={chip(size.key === sz.key)}>{sz.label}</button>
            ))}
          </div>
          <button onClick={onClose} style={{ ...btn(false), marginLeft: 'auto' }}>닫기</button>
        </div>

        {/* 휴대폰 틀 — 손님이 쥐고 보는 그대로 */}
        <div style={{ position: 'relative', width: size.w + 20, maxWidth: '92vw', height: `min(${size.h + 20}px, 82vh)`,
          background: '#17150F', borderRadius: 46, padding: 10, boxShadow: '0 20px 60px rgba(0,0,0,0.45)', flexShrink: 0 }}>
          {/* transform을 걸어 두면 안쪽의 fixed 팝업이 휴대폰 틀 안에 갇힌다 — 손님 화면 그대로 보인다 */}
          <div style={{ position: 'relative', width: '100%', height: '100%', background: '#fff', borderRadius: 38, overflow: 'hidden',
            display: 'flex', flexDirection: 'column', transform: 'translateZ(0)' }}>
            {/* 상태 줄 */}
            <div style={{ flexShrink: 0, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', fontSize: 11, fontWeight: 800, color: INK }}>
              <span>9:41</span>
              <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 6, width: 78, height: 20, background: '#17150F', borderRadius: 999 }} />
              <span style={{ letterSpacing: 1 }}>▮▮▮</span>
            </div>
            {/* 본문 — 실제 앱과 같은 좌우 여백 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '64px 16px 92px', WebkitOverflowScrolling: 'touch' }}>
              {children(tone)}
            </div>
            <AppChrome tone={tone} active={navActive} />
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.72)', textAlign: 'center' }}>
          손님에게는 자기 BMTI 유형에 맞는 말투 하나만 보입니다 · 아래 메뉴는 모양만 흉내 낸 것입니다
        </div>
      </div>
    </div>
  );
}
