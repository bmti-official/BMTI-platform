// 강사: 내 플리를 회원에게 보낸다 — 링크를 만들어 카카오톡으로 건넨다.
//
// 링크 하나는 '강사 + 플리'다. 같은 링크를 여러 회원에게 보내도 되고, 14일 뒤 닫힌다.
// 회원이 링크를 열고 동의하면 연결되고, 그 회원의 추천루틴 칸 맨 위에 이 플리가 과제로 선다.
import { useEffect, useState } from 'react';
import { makeLink, closeLink, liveLink, linkUrl } from '../../lib/coach';
import { avoidWord } from './coachWords';
import { track } from '../../lib/analytics';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A', GOLD = '#C9975A', RED = '#B23B36';
const NOTE_MAX = 40;
const day = (s) => { const d = new Date(s); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };

export default function SendToMember({ pli, onClose }) {
  const [note, setNote] = useState('');
  const [week, setWeek] = useState(0);            // 0 = 정하지 않음
  const [link, setLink] = useState(null);         // 살아 있는 링크 { code, expires_at }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  // 이 플리로 만들어 둔 링크가 있으면 그것부터 보여 준다
  useEffect(() => {
    let alive = true;
    liveLink(pli.id).then((l) => {
      if (!alive || !l) return;
      setLink(l); setNote(l.note || ''); setWeek(l.per_week || 0);
    });
    return () => { alive = false; };
  }, [pli.id]);

  const bad = avoidWord(note);
  const url = link ? linkUrl(link.code) : '';

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
          <div style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 900 }}>회원에게 보내기</div>
          <button type="button" onClick={onClose} aria-label="닫기"
            style={{ border: 'none', background: '#F4F1EB', width: 32, height: 32, borderRadius: '50%', fontSize: 15, fontWeight: 800, cursor: 'pointer', color: INK }}>✕</button>
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: GOLD_INK, marginTop: 6, wordBreak: 'keep-all' }}>
          {pli.title_z} <span style={{ color: SUB, fontWeight: 700 }}>· 동작 {(pli.cards || []).length}개</span>
        </div>

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

        <button type="button" disabled={busy || !!bad} onClick={make}
          style={{ width: '100%', marginTop: 18, padding: 14, borderRadius: 14, border: 'none', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 800,
            cursor: busy || bad ? 'default' : 'pointer', background: bad ? '#F1EEE8' : GOLD, color: bad ? '#B5AEA2' : '#fff', opacity: busy ? 0.6 : 1 }}>
          {busy ? '만드는 중…' : link ? '이 내용으로 링크 고치기' : '링크 만들기'}
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
          회원이 이 주소를 열고 동의하면 연결돼요. 같은 주소를 여러 회원에게 보내도 돼요.
          플리를 고치면 받은 회원에게도 바로 바뀌어 보여요.
        </p>
      </div>
    </div>
  );
}
