// 관리자 화면 공용 부품 — 큐레이션·바로카드 등록 화면이 함께 쓴다.
import { SUB, LINE, ACCENT, input } from './theme';

// 여러 개 고르는 알약 버튼 묶음. max를 주면 그만큼만 고를 수 있다.
export function PillPicker({ options, value, onChange, max }) {
  const toggle = (v) => {
    if (value.includes(v)) return onChange(value.filter((x) => x !== v));
    if (max && value.length >= max) return;
    onChange([...value, v]);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => {
        const on = value.includes(o.key);
        const full = !on && max && value.length >= max;
        return (
          <button key={o.key} type="button" onClick={() => toggle(o.key)} disabled={full}
            style={{ padding: '6px 12px', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', borderRadius: 999, cursor: full ? 'default' : 'pointer',
              border: 'none', background: on ? ACCENT : '#fff', color: on ? '#fff' : SUB,
              boxShadow: on ? 'none' : `inset 0 0 0 1px ${LINE}`, opacity: full ? 0.4 : 1 }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// 하나만 고르는 버튼 묶음
export function OnePicker({ options, value, onChange }) {
  return <PillPicker options={options} value={[value]} onChange={(v) => onChange(v[v.length - 1] || options[0]?.key)} />;
}

// 쉼표로 여러 값을 적는 칸 (도구 목록 등)
export function TagsInput({ value, onChange, placeholder }) {
  return (
    <input style={input} value={(value || []).join(', ')} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
  );
}

// 공개/비공개 뱃지 버튼
export function PublishBadge({ published, onClick }) {
  return (
    <button onClick={onClick}
      style={{ padding: '3px 9px', fontSize: 11, fontWeight: 800, fontFamily: 'inherit', borderRadius: 999, border: 'none', cursor: 'pointer',
        background: published ? '#E8F3EC' : '#F3F1EC', color: published ? '#2F7A4F' : SUB }}>
      {published ? '공개' : '비공개'}
    </button>
  );
}
