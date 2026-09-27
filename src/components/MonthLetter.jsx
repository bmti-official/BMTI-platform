// 내 BMTI 유형의 편지(10월 판) — 그달이 끝나면 도착하는 편지.
// 목록에는 봉투 카드만 두고, 열면 따로 창(팝업)에 크게 펼친다.
import { useState } from 'react';
import { getTypeAccent } from '../lib/typeAccent';
import { CHARACTERS } from '../data';
import { CHARACTER_NAMES } from '../lib/bmtiTypes';
import { buildMonthLetter, letterArrival, markLetterSeen } from '../lib/monthLetter';
import { IconBox } from './DiscoveryIcons';
import { josa } from '../lib/josa';

const C = { ink: '#1C1A17', sub: '#8A8378', line: '#EDE9E2' };
const SHADOW = '0 1px 2px rgba(28,26,23,0.04), 0 8px 24px rgba(28,26,23,0.06)';
const PAPER = '#FFFCF3', RULE = '#EFE3C4', INK_L = '#4A4436';

/** peek: 달이 끝나기 전에도 열어 볼 수 있게(관리자 미리보기) */
export function MonthLetterCard({ entries, year, month, nickname, bmtiCode, parts, peek = false }) {
  const t = getTypeAccent();
  const [open, setOpen] = useState(false);
  const axis = String(bmtiCode || '').split('-')[0];
  const ch = CHARACTERS.find((c) => c.id === axis);
  const chName = CHARACTER_NAMES[axis] ? String(CHARACTER_NAMES[axis]).replace(/\n/g, ' ') : '말랑이';
  const arrive = letterArrival(year, month);
  const letter = buildMonthLetter(entries, { year, month, nickname, bmtiCode, parts });
  const next = month === 12 ? 1 : month + 1;

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '18px 18px 20px', boxShadow: SHADOW, border: '1px solid #F1EEE8' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <IconBox name="letter" bg={t.accentSoft} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, letterSpacing: '-0.01em', paddingTop: 5 }}>내 BMTI 유형의 편지</div>
          <p style={{ fontSize: 12, color: C.sub, fontWeight: 600, margin: '3px 0 0', wordBreak: 'keep-all' }}>
            한 달이 끝나면 {josa(chName, '이')} {month}월을 돌아보고 {next}월을 응원하는 편지를 보내요
          </p>
        </div>
      </div>

      {/* 봉투 — 도착 전엔 봉인, 도착하면 열어 보기 */}
      <div style={{ position: 'relative', margin: '16px auto 4px', width: '86%', maxWidth: 280, aspectRatio: '1.55 / 1',
        borderRadius: 14, background: `linear-gradient(160deg, #FFF8E7, #F6E7C8)`, boxShadow: '0 6px 18px rgba(180,150,80,0.18)',
        overflow: 'hidden', animation: arrive.open ? 'letterBob 2.6s ease-in-out infinite' : 'none' }}>
        {/* 뚜껑 */}
        <svg viewBox="0 0 100 64" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path d="M0 0 L50 38 L100 0 Z" fill="#F1DDB2" />
          <path d="M0 0 L50 38 L100 0" fill="none" stroke="#E2C993" strokeWidth="0.8" />
          <path d="M0 64 L38 30 M100 64 L62 30" stroke="#EBD6A8" strokeWidth="0.6" />
        </svg>
        {/* 봉인 — 파트너 얼굴 */}
        <div style={{ position: 'absolute', left: '50%', top: '58%', transform: 'translate(-50%,-50%)', width: 54, height: 54,
          borderRadius: '50%', background: t.accent, boxShadow: `0 0 0 4px ${t.accentSoft}, 0 3px 8px rgba(0,0,0,0.15)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {ch ? <img src={ch.image} alt="" style={{ width: '80%', height: '80%', objectFit: 'contain' }} /> : <span style={{ fontSize: 22 }}>💌</span>}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 12 }}>
        {arrive.open ? (
          <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>{month}월의 편지가 도착했어요</div>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, lineHeight: 1.6 }}>
            {month}월의 편지는 <b style={{ color: t.accentDeep }}>{next}월 1일</b>에 도착해요
            <span style={{ marginLeft: 6, fontSize: 11.5, fontWeight: 900, color: t.accentDeep, background: t.accentSoft,
              borderRadius: 999, padding: '2px 8px' }}>D-{arrive.left}</span>
          </div>
        )}
        {letter && (arrive.open || peek) && (
          <button type="button" onClick={() => setOpen(true)}
            style={{ marginTop: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: arrive.open ? t.accent : '#fff',
              color: arrive.open ? '#fff' : t.accentDeep, borderRadius: 999, padding: '11px 20px', fontSize: 13, fontWeight: 800,
              boxShadow: arrive.open ? `0 4px 12px ${t.accentSoft}` : `inset 0 0 0 1.5px ${t.accentSoft}` }}>
            {arrive.open ? '✉️ 편지 열어보기' : '미리 열어보기 (미리보기에서만)'}
          </button>
        )}
      </div>

      {open && letter && <LetterPopup letter={letter} nickname={nickname} chName={chName} ch={ch} t={t} onClose={() => setOpen(false)} />}
      <style>{'@keyframes letterBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}'}</style>
    </div>
  );
}

// 편지의 한 부분 — 작은 소제목 + 문단
function Section({ label, lines, t }) {
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'inline-block', fontSize: 12.5, fontWeight: 900, color: t.accentDeep, background: t.accentSoft,
        borderRadius: 6, padding: '2px 9px', margin: '4px 0 2px', lineHeight: '24px' }}>{label}</div>
      {/* 괘선은 글줄 높이(30px)에 맞춰 문단마다 — 줄이 글자를 가로지르지 않고 글자 밑에 깔린다 */}
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: '30px', color: INK_L, fontWeight: 600, wordBreak: 'keep-all', textWrap: 'pretty',
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 29px, ${RULE} 29px, ${RULE} 30px)` }}>
        {lines.join(' ')}
      </p>
    </div>
  );
}

// 편지지 한 장 — 줄 편지지 + 마스킹 테이프 + 파트너 우표. 열어보기 창과 도착 팝업이 함께 쓴다.
function LetterPaper({ letter, nickname, chName, ch, t, onClose }) {
  return (
    <div style={{ position: 'relative', background: PAPER, borderRadius: 16, padding: '34px 22px 26px',
      boxShadow: '0 18px 50px rgba(0,0,0,0.28)' }}>
      {/* 마스킹 테이프 */}
      <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%) rotate(-2deg)', width: 110, height: 24,
        background: t.accentSoft, opacity: 0.9, borderRadius: 3, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }} />
      {/* 파트너 우표 */}
      <div style={{ position: 'absolute', top: 18, right: 18, width: 60, height: 68, background: '#fff', padding: 4,
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)', transform: 'rotate(4deg)', outline: `2px dashed ${t.accentSoft}`, outlineOffset: -3 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 2, background: `radial-gradient(circle at 50% 40%, #fff, ${t.accentSoft})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {ch ? <img src={ch.image} alt={chName} style={{ width: '86%', height: '86%', objectFit: 'contain' }} /> : '💌'}
        </div>
      </div>
      <button type="button" onClick={onClose} aria-label="닫기"
        style={{ position: 'absolute', top: 10, left: 12, width: 30, height: 30, borderRadius: '50%', border: 'none',
          background: 'rgba(255,255,255,0.8)', color: C.sub, fontSize: 15, cursor: 'pointer' }}>✕</button>

      <div style={{ fontSize: 12, fontWeight: 800, color: C.sub, marginTop: 8 }}>{letter.month}월을 보내며</div>
      <div style={{ fontSize: 19, fontWeight: 900, color: C.ink, margin: '2px 0 14px', letterSpacing: '-0.02em' }}>
        To. {nickname || '회원'}님
      </div>
      <Section t={t} label={`${letter.month}월, 이렇게 지나왔어요`} lines={letter.look} />
      <Section t={t} label={`${letter.next}월엔 이렇게 보내 봐요`} lines={letter.ahead} />
      <div style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 800, color: t.accentDeep, lineHeight: '30px', marginTop: 10 }}>
        — 당신의 BMTI 유형, {chName} 드림
      </div>
    </div>
  );
}

// 편지지 — 크게, 따로 창에(이번달 발견의 '편지 열어보기').
function LetterPopup({ letter, nickname, chName, ch, t, onClose }) {
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(28,26,23,0.45)', backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, maxHeight: '88vh', overflowY: 'auto',
        animation: 'letterRise .45s cubic-bezier(.2,.8,.3,1)' }}>
        <LetterPaper letter={letter} nickname={nickname} chName={chName} ch={ch} t={t} onClose={onClose} />
      </div>
      <style>{'@keyframes letterRise{from{opacity:0;transform:translateY(30px) scale(.97)}to{opacity:1;transform:none}}'}</style>
    </div>
  );
}

// ── 편지 도착 팝업 ─────────────────────────────────────────
// 한 달이 지나 처음 들어왔을 때, 편지가 도착한 것처럼 띄운다.
//   조건: 로그인 · 지난달에 일기를 한 번이라도 적음 · 이번 달 들어 아직 안 띄움
// 뒤는 불투명하게 블러 처리한다. 봉투가 먼저 뜨고, 열면 편지지가 봉투에서 올라온다.
export function LetterArrival({ entries, year, month, nickname, bmtiCode, parts, onClose }) {
  const t = getTypeAccent();
  const [opened, setOpened] = useState(false);
  const axis = String(bmtiCode || '').split('-')[0];
  const ch = CHARACTERS.find((c) => c.id === axis);
  const chName = CHARACTER_NAMES[axis] ? String(CHARACTER_NAMES[axis]).replace(/\n/g, ' ') : '말랑이';
  const letter = buildMonthLetter(entries, { year, month, nickname, bmtiCode, parts });
  if (!letter) return null;
  const close = () => { markLetterSeen(year, month); onClose?.(); };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(247,244,238,0.72)', backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, maxHeight: '92vh', overflowY: 'auto', textAlign: 'center' }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: t.accentDeep, marginBottom: 4 }}>💌 {month}월의 편지가 도착했어요</div>
        <div style={{ fontSize: 21, fontWeight: 900, color: C.ink, letterSpacing: '-0.02em', marginBottom: 16 }}>내 BMTI 유형의 편지</div>
        {!opened ? (
          <>
            {/* 봉투 — 봉인에 파트너 얼굴 */}
            <button type="button" onClick={() => setOpened(true)} aria-label="편지 열기"
              style={{ position: 'relative', display: 'block', margin: '0 auto', width: '82%', maxWidth: 300, aspectRatio: '1.55 / 1',
                border: 'none', padding: 0, cursor: 'pointer', borderRadius: 14, overflow: 'hidden',
                background: 'linear-gradient(160deg, #FFF8E7, #F6E7C8)', boxShadow: '0 12px 30px rgba(180,150,80,0.28)',
                animation: 'letterDrop .7s cubic-bezier(.2,.9,.3,1.2) both, letterBob 2.6s ease-in-out .7s infinite' }}>
              <svg viewBox="0 0 100 64" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <path d="M0 0 L50 38 L100 0 Z" fill="#F1DDB2" />
                <path d="M0 0 L50 38 L100 0" fill="none" stroke="#E2C993" strokeWidth="0.8" />
                <path d="M0 64 L38 30 M100 64 L62 30" stroke="#EBD6A8" strokeWidth="0.6" />
              </svg>
              <span style={{ position: 'absolute', left: '50%', top: '58%', transform: 'translate(-50%,-50%)', width: 58, height: 58,
                borderRadius: '50%', background: t.accent, boxShadow: `0 0 0 4px ${t.accentSoft}, 0 3px 8px rgba(0,0,0,0.15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {ch ? <img src={ch.image} alt="" style={{ width: '80%', height: '80%', objectFit: 'contain' }} /> : <span style={{ fontSize: 22 }}>💌</span>}
              </span>
            </button>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, margin: '16px 0 14px', lineHeight: 1.6 }}>
              {josa(chName, '이')} {month}월을 돌아보며 편지를 보냈어요
            </div>
            <button type="button" onClick={() => setOpened(true)}
              style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: t.accent, color: '#fff', borderRadius: 999,
                padding: '13px 26px', fontSize: 14, fontWeight: 800, boxShadow: `0 6px 16px ${t.accentSoft}` }}>
              ✉️ 편지 열어보기
            </button>
            <button type="button" onClick={close}
              style={{ display: 'block', margin: '10px auto 0', border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: C.sub }}>
              나중에 이번달 발견에서 볼게요
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'left', animation: 'letterRise .55s cubic-bezier(.2,.8,.3,1)' }}>
            <LetterPaper letter={letter} nickname={nickname} chName={chName} ch={ch} t={t} onClose={close} />
          </div>
        )}
      </div>
      <style>{`@keyframes letterRise{from{opacity:0;transform:translateY(60px) scale(.96)}to{opacity:1;transform:none}}
        @keyframes letterDrop{from{opacity:0;transform:translateY(-40px) rotate(-6deg)}to{opacity:1;transform:none}}
        @keyframes letterBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
    </div>
  );
}
