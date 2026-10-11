// 회원: 연결 관리 — 강사와 무엇을 나누고 있는지 보고, 바꾸거나 끊는다.
//
// 동의할 때만큼 쉽게 거둘 수 있어야 한다. 건강 정보 한 장은 '보낸 날의 사본'이라,
// 고친 내용을 알리고 싶으면 '다시 보내기'를 누른다. 누를 때만 간다.
import { useState } from 'react';
import { sendSheet, stopSharing, leaveCoach } from '../../lib/coach';
import { track } from '../../lib/analytics';
import { BADGE, SCOPE } from './coachWords';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A', RED = '#B23B36';
const day = (s) => { const d = new Date(s); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };

/** coach: my_coach()가 돌려준 것 · onChanged(끊었는가): 바뀐 뒤 다시 읽게 · onEditSheet: 건강 정보 한 장 고치기 */
export default function CoachManage({ coach, onClose, onChanged, onEditSheet }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async (fn, after) => {
    setBusy(true); setErr('');
    const ok = await fn();
    setBusy(false);
    if (!ok) { setErr('바꾸지 못했어요. 잠시 후 다시 해 주세요.'); return; }
    after();
  };
  const send = () => run(sendSheet, () => { track('coach_sheet', { on: true }); onChanged(false); });
  const stop = () => {
    if (!window.confirm('건강 정보 한 장을 그만 나눌까요?\n강사님에게 보낸 사본이 바로 지워져요.')) return;
    run(stopSharing, () => { track('coach_sheet', { on: false }); onChanged(false); });
  };
  const leave = () => {
    if (!window.confirm(`${coach.coach_name} 강사님과 연결을 끊을까요?\n강사님은 내 정보를 바로 볼 수 없고, 받은 과제도 사라져요. 내가 한 기록은 그대로 남아요.`)) return;
    run(leaveCoach, () => { track('coach_leave'); onChanged(true); });
  };

  const row = { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderTop: `1px solid ${LINE}` };
  const btn = (color = INK) => ({ flexShrink: 0, border: 'none', cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', borderRadius: 9, padding: '7px 11px',
    background: '#fff', color, fontSize: 12, fontWeight: 800, boxShadow: `inset 0 0 0 1px ${LINE}`, opacity: busy ? 0.6 : 1 });

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(28,26,23,0.5)', display: 'flex',
      alignItems: 'flex-end', justifyContent: 'center', fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      <div role="dialog" aria-modal="true" aria-label="연결 관리" onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', background: '#fff', borderRadius: '22px 22px 0 0',
          padding: '18px 18px 26px', color: INK, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 900 }}>연결 관리</div>
          <button type="button" onClick={onClose} aria-label="닫기"
            style={{ border: 'none', background: '#F4F1EB', width: 32, height: 32, borderRadius: '50%', fontSize: 15, fontWeight: 800, cursor: 'pointer', color: INK }}>✕</button>
        </div>

        <div style={{ margin: '12px 0 14px' }}>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.01em' }}>{coach.coach_name} 강사님</div>
          {(coach.center_name || coach.area) && (
            <div style={{ fontSize: 12, fontWeight: 700, color: SUB, marginTop: 2 }}>{[coach.center_name, coach.area].filter(Boolean).join(' · ')}</div>
          )}
          <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, color: GOLD_INK, background: YELLOW, borderRadius: 999, padding: '3px 9px', marginTop: 8 }}>{BADGE}</span>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: SUB, marginTop: 5 }}>{SCOPE}</div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: SUB, marginTop: 5 }}>{day(coach.since)}에 연결했어요</div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, color: SUB, marginBottom: 2 }}>강사님과 나누는 것</div>
        <div style={row}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800 }}>과제를 한 날</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: SUB, lineHeight: 1.6, marginTop: 2, wordBreak: 'keep-all' }}>
              닉네임 · 강사님이 보낸 과제를 한 날짜 · 끝까지 했는지. 연결돼 있는 동안 나눠요.
            </div>
          </div>
        </div>
        <div style={row}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800 }}>
              건강 정보 한 장 <span style={{ fontSize: 11.5, fontWeight: 800, color: coach.share_sheet ? GOLD_INK : SUB }}>
                {coach.share_sheet ? `· ${day(coach.sheet_at)}에 보냄` : '· 안 보냄'}</span>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: SUB, lineHeight: 1.6, marginTop: 2, wordBreak: 'keep-all' }}>
              {coach.share_sheet
                ? '강사님에게는 보낸 날의 내용이 보여요. 고친 내용을 알리려면 다시 보내 주세요.'
                : '불편한 부위와 상황, 얼마나 됐는지, 자세, 운동 빈도와 목적을 보낼 수 있어요. 누를 때 한 번만 가요.'}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              <button type="button" disabled={busy} onClick={onEditSheet} style={btn(SUB)}>내용 보기·고치기</button>
              <button type="button" disabled={busy} onClick={send} style={btn(GOLD_INK)}>{coach.share_sheet ? '다시 보내기' : '지금 보내기'}</button>
              {coach.share_sheet && <button type="button" disabled={busy} onClick={stop} style={btn(RED)}>그만 나누기</button>}
            </div>
          </div>
        </div>
        <div style={{ ...row, borderBottom: `1px solid ${LINE}` }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: 600, color: SUB, lineHeight: 1.65, wordBreak: 'keep-all' }}>
            다이어리(기분·수면·메모), 각도 기록, BMTI 결과, 키·몸무게·연령대, 카카오 계정 정보는 나누지 않아요.
          </div>
        </div>

        {err && <div role="alert" style={{ fontSize: 12.5, fontWeight: 700, color: RED, marginTop: 10 }}>{err}</div>}
        <button type="button" disabled={busy} onClick={leave}
          style={{ display: 'block', margin: '18px auto 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12.5, fontWeight: 800, color: RED, textDecoration: 'underline', textUnderlineOffset: 3 }}>
          연결 끊기
        </button>
      </div>
    </div>
  );
}
