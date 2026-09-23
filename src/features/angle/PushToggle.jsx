// 주간 알림 켜기 — 각도기록 화면 아래에 둔다.
// 알림은 '이번 주 아직 안 쟀을 때'만 가므로, 이 화면이 가장 맞는 자리다.
import { useEffect, useState } from 'react';
import { canPush, needsHomeScreen, turnOn, turnOff, isOn } from '../../lib/webPush';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';

export default function PushToggle() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [why, setWhy] = useState('');

  useEffect(() => {
    let alive = true;
    isOn().then((v) => { if (alive) setOn(v); });
    return () => { alive = false; };
  }, []);

  if (!canPush()) return null;

  const home = needsHomeScreen();
  const flip = async () => {
    setBusy(true); setWhy('');
    const r = on ? await turnOff() : await turnOn();
    setBusy(false);
    if (r.ok) setOn(!on); else setWhy(r.why || '');
  };

  return (
    <div style={{ marginTop: 14, background: '#fff', borderRadius: 14, padding: '13px 14px',
      boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: INK }}>주간 알림</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: SUB, marginTop: 2, lineHeight: 1.6 }}>
            {home ? '아이폰은 홈 화면에 추가해야 알림을 받을 수 있어요.'
              : '그 주에 아직 안 쟀을 때만 한 번 알려 드려요.'}
          </div>
        </div>
        <button type="button" onClick={flip} disabled={busy || home}
          style={{ flexShrink: 0, width: 50, height: 28, borderRadius: 999, border: 'none',
            cursor: busy || home ? 'default' : 'pointer', position: 'relative',
            background: on ? '#C9975A' : '#E6E1D8', opacity: home ? 0.5 : 1, transition: 'background .2s' }}>
          <span style={{ position: 'absolute', top: 3, left: on ? 25 : 3, width: 22, height: 22, borderRadius: '50%',
            background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left .2s' }} />
        </button>
      </div>
      {why && <div style={{ fontSize: 11.5, color: '#B23B36', fontWeight: 700, marginTop: 8 }}>{why}</div>}
    </div>
  );
}
