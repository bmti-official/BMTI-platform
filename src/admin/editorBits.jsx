// 큐레이션·바로카드 편집 화면이 함께 쓰는 화면 부품.
// 형광펜 · 글자 수 · 이렇게 보여요 · 임시저장 표시.
import { useRef, useState } from 'react';
import { SUB, LINE, area } from './theme';
import { BodyPreview } from '../features/curation/CurationCard';

export function DraftMark({ at }) {
  if (!at) return null;
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, color: SUB, marginLeft: 4 }}>
      임시저장됨 {new Date(at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

// ── 글자 수 ──────────────────────────────────────────────────
// Z·M 두 벌은 길이가 비슷해야 한다. 한 문단이 너무 길어도 알려 준다.
export function CharCount({ a, b, maxPara = 200 }) {
  const la = String(a || '').length, lb = String(b || '').length;
  if (la === 0 && lb === 0) return null;
  const off = lb > 0 && la > 0 && Math.abs(la - lb) / Math.max(la, lb) > 0.3;
  const longPara = String(a || '').split(/\n{2,}/).filter((p) => p.trim().length > maxPara).length;
  const msg = [
    off ? '반대쪽과 길이 차이가 큽니다' : null,
    longPara ? `${longPara}개 문단이 ${maxPara}자를 넘어요 — 두세 문장으로 끊어 주세요` : null,
  ].filter(Boolean).join(' · ');
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: msg ? '#B23B36' : SUB, marginTop: 4, textAlign: 'right', lineHeight: 1.5 }}>
      {la}자{msg ? ` · ${msg}` : ''}
    </div>
  );
}

// ── 이렇게 보여요 ────────────────────────────────────────────
export function LiveBody({ text }) {
  const [open, setOpen] = useState(true);
  if (!String(text || '').trim()) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        style={{ padding: 0, border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 11, fontWeight: 800, color: SUB, cursor: 'pointer' }}>
        {open ? '▾' : '▸'} 이렇게 보여요
      </button>
      {open && (
        <div style={{ marginTop: 6, padding: '10px 12px', background: '#fff', borderRadius: 9, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
          <BodyPreview text={text} />
        </div>
      )}
    </div>
  );
}

// ── 형광펜 버튼이 달린 글 상자 ───────────────────────────────
// 칠하고 싶은 대목을 드래그해 고르고 버튼을 누르면 ==이렇게== 감싸진다.
// 이미 칠해진 곳을 고르고 누르면 지워진다.
export function HiliteBox({ value, onChange, placeholder, minHeight = 96, children }) {
  const ref = useRef(null);
  const v = String(value || '');

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    let a = el.selectionStart, b = el.selectionEnd;
    if (a === b) { el.focus(); return; }
    if (v.slice(a - 2, a) === '==' && v.slice(b, b + 2) === '==') { a -= 2; b += 2; }
    const sel = v.slice(a, b);
    const on = sel.startsWith('==') && sel.endsWith('==') && sel.length > 4;
    const inner = on ? sel.slice(2, -2) : sel;
    const next = v.slice(0, a) + (on ? inner : `==${inner}==`) + v.slice(b);
    onChange(next);
    const end = a + (on ? inner.length : inner.length + 4);
    setTimeout(() => { el.focus(); el.setSelectionRange(a, end); }, 0);
  };

  const marks = (v.match(/==[^=]+==/g) || []).length;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <button type="button" onClick={toggle}
          style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 800, fontFamily: 'inherit', borderRadius: 7, cursor: 'pointer',
            border: 'none', background: '#FBF3C4', color: '#6B5B1F', boxShadow: 'inset 0 0 0 1px #EBDF9B' }}>
          형광펜
        </button>
        <span style={{ fontSize: 11, color: SUB, fontWeight: 600 }}>
          {marks > 0 ? `${marks}군데 칠했어요` : '칠할 곳을 드래그해서 고른 뒤 누르세요'}
        </span>
      </div>
      <textarea ref={ref} style={{ ...area, minHeight }} placeholder={placeholder}
        value={v} onChange={(e) => onChange(e.target.value)} />
      {children}
    </div>
  );
}
