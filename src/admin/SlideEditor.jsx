// 카드뉴스 슬라이드 만들기 — 사진 하나에 글 여러 장을 얹는다.
//
// 사진별로 묶어 둔다. 평평한 목록이면 같은 사진을 매번 다시 골라야 하고,
// 사진을 바꿀 때 여러 줄을 다 고쳐야 한다.
import { INK, SUB, BG, area, smallBtn } from './theme';
import ImageInput from './ImageInput';
import { MAX_CHARS, MAX_CARDS, cardCount } from '../features/curation/newsSlides';

const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A', RED = '#B23B36';

export default function SlideEditor({ value, onChange }) {
  const groups = Array.isArray(value) ? value : [];
  const total = cardCount(groups);

  const put = (i, patch) => onChange(groups.map((g, k) => (k === i ? { ...g, ...patch } : g)));
  const putText = (i, j, v) => put(i, { texts: (groups[i].texts || []).map((t, k) => (k === j ? v : t)) });
  const addGroup = () => onChange([...groups, { image: '', y: 88, texts: [''] }]);
  const addText = (i) => put(i, { texts: [...(groups[i].texts || []), ''] });
  const dropText = (i, j) => put(i, { texts: (groups[i].texts || []).filter((_, k) => k !== j) });
  const dropGroup = (i) => onChange(groups.filter((_, k) => k !== i));
  const move = (i, d) => {
    const next = [...groups]; const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div style={{ fontSize: 11.5, color: SUB, lineHeight: 1.75, marginBottom: 10 }}>
        사진 하나에 글을 여러 장 얹을 수 있습니다. <b>사진이 같은 장끼리는 사진이 가만히 있고 글만 바뀝니다.</b>
        <br />한 장에 <b>{MAX_CHARS}자</b>, 전체 <b>{MAX_CARDS}장</b>까지. 비워 두면 예전처럼 긴 글로 보여 줍니다.
        <br />슬라이드를 적으면 저장할 때 <b>본문에도 이어 붙여</b> 담습니다. 그래야 검색 유입이 끊기지 않습니다.
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: total > MAX_CARDS ? RED : GOLD_INK,
          background: total > MAX_CARDS ? '#FBEAE9' : YELLOW, borderRadius: 999, padding: '4px 11px' }}>
          모두 {total}장 {total > MAX_CARDS ? `— ${MAX_CARDS}장을 넘었어요` : ''}
        </span>
        <span style={{ fontSize: 11.5, color: SUB }}>사진 {groups.length}개</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groups.map((g, i) => (
          <div key={i} style={{ background: BG, borderRadius: 12, padding: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: INK }}>사진 {i + 1}</span>
              <span style={{ fontSize: 11, color: SUB, fontWeight: 700 }}>
                {(g.texts || []).filter((t) => String(t || '').trim()).length || 1}장
              </span>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                <button onClick={() => move(i, -1)} disabled={i === 0} style={{ ...smallBtn, padding: '3px 7px', opacity: i === 0 ? 0.35 : 1 }}>↑</button>
                <button onClick={() => move(i, 1)} disabled={i === groups.length - 1} style={{ ...smallBtn, padding: '3px 7px', opacity: i === groups.length - 1 ? 0.35 : 1 }}>↓</button>
                <button onClick={() => dropGroup(i)} style={{ ...smallBtn, padding: '3px 7px', color: RED }}>✕</button>
              </span>
            </div>

            <ImageInput value={g.image} onChange={(v) => put(i, { image: v })}
              placeholder="사진을 끌어다 놓거나 주소를 붙여넣으세요" />

            {/* 글 자리 — 사진 주인공을 피해 위아래로 옮긴다 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '9px 0 7px' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: SUB, flexShrink: 0 }}>글 자리</span>
              <input type="range" min={30} max={96} step={1} style={{ flex: 1 }}
                value={Number(g.y) > 0 ? g.y : 88} onChange={(e) => put(i, { y: Number(e.target.value) })} />
              <span style={{ fontSize: 11, fontWeight: 800, color: INK, width: 26, textAlign: 'right' }}>
                {Number(g.y) > 0 ? g.y : 88}
              </span>
            </div>

            {(g.texts || []).map((t, j) => {
              const over = String(t || '').length > MAX_CHARS;
              return (
                <div key={j} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: SUB }}>{j + 1}장</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: over ? RED : SUB, marginLeft: 'auto' }}>
                      {String(t || '').length} / {MAX_CHARS}
                    </span>
                    {(g.texts || []).length > 1 && (
                      <button onClick={() => dropText(i, j)} style={{ ...smallBtn, padding: '2px 6px', color: RED }}>✕</button>
                    )}
                  </div>
                  <textarea value={t} onChange={(e) => putText(i, j, e.target.value)}
                    placeholder="이 사진에 얹을 글 — 두세 문장"
                    style={{ ...area, minHeight: 56, fontSize: 12.5,
                      boxShadow: over ? `inset 0 0 0 1.5px ${RED}` : undefined }} />
                </div>
              );
            })}
            <button onClick={() => addText(i)} style={{ ...smallBtn, marginTop: 2 }}>＋ 이 사진에 글 더하기</button>
          </div>
        ))}
      </div>

      <button onClick={addGroup} style={{ ...smallBtn, marginTop: 10 }}>＋ 사진 더하기</button>
      {groups.length === 0 && (
        <div style={{ fontSize: 11.5, color: SUB, marginTop: 8 }}>
          비워 두면 이 글은 예전처럼 <b>긴 글</b>로 보여 줍니다.
        </div>
      )}
    </div>
  );
}
