// 바디카드 한 편을 따라 할 때의 배경음악.
// 따라 하기를 시작하면 흐르고, 마지막 세트(last)에 닿으면 마무리 도막으로 넘어간다.
// 음악을 트는 일은 바디플리와 같은 useBgm이 맡는다.
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBgm } from './useBgm';

/** host: 설정 창 안의 자리(DOM) — 있으면 고르개를 그 안에 그린다. 없으면 카드 아래에 그린다. */
export default function CardBgm({ common, bmtiCode, quiet, last, host = null }) {
  const music = useBgm({ common, bmtiCode, quiet, pad: '12px 15px 0' });
  const outro = useRef(null);
  useEffect(() => { outro.current = music.toOutro; });
  useEffect(() => { if (last && outro.current) outro.current(); }, [last]);
  return <>{music.audios}{host ? createPortal(music.barePanel, host) : music.panel}</>;
}
