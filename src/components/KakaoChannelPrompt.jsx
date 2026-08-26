import { useEffect, useState } from 'react';
import {
  addKakaoChannel, hasAddedKakaoChannel,
  isKakaoChannelPromptDismissed, dismissKakaoChannelPrompt,
} from '../lib/kakaoChannel';

// '자기점검 50분' 카카오톡 채널 친구 추가 안내 — 화면 하단 띠 배너.
// 채널을 추가하면 기록 리마인드와 새 소식을 카카오톡으로 받을 수 있다.
//
// 이미 추가한 이용자인지는 카카오 로그인 권한(카카오톡 채널 관계)이 있어야 서버로 확인할 수 있어,
// 지금은 이 기기에서 '추가'를 눌렀는지/닫았는지로만 판단한다.
export default function KakaoChannelPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (hasAddedKakaoChannel() || isKakaoChannelPromptDismissed()) return;
    // 들어오자마자 띄우면 방해가 되니 잠시 뒤에 보여준다.
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const close = () => { setShow(false); dismissKakaoChannelPrompt(); };
  const add = () => { addKakaoChannel(); setShow(false); };

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 78, width: 'calc(100% - 28px)', maxWidth: 440, zIndex: 55,
      background: '#fff', border: '1px solid #EDE9E2', borderRadius: 18, boxShadow: '0 6px 24px rgba(28,26,23,0.16)', padding: '14px 15px',
      fontFamily: "'Pretendard',-apple-system,sans-serif", display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: '#FEE500', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: '#3C1E1E' }}>
          <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1C1A17', lineHeight: 1.35 }}>‘자기점검 50분’ 카카오톡 채널 추가</div>
        <div style={{ fontSize: 11.5, color: '#8A8378', fontWeight: 600, marginTop: 2, lineHeight: 1.4 }}>
          기록 알림과 새 소식을 카카오톡으로 받아보세요.
        </div>
      </div>
      <button onClick={add}
        style={{ flexShrink: 0, border: 'none', background: '#FEE500', color: '#3C1E1E', fontSize: 12.5, fontWeight: 800, padding: '9px 14px', borderRadius: 11, cursor: 'pointer' }}>
        친구 추가
      </button>
      <button onClick={close} aria-label="닫기"
        style={{ flexShrink: 0, border: 'none', background: 'transparent', color: '#B7B2A9', fontSize: 15, cursor: 'pointer', padding: 2 }}>✕</button>
    </div>
  );
}
