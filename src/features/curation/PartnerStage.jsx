// 오프닝·마무리·다음 동작에서 내 파트너가 말을 건네는 화면.
// 세 자리가 같은 모양이라 한 조각으로 쓴다.
import { CharPic } from './CurationCard';
import { tintBg } from './typeTint';

const INK = '#1C1A17';

export default function PartnerStage({ code, img, name, say, at, len, children }) {
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: tintBg(code),
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: '18px 20px 20px', boxSizing: 'border-box' }}>
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

      <span style={{ fontSize: 13, fontWeight: 900, color: INK }}>{name || '내 파트너'}</span>

      {/* 남은 시간 — 끝이 보이면 길게 느껴지지 않는다 */}
      <span style={{ width: '62%', height: 4, borderRadius: 999, background: 'rgba(23,21,15,0.10)', overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', borderRadius: 999, background: 'rgba(23,21,15,0.35)',
          width: `${len > 0 ? Math.min(100, (at / len) * 100) : 0}%`, transition: 'width .25s linear' }} />
      </span>

      {children}
    </div>
  );
}
