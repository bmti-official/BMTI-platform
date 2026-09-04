// 손님에게 보이는 바로카드 — 인스타 게시물처럼.
//  ① 종류·시간·제목·완주율  ② 추천 유형 누끼 캐릭터  ③ 4:5 표지(부위·도구를 모서리에 얹는다)
//  ④ 조회·저장 + 보관하기   ⑤ 바로 따라하기
// 관리자 미리보기에서 먼저 쓰고, 공개할 때 사용자 화면에서 그대로 import한다.
import { useEffect, useRef, useState } from 'react';
import MotionPlayer from './MotionPlayer';
import { CurationThumb, CharRow, KeepChip } from './CurationCard';
import AiNote from './AiNote';
import { KEY_TO_PART_LABEL } from '../../lib/diaryEntryLabels';
import { KIND_LABEL, pickCardTone, fmtCount as fmt, mmss } from './format';
import { BodyPreview } from './CurationCard';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const GOLD = '#B08635';                   // 타겟 부위 · 도구를 짚어 주는 골드
const KEEP_SHADOW = '0 3px 10px rgba(217,185,106,0.45)';   // 버튼에 깔리는 연한 옐로우 그림자
const GLASS = '#FDF2CE';                  // 표지 위 글씨를 받쳐 주는 연한 옐로우(불투명)
const NAME_BG = '#FDF2CE', NAME_INK = '#6E5A1C';           // 제목 옆 동작 이름표
const SET_BG = '#FBF4DE', SET_INK = '#6E5A1C';             // 세트 고르기 · 세트 세기

// 전체 화면일 때는 가로에 맞추면 세로 영상이 지나치게 커진다.
// 높이에 맞춰 담기게(contain) 되돌린다.
const FULLSCREEN_FIX = `
.bmti-clip:fullscreen, .bmti-clip:-webkit-full-screen {
  object-fit: contain !important; width: 100% !important; height: 100% !important; background: #000;
}`;

const partLabels = (keys) => (keys || []).map((k) => KEY_TO_PART_LABEL[k] || k);

// 표지 모서리에 얹는 글씨 — 사진 위에서도 읽히게 끝이 둥근 반투명 연한 옐로우를 깐다.
const overlay = (side) => ({
  position: 'absolute', top: 10, [side]: 10, zIndex: 2, pointerEvents: 'none',
  background: GLASS, borderRadius: 10, padding: '5px 9px',
  fontSize: 12, fontWeight: 800, lineHeight: 1.35, letterSpacing: '-0.01em',
  textAlign: side === 'right' ? 'right' : 'left', wordBreak: 'keep-all',
});

const SETS = [3, 4, 5];
const SIDES = [['left', '좌'], ['right', '우'], ['both', '둘 다']];

export default function QuickCardView({ card, tone = 'z', motion = null, onStart, onSave, charImages, charCodes }) {
  const { title, script } = pickCardTone(card, tone);
  // 처음엔 4:5 표지를 보여 주고, 따라하기를 누르면 같은 4:5 동작으로 바뀐다.
  const [started, setStarted] = useState(false);
  // 몇 세트 할지는 손님이 정한다. 시작한 뒤에는 몇 세트째인지 센다.
  const [sets, setSets] = useState(3);
  const [done, setDone] = useState(0);
  const allDone = started && done >= sets;
  // 좌우가 나뉘는 동작이면 어느 쪽을 할지 고른다.
  const [side, setSide] = useState('both');
  // AI 음성 — 오프닝이 먼저 흐르고, 끝나면 세트 멘트로 넘어간다.
  const openUrl = (tone === 'm' ? card.voice_open_m : card.voice_open_z) || '';
  const setClips = ((tone === 'm' ? card.voice_sets_m : card.voice_sets_z) || []).filter(Boolean);
  const hasVoice = !!(openUrl || setClips.length);
  const [phase, setPhase] = useState('open');
  const [voiceOn, setVoiceOn] = useState(true);
  const [vol, setVol] = useState(0.85);
  const audioRef = useRef(null);
  const nowVoice = !started ? ''
    : phase === 'open' && openUrl ? openUrl
      : (setClips[Math.min(done, setClips.length - 1)] || '');

  // 멘트가 바뀌면 처음부터 다시 틀어 준다.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !nowVoice) return;
    a.volume = vol;
    a.muted = !voiceOn;
    if (!voiceOn) return;
    try { a.currentTime = 0; a.play().catch(() => {}); } catch { /* 무시 */ }
  }, [nowVoice, voiceOn, vol]);
  const hasPlay = !!(motion || card.video_url);
  const core = partLabels(card.core_parts);
  const related = partLabels(card.related_parts);
  const tools = card.tools || [];
  const chars = (charImages || []).slice(0, 4);

  return (
    <article style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK, border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
      <style>{FULLSCREEN_FIX}</style>
      <div style={{ padding: '12px 15px 10px' }}>
        {/* 추천 유형 누끼 캐릭터, 그 오른쪽에 종류와 소요 시간 */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, minHeight: 30 }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            {chars.length > 0 && <CharRow chars={chars} codes={charCodes || []} h={30} />}
          </span>
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, paddingBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8A6A3A', background: '#F3EAD8', borderRadius: 999, padding: '3px 9px' }}>
              {KIND_LABEL[card.kind] || card.kind}
            </span>
            {card.duration_sec > 0 && <span style={{ fontSize: 11.5, color: SUB, fontWeight: 700 }}>{mmss(card.duration_sec)}</span>}
          </span>
        </div>
        {/* 동작 이름표(Z·M 공통) + 제목 */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 8, flexWrap: 'wrap' }}>
          {card.thumb_text && (
            <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: NAME_INK, background: NAME_BG,
              borderRadius: 999, padding: '4px 11px', whiteSpace: 'nowrap' }}>{card.thumb_text}</span>
          )}
          <h3 style={{ flex: 1, minWidth: 0, fontSize: 15.5, fontWeight: 800, lineHeight: 1.4, margin: 0, wordBreak: 'keep-all' }}>{title}</h3>
        </div>
      </div>

      {started && hasPlay ? (
        // 실제 동작 — 표지와 같은 4:5
        <div style={{ width: '100%', aspectRatio: '4 / 5', background: '#F3F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {motion
            ? <MotionPlayer motion={motion} size={640} bg="#F3F1EC" />
            : <video className="bmti-clip" src={card.video_url} autoPlay loop muted playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
      ) : (
        // 표지 — 인스타 게시물 비율(4:5). 영상이 있으면 0~5초가 소리 없이 돌아간다.
        <div style={{ position: 'relative' }}>
          <CurationThumb item={card} radius={0} ratio="4 / 5" showRead={false} clip={card.video_url || ''} emptyText="동작 영상 없음"
            badge={card.duration_sec > 0 ? { label: '소요시간', value: mmss(card.duration_sec) } : null} />
          {/* 왼쪽 위 — 타겟 부위(연보라) / 연관 부위(검정) */}
          {(core.length > 0 || related.length > 0) && (
            <div style={overlay('left')}>
              {core.length > 0 && <div style={{ color: GOLD }}>{core.join(', ')}</div>}
              {related.length > 0 && <div style={{ color: INK, fontSize: 10.5, fontWeight: 700 }}>({related.join(', ')})</div>}
            </div>
          )}
          {/* 오른쪽 위 — 도구(골드) */}
          {tools.length > 0 && <div style={{ ...overlay('right'), color: GOLD }}>{tools.join(', ')}</div>}
        </div>
      )}

      {/* AI 음성 — 화면에는 조절 막대만 두고, 소리는 이 태그가 낸다 */}
      {started && hasVoice && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 15px 0' }}>
          <audio ref={audioRef} src={nowVoice || undefined} preload="auto"
            onEnded={() => { if (phase === 'open') setPhase('set'); }} style={{ display: 'none' }} />
          <button type="button" onClick={() => setVoiceOn((v) => !v)} aria-label={voiceOn ? '음성 끄기' : '음성 켜기'}
            style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15,
              background: voiceOn ? SET_BG : '#fff', boxShadow: voiceOn ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
            {voiceOn ? '🔊' : '🔇'}
          </button>
          <input type="range" min={0} max={100} step={5} value={Math.round(vol * 100)} aria-label="음성 크기"
            onChange={(e) => { setVol(Number(e.target.value) / 100); setVoiceOn(true); }}
            style={{ flex: 1, minWidth: 0, accentColor: '#C9A227' }} />
          <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: SUB, width: 62, textAlign: 'right' }}>
            {phase === 'open' && openUrl ? '준비 멘트' : '동작 멘트'}
          </span>
        </div>
      )}

      <div style={{ padding: '12px 15px 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: SUB, fontWeight: 600, marginBottom: 12 }}>
          <span>조회 {fmt(card.view_count)}</span><span style={{ color: LINE }}>·</span><span>저장 {fmt(card.save_count)}</span>
          <span style={{ marginLeft: 'auto' }}><KeepChip onSave={onSave} /></span>
        </div>
        {/* 몇 세트 할지 — 시작 전엔 고르고, 시작한 뒤엔 몇 세트째인지 센다 */}
        {!started ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: SUB }}>세트</span>
            <span style={{ display: 'flex', gap: 4 }}>
              {SETS.map((n) => (
                <button key={n} type="button" onClick={() => setSets(n)}
                  style={{ width: 30, height: 28, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 12.5, fontWeight: 800, color: n === sets ? SET_INK : SUB,
                    background: n === sets ? SET_BG : '#fff', boxShadow: n === sets ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
                  {n}
                </button>
              ))}
            </span>
            {card.has_side ? (
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                {SIDES.map(([k, lb]) => (
                  <button key={k} type="button" onClick={() => setSide(k)}
                    style={{ padding: '0 9px', height: 28, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', color: k === side ? SET_INK : SUB,
                      background: k === side ? SET_BG : '#fff', boxShadow: k === side ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
                    {lb}
                  </button>
                ))}
              </span>
            ) : card.duration_sec > 0 ? (
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: SUB, fontWeight: 700, whiteSpace: 'nowrap' }}>
                모두 {mmss(card.duration_sec * sets)}
              </span>
            ) : null}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, background: SET_BG, borderRadius: 11, padding: '8px 11px' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: SET_INK }}>
              {allDone ? `${sets}세트 다 끝냈어요` : `${sets}세트 중 ${done + 1}세트째`}
              {card.has_side && !allDone && ` · ${SIDES.find(([k]) => k === side)?.[1]}`}
            </span>
            {!allDone && (
              <button type="button" onClick={() => { setDone((n) => n + 1); setPhase('set'); }}
                style={{ marginLeft: 'auto', border: 'none', background: '#fff', color: SET_INK, borderRadius: 999,
                  padding: '5px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                {done + 1 >= sets ? '다 했어요 ✓' : '다음 세트 →'}
              </button>
            )}
          </div>
        )}
        <button onClick={() => { setDone(0); setPhase('open'); if (!started) { setStarted(true); if (onStart) onStart(); } }}
          style={{ width: '100%', padding: 13, borderRadius: 13, border: 'none', background: '#fff', color: INK,
            fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: KEEP_SHADOW }}>
          {started ? '처음부터 다시 ↻' : '바로 따라하기 →'}
        </button>
        <AiNote top={10} />
        {script && (
          <details style={{ marginTop: 10 }}>
            <summary style={{ fontSize: 11.5, color: SUB, fontWeight: 700, cursor: 'pointer' }}>음성 안내 대본 보기</summary>
            <div style={{ fontSize: 13, margin: '8px 0 0' }}><BodyPreview text={script} /></div>
          </details>
        )}
      </div>
    </article>
  );
}
