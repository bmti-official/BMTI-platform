// 🔊 공통 음성 — 모든 바로카드가 함께 쓰는 소리.
// 숫자 1~20, 쉬는 시간(5·10·15·20초), 마무리. 한 번 올려 두면 카드마다 다시 만들 필요가 없다.
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { INK, SUB, LINE, BG, ACCENT, box, btn } from './theme';
import { uploadOne, AUDIO_ACCEPT } from './upload';
import { COUNT_MAX, REST_LENS, COUNT_KO, voiceKey as key } from '../features/curation/voiceCommon';

// 칸 하나 — 올리기·듣기·비우기
function Slot({ label, url, busy, onPick, onClear }) {
  return (
    <div style={{ background: url ? '#fff' : BG, borderRadius: 10, padding: '8px 10px',
      boxShadow: `inset 0 0 0 ${url ? 1 : 1}px ${url ? ACCENT : LINE}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: url ? INK : SUB, minWidth: 52 }}>{label}</span>
        <button type="button" onClick={onPick} disabled={busy}
          style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: busy ? 'default' : 'pointer',
            fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800, color: busy ? SUB : ACCENT, padding: 0 }}>
          {busy ? '올리는 중…' : url ? '바꾸기' : '＋ 올리기'}
        </button>
        {url && (
          <button type="button" onClick={onClear}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#B23B36', padding: '0 2px' }}>×</button>
        )}
      </div>
      {url && <audio src={url} controls preload="none" style={{ width: '100%', height: 28, marginTop: 5 }} />}
    </div>
  );
}

export default function VoiceCommon() {
  const [rows, setRows] = useState({});
  const [tone, setTone] = useState('z');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    let alive = true;
    supabase.from('voice_assets').select('kind, tone, n, url').then(({ data, error }) => {
      if (!alive) return;
      setLoading(false);
      if (error) { setErr(error.message); return; }
      setErr('');
      setRows(Object.fromEntries((data || []).map((r) => [key(r.kind, r.tone, r.n), r.url])));
    });
    return () => { alive = false; };
  }, []);

  // 파일 하나를 골라 올리고 그 자리에 저장한다.
  const pick = (kind, n) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = AUDIO_ACCEPT;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const k = key(kind, tone, n);
      setBusy(k); setErr('');
      const r = await uploadOne(file, { allowAudio: true });
      if (r.err) { setBusy(''); setErr(r.err); return; }
      const { error } = await supabase.from('voice_assets')
        .upsert({ kind, tone, n, url: r.url, updated_at: new Date().toISOString() });
      setBusy('');
      if (error) { setErr('저장 실패: ' + error.message); return; }
      setRows((p) => ({ ...p, [k]: r.url }));
    };
    input.click();
  };

  const clear = async (kind, n) => {
    const k = key(kind, tone, n);
    const { error } = await supabase.from('voice_assets').delete().match({ kind, tone, n });
    if (error) { setErr('지우기 실패: ' + error.message); return; }
    setRows((p) => { const next = { ...p }; delete next[k]; return next; });
  };

  const at = (kind, n) => rows[key(kind, tone, n)];
  const countDone = Array.from({ length: COUNT_MAX }, (_, i) => at('count', i + 1)).filter(Boolean).length;
  const restDone = REST_LENS.filter((n) => at('rest', n)).length;

  const slot = (kind, n, label) => (
    <Slot key={`${kind}-${n}`} label={label} url={at(kind, n)} busy={busy === key(kind, tone, n)}
      onPick={() => pick(kind, n)} onClear={() => clear(kind, n)} />
  );

  return (
    <div>
      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>공통 음성</div>
        <div style={{ fontSize: 12, color: SUB, lineHeight: 1.8 }}>
          모든 바로카드가 함께 쓰는 소리입니다. <b>한 번 올려 두면 카드마다 다시 만들지 않아도 됩니다.</b>
          <br />숫자는 영상이 한 바퀴 돌 때마다 하나씩, 쉬는 시간 멘트는 세트 사이에 흐릅니다.
          <br />mp3 · m4a · wav, 한 편에 8MB까지. 숫자는 짧게(1초 안쪽) 잘라 올리세요.
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
          {[['z', 'Z 유형 · 담백하게'], ['m', 'M 유형 · 다정하게']].map(([t, lb]) => (
            <button key={t} type="button" onClick={() => setTone(t)}
              style={{ ...btn(tone === t), opacity: 1 }}>{lb}</button>
          ))}
          <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 12, fontWeight: 800, color: SUB }}>
            숫자 {countDone}/{COUNT_MAX} · 쉬는 시간 {restDone}/{REST_LENS.length} · 마무리 {at('finish', 0) ? 1 : 0}/1
          </span>
        </div>
        {err && <div style={{ fontSize: 12.5, color: '#B23B36', fontWeight: 700, marginTop: 10 }}>{err}</div>}
        {loading && <div style={{ fontSize: 12.5, color: SUB, marginTop: 10 }}>불러오는 중…</div>}
      </div>

      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: INK, marginBottom: 4 }}>숫자 세기</div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 12 }}>
          &lsquo;하나&rsquo;부터 &lsquo;스물&rsquo;까지. 손님이 고른 횟수까지만 쓰이니 열까지만 올려도 동작합니다.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {Array.from({ length: COUNT_MAX }, (_, i) => slot('count', i + 1, `${i + 1} ${COUNT_KO[i + 1]}`))}
        </div>
      </div>

      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: INK, marginBottom: 4 }}>쉬는 시간 멘트</div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 12, lineHeight: 1.7 }}>
          고른 쉬는 시간에 맞는 것 하나가 흐릅니다. <b>끝 3초에 &lsquo;셋, 둘, 하나&rsquo;</b>를 넣어 두면
          손님이 화면을 보지 않아도 다음 세트를 준비할 수 있어요.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
          {REST_LENS.map((n) => slot('rest', n, `${n}초 쉼`))}
        </div>
      </div>

      <div style={{ ...box }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: INK, marginBottom: 4 }}>마무리 멘트</div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 12 }}>모든 세트를 마쳤을 때 한 번 흐릅니다.</div>
        <div style={{ maxWidth: 320 }}>{slot('finish', 0, '마무리')}</div>
      </div>
    </div>
  );
}
