// 목록 화면이 함께 쓰는 것들 — 검색창, 차례 바꾸기, 복제.
import { SUB, LINE, ACCENT, input } from './theme';

export function SearchBox({ q, onChange, count, total, placeholder = '이름·제목으로 찾기' }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <input style={{ ...input, width: 200, padding: '8px 12px', fontSize: 12.5 }} value={q}
        placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {q.trim() && (
        <>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: count ? SUB : '#B23B36' }}>
            {count ? `${count}개 찾음` : '없어요'}
          </span>
          <button type="button" onClick={() => onChange('')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: SUB, padding: '0 2px' }}>×</button>
        </>
      )}
      {!q.trim() && total > 0 && <span style={{ fontSize: 11.5, color: SUB }}>{total}개</span>}
    </span>
  );
}

const arrow = (on) => ({
  width: 22, height: 22, borderRadius: 6, border: 'none', padding: 0,
  cursor: on ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 12, fontWeight: 800,
  background: on ? '#fff' : 'transparent', color: on ? ACCENT : '#D8D4CC',
  boxShadow: on ? `inset 0 0 0 1px ${LINE}` : 'none',
});

/** 위아래 화살표 — 이웃한 줄과 정렬 순서를 맞바꾼다. */
export function MoveButtons({ up, down, onMove }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
      <button type="button" title="위로" disabled={!up} onClick={() => onMove(-1)} style={arrow(up)}>▲</button>
      <button type="button" title="아래로" disabled={!down} onClick={() => onMove(1)} style={arrow(down)}>▼</button>
    </span>
  );
}
