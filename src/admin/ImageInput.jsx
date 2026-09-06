// 사진을 끌어다 놓거나 골라서 바로 올리는 칸 — 관리자 화면 전용.
// Supabase Storage의 'curation' 버킷에 올리고, 공개 주소를 그대로 칸에 채운다.
// 주소를 직접 붙여넣던 방식도 그대로 쓸 수 있다.
import { useRef, useState } from 'react';
import { INK, SUB, LINE, ACCENT, input } from './theme';
import { isClip } from '../features/curation/media';
import { uploadOne } from './upload';

// 끌어다 놓는 자리 공통 껍데기
function DropZone({ over, setOver, onFiles, children }) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles([...(e.dataTransfer.files || [])]); }}
      style={{ borderRadius: 10, padding: over ? 6 : 0, background: over ? '#FFF6E6' : 'transparent', boxShadow: over ? `inset 0 0 0 2px ${ACCENT}` : 'none' }}>
      {children}
    </div>
  );
}

const uploadBtn = (busy) => ({
  padding: '9px 13px', fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit', borderRadius: 9, whiteSpace: 'nowrap',
  border: 'none', cursor: busy ? 'default' : 'pointer', background: busy ? '#fff' : ACCENT, color: busy ? SUB : '#fff',
  boxShadow: busy ? `inset 0 0 0 1px ${LINE}` : 'none',
});

const errStyle = { fontSize: 11.5, fontWeight: 700, color: '#C0392B', marginTop: 5, lineHeight: 1.5 };
const hintStyle = { fontSize: 11.5, fontWeight: 600, color: SUB, marginTop: 5, lineHeight: 1.5 };

// ── 한 장짜리 (대표 이미지) ───────────────────────────────────────
export default function ImageInput({ value, onChange, placeholder = 'https://... (또는 사진을 끌어다 놓으세요)', hint, allowVideo = false }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);

  const onFiles = async (files) => {
    const file = files[0];
    if (!file) return;
    setErr(''); setBusy(true);
    const r = await uploadOne(file, allowVideo);
    setBusy(false);
    if (r.err) { setErr(r.err); return; }
    onChange(r.url);
  };

  return (
    <DropZone over={over} setOver={setOver} onFiles={onFiles}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ width: 62, height: 40, flexShrink: 0, borderRadius: 7, overflow: 'hidden', background: '#fff', boxShadow: `inset 0 0 0 1px ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: SUB }}>
          {!value ? '없음' : isClip(value)
            ? <video src={value} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />
            : <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#fff' }} />}
        </span>
        <input style={{ ...input, flex: 1 }} value={value || ''} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} style={uploadBtn(busy)}>
          {busy ? '올리는 중…' : allowVideo ? '영상 올리기' : '사진 올리기'}
        </button>
        <input ref={fileRef} type="file" accept={allowVideo ? 'video/mp4,video/webm,video/quicktime' : 'image/*'} style={{ display: 'none' }}
          onChange={(e) => { onFiles([...(e.target.files || [])]); e.target.value = ''; }} />
      </div>
      {(hint || err) && <div style={err ? errStyle : hintStyle}>{err || hint}</div>}
      {value && !err && (
        <button type="button" onClick={() => onChange('')}
          style={{ marginTop: 5, padding: 0, border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, color: INK, cursor: 'pointer', textDecoration: 'underline' }}>
          {allowVideo ? '영상 비우기' : '사진 비우기'}
        </button>
      )}
    </DropZone>
  );
}

// ── 여러 장짜리 (본문 마디) ───────────────────────────────────────
// 올린 순서대로 글에 위에서 아래로 들어간다. ←→로 순서를 바꾸고 ×로 뺀다.
export function ImageListInput({ value, onChange, hint, captions, onCaptions, allowVideo = true }) {
  const list = Array.isArray(value) ? value : (value ? [value] : []);
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);
  const [url, setUrl] = useState('');

  const onFiles = async (files) => {
    if (!files.length) return;
    setErr(''); setBusy(true);
    const added = [];
    const bad = [];
    for (const file of files) {
      const r = await uploadOne(file, allowVideo);
      if (r.err) bad.push(r.err); else added.push(r.url);
    }
    setBusy(false);
    if (added.length) onChange([...list, ...added]);
    if (bad.length) setErr(bad.join(' / '));
  };

  const caps = Array.isArray(captions) ? captions : [];
  const capAt = (i) => caps[i] || '';
  const setCap = (i, v) => {
    if (!onCaptions) return;
    const next = [...caps];
    while (next.length < list.length) next.push('');
    next[i] = v;
    onCaptions(next);
  };

  const move = (i, d) => {
    const next = [...list];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    if (onCaptions) {
      const c = [...caps];
      while (c.length < list.length) c.push('');
      [c[i], c[j]] = [c[j], c[i]];
      onCaptions(c);
    }
  };

  const removeAt = (i) => {
    onChange(list.filter((_, k) => k !== i));
    if (onCaptions) onCaptions(caps.filter((_, k) => k !== i));
  };

  const addUrl = () => {
    const v = url.trim();
    if (!v) return;
    onChange([...list, v]);
    setUrl('');
  };

  return (
    <DropZone over={over} setOver={setOver} onFiles={onFiles}>
      {list.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {list.map((src, i) => (
            <span key={`${src}-${i}`} style={{ width: onCaptions ? 150 : 92, borderRadius: 9, overflow: 'hidden', background: '#fff', boxShadow: `inset 0 0 0 1px ${LINE}` }}>
              {isClip(src)
                ? <video src={src} muted playsInline preload="metadata" style={{ width: '100%', height: 60, objectFit: 'cover', display: 'block', background: '#000' }} />
                : <img src={src} alt="" style={{ width: '100%', height: 60, objectFit: 'cover', display: 'block', background: '#fff' }} />}
              {onCaptions && (
                <input value={capAt(i)} onChange={(e) => setCap(i, e.target.value)} placeholder="사진 설명 (선택)"
                  style={{ width: '100%', boxSizing: 'border-box', border: 'none', borderTop: `1px solid ${LINE}`, padding: '5px 6px', fontSize: 11, fontFamily: 'inherit', color: INK, outline: 'none' }} />
              )}
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 5px' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: SUB }}>{i + 1}</span>
                <span style={{ display: 'flex', gap: 2 }}>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="앞으로"
                    style={{ border: 'none', background: 'transparent', cursor: i === 0 ? 'default' : 'pointer', fontSize: 12, color: i === 0 ? LINE : SUB, padding: '0 2px' }}>←</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} title="뒤로"
                    style={{ border: 'none', background: 'transparent', cursor: i === list.length - 1 ? 'default' : 'pointer', fontSize: 12, color: i === list.length - 1 ? LINE : SUB, padding: '0 2px' }}>→</button>
                  <button type="button" onClick={() => removeAt(i)} title="빼기"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#B23B36', padding: '0 2px' }}>×</button>
                </span>
              </span>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <input style={{ ...input, flex: 1 }} value={url} placeholder="사진을 끌어다 놓거나, 주소를 붙여넣고 '주소 추가'"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }} />
        {url.trim() && <button type="button" onClick={addUrl} style={{ ...uploadBtn(false), background: '#fff', color: SUB, boxShadow: `inset 0 0 0 1px ${LINE}` }}>주소 추가</button>}
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} style={uploadBtn(busy)}>
          {busy ? '올리는 중…' : '사진·영상 올리기'}
        </button>
        <input ref={fileRef} type="file" accept={allowVideo ? 'image/*,video/mp4,video/webm,video/quicktime' : 'image/*'} multiple style={{ display: 'none' }}
          onChange={(e) => { onFiles([...(e.target.files || [])]); e.target.value = ''; }} />
      </div>
      {(hint || err) && <div style={err ? errStyle : hintStyle}>{err || hint}</div>}
    </DropZone>
  );
}
