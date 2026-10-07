// 플리의 표지에 쓸 것 — 그림과 문구. 큰 격자·둘러보기의 작은 칸·추천루틴·펼친 화면이 함께 쓴다.
//
// 그림: 담긴 동작의 그림을 담긴 차례대로. 표지를 따로 올리지 않는다.
// 문구: 적어 둔 표지 문구. 없으면 그림만 보이고, 제목이 따로 안 보이는 작은 칸에서는 제목을 대신 얹는다.
import { clipY } from './format';

/** 표지에 차례로 나올 그림들 — [{ url, y(위아래 어디를 보일지) }] */
export function pliFrames(pli, cards) {
  return (cards || pli?.cards || [])
    .map((c) => ({ url: c.poster_url || '', y: clipY(c) }))
    .filter((f) => f.url);
}

// 제목을 표지에 얹을 때 — 띄어쓰기에서 끊어 두세 줄로. 줄 길이가 비슷해지게 나눈다(한 줄에 열 자 안팎).
function wrapTitle(title) {
  const words = String(title || '').trim().split(/\s+/).filter(Boolean);
  const total = words.join(' ').length;
  const rows = Math.min(3, Math.max(1, Math.ceil(total / 10)));
  const target = total / rows;
  const lines = [];
  words.forEach((w) => {
    const last = lines.length - 1;
    if (last >= 0 && (lines[last].length + 1 + w.length <= target + 1 || lines.length >= rows)) lines[last] += ` ${w}`;
    else lines.push(w);
  });
  return lines.join('\n');
}

/** 표지에 얹을 글 — titleIfEmpty: 적어 둔 문구가 없을 때 제목을 대신 쓸지 */
export function pliCoverText(pli, titleIfEmpty = false) {
  const own = String(pli?.thumb_text || '').trim();
  if (own) return own;
  return titleIfEmpty ? wrapTitle(pli?.title_z || pli?.title || '') : '';
}

/**
 * 표지 문구의 모양 — 어디서나 한 가지다. 아래 가운데, 바디카드와 같은 둥근 글씨, 흰 글씨에 파란 형광펜.
 * 문구 대신 제목을 얹을 땐 글이 길어서 조금 작게 쓴다. text: 고치는 중인 문구(편집 창 미리보기)
 */
export function pliCoverItem(pli, { titleIfEmpty = false, text = null } = {}) {
  const own = text != null ? String(text).trim() : pliCoverText(pli, false);
  const words = own || (titleIfEmpty ? pliCoverText(pli, true) : '');
  return { thumb_text: words, thumb_pos: 'bc', thumb_color: '#FFFFFF', thumb_font: 'rounded', thumb_scale: own ? 160 : 125, kind: 'pli' };
}
