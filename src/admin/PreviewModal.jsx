import { useState } from 'react';
import { INK, SUB, LINE, ACCENT, btn } from './theme';

// 손님 화면 미리보기 창 — 휴대폰 틀 안에 넣어 실제로 보일 모습 그대로 확인한다.
// Z/M 말투를 토글해 두 벌이 각각 어떻게 읽히는지 바로 비교할 수 있다.

const SIZES = [
  { key: 'phone', label: '휴대폰 390', w: 390, h: 760 },
  { key: 'big', label: '큰 폰 430', w: 430, h: 800 },
];

// 실제 앱 아래에 떠 있는 알약 모양 메뉴를 흉내 낸다(누를 수는 없다).
function FakeNav() {
  return (
    <div style={{ position: 'absolute', left: 8, right: 8, bottom: 12, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.96)',
        borderRadius: 999, border: '1px solid #F1F1F1', boxShadow: '0 4px 16px rgba(0,0,0,0.14)', padding: '7px 14px' }}>
        {['BMTI', '나의유형', '', '다이어리', '기록·발견'].map((lb, i) => (
          <span key={i} style={{ fontSize: 10.5, fontWeight: 700, color: '#B9B3A8', minWidth: i === 2 ? 44 : undefined, textAlign: 'center' }}>{lb}</span>
        ))}
      </div>
    </div>
  );
}

export default function PreviewModal({ title, onClose, children }) {
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
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 88px', WebkitOverflowScrolling: 'touch' }}>
              {children(tone)}
            </div>
            <FakeNav />
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.72)', textAlign: 'center' }}>
          손님에게는 자기 BMTI 유형에 맞는 말투 하나만 보입니다 · 아래 메뉴는 모양만 흉내 낸 것입니다
        </div>
      </div>
    </div>
  );
}
