// 강사 화면 — 내 회원. 누가 이번 주에 과제를 했는지 한눈에 보고, 과제를 보내거나 거둔다.
//
// 강사가 보는 것은 세 가지뿐이다: 닉네임, 내가 보낸 과제를 한 날, 회원이 보내기로 한 건강 정보 한 장의 사본.
// 다이어리·각도·따로 한 운동은 서버가 주지 않는다. 강사는 읽기만 한다 — 회원의 기록을 고치거나 대신 표시할 수 없다.
// 이번 주에 아직 안 한 회원이 위로 온다(먼저 챙길 사람).
import { useEffect, useMemo, useState } from 'react';
import { coachOverview, withdrawTask, setAlias, dropMember } from '../../lib/coach';
import { sheetLines } from '../../lib/healthSheet';
import { weekDays, isoOf } from '../reco/recommend';
import { routineSummary, mmss } from '../curation/format';
import { usePanelTime } from '../../lib/usePanelTime';
import { track } from '../../lib/analytics';
import SendToMember from './SendToMember';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A', GOLD = '#C9975A', RED = '#B23B36';
const SHADOW = '0 2px 4px rgba(220,188,86,0.16), 0 10px 24px rgba(233,203,110,0.30)';
const DAY = ['월', '화', '수', '목', '금', '토', '일'];
const day = (s) => { const d = new Date(String(s).length === 10 ? `${s}T00:00:00` : s); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };

// 요일 점 — 끝까지 한 날은 꽉 찬 점, 조금 한 날은 테두리만
function Dots({ days, today, stateOf, small = false }) {
  const size = small ? 13 : 16;
  return (
    <span style={{ display: 'flex', gap: small ? 4 : 5 }} aria-label="이번 주 한 날">
      {days.map((d, i) => {
        const st = stateOf(d);
        return (
          <span key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ width: size, height: size, borderRadius: '50%', boxSizing: 'border-box',
              background: st === 'full' ? GOLD : '#fff', border: `2px solid ${st ? GOLD : (d === today ? '#D8D3C8' : LINE)}` }} />
            {!small && <span style={{ fontSize: 9, fontWeight: d === today ? 900 : 700, color: d === today ? INK : SUB }}>{DAY[i]}</span>}
          </span>
        );
      })}
    </span>
  );
}

// 보낼 플리 고르기 — 내 마이플리 가운데 동작이 담긴 것
function PickPli({ plis, name, onPick, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(28,26,23,0.5)', display: 'flex',
      alignItems: 'flex-end', justifyContent: 'center', fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      <div role="dialog" aria-modal="true" aria-label="보낼 플리 고르기" onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', background: '#fff', borderRadius: '22px 22px 0 0',
          padding: '18px 18px 26px', color: INK, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 900, wordBreak: 'keep-all' }}>{name} 님에게 보낼 플리</div>
          <button type="button" onClick={onClose} aria-label="닫기"
            style={{ border: 'none', background: '#F4F1EB', width: 32, height: 32, borderRadius: '50%', fontSize: 15, fontWeight: 800, cursor: 'pointer', color: INK }}>✕</button>
        </div>
        {plis.length === 0 ? (
          <div style={{ fontSize: 12.5, fontWeight: 700, color: SUB, lineHeight: 1.7, padding: '14px 2px', wordBreak: 'keep-all' }}>
            보낼 플리가 아직 없어요. 내 보관함 → 마이플리에서 먼저 만들어 주세요. 공식 바디플리는 &lsquo;가져와 고치기&rsquo;로 내 것으로 만들 수 있어요.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 7 }}>
            {plis.map((r) => {
              const s = routineSummary(r.cards || []);
              return (
                <button key={r.id} type="button" onClick={() => onPick(r)}
                  style={{ textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: '#FAF7F0', borderRadius: 12,
                    padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: INK, wordBreak: 'keep-all' }}>{r.title_z}</span>
                    <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: SUB, marginTop: 2 }}>
                      동작 {s.count}개{s.durationSec > 0 ? ` · ${mmss(s.durationSec)}` : ''}
                    </span>
                  </span>
                  <span style={{ flexShrink: 0, fontSize: 15, fontWeight: 900, color: GOLD_INK }}>→</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** myPlis: 내 마이플리(보낼 수 있는 플리) */
export default function CoachDesk({ myPlis = [] }) {
  usePanelTime('coach');   // 행동 기록 — 이 창에 머문 시간
  const [now] = useState(() => new Date());
  const days = useMemo(() => weekDays(now), [now]);
  const today = isoOf(now);
  const [rows, setRows] = useState(null);       // null = 읽는 중 · false = 못 읽음
  const [ver, setVer] = useState(0);
  const [openId, setOpenId] = useState(null);   // 펼친 회원
  const [pick, setPick] = useState(null);       // 플리를 고르는 중인 회원
  const [send, setSend] = useState(null);       // { member, pli, task? } 보내기 창
  const [aliasOf, setAliasOf] = useState(null); // { id, text } 별칭을 적는 중
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    let alive = true;
    coachOverview().then((r) => { if (alive) setRows(r === null ? false : r); });
    return () => { alive = false; };
  }, [ver]);
  useEffect(() => {
    if (!note) return undefined;
    const t = setTimeout(() => setNote(''), 2200);
    return () => clearTimeout(t);
  }, [note]);

  // 보낼 수 있는 플리 — 동작이 담겨 있고, 내려가지 않은 것
  const sendable = useMemo(() => myPlis.filter((r) => (r.cards || []).length > 0 && r.share_state !== 'hidden'), [myPlis]);

  // 회원마다 이번 주에 한 날 수를 세고, 안 한 회원이 위로 오게 놓는다
  const members = useMemo(() => (rows || []).map((m) => {
    const stateOf = (d, routineId = null) => {
      const hit = (m.done || []).filter((x) => x.date === d && (routineId == null || x.routine_id === routineId));
      return hit.some((x) => x.all) ? 'full' : hit.length ? 'part' : '';
    };
    return { ...m, name: m.alias || m.nickname || '회원', stateOf, weekN: days.filter((d) => stateOf(d)).length };
  }).sort((a, b) => a.weekN - b.weekN || String(a.last || '').localeCompare(String(b.last || ''))), [rows, days]);

  const act = async (fn, okMsg) => {
    if (busy) return;
    setBusy(true);
    const ok = await fn();
    setBusy(false);
    if (!ok) { setNote('하지 못했어요. 잠시 후 다시 해 주세요.'); return; }
    setNote(okMsg); setVer((v) => v + 1);
  };
  const withdraw = (m, t) => {
    if (!window.confirm(`'${t.title}' 과제를 거둘까요?\n${m.name} 님의 과제 목록에서 사라져요. 회원이 한 기록은 회원에게 그대로 남아요.`)) return;
    act(() => withdrawTask(t.id), '과제를 거뒀어요');
  };
  const drop = (m) => {
    if (!window.confirm(`${m.name} 님과 연결을 끊을까요?\n받은 건강 정보와 보낸 과제가 지워지고, 다시 연결하려면 회원이 링크를 새로 열어야 해요.`)) return;
    track('coach_drop');
    act(() => dropMember(m.member_id), '연결을 끊었어요');
  };
  const saveAlias = () => {
    const { id, text } = aliasOf;
    setAliasOf(null);
    act(() => setAlias(id, text.trim()), '별칭을 바꿨어요');
  };

  const chip = (color = SUB) => ({ border: 'none', cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', borderRadius: 9, padding: '7px 11px',
    background: '#fff', color, fontSize: 12, fontWeight: 800, boxShadow: `inset 0 0 0 1px ${LINE}`, opacity: busy ? 0.6 : 1, whiteSpace: 'nowrap' });
  const sub = { fontSize: 11.5, fontWeight: 700, color: SUB, lineHeight: 1.6, wordBreak: 'keep-all' };

  if (rows === null) return <div style={{ padding: '40px 0', textAlign: 'center', color: SUB, fontSize: 13, fontWeight: 700 }}>불러오는 중…</div>;
  if (rows === false) {
    return (
      <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: '30px 16px', textAlign: 'center', color: SUB, fontSize: 13, fontWeight: 700, lineHeight: 1.7 }}>
        회원 목록을 불러오지 못했어요. 잠시 후 다시 열어 주세요.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      <div style={{ margin: '2px 2px 12px' }}>
        <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.01em' }}>내 회원 {members.length}명</div>
        <div style={{ ...sub, fontSize: 12, marginTop: 3 }}>
          {members.length ? '이번 주에 아직 안 한 회원이 위에 있어요' : '아직 연결된 회원이 없어요'}
        </div>
      </div>

      {members.length === 0 && (
        <div style={{ background: YELLOW, borderRadius: 14, padding: '14px 15px', fontSize: 12.5, fontWeight: 700, color: INK, lineHeight: 1.7, wordBreak: 'keep-all' }}>
          내 보관함 → 마이플리에서 플리 아래 &lsquo;회원에게 보내기&rsquo;를 눌러 주소를 만들고, 회원에게 보내 주세요.
          회원이 그 주소를 열고 동의하면 여기에 보여요.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {members.map((m) => {
          const on = openId === m.member_id;
          const lines = m.share_sheet ? sheetLines(m.sheet || {}) : [];
          return (
            <div key={m.member_id} style={{ background: '#fff', borderRadius: 18, border: '1px solid #F1EEE8', boxShadow: SHADOW }}>
              <button type="button" aria-expanded={on} onClick={() => setOpenId(on ? null : m.member_id)}
                style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', padding: '13px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: INK, wordBreak: 'keep-all' }}>{m.name}</span>
                  {m.alias && <span style={{ fontSize: 11.5, fontWeight: 700, color: SUB }}>닉네임 {m.nickname}</span>}
                  <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: SUB }}>{on ? '▴' : '▾'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 9 }}>
                  <Dots days={days} today={today} stateOf={(d) => m.stateOf(d)} />
                  <span style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 900, color: m.weekN ? GOLD_INK : (m.tasks.length ? RED : SUB) }}>
                      {m.tasks.length === 0 ? '보낸 과제 없음' : m.weekN ? `이번 주 ${m.weekN}일` : '이번 주 아직'}
                    </span>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: SUB, marginTop: 2 }}>
                      {m.last ? `마지막 ${day(m.last)}` : m.tasks.length ? '아직 한 날이 없어요' : ''}
                    </span>
                  </span>
                </div>
              </button>

              {on && (
                <div style={{ padding: '2px 14px 14px' }}>
                  {/* 건강 정보 한 장 — 회원이 보내기로 한 날의 사본 */}
                  <div style={{ borderTop: `1px solid ${LINE}`, padding: '12px 0' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: SUB, marginBottom: 6 }}>
                      건강 정보 한 장{m.share_sheet && m.sheet_at ? <span style={{ fontWeight: 700 }}> · {day(m.sheet_at)}에 받은 내용</span> : null}
                    </div>
                    {!m.share_sheet ? (
                      <div style={sub}>회원이 건강 정보 한 장을 보내지 않았어요.</div>
                    ) : lines.length === 0 ? (
                      <div style={sub}>보낸 건강 정보에 적힌 내용이 없어요.</div>
                    ) : lines.map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12.5, lineHeight: 1.7 }}>
                        <span style={{ flex: '0 0 82px', fontWeight: 700, color: SUB }}>{k}</span>
                        <span style={{ flex: 1, minWidth: 0, fontWeight: 700, color: INK, wordBreak: 'keep-all' }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* 보낸 과제 — 과제마다 이번 주에 한 날 */}
                  <div style={{ borderTop: `1px solid ${LINE}`, padding: '12px 0' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: SUB, marginBottom: 8 }}>보낸 과제 {m.tasks.length}개</div>
                    {m.tasks.length === 0 && <div style={sub}>아직 보낸 과제가 없어요. 아래에서 보내 주세요.</div>}
                    <div style={{ display: 'grid', gap: 8 }}>
                      {m.tasks.map((t) => {
                        const did = days.filter((d) => m.stateOf(d, t.routine_id)).length;
                        const pli = sendable.find((r) => r.id === t.routine_id);
                        return (
                          <div key={t.id} style={{ background: '#FAF7F0', borderRadius: 12, padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 800, color: INK, wordBreak: 'keep-all' }}>{t.title}</span>
                              <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 900, color: t.per_week && did >= t.per_week ? GOLD_INK : SUB }}>
                                이번 주 {did}{t.per_week ? `/${t.per_week}번` : '일'}
                              </span>
                            </div>
                            <div style={{ ...sub, marginTop: 3 }}>
                              {t.note && <span style={{ color: INK }}>“{t.note}” · </span>}{day(t.sent_at)}에 보냄
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                              <span style={{ marginRight: 'auto' }}><Dots small days={days} today={today} stateOf={(d) => m.stateOf(d, t.routine_id)} /></span>
                              {pli && <button type="button" disabled={busy} onClick={() => setSend({ member: m, pli, task: t })} style={chip()}>고치기</button>}
                              <button type="button" disabled={busy} onClick={() => withdraw(m, t)} style={chip(RED)}>거두기</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 별칭을 적는 칸 */}
                  {aliasOf?.id === m.member_id && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      <input autoFocus value={aliasOf.text} maxLength={20} aria-label="별칭"
                        onChange={(e) => setAliasOf({ id: m.member_id, text: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveAlias(); }}
                        placeholder={`예: 화요일 7시 · 비우면 닉네임(${m.nickname || '회원'})`}
                        style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, padding: '9px 11px',
                          borderRadius: 10, border: `1px solid ${LINE}` }} />
                      <button type="button" onClick={saveAlias} style={{ ...chip(GOLD_INK), background: YELLOW, boxShadow: `inset 0 0 0 1.5px ${GOLD}` }}>저장</button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="button" disabled={busy} onClick={() => setPick(m)}
                      style={{ ...chip(INK), padding: '9px 14px', fontSize: 13, boxShadow: '0 3px 10px rgba(217,185,106,0.45)' }}>＋ 과제 보내기</button>
                    <button type="button" disabled={busy} onClick={() => setAliasOf({ id: m.member_id, text: m.alias || '' })} style={chip()}>
                      {m.alias ? '별칭 고치기' : '별칭 붙이기'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => drop(m)}
                      style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800,
                        color: RED, textDecoration: 'underline', textUnderlineOffset: 3 }}>연결 끊기</button>
                  </div>
                  <div style={{ ...sub, fontSize: 11, marginTop: 9 }}>{day(m.since)}에 연결했어요 · 별칭은 나만 봐요</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 11, fontWeight: 600, color: SUB, lineHeight: 1.7, margin: '16px 2px 0', wordBreak: 'keep-all' }}>
        여기 보이는 것은 닉네임, 내가 보낸 과제를 한 날, 회원이 보내기로 한 건강 정보뿐이에요.
        수업 사이에 할 운동 과제를 안내하고 확인하는 데만 써 주세요.
      </p>

      {pick && (
        <PickPli plis={sendable} name={pick.name} onClose={() => setPick(null)}
          onPick={(pli) => { setSend({ member: pick, pli, task: (pick.tasks || []).find((t) => t.routine_id === pli.id) || null }); setPick(null); }} />
      )}
      {send && (
        <SendToMember pli={send.pli} member={send.member} task={send.task} onClose={() => setSend(null)}
          onSent={() => { setSend(null); setNote(send.task ? '과제를 고쳤어요' : '과제를 보냈어요'); setVer((v) => v + 1); }} />
      )}
      {note && (
        <div role="status" style={{ position: 'fixed', left: '50%', bottom: 96, transform: 'translateX(-50%)', zIndex: 97, background: 'rgba(28,26,23,0.9)',
          color: '#fff', borderRadius: 999, padding: '9px 16px', fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap' }}>{note}</div>
      )}
    </div>
  );
}
