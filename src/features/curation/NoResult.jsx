// 못 찾았을 때 — 빈 화면으로 끝내지 않는다.
// 한 글자쯤 틀린 말이면 '혹시 이 말?'을 권하고, 아니면 부위 알약을 눌러 보라고 알려 준다.
import { josa } from '../../lib/josa';

const SUB = '#8A8378', LINE = '#EDE9E2', GOLD_INK = '#8A6A3A', YELLOW = '#FDF6DC';

export default function NoResult({ text, hint = '', onPick = null, tip = '' }) {
  return (
    <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: '24px 16px', textAlign: 'center',
      fontSize: 13, color: SUB, fontWeight: 600, lineHeight: 1.7, wordBreak: 'keep-all' }}>
      <div>{text}</div>
      {hint && onPick && (
        <button type="button" onClick={() => onPick(hint)}
          style={{ marginTop: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 999,
            padding: '8px 14px', background: YELLOW, color: GOLD_INK, fontSize: 12.5, fontWeight: 800 }}>
          혹시 ‘{hint}’{josa(hint, '을').slice(hint.length)} 찾으세요?
        </button>
      )}
      {tip && <div style={{ marginTop: hint ? 8 : 4, fontSize: 11.5 }}>{tip}</div>}
    </div>
  );
}
