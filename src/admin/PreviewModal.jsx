import { useState } from 'react';
import { INK, SUB, LINE, ACCENT, btn } from './theme';

// 손님 화면 미리보기 창 — 휴대폰 폭(390px)으로 감싸 실제로 보일 모습을 확인한다.
// Z/M 말투를 토글해 두 벌이 각각 어떻게 읽히는지 바로 비교할 수 있다.
export default function PreviewModal({ title, onClose, children }) {
  const [tone, setTone] = useState('z');
  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(20,18,14,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: '#F7F5F0', borderRadius: 18, padding: 18, maxHeight: '92vh', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 14.5, fontWeight: 900, color: INK }}>{title}</div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
            {[['z', 'Z 유형 (담백)'], ['m', 'M 유형 (다정)']].map(([k, lb]) => (
              <button key={k} onClick={() => setTone(k)}
                style={{ padding: '5px 11px', fontSize: 12, fontWeight: 800, fontFamily: 'inherit', borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: tone === k ? ACCENT : '#fff', color: tone === k ? '#fff' : SUB, boxShadow: tone === k ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
                {lb}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{ ...btn(false), marginLeft: 'auto' }}>닫기</button>
        </div>

        {/* 휴대폰 화면 흉내 — 손님이 보는 폭 그대로 */}
        <div style={{ width: 390, maxWidth: '86vw', flex: 1, overflowY: 'auto', background: '#fff', borderRadius: 14, border: `1px solid ${LINE}`, padding: 16 }}>
          {children(tone)}
        </div>
        <div style={{ fontSize: 11.5, color: SUB, textAlign: 'center' }}>
          손님에게는 자기 BMTI 유형에 맞는 말투 하나만 보입니다.
        </div>
      </div>
    </div>
  );
}
