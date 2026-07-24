import { useEffect, useState } from 'react';
import { GOLD } from '../lib/typeAccent';

// 홈 화면에 추가(설치) 안내 — 설치하면 앱처럼 열리고 기록이 휴대폰에 안전하게 캐시된다.
// Android/Chrome: beforeinstallprompt로 실제 설치. iOS Safari: 공유 메뉴 안내.
const DISMISS_KEY = 'bmti_install_dismissed';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [mode, setMode] = useState(null); // 'android' | 'ios' | null

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;
    if (standalone) return; // 이미 설치됨

    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); setMode('android'); };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS Safari는 beforeinstallprompt가 없어 직접 안내한다.
    const ua = window.navigator.userAgent || '';
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = isIOS && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    let iosTimer;
    if (isIOS && isSafari) iosTimer = setTimeout(() => setMode((m) => m || 'ios'), 2500);

    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); clearTimeout(iosTimer); };
  }, []);

  const dismiss = () => { setMode(null); localStorage.setItem(DISMISS_KEY, '1'); };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setDeferred(null);
    dismiss();
  };

  if (!mode) return null;

  return (
    <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 78, width: 'calc(100% - 28px)', maxWidth: 440, zIndex: 55,
      background: '#fff', border: '1px solid #EDE9E2', borderRadius: 18, boxShadow: '0 6px 24px rgba(28,26,23,0.16)', padding: '14px 15px',
      fontFamily: "'Pretendard',-apple-system,sans-serif", display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: '#FDF6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📥</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1C1A17', lineHeight: 1.35 }}>홈 화면에 추가하고 기록을 안전하게</div>
        <div style={{ fontSize: 11.5, color: '#8A8378', fontWeight: 600, marginTop: 2, lineHeight: 1.4 }}>
          {mode === 'ios' ? '공유 버튼 → ‘홈 화면에 추가’를 누르면 돼요.' : '앱처럼 열리고 기록이 휴대폰에 저장돼요.'}
        </div>
      </div>
      {mode === 'android'
        ? <button onClick={install} style={{ flexShrink: 0, border: 'none', background: GOLD, color: '#fff', fontSize: 12.5, fontWeight: 800, padding: '9px 14px', borderRadius: 11, cursor: 'pointer' }}>추가</button>
        : <button onClick={dismiss} style={{ flexShrink: 0, border: 'none', background: '#F3F1EC', color: '#8A8378', fontSize: 12.5, fontWeight: 800, padding: '9px 12px', borderRadius: 11, cursor: 'pointer' }}>확인</button>}
      <button onClick={dismiss} aria-label="닫기" style={{ flexShrink: 0, border: 'none', background: 'transparent', color: '#B7B2A9', fontSize: 15, cursor: 'pointer', padding: 2 }}>✕</button>
    </div>
  );
}
