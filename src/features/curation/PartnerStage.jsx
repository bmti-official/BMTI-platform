// 오프닝·마무리·다음 동작에서 내 파트너가 말을 건네는 화면.
// 세 자리가 같은 모양이라 한 조각으로 쓴다.
//
// 뒤로는 이제 할(또는 방금 한) 동작 영상이 흐릿하게 깔린다.
// 무엇을 하러 가는지 말보다 먼저 눈에 들어온다.
import { CharPic } from './CurationCard';
import { tintBg } from './typeTint';

const INK = '#1C1A17';

export default function PartnerStage({ code, img, name, say, at, len, clip, children }) {
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: tintBg(code),
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: '18px 20px 20px', boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* 뒤에 깔리는 동작 영상 — 흐릿하게 두어 글씨를 가리지 않는다 */}
      {clip && (
        <>
          <video src={clip} muted loop autoPlay playsInline preload="metadata"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              filter: 'blur(17px) saturate(1.05)', transform: 'scale(1.14)', pointerEvents: 'none' }} />
          {/* 유형 색을 한 겹 덮어 오프닝다운 바탕을 만든다 */}
          <span style={{ position: 'absolute', inset: 0, background: tintBg(code), opacity: 0.66, pointerEvents: 'none' }} />
        </>
      )}

      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        {/* 말풍선 — 캐릭터가 말하고 있다는 걸 글자 없이 알린다 */}
        {say && (
          <div style={{ position: 'relative', maxWidth: '92%', background: '#fff', borderRadius: 16,
            padding: '12px 14px', boxShadow: '0 3px 12px rgba(23,21,15,0.10)' }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.6,
              wordBreak: 'keep-all', textAlign: 'center', whiteSpace: 'pre-line' }}>{say}</span>
            <span style={{ position: 'absolute', left: '50%', bottom: -7, transform: 'translateX(-50%) rotate(45deg)',
              width: 14, height: 14, background: '#fff', borderRadius: 3 }} />
          </div>
        )}

        <span style={{ animation: 'bmtiBreathe 2.6s ease-in-out infinite' }}>
          {img ? <CharPic src={img} code={code} h={172} /> : <span style={{ fontSize: 78 }}>💬</span>}
        </span>
        <style>{'@keyframes bmtiBreathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}'}</style>

        <span style={{ fontSize: 13, fontWeight: 900, color: INK, textShadow: '0 1px 6px rgba(255,255,255,0.85)' }}>
          {name || '내 파트너'}
        </span>

        {/* 남은 시간 — 끝이 보이면 길게 느껴지지 않는다 */}
        <span style={{ width: '62%', height: 4, borderRadius: 999, background: 'rgba(23,21,15,0.16)', overflow: 'hidden' }}>
          <span style={{ display: 'block', height: '100%', borderRadius: 999, background: 'rgba(23,21,15,0.45)',
            width: `${len > 0 ? Math.min(100, (at / len) * 100) : 0}%`, transition: 'width .25s linear' }} />
        </span>

        {children}
      </div>
    </div>
  );
}
