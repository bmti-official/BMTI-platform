// 주간 알림 켜기 — 다이어리 입력창의 각도기록 상자, 주 칸 아래에 작게 둔다.
// 알림은 '이번 주 아직 안 쟀을 때'만 가므로, 주 칸 바로 아래가 가장 맞는 자리다.
// 이미 켠 사람에게는 스위치를 접어 둔다('🔔 주간 알림 켜짐 ▾'을 누르면 펼쳐진다).
import { useEffect, useState } from 'react';
import { canPush, needsHomeScreen, turnOn, turnOff, isOn } from '../../lib/webPush';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';

export default function PushToggle() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [why, setWhy] = useState('');
  const [open, setOpen] = useState(false);     // 켠 사람 — 펼쳤나

  useEffect(() => {
    let alive = true;
    isOn().then((v) => { if (alive) setOn(v); });
    return () => { alive = false; };
  }, []);

  // 아이폰은 홈 화면에 추가하기 전엔 브라우저가 알림 기능 자체를 숨긴다(canPush가 false).
  // 그래도 방법은 알려야 하니, 그때는 안내만 작게 보여 준다.
  const home = needsHomeScreen();
  if (!canPush() && !home) return null;
  const flip = async () => {
    setBusy(true); setWhy('');
    const r = on ? await turnOff() : await turnOn();
    setBusy(false);
    if (r.ok) setOn(!on); else setWhy(r.why || '');
  };

  // 켜 둔 사람 — 한 줄로 접어 둔다
  if (on && !open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        style={{ marginTop: 9, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 11, fontWeight: 800, color: SUB }}>
        🔔 주간 알림 켜짐 ▾
      </button>
    );
  }

  return (
    <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.7)', borderRadius: 11, padding: '8px 10px',
      boxShadow: `inset 0 0 0 1px ${LINE}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 11, lineHeight: 1.5 }}>
          <b style={{ fontWeight: 900, color: INK }}>🔔 주간 알림</b>
          <span style={{ fontWeight: 700, color: SUB, marginLeft: 5 }}>
            {home ? '아이폰은 Safari 아래 공유 버튼 → ‘홈 화면에 추가’ 후, 홈 화면 아이콘으로 열면 켤 수 있어요.' : '그 주에 아직 안 쟀을 때만 한 번 알려 드려요.'}
          </span>
        </div>
        <button type="button" onClick={flip} disabled={busy || home} aria-label="주간 알림 켜고 끄기"
          style={{ flexShrink: 0, width: 38, height: 22, borderRadius: 999, border: 'none',
            cursor: busy || home ? 'default' : 'pointer', position: 'relative',
            background: on ? '#C9975A' : '#E6E1D8', opacity: home ? 0.5 : 1, transition: 'background .2s' }}>
          <span style={{ position: 'absolute', top: 3, left: on ? 19 : 3, width: 16, height: 16, borderRadius: '50%',
            background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left .2s' }} />
        </button>
        {on && (
          <button type="button" onClick={() => setOpen(false)} aria-label="접기"
            style={{ flexShrink: 0, border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 2px',
              fontFamily: 'inherit', fontSize: 11, fontWeight: 900, color: SUB }}>▴</button>
        )}
      </div>
      {why && <div style={{ fontSize: 11, color: '#B23B36', fontWeight: 700, marginTop: 6 }}>{why}</div>}
    </div>
  );
}
