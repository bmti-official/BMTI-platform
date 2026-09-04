// 손님에게 보이는 바로카드 — 인스타 게시물처럼.
//  ① 종류·시간·제목·완주율  ② 추천 유형 누끼 캐릭터  ③ 4:5 표지(부위·도구를 모서리에 얹는다)
//  ④ 조회·저장 + 보관하기   ⑤ 바로 따라하기
// 관리자 미리보기에서 먼저 쓰고, 공개할 때 사용자 화면에서 그대로 import한다.
import { useState } from 'react';
import MotionPlayer from './MotionPlayer';
import { CurationThumb, CharRow, KeepChip } from './CurationCard';
import AiNote from './AiNote';
import { KEY_TO_PART_LABEL } from '../../lib/diaryEntryLabels';
import { KIND_LABEL, pickCardTone, fmtCount as fmt, mmss, finishRate } from './format';
import { BodyPreview } from './CurationCard';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const PURPLE = '#7E6FC9';                 // 타겟 부위 · 도구를 짚어 주는 연보라
const KEEP_SHADOW = '0 3px 10px rgba(217,185,106,0.45)';   // 버튼에 깔리는 연한 옐로우 그림자

// 전체 화면일 때는 가로에 맞추면 세로 영상이 지나치게 커진다.
// 높이에 맞춰 담기게(contain) 되돌린다.
const FULLSCREEN_FIX = `
.bmti-clip:fullscreen, .bmti-clip:-webkit-full-screen {
  object-fit: contain !important; width: 100% !important; height: 100% !important; background: #000;
}`;

const partLabels = (keys) => (keys || []).map((k) => KEY_TO_PART_LABEL[k] || k);

// 표지 모서리에 얹는 글씨 — 사진 위에서도 읽히게 옅은 그늘을 깐다.
const overlay = (side) => ({
  position: 'absolute', top: 10, [side]: 12, zIndex: 2, pointerEvents: 'none',
  fontSize: 12, fontWeight: 800, lineHeight: 1.35, letterSpacing: '-0.01em',
  textAlign: side === 'right' ? 'right' : 'left', wordBreak: 'keep-all',
  textShadow: '0 1px 3px rgba(255,255,255,0.85), 0 0 8px rgba(255,255,255,0.7)',
});

export default function QuickCardView({ card, tone = 'z', motion = null, onStart, onSave, charImages, charCodes }) {
  const { title, script } = pickCardTone(card, tone);
  // 처음엔 4:5 표지를 보여 주고, 따라하기를 누르면 9:16 동작으로 바뀐다.
  const [started, setStarted] = useState(false);
  const hasPlay = !!(motion || card.video_url);
  const rate = finishRate(card);
  const core = partLabels(card.core_parts);
  const related = partLabels(card.related_parts);
  const tools = card.tools || [];
  const chars = (charImages || []).slice(0, 4);

  return (
    <article style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK, border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
      <style>{FULLSCREEN_FIX}</style>
      <div style={{ padding: '14px 15px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#8A6A3A', background: '#F3EAD8', borderRadius: 999, padding: '3px 9px' }}>
            {KIND_LABEL[card.kind] || card.kind}
          </span>
          {card.duration_sec > 0 && <span style={{ fontSize: 11.5, color: SUB, fontWeight: 700 }}>{mmss(card.duration_sec)}</span>}
        </div>
        <h3 style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.4, margin: '0 0 7px', wordBreak: 'keep-all' }}>{title}</h3>
        <div style={{ fontSize: 12, color: SUB, fontWeight: 600 }}>
          {rate != null ? `완주율 ${rate}%` : '아직 기록이 쌓이지 않았어요'}
          {card.finish_count > 0 && ` · 완주 ${fmt(card.finish_count)}회`}
        </div>
        {/* 표지 바로 위 — 이 카드를 추천하는 유형들 */}
        {chars.length > 0 && <CharRow chars={chars} codes={charCodes || []} h={30} />}
      </div>

      {started && hasPlay ? (
        // 실제 동작 — 쇼츠 비율(9:16)
        <div style={{ width: '100%', aspectRatio: '9 / 16', background: '#F3F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {motion
            ? <MotionPlayer motion={motion} size={640} bg="#F3F1EC" />
            : <video className="bmti-clip" src={card.video_url} controls autoPlay loop muted playsInline
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
              {core.length > 0 && <div style={{ color: PURPLE }}>{core.join(', ')}</div>}
              {related.length > 0 && <div style={{ color: INK }}>{related.join(', ')}</div>}
            </div>
          )}
          {/* 오른쪽 위 — 도구(연보라) */}
          {tools.length > 0 && <div style={{ ...overlay('right'), color: PURPLE }}>{tools.join(', ')}</div>}
        </div>
      )}

      <div style={{ padding: '12px 15px 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: SUB, fontWeight: 600, marginBottom: 12 }}>
          <span>조회 {fmt(card.view_count)}</span><span style={{ color: LINE }}>·</span><span>저장 {fmt(card.save_count)}</span>
          <span style={{ marginLeft: 'auto' }}><KeepChip onSave={onSave} /></span>
        </div>
        <button onClick={() => { setStarted(true); if (onStart) onStart(); }}
          style={{ width: '100%', padding: 13, borderRadius: 13, border: 'none', background: '#fff', color: INK,
            fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: KEEP_SHADOW }}>
          {started ? '다시 보기 ↻' : '바로 따라하기 →'}
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
