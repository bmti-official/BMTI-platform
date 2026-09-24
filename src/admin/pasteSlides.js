// 카드뉴스 원고를 통째로 붙여넣으면 사진별 묶음으로 나눠 담는다 — 관리자 화면 전용.
//
// 받는 모양 (docs/카드뉴스-작성-프롬프트.md 가 시키는 형식)
//   [제목 · Z] …            [제목 · M] …
//   [썸네일 문구] …          [읽는 시간] 2분
//   === 사진 1 ===
//   사진 설명: …
//   글 1 · Z: …             글 1 · M: …
//   글 2 · Z: …             글 2 · M: …
//
// 사진은 따로 올린다. 여기서는 글과 자리만 잡아 두고 image는 빈 칸으로 남긴다.
const NOISE = /^(MD|\+\s*\d+|\d+\s*\/\s*\d+|-{3,}|={3,})$/;
const PHOTO = /^=*\s*사진\s*(\d+)\s*=*$/;
const SHOT = /^사진\s*설명\s*[:：]\s*(.*)$/;
const TEXT = /^글\s*(\d+)?\s*[·・.]?\s*([ZMzm])\s*[:：]\s*(.*)$/;
const HEAD = /^\[\s*([^\]]+?)\s*\]\s*(.*)$/;
const KEY = /^(제목|썸네일\s*문구|썸네일|읽는\s*시간)\s*([ZMzm])?\s*[:：]\s*(.*)$/;

// AI가 형광펜을 **굵게** 나 <mark>로 줬어도 ==형광펜== 으로 받아들인다.
const toHilite = (s) => String(s)
  .replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, '==$1==')
  .replace(/\*\*([^*\n]+)\*\*/g, '==$1==')
  .replace(/==\s*==/g, '');

// 채팅에서 복사하면 줄바꿈이 사라져 표지가 앞 문장에 붙는 일이 잦다.
// 읽기 전에 표지 앞에서 줄을 끊어 준다.
const unglue = (t) => String(t || '')
  .replace(/(?<=\S)[ \t]*(?==+\s*사진\s*\d+)/g, '\n')
  .replace(/(?<=\S)[ \t]*(?=\[[^\]\n]{1,40}\])/g, '\n')
  .replace(/(?<=\S)[ \t]*(?=사진\s*설명\s*[:：])/g, '\n')
  .replace(/(?<=\S)[ \t]*(?=글\s*\d*\s*[·・.]?\s*[ZMzm]\s*[:：])/g, '\n');

/** 붙여넣은 글에 카드뉴스 표지가 들어 있는지. 어느 해석기를 쓸지 여기서 가른다. */
export const looksLikeSlides = (text) => PHOTO.test(String(text || '').split('\n').map((l) => l.trim()).find((l) => PHOTO.test(l)) || '');

export function parseSlides(text) {
  const out = { slides_z: [], slides_m: [] };
  const filled = [];
  const put = (k, v) => { if (v) { out[k] = v; filled.push(k); } };

  let at = -1;                       // 지금 몇 번째 사진을 읽는 중인지
  let last = null;                   // 이어지는 줄을 어디에 붙일지 — { tone, i }
  let waiting = null;                // [제목 · M] 처럼 값이 다음 줄에 오는 머리말
  const need = (i) => {
    ['z', 'm'].forEach((t) => {
      while (out[`slides_${t}`].length <= i) out[`slides_${t}`].push({ image: '', y: 88, texts: [] });
    });
  };
  const putHead = (name, v) => {
    if (name.startsWith('제목')) put(name.endsWith('M') ? 'title_m' : 'title_z', v);
    else if (name.startsWith('썸네일')) put('thumb_text', v);
    else if (name.startsWith('읽는시간')) { const n = Number(String(v).replace(/[^\d]/g, '')); if (n > 0) put('read_min', n); }
  };
  const add = (tone, n, v) => {
    need(at);
    const g = out[`slides_${tone}`][at];
    const i = (Number(n) || g.texts.length + 1) - 1;
    while (g.texts.length <= i) g.texts.push('');
    g.texts[i] = toHilite(v).trim();
    last = { tone, i };
  };

  for (const raw of unglue(text).split('\n')) {
    const line = raw.replace(/\u00A0/g, ' ').trimEnd();
    const t = line.trim();
    if (!t) { last = null; continue; }
    if (NOISE.test(t) && !PHOTO.test(t)) { last = null; continue; }

    const photo = t.match(PHOTO);
    if (photo) { at = Number(photo[1]) - 1; last = null; waiting = null; continue; }

    const shot = t.match(SHOT);
    if (shot && at >= 0) { need(at); out.slides_z[at].note = shot[1].trim(); out.slides_m[at].note = shot[1].trim(); last = null; continue; }

    const txt = t.match(TEXT);
    if (txt && at >= 0) { add(txt[2].toLowerCase(), txt[1], txt[3]); continue; }

    const head = t.match(HEAD);
    if (head) {
      const name = head[1].replace(/\s+/g, '').replace(/[·・]/g, '').toUpperCase();
      const v = head[2].trim();
      // 값이 같은 줄에 없으면 다음 줄이 값이다. 프롬프트가 그렇게 시켜 놓았다.
      if (!v) { waiting = name; last = null; continue; }
      putHead(name, v);
      last = null; continue;
    }

    if (waiting) { putHead(waiting, t); waiting = null; last = null; continue; }

    const key = t.match(KEY);
    if (key) {
      const name = key[1].replace(/\s+/g, '');
      const tone = key[2] && key[2].toLowerCase() === 'm' ? 'm' : 'z';
      const v = key[3].trim();
      if (name === '제목') put(`title_${tone}`, v);
      else if (name.startsWith('썸네일')) put('thumb_text', v);
      else if (name === '읽는시간') { const n = Number(v.replace(/[^\d]/g, '')); if (n > 0) put('read_min', n); }
      last = null; continue;
    }

    // 표지가 없는 줄 — 바로 앞 글에 이어 붙인다. 긴 문장이 접혀 온 경우다.
    if (last) {
      const g = out[`slides_${last.tone}`][at];
      g.texts[last.i] = `${g.texts[last.i]} ${toHilite(t)}`.trim();
      continue;
    }
    // 머리말 없이 제목만 덩그러니 온 첫 줄은 제목으로 받아 둔다
    if (!out.title_z && at < 0 && t.length <= 40) put('title_z', t);
  }

  // 빈 묶음은 버린다 — 사진 번호가 건너뛰었을 때 생긴다
  ['z', 'm'].forEach((t) => {
    out[`slides_${t}`] = out[`slides_${t}`].filter((g) => (g.texts || []).some((x) => String(x || '').trim()));
  });
  // 사진 설명은 관리자가 읽을 메모다. 저장 칸이 따로 없으니 첫 글 앞에 붙이지 않고 떼어 둔다.
  const notes = out.slides_z.map((g) => g.note).filter(Boolean);
  ['z', 'm'].forEach((t) => out[`slides_${t}`].forEach((g) => { delete g.note; }));

  const nz = out.slides_z.reduce((n, g) => n + g.texts.filter(Boolean).length, 0);
  const nm = out.slides_m.reduce((n, g) => n + g.texts.filter(Boolean).length, 0);
  const fields = {};
  filled.forEach((k) => { fields[k] = out[k]; });
  if (out.slides_z.length) fields.slides_z = out.slides_z;
  if (out.slides_m.length) fields.slides_m = out.slides_m;

  const report = [
    filled.filter((k) => k.startsWith('title_')).length ? `제목 ${filled.filter((k) => k.startsWith('title_')).length}` : null,
    filled.includes('thumb_text') ? '썸네일 문구' : null,
    filled.includes('read_min') ? '읽는 시간' : null,
    out.slides_z.length ? `사진 ${out.slides_z.length}개 · Z ${nz}장 / M ${nm}장` : null,
  ].filter(Boolean);

  return { fields, report, notes, count: report.length };
}
