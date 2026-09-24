// 부담이 몰린 날·주·요일 — '기분·불편함 추이'와 같은 짜임.
// 막대는 부담(초록·노랑·빨강), 꺾은선은 기분(말랑이 표정).
//
// 불편함이 아니라 기분과 엮는다. 부담은 몸보다 마음에 먼저 닿는 값이라,
// 같은 그림 안에서 말랑이 얼굴이 내려앉는 걸 보는 편이 알아듣기 쉽다.
import { useState } from 'react';
import { strainTrend, MODES, MODE_LABEL, TITLE, SUB } from '../lib/strainTrend';
import { riskBand, riskFill } from '../lib/riskBands';
import { getTypeAccent } from '../lib/typeAccent';
import { DiaryIcon } from './DiaryIcons';
import { Mallang } from './Mallang';

const C = { ink: '#1C1A17', sub: '#9B9489' };
const SHADOW = '0 2px 4px rgba(220,188,86,0.16), 0 10px 24px rgba(233,203,110,0.42)';
const WD = ['일', '월', '화', '수', '목', '금', '토'];

function SwitchPill({ mode, onPick, t }) {
  const idx = Math.max(0, MODES.indexOf(mode));
  const W = 48;
  return (
    <div style={{ position: 'relative', display: 'flex', background: '#FBF1C9', borderRadius: 999, padding: 3, flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 3, bottom: 3, left: 3, width: W, borderRadius: 999, background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.16)', transform: `translateX(${idx * 100}%)`, transition: 'transform .25s ease' }} />
      {MODES.map((m) => (
        <button key={m} type="button" onClick={() => onPick(m)}
          style={{ position: 'relative', zIndex: 1, width: W, padding: '5px 0', textAlign: 'center', border: 'none',
            background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800,
            color: mode === m ? t.accentDeep : C.sub, transition: 'color .2s' }}>
          {MODE_LABEL[m]}
        </button>
      ))}
    </div>
  );
}

export default function StrainTrendCard({ entries }) {
  const [mode, setMode] = useState('weekly');
  // 말랑이 얼굴이 막대 위에 얹혀 숫자를 가린다. 그래프를 누르면 막대가 앞으로 나온다.
  // (손가락으로는 올려놓을 수가 없어서 누르기로도 되게 둔다)
  const [barsUp, setBarsUp] = useState(false);
  const t = getTypeAccent();
  const d = strainTrend(entries, mode);
  const any = strainTrend(entries, 'weekly') || strainTrend(entries, 'daily');
  if (!any) return null;

  const cats = d ? d.cats : [];
  const scroll = mode === 'daily';
  const colW = 26, gap = scroll ? 0 : 6;
  const H = 104, barH = 66;
  const moods = cats.map((c, i) => ({ i, v: c.mood })).filter((x) => x.v != null);
  // 막대 한가운데. i/(n-1)로 두면 첫 칸과 끝 칸의 말랑이가 그래프 밖으로 반쯤 나간다.
  const xOf = (i) => ((i + 0.5) / cats.length) * 100;
  const yOf = (v) => 100 - ((Math.max(1, Math.min(5, v)) - 1) / 4) * 62 - 20;
  const dPath = moods.length >= 2
    ? moods.map((x, k) => `${k ? 'L' : 'M'}${xOf(x.i).toFixed(2)} ${yOf(x.v).toFixed(2)}`).join(' ')
    : null;
  const faceSize = scroll ? 17 : 21;

  const hot = (v) => <b style={{ color: '#E0554F' }}>{v}</b>;
  const line = d && d.top ? (
    mode === 'weekday' ? <>이번 달은 {hot(`${d.top.label}요일`)}에 부담이 가장 많이 쌓였어요.</>
      : mode === 'weekly' ? <>이번 달은 {hot(`${d.top.label}차`)}에 부담이 가장 많이 쌓였어요.</>
        : <>{hot(`${d.top.label}일`)}에 부담이 가장 컸어요.</>
  ) : null;

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '18px 18px 20px', boxShadow: SHADOW, border: '1px solid #F1EEE8' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: t.accentSoft }}>
          <DiaryIcon name="stress" size={19} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', color: C.ink }}>{TITLE[mode]}</div>
          <p style={{ fontSize: 12, color: C.sub, fontWeight: 600, margin: '3px 0 0', wordBreak: 'keep-all', lineHeight: 1.4 }}>{SUB[mode]}</p>
        </div>
        <SwitchPill mode={mode} onPick={setMode} t={t} />
      </div>

      {/* 점수가 어떻게 나온 값인지 — 숫자만 두면 '내가 몇 점짜리 사람인가'가 된다 */}
      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, lineHeight: 1.7, margin: '12px 0 10px', wordBreak: 'keep-all' }}>
        오늘의 태그마다 무게가 있어요. <b style={{ color: C.ink }}>진통제·업무과다처럼 몸이 이미 신호를 보낸 것은 2점</b>,
        오래 앉음·카페인처럼 쌓이면 부담이 되는 것은 1점, 수분 보충·영양제는 0점이에요.
        {mode === 'weekly' ? ' 그 주에 고른 것을 모두 더한 값입니다.' : ' 하루 평균으로 봤어요.'}
        <b style={{ color: C.ink }}> 음식 섭취는 세지 않아요.</b>
      </div>

      <div style={{ minHeight: 24, marginBottom: 4 }}>
        {line && <p style={{ fontSize: 14, fontWeight: 800, color: C.ink, margin: 0, lineHeight: 1.5, wordBreak: 'keep-all' }}>{line}</p>}
      </div>

      {!d ? (
        <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 700, padding: '18px 0', lineHeight: 1.7 }}>
          이 보기로 그리려면 기록이 조금 더 필요해요.
        </div>
      ) : (
        <div className="hide-scrollbar" style={{ overflowX: scroll ? 'auto' : 'visible', overflowY: 'hidden' }}>
          <div style={{ minWidth: scroll ? cats.length * colW : 'auto' }}>
            <div style={{ position: 'relative', height: H, cursor: 'pointer' }}
              onMouseEnter={() => setBarsUp(true)} onMouseLeave={() => setBarsUp(false)}
              onClick={() => setBarsUp((v) => !v)}>
              {/* 부담 막대 */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap, zIndex: barsUp ? 4 : 1 }}>
                {cats.map((c) => {
                  const empty = c.strain == null;
                  const ratio = empty ? 0 : Math.min(1, c.strain / d.max);
                  const band = riskBand(ratio);
                  const h = empty ? 3 : Math.max(4, Math.round(ratio * barH));
                  const col = scroll ? { width: colW, flex: '0 0 auto' } : { flex: 1 };
                  return (
                    <div key={c.key} style={{ ...col, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 3, height: '100%' }}>
                      {!empty && <span style={{ fontSize: 9.5, fontWeight: 800, color: band.text }}>{c.strain}</span>}
                      <div style={{ width: scroll ? 16 : '64%', maxWidth: 22, height: h, borderRadius: 6,
                        background: empty ? '#EFEBE3' : riskFill(ratio), opacity: empty ? 0.55 : 1, transition: 'height .3s' }} />
                    </div>
                  );
                })}
              </div>
              {/* 기분 꺾은선 + 말랑이 얼굴 */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: barsUp ? 2 : 3, pointerEvents: 'none' }}>
                {dPath && <path d={dPath} fill="none" stroke={t.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
              </svg>
              {cats.map((c, i) => (c.mood == null ? null : (
                <div key={c.key} style={{ position: 'absolute', left: `${xOf(i)}%`, top: `${yOf(c.mood)}%`,
                  transform: 'translate(-50%,-50%)', zIndex: barsUp ? 1 : 4, pointerEvents: 'none',
                  opacity: barsUp ? 0.55 : 1, transition: 'opacity .2s' }}>
                  <Mallang v={Math.round(c.mood)} size={faceSize} noBlink />
                </div>
              )))}
            </div>
            {/* x축 */}
            <div style={{ display: 'flex', gap, marginTop: 6 }}>
              {cats.map((c) => {
                const col = scroll ? { width: colW, flex: '0 0 auto' } : { flex: 1 };
                const peak = d.top && c.key === d.top.key;
                return (
                  <div key={c.key} style={{ ...col, textAlign: 'center' }}>
                    <div style={{ fontSize: scroll ? 9.5 : 11, fontWeight: peak ? 900 : 700, color: peak ? '#E0554F' : C.sub }}>{c.label}</div>
                    {scroll && <div style={{ fontSize: 8.5, fontWeight: 800, marginTop: 1,
                      color: c.dow === 0 ? '#E0554F' : c.dow === 6 ? '#2F6FE0' : '#BFB9AF' }}>{WD[c.dow]}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 10.5, fontWeight: 800, color: C.sub, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: 'linear-gradient(180deg,#F0917C,#E0554F)' }} />부담 점수
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 3, borderRadius: 2, background: t.accent }} />그때의 기분
        </span>
        <span style={{ marginLeft: 'auto', fontWeight: 700 }}>
          {barsUp ? '그래프가 앞에 있어요' : '그래프를 누르면 막대가 앞으로'}
        </span>
      </div>
    </div>
  );
}
