// 검색 기록 — 무엇을 찾았고 몇 편 나왔는지만 남긴다. 누가 찾았는지는 남기지 않는다.
// 0편인 말이 곧 사전에 넣을 말이자 다음에 만들 콘텐츠다.
import { useEffect, useRef } from 'react';
import { trackAnon } from '../../lib/analytics';
import { squash } from './search';

const WAIT = 1200;   // 치는 도중의 글자('거', '거북')는 남기지 않는다 — 손이 멈춘 뒤에 한 번

/** where: 'browse' | 'pli' · n: 결과 수 · more: 함께 남길 것(고른 탭·부위 묶음) */
export function useSearchLog(where, q, n, more = {}) {
  const sent = useRef('');
  const moreRef = useRef(more);
  useEffect(() => { moreRef.current = more; });
  useEffect(() => {
    const text = String(q || '').trim();
    const key = squash(text);
    if (!key || key === sent.current) return undefined;
    const t = setTimeout(() => {
      sent.current = key;
      trackAnon('search', { at: where, q: text.slice(0, 30), n, ...moreRef.current });
    }, WAIT);
    return () => clearTimeout(t);
  }, [where, q, n]);
}

/** 찾은 뒤 무엇을 눌렀는지 — 찾고 나서 누른 비율을 본다 */
export function logSearchOpen(where, q, kind, id) {
  const text = String(q || '').trim();
  if (!text) return;
  trackAnon('search_open', { at: where, q: text.slice(0, 30), kind, id });
}

/** 부위 묶음 알약을 누른 것 */
export function logSearchGroup(where, g) {
  if (g && g !== 'all') trackAnon('search_group', { at: where, g });
}
