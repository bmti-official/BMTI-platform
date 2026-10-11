// 강사 약관 동의 — 강사로 지정된 회원이 강사 기능을 처음 쓸 때 한 번 받는다.
// 동의하기 전에는 서버가 강사 기능(링크 만들기·회원 보기·과제 보내기)을 열어 주지 않는다.
// 전문은 /coach-terms.html 에 있고, 여기서는 꼭 지킬 다섯 가지만 추려 보여 준다.
import { useState } from 'react';
import { agreeCoachTerms } from '../../lib/coach';
import { track } from '../../lib/analytics';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A', GOLD = '#C9975A', RED = '#B23B36';
const POINTS = [
  '회원 정보(닉네임, 과제를 한 날, 회원이 보낸 건강 정보)는 운동 과제를 안내하고 확인하는 데만 써요.',
  '회원 정보가 보이는 화면을 찍거나 옮겨 적어 밖으로 내보내지 않아요.',
  '운동을 지도하는 말만 써요. 치료·교정·처방·진단 같은 말은 쓰지 않아요.',
  '회원의 불편함이 심해지면 과제를 멈추게 하고 병원 진료를 권해요.',
  '연결과 건강 정보 나누기는 회원이 정해요. 약속을 어기면 강사 지정이 풀릴 수 있어요.',
];

/** sheet: 아래에서 올라오는 창으로(보관함에서) · 아니면 그 자리에 놓는 카드(내 회원 자리) */
export default function CoachTerms({ sheet = false, onAgreed, onClose }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const agree = async () => {
    if (busy) return;
    setBusy(true); setErr('');
    const ok = await agreeCoachTerms();
    setBusy(false);
    if (!ok) { setErr('동의를 남기지 못했어요. 잠시 후 다시 해 주세요.'); return; }
    track('coach_terms');
    onAgreed();
  };
  const body = (
    <div style={{ color: INK, fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 16.5, fontWeight: 900, letterSpacing: '-0.01em' }}>강사로 시작하기 전에</div>
        {sheet && (
          <button type="button" onClick={onClose} aria-label="닫기"
            style={{ border: 'none', background: '#F4F1EB', width: 32, height: 32, borderRadius: '50%', fontSize: 15, fontWeight: 800, cursor: 'pointer', color: INK }}>✕</button>
        )}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: SUB, marginTop: 4, lineHeight: 1.6, wordBreak: 'keep-all' }}>
        회원이 믿고 정보를 나누는 자리예요. 다섯 가지를 약속해 주세요.
      </div>
      <ol style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
        {POINTS.map((t, i) => (
          <li key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FAF7F0', borderRadius: 12, padding: '10px 12px' }}>
            <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: YELLOW, color: GOLD_INK, fontSize: 11.5, fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.55, wordBreak: 'keep-all' }}>{t}</span>
          </li>
        ))}
      </ol>
      <a href={`${import.meta.env.BASE_URL}coach-terms.html`} target="_blank" rel="noreferrer"
        style={{ display: 'inline-block', marginTop: 12, fontSize: 12.5, fontWeight: 800, color: GOLD_INK, textDecoration: 'underline', textUnderlineOffset: 3 }}>
        강사 약관 전문 보기
      </a>
      {err && <div role="alert" style={{ fontSize: 12.5, fontWeight: 700, color: RED, marginTop: 10 }}>{err}</div>}
      <button type="button" disabled={busy} onClick={agree}
        style={{ width: '100%', marginTop: 14, padding: 14, borderRadius: 14, border: 'none', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 800,
          cursor: busy ? 'default' : 'pointer', background: GOLD, color: '#fff', opacity: busy ? 0.6 : 1 }}>
        {busy ? '남기는 중…' : '약관에 동의하고 시작하기'}
      </button>
    </div>
  );
  if (!sheet) {
    return <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${LINE}`, padding: '16px 16px 18px' }}>{body}</div>;
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(28,26,23,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div role="dialog" aria-modal="true" aria-label="강사 약관" onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: '22px 22px 0 0', padding: '18px 18px 26px', boxSizing: 'border-box' }}>
        {body}
      </div>
    </div>
  );
}
