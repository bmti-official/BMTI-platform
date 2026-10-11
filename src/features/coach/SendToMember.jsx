// 강사: 내 플리를 회원에게 보낸다.
//
// 두 가지 길이 있다.
//   · 링크 — 아직 연결되지 않은 회원에게. 링크 하나는 '강사 + 플리'이고, 여러 회원에게 보내도 되며 14일 뒤 닫힌다.
//     회원이 링크를 열고 동의하면 연결되고, 그 회원의 추천루틴 칸 맨 위에 이 플리가 과제로 선다.
//   · 바로 보내기 — 이미 연결된 회원(member)에게. 링크 없이 곧바로 과제가 된다.
import { useEffect, useState } from 'react';
import { makeLink, closeLink, liveLink, linkUrl, sendTask, notifyTask, taskUrl } from '../../lib/coach';
import { avoidWord } from './coachWords';
import { track } from '../../lib/analytics';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A', GOLD = '#C9975A', RED = '#B23B36';
const NOTE_MAX = 40;
const day = (s) => { const d = new Date(s); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };

/** member: { member_id, name } 를 주면 그 회원에게 바로 보낸다 · task: 고쳐 보낼 때의 지금 값 { note, per_week } · onSent: 보낸 뒤 */
export default function SendToMember({ pli, member = null, task = null, onClose, onSent }) {
  const [note, setNote] = useState(task?.note || '');
  const [week, setWeek] = useState(task?.per_week || 0);   // 0 = 정하지 않음
  const [link, setLink] = useState(null);         // 살아 있는 링크 { code, expires_at }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);        // 바로 보내기를 마쳤다 — 카카오톡으로 알릴지 묻는다
  const [told, setTold] = useState('');           // 알리기 결과 한 줄

  // 이 플리로 만들어 둔 링크가 있으면 그것부터 보여 준다(바로 보낼 땐 링크를 쓰지 않는다)
  useEffect(() => {
    let alive = true;
    if (member) return undefined;
    liveLink(pli.id).then((l) => {
      if (!alive || !l) return;
      setLink(l); setNote(l.note || ''); setWeek(l.per_week || 0);
    });
    return () => { alive = false; };
  }, [pli.id, member]);

  const bad = avoidWord(note);
  const url = link ? linkUrl(link.code) : '';

  const sendNow = async () => {
    if (busy || bad) return;
    setBusy(true); setErr('');
    const r = await sendTask(member.member_id, pli.id, note.trim(), week);
    setBusy(false);
    if (!r.ok) { setErr(r.why); return; }
    track('coach_task_send', { week });
    // 알림을 켜 둔 회원 기기에는 바로 알림이 간다(안 켠 회원이 많으니, 아래에서 카카오톡으로도 알릴 수 있게 한다)
    notifyTask(member.member_id, pli.id);
    setSent(true);
    if (onSent) onSent();
  };
  // 카카오톡으로 알리기 — 카카오톡 공유 창을 열어 강사가 그 회원과의 대화방을 고른다.
  // 카카오톡을 쓸 수 없는 곳에서는 기기의 공유 창, 그것도 없으면 글을 복사해 준다.
  const tell = async () => {
    const text = `새 운동 과제를 보냈어요: ‘${pli.title_z}’\nBMTI의 추천루틴에서 확인해 주세요.`;
    const to = taskUrl();
    track('coach_task_tell');
    try {
      if (window.Kakao && window.Kakao.Share) {
        window.Kakao.Share.sendDefault({ objectType: 'text', text, link: { webUrl: to, mobileWebUrl: to }, buttonTitle: '과제 보기' });
        return;
      }
    } catch { /* 아래 길로 */ }
    try {
      if (navigator.share) { await navigator.share({ text, url: to }); return; }
    } catch { return; }
    try { await navigator.clipboard.writeText(`${text}\n${to}`); setTold('글을 복사했어요. 카카오톡에 붙여 넣어 주세요.'); }
    catch { setTold('복사하지 못했어요. 회원에게 직접 알려 주세요.'); }
  };
  const make = async () => {
    if (busy || bad) return;
    setBusy(true); setErr('');
    const r = await makeLink(pli.id, note.trim(), week);
    setBusy(false);
    if (!r.code) { setErr(r.why); return; }
    track('coach_link_make', { week });
    setLink({ code: r.code, expires_at: new Date(Date.now() + 14 * 864e5).toISOString() });
    setCopied(false);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); } catch { setErr('복사하지 못했어요. 주소를 길게 눌러 복사해 주세요.'); }
  };
  const share = async () => {
    try { await navigator.share({ title: `${pli.title_z} — 운동 과제`, url }); } catch { /* 닫았으면 그만 */ }
  };
  const off = async () => {
    if (!window.confirm('이 링크를 끌까요?\n끄면 이 주소로는 더 받을 수 없어요. 이미 받은 회원의 과제는 그대로예요.')) return;
    setBusy(true);
    const ok = await closeLink(link.code);
    setBusy(false);
    if (!ok) { setErr('끄지 못했어요. 잠시 후 다시 해 주세요.'); return; }
    setLink(null);
  };

  const pill = (on) => ({ border: 'none', cursor: 'pointer', fontFamily: 'inherit', height: 32, padding: '0 11px', borderRadius: 9,
    fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', color: on ? GOLD_INK : SUB, background: on ? YELLOW : '#fff',
    boxShadow: on ? `inset 0 0 0 1.5px ${GOLD}` : `inset 0 0 0 1px ${LINE}` });
  const label = { display: 'block', fontSize: 12, fontWeight: 800, color: SUB, margin: '14px 0 6px' };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(28,26,23,0.5)', display: 'flex',
      alignItems: 'flex-end', justifyContent: 'center', fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      <div role="dialog" aria-modal="true" aria-label="회원에게 보내기" onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', background: '#fff', borderRadius: '22px 22px 0 0',
          padding: '18px 18px 26px', color: INK, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 900, wordBreak: 'keep-all' }}>{member ? `${member.name} 님에게 보내기` : '회원에게 보내기'}</div>
          <button type="button" onClick={onClose} aria-label="닫기"
            style={{ border: 'none', background: '#F4F1EB', width: 32, height: 32, borderRadius: '50%', fontSize: 15, fontWeight: 800, cursor: 'pointer', color: INK }}>✕</button>
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: GOLD_INK, marginTop: 6, wordBreak: 'keep-all' }}>
          {pli.title_z} <span style={{ color: SUB, fontWeight: 700 }}>· 동작 {(pli.cards || []).length}개</span>
        </div>

        {/* 바로 보내기를 마쳤을 때 — 회원에게 알릴 길 */}
        {sent && (
          <div style={{ marginTop: 16 }}>
            <div style={{ background: YELLOW, borderRadius: 14, padding: '13px 14px', fontSize: 13.5, fontWeight: 800, lineHeight: 1.6, wordBreak: 'keep-all' }}>
              {member.name} 님에게 과제를 보냈어요.
              <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: SUB, marginTop: 3 }}>
                회원이 앱을 열면 추천루틴 칸에 새 과제 표시가 떠요. 알림을 켜 둔 회원에게는 알림도 갔어요.
              </span>
            </div>
            <button type="button" onClick={tell}
              style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 14, border: 'none', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 800,
                cursor: 'pointer', background: '#FEE500', color: '#3C1E1E' }}>
              카카오톡으로 알리기
            </button>
            {told && <div role="status" style={{ fontSize: 12.5, fontWeight: 700, color: GOLD_INK, marginTop: 8, textAlign: 'center' }}>{told}</div>}
            <button type="button" onClick={onClose}
              style={{ width: '100%', marginTop: 8, padding: 13, borderRadius: 14, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', background: '#fff', color: SUB, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
              닫기
            </button>
          </div>
        )}
        {!sent && (<>

        <label htmlFor="coach-note" style={label}>한마디 <span style={{ fontWeight: 700, color: '#B5AEA2' }}>안 적어도 돼요 · {note.length}/{NOTE_MAX}</span></label>
        <input id="coach-note" value={note} onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))} placeholder="예: 자기 전에 한 번씩 해 주세요"
          style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, padding: '11px 12px',
            borderRadius: 11, border: `1px solid ${bad ? RED : LINE}` }} />
        {bad && (
          <div style={{ fontSize: 11.5, fontWeight: 700, color: RED, marginTop: 6, lineHeight: 1.6, wordBreak: 'keep-all' }}>
            &lsquo;{bad}&rsquo;은(는) 쓰지 않기로 한 말이에요. 운동을 지도하는 말로 바꿔 주세요.
          </div>
        )}

        <span style={label}>일주일에 몇 번</span>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }} role="radiogroup" aria-label="일주일에 몇 번">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={week === n} onClick={() => setWeek(n)} style={pill(week === n)}>
              {n === 0 ? '정하지 않음' : `${n}번`}
            </button>
          ))}
        </div>

        <button type="button" disabled={busy || !!bad} onClick={member ? sendNow : make}
          style={{ width: '100%', marginTop: 18, padding: 14, borderRadius: 14, border: 'none', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 800,
            cursor: busy || bad ? 'default' : 'pointer', background: bad ? '#F1EEE8' : GOLD, color: bad ? '#B5AEA2' : '#fff', opacity: busy ? 0.6 : 1 }}>
          {member ? (busy ? '보내는 중…' : task ? '이 내용으로 고치기' : '과제로 보내기')
            : (busy ? '만드는 중…' : link ? '이 내용으로 링크 고치기' : '링크 만들기')}
        </button>

        {link && (
          <div style={{ background: '#FAF7F0', borderRadius: 14, padding: '12px 13px', marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: INK, marginBottom: 6 }}>회원에게 보낼 주소 <span style={{ color: SUB, fontWeight: 700 }}>· {day(link.expires_at)}까지 열려 있어요</span></div>
            <div style={{ fontSize: 12, fontWeight: 700, color: GOLD_INK, background: '#fff', borderRadius: 9, padding: '9px 10px', wordBreak: 'break-all',
              boxShadow: `inset 0 0 0 1px ${LINE}`, userSelect: 'all' }}>{url}</div>
            <div style={{ display: 'flex', gap: 7, marginTop: 9 }}>
              <button type="button" onClick={copy}
                style={{ flex: 1, padding: '10px 0', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
                  background: '#fff', color: INK, boxShadow: '0 3px 10px rgba(217,185,106,0.45)' }}>{copied ? '복사했어요 ✓' : '주소 복사'}</button>
              {typeof navigator !== 'undefined' && navigator.share && (
                <button type="button" onClick={share}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
                    background: '#fff', color: INK, boxShadow: `inset 0 0 0 1px ${LINE}` }}>공유하기</button>
              )}
              <button type="button" disabled={busy} onClick={off}
                style={{ flex: '0 0 auto', padding: '10px 12px', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800,
                  background: 'transparent', color: RED }}>링크 끄기</button>
            </div>
          </div>
        )}
        {err && <div role="alert" style={{ fontSize: 12.5, fontWeight: 700, color: RED, marginTop: 10 }}>{err}</div>}

        <p style={{ fontSize: 11.5, fontWeight: 600, color: SUB, lineHeight: 1.75, margin: '14px 0 0', wordBreak: 'keep-all' }}>
          {member
            ? '보내면 회원의 추천루틴 칸 맨 위에 과제로 떠요. 플리를 고치면 받은 회원에게도 바로 바뀌어 보여요.'
            : '회원이 이 주소를 열고 동의하면 연결돼요. 같은 주소를 여러 회원에게 보내도 돼요. 플리를 고치면 받은 회원에게도 바로 바뀌어 보여요. 이미 연결된 회원에게는 추천루틴 칸의 ‘내 회원’에서 링크 없이 보낼 수 있어요.'}
        </p>
        </>)}
      </div>
    </div>
  );
}
