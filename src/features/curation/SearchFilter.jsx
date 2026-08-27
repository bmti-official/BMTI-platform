import { useState } from 'react';
import BodySelector3D from '../../components/BodySelector3D';
import { BODY_GROUPS, GROUP_LABEL, TARGET_MODES, TOOL_MODES, groupsOfPart } from '../../lib/bodyGroups';
import { PART_KEY } from '../../lib/diaryEntryLabels';

// 큐레이션·바로카드가 함께 쓰는 검색 분류 —
// ① 불편 부위(캐릭터를 눌러 최대 3곳)  ② 타겟 세분화(핵심/연관)  ③ 도구·성향
//
// 아직 손님 화면에 붙이지 않았다. 관리자 미리보기에서만 불러 모양과 규칙을 확인한다.
const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2', GOLD = '#C9975A';
const MAX_GROUPS = 3;

const pill = (on, disabled) => ({
  padding: '8px 14px', fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit', borderRadius: 999,
  cursor: disabled ? 'default' : 'pointer', border: 'none',
  background: on ? GOLD : '#fff', color: on ? '#fff' : SUB,
  boxShadow: on ? 'none' : `inset 0 0 0 1px ${LINE}`, opacity: disabled ? 0.4 : 1,
});
const secTitle = { fontSize: 12.5, fontWeight: 800, color: INK, marginBottom: 8 };

export default function SearchFilter({
  gender, value, onChange,
  showBody = true,   // 바로카드는 설정 팝업 안에서만 열기 때문에 접을 수 있게 한다
}) {
  const v = value || {};
  const groups = v.groups || ['all'];
  const isAll = groups.includes('all');
  const set = (patch) => onChange({ ...v, ...patch });

  // 캐릭터에서 고른 부위(한글) → 콘텐츠 분류 묶음으로 바꾼다.
  const [parts, setParts] = useState(v.parts || []);
  const onParts = (next) => {
    setParts(next);
    const gs = [...new Set(next.flatMap((s) => groupsOfPart(PART_KEY[s.part] || s.part)))].slice(0, MAX_GROUPS);
    set({ parts: next, groups: gs.length ? gs : ['all'] });
  };

  const toggleGroup = (id) => {
    if (id === 'all') return set({ groups: ['all'], parts: [] });
    const cur = groups.filter((g) => g !== 'all');
    if (cur.includes(id)) {
      const next = cur.filter((g) => g !== id);
      return set({ groups: next.length ? next : ['all'] });
    }
    if (cur.length >= MAX_GROUPS) return;
    set({ groups: [...cur, id] });
  };

  return (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      {showBody && (
        <section style={{ marginBottom: 18 }}>
          <div style={secTitle}>어디가 불편하세요? <span style={{ color: SUB, fontWeight: 600 }}>최대 3곳</span></div>
          <BodySelector3D gender={gender} value={parts} onChange={onParts} />
        </section>
      )}

      <section style={{ marginBottom: 18 }}>
        <div style={secTitle}>부위 묶음</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {BODY_GROUPS.map((g) => {
            const on = groups.includes(g.id);
            const full = !on && g.id !== 'all' && groups.filter((x) => x !== 'all').length >= MAX_GROUPS;
            return (
              <button key={g.id} onClick={() => !full && toggleGroup(g.id)} disabled={full} style={pill(on, full)}>
                {g.label}
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ marginBottom: 18 }}>
        <div style={secTitle}>
          무엇 위주로 볼까요?
          {isAll && <span style={{ color: SUB, fontWeight: 600 }}> · 부위를 고르면 선택할 수 있어요</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {TARGET_MODES.map((m) => (
            <button key={m.id} onClick={() => !isAll && set({ target: m.id })} disabled={isAll}
              style={{ ...pill(!isAll && v.target === m.id, isAll), flex: 1 }}>
              {m.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div style={secTitle}>도구·성향</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TOOL_MODES.map((m) => (
            <button key={m.id} onClick={() => set({ tool: m.id })} style={pill(v.tool === m.id, false)}>
              {m.label}
            </button>
          ))}
        </div>
      </section>

      <p style={{ fontSize: 11.5, color: SUB, fontWeight: 600, margin: '16px 0 0', lineHeight: 1.6, wordBreak: 'keep-all' }}>
        고른 부위 · {groups.map((g) => GROUP_LABEL[g] || g).join(', ')}
        {!isAll && ` · ${TARGET_MODES.find((m) => m.id === v.target)?.label || ''}`}
        {` · ${TOOL_MODES.find((m) => m.id === v.tool)?.label || ''}`}
      </p>
    </div>
  );
}
