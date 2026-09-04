// AI 음성 올리는 칸 — 관리자 화면 전용.
// 한 편짜리(오프닝)와 세트별 여러 편짜리를 함께 담았다.
import { useRef, useState } from 'react';
import { INK, SUB, LINE, ACCENT, input } from './theme';
import { uploadOne, AUDIO_ACCEPT } from './upload';

const upBtn = (busy) => ({
  padding: '9px 13px', fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit', borderRadius: 9, whiteSpace: 'nowrap',
  border: 'none', cursor: busy ? 'default' : 'pointer', background: busy ? '#fff' : ACCENT, color: busy ? SUB : '#fff',
  boxShadow: busy ? `inset 0 0 0 1px ${LINE}` : 'none',
});
const errStyle = { fontSize: 11.5, fontWeight: 700, color: '#C0392B', marginTop: 5, lineHeight: 1.5 };
const hintStyle = { fontSize: 11.5, fontWeight: 600, color: SUB, marginTop: 5, lineHeight: 1.5 };

// 들어 보는 작은 재생기 — 브라우저 기본 모양을 그대로 쓴다.
function Play({ src }) {
  if (!src) return null;
  return <audio src={src} controls preload="none" style={{ width: '100%', height: 32, marginTop: 6 }} />;
}

// ── 한 편짜리 (오프닝 멘트) ───────────────────────────────────────
export default function AudioInput({ value, onChange, hint, placeholder = 'https://... (또는 소리 파일을 끌어다 놓으세요)' }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);

  const onFiles = async (files) => {
    const file = files[0];
    if (!file) return;
    setErr(''); setBusy(true);
    const r = await uploadOne(file, { allowAudio: true });
    setBusy(false);
    if (r.err) { setErr(r.err); return; }
    onChange(r.url);
  };

  return (
    <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles([...(e.dataTransfer.files || [])]); }}
      style={{ borderRadius: 10, padding: over ? 6 : 0, background: over ? '#FFF6E6' : 'transparent', boxShadow: over ? `inset 0 0 0 2px ${ACCENT}` : 'none' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <input style={{ ...input, flex: 1 }} value={value || ''} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} style={upBtn(busy)}>
          {busy ? '올리는 중…' : '음성 올리기'}
        </button>
        <input ref={fileRef} type="file" accept={AUDIO_ACCEPT} style={{ display: 'none' }}
          onChange={(e) => { onFiles([...(e.target.files || [])]); e.target.value = ''; }} />
      </div>
      <Play src={value} />
      {(hint || err) && <div style={err ? errStyle : hintStyle}>{err || hint}</div>}
      {value && !err && (
        <button type="button" onClick={() => onChange('')}
          style={{ marginTop: 5, padding: 0, border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, color: INK, cursor: 'pointer', textDecoration: 'underline' }}>
          음성 비우기
        </button>
      )}
    </div>
  );
}

// ── 세트별 여러 편짜리 ────────────────────────────────────────────
// 올린 차례대로 1세트째부터 쓴다. 세트 수보다 적게 올리면 마지막 것을 이어서 쓴다.
export function AudioListInput({ value, onChange, hint, max = 5 }) {
  const list = Array.isArray(value) ? value : (value ? [value] : []);
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);

  const onFiles = async (files) => {
    if (!files.length) return;
    setErr(''); setBusy(true);
    const added = []; const bad = [];
    for (const file of files.slice(0, Math.max(0, max - list.length))) {
      const r = await uploadOne(file, { allowAudio: true });
      if (r.err) bad.push(r.err); else added.push(r.url);
    }
    setBusy(false);
    if (added.length) onChange([...list, ...added].slice(0, max));
    if (bad.length) setErr(bad.join(' / '));
  };

  const move = (i, d) => {
    const next = [...list]; const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles([...(e.dataTransfer.files || [])]); }}
      style={{ borderRadius: 10, padding: over ? 6 : 0, background: over ? '#FFF6E6' : 'transparent', boxShadow: over ? `inset 0 0 0 2px ${ACCENT}` : 'none' }}>
      {list.map((src, i) => (
        <div key={`${src}-${i}`} style={{ background: '#fff', borderRadius: 9, boxShadow: `inset 0 0 0 1px ${LINE}`, padding: '7px 9px', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: INK, flexShrink: 0 }}>{i + 1}세트째</span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="앞으로"
                style={{ border: 'none', background: 'transparent', cursor: i === 0 ? 'default' : 'pointer', fontSize: 12, color: i === 0 ? LINE : SUB, padding: '0 2px' }}>←</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} title="뒤로"
                style={{ border: 'none', background: 'transparent', cursor: i === list.length - 1 ? 'default' : 'pointer', fontSize: 12, color: i === list.length - 1 ? LINE : SUB, padding: '0 2px' }}>→</button>
              <button type="button" onClick={() => onChange(list.filter((_, k) => k !== i))} title="빼기"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#B23B36', padding: '0 2px' }}>×</button>
            </span>
          </div>
          <Play src={src} />
        </div>
      ))}
      <button type="button" onClick={() => fileRef.current?.click()} disabled={busy || list.length >= max} style={upBtn(busy || list.length >= max)}>
        {busy ? '올리는 중…' : list.length >= max ? `${max}개까지예요` : '＋ 세트 멘트 올리기'}
      </button>
      <input ref={fileRef} type="file" accept={AUDIO_ACCEPT} multiple style={{ display: 'none' }}
        onChange={(e) => { onFiles([...(e.target.files || [])]); e.target.value = ''; }} />
      {(hint || err) && <div style={err ? errStyle : hintStyle}>{err || hint}</div>}
    </div>
  );
}
