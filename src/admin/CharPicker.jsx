// 유형별 누끼 캐릭터 고르기 — Z 칸에는 Z로 끝나는 유형만, M 칸에는 M으로 끝나는 유형만 나온다.
// 큐레이션과 바로카드가 같은 칸을 쓴다.
import { CHARACTERS, CHARACTER_NAMES } from '../data';
import { INK, SUB, LINE, ACCENT } from './theme';

export default function CharPicker({ suffix, value = [], onChange, max = 4 }) {
  const list = CHARACTERS.filter((c) => c.id.endsWith(suffix));
  const toggle = (id) => {
    if (value.includes(id)) return onChange(value.filter((x) => x !== id));
    if (value.length >= max) return;
    onChange([...value, id]);
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
      {list.map((c) => {
        const on = value.includes(c.id);
        const full = !on && value.length >= max;
        return (
          <button key={c.id} type="button" onClick={() => toggle(c.id)} disabled={full}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 2px', borderRadius: 12,
              border: 'none', cursor: full ? 'default' : 'pointer', fontFamily: 'inherit',
              background: on ? '#fff' : 'transparent', boxShadow: on ? `inset 0 0 0 2px ${ACCENT}` : `inset 0 0 0 1px ${LINE}`,
              opacity: full ? 0.35 : 1 }}>
            <img src={c.image} alt="" style={{ width: 34, height: 34, objectFit: 'contain' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: on ? INK : SUB }}>{c.id}</span>
            <span style={{ fontSize: 9, color: SUB, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{CHARACTER_NAMES[c.id]}</span>
          </button>
        );
      })}
    </div>
  );
}
