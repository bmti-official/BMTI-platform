// 강사가 보낸 과제 링크를 열었을 때 — 누가 무엇을 보냈는지 보여 주고, 로그인·동의를 거쳐 연결한다.
//
// 처음 연결할 때만 동의를 받는다. 이미 이 강사와 연결돼 있으면 과제만 더한다.
// 건강 정보 한 장은 따로 고른 사람만, 지금 적혀 있는 내용을 한 번 보낸다(연결한 날 것만).
// 문구의 기준: 누가 가르치는가만 말하고, 무엇을 고치는가는 말하지 않는다.
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import PliCover from '../curation/PliCover';
import MallangInfoPopup from '../../components/MallangInfoPopup';
import { readMallangProfile } from '../../lib/mallangProfile';
import { sheetLines } from '../../lib/healthSheet';
import { peekLink, acceptLink, leaveCoach } from '../../lib/coach';
import { track } from '../../lib/analytics';
import { RECO_TAB } from '../../lib/tabNames';
import { BADGE, SCOPE } from './coachWords';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A', GOLD = '#C9975A', RED = '#B23B36';
const SHADOW = '0 2px 4px rgba(220,188,86,0.16), 0 10px 24px rgba(233,203,110,0.30)';

const WHY = {
  none: '링크를 찾지 못했어요. 주소를 다시 확인해 주세요.',
  closed: '닫힌 링크예요. 강사님에게 새 링크를 부탁해 주세요.',
  error: '링크를 열지 못했어요. 잠시 후 다시 열어 주세요.',
};

// 네모 체크 — 동의 칸
function Check({ on, onClick, label, sub, tag }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} onClick={onClick}
      style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: on ? YELLOW : '#fff',
        borderRadius: 14, padding: '12px 13px', display: 'flex', gap: 11, alignItems: 'flex-start',
        boxShadow: on ? `inset 0 0 0 1.5px ${GOLD}` : `inset 0 0 0 1px ${LINE}` }}>
      <span aria-hidden="true" style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, marginTop: 1, boxSizing: 'border-box',
        background: on ? GOLD : '#fff', border: `1.5px solid ${on ? GOLD : '#CFC9BD'}`, color: '#fff', fontSize: 13, fontWeight: 900,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on ? '✓' : ''}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: INK, lineHeight: 1.5, wordBreak: 'keep-all' }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: tag === '필수' ? RED : GOLD_INK, marginRight: 6 }}>{tag}</span>{label}
        </span>
        <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: SUB, lineHeight: 1.6, marginTop: 3, wordBreak: 'keep-all' }}>{sub}</span>
      </span>
    </button>
  );
}

export default function CoachInvite({ code, isLoggedIn, userProfile, setUserProfile, onLogin, onClose, onDone }) {
  const [info, setInfo] = useState(null);       // 링크 미리 보기
  const [cards, setCards] = useState([]);       // 표지에 쓸 동작(공개된 것)
  const [ver, setVer] = useState(0);            // 다시 읽기
  const [agree, setAgree] = useState(false);    // 필수 — 과제를 한 날
  const [share, setShare] = useState(false);    // 선택 — 건강 정보 한 장
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sheet, setSheet] = useState(false);

  // 로그인 전과 뒤가 다르다(이미 연결돼 있는지는 로그인해야 안다) — 로그인하면 다시 읽는다
  const userId = isLoggedIn ? userProfile?.id || null : null;
  useEffect(() => {
    let alive = true;
    peekLink(code).then(async (r) => {
      if (!alive) return;
      setInfo(r);
      const ids = r.ok ? (r.card_ids || []) : [];
      if (!ids.length) return;
      const { data } = await supabase.from('quick_cards').select('*').in('id', ids).eq('published', true);
      if (!alive) return;
      const by = Object.fromEntries((data || []).map((c) => [c.id, c]));
      setCards(ids.map((id) => by[id]).filter(Boolean));
    });
    return () => { alive = false; };
  }, [code, userId, ver]);
  useEffect(() => { track('coach_link_open'); }, []);

  // 바깥은 스크롤되지 않게
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const lines = sheetLines(readMallangProfile(isLoggedIn ? userProfile : null));
  const name = info?.coach_name || '';

  const accept = async (withConsent) => {
    if (busy) return;
    if (withConsent && !agree) { setErr('필수 항목에 동의해야 과제를 받을 수 있어요.'); return; }
    setBusy(true); setErr('');
    const r = await acceptLink(code, withConsent && share);
    setBusy(false);
    if (r.ok) { track('coach_link_accept', { sheet: !!(withConsent && share) }); onDone(name); return; }
    if (r.why === 'other_coach' || r.why === 'self' || r.why === 'closed') { setVer((v) => v + 1); return; }
    setErr('연결하지 못했어요. 잠시 후 다시 해 주세요.');
  };
  const switchCoach = async () => {
    if (!window.confirm(`지금 연결을 끊고 ${name} 강사님과 새로 연결할까요?\n끊으면 지금 강사님은 내 정보를 볼 수 없고, 받은 과제도 사라져요.`)) return;
    setBusy(true);
    const ok = await leaveCoach();
    setBusy(false);
    if (!ok) { setErr('끊지 못했어요. 잠시 후 다시 해 주세요.'); return; }
    setVer((v) => v + 1);
  };

  const main = { width: '100%', padding: 15, borderRadius: 15, border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 800, cursor: 'pointer' };
  const small = { fontSize: 11.5, fontWeight: 600, color: SUB, lineHeight: 1.75, wordBreak: 'keep-all', margin: 0 };

  let body;
  if (!info) {
    body = <div style={{ padding: '80px 0', textAlign: 'center', color: SUB, fontSize: 13, fontWeight: 700 }}>링크를 여는 중…</div>;
  } else if (!info.ok) {
    body = (
      <div style={{ padding: '70px 8px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: INK, lineHeight: 1.7, wordBreak: 'keep-all' }}>{WHY[info.why] || WHY.error}</div>
        <button type="button" onClick={onClose} style={{ ...main, marginTop: 22, background: '#fff', color: INK, boxShadow: `inset 0 0 0 1px ${LINE}` }}>닫기</button>
      </div>
    );
  } else {
    const first = isLoggedIn && !info.is_me && !info.other_coach && !info.connected;   // 처음 연결 — 동의를 받는다
    body = (
      <>
        {/* 누가, 무엇을 */}
        <div style={{ fontSize: 12.5, fontWeight: 800, color: GOLD_INK, marginBottom: 6 }}>운동 과제가 도착했어요</div>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.35, wordBreak: 'keep-all' }}>{name} 강사님</div>
        {(info.center_name || info.area) && (
          <div style={{ fontSize: 12.5, fontWeight: 700, color: SUB, marginTop: 3 }}>{[info.center_name, info.area].filter(Boolean).join(' · ')}</div>
        )}
        <div style={{ marginTop: 10 }}>
          <span style={{ display: 'inline-block', fontSize: 11.5, fontWeight: 800, color: GOLD_INK, background: YELLOW, borderRadius: 999, padding: '4px 10px' }}>{BADGE}</span>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: SUB, marginTop: 6 }}>{SCOPE}</div>
        </div>

        <div style={{ display: 'flex', gap: 13, alignItems: 'stretch', background: '#fff', borderRadius: 18, padding: 12, marginTop: 16,
          border: '1px solid #F1EEE8', boxShadow: SHADOW }}>
          <div style={{ flex: '0 0 92px' }}>
            <PliCover pli={{ title_z: info.title, thumb_text: info.cover_text }} cards={cards} radius={12} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.4, wordBreak: 'keep-all' }}>{info.title}</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: SUB, marginTop: 4 }}>
              동작 {(info.card_ids || []).length}개{info.per_week ? ` · 주 ${info.per_week}번` : ''}
            </div>
            {info.note && (
              <div style={{ fontSize: 12.5, fontWeight: 700, color: INK, background: '#FAF7F0', borderRadius: 10, padding: '8px 10px', marginTop: 9,
                lineHeight: 1.55, wordBreak: 'keep-all' }}>“{info.note}”</div>
            )}
          </div>
        </div>

        {/* 내가 만든 링크 */}
        {info.is_me && (
          <div style={{ marginTop: 18 }}>
            <p style={{ ...small, fontSize: 13, color: INK, fontWeight: 700 }}>내가 만든 링크예요. 회원에게는 이렇게 보여요. 이 주소를 회원에게 보내 주세요.</p>
            <button type="button" onClick={onClose} style={{ ...main, marginTop: 14, background: '#fff', color: INK, boxShadow: `inset 0 0 0 1px ${LINE}` }}>닫기</button>
          </div>
        )}

        {/* 로그인 전 */}
        {!isLoggedIn && (
          <div style={{ marginTop: 20 }}>
            <button type="button" onClick={onLogin} style={{ ...main, background: '#FEE500', color: '#3C1E1E' }}>카카오로 시작하고 과제 받기</button>
            <p style={{ ...small, marginTop: 10, textAlign: 'center' }}>로그인한 다음, 강사님과 무엇을 나눌지 직접 고를 수 있어요.</p>
          </div>
        )}

        {/* 다른 강사와 연결돼 있을 때 */}
        {isLoggedIn && info.other_coach && (
          <div style={{ marginTop: 18 }}>
            <p style={{ ...small, fontSize: 13, color: INK, fontWeight: 700 }}>
              지금은 다른 강사님과 연결돼 있어요. 한 번에 한 분과만 연결할 수 있어요.
            </p>
            <button type="button" disabled={busy} onClick={switchCoach} style={{ ...main, marginTop: 14, background: GOLD, color: '#fff', opacity: busy ? 0.6 : 1 }}>
              지금 연결을 끊고 계속하기
            </button>
            <button type="button" onClick={onClose} style={{ ...main, marginTop: 8, background: '#fff', color: SUB, boxShadow: `inset 0 0 0 1px ${LINE}` }}>그대로 둘게요</button>
          </div>
        )}

        {/* 이미 이 강사와 연결돼 있을 때 — 동의는 이미 했다 */}
        {isLoggedIn && info.connected && !info.is_me && (
          <div style={{ marginTop: 20 }}>
            <button type="button" disabled={busy} onClick={() => accept(false)} style={{ ...main, background: GOLD, color: '#fff', opacity: busy ? 0.6 : 1 }}>
              {busy ? '받는 중…' : '과제 받기'}
            </button>
          </div>
        )}

        {/* 처음 연결 — 무엇을 나눌지 고른다 */}
        {first && (
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 14.5, fontWeight: 900, marginBottom: 10, wordBreak: 'keep-all' }}>{name} 강사님과 연결하면</div>
            <div style={{ display: 'grid', gap: 8 }}>
              <Check tag="필수" on={agree} onClick={() => { setAgree((v) => !v); setErr(''); }}
                label="강사님이 보낸 과제를 내가 한 날을 강사님이 봐요"
                sub="닉네임 · 과제를 한 날짜 · 끝까지 했는지" />
              <Check tag="선택" on={share} onClick={() => setShare((v) => !v)}
                label="건강 정보 한 장을 강사님에게 보내요"
                sub="건강에 관한 정보예요. 불편한 부위와 상황 · 얼마나 됐는지 · 자주 하는 자세 · 운동 빈도와 목적 · 강사에게 미리 알릴 말" />
            </div>

            {share && (
              <div style={{ background: '#FAF7F0', borderRadius: 14, padding: '12px 13px', marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: INK, marginBottom: 6 }}>지금 이 내용이 가요</div>
                {lines.length === 0 ? (
                  <div style={{ fontSize: 12, fontWeight: 600, color: SUB, lineHeight: 1.6 }}>아직 적은 건강 정보가 없어요. 지금 적으면 그 내용이 가요.</div>
                ) : lines.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.65 }}>
                    <span style={{ flex: '0 0 78px', fontWeight: 700, color: SUB }}>{k}</span>
                    <span style={{ flex: 1, minWidth: 0, fontWeight: 700, color: INK, wordBreak: 'keep-all' }}>{v}</span>
                  </div>
                ))}
                <button type="button" onClick={() => setSheet(true)}
                  style={{ marginTop: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 9, padding: '7px 11px', background: '#fff',
                    color: GOLD_INK, fontSize: 12, fontWeight: 800, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                  {lines.length ? '고치기' : '건강 정보 한 장 적기'}
                </button>
                <p style={{ ...small, marginTop: 9 }}>오늘 내용을 한 번 보내요. 나중에 고쳐도 강사님에게는 보낸 날의 내용이 보여요.</p>
              </div>
            )}

            <div style={{ marginTop: 14, display: 'grid', gap: 5 }}>
              <p style={small}><b style={{ color: INK }}>받는 사람</b> {name} 강사{info.center_name ? `(${info.center_name})` : ''}</p>
              <p style={small}><b style={{ color: INK }}>쓰는 곳</b> 수업 사이에 할 운동 과제를 안내하고, 했는지 확인하는 데만 써요.</p>
              <p style={small}><b style={{ color: INK }}>보내지 않는 것</b> 다이어리(기분·수면·메모), 각도 기록, BMTI 결과, 키·몸무게·연령대, 카카오 계정 정보</p>
              <p style={small}><b style={{ color: INK }}>언제까지</b> 연결을 끊을 때까지예요. 끊으면 강사님은 바로 볼 수 없고, 보낸 건강 정보는 지워져요.</p>
              <p style={small}><b style={{ color: INK }}>바꾸기·끊기</b> {RECO_TAB} 칸의 &lsquo;연결 관리&rsquo;에서 언제든 할 수 있어요.</p>
              <p style={small}>동의하지 않아도 BMTI는 그대로 쓸 수 있어요. 다만 강사님의 과제는 받을 수 없어요. 건강 정보 한 장은 보내지 않아도 연결돼요.</p>
              <p style={small}>
                자세한 내용은 <a href={`${import.meta.env.BASE_URL}privacy.html`} target="_blank" rel="noreferrer"
                  style={{ color: GOLD_INK, fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 3 }}>개인정보처리방침</a> 제4조에 있어요.
              </p>
            </div>

            <button type="button" disabled={busy} onClick={() => accept(true)}
              style={{ ...main, marginTop: 16, background: agree ? GOLD : '#F1EEE8', color: agree ? '#fff' : '#B5AEA2', opacity: busy ? 0.6 : 1 }}>
              {busy ? '연결하는 중…' : '동의하고 과제 받기'}
            </button>
          </div>
        )}

        {err && <div role="alert" style={{ fontSize: 12.5, fontWeight: 700, color: RED, marginTop: 10, textAlign: 'center' }}>{err}</div>}
        {!info.is_me && !(isLoggedIn && info.other_coach) && (
          <button type="button" onClick={onClose}
            style={{ display: 'block', margin: '14px auto 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 12.5, fontWeight: 700, color: SUB, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            다음에 할게요
          </button>
        )}
      </>
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="강사가 보낸 과제"
      style={{ position: 'fixed', inset: 0, zIndex: 45, background: '#fff', overflowY: 'auto', fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '26px 18px 48px' }}>{body}</div>
      {sheet && (
        <MallangInfoPopup mode="all" withCoachNote userInfo={isLoggedIn ? userProfile : null} isLoggedIn={!!isLoggedIn} setUserProfile={setUserProfile}
          gender={userProfile?.kakaoGender || userProfile?.kakao_gender}
          onClose={() => setSheet(false)} onSaved={() => setSheet(false)} />
      )}
    </div>
  );
}
