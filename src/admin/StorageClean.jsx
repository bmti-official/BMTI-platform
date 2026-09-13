// 🧹 파일 정리 — 저장소에는 남아 있는데 어느 글에서도 쓰지 않는 파일을 찾아 지운다.
// 사진을 바꾸거나 카드를 지워도 원본 파일은 저장소에 그대로 남는다. 그게 쌓이면 용량 요금이 붙는다.
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { INK, SUB, LINE, BG, ACCENT, box, btn } from './theme';
import { BUCKET } from './upload';

const mb = (n) => `${(Number(n || 0) / 1024 / 1024).toFixed(2)}MB`;
const fileName = (p) => p.split('/').pop();

// 글 안의 모든 값에서 저장소 주소를 긁어모은다 — 칸 이름이 늘어나도 놓치지 않는다.
function urlsIn(row) {
  const out = [];
  const walk = (v) => {
    if (typeof v === 'string') { if (v.includes(`/${BUCKET}/`)) out.push(v); return; }
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (v && typeof v === 'object') { Object.values(v).forEach(walk); }
  };
  walk(row);
  return out;
}

// 공개 주소에서 저장소 안의 자리만 떼어낸다.
const pathOf = (url) => {
  const i = String(url).indexOf(`/${BUCKET}/`);
  return i < 0 ? null : decodeURIComponent(String(url).slice(i + BUCKET.length + 2).split('?')[0]);
};

// 폴더를 한 겹씩 훑어 모든 파일을 모은다.
async function listAll(prefix = '', depth = 0) {
  if (depth > 3) return [];
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
  if (error || !data) return [];
  const out = [];
  for (const it of data) {
    const full = prefix ? `${prefix}/${it.name}` : it.name;
    if (it.id === null || !it.metadata) out.push(...await listAll(full, depth + 1));   // 폴더
    else out.push({ path: full, size: it.metadata?.size || 0, at: it.created_at });
  }
  return out;
}

export default function StorageClean() {
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [used, setUsed] = useState(null);      // 쓰이고 있는 파일 수
  const [orphans, setOrphans] = useState(null);
  const [done, setDone] = useState('');
  const [rowCount, setRowCount] = useState(0);

  const scan = async () => {
    setBusy('찾는 중…'); setErr(''); setDone(''); setOrphans(null); setUsed(null);
    try {
      // ★ 관리자로 로그인하지 않으면 글이 몇 줄만 보인다.
      //   그 상태로 훑으면 '쓰는 중'인 파일까지 안 쓰는 것으로 잡혀 통째로 지워진다.
      const { data: sess } = await supabase.auth.getSession();
      if (!sess?.session) { setBusy(''); setErr('관리자로 로그인한 뒤에 눌러 주세요. 로그인 없이 훑으면 쓰는 파일까지 안 쓰는 것으로 잡힙니다.'); return; }

      const [cur, card, voice, files] = await Promise.all([
        supabase.from('curation_items').select('*'),
        supabase.from('quick_cards').select('*'),
        supabase.from('voice_assets').select('url'),
        listAll(),
      ]);
      const bad = [cur.error, card.error, voice.error].filter(Boolean);
      if (bad.length) { setBusy(''); setErr('글을 읽지 못했습니다: ' + bad[0].message + ' — 이 상태로는 지울 수 없습니다.'); return; }

      const keep = new Set();
      [...(cur.data || []), ...(card.data || []), ...(voice.data || [])].forEach((r) => {
        urlsIn(r).forEach((u) => { const p = pathOf(u); if (p) keep.add(p); });
      });
      setUsed(keep.size);
      setRowCount((cur.data || []).length + (card.data || []).length + (voice.data || []).length);
      setOrphans(files.filter((f) => !keep.has(f.path)).sort((a, b) => b.size - a.size));
    } catch (e) {
      setErr(String(e?.message || e));
    }
    setBusy('');
  };

  const wipe = async () => {
    if (!orphans?.length) return;
    // 글은 있는데 쓰는 파일이 하나도 없다면 제대로 못 읽은 것이다. 그땐 지우지 않는다.
    if (rowCount > 0 && used === 0) {
      setErr('글은 읽었는데 쓰는 파일이 하나도 없습니다. 뭔가 잘못 읽은 것 같아 지우지 않습니다.');
      return;
    }
    const total = orphans.reduce((n, f) => n + f.size, 0);
    if (!window.confirm(`안 쓰는 파일 ${orphans.length}개(${mb(total)})를 지웁니다.\n되돌릴 수 없습니다. 지울까요?`)) return;
    setBusy('지우는 중…'); setErr('');
    // 한 번에 너무 많이 보내지 않도록 나눠 보낸다
    for (let i = 0; i < orphans.length; i += 50) {
      const { error } = await supabase.storage.from(BUCKET).remove(orphans.slice(i, i + 50).map((f) => f.path));
      if (error) { setBusy(''); setErr('지우기 실패: ' + error.message); return; }
    }
    setBusy(''); setDone(`${orphans.length}개를 지웠습니다. (${mb(total)} 비움)`);
    setOrphans([]);
  };

  const total = (orphans || []).reduce((n, f) => n + f.size, 0);

  return (
    <div>
      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>파일 정리</div>
        <div style={{ fontSize: 12, color: SUB, lineHeight: 1.8, marginBottom: 14 }}>
          사진을 바꾸거나 카드를 지워도 <b>올린 원본은 저장소에 그대로 남습니다.</b> 20MB짜리 영상이 쌓이면 용량 요금이 붙어요.
          <br />어느 글에서도 쓰지 않는 파일만 골라 보여 드립니다. <b>쓰이고 있는 파일은 절대 건드리지 않습니다.</b>
          <br />복제한 카드가 같은 파일을 함께 쓰는 경우도 &lsquo;쓰는 중&rsquo;으로 셉니다.
          <br /><b style={{ color: '#B23B36' }}>관리자로 로그인한 상태에서만</b> 훑습니다. 그래야 모든 글이 보여서 쓰는 파일을 빠뜨리지 않습니다.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <button onClick={scan} disabled={!!busy} style={{ ...btn(true), opacity: busy ? 0.5 : 1 }}>
            {busy === '찾는 중…' ? '찾는 중…' : '안 쓰는 파일 찾기'}
          </button>
          {orphans && orphans.length > 0 && (
            <button onClick={wipe} disabled={!!busy}
              style={{ ...btn(false), color: '#B23B36', fontWeight: 800, opacity: busy ? 0.5 : 1 }}>
              {orphans.length}개 지우기 ({mb(total)})
            </button>
          )}
          {used != null && <span style={{ fontSize: 12, color: SUB }}>글 {rowCount}개에서 쓰는 중 {used}개</span>}
          {done && <span style={{ fontSize: 12.5, fontWeight: 800, color: '#2F7A4F', background: '#E8F3EC', borderRadius: 999, padding: '5px 12px' }}>✓ {done}</span>}
        </div>
        {err && <div style={{ fontSize: 12.5, color: '#B23B36', fontWeight: 700, marginTop: 10 }}>{err}</div>}
      </div>

      {orphans && (
        <div style={{ ...box, padding: 0, overflowX: 'auto' }}>
          {orphans.length === 0 ? (
            <div style={{ padding: 20, fontSize: 13, color: SUB }}>안 쓰는 파일이 없습니다. 깨끗해요.</div>
          ) : (
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 520 }}>
              <thead>
                <tr style={{ background: BG }}>
                  {['파일', '크기', '올린 날'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11.5, fontWeight: 800, color: SUB, borderBottom: `1px solid ${LINE}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orphans.slice(0, 200).map((f) => (
                  <tr key={f.path}>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: INK }}>
                      <a href={supabase.storage.from(BUCKET).getPublicUrl(f.path).data.publicUrl} target="_blank" rel="noreferrer"
                        style={{ color: ACCENT, fontWeight: 700, textDecoration: 'none' }}>{fileName(f.path)}</a>
                      <span style={{ color: SUB, marginLeft: 6, fontSize: 11 }}>{f.path.replace(fileName(f.path), '').replace(/\/$/, '') || '/'}</span>
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: SUB, whiteSpace: 'nowrap' }}>{mb(f.size)}</td>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${LINE}`, fontSize: 12, color: SUB, whiteSpace: 'nowrap' }}>
                      {f.at ? new Date(f.at).toLocaleDateString('ko-KR') : '—'}
                    </td>
                  </tr>
                ))}
                {orphans.length > 200 && (
                  <tr><td colSpan={3} style={{ padding: '10px 12px', fontSize: 12, color: SUB }}>… 그리고 {orphans.length - 200}개 더 (지우기는 전부 지웁니다)</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
