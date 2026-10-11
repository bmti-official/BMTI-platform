// 전체 화면 — 4:5 그대로 화면에 꽉 차게 키우고, 남는 자리는 화이트로 둔다.
// 비율을 지켜야 영상 위에 얹은 글씨가 영상 안에 앉는다.
//
// onBack  왼쪽 위 화살표 — 하던 것을 그만두고 시작하기 전 화면으로 나간다(묻는 일은 부르는 쪽이 한다)
// corner  오른쪽 위에 놓을 것(설명 보기 버튼)
const INK = '#1C1A17';

export default function FullWrap({ on, onBack = null, corner = null, children }) {
  if (!on) return children;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 'min(100%, 80vh)' }}>{children}</div>
      {onBack && (
        <button type="button" onClick={onBack} aria-label="나가기"
          style={{ position: 'absolute', top: 'max(18px, env(safe-area-inset-top))', left: 12, zIndex: 8, width: 38, height: 38, borderRadius: '50%',
            border: 'none', background: 'rgba(255,255,255,0.94)', boxShadow: '0 2px 10px rgba(0,0,0,0.14)', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 20, fontWeight: 800, color: INK, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ‹
        </button>
      )}
      {corner && (
        <div style={{ position: 'absolute', top: 'max(18px, env(safe-area-inset-top))', right: 12, zIndex: 8 }}>{corner}</div>
      )}
    </div>
  );
}
