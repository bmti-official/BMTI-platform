// 전체 화면 — 4:5 그대로 화면에 꽉 차게 키우고, 남는 자리는 화이트로 둔다.
// 비율을 지켜야 영상 위에 얹은 글씨가 영상 안에 앉는다.
// below: 영상 아래에 이어 붙일 것(알아 두기 등) — 있으면 아래로 내려 볼 수 있다.
export default function FullWrap({ on, children, below = null }) {
  if (!on) return children;
  if (below) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: '#fff', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ width: '100%', maxWidth: 'min(100%, 80vh)', margin: '0 auto' }}>
          {children}
          {below}
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 'min(100%, 80vh)' }}>{children}</div>
    </div>
  );
}
