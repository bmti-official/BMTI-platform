// 운동 상자 둘 — 이번달 기록의 '이번 달 운동', 이번달 발견의 '움직인 날, 쉬어 간 날'.
// 계산은 lib/exerciseFindings.js 가 맡고 여기서는 그리기만 한다.
import { exerciseMonth, moveVsRest } from '../lib/exerciseFindings';
import { REASON_ICON, REASON_PHRASE } from '../lib/diarySentence';
import { SLEEP_LABELS } from '../lib/diaryEntryLabels';
import { strainWord } from '../lib/diaryTags';
import { getTypeAccent } from '../lib/typeAccent';
import { MOODS } from '../data';
import { DiaryIcon } from './DiaryIcons';

const C = { ink: '#1C1A17', sub: '#9B9489', card: '#FFFFFF', track: '#F3F1EC' };
const SHADOW = '0 2px 4px rgba(220,188,86,0.16), 0 10px 24px rgba(233,203,110,0.42)';
const BARO = '#F4DB4A';   // 바디카드 막대 — 형광 노랑으로 다른 종목과 구분한다

function Card({ icon = 'walk', title, sub, children }) {
  const t = getTypeAccent();
  return (
    <div style={{ background: C.card, borderRadius: 20, padding: '18px 18px 20px', boxShadow: SHADOW, border: '1px solid #F1EEE8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: t.accentSoft, color: t.accentDeep }}><DiaryIcon name={icon} size={19} /></span>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', color: C.ink }}>{title}</span>
      </div>
      {sub && <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginBottom: 14, lineHeight: 1.65, wordBreak: 'keep-all' }}>{sub}</div>}
      {children}
    </div>
  );
}

// ── 이번달 기록 — 이번 달 운동 ──────────────────────────────
export function ExerciseMonthCard({ entries }) {
  const t = getTypeAccent();
  const x = exerciseMonth(entries);
  if (!x) return null;
  return (
    <Card title="이번 달 운동" sub={`운동 칸을 적은 ${x.of}일을 움직인 날과 쉬어 간 날로 나눴어요.`}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '2px 0 14px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 38, fontWeight: 900, color: t.accentDeep, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{x.moved}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: t.accentDeep }}>일 움직였어요</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginLeft: 4 }}>기록한 {x.of}일 중</span>
      </div>
      {x.rows.map((r) => (
        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
          <span style={{ flex: '0 0 76px', fontSize: 11.5, fontWeight: r.baro ? 800 : 700, color: C.ink, wordBreak: 'keep-all' }}>{r.label}</span>
          <span style={{ flex: 1, height: 9, borderRadius: 999, background: C.track, overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${Math.max(6, r.pct)}%`, borderRadius: 999,
              background: r.baro ? BARO : '#CFCFC7' }} />
          </span>
          <span style={{ flex: '0 0 30px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: C.sub, fontVariantNumeric: 'tabular-nums' }}>{r.days}일</span>
        </div>
      ))}
      {x.rested > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: x.rows.length ? 12 : 0, paddingTop: 12,
          borderTop: '1px solid #F3F1EC', fontSize: 12.5, fontWeight: 700, color: C.ink, lineHeight: 1.6, wordBreak: 'keep-all' }}>
          {x.reason && REASON_ICON[x.reason.key] && <DiaryIcon name={REASON_ICON[x.reason.key]} size={22} />}
          <span>
            쉬어 간 날 <b>{x.rested}일</b>
            {x.reason && <span style={{ color: C.sub }}> — 가장 많았던 이유: {REASON_PHRASE[x.reason.key] || '쉬고 싶어서'} {x.reason.days}일</span>}
          </span>
        </div>
      )}
    </Card>
  );
}

// ── 이번달 발견 — 움직인 날, 쉬어 간 날 ─────────────────────
const moodWord = (v) => (v == null ? null : (MOODS.find((m) => m.v === Math.min(5, Math.max(1, Math.round(v))))?.label || null));
const sleepWord = (v) => (v == null ? null : SLEEP_LABELS[Math.min(3, Math.max(0, Math.round(v)))]);

function Cell({ word, note, fill, color }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: C.ink, lineHeight: 1.35, wordBreak: 'keep-all', minHeight: 34,
        display: 'flex', alignItems: 'center' }}>{word || '–'}</div>
      <div style={{ height: 6, borderRadius: 999, background: C.track, overflow: 'hidden', margin: '5px 0 5px' }}>
        <div style={{ height: '100%', width: `${Math.round(Math.min(1, Math.max(0, fill || 0)) * 100)}%`, borderRadius: 999, background: color }} />
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.sub, lineHeight: 1.4, wordBreak: 'keep-all' }}>{note}</div>
    </div>
  );
}

export function MoveRestCard({ entries }) {
  const t = getTypeAccent();
  const v = moveVsRest(entries);
  if (!v) return null;
  // 부담 점수 막대는 두 줄 가운데 큰 쪽을 가득으로 본다(점수에 정해진 꼭대기가 없다)
  const top = Math.max(v.move.strain || 0, v.rest.strain || 0, 1);
  const line = (label, s, color) => (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, padding: '12px 0', borderTop: '1px solid #F3F1EC' }}>
      <div style={{ flex: '0 0 58px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: C.ink, wordBreak: 'keep-all' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{s.n}일</span>
      </div>
      <Cell color={color} word={moodWord(s.mood)} fill={s.mood == null ? 0 : s.mood / 5}
        note={s.moodOf ? `괜찮은 날 ${s.moodGood}일` : '기분 기록 없음'} />
      <Cell color={color} word={s.strain == null ? null : `${s.strain}점`} fill={(s.strain || 0) / top}
        note={s.strain == null ? '' : `평균 ${strainWord(Math.round(s.strain))}`} />
      <Cell color={color} word={sleepWord(s.sleep)} fill={s.sleep == null ? 0 : (s.sleep + 1) / 4}
        note={s.sleepOf ? `푹 잔 날 ${s.sleepGood}일` : '수면 기록 없음'} />
    </div>
  );
  return (
    <Card title="움직인 날, 쉬어 간 날"
      sub="운동 칸을 적은 날을 둘로 나눠, 그날 함께 적은 기분·부담 점수·수면을 나란히 뒀어요.">
      <div style={{ display: 'flex', gap: 10, paddingBottom: 7, fontSize: 11, fontWeight: 800, color: C.sub }}>
        <span style={{ flex: '0 0 58px' }} />
        <span style={{ flex: 1 }}>기분</span>
        <span style={{ flex: 1 }}>부담 점수</span>
        <span style={{ flex: 1 }}>수면</span>
      </div>
      {line('움직인 날', v.move, t.accentDeep)}
      {line('쉬어 간 날', v.rest, '#B9B2A6')}
      <div style={{ marginTop: 6, paddingTop: 12, borderTop: '1px solid #F3F1EC', fontSize: 11.5, fontWeight: 600, color: C.sub, lineHeight: 1.65, wordBreak: 'keep-all' }}>
        같은 날 함께 있던 것을 나란히 둔 것이에요. 무엇이 무엇 때문인지는 이 기록만으로 알 수 없어요.
      </div>
    </Card>
  );
}
