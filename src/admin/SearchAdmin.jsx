// 검색 분류 — 손님 화면의 찾기를 돌보는 자리. 관리자 페이지에서만 쓴다.
//
//   검색 시험  말을 쳐 보면 손님이 보는 결과와 '왜 걸렸는지'가 나온다
//   말 사전    손님 말을 우리 분류로 잇는 표. 기본 사전에 없는 말을 직접 더한다
//   검색 기록  무엇을 많이 찾았는지, 0편이었던 말은 무엇인지(누가 찾았는지는 남기지 않는다)
//   분류 점검  분류가 빠진 콘텐츠, 흔들리는 표기, 부위 묶음별 편수
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { INK, SUB, LINE, BG, ACCENT, box, input, label, btn, smallBtn } from './theme';
import { PillPicker, OnePicker, TagsInput } from './ui';
import { searchList, explain, readQuery, suggest, inGroup, squash, setExtraWords, cleanWord, GROUP_PILLS } from '../features/curation/search';
import { SEARCH_WORDS } from '../lib/searchWords';
import { loadExtraWords, saveExtraWords } from '../lib/searchDict';
import { BODY_GROUPS, GROUP_LABEL } from '../lib/bodyGroups';
import { PART_KEY, KEY_TO_PART_LABEL } from '../lib/diaryEntryLabels';
import { KIND_LABEL } from '../features/curation/format';
import { TOOL_LIST } from '../features/curation/tools';

const PART_OPTIONS = Object.entries(PART_KEY).filter(([, k]) => k !== 'etc').map(([ko, key]) => ({ key, label: ko }));
const GROUP_OPTIONS = BODY_GROUPS.filter((g) => g.id !== 'all').map((g) => ({ key: g.id, label: g.label }));
const KIND_OPTIONS = Object.entries(KIND_LABEL).map(([key, lb]) => ({ key, label: lb }));
const BLANK = { say: [], parts: [], groups: [], kinds: [], tools: [], words: [] };
const nameOf = (x) => String(x.thumb_text || x.title_z || `#${x.id}`).replace(/\n/g, ' ');
const th = { textAlign: 'left', fontSize: 11.5, fontWeight: 800, color: SUB, padding: '8px 10px', borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap' };
const td = { fontSize: 12.5, color: INK, padding: '8px 10px', borderBottom: `1px solid ${LINE}`, verticalAlign: 'top', lineHeight: 1.55 };
const chip = (bg = '#F3EAD8', ink = '#8A6A3A') => ({ display: 'inline-block', fontSize: 11, fontWeight: 800, color: ink, background: bg,
  borderRadius: 999, padding: '2px 8px', marginRight: 4, marginBottom: 3, whiteSpace: 'nowrap' });
const note = { fontSize: 12, color: SUB, fontWeight: 600, lineHeight: 1.65 };

// 사전 한 줄의 뜻을 한 줄 글로
function meaningOf(e) {
  const out = [];
  if ((e.parts || []).length) out.push(`부위 ${e.parts.map((p) => KEY_TO_PART_LABEL[p] || p).join('·')}`);
  if ((e.groups || []).length) out.push(`묶음 ${e.groups.map((g) => GROUP_LABEL[g] || g).join('·')}`);
  if ((e.kinds || []).length) out.push(`종류 ${e.kinds.map((k) => KIND_LABEL[k] || k).join('·')}`);
  if ((e.tools || []).length) out.push(`도구 ${e.tools.join('·')}`);
  if (e.bare) out.push('운동 기구 없이 하는 동작');
  if ((e.words || []).length) out.push(`이어진 말 ${e.words.join('·')}`);
  return out.join(' / ');
}

// 플리에 담긴 동작을 붙인다(손님 화면과 같은 모양)
const withCards = (rows, links, byId) => (rows || []).map((r) => ({
  ...r,
  cards: (links || []).filter((l) => l.routine_id === r.id).map((l) => byId[l.card_id]).filter(Boolean),
}));

export default function SearchAdmin() {
  const [tab, setTab] = useState('test');
  const [data, setData] = useState(null);     // { cards, reads, plis }
  const [err, setErr] = useState('');
  const [list, setList] = useState([]);       // 직접 더한 말 — 고치는 중인 것
  const [savedJson, setSavedJson] = useState('[]');
  const [dictVer, setDictVer] = useState(0);  // 사전이 바뀌면 검색 시험을 다시 셈한다

  useEffect(() => {
    let alive = true;
    (async () => {
      const [c, r, rt, lk, words] = await Promise.all([
        supabase.from('quick_cards').select('*').order('sort_order', { ascending: true }),
        supabase.from('curation_items').select('*').order('sort_order', { ascending: true }),
        supabase.from('routines').select('*').order('id', { ascending: false }),
        supabase.from('routine_cards').select('*').order('position', { ascending: true }),
        loadExtraWords(),
      ]);
      if (!alive) return;
      const e = c.error || r.error || rt.error || lk.error;
      if (e) { setErr(e.message); return; }
      const byId = Object.fromEntries((c.data || []).map((x) => [x.id, x]));
      // 손님에게 보이는 플리만 — 공식(공개) + 회원이 공개로 올린 것
      const shown = (rt.data || []).filter((x) => (x.owner_id ? x.share_state === 'public' : true));
      const mine = (Array.isArray(words) ? words : []).map(cleanWord).filter(Boolean);
      setExtraWords(mine);
      setList(mine);
      setSavedJson(JSON.stringify(mine));
      setData({ cards: c.data || [], reads: r.data || [], plis: withCards(shown, lk.data, byId) });
    })();
    return () => { alive = false; };
  }, []);

  const addWord = (say) => {
    setList((l) => [{ ...BLANK, say: say ? [say] : [] }, ...l]);
    setTab('dict');
  };

  const tabBtn = (id, lb) => (
    <button key={id} type="button" onClick={() => setTab(id)}
      style={{ padding: '8px 15px', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', borderRadius: 999, border: 'none', cursor: 'pointer',
        background: tab === id ? ACCENT : '#fff', color: tab === id ? '#fff' : SUB, boxShadow: tab === id ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
      {lb}
    </button>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: INK }}>검색 분류</div>
        <div style={{ fontSize: 12.5, color: SUB }}>둘러보기·바디플리의 찾기가 어떻게 도는지 보고 고칩니다</div>
      </div>
      <div style={{ display: 'flex', gap: 6, margin: '12px 0 16px', flexWrap: 'wrap' }}>
        {tabBtn('test', '검색 시험')}
        {tabBtn('dict', `말 사전${JSON.stringify(list) !== savedJson ? ' •' : ''}`)}
        {tabBtn('log', '검색 기록')}
        {tabBtn('audit', '분류 점검')}
      </div>
      {err && <div style={{ ...box, marginBottom: 14, color: '#B23B36', fontSize: 13, fontWeight: 700 }}>불러오지 못했습니다: {err}</div>}
      {!data && !err && <div style={{ ...note, padding: 20 }}>불러오는 중…</div>}
      {data && tab === 'test' && <TestTab data={data} dictVer={dictVer} onAdd={addWord} />}
      {data && tab === 'dict' && (
        <DictTab list={list} setList={setList} dirty={JSON.stringify(list) !== savedJson} data={data}
          onSaved={(clean) => { setExtraWords(clean); setList(clean); setSavedJson(JSON.stringify(clean)); setDictVer((v) => v + 1); }} />
      )}
      {data && tab === 'log' && <LogTab data={data} dictVer={dictVer} onAdd={addWord} />}
      {data && tab === 'audit' && <AuditTab data={data} />}
    </div>
  );
}

// ── 검색 시험 ─────────────────────────────────────────────────
function TestTab({ data, dictVer, onAdd }) {
  const [q, setQ] = useState('');
  const [tone, setTone] = useState('z');
  const [where, setWhere] = useState('browse');
  const [group, setGroup] = useState('all');
  const [onlyPub, setOnlyPub] = useState(true);

  const pool = useMemo(() => {
    const base = where === 'pli' ? data.plis : [...data.cards, ...data.reads];
    return base.filter((x) => (!onlyPub || x.published !== false || x.owner_id) && inGroup(x, group));
  }, [data, where, onlyPub, group]);
  // dictVer — 사전을 고쳐 저장하면 다시 셈한다
  const found = useMemo(() => (dictVer >= 0 ? searchList(pool, q, tone) : null), [pool, q, tone, dictVer]);
  const terms = useMemo(() => (dictVer >= 0 ? readQuery(q) : []), [q, dictVer]);
  const asked = q.trim();
  const hint = asked && found.rows.length === 0 ? suggest(asked) : null;

  return (
    <div>
      <div style={{ ...box, marginBottom: 14 }}>
        <span style={label}>찾을 말 <span style={{ fontWeight: 600 }}>— 손님이 치듯이 쳐 보세요</span></span>
        <input style={{ ...input, fontSize: 15, fontWeight: 700 }} value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="거북목, 어깨 마사지, 폼 롤러…" />
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', marginTop: 12, flexWrap: 'wrap' }}>
          <div><span style={label}>어디서</span>
            <OnePicker options={[{ key: 'browse', label: '둘러보기' }, { key: 'pli', label: '바디플리' }]} value={where} onChange={setWhere} /></div>
          <div><span style={label}>말투</span>
            <OnePicker options={[{ key: 'z', label: 'Z' }, { key: 'm', label: 'M' }]} value={tone} onChange={setTone} /></div>
          <div><span style={label}>부위 버튼</span>
            <OnePicker options={GROUP_PILLS.map(([key, lb]) => ({ key, label: lb }))} value={group} onChange={setGroup} /></div>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: SUB, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 7 }}>
            <input type="checkbox" checked={onlyPub} onChange={(e) => setOnlyPub(e.target.checked)} /> 공개된 것만(손님이 보는 그대로)
          </label>
        </div>
      </div>

      {asked && (
        <div style={{ ...box, marginBottom: 14, background: BG }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 8 }}>이렇게 알아들었어요</div>
          {terms.map((t, i) => (
            <div key={i} style={{ fontSize: 12.5, color: INK, marginBottom: 5, lineHeight: 1.6 }}>
              <b>{t.text}</b>{' → '}
              {t.known ? <span>{meaningOf(t) || '사전에 있는 말'}</span>
                : (
                  <span style={{ color: SUB }}>사전에 없는 말 — 글자 그대로 제목·도구·설명 글에서 찾습니다.
                    <button type="button" onClick={() => onAdd(t.text)} style={{ ...smallBtn, marginLeft: 8 }}>사전에 추가</button>
                  </span>
                )}
            </div>
          ))}
          {terms.length > 1 && <div style={{ ...note, marginTop: 4 }}>낱말이 여럿이면 모두에 걸린 것만 보여 줍니다. 하나도 없으면 하나라도 걸린 것을 '비슷한 것'으로 보여 줍니다.</div>}
        </div>
      )}

      <div style={box}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>
          {asked ? `결과 ${found.rows.length}편` : `대상 ${pool.length}편`}
          {found.loose && <span style={{ fontWeight: 700, color: '#B26A00' }}> · 꼭 맞는 것이 없어 비슷한 것을 보여 줌</span>}
        </div>
        {!asked && <div style={note}>찾을 말을 치면 손님이 보는 차례대로 나옵니다.</div>}
        {asked && found.rows.length === 0 && (
          <div style={{ ...note, color: '#B23B36' }}>
            손님 화면에는 '찾은 게 없어요'가 뜹니다.
            {hint ? ` 권하는 말: '${hint}'` : ' 권하는 말도 없습니다.'}
            <button type="button" onClick={() => onAdd(asked)} style={{ ...smallBtn, marginLeft: 8 }}>이 말을 사전에 추가</button>
          </div>
        )}
        {asked && found.rows.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>차례</th><th style={th}>콘텐츠</th><th style={th}>점수</th><th style={th}>왜 걸렸나</th></tr></thead>
              <tbody>
                {found.rows.slice(0, 40).map((x, i) => {
                  const ex = explain(x, q, tone);
                  return (
                    <tr key={`${x.kind || 'x'}-${x.id}`}>
                      <td style={{ ...td, width: 40, color: SUB, fontWeight: 800 }}>{i + 1}</td>
                      <td style={td}>
                        <b>{nameOf(x)}</b>
                        <div style={{ marginTop: 3 }}>
                          <span style={chip('#F3F1EC', SUB)}>{x.cards ? '플리' : x.kind ? (KIND_LABEL[x.kind] || x.kind) : '읽을거리'}</span>
                          {x.published === false && !x.owner_id && <span style={chip('#FDECEA', '#B23B36')}>비공개</span>}
                        </div>
                      </td>
                      <td style={{ ...td, width: 50, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{ex.total}</td>
                      <td style={td}>
                        {ex.terms.map((t, k) => (
                          <div key={k}>
                            <b>{t.text}</b>{' '}
                            {t.s > 0 ? t.why.map((w) => <span key={w} style={chip()}>{w}</span>) : <span style={chip('#F3F1EC', SUB)}>안 걸림</span>}
                            {t.from && <span style={{ fontSize: 11, color: SUB }}> (담긴 동작: {t.from})</span>}
                          </div>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {found.rows.length > 40 && <div style={{ ...note, marginTop: 8 }}>위에서 40편까지만 보여 줍니다.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 말 사전 ───────────────────────────────────────────────────
function DictTab({ list, setList, dirty, onSaved, data }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [find, setFind] = useState('');
  const [openBase, setOpenBase] = useState(false);

  // 도구 고르개 — 정해 둔 목록에, 카드에 실제로 적힌 도구를 더한다
  const toolOptions = useMemo(() => {
    const used = data.cards.flatMap((c) => c.tools || []);
    return [...new Set([...TOOL_LIST, ...used])].map((t) => ({ key: t, label: t }));
  }, [data]);

  const put = (i, patch) => { setMsg(''); setList((l) => l.map((e, k) => (k === i ? { ...e, ...patch } : e))); };
  const drop = (i) => { setMsg(''); setList((l) => l.filter((_, k) => k !== i)); };
  const bad = list.map((e) => !cleanWord(e));

  const save = async () => {
    const clean = list.map(cleanWord).filter(Boolean);
    setSaving(true); setMsg('');
    const r = await saveExtraWords(clean);
    setSaving(false);
    if (!r.ok) { setMsg('저장 실패: ' + r.why); return; }
    onSaved(clean);
    const dropped = list.length - clean.length;
    setMsg(`저장했습니다. 손님 화면에는 다음에 열 때부터 반영됩니다.${dropped ? ` (덜 채운 ${dropped}줄은 빼고 저장)` : ''}`);
  };

  const key = squash(find);
  const baseShown = key ? SEARCH_WORDS.filter((e) => (e.say || []).some((w) => squash(w).includes(key))) : SEARCH_WORDS;
  const mineHit = key ? list.filter((e) => (e.say || []).some((w) => squash(w).includes(key))).length : 0;

  return (
    <div>
      <div style={{ ...box, marginBottom: 14, background: BG }}>
        <div style={note}>
          손님은 '목'보다 <b>거북목</b>을, '대둔근'보다 <b>엉덩이</b>를 칩니다. 여기서 <b>손님 말 → 우리 분류</b>를 이어 줍니다.
          <br />기본 사전({SEARCH_WORDS.length}묶음)은 이미 들어 있습니다. 거기에 없는 말만 아래에 더하면 됩니다. 기본 사전의 말을 다시 적으면 뜻이 <b>보태집니다</b>.
          <br />'검색 기록'에서 0편이었던 말 옆의 <b>사전에 추가</b>를 누르면 여기로 넘어옵니다.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => { setMsg(''); setList((l) => [{ ...BLANK }, ...l]); }} style={btn(false)}>＋ 말 더하기</button>
        <button type="button" onClick={save} disabled={saving || !dirty} style={{ ...btn(true), opacity: saving || !dirty ? 0.5 : 1 }}>
          {saving ? '저장하는 중…' : dirty ? '사전 저장' : '저장됨'}
        </button>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: msg.startsWith('저장 실패') ? '#B23B36' : '#2F7A4F' }}>{msg}</span>
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: SUB, fontWeight: 700 }}>직접 더한 말 {list.length}줄</span>
      </div>

      {list.length === 0 && <div style={{ ...box, ...note, marginBottom: 14 }}>아직 직접 더한 말이 없습니다.</div>}
      {list.map((e, i) => (
        <div key={i} style={{ ...box, marginBottom: 10, boxShadow: bad[i] ? 'inset 0 0 0 1.5px #E5B7B3' : 'none' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <span style={label}>손님이 치는 말 <span style={{ fontWeight: 600 }}>— 같은 뜻이면 쉼표로 여러 개 · 띄어쓰기는 상관없음</span></span>
              <TagsInput value={e.say || []} onChange={(v) => put(i, { say: v })} placeholder="예: 담 걸림, 담결림, 목 담" />
            </div>
            <button type="button" onClick={() => drop(i)} style={{ ...smallBtn, color: '#B23B36', marginTop: 22 }}>지우기</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            <div><span style={label}>부위 <span style={{ fontWeight: 600 }}>— 이 부위를 핵심·연관으로 둔 콘텐츠가 걸립니다</span></span>
              <PillPicker options={PART_OPTIONS} value={e.parts || []} onChange={(v) => put(i, { parts: v })} /></div>
            <div><span style={label}>부위 묶음</span>
              <PillPicker options={GROUP_OPTIONS} value={e.groups || []} onChange={(v) => put(i, { groups: v })} />
              <div style={{ height: 10 }} />
              <span style={label}>종류</span>
              <PillPicker options={KIND_OPTIONS} value={e.kinds || []} onChange={(v) => put(i, { kinds: v })} /></div>
            <div><span style={label}>도구</span>
              <PillPicker options={toolOptions} value={e.tools || []} onChange={(v) => put(i, { tools: v })} /></div>
            <div><span style={label}>이어서 찾을 말 <span style={{ fontWeight: 600 }}>— 제목·설명 글에서 대신 찾을 글자 · 쉼표로</span></span>
              <TagsInput value={e.words || []} onChange={(v) => put(i, { words: v })} placeholder="예: 턱 당기기, 뻐근" /></div>
          </div>
          <div style={{ ...note, marginTop: 10, color: bad[i] ? '#B23B36' : SUB }}>
            {bad[i] ? '손님 말과 뜻(부위·묶음·종류·도구·이어서 찾을 말 가운데 하나)을 모두 채워야 저장됩니다.' : `뜻: ${meaningOf(e)}`}
          </div>
        </div>
      ))}

      <div style={{ ...box, marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: INK }}>기본 사전 <span style={{ fontWeight: 600, color: SUB }}>· {SEARCH_WORDS.length}묶음 · 여기서는 볼 수만 있습니다</span></div>
          <input style={{ ...input, width: 220, padding: '7px 10px', fontSize: 13 }} value={find} onChange={(e) => { setFind(e.target.value); setOpenBase(true); }}
            placeholder="이 말이 사전에 있나?" />
          <button type="button" onClick={() => setOpenBase((o) => !o)} style={smallBtn}>{openBase ? '접기' : '펼쳐 보기'}</button>
          {key && <span style={{ fontSize: 12, fontWeight: 700, color: SUB }}>기본 {baseShown.length}묶음 · 직접 더한 말 {mineHit}줄에 있음</span>}
        </div>
        {openBase && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>손님이 치는 말</th><th style={th}>뜻</th></tr></thead>
            <tbody>
              {baseShown.map((e, i) => (
                <tr key={i}>
                  <td style={{ ...td, width: '46%' }}>{(e.say || []).join(', ')}</td>
                  <td style={{ ...td, color: SUB }}>{meaningOf(e)}{(e.not || []).length ? ` (빼는 말 ${e.not.join('·')})` : ''}</td>
                </tr>
              ))}
              {baseShown.length === 0 && <tr><td style={td} colSpan={2}>기본 사전에는 없는 말입니다. 위에서 더해 주세요.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── 검색 기록 ─────────────────────────────────────────────────
const AT_LABEL = { browse: '둘러보기', pli: '바디플리' };
function LogTab({ data, dictVer, onAdd }) {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      // 기간의 시작 — 서버에서 걸러 온다
      const since = new Date(new Date().setHours(0, 0, 0, 0) - (days - 1) * 864e5).toISOString();
      const r = await supabase.from('app_events').select('name,meta,created_at')
        .in('name', ['search', 'search_open', 'search_group']).gte('created_at', since)
        .order('created_at', { ascending: false }).limit(8000);
      if (!alive) return;
      if (r.error) { setErr(r.error.message); setRows([]); return; }
      setErr(''); setRows(r.data || []);
    })();
    return () => { alive = false; };
  }, [days]);

  // 손님이 보는 것(공개된 카드·읽을거리, 보이는 플리)으로 '지금 몇 편 나오는지'를 다시 센다
  const nowCount = useMemo(() => {
    const browse = [...data.cards, ...data.reads].filter((x) => x.published !== false);
    const plis = data.plis.filter((x) => x.owner_id || x.published !== false);
    return (at, q) => (dictVer >= 0 ? searchList(at === 'pli' ? plis : browse, q, 'z').rows.length : 0);
  }, [data, dictVer]);

  const sum = useMemo(() => {
    const by = {};
    const groups = {};
    (rows || []).forEach((e) => {
      const m = e.meta || {};
      if (e.name === 'search_group') { groups[m.g] = (groups[m.g] || 0) + 1; return; }
      const k = squash(m.q);
      if (!k) return;
      const at = m.at === 'pli' ? 'pli' : 'browse';
      const o = (by[`${at}:${k}`] ||= { k, at, forms: {}, count: 0, opens: 0, lastN: null });
      o.forms[m.q] = (o.forms[m.q] || 0) + 1;
      if (e.name === 'search') { o.count += 1; if (o.lastN == null) o.lastN = Number(m.n) || 0; }   // 새 것부터 읽으니 처음 만난 것이 가장 최근
      else o.opens += 1;
    });
    const all = Object.values(by).filter((o) => o.count > 0).map((o) => ({
      ...o, q: Object.entries(o.forms).sort((a, b) => b[1] - a[1])[0][0], now: nowCount(o.at, Object.keys(o.forms)[0]),
    }));
    return {
      total: all.reduce((a, o) => a + o.count, 0),
      top: [...all].sort((a, b) => b.count - a.count).slice(0, 40),
      zero: all.filter((o) => o.lastN === 0 || o.now === 0).sort((a, b) => b.count - a.count).slice(0, 40),
      groups: Object.entries(groups).sort((a, b) => b[1] - a[1]),
      kinds: all.length,
    };
  }, [rows, nowCount]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <OnePicker options={[{ key: 7, label: '최근 7일' }, { key: 30, label: '30일' }, { key: 90, label: '90일' }]} value={days} onChange={setDays} />
        <span style={{ fontSize: 12.5, color: SUB, fontWeight: 700 }}>
          {rows == null ? '불러오는 중…' : `찾기 ${sum.total}번 · 서로 다른 말 ${sum.kinds}가지`}
        </span>
      </div>
      {err && <div style={{ ...box, marginBottom: 14, color: '#B23B36', fontSize: 13, fontWeight: 700 }}>기록을 읽지 못했습니다: {err}</div>}
      <div style={{ ...box, marginBottom: 14, background: BG }}>
        <div style={note}>
          누가 찾았는지는 남기지 않습니다(회원 번호·익명 번호 없이 저장). 손이 멈춘 뒤에 한 번 남겨, 치는 도중의 글자는 쌓이지 않습니다.
          관리자 화면에서 시험한 것은 남지 않습니다. 기록은 180일 뒤 지워집니다.
        </div>
      </div>

      <div style={{ ...box, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>못 찾은 말 <span style={{ fontWeight: 600, color: SUB }}>· 찾았을 때 0편이었거나, 지금도 0편인 말</span></div>
        <div style={{ ...note, marginBottom: 8 }}>사전에 넣어 이어 줄 말인지, 콘텐츠를 새로 만들어야 하는 말인지 보는 자리입니다.</div>
        <LogTable rows={sum.zero} onAdd={onAdd} empty="못 찾은 말이 없습니다." />
      </div>
      <div style={{ ...box, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 8 }}>많이 찾은 말</div>
        <LogTable rows={sum.top} onAdd={null} empty="아직 찾은 기록이 없습니다." />
      </div>
      <div style={box}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 8 }}>부위 버튼을 누른 횟수</div>
        {sum.groups.length === 0 ? <div style={note}>아직 누른 기록이 없습니다.</div>
          : sum.groups.map(([g, n]) => <span key={g} style={chip()}>{GROUP_LABEL[g] || g} {n}번</span>)}
      </div>
    </div>
  );
}
function LogTable({ rows, onAdd, empty }) {
  if (!rows.length) return <div style={note}>{empty}</div>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>
          <th style={th}>찾은 말</th><th style={th}>어디서</th><th style={th}>횟수</th><th style={th}>그때 결과</th><th style={th}>지금 결과</th><th style={th}>찾고 누름</th>
          {onAdd && <th style={th} />}
        </tr></thead>
        <tbody>
          {rows.map((o) => (
            <tr key={`${o.at}:${o.k}`}>
              <td style={{ ...td, fontWeight: 800 }}>{o.q}</td>
              <td style={{ ...td, color: SUB }}>{AT_LABEL[o.at]}</td>
              <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{o.count}</td>
              <td style={{ ...td, fontVariantNumeric: 'tabular-nums', color: o.lastN === 0 ? '#B23B36' : INK }}>{o.lastN}편</td>
              <td style={{ ...td, fontVariantNumeric: 'tabular-nums', color: o.now === 0 ? '#B23B36' : '#2F7A4F', fontWeight: 800 }}>
                {o.now}편{o.lastN === 0 && o.now > 0 ? ' · 해결됨' : ''}
              </td>
              <td style={{ ...td, fontVariantNumeric: 'tabular-nums', color: SUB }}>{o.opens}번</td>
              {onAdd && <td style={td}>{o.now === 0 && <button type="button" onClick={() => onAdd(o.q)} style={smallBtn}>사전에 추가</button>}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 분류 점검 ─────────────────────────────────────────────────
function AuditTab({ data }) {
  const a = useMemo(() => {
    const pubCards = data.cards.filter((c) => c.published !== false);
    const pubReads = data.reads.filter((c) => c.published !== false);
    // 부위 묶음별 편수 — 손님이 부위 버튼을 눌렀을 때 몇 편 나오는가
    const groups = BODY_GROUPS.filter((g) => g.id !== 'all').map((g) => ({
      id: g.id, label: g.label,
      cards: pubCards.filter((c) => (c.body_groups || []).includes(g.id)).length,
      reads: pubReads.filter((c) => (c.body_groups || []).includes(g.id)).length,
      plis: data.plis.filter((p) => inGroup(p, g.id)).length,
    }));
    const kinds = Object.entries(KIND_LABEL).map(([k, lb]) => ({ label: lb, n: pubCards.filter((c) => c.kind === k).length }));
    // 빠진 분류
    const missing = [];
    data.cards.forEach((c) => {
      const m = [];
      if (!(c.body_groups || []).length) m.push('부위 묶음');
      if (!(c.core_parts || []).length) m.push('핵심 부위');
      if (!KIND_LABEL[c.kind]) m.push('종류');
      if (!String(c.good_when || '').trim()) m.push('좋은 상황 글');
      if (m.length) missing.push({ key: `card-${c.id}`, name: nameOf(c), type: '바디카드', pub: c.published !== false, m });
    });
    data.reads.forEach((c) => {
      const m = [];
      if (!(c.body_groups || []).length) m.push('부위 묶음');
      if (m.length) missing.push({ key: `read-${c.id}`, name: nameOf(c), type: '읽을거리', pub: c.published !== false, m });
    });
    // 도구 표기 — 목록에 없는 이름, 띄어쓰기만 다른 같은 말
    const toolCount = {};
    data.cards.forEach((c) => (c.tools || []).forEach((t) => { (toolCount[t] ||= []).push(nameOf(c)); }));
    const bySquash = {};
    Object.keys(toolCount).forEach((t) => { (bySquash[squash(t)] ||= []).push(t); });
    const tools = Object.entries(toolCount).map(([t, names]) => ({
      t, n: names.length, names,
      off: !TOOL_LIST.includes(t),
      twin: (bySquash[squash(t)] || []).filter((x) => x !== t),
    })).sort((x, y) => y.n - x.n);
    const noTool = data.cards.filter((c) => !(c.tools || []).length).map(nameOf);
    const withKw = [...data.cards, ...data.reads, ...data.plis].filter((x) => (x.keywords || []).length).length;
    return { groups, kinds, missing, tools, noTool, withKw, pubCards: pubCards.length, pubReads: pubReads.length };
  }, [data]);

  return (
    <div>
      <div style={{ ...box, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>부위 묶음별 편수 <span style={{ fontWeight: 600, color: SUB }}>· 공개된 것 기준 · 손님이 부위 버튼을 눌렀을 때 나오는 수</span></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: 560 }}>
          <thead><tr><th style={th}>부위 묶음</th><th style={th}>바디카드</th><th style={th}>읽을거리</th><th style={th}>바디플리</th></tr></thead>
          <tbody>
            {a.groups.map((g) => (
              <tr key={g.id}>
                <td style={{ ...td, fontWeight: 800 }}>{g.label}</td>
                <td style={{ ...td, color: g.cards <= 2 ? '#B23B36' : INK, fontWeight: g.cards <= 2 ? 800 : 500 }}>{g.cards}편{g.cards <= 2 ? ' · 적음' : ''}</td>
                <td style={td}>{g.reads}편</td>
                <td style={td}>{g.plis}개</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ ...note, marginTop: 10 }}>
          공개된 바디카드 {a.pubCards}편({a.kinds.map((k) => `${k.label} ${k.n}`).join(' · ')}) · 읽을거리 {a.pubReads}편 · 검색어 칸을 채운 콘텐츠 {a.withKw}개
        </div>
      </div>

      <div style={{ ...box, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 4 }}>도구 표기</div>
        <div style={{ ...note, marginBottom: 8 }}>
          같은 도구가 다른 이름으로 적혀 있으면 손님 화면의 글자가 제각각으로 보입니다(검색은 사전이 같은 말로 묶어 줍니다).
          ⚡ 바디카드에서 해당 카드를 열어 이름을 맞춰 주세요.
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>도구 이름</th><th style={th}>편수</th><th style={th}>살펴볼 것</th><th style={th}>적힌 카드</th></tr></thead>
          <tbody>
            {a.tools.map((x) => (
              <tr key={x.t}>
                <td style={{ ...td, fontWeight: 800, whiteSpace: 'nowrap' }}>{x.t}</td>
                <td style={td}>{x.n}</td>
                <td style={td}>
                  {x.twin.length > 0 && <span style={chip('#FDECEA', '#B23B36')}>‘{x.twin.join("’, ‘")}’와 띄어쓰기만 다름</span>}
                  {x.off && !x.twin.length && <span style={chip('#FFF4DC', '#B26A00')}>정해 둔 도구 목록에 없는 이름</span>}
                  {!x.off && !x.twin.length && <span style={{ color: SUB }}>—</span>}
                </td>
                <td style={{ ...td, color: SUB, fontSize: 11.5 }}>{(x.off || x.twin.length) ? x.names.join(' · ') : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {a.noTool.length > 0 && <div style={{ ...note, marginTop: 10 }}>도구를 고르지 않은 카드 {a.noTool.length}편(맨몸 동작이면 그대로 두면 됩니다): {a.noTool.join(' · ')}</div>}
      </div>

      <div style={box}>
        <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 8 }}>분류가 빠진 콘텐츠 <span style={{ fontWeight: 600, color: SUB }}>· {a.missing.length}개</span></div>
        {a.missing.length === 0 ? <div style={note}>빠진 곳이 없습니다.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>콘텐츠</th><th style={th}>갈래</th><th style={th}>빠진 것</th></tr></thead>
            <tbody>
              {a.missing.map((x) => (
                <tr key={x.key}>
                  <td style={{ ...td, fontWeight: 800 }}>{x.name}{!x.pub && <span style={{ ...chip('#F3F1EC', SUB), marginLeft: 6 }}>비공개</span>}</td>
                  <td style={{ ...td, color: SUB }}>{x.type}</td>
                  <td style={td}>{x.m.map((w) => <span key={w} style={chip('#FDECEA', '#B23B36')}>{w}</span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
