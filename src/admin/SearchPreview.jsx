import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { INK, SUB, LINE, BG, box, label } from './theme';
import { OnePicker } from './ui';
import SearchFilter from '../features/curation/SearchFilter';
import CurationCard from '../features/curation/CurationCard';
import QuickCardView from '../features/curation/QuickCardView';
import { buildRotation, pickByRotation } from '../features/curation/rotation';
import { GROUP_LABEL, defaultTargetMode, defaultToolMode } from '../lib/bodyGroups';
import { CHARACTER_NAMES } from '../lib/bmtiTypes';

// 검색 분류 미리보기 — 손님이 볼 필터 화면과, 그 설정이 만들어내는 노출 순서를 함께 확인한다.
// BMTI 유형을 바꿔가며 기본값(C=핵심 / L=연관, O=이완 / A=활력)이 어떻게 잡히는지도 볼 수 있다.
const BMTI_OPTIONS = Object.keys(CHARACTER_NAMES);

export default function SearchPreview() {
  const [code, setCode] = useState('OLQM');
  const [gender, setGender] = useState('female');
  const [kind, setKind] = useState('curation');
  const [rows, setRows] = useState({ curation: [], cards: [] });
  const [err, setErr] = useState('');
  const [tick] = useState(0);

  const [filter, setFilter] = useState({
    groups: ['all'], parts: [],
    target: defaultTargetMode('OLQM'), tool: defaultToolMode('OLQM'),
  });

  // 유형을 바꾸면 기본값도 그 유형 기준으로 다시 잡는다.
  const applyCode = (c) => {
    setCode(c);
    setFilter((f) => ({ ...f, target: defaultTargetMode(c), tool: defaultToolMode(c) }));
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const a = await supabase.from('curation_items').select('*').order('sort_order', { ascending: true });
      const b = await supabase.from('quick_cards').select('*').order('sort_order', { ascending: true });
      if (!alive) return;
      const e = a.error || b.error;
      if (e) { setErr(e.message); return; }
      setErr('');
      setRows({ curation: a.data || [], cards: b.data || [] });
    })();
    return () => { alive = false; };
  }, [tick]);

  const items = kind === 'curation' ? rows.curation : rows.cards;
  const tone = code.endsWith('M') ? 'm' : 'z';

  // 인기순 = 조회수 많은 순의 부위 묶음
  const popular = useMemo(() => {
    const c = {};
    items.forEach((it) => (it.body_groups || []).forEach((g) => { c[g] = (c[g] || 0) + (Number(it.view_count) || 0) + 1; }));
    return Object.keys(c).sort((x, y) => c[y] - c[x]);
  }, [items]);

  const groups = (filter.groups || []).filter((g) => g !== 'all');
  const isAll = !groups.length;
  const rotation = buildRotation({
    coreGroups: groups.slice(0, 3),
    relatedGroups: popular.filter((g) => !groups.includes(g)).slice(0, 6),
    popularGroups: popular,
    mode: filter.target, isAll, length: 14, seed: code.length,
  });
  const picked = pickByRotation(items, rotation);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: INK }}>검색 분류 미리보기</div>
        <div style={{ fontSize: 12.5, color: SUB }}>손님 화면에는 아직 붙이지 않았습니다</div>
      </div>

      {err && <div style={{ ...box, marginBottom: 14, color: '#B23B36', fontSize: 13, fontWeight: 700 }}>불러오지 못했습니다: {err}</div>}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <span style={label}>BMTI 유형으로 보기</span>
          <select value={code} onChange={(e) => applyCode(e.target.value)}
            style={{ padding: '9px 12px', fontSize: 13.5, fontFamily: 'inherit', border: `1px solid ${LINE}`, borderRadius: 9, cursor: 'pointer' }}>
            {BMTI_OPTIONS.map((c) => <option key={c} value={c}>{c} · {CHARACTER_NAMES[c]}</option>)}
          </select>
        </div>
        <div>
          <span style={label}>캐릭터 성별</span>
          <OnePicker options={[{ key: 'female', label: '여성' }, { key: 'male', label: '남성' }]} value={gender} onChange={setGender} />
        </div>
        <div>
          <span style={label}>대상</span>
          <OnePicker options={[{ key: 'curation', label: '큐레이션' }, { key: 'cards', label: '바로카드' }]} value={kind} onChange={setKind} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '390px 1fr', gap: 18, alignItems: 'start' }}>
        {/* 손님이 볼 필터 화면 */}
        <div style={{ ...box, background: '#fff' }}>
          <SearchFilter gender={gender} value={filter} onChange={setFilter} />
        </div>

        {/* 그 설정이 만들어내는 노출 순서 */}
        <div>
          <div style={{ ...box, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 8 }}>노출 순서</div>
            <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginBottom: 10, lineHeight: 1.6 }}>
              {isAll
                ? '부위가 «전체»라 규칙 없이 섞어서 보여줍니다.'
                : filter.target === 'core'
                  ? '핵심 부위를 부위당 3번씩, 사이에 연관 1번. 한 바퀴 돌면 다른 부위 2번.'
                  : '핵심 1번·연관 1번을 번갈아. 10번마다 다른 부위 2번.'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {rotation.map((g, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 700, color: '#8A6A3A', background: '#F3EAD8', borderRadius: 999, padding: '3px 9px' }}>
                  {i + 1}. {GROUP_LABEL[g] || g}
                </span>
              ))}
              {rotation.length === 0 && <span style={{ fontSize: 12.5, color: SUB }}>등록된 콘텐츠가 없어 순서를 만들 수 없습니다.</span>}
            </div>
          </div>

          <div style={{ ...box, background: BG }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 10 }}>
              이 순서로 채운 결과 <span style={{ fontWeight: 600, color: SUB }}>· {tone === 'm' ? 'M 유형 말투' : 'Z 유형 말투'}</span>
            </div>
            {picked.length === 0 && <div style={{ fontSize: 12.5, color: SUB }}>보여줄 콘텐츠가 없습니다. 먼저 큐레이션·바로카드를 등록해 주세요.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 390 }}>
              {picked.slice(0, 5).map(({ item, group }, i) => (
                <div key={`${item.id}-${i}`}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: SUB, marginBottom: 5 }}>{i + 1}번째 · {GROUP_LABEL[group] || group}</div>
                  {kind === 'curation'
                    ? <CurationCard item={item} tone={tone} />
                    : <QuickCardView card={item} tone={tone} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
