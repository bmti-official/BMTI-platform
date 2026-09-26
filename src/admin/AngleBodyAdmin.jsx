// 각도기록 관리 — 각도별 그림 모음과, 가벼움·보통·심함을 가르는 기준 각도.
//
// 예전엔 단계마다 그림을 한 장씩 올렸다(각도 단계별 그림). 이제 그림은 모두
// '각도별 그림 모음'에서 오므로 그 칸은 걷어내고, 단계 기준만 남긴다.
import { useEffect, useState } from 'react';
import { INK, SUB, BG, box as box2, btn } from './theme';
import AngleSetAdmin from './AngleSetAdmin';
import ImageInput from './ImageInput';
import { REF_ITEMS, refKey, allRefKeys } from '../lib/angleRefs';
import { loadAssets, saveAsset } from '../lib/appAssets';
import { LEVEL_ITEMS, LEVEL_NAME, LEVELS_KEY, DEFAULT_CUTS, readCuts } from '../lib/angleLevels';

export default function AngleBodyAdmin() {
  return <><AngleSetAdmin /><RefAdmin /><LevelCutAdmin /></>;
}

// ── 각도 재는 화면 참고 그림 ─────────────────────────────────
// 넣는 즉시 저장한다. 비어 있으면 그 자리엔 아무것도 안 나온다.
function RefAdmin() {
  const [urls, setUrls] = useState(null);
  const [who, setWho] = useState('female');
  const [note, setNote] = useState('');
  useEffect(() => {
    let alive = true;
    loadAssets(allRefKeys()).then((m) => {
      if (!alive) return;
      const got = {};
      allRefKeys().forEach((k) => { got[k] = m[k]?.url || ''; });
      setUrls(got);
    });
    return () => { alive = false; };
  }, []);
  if (!urls) return <div style={{ ...box2, fontSize: 13, color: SUB, marginBottom: 16 }}>불러오는 중…</div>;

  const put = async (k, v) => {
    setUrls((p) => ({ ...p, [k]: v }));
    const r = await saveAsset(k, v || null, {});
    setNote(r.ok ? '저장했습니다.' : `저장 실패: ${r.why}`);
  };
  const tab = (on) => ({ padding: '7px 15px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 12.5, fontWeight: 800, background: on ? '#C9975A' : 'transparent', color: on ? '#fff' : SUB });

  return (
    <div style={{ ...box2, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>각도 재는 화면 참고 그림</div>
      <div style={{ fontSize: 12, color: SUB, lineHeight: 1.8, marginBottom: 14 }}>
        손님이 각도를 잴 때 보는 그림입니다. <b>바른 자세만</b> 보여 주세요. 넣으면 바로 저장됩니다.
        <br />영상 두 편은 잴 때 카메라 화면 <b>왼쪽 위에 작게, 소리 없이 계속 반복</b>됩니다 —
        올렸다 내리는(갔다 돌아오는) 4~5초 영상이 자연스럽습니다.
      </div>
      <div style={{ display: 'inline-flex', background: '#fff', borderRadius: 999, padding: 3, boxShadow: 'inset 0 0 0 1px #EDE9E2', marginBottom: 14 }}>
        {[['female', '여성'], ['male', '남성']].map(([k, lb]) => (
          <button key={k} type="button" onClick={() => setWho(k)} style={tab(who === k)}>{lb}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
        {REF_ITEMS.map((it) => {
          const k = refKey(it.name, who);
          const v = urls[k];
          return (
            <div key={it.name} style={{ background: BG, borderRadius: 12, padding: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: INK }}>
                {it.label}{it.video ? ' 🎬' : ''}{it.common ? <span style={{ color: SUB, fontWeight: 700 }}> · 성별 공통</span> : null}
              </div>
              <div style={{ fontSize: 11, color: SUB, fontWeight: 700, marginBottom: 6 }}>{it.where}</div>
              {v && (it.video
                ? <video src={v} autoPlay loop muted playsInline
                    style={{ width: '100%', height: 170, objectFit: 'contain', background: '#fff', borderRadius: 8, marginBottom: 6, display: 'block' }} />
                : <img src={v} alt="" style={{ width: '100%', height: 170, objectFit: 'contain', background: '#fff', borderRadius: 8, marginBottom: 6, display: 'block' }} />)}
              <ImageInput value={v} onChange={(nv) => put(k, nv)} allowVideo={!!it.video} />
            </div>
          );
        })}
      </div>
      {note && <div style={{ fontSize: 12, fontWeight: 700, marginTop: 10, color: note.startsWith('저장했') ? '#2E7D50' : '#B23B36' }}>{note}</div>}
    </div>
  );
}

// ── 단계 기준 ────────────────────────────────────────────
// 손님 그림 옆 '가벼움·보통·심함' 표시가 몇 도에서 갈리는지.
function LevelCutAdmin() {
  const [ready, setReady] = useState(false);
  const [cuts, setCuts] = useState(DEFAULT_CUTS);
  const [item, setItem] = useState(LEVEL_ITEMS[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    loadAssets([LEVELS_KEY]).then((m) => {
      if (!alive) return;
      setCuts(readCuts(m[LEVELS_KEY]?.meta));
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  if (!ready) return <div style={{ ...box2, fontSize: 13, color: SUB }}>불러오는 중…</div>;

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
    const r = await saveAsset(LEVELS_KEY, null, cuts);
    const bad = r.ok ? null : r.why;
    setBusy(false);
    setNote(bad ? `저장 실패: ${bad}` : '저장했습니다.');
  };

  return (
    <div style={{ ...box2, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>단계 기준</div>
      <div style={{ fontSize: 12, color: SUB, lineHeight: 1.8, marginBottom: 14 }}>
        손님 그림 옆에 붙는 <b>{LEVEL_NAME[1]} · {LEVEL_NAME[2]} · {LEVEL_NAME[3]}</b>가 몇 도에서 갈리는지 정합니다.
        세 항목 모두 <b>숫자가 클수록 좋은 값</b>입니다.
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
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: INK, marginBottom: 10 }}>
        {[1, 2, 3].map((lv) => (
          <span key={lv} style={{ marginRight: 12, color: lv === 1 ? '#5E9463' : lv === 2 ? '#9A7A16' : '#B23B36' }}>
            {LEVEL_NAME[lv]} <span style={{ color: SUB }}>{bandText(lv)}</span>
          </span>
        ))}
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
            <input type="range" min={item.short === 'neck' ? 40 : 0} max={item.short === 'arm' ? 180 : item.short === 'neck' ? 90 : 150} step={1} value={cut[i]}
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
