// 사진을 끌어다 놓거나 골라서 바로 올리는 칸 — 관리자 화면 전용.
// Supabase Storage의 'curation' 버킷에 올리고, 공개 주소를 그대로 칸에 채운다.
// 주소를 직접 붙여넣던 방식도 그대로 쓸 수 있다.
import { useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { INK, SUB, LINE, ACCENT, input } from './theme';

export const BUCKET = 'curation';

const MAX_MB = 5;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

// 파일 이름은 한글·공백이 섞여도 안전하게 새로 지어 준다.
function safeName(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${ym}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

export default function ImageInput({ value, onChange, placeholder = 'https://... (또는 사진을 끌어다 놓으세요)', hint }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    setErr('');
    if (!OK_TYPES.includes(file.type)) { setErr('사진 파일만 올릴 수 있어요 (jpg · png · webp · gif).'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setErr(`${MAX_MB}MB보다 작은 사진으로 올려 주세요.`); return; }
    setBusy(true);
    const path = safeName(file);
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '31536000', upsert: false });
    setBusy(false);
    if (error) {
      const m = String(error.message || '');
      if (/not found|does not exist/i.test(m)) setErr(`'${BUCKET}' 저장소가 아직 없어요. Supabase → Storage → New bucket에서 이름 '${BUCKET}', Public 체크로 하나 만들어 주세요.`);
      else if (/policy|permission|unauthorized/i.test(m)) setErr('올릴 권한이 없어요. 04_storage.sql을 한 번 실행해 주세요.');
      else setErr('올리기 실패: ' + m);
      return;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    onChange(data.publicUrl);
  };

  const onDrop = (e) => {
    e.preventDefault(); setOver(false);
    upload(e.dataTransfer.files?.[0]);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      style={{ borderRadius: 10, padding: over ? 6 : 0, background: over ? '#FFF6E6' : 'transparent', boxShadow: over ? `inset 0 0 0 2px ${ACCENT}` : 'none' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        {/* 올라간 사진 미리보기 */}
        <span style={{ width: 62, height: 40, flexShrink: 0, borderRadius: 7, overflow: 'hidden', background: '#fff', boxShadow: `inset 0 0 0 1px ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: SUB }}>
          {value ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '없음'}
        </span>
        <input style={{ ...input, flex: 1 }} value={value || ''} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
          style={{ padding: '9px 13px', fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit', borderRadius: 9, whiteSpace: 'nowrap',
            border: 'none', cursor: busy ? 'default' : 'pointer', background: busy ? '#fff' : ACCENT, color: busy ? SUB : '#fff',
            boxShadow: busy ? `inset 0 0 0 1px ${LINE}` : 'none' }}>
          {busy ? '올리는 중…' : '사진 올리기'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      {(hint || err) && (
        <div style={{ fontSize: 11.5, fontWeight: 600, color: err ? '#C0392B' : SUB, marginTop: 5, lineHeight: 1.5 }}>
          {err || hint}
        </div>
      )}
      {value && !err && (
        <button type="button" onClick={() => onChange('')}
          style={{ marginTop: 5, padding: 0, border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, color: INK, cursor: 'pointer', textDecoration: 'underline' }}>
          사진 비우기
        </button>
      )}
    </div>
  );
}
