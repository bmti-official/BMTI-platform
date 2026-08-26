// 관리자 화면 색·스타일 — 컴포넌트와 한 파일에 두면 Fast Refresh가 동작하지 않아 따로 뺀다.
export const INK = '#17150F', SUB = '#6C665A', LINE = '#E3DED1', ACCENT = '#9C6F26', BG = '#FBFAF8';

export const box = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 18 };
export const input = { width: '100%', padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', border: `1px solid ${LINE}`, borderRadius: 9, outline: 'none', boxSizing: 'border-box' };
export const area = { ...input, minHeight: 120, resize: 'vertical' };
export const label = { display: 'block', fontSize: 12, fontWeight: 800, color: SUB, marginBottom: 6 };
export const btn = (primary) => ({ padding: '9px 16px', fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit', borderRadius: 9, cursor: 'pointer', border: 'none', background: primary ? ACCENT : '#fff', color: primary ? '#fff' : SUB, boxShadow: primary ? 'none' : `inset 0 0 0 1px ${LINE}` });
export const smallBtn = { ...btn(false), padding: '5px 11px', fontSize: 12 };
