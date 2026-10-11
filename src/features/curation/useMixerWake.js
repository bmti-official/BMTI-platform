// 자기점검 층에 있는 동안, 화면을 누를 때마다 배경음악 믹서를 깨운다.
// 믹서는 '손님이 누른 그 순간'에만 켤 수 있다. 따라 하기는 누른 다음에 화면이 열리므로,
// 음악을 트는 쪽에서 켜려 하면 이미 늦다. 그래서 층 전체에서 미리 받아 둔다.
import { useEffect } from 'react';
import { prepareMixer, wakeMixer, restMixer } from './bgmMixer';

export function useMixerWake() {
  useEffect(() => {
    prepareMixer();
    const wake = () => wakeMixer();
    const opt = { capture: true, passive: true };
    const names = ['pointerdown', 'touchend', 'click', 'keydown'];
    names.forEach((n) => document.addEventListener(n, wake, opt));
    return () => {
      names.forEach((n) => document.removeEventListener(n, wake, opt));
      restMixer();
    };
  }, []);
}
