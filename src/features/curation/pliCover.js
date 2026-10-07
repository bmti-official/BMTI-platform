// 플리의 표지 — 따로 올린 표지가 있으면 그것, 없으면 첫 동작의 그림을 빌린다.
// 큰 격자(PliGrid)와 둘러보기의 작은 칸이 함께 쓴다.
import { isClip } from './media';

export function pliCover(r) {
  const first = (r.cards || [])[0] || {};
  const base = r.cover_url ? r : { ...first, thumb_text: r.thumb_text };
  return {
    item: { ...base, thumb_text: r.thumb_text || base.thumb_text },
    clip: r.cover_url ? (isClip(r.cover_url) ? r.cover_url : '') : (first.video_url || ''),
    still: r.cover_url ? '' : (first.poster_url || ''),
  };
}
