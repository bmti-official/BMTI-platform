// 전체 화면 — 4:5 그대로 화면에 꽉 차게 키우고, 남는 자리는 화이트로 둔다.
// 비율을 지켜야 영상 위에 얹은 글씨가 영상 안에 앉는다.
export default function FullWrap({ on, children }) {
  if (!on) return children;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 'min(100%, 80vh)' }}>{children}</div>
    </div>
  );
}
