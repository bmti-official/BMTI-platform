// 각도 단계별 그림 — 항목마다 각도가 심해지는 세 단계를 올린다.
//
// 예전엔 옆모습 한 장을 올려 머리만 떼어 돌렸다. 그러려면 어깨·골반 자리를 슬라이더로
// 맞춰야 했고, 어깨는 앞에서 봐야 하는데 한 장으로는 담을 수 없었다.
// 단계 그림이 그 일을 다 대신하므로 그 칸은 걷어냈다.
import { useEffect, useState } from 'react';
import { INK, SUB, BG, box as box2, btn } from './theme';
import ImageInput from './ImageInput';
import AngleSetAdmin from './AngleSetAdmin';
import { loadAssets, saveAsset } from '../lib/appAssets';
import { LEVEL_ITEMS, LEVEL_NAME, LEVELS_KEY, DEFAULT_CUTS, readCuts, imgKey, allImageKeys } from '../lib/angleLevels';

export default function AngleBodyAdmin() {
  // 목·허리는 각도별로 여러 장(가장 가까운 그림), 팔 들기는 단계 그림 3장을 쓴다
  return <><AngleSetAdmin /><AngleLevelAdmin /></>;
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
      setCuts(readCuts(m[LEVELS_KEY]?.meta));
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
        <br /><b>보는 방향이 항목마다 다릅니다</b> — 목의 정렬·허리 굽힘은 <b>옆모습</b>, 옆으로 팔 들기는 <b>앞모습</b>입니다.
        <br />세 항목 모두 <b>숫자가 클수록 좋은 값</b>이라, 1단계(가벼움)가 큰 쪽입니다.
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
            <input type="range" min={item.short === 'neck' ? 40 : 0} max={item.short === 'arm' ? 180 : item.short === 'neck' ? 90 : 100} step={1} value={cut[i]}
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
