// 각도기록 옆모습 사람 그림 — 남/여 한 장씩 올리고, 어깨·골반 자리를 맞춘다.
//
// 한 장짜리 그림이라 관절이 움직이지 않는다. 그래서 화면에서는 **어깨 위쪽만 떼어**
// 잰 각도만큼 돌린다. 어깨가 그림 어디쯤인지 알아야 그 일이 되므로 여기서 맞춰 둔다.
// 미리보기의 목 각도를 흔들어 보면서 머리가 제자리에서 도는지 확인하면 된다.
import { useEffect, useState } from 'react';
import { INK, SUB, BG, box as box2, btn, label } from './theme';
import ImageInput from './ImageInput';
import { loadAssets, saveAsset, ANGLE_BODY, DEFAULT_META } from '../lib/appAssets';
import { LEVEL_ITEMS, LEVEL_NAME, LEVELS_KEY, DEFAULT_CUTS, imgKey, allImageKeys } from '../lib/angleLevels';
import AngleBoxCard, { PhotoFigure } from '../components/AngleBoxCard';
import { getTypeAccent } from '../lib/typeAccent';

const SLIDERS = [
  { k: 'shoulderX', label: '어깨 좌우', min: 20, max: 80, color: '#E0554F',
    hint: '빨간 세로선을 목이 몸통에서 갈라지는 자리에 맞춥니다' },
  { k: 'shoulderY', label: '어깨 높이', min: 15, max: 60, color: '#E0554F',
    hint: '빨간 가로선을 어깨선(목 뿌리)에 맞춥니다 — 여기 위쪽이 머리로 떨어져 나갑니다' },
  { k: 'hipY', label: '골반 높이', min: 35, max: 80, color: '#2F6FE0',
    hint: '파란 가로선을 엉덩이 옆선, 허리가 접히는 자리에 맞춥니다' },
  { k: 'baseNeck', label: '기준 목 각도', min: 0, max: 20, color: '#8A6A3A',
    hint: '그림 자체가 이미 기울어 있는 만큼. 미리보기를 이 값에 두면 머리가 그대로여야 합니다' },
];

// 미리보기용 가짜 판 — 목 각도만 손으로 돌려 본다
const fakeRows = (neck) => {
  const d = new Date(); d.setDate(d.getDate() - d.getDay());
  const w = (i) => { const x = new Date(d); x.setDate(x.getDate() - i * 7);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  return [
    { week: w(0), neck_bend: neck, trunk_flex: 72, arm_raise: 148, quality: 82 },
    { week: w(1), neck_bend: neck + 4, trunk_flex: 69, arm_raise: 144, quality: 82 },
  ];
};

export default function AngleBodyAdmin() {
  return <><AngleLevelAdmin /><AngleBasePhoto /></>;
}

function AngleBasePhoto() {
  const [rows, setRows] = useState(null);
  const [who, setWho] = useState('female');
  const [neck, setNeck] = useState(16);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    loadAssets([ANGLE_BODY.male, ANGLE_BODY.female]).then((m) => {
      if (!alive) return;
      setRows({
        male: m[ANGLE_BODY.male] || { url: '', meta: { ...DEFAULT_META } },
        female: m[ANGLE_BODY.female] || { url: '', meta: { ...DEFAULT_META } },
      });
    });
    return () => { alive = false; };
  }, []);

  if (!rows) return <div style={{ ...box2, fontSize: 13, color: SUB }}>불러오는 중…</div>;

  const cur = rows[who];
  const put = (patch) => setRows((p) => ({ ...p, [who]: { ...p[who], ...patch } }));
  const putMeta = (k) => (v) => put({ meta: { ...cur.meta, [k]: Number(v) } });

  const save = async () => {
    setBusy(true); setNote('');
    const a = await saveAsset(ANGLE_BODY.male, rows.male.url, rows.male.meta);
    const b = await saveAsset(ANGLE_BODY.female, rows.female.url, rows.female.meta);
    setBusy(false);
    setNote(a.ok && b.ok ? '저장했습니다.' : `저장 실패: ${a.why || b.why}`);
  };

  return (
    <div style={{ ...box2, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>각도기록 옆모습 그림</div>
      <div style={{ fontSize: 12, color: SUB, lineHeight: 1.8, marginBottom: 14 }}>
        남/여 한 장씩 올립니다. <b>옆을 보고 선 전신</b>이어야 하고, 배경은 흰색이 좋습니다.
        <br />화면에서는 <b>어깨 위쪽만 떼어</b> 잰 각도만큼 돌립니다. 그래서 어깨가 그림 어디쯤인지 맞춰 둬야 합니다.
        <br /><b style={{ color: '#E0554F' }}>빨간 선 둘</b>이 만나는 자리가 머리가 도는 축입니다 — <b>목이 몸통에서 갈라지는 자리</b>에 놓으세요.
        <b style={{ color: '#2F6FE0' }}> 파란 가로선</b>은 <b>엉덩이 옆선(허리가 접히는 자리)</b>에 놓으면 됩니다.
        <br />맞췄으면 아래 <b>미리보기 목 각도</b>를 흔들어 보세요. <b>머리만 제자리에서 돌고 어깨는 가만히</b> 있으면 맞은 겁니다.
        목이 잘리거나 어깨가 같이 돌면 <b>어깨 높이</b>를 다시 조절합니다.
      </div>

      <div style={{ display: 'inline-flex', background: '#fff', borderRadius: 999, padding: 3, marginBottom: 14,
        boxShadow: 'inset 0 0 0 1px #EDE9E2' }}>
        {[['female', '여성'], ['male', '남성']].map(([k, lb]) => (
          <button key={k} type="button" onClick={() => setWho(k)}
            style={{ padding: '7px 17px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 12.5, fontWeight: 800, background: who === k ? '#C9975A' : 'transparent',
              color: who === k ? '#fff' : SUB }}>{lb}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 18, alignItems: 'start' }}>
        <div>
          <span style={label}>{who === 'female' ? '여성' : '남성'} 옆모습 사진</span>
          <ImageInput value={cur.url} onChange={(v) => put({ url: v })} />

          <div style={{ ...box2, background: BG, marginTop: 14 }}>
            {SLIDERS.map((s) => (
              <div key={s.k} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: INK }}>{s.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#C9975A', fontVariantNumeric: 'tabular-nums' }}>
                    {cur.meta[s.k]}{s.k === 'baseNeck' ? '°' : '%'}
                  </span>
                  </div>
                <div style={{ fontSize: 11, color: SUB, fontWeight: 600, lineHeight: 1.6, marginBottom: 5, wordBreak: 'keep-all' }}>
                  <b style={{ color: s.color }}>▪</b> {s.hint}
                </div>
                <input type="range" min={s.min} max={s.max} step={0.5} value={cur.meta[s.k]}
                  onChange={(e) => putMeta(s.k)(e.target.value)}
                  style={{ width: '100%', accentColor: '#C9A227' }} />
              </div>
            ))}
            <div style={{ borderTop: '1px solid #EDE9E2', paddingTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: INK }}>미리보기 목 각도</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#C9975A' }}>{neck}°</span>
                <span style={{ fontSize: 11, color: SUB, fontWeight: 600 }}>— 저장되지 않습니다</span>
              </div>
              <input type="range" min={0} max={40} step={1} value={neck}
                onChange={(e) => setNeck(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#C9A227' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14 }}>
            <button onClick={save} disabled={busy} style={btn(true)}>{busy ? '저장 중…' : '저장'}</button>
            {note && <span style={{ fontSize: 12.5, fontWeight: 700, color: note.startsWith('저장했') ? '#2E7D50' : '#B23B36' }}>{note}</span>}
          </div>
        </div>

        {/* 맞추는 창 — 크게. 작으면 선이 어디 걸쳤는지 안 보인다 */}
        <div style={{ position: 'sticky', top: 12 }}>
          <span style={label}>맞추는 창 <span style={{ fontWeight: 600 }}>— 선을 보고 조절하세요</span></span>
          <div style={{ background: '#FAF7F0', borderRadius: 16, padding: 10, marginBottom: 14 }}>
            {cur.url ? (
              <div style={{ width: 300, maxWidth: '100%', margin: '0 auto' }}>
                <PhotoFigure src={cur.url} meta={cur.meta} neck={neck} trunk={72} arm={148}
                  ghostNeck={null} t={getTypeAccent()} sel={null} guide />
              </div>
            ) : (
              <div style={{ fontSize: 12, color: SUB, fontWeight: 600, lineHeight: 1.7, padding: '24px 6px', textAlign: 'center' }}>
                사진을 올리면 여기에 맞추는 선이 함께 나옵니다.
              </div>
            )}
          </div>
          <span style={label}>손님 화면</span>
          <div style={{ background: '#fff', borderRadius: 16, padding: 8 }}>
            <LivePreview url={cur.url} meta={cur.meta} neck={neck} />
          </div>
        </div>
      </div>
    </div>
  );
}


// ── 단계별 그림 ────────────────────────────────────────────
// 항목마다 각도가 심해지는 세 단계를 올린다. 한 장을 돌려 쓰는 것보다 정확하다 —
// 목은 옆에서, 어깨는 앞에서 봐야 하는데 한 장으로는 둘을 같이 담을 수 없다.
function AngleLevelAdmin() {
  const [box, setBox] = useState(null);
  const [cuts, setCuts] = useState(DEFAULT_CUTS);
  const [item, setItem] = useState(LEVEL_ITEMS[0]);
  const [who, setWho] = useState('female');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    loadAssets([LEVELS_KEY, ...allImageKeys()]).then((m) => {
      if (!alive) return;
      const got = {};
      allImageKeys().forEach((k) => { got[k] = m[k]?.url || ''; });
      setBox(got);
      setCuts({ ...DEFAULT_CUTS, ...(m[LEVELS_KEY]?.meta || {}) });
    });
    return () => { alive = false; };
  }, []);

  if (!box) return <div style={{ ...box2, fontSize: 13, color: SUB }}>불러오는 중…</div>;

  const cut = cuts[item.short] || item.cuts;
  const putCut = (i) => (v) => setCuts((p) => {
    const next = [...(p[item.short] || item.cuts)];
    next[i] = Number(v);
    if (next[0] > next[1]) next[i === 0 ? 1 : 0] = next[i];
    return { ...p, [item.short]: next };
  });

  const bandText = (lv) => {
    const [a, b] = cut;
    if (item.better === 'low') return lv === 1 ? `${a}도 미만` : lv === 2 ? `${a}~${b}도` : `${b}도 이상`;
    return lv === 1 ? `${b}도 이상` : lv === 2 ? `${a}~${b}도` : `${a}도 미만`;
  };

  const save = async () => {
    setBusy(true); setNote('');
    let bad = null;
    for (const k of allImageKeys()) {
      const r = await saveAsset(k, box[k], {});
      if (!r.ok) bad = r.why;
    }
    const r = await saveAsset(LEVELS_KEY, null, cuts);
    if (!r.ok) bad = r.why;
    setBusy(false);
    setNote(bad ? `저장 실패: ${bad}` : '저장했습니다.');
  };

  return (
    <div style={{ ...box2, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>각도 단계별 그림</div>
      <div style={{ fontSize: 12, color: SUB, lineHeight: 1.8, marginBottom: 14 }}>
        항목마다 <b>각도가 심해지는 세 단계</b>를 올립니다. 손님이 그 항목을 누르면 자기 값에 맞는 그림이 뜹니다.
        <br /><b>보는 방향이 항목마다 다릅니다</b> — 목 숙임·허리 굽힘은 <b>옆모습</b>, 어깨 들림은 <b>앞모습</b>입니다.
        <br />세 장을 다 못 채워도 됩니다. 비어 있으면 가까운 단계 그림으로 물러나고, 그럴 땐 &lsquo;비슷한 단계 그림&rsquo;이라고 적어 둡니다.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'inline-flex', background: '#fff', borderRadius: 999, padding: 3, boxShadow: 'inset 0 0 0 1px #EDE9E2' }}>
          {LEVEL_ITEMS.map((x) => (
            <button key={x.key} type="button" onClick={() => setItem(x)}
              style={{ padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12.5, fontWeight: 800, background: item.key === x.key ? '#C9975A' : 'transparent',
                color: item.key === x.key ? '#fff' : SUB }}>{x.label}</button>
          ))}
        </div>
        <div style={{ display: 'inline-flex', background: '#fff', borderRadius: 999, padding: 3, boxShadow: 'inset 0 0 0 1px #EDE9E2' }}>
          {[['female', '여성'], ['male', '남성']].map(([k, lb]) => (
            <button key={k} type="button" onClick={() => setWho(k)}
              style={{ padding: '7px 15px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12.5, fontWeight: 800, background: who === k ? '#C9975A' : 'transparent',
                color: who === k ? '#fff' : SUB }}>{lb}</button>
          ))}
        </div>
        <span style={{ alignSelf: 'center', fontSize: 12, fontWeight: 800, color: '#C9975A' }}>
          {item.label} · {item.view}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
        {[1, 2, 3].map((lv) => {
          const k = imgKey(item.short, who, lv);
          const tint = lv === 1 ? '#5E9463' : lv === 2 ? '#9A7A16' : '#B23B36';
          return (
            <div key={lv}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: tint, marginBottom: 2 }}>
                {lv}. {LEVEL_NAME[lv]} <span style={{ fontWeight: 700, color: SUB }}>{bandText(lv)}</span>
              </div>
              <div style={{ fontSize: 11, color: SUB, fontWeight: 600, lineHeight: 1.5, marginBottom: 6, minHeight: 32, wordBreak: 'keep-all' }}>
                {item.shots[lv - 1]}
              </div>
              {box[k] && (
                <img src={box[k]} alt="" style={{ width: '100%', aspectRatio: '1 / 2', objectFit: 'contain',
                  background: '#FAF7F0', borderRadius: 10, marginBottom: 6, display: 'block' }} />
              )}
              <ImageInput value={box[k]} onChange={(v) => setBox((p) => ({ ...p, [k]: v }))} />
            </div>
          );
        })}
      </div>

      <div style={{ ...box2, background: BG, marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 900, color: INK, marginBottom: 8 }}>
          단계가 갈리는 각도 <span style={{ fontWeight: 700, color: SUB }}>— {item.label}</span>
        </div>
        {[0, 1].map((i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: INK, marginBottom: 4 }}>
              {i === 0 ? '첫째 경계' : '둘째 경계'} <span style={{ color: '#C9975A' }}>{cut[i]}도</span>
            </div>
            <input type="range" min={0} max={item.short === 'arm' ? 180 : 100} step={1} value={cut[i]}
              onChange={(e) => putCut(i)(e.target.value)} style={{ width: '100%', accentColor: '#C9A227' }} />
          </div>
        ))}
        <div style={{ fontSize: 11.5, color: SUB, fontWeight: 700, lineHeight: 1.7 }}>
          {item.better === 'low'
            ? '작을수록 좋은 값이라, 작은 쪽이 가벼움입니다.'
            : '클수록 좋은 값이라, 큰 쪽이 가벼움입니다.'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={save} disabled={busy} style={btn(true)}>{busy ? '저장 중…' : '저장'}</button>
        {note && <span style={{ fontSize: 12.5, fontWeight: 700, color: note.startsWith('저장했') ? '#2E7D50' : '#B23B36' }}>{note}</span>}
      </div>
    </div>
  );
}

// 저장 전 값으로 바로 보여 주려고, 카드가 읽는 자리를 잠시 덮어쓴다.
function LivePreview({ url, meta, neck }) {
  if (!url) {
    return <div style={{ fontSize: 12, color: SUB, fontWeight: 600, lineHeight: 1.7, padding: '10px 2px' }}>
      사진을 올리면 여기에 손님이 볼 모습이 그대로 나옵니다.
    </div>;
  }
  return <AngleBoxCard rows={fakeRows(neck)} gender="female" previewBody={{ url, meta }} />;
}
