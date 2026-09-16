// 🔊 공통 음성 — 모든 바로카드가 함께 쓰는 소리.
// 숫자 1~20, 쉬는 시간(5·10·15·20초), 마무리. 한 번 올려 두면 카드마다 다시 만들 필요가 없다.
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { INK, SUB, LINE, BG, ACCENT, box, btn } from './theme';
import { uploadOne, AUDIO_ACCEPT } from './upload';
import { COUNT_MAX, REST_LENS, COUNT_KO, BGM_GROUPS, voiceKey as key, toneFor } from '../features/curation/voiceCommon';
import { CHARACTER_NAMES } from '../lib/bmtiTypes';
import { useSavedNote } from './editorState';

// 칸 하나 — 끌어다 놓거나 골라서 올리고, 듣고, 비운다
function Slot({ label, url, busy, onPick, onClear, onDrop }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setOver(false);
        const file = [...(e.dataTransfer.files || [])][0];
        if (file && onDrop) onDrop(file);
      }}
      style={{ background: over ? '#FFF6E6' : url ? '#fff' : BG, borderRadius: 10, padding: '8px 10px',
        boxShadow: `inset 0 0 0 ${over ? 2 : 1}px ${over ? ACCENT : url ? ACCENT : LINE}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 11.5, fontWeight: 900, color: url ? INK : SUB, minWidth: 52, lineHeight: 1.35 }}>{label}</span>
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
  const [hello, setHello] = useState({});
  const [tone, setTone] = useState('z');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [saved, setSaved] = useSavedNote();

  useEffect(() => {
    let alive = true;
    supabase.from('voice_assets').select('kind, tone, n, url').then(({ data, error }) => {
      if (!alive) return;
      setLoading(false);
      if (error) { setErr(error.message); return; }
      setErr('');
      setRows(Object.fromEntries((data || []).map((r) => [key(r.kind, r.tone, r.n), r.url])));
    });
    supabase.from('voice_hello').select('code, url').then(({ data }) => {
      if (alive && data) setHello(Object.fromEntries(data.map((r) => [r.code, r.url])));
    });
    return () => { alive = false; };
  }, []);

  // 캐릭터 인사 — 유형 코드마다 한 편
  const uploadHello = async (code, file) => {
    if (!file) return;
    setBusy('hello-' + code); setErr('');
    const r = await uploadOne(file, { allowAudio: true });
    if (r.err) { setBusy(''); setErr(r.err); return; }
    const { error } = await supabase.from('voice_hello')
      .upsert({ code, url: r.url, updated_at: new Date().toISOString() });
    setBusy('');
    if (error) { setErr('저장 실패: ' + error.message); return; }
    setHello((p) => ({ ...p, [code]: r.url }));
    setSaved('올렸습니다.');
  };
  const pickHello = (code) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = AUDIO_ACCEPT;
    input.onchange = () => uploadHello(code, input.files?.[0]);
    input.click();
  };
  const clearHello = async (code) => {
    const { error } = await supabase.from('voice_hello').delete().eq('code', code);
    if (error) { setErr('지우기 실패: ' + error.message); return; }
    setHello((p) => { const next = { ...p }; delete next[code]; return next; });
    setSaved('비웠습니다.');
  };

  // 파일 하나를 올려 그 자리에 담는다 — 골라서도, 끌어다 놓아서도 여기로 온다.
  const upload = async (kind, n, file) => {
    if (!file) return;
    const k = key(kind, tone, n);
    setBusy(k); setErr('');
    const r = await uploadOne(file, { allowAudio: true });
    if (r.err) { setBusy(''); setErr(r.err); return; }
    const { error } = await supabase.from('voice_assets')
      .upsert({ kind, tone: toneFor(kind, tone), n, url: r.url, updated_at: new Date().toISOString() });
    setBusy('');
    if (error) { setErr('저장 실패: ' + error.message); return; }
    setRows((p) => ({ ...p, [k]: r.url }));
    setSaved('올렸습니다.');
  };
  const pick = (kind, n) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = AUDIO_ACCEPT;
    input.onchange = () => upload(kind, n, input.files?.[0]);
    input.click();
  };

  const clear = async (kind, n) => {
    const k = key(kind, tone, n);
    const { error } = await supabase.from('voice_assets').delete().match({ kind, tone: toneFor(kind, tone), n });
    if (error) { setErr('지우기 실패: ' + error.message); return; }
    setRows((p) => { const next = { ...p }; delete next[k]; return next; });
    setSaved('비웠습니다.');
  };

  const at = (kind, n) => rows[key(kind, tone, n)];
  const countDone = Array.from({ length: COUNT_MAX }, (_, i) => at('count', i + 1)).filter(Boolean).length;
  const restDone = REST_LENS.filter((n) => at('rest', n)).length;

  const slot = (kind, n, label) => (
    <Slot key={`${kind}-${n}`} label={label} url={at(kind, n)} busy={busy === key(kind, tone, n)}
      onPick={() => pick(kind, n)} onClear={() => clear(kind, n)} onDrop={(file) => upload(kind, n, file)} />
  );

  return (
    <div>
      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>공통 음성</div>
        <div style={{ fontSize: 12, color: SUB, lineHeight: 1.8 }}>
          모든 바로카드가 함께 쓰는 소리입니다. <b>한 번 올려 두면 카드마다 다시 만들지 않아도 됩니다.</b>
          <br />숫자는 영상이 한 바퀴 돌 때마다 하나씩, 쉬는 시간 멘트는 세트 사이에 흐릅니다.
          <br />목소리는 <b>손님의 BMTI 파트너</b>입니다. 영상 속 사람이 아니라, 옆에서 같이 세어 주는 내 캐릭터예요.
          <br />파트너 16종은 도구라 성별이 없습니다. <b>여성 목소리 하나로 통일</b>하고, <b>말투(Z·M) 둘</b>로만 갈라 주세요.
          <br /><b>숫자 세기 · 방향 알림 · 카운트다운 · 자리 바꾸기는 말투도 가리지 않습니다</b> — 한 벌이면 Z·M 모두에 쓰입니다.
          <br />mp3 · m4a · wav, 한 편에 8MB까지. 숫자는 짧게(1초 안쪽) 잘라 올리세요.
          <br /><b>칸 위로 파일을 끌어다 놓아도 올라갑니다.</b> 여러 칸에 하나씩 떨어뜨리면 빠릅니다.
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: SUB, marginRight: 2 }}>말투</span>
          {[['z', 'Z · 담백'], ['m', 'M · 다정']].map(([t, lb]) => (
            <button key={t} type="button" onClick={() => setTone(t)}
              style={{ ...btn(tone === t), opacity: 1 }}>{lb}</button>
          ))}
          {saved && (
            <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 12.5, fontWeight: 800, color: '#2F7A4F', background: '#E8F3EC', borderRadius: 999, padding: '5px 12px' }}>
              ✓ {saved}
            </span>
          )}
          <span style={{ marginLeft: saved ? 0 : 'auto', alignSelf: 'center', fontSize: 12, fontWeight: 800, color: SUB }}>
            배경음악 {BGM_GROUPS.filter((g) => at('bgm', g.n)).length}/4 · 인사 {Object.keys(hello).length}/16 · 숫자 {countDone}/{COUNT_MAX} · 쉼 {restDone}/{REST_LENS.length} · 카운트다운 {at('countdown', 0) ? 1 : 0}/1 · 방향 {(at('side', 1) ? 1 : 0) + (at('side', 2) ? 1 : 0)}/2 · 자리 바꾸기 {at('switch', 0) ? 1 : 0}/1 · 마무리 {at('finish', 0) ? 1 : 0}/1
          </span>
        </div>
        {err && <div style={{ fontSize: 12.5, color: '#B23B36', fontWeight: 700, marginTop: 10 }}>{err}</div>}
        {loading && <div style={{ fontSize: 12.5, color: SUB, marginTop: 10 }}>불러오는 중…</div>}
      </div>

      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: INK, marginBottom: 4 }}>숫자 세기</div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 12 }}>
          &lsquo;하나&rsquo;부터 &lsquo;스물&rsquo;까지. 손님이 고른 횟수까지만 쓰이니 열까지만 올려도 동작합니다.
          <b> 말투를 가리지 않으니 성별당 한 벌이면 됩니다.</b>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {Array.from({ length: COUNT_MAX }, (_, i) => slot('count', i + 1, `${i + 1} ${COUNT_KO[i + 1]}`))}
        </div>
      </div>

      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: INK, marginBottom: 4 }}>쉬는 시간 멘트</div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 12, lineHeight: 1.7 }}>
          고른 쉬는 시간에 맞는 것 하나가 흐릅니다. <b>&lsquo;셋, 둘, 하나&rsquo;는 넣지 마세요</b> —
          아래 카운트다운이 남은 3초에 저절로 나갑니다. 여기엔 <b>앞부분(숨 고르기)만</b> 담으세요.
          <br />길이는 <b>쉬는 시간에서 3초를 뺀 만큼</b> 안으로 —  5초면 2초, 10초면 7초 안쪽.
          <br />세트마다 같은 파일이 나가니 &lsquo;한 세트 끝&rsquo;처럼 <b>횟수를 세는 말은 넣지 마세요.</b>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
          {REST_LENS.map((n) => slot('rest', n, `${n}초 쉼`))}
        </div>
      </div>

      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: INK, marginBottom: 4 }}>카운트다운 &lsquo;셋, 둘, 하나&rsquo;</div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 12, lineHeight: 1.7 }}>
          쉬는 시간이든 자리 바꾸기든 <b>남은 3초에 이 하나가 나갑니다.</b> 딱 3초로, 한 숫자에 1초씩 또박또박.
          <br />말투를 가리지 않으니 <b>성별당 한 벌</b>이면 됩니다.
        </div>
        <div style={{ maxWidth: 320 }}>{slot('countdown', 0, '셋, 둘, 하나')}</div>
      </div>

      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: INK, marginBottom: 4 }}>방향 알림</div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 12, lineHeight: 1.7 }}>
          좌우가 나뉘는 동작에서 <b>세트를 시작할 때마다 한 마디</b>만 짧게 흐릅니다 —
          &lsquo;오른쪽입니다&rsquo;, &lsquo;왼쪽입니다&rsquo;. 이게 끝나야 동작 멘트가 이어집니다.
          <b> 말투를 가리지 않으니 성별당 한 벌이면 됩니다.</b>
          <br />덕분에 <b>카드마다 좌우 두 벌을 녹음하지 않아도</b> 됩니다. 1초 안쪽으로 짧게 잘라 주세요.
          <br />좌우를 번갈아 하는 카드에는 쓰이지 않습니다.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
          {slot('side', 1, '오른쪽')}
          {slot('side', 2, '왼쪽')}
        </div>
      </div>

      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: INK, marginBottom: 4 }}>자리 바꾸기 멘트</div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 12, lineHeight: 1.7 }}>
          &lsquo;한쪽씩 둘 다&rsquo;로 하다가 <b>오른쪽을 마치고 왼쪽으로 넘어갈 때</b> 한 번 흐릅니다(20초).
          <b> 방향을 분명히 말해 주세요</b> — 손님이 반대로 누우면 안 되니까요.
          <br /><b>&lsquo;셋, 둘, 하나&rsquo;는 넣지 마세요</b> — 위 카운트다운이 남은 3초에 저절로 나갑니다. 17초 안쪽으로 담으세요.
          <br />좌우를 번갈아 하는 카드에는 쓰이지 않습니다.
        </div>
        <div style={{ maxWidth: 320 }}>{slot('switch', 0, '자리 바꾸기')}</div>
      </div>

      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: INK, marginBottom: 4 }}>
          배경음악 <span style={{ fontWeight: 600, color: SUB }}>— 네 곡</span>
        </div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 12, lineHeight: 1.7 }}>
          <b>가사 없는 연주곡</b>만 올리세요. 사람 목소리가 섞이면 숫자 세는 소리와 부딪힙니다.
          <br />손님 유형에 맞는 곡이 <b>처음부터 골라져</b> 있습니다 —
          활력(A)·이완(O)으로 빠르기가, 확신(D)·유연(Q)으로 박자가 갈립니다.
          <br /><b>처음부터 끝까지 같은 세기</b>로, 끝과 시작이 이어지게 만들어 주세요. 3분 안팎이면 넉넉합니다.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
          {BGM_GROUPS.map((g) => (
            <div key={g.n}>
              {slot('bgm', g.n, `${g.label} · ${g.hint}`)}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: SUB, marginTop: 10, lineHeight: 1.7 }}>
          멘트가 흐르는 동안에는 음악이 저절로 작아집니다. <b>일정한 크기로만</b> 만들어 주시면 됩니다.
        </div>
      </div>

      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: INK, marginBottom: 4 }}>
          캐릭터 인사 <span style={{ fontWeight: 600, color: SUB }}>— 유형마다 하나씩 16개</span>
        </div>
        <div style={{ fontSize: 11.5, color: SUB, marginBottom: 12, lineHeight: 1.7 }}>
          손님이 &lsquo;바로 따라하기&rsquo;를 누르면 <b>오프닝 화면에서 자기 파트너가 먼저 인사</b>합니다. 2~4초로 짧게.
          <br />여기만 유형마다 다릅니다. 나머지 공통 음성은 말투 둘로 돌아갑니다.
          <br /><b>같은 목소리로 읽되 속도와 힘만 바꾸세요.</b> 목소리가 달라지면 뒤이어 나오는 숫자 세기와 딴사람이 됩니다.
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: SUB, marginBottom: 8 }}>
          올린 것 {Object.keys(hello).length}/16
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
          {Object.keys(CHARACTER_NAMES).map((code) => (
            <Slot key={code} label={`${code} · ${CHARACTER_NAMES[code]}`} url={hello[code]}
              busy={busy === 'hello-' + code} onPick={() => pickHello(code)} onClear={() => clearHello(code)}
              onDrop={(file) => uploadHello(code, file)} />
          ))}
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
