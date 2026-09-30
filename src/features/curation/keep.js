// 보관하기 — 어느 화면에서 누르든 같은 보관함에 담긴다.
//
// 카드·플리·읽을거리 화면마다 손잡이를 내려보내면 줄줄이 고쳐야 해서,
// 자기점검 화면 맨 위에서 한 번 깔아 두고 버튼이 여기서 꺼내 쓴다.
// 깔려 있지 않으면(관리자 미리보기 등) 보관 버튼을 그리지 않는다.
import { createContext, useContext } from 'react';

// { has(type, id) → bool, toggle(type, id) }   type: 'card' | 'routine' | 'curation'
export const KeepContext = createContext(null);

/** 이 콘텐츠의 보관 상태와 누르는 손잡이. 보관함이 없는 자리면 null */
export function useKeep(type, id) {
  const k = useContext(KeepContext);
  if (!k || id == null) return null;
  return { saved: k.has(type, id), toggle: () => k.toggle(type, id) };
}
