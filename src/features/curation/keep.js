// 보관하기 — 어느 화면에서 누르든 같은 보관함에 담긴다.
//
// 카드·플리·읽을거리 화면마다 손잡이를 내려보내면 줄줄이 고쳐야 해서,
// 자기점검 화면 맨 위에서 한 번 깔아 두고 버튼이 여기서 꺼내 쓴다.
// 깔려 있지 않으면(관리자 미리보기 등) 보관 버튼을 그리지 않는다.
import { createContext, useContext, useEffect, useRef } from 'react';

// { has(type, id) → bool, toggle(type, id), view(type, id) }   type: 'card' | 'routine' | 'curation'
export const KeepContext = createContext(null);

/** 이 콘텐츠의 보관 상태와 누르는 손잡이. 보관함이 없는 자리면 null */
export function useKeep(type, id) {
  const k = useContext(KeepContext);
  if (!k || id == null) return null;
  return { saved: k.has(type, id), toggle: () => k.toggle(type, id) };
}

/** 이 칸이 화면에 절반 넘게 들어와 0.7초 머물면 '봤다'로 센다(같은 창에서는 한 번). 붙일 ref를 돌려준다.
 *  넘겨 보는 창이 열리며 다른 카드가 잠깐 스쳐 지나가는 것은 세지 않는다. */
export function useViewMark(type, id) {
  const k = useContext(KeepContext);
  const ref = useRef(null);
  const view = k && k.view;
  useEffect(() => {
    const el = ref.current;
    if (!view || id == null || !el || typeof IntersectionObserver === 'undefined') return undefined;
    let t = 0;
    const io = new IntersectionObserver(([e]) => {
      clearTimeout(t);
      if (e.isIntersecting) t = setTimeout(() => { view(type, id); io.disconnect(); }, 700);
    }, { threshold: 0.55 });
    io.observe(el);
    return () => { clearTimeout(t); io.disconnect(); };
  }, [view, type, id]);
  return ref;
}
