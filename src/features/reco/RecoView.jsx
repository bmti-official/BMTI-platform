// 추천 루틴 — 누구나 온라인으로 받아 보는 이번 주 과제.
//
// 건강 정보 한 장에 적은 불편한 부위에 맞는 공식 바디플리를 두세 개 골라 보여 주고,
// 요일마다 했는지를 표시한다. 따라 하면 저절로 표시되고, 영상 없이 한 날은 '했어요'를 누른다.
// 강사와 연결하는 기능이 붙으면, 강사가 보낸 과제가 이 위에 선다.
import { useEffect, useMemo, useState } from 'react';
import PliFeed from '../curation/PliFeed';
import RoutinePlayer from '../curation/RoutinePlayer';
import PliCover from '../curation/PliCover';
import { routineSummary, mmss, pickRoutineTone } from '../curation/format';
import { recommend, weekDays, isoOf } from './recommend';
import { pliFinishesSince, setPliChecked } from '../../lib/cardFinish';
import { KEY_TO_PART_LABEL } from '../../lib/diaryEntryLabels';
import { usePanelTime } from '../../lib/usePanelTime';
import { track } from '../../lib/analytics';
import { RECO_TAB } from '../../lib/tabNames';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A', GOLD = '#C9975A';
const SHADOW = '0 2px 4px rgba(220,188,86,0.16), 0 10px 24px rgba(233,203,110,0.30)';
const DAY = ['월', '화', '수', '목', '금', '토', '일'];

// 씨앗에 쓸 '이 사람' — 회원 번호가 없으면 이 기기의 익명 번호
const whoKey = (userId) => { try { return userId || localStorage.getItem('bmti_anon_id') || 'guest'; } catch { return userId || 'guest'; } };

export default function RecoView({ plis = [], userId = null, health, tone = 'z', bmtiCode, onOpenSheet, onRequireLogin }) {
  usePanelTime('reco');   // 행동 기록 — 이 창에 머문 시간
  const [now] = useState(() => new Date());
  const days = useMemo(() => weekDays(now), [now]);
  const today = isoOf(now);
  const [rows, setRows] = useState([]);       // 지난주부터의 수행 기록
  const [ver, setVer] = useState(0);          // 따라 하고 돌아오면 올려 다시 읽는다
  const [openPli, setOpenPli] = useState(null);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!userId) return undefined;
    const from = new Date(now); from.setDate(from.getDate() - 14);
    pliFinishesSince(isoOf(from)).then((r) => { if (alive) setRows(r); });
    return () => { alive = false; };
  }, [userId, ver, now]);
  const mine = useMemo(() => (userId ? rows : []), [userId, rows]);

  // 지난주에 끝까지 한 루틴 — 이번 주에는 조금 뒤로 물린다
  const doneLast = useMemo(() => new Set(mine.filter((r) => r.done && r.date < days[0]).map((r) => r.routine_id)), [mine, days]);
  const picks = useMemo(
    () => recommend(plis, health?.parts || [], { seed: `${days[0]}:${whoKey(userId)}`, doneLast, n: 3 }),
    [plis, health, days, userId, doneLast],
  );
  // 이번 주, 플리마다 날짜마다 — 'full'(끝까지) · 'part'(조금)
  const stateOf = (id, d) => {
    const hit = mine.filter((r) => r.routine_id === id && r.date === d);
    return hit.some((r) => r.done) ? 'full' : hit.length ? 'part' : '';
  };
  const didDays = days.filter((d) => picks.some((x) => stateOf(x.pli.id, d))).length;

  const check = async (id, on) => {
    if (!userId) { if (onRequireLogin) onRequireLogin(); return; }
    // 먼저 화면을 바꾸고, 서버가 못 받으면 다시 읽어 되돌린다
    setRows((p) => (on ? [...p, { date: today, routine_id: id, done: true, manual: true }]
      : p.filter((r) => !(r.routine_id === id && r.date === today && r.manual))));
    track('reco_check', { pli: id, on });
    const ok = await setPliChecked(id, on);
    if (!ok) setVer((v) => v + 1);
  };

  if (plis.length === 0) {
    return (
      <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: '30px 16px', textAlign: 'center', color: SUB,
        fontSize: 13, fontWeight: 700, lineHeight: 1.7 }}>추천할 루틴을 준비하고 있어요.</div>
    );
  }

  const labels = (health?.labels || []).join('·');
  return (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, margin: '2px 2px 10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.01em' }}>이번 주 {RECO_TAB}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: SUB, marginTop: 3, lineHeight: 1.5, wordBreak: 'keep-all' }}>
            {health?.has ? (labels ? `${labels}에 맞춰 골랐어요` : '불편한 곳이 없다고 적으셔서 고루 골랐어요') : '아직 건강 정보가 없어 고루 골랐어요'}
            {userId && didDays > 0 ? ` · 이번 주 ${didDays}일 했어요` : ''}
          </div>
        </div>
        {health?.has && (
          <button type="button" onClick={onOpenSheet}
            style={{ flexShrink: 0, border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 9, padding: '6px 10px',
              background: 'transparent', color: SUB, fontSize: 11, fontWeight: 800, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
            건강 정보 고치기
          </button>
        )}
      </div>

      {/* 아직 안 적었으면 — 적을 이유가 가장 분명한 자리 */}
      {!health?.has && (
        <button type="button" onClick={onOpenSheet}
          style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: YELLOW,
            borderRadius: 14, padding: '13px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, color: INK, lineHeight: 1.55, wordBreak: 'keep-all' }}>
            어디가 불편한지 알려 주면, 그에 맞는 루틴부터 골라 드려요.
            <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: GOLD_INK, marginTop: 2 }}>건강 정보 한 장 적기 · 1~2분</span>
          </span>
          <span style={{ flexShrink: 0, fontSize: 16, fontWeight: 900, color: GOLD_INK }}>→</span>
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {picks.map(({ pli, hits }) => {
          const sum = routineSummary(pli.cards || []);
          const todayState = stateOf(pli.id, today);
          const checked = mine.some((r) => r.routine_id === pli.id && r.date === today && r.manual);
          return (
            <div key={pli.id} style={{ background: '#fff', borderRadius: 18, padding: 12, border: '1px solid #F1EEE8', boxShadow: SHADOW }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                <button type="button" onClick={() => setOpenPli(pli)} aria-label="무엇이 담겼는지 보기"
                  style={{ flex: '0 0 86px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <PliCover pli={pli} radius={12} />
                </button>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <button type="button" onClick={() => setOpenPli(pli)}
                    style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                    <div style={{ fontSize: 14.5, fontWeight: 900, color: INK, lineHeight: 1.35, wordBreak: 'keep-all' }}>{pickRoutineTone(pli, tone).title}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: SUB, marginTop: 3 }}>
                      동작 {(pli.cards || []).length}개{sum.durationSec > 0 ? ` · ${mmss(sum.durationSec)}` : ''}
                    </div>
                  </button>
                  {hits.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      {hits.map((h) => (
                        <span key={h} style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 800, color: GOLD_INK, background: YELLOW,
                          borderRadius: 999, padding: '2px 8px', marginRight: 4 }}>{KEY_TO_PART_LABEL[h] || h}</span>
                      ))}
                    </div>
                  )}
                  {/* 요일마다 했는지 — 끝까지 한 날은 꽉 찬 점, 조금 한 날은 테두리만 */}
                  <div style={{ display: 'flex', gap: 5, marginTop: 'auto', paddingTop: 9 }} aria-label="이번 주 한 날">
                    {days.map((d, i) => {
                      const st = stateOf(pli.id, d);
                      return (
                        <span key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <span style={{ width: 16, height: 16, borderRadius: '50%', boxSizing: 'border-box',
                            background: st === 'full' ? GOLD : '#fff', border: `2px solid ${st ? GOLD : (d === today ? '#D8D3C8' : LINE)}` }} />
                          <span style={{ fontSize: 9, fontWeight: d === today ? 900 : 700, color: d === today ? INK : SUB }}>{DAY[i]}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
                <button type="button" onClick={() => { track('reco_start', { pli: pli.id }); setPlaying(pli); }}
                  style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: '#fff', color: INK, fontSize: 13.5, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(217,185,106,0.45)' }}>
                  바로 시작하기 →
                </button>
                {todayState === 'full' && !checked ? (
                  <span style={{ flex: '0 0 96px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12,
                    background: YELLOW, color: GOLD_INK, fontSize: 12.5, fontWeight: 800 }}>오늘 했어요 ✓</span>
                ) : (
                  <button type="button" onClick={() => check(pli.id, !checked)} aria-pressed={checked}
                    style={{ flex: '0 0 96px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800,
                      background: checked ? YELLOW : '#fff', color: checked ? GOLD_INK : SUB, boxShadow: checked ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
                    {checked ? '오늘 했어요 ✓' : '했어요'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!userId && (
        <button type="button" onClick={onRequireLogin}
          style={{ display: 'block', margin: '14px auto 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 700, color: SUB, textDecoration: 'underline', textUnderlineOffset: 3 }}>
          로그인하면 한 날이 요일마다 표시돼요
        </button>
      )}
      <p style={{ fontSize: 11, fontWeight: 600, color: SUB, lineHeight: 1.65, margin: '16px 2px 0', wordBreak: 'keep-all' }}>
        추천 루틴은 운동 안내예요. 하다가 아프면 멈추고, 불편함이 이어지면 병원 진료를 받아 보세요.
      </p>

      {openPli && (
        <PliFeed plis={picks.map((x) => x.pli)} startId={openPli.id} tone={tone} bmtiCode={bmtiCode}
          onClose={() => { setOpenPli(null); setVer((v) => v + 1); }} />
      )}
      {playing && (
        <RoutinePlayer routine={playing} cards={playing.cards || []} tone={tone} bmtiCode={bmtiCode}
          onClose={() => { setPlaying(null); setVer((v) => v + 1); }} />
      )}
    </div>
  );
}
