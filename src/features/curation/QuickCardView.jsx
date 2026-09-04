// 손님에게 보이는 바로카드 — 인스타 게시물처럼 위에 정보, 가운데 영상, 아래에 지표와 원클릭 버튼.
// 관리자 미리보기에서 먼저 쓰고, 공개할 때 사용자 화면에서 그대로 import한다.
import { useEffect, useRef, useState } from 'react';
import { GROUP_LABEL } from '../../lib/bodyGroups';
import MotionPlayer from './MotionPlayer';
import { CurationThumb } from './CurationCard';
import AiNote from './AiNote';
import { KEY_TO_PART_LABEL } from '../../lib/diaryEntryLabels';
import { KIND_LABEL, pickCardTone, fmtCount as fmt, mmss, finishRate } from './format';
import { BodyPreview } from './CurationCard';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2', GOLD = '#C9975A';
const PEEK_MS = 5000;   // 표지에서 미리 돌려 주는 시간

// 전체 화면일 때는 가로에 맞추면 세로 영상이 지나치게 커진다.
// 높이에 맞춰 담기게(contain) 되돌린다.
const FULLSCREEN_FIX = `
.bmti-clip:fullscreen, .bmti-clip:-webkit-full-screen {
  object-fit: contain !important; width: 100% !important; height: 100% !important; background: #000;
}`;

const partLabels = (keys) => (keys || []).map((k) => KEY_TO_PART_LABEL[k] || k);

export default function QuickCardView({ card, tone = 'z', motion = null, onStart, onCopy }) {
  const { title, script } = pickCardTone(card, tone);
  // 처음엔 4:5 썸네일을 보여 주고, 시작을 누르면 9:16 동작으로 바뀐다.
  const [started, setStarted] = useState(false);
  // 커서를 올리거나 한 번 누르면 표지 자리에서 5초만 미리 돌려 준다.
  const [peek, setPeek] = useState(false);
  const peekTimer = useRef(null);
  const hasPlay = !!(motion || card.video_url);

  const stopPeek = () => { clearTimeout(peekTimer.current); setPeek(false); };
  const startPeek = () => {
    if (!hasPlay || started) return;
    setPeek(true);
    clearTimeout(peekTimer.current);
    peekTimer.current = setTimeout(() => setPeek(false), PEEK_MS);
  };
  useEffect(() => () => clearTimeout(peekTimer.current), []);
  const rate = finishRate(card);
  const core = partLabels(card.core_parts);
  const related = partLabels(card.related_parts);
  const groups = (card.body_groups || []).map((g) => GROUP_LABEL[g] || g);

  return (
    <article style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK, border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
      <style>{FULLSCREEN_FIX}</style>
      <div style={{ padding: '14px 15px 12px' }}>
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
        {(card.tools || []).length > 0 && (
          <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginTop: 6 }}>도구 · {card.tools.join(', ')}</div>
        )}
        {(core.length > 0 || related.length > 0) && (
          <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginTop: 4 }}>
            {core.length > 0 && <>타겟 <b style={{ color: INK }}>{core.join(', ')}</b></>}
            {related.length > 0 && <> · 연관 {related.join(', ')}</>}
          </div>
        )}
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
        // 표지 — 인스타 게시물 비율(4:5). 커서를 올리거나 누르면 5초 미리보기.
        <div
          onMouseEnter={startPeek} onMouseLeave={stopPeek}
          onClick={startPeek}
          style={{ position: 'relative', width: '100%', cursor: hasPlay ? 'pointer' : 'default' }}>
          {peek ? (
            <div style={{ width: '100%', aspectRatio: '4 / 5', background: '#F3F1EC', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {motion
                ? <MotionPlayer motion={motion} size={520} bg="#F3F1EC" />
                : <video src={card.video_url} autoPlay loop muted playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
          ) : (
            <CurationThumb item={card} radius={0} ratio="4 / 5" showRead={false}
              badge={card.duration_sec > 0 ? { label: '소요시간', value: mmss(card.duration_sec) } : null} />
          )}
          {/* 눌러볼 수 있다는 표시 — 문구가 어느 구석에 있든 겹치지 않게 가운데에 둔다 */}
          {hasPlay && !peek && (
            <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 6, pointerEvents: 'none' }}>
              <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.38)',
                backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', color: '#fff', fontSize: 17,
                display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 3,
                boxShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>▶</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.55)' }}>
                미리보기
              </span>
            </span>
          )}
        </div>
      )}

      <div style={{ padding: '12px 15px 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: SUB, fontWeight: 600, marginBottom: 12 }}>
          <span>조회 {fmt(card.view_count)}</span><span style={{ color: LINE }}>·</span><span>저장 {fmt(card.save_count)}</span>
          {groups.length > 0 && <span style={{ marginLeft: 'auto' }}>{groups.join(' · ')}</span>}
        </div>
        <button onClick={() => { setStarted(true); if (onStart) onStart(); }}
          style={{ width: '100%', padding: 13, borderRadius: 13, border: 'none', background: GOLD, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          {started ? '다시 보기 ↻' : '바로 시작하기 →'}
        </button>
        <button onClick={onCopy}
          style={{ width: '100%', padding: 11, marginTop: 7, borderRadius: 13, border: `1px solid ${LINE}`, background: '#fff', color: SUB, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          내 루틴으로 복사해 편집하기
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
