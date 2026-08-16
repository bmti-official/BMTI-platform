import { useState } from 'react';
import { createPortal } from 'react-dom';
import { hasLocalHealthConsent, setLocalHealthConsent, updateHealthRecordConsent } from '../lib/healthConsentSystem';

const GOLD = '#C9975A';

// 기록·발견은 [선택] 동의(가명처리 후 통계·연구·서비스 개선)가 있어야 열람할 수 있다.
// 선택 동의가 없는 상태로 진입하면 이 팝업으로 동의를 유도한다.
export default function DiscoveryConsentPrompt({ userId, onClose, onAgreed }) {
  const requiredAlready = hasLocalHealthConsent();
  const [req, setReq] = useState(requiredAlready);
  const [opt, setOpt] = useState(false);
  const [saving, setSaving] = useState(false);
  const canAgree = req && opt;

  const agree = async () => {
    if (!canAgree || saving) return;
    setSaving(true);
    if (userId) { try { await updateHealthRecordConsent(userId, true, true); } catch (e) { console.error('선택 동의 저장 실패', e); } }
    setLocalHealthConsent(true);
    setSaving(false);
    onAgreed && onAgreed();
  };

  const Row = ({ checked, onToggle, tag, children }) => (
    <button onClick={onToggle} style={{ width: '100%', display: 'flex', gap: 11, alignItems: 'flex-start', textAlign: 'left', background: '#FBFAF6', border: `1px solid ${checked ? GOLD : '#EDE9E2'}`, borderRadius: 14, padding: '13px 14px', cursor: 'pointer' }}>
      <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 7, border: `2px solid ${checked ? GOLD : '#D8D3C8'}`, background: checked ? GOLD : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 900, marginTop: 1 }}>{checked ? '✓' : ''}</span>
      <span style={{ flex: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: tag === '필수' ? '#C0392B' : '#8A8378' }}>[{tag}]</span>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2A2622', lineHeight: 1.55, marginTop: 3, wordBreak: 'keep-all' }}>{children}</span>
      </span>
    </button>
  );

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(28,26,23,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Pretendard',sans-serif" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 24, padding: '22px 20px 20px', position: 'relative' }}>
        <button onClick={onClose} aria-label="닫기" style={{ position: 'absolute', top: 12, right: 14, border: 'none', background: 'transparent', color: '#9B9489', fontSize: 18, cursor: 'pointer', padding: 4 }}>✕</button>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#2A2622', paddingRight: 20 }}>기록·발견을 보려면 동의가 필요해요</div>
        <p style={{ fontSize: 12.5, color: '#8A8378', fontWeight: 600, margin: '6px 0 14px', lineHeight: 1.6, wordBreak: 'keep-all' }}>
          아래 <b>선택 동의</b>가 있어야 기록·발견의 분석을 모두 확인할 수 있어요.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!requiredAlready && (
            <Row checked={req} onToggle={() => setReq(v => !v)} tag="필수">
              기분·통증·수면 등 건강정보를 <b>내 개인 리포트 제공</b> 목적으로 수집·이용하는 것에 동의합니다.
            </Row>
          )}
          <Row checked={opt} onToggle={() => setOpt(v => !v)} tag="선택">
            <b>가명처리</b> 후 통계·연구·서비스 개선(B2B 포함)에 활용하는 것에 동의합니다.
            <span style={{ display: 'block', marginTop: 5, fontSize: 12, fontWeight: 800, color: GOLD }}>✨ 선택 동의를 해야 기록·발견의 분석을 모두 확인할 수 있어요.</span>
          </Row>
        </div>
        <p style={{ fontSize: 11, color: '#9B9489', fontWeight: 600, lineHeight: 1.6, margin: '10px 2px 0', wordBreak: 'keep-all' }}>
          동의는 마이페이지에서 언제든 껐다 켤 수 있어요.
        </p>
        <button onClick={agree} disabled={!canAgree || saving}
          style={{ width: '100%', marginTop: 14, padding: 15, borderRadius: 14, border: 'none', background: canAgree ? GOLD : '#E7E2D8', color: canAgree ? '#fff' : '#B7B2A9', fontSize: 14.5, fontWeight: 800, cursor: canAgree && !saving ? 'pointer' : 'default' }}>
          {saving ? '저장 중…' : '동의하고 기록·발견 보기'}
        </button>
      </div>
    </div>,
    document.body
  );
}
