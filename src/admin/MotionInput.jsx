// 동작 데이터(JSON) 올리기 — 관리자 화면 전용.
// bmti-official.co.kr/tools/motion.html 에서 받은 파일을 그대로 끌어다 놓으면 된다.
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { INK, SUB, LINE, ACCENT, input } from './theme';
import { checkMotion } from '../lib/motionPose';
import MotionPlayer from '../features/curation/MotionPlayer';

const BUCKET = 'curation';
const TOOL = '/tools/motion.html';

export default function MotionInput({ value, onChange }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);
  const [motion, setMotion] = useState(null);

  // 이미 올려 둔 파일이 있으면 읽어 와서 미리 돌려 본다.
  // 결과 처리를 .then 안에서 해야 effect 본문에서 곧바로 상태를 바꾸지 않게 된다.
  useEffect(() => {
    let alive = true;
    // 값이 비었을 때는 fetch가 곧바로 끊기도록 만들어, effect 본문에서 상태를 건드리지 않는다.
    (value ? fetch(value) : Promise.reject(new Error('없음')))
      .then((r) => r.json())
      .then((m) => {
        if (!alive) return;
        const bad = checkMotion(m);
        if (bad) { setErr(bad); setMotion(null); } else { setErr(''); setMotion(m); }
      })
      .catch((e) => {
        if (!alive) return;
        setMotion(null);
        if (value) setErr('올려 둔 동작 데이터를 읽지 못했습니다.'); else if (e) setErr('');
      });
    return () => { alive = false; };
  }, [value]);

  const upload = async (file) => {
    if (!file) return;
    setErr('');
    if (!/\.json$/i.test(file.name)) { setErr('동작 뽑기 도구에서 받은 .json 파일만 올릴 수 있어요.'); return; }
    let parsed;
    try { parsed = JSON.parse(await file.text()); }
    catch { setErr('파일을 읽지 못했습니다. 도구에서 다시 내려받아 주세요.'); return; }
    const bad = checkMotion(parsed);
    if (bad) { setErr(bad); return; }

    setBusy(true);
    const path = `motions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(path, new Blob([JSON.stringify(parsed)], { type: 'application/json' }), { cacheControl: '31536000', upsert: false });
    setBusy(false);
    if (error) {
      const m = String(error.message || '');
      setErr(/policy|permission|unauthorized/i.test(m) ? '올릴 권한이 없어요. 04_storage.sql을 실행했는지 확인해 주세요.' : '올리기 실패: ' + m);
      return;
    }
    onChange(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files?.[0]); }}
      style={{ borderRadius: 10, padding: over ? 6 : 0, background: over ? '#FFF6E6' : 'transparent', boxShadow: over ? `inset 0 0 0 2px ${ACCENT}` : 'none' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', minWidth: 220 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...input, flex: 1 }} value={value || ''} placeholder="동작 파일을 끌어다 놓으세요"
              onChange={(e) => onChange(e.target.value)} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
              style={{ padding: '9px 13px', fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit', borderRadius: 9, whiteSpace: 'nowrap',
                border: 'none', cursor: busy ? 'default' : 'pointer', background: busy ? '#fff' : ACCENT, color: busy ? SUB : '#fff',
                boxShadow: busy ? `inset 0 0 0 1px ${LINE}` : 'none' }}>
              {busy ? '올리는 중…' : '동작 올리기'}
            </button>
            <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }}
              onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
          <div style={{ fontSize: 11.5, color: err ? '#C0392B' : SUB, fontWeight: err ? 700 : 600, marginTop: 6, lineHeight: 1.6 }}>
            {err || <>영상에서 동작을 뽑으려면 <a href={TOOL} target="_blank" rel="noreferrer" style={{ color: ACCENT, fontWeight: 800 }}>🎬 동작 뽑기 도구</a>를 여세요.</>}
          </div>
          {motion && (
            <div style={{ fontSize: 11.5, color: SUB, marginTop: 6, lineHeight: 1.7 }}>
              <b style={{ color: INK }}>{motion.name || '이름 없는 동작'}</b> · {motion.frames}프레임 ·
              {' '}{(motion.frames / (motion.fps || 12)).toFixed(1)}초 반복
              <br />
              <button type="button" onClick={() => onChange('')}
                style={{ padding: 0, border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, color: INK, cursor: 'pointer', textDecoration: 'underline' }}>
                동작 비우기
              </button>
            </div>
          )}
        </div>
        <div style={{ flex: '0 0 150px' }}>
          {motion
            ? <MotionPlayer motion={motion} size={150} />
            : <div style={{ width: 150, height: 150, borderRadius: 12, background: '#fff', boxShadow: `inset 0 0 0 1px ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, color: SUB, fontWeight: 700 }}>동작 없음</div>}
        </div>
      </div>
    </div>
  );
}
