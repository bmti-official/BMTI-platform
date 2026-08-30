// 작성 중인 내용을 지키는 장치 — 관리자 화면 전용.
// 편집 화면이 열려 있고 한 글자라도 고쳤다면, 다른 탭으로 넘어가거나
// 창을 닫으려 할 때 정말 나갈지 물어본다.
import { useEffect, useRef } from 'react';

let dirty = false;

export const isDirty = () => dirty;

// 다른 화면으로 넘어가기 전에 부른다. 그냥 가도 되면 true.
export function confirmLeave() {
  if (!dirty) return true;
  return window.confirm('작성 중인 내용이 저장되지 않았습니다.\n이동하면 지금까지 적은 내용이 사라집니다.\n\n이동할까요?');
}

// 편집 화면에서 부른다. 처음 열렸을 때와 달라졌는지를 계속 지켜본다.
// 화면을 닫으면(저장·취소·삭제) 표시도 함께 지워진다.
export function useUnsavedGuard(...values) {
  const first = useRef(JSON.stringify(values));
  useEffect(() => { dirty = JSON.stringify(values) !== first.current; });
  useEffect(() => {
    const ask = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', ask);
    return () => { window.removeEventListener('beforeunload', ask); dirty = false; };
  }, []);
}
