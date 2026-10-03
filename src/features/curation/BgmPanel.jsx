// 배경음악 고르는 칸 — 켬·끔, 크기, 곡. 바로플리와 바로카드가 함께 쓴다.
import { BGM_GROUPS } from './voiceCommon';
import { VOL_STEPS, hasSong } from './bgmBits';

const SUB = '#8A8378', LINE = '#EDE9E2';
const SET_BG = '#FBF4DE', SET_INK = '#6E5A1C';

export default function BgmPanel({ pad, common, musicOn, volNo, bgmNo, onToggle, onVol, onSong }) {
  return (
    <div style={{ padding: pad }}>
      {/* 켬·끔 · 이름 · 크기 — 한 줄에 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <button type="button" onClick={onToggle} aria-label={musicOn ? '음악 끄기' : '음악 켜기'}
          style={{ padding: '0 11px', height: 28, borderRadius: 9, border: 'none', fontFamily: 'inherit',
            fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
            background: musicOn ? SET_BG : '#fff', color: musicOn ? SET_INK : SUB,
            boxShadow: musicOn ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
          {musicOn ? '♪ 켬' : '♪ 끔'}
        </button>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: SUB }}>배경음악</span>
        <VolBar no={volNo} on={musicOn} onPick={onVol} />
      </div>
      {/* 곡 고르기 — 두 개씩 나란히 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {BGM_GROUPS.map((g) => {
          const can = hasSong(common, g.n);
          return (
            <button key={g.n} type="button" disabled={!can} onClick={() => onSong(g.n)}
              style={{ padding: '0 10px', height: 32, borderRadius: 9, border: 'none', fontFamily: 'inherit',
                fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap',
                cursor: can ? 'pointer' : 'default', opacity: can ? 1 : 0.35,
                color: g.n === bgmNo ? SET_INK : SUB,
                background: g.n === bgmNo ? SET_BG : '#fff', boxShadow: g.n === bgmNo ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
              {g.hint}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 음악 크기 — 다섯 칸짜리 막대. 몇 칸인지 눈으로 바로 보인다.
function VolBar({ no, on, onPick }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginRight: 4 }}>
      {VOL_STEPS.map((v, i) => (
        <button key={v} type="button" onClick={() => onPick(i)} aria-label={`음악 크기 ${i + 1}칸`}
          style={{ width: 11, height: 8 + i * 4, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer',
            background: on && i <= no ? SET_INK : '#E6E1D8', transition: 'background .15s' }} />
      ))}
    </span>
  );
}
