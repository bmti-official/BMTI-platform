import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BODY_GROUPS, TOOL_MODES } from '../lib/bodyGroups';
import { PART_KEY } from '../lib/diaryEntryLabels';
import { INK, SUB, LINE, BG, ACCENT, box, input, area, label, btn, smallBtn } from './theme';
import { PillPicker, OnePicker, PublishBadge } from './ui';
import PreviewModal from './PreviewModal';
import { useUnsavedGuard, confirmLeave } from './dirty';
import ImageInput, { ImageListInput } from './ImageInput';
import { parseArticle } from './pasteParse';
import CurationCard, { CurationDetail } from '../features/curation/CurationCard';
import QuickCardView from '../features/curation/QuickCardView';
import { FONTS, fontStack } from '../features/curation/fonts';
import { CHARACTERS } from '../data';
import { CHARACTER_NAMES } from '../lib/bmtiTypes';

// 부위 선택지 — 다이어리에서 쓰는 부위 코드를 그대로 쓴다.
const PART_OPTIONS = Object.entries(PART_KEY).map(([ko, key]) => ({ key, label: ko }));

// 큐레이션 등록·수정 화면 — 관리자 페이지에서만 쓴다.
// 이 파일은 사용자 앱(main.jsx)이 import하지 않으므로 사용자 번들에 들어가지 않는다.
const EMPTY = {
  published: false, sort_order: 0,
  title_z: '', title_m: '', cover_url: '',
  thumb_text: '', read_min: 0, font_key: 'pretendard', font_body_key: 'pretendard',
  chars_z: [], chars_m: [],
  lead_z: '', lead_m: '',
  ...Object.fromEntries([1, 2, 3, 4].flatMap((n) => [
    [`s${n}_imgs`, []], [`s${n}_caps`, []],
    [`s${n}_h_z`, ''], [`s${n}_h_m`, ''],
    [`s${n}_z`, ''], [`s${n}_m`, ''],
    [`s${n}_key_z`, ''], [`s${n}_key_m`, ''],
  ])),
  stats: [],
  card_ids: [],
  body_groups: [], core_parts: [], related_parts: [], tool_mode: 'all',
};

// 본문 네 마디 — 기획한 순서 그대로.
const PARTS_OF_ARTICLE = [
  { n: 1, label: '문제제기 · 편견의 원인' },
  { n: 2, label: '과학적 분석' },
  { n: 3, label: '분석의 의미' },
  { n: 4, label: '유명인의 사례 · 결론' },
];

// 예전에 한 개만 고르던 char_z/char_m 값을 배열 칸으로 옮겨 읽는다.
function normalize(row) {
  const f = { ...EMPTY, ...(row || {}) };
  f.chars_z = Array.isArray(f.chars_z) && f.chars_z.length ? f.chars_z : (f.char_z ? [f.char_z] : []);
  f.chars_m = Array.isArray(f.chars_m) && f.chars_m.length ? f.chars_m : (f.char_m ? [f.char_m] : []);
  [1, 2, 3, 4].forEach((n) => {
    const k = `s${n}_imgs`;
    if (!Array.isArray(f[k]) || f[k].length === 0) f[k] = f[`s${n}_img`] ? [f[`s${n}_img`]] : [];
    if (!Array.isArray(f[`s${n}_caps`])) f[`s${n}_caps`] = [];
  });
  if (!Array.isArray(f.stats)) f.stats = [];
  ['card_ids', 'body_groups', 'core_parts', 'related_parts'].forEach((k) => { if (!Array.isArray(f[k])) f[k] = []; });
  return f;
}

// 유형별 누끼 캐릭터 고르기 — Z 칸에는 Z로 끝나는 유형만, M 칸에는 M으로 끝나는 유형만 나온다.
function CharPicker({ suffix, value, onChange, max = 4 }) {
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

// Z·M 두 벌은 길이가 비슷해야 한다. 한쪽이 많이 짧으면 눈에 띄게 알려 준다.
function CharCount({ a, b }) {
  const la = String(a || '').length, lb = String(b || '').length;
  if (la === 0 && lb === 0) return null;
  const off = lb > 0 && la > 0 && Math.abs(la - lb) / Math.max(la, lb) > 0.3;
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: off ? '#B23B36' : SUB, marginTop: 4, textAlign: 'right' }}>
      {la}자{off ? ' · 반대쪽과 길이 차이가 큽니다' : ''}
    </div>
  );
}

// 자동 임시저장 — 브라우저에만 담아 두고, 저장하면 지운다.
const draftKey = (row) => `bmti_admin_draft_curation_${row?.id || 'new'}`;

function Editor({ row, allCards, onSaved, onCancel, onPreview, onDelete }) {
  const [f, setF] = useState(() => {
    const base = normalize(row);
    try {
      const raw = localStorage.getItem(draftKey(row));
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.at && d?.form && window.confirm(`저장하지 않고 나간 내용이 있어요 (${new Date(d.at).toLocaleString('ko-KR')}).\n이어서 쓸까요?\n\n취소를 누르면 그 내용은 버립니다.`)) {
          return { ...base, ...d.form };
        }
        localStorage.removeItem(draftKey(row));
      }
    } catch { /* 브라우저가 막아 두었으면 그냥 넘어간다 */ }
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [draftAt, setDraftAt] = useState(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteNote, setPasteNote] = useState('');
  const first = useRef(true);

  // 통째로 붙여넣은 원고를 칸마다 나눠 담는다.
  const applyPaste = () => {
    const { fields, report, count } = parseArticle(pasteText);
    if (!count) {
      setPasteNote('형식을 알아보지 못했습니다. [제목 · Z] 처럼 대괄호 머리말이 들어 있는지 확인해 주세요.');
      return;
    }
    setF((prev) => ({ ...prev, ...fields }));
    setPasteNote(`${report.join(' · ')} — 채웠습니다. 아래에서 확인하고 저장해 주세요.`);
    setPasteOpen(false);
    setPasteText('');
  };
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  useUnsavedGuard(f);

  // 고칠 때마다 1.5초 뒤에 브라우저에 조용히 담아 둔다.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => {
      try {
        const at = Date.now();
        localStorage.setItem(draftKey(row), JSON.stringify({ at, form: f }));
        setDraftAt(at);
      } catch { /* 담아 둘 수 없으면 그냥 넘어간다 */ }
    }, 1500);
    return () => clearTimeout(t);
  }, [f, row]);

  // 숫자 카드 세 장 — 빈 자리를 채워 가며 고친다.
  const setStat = (i, key, v) => setF((p) => {
    const next = [0, 1, 2].map((k) => ({ num: '', text: '', ...(p.stats?.[k] || {}) }));
    next[i] = { ...next[i], [key]: v };
    return { ...p, stats: next };
  });

  const save = async () => {
    if (!f.title_z.trim() || !f.title_m.trim()) { setErr('Z·M 제목을 모두 입력해 주세요.'); return; }
    setSaving(true); setErr('');
    const payload = { ...f, updated_at: new Date().toISOString() };
    ['view_count', 'save_count', 'created_at'].forEach((k) => delete payload[k]);
    const q = f.id
      ? supabase.from('curation_items').update(payload).eq('id', f.id)
      : supabase.from('curation_items').insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) { setErr('저장 실패: ' + error.message); return; }
    try { localStorage.removeItem(draftKey(row)); } catch { /* 무시 */ }
    onSaved();
  };

  return (
    <div style={{ ...box, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: INK }}>
          {f.id ? `큐레이션 #${f.id} 수정` : '새 큐레이션'}
        </div>
        <button onClick={() => { setPasteNote(''); setPasteOpen(true); }} style={{ ...btn(false), marginLeft: 'auto' }}>
          📋 원고 붙여넣기
        </button>
      </div>

      {pasteNote && (
        <div style={{ fontSize: 12.5, fontWeight: 700, color: pasteNote.startsWith('형식') ? '#B23B36' : '#2E7D50',
          background: pasteNote.startsWith('형식') ? '#FDECEA' : '#EDF7F0', borderRadius: 9, padding: '10px 12px', marginBottom: 14, lineHeight: 1.5 }}>
          {pasteNote}
        </div>
      )}

      {pasteOpen && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setPasteOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,14,0.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 18, width: '100%', maxWidth: 760, maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>원고 붙여넣기</div>
            <div style={{ fontSize: 12, color: SUB, marginBottom: 10, lineHeight: 1.6 }}>
              AI에게 받은 글을 통째로 붙여넣고 &lsquo;칸 채우기&rsquo;를 누르세요. 제목·초록·소제목·본문·핵심 한 줄·숫자 카드·사진 설명·검색 분류가 각 칸으로 들어갑니다.
              <br />채팅창에서 함께 딸려오는 <b>MD</b>, <b>+ 1</b> 같은 줄은 알아서 버립니다. 사진은 따로 올려 주세요.
            </div>
            <textarea autoFocus value={pasteText} onChange={(e) => setPasteText(e.target.value)}
              placeholder={'[제목 · Z] …\n[제목 · M] …\n[썸네일 문구] …\n[초록 · Z] …'}
              style={{ ...area, flex: 1, minHeight: 320, fontSize: 12.5, lineHeight: 1.6 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={applyPaste} disabled={!pasteText.trim()} style={{ ...btn(true), opacity: pasteText.trim() ? 1 : 0.45 }}>칸 채우기</button>
              <button onClick={() => setPasteOpen(false)} style={btn(false)}>닫기</button>
              <span style={{ fontSize: 11.5, color: SUB, alignSelf: 'center', marginLeft: 'auto' }}>이미 적은 칸은 새 내용으로 바뀝니다</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <span style={label}>제목 · Z 유형 <span style={{ color: '#B23B36' }}>담백하게</span></span>
          <input style={input} value={f.title_z} onChange={(e) => set('title_z')(e.target.value)}
            placeholder="목이 굳었을 때 3분 이완법" />
        </div>
        <div>
          <span style={label}>제목 · M 유형 <span style={{ color: '#B23B36' }}>다정하게</span></span>
          <input style={input} value={f.title_m} onChange={(e) => set('title_m')(e.target.value)}
            placeholder="목이 뻐근한 날, 3분만 같이 풀어봐요" />
        </div>
      </div>

      {/* 썸네일 — 문구는 Z/M을 나누지 않고 하나만 쓴다 */}
      <div style={{ ...box, background: BG, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 10 }}>썸네일</div>
        <div style={{ marginBottom: 12 }}>
          <span style={label}>이미지 <span style={{ fontWeight: 600 }}>— 가로로 꽉 차게 들어갑니다(16:9 권장)</span></span>
          <ImageInput value={f.cover_url} onChange={set('cover_url')}
            hint="사진을 이 칸에 끌어다 놓거나 '사진 올리기'를 누르세요. 주소를 직접 붙여넣어도 됩니다." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 170px 170px', gap: 12 }}>
          <div>
            <span style={label}>썸네일 문구 <span style={{ fontWeight: 600 }}>— Z·M 공통</span></span>
            <input style={input} value={f.thumb_text || ''} onChange={(e) => set('thumb_text')(e.target.value)} placeholder="목이 굳는 진짜 이유" />
          </div>
          <div>
            <span style={label}>가독시간(분) <span style={{ fontWeight: 600 }}>— 0이면 자동</span></span>
            <input style={input} type="number" value={f.read_min || 0} onChange={(e) => set('read_min')(Number(e.target.value) || 0)} />
          </div>
          <div>
            <span style={label}>글씨체 <span style={{ fontWeight: 600 }}>— 제목·썸네일</span></span>
            <select value={f.font_key || 'pretendard'} onChange={(e) => set('font_key')(e.target.value)}
              style={{ ...input, cursor: 'pointer', fontFamily: fontStack(f.font_key) }}>
              {FONTS.map((ft) => <option key={ft.key} value={ft.key}>{ft.label}</option>)}
            </select>
          </div>
          <div>
            <span style={label}>글씨체 <span style={{ fontWeight: 600 }}>— 본문·초록</span></span>
            <select value={f.font_body_key || f.font_key || 'pretendard'} onChange={(e) => set('font_body_key')(e.target.value)}
              style={{ ...input, cursor: 'pointer', fontFamily: fontStack(f.font_body_key || f.font_key) }}>
              {FONTS.map((ft) => <option key={ft.key} value={ft.key}>{ft.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 목록에서 썸네일 밑에 세울 누끼 캐릭터 — Z/M 각각 최대 4개 */}
      <div style={{ ...box, background: BG, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>누끼 캐릭터</div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 10 }}>목록에서 썸네일 아래, 제목 왼쪽에 놓입니다 · 유형마다 최대 4개</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[['chars_z', 'Z 유형', 'Z'], ['chars_m', 'M 유형', 'M']].map(([key, lb, suffix]) => (
            <div key={key}>
              <span style={label}>{lb} <span style={{ color: SUB, fontWeight: 700 }}>({f[key].length}/4)</span></span>
              <CharPicker suffix={suffix} value={f[key]} onChange={set(key)} />
            </div>
          ))}
        </div>
      </div>

      {/* 본문 — 초록 + 네 마디 */}
      <div style={{ ...box, background: BG, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>본문</div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 12 }}>초록은 글 첫머리에 크게 놓입니다 — 전체를 관통하는 한두 문장으로</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <span style={label}>초록 · Z 유형</span>
            <textarea style={{ ...area, minHeight: 72 }} value={f.lead_z || ''} onChange={(e) => set('lead_z')(e.target.value)} />
          </div>
          <div>
            <span style={label}>초록 · M 유형</span>
            <textarea style={{ ...area, minHeight: 72 }} value={f.lead_m || ''} onChange={(e) => set('lead_m')(e.target.value)} />
          </div>
        </div>
        {PARTS_OF_ARTICLE.map((sec) => {
          const n = sec.n;
          return (
            <div key={n} style={{ borderTop: `1px solid ${LINE}`, paddingTop: 12, marginTop: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: INK, marginBottom: 8 }}>{n}. {sec.label}</div>

              {/* ① 소제목 — 글에서 큰 글씨로 나온다 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                <input style={input} placeholder="소제목 · Z (선택)" value={f[`s${n}_h_z`] || ''} onChange={(e) => set(`s${n}_h_z`)(e.target.value)} />
                <input style={input} placeholder="소제목 · M (선택)" value={f[`s${n}_h_m`] || ''} onChange={(e) => set(`s${n}_h_m`)(e.target.value)} />
              </div>

              {/* ② 사진 + 사진 설명 */}
              <div style={{ marginBottom: 10 }}>
                <ImageListInput value={f[`s${n}_imgs`]} onChange={set(`s${n}_imgs`)}
                  captions={f[`s${n}_caps`]} onCaptions={set(`s${n}_caps`)}
                  hint="사진 여러 장을 한 번에 올릴 수 있어요. 사진 밑 칸에 설명을 적으면 사진 아래 작은 글씨로 나옵니다." />
              </div>

              {/* ③ 본문 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <textarea style={{ ...area, minHeight: 96 }} placeholder="Z 유형 본문"
                    value={f[`s${n}_z`] || ''} onChange={(e) => set(`s${n}_z`)(e.target.value)} />
                  <CharCount a={f[`s${n}_z`]} b={f[`s${n}_m`]} />
                </div>
                <div>
                  <textarea style={{ ...area, minHeight: 96 }} placeholder="M 유형 본문"
                    value={f[`s${n}_m`] || ''} onChange={(e) => set(`s${n}_m`)(e.target.value)} />
                  <CharCount a={f[`s${n}_m`]} b={f[`s${n}_z`]} />
                </div>
              </div>

              {/* ④ 핵심 한 줄 — 왼쪽 세로줄이 붙은 큰 글씨 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                <input style={input} placeholder="핵심 한 줄 · Z (선택)" value={f[`s${n}_key_z`] || ''} onChange={(e) => set(`s${n}_key_z`)(e.target.value)} />
                <input style={input} placeholder="핵심 한 줄 · M (선택)" value={f[`s${n}_key_m`] || ''} onChange={(e) => set(`s${n}_key_m`)(e.target.value)} />
              </div>

              {/* 2번 마디에만 — 숫자 카드 세 장 */}
              {n === 2 && (
                <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 10, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: INK, marginBottom: 3 }}>숫자 카드 <span style={{ fontWeight: 600, color: SUB }}>— 이 마디 글 아래에 가로로 세 장</span></div>
                  <div style={{ fontSize: 11.5, color: SUB, marginBottom: 9 }}>Z·M 공통입니다. 비워 두면 나오지 않습니다.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <input style={{ ...input, fontWeight: 900 }} placeholder={['12kg', '15도', '8시간'][i]}
                          value={f.stats?.[i]?.num || ''} onChange={(e) => setStat(i, 'num', e.target.value)} />
                        <input style={input} placeholder="한 줄 설명"
                          value={f.stats?.[i]?.text || ''} onChange={(e) => setStat(i, 'text', e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 추천 바로카드 3~4장 */}
      <div style={{ ...box, background: BG, marginBottom: 14 }}>
        <span style={label}>추천 바로카드 <span style={{ fontWeight: 600 }}>— 글 끝에 붙습니다. 3~4장 권장</span></span>
        {allCards.length === 0
          ? <div style={{ fontSize: 12.5, color: SUB }}>등록된 바로카드가 없습니다. ⚡ 바로카드에서 먼저 만들어 주세요.</div>
          : (
            <PillPicker
              options={allCards.map((c) => ({ key: String(c.id), label: c.title_z }))}
              value={(f.card_ids || []).map(String)}
              onChange={(v) => set('card_ids')(v.map(Number))}
              max={4}
            />
          )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <span style={label}>부위 묶음 <span style={{ fontWeight: 600 }}>— 검색 분류에 쓰입니다</span></span>
        <PillPicker options={BODY_GROUPS.map((g) => ({ key: g.id, label: g.label }))} value={f.body_groups} onChange={set('body_groups')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <span style={label}>핵심 부위 <span style={{ fontWeight: 600 }}>— 최대 3개</span></span>
          <PillPicker options={PART_OPTIONS} value={f.core_parts} onChange={set('core_parts')} max={3} />
        </div>
        <div>
          <span style={label}>연관 부위 <span style={{ fontWeight: 600 }}>— 최대 6개</span></span>
          <PillPicker options={PART_OPTIONS} value={f.related_parts} onChange={set('related_parts')} max={6} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <span style={label}>도구·성향</span>
          <OnePicker options={TOOL_MODES.map((t) => ({ key: t.id, label: t.label }))}
            value={f.tool_mode} onChange={set('tool_mode')} />
        </div>
        <div>
          <span style={label}>정렬 순서</span>
          <input style={{ ...input, width: 90 }} type="number" value={f.sort_order}
            onChange={(e) => set('sort_order')(Number(e.target.value) || 0)} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: INK, cursor: 'pointer', paddingBottom: 9 }}>
          <input type="checkbox" checked={f.published} onChange={(e) => set('published')(e.target.checked)} />
          공개 <span style={{ fontWeight: 600, color: SUB }}>(체크해야 이용자에게 보입니다)</span>
        </label>
      </div>

      {err && <div style={{ fontSize: 13, color: '#B23B36', fontWeight: 700, marginBottom: 12 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={save} disabled={saving} style={btn(true)}>{saving ? '저장 중…' : '저장'}</button>
        <button onClick={() => onPreview(f)} style={btn(false)}>미리보기</button>
        <button onClick={() => { if (confirmLeave()) onCancel(); }} style={btn(false)}>취소</button>
        {draftAt && (
          <span style={{ fontSize: 11.5, fontWeight: 700, color: SUB, marginLeft: 4 }}>
            임시저장됨 {new Date(draftAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {f.id && (
          <button onClick={() => onDelete(f.id)}
            style={{ ...btn(false), marginLeft: 'auto', color: '#B23B36', boxShadow: 'inset 0 0 0 1px #E7C3C0' }}>
            이 큐레이션 삭제
          </button>
        )}
      </div>
    </div>
  );
}

export default function CurationAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null); // null=안 열림, {}=새로, {…}=수정
  const [preview, setPreview] = useState(null);
  const [allCards, setAllCards] = useState([]);

  // 목록 읽기 — tick을 올리면 다시 읽는다.
  // 결과 처리를 .then 안에서 해야 effect 본문에서 동기로 setState 하지 않게 되고,
  // 화면을 떠난 뒤 응답이 와도 alive 플래그로 걸러진다.
  const [tick, setTick] = useState(0);
  const load = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const a = await supabase.from('curation_items')
        .select('*').order('sort_order', { ascending: true }).order('id', { ascending: false });
      const b = await supabase.from('quick_cards').select('*').order('sort_order', { ascending: true });
      if (!alive) return;
      setLoading(false);
      if (a.error) { setErr(a.error.message); return; }
      setErr(''); setRows(a.data || []); setAllCards(b.data || []);
    })();
    return () => { alive = false; };
  }, [tick]);

  const remove = async (id, after) => {
    if (!window.confirm(`큐레이션 #${id}을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return;
    // select()를 붙여야 정말 지워졌는지 알 수 있다.
    // 권한이 없으면 오류 없이 0줄만 돌아오므로, 그때는 그 사실을 알려 준다.
    const { data, error } = await supabase.from('curation_items').delete().eq('id', id).select('id');
    if (error) { alert('삭제 실패: ' + error.message); return; }
    if (!data || data.length === 0) {
      alert('삭제되지 않았습니다. 관리자 계정으로 로그인했는지 확인해 주세요.');
      return;
    }
    try { localStorage.removeItem(`bmti_admin_draft_curation_${id}`); } catch { /* 무시 */ }
    if (after) after();
    load();
  };

  const togglePublish = async (row) => {
    const { error } = await supabase.from('curation_items')
      .update({ published: !row.published, updated_at: new Date().toISOString() }).eq('id', row.id);
    if (error) { alert('변경 실패: ' + error.message); return; }
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: INK }}>큐레이션</div>
        <div style={{ fontSize: 12.5, color: SUB }}>공개 {rows.filter((r) => r.published).length} · 전체 {rows.length}</div>
        <button onClick={() => { if (confirmLeave()) setEditing({ ...EMPTY }); }} style={{ ...btn(true), marginLeft: 'auto' }}>+ 새 큐레이션</button>
      </div>

      {err && (
        <div style={{ ...box, marginBottom: 14, color: '#B23B36', fontSize: 13, fontWeight: 700 }}>
          불러오지 못했습니다: {err}
          <div style={{ color: SUB, fontWeight: 600, marginTop: 6 }}>
            supabase/sql/01_curation.sql 을 아직 실행하지 않았다면 먼저 실행해 주세요.
          </div>
        </div>
      )}

      {editing && (
        <Editor row={editing} allCards={allCards} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }}
          onPreview={(draft) => setPreview(draft)} onDelete={(id) => remove(id, () => setEditing(null))} />
      )}

      {preview && (
        <PreviewModal title="큐레이션 미리보기" onClose={() => setPreview(null)}>
          {(tone) => {
            const picked = (preview.card_ids || []).map((id) => allCards.find((c) => c.id === id)).filter(Boolean);
            const charCodes = (tone === 'm' ? preview.chars_m : preview.chars_z) || [];
            const charImages = charCodes.map((id) => CHARACTERS.find((c) => c.id === id)?.image).filter(Boolean);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: SUB, marginBottom: 8 }}>목록에서</div>
                  <CurationCard item={preview} tone={tone} charImages={charImages} />
                </div>
                <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: SUB, marginBottom: 10 }}>눌렀을 때</div>
                  <CurationDetail item={preview} tone={tone} cards={picked}
                    renderCard={(c) => <QuickCardView card={c} tone={tone} />} />
                </div>
              </div>
            );
          }}
        </PreviewModal>
      )}

      <div style={{ ...box, padding: 0, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
          <thead>
            <tr style={{ background: BG }}>
              {['상태', '#', '제목(Z)', '부위 묶음', '조회', '저장', ''].map((h, i, arr) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11.5, fontWeight: 800, color: SUB, borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap',
                  ...(i === arr.length - 1 ? { position: 'sticky', right: 0, background: BG } : null) }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ padding: 20, color: SUB, fontSize: 13 }}>불러오는 중…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={7} style={{ padding: 20, color: SUB, fontSize: 13 }}>아직 등록된 큐레이션이 없습니다.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}` }}>
                  <PublishBadge published={r.published} onClick={() => togglePublish(r)} />
                </td>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB }}>{r.id}</td>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 13, fontWeight: 700, color: INK }}>{r.title_z}</td>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12, color: SUB }}>
                  {(r.body_groups || []).map((g) => BODY_GROUPS.find((x) => x.id === g)?.label || g).join(', ') || '—'}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB }}>{r.view_count}</td>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB }}>{r.save_count}</td>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap', position: 'sticky', right: 0, background: '#fff' }}>
                  <button onClick={() => setPreview(r)} style={smallBtn}>미리보기</button>
                  <button onClick={() => { if (confirmLeave()) setEditing(r); }} style={{ ...smallBtn, marginLeft: 6 }}>수정</button>
                  <button onClick={() => remove(r.id)} style={{ ...smallBtn, marginLeft: 6, color: '#B23B36' }}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
