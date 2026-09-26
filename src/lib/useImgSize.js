// 그림의 원래 크기 — 그림 위에 선을 그을 때 좌표를 맞추려고 쓴다.
import { useEffect, useState } from 'react';

export function useImgSize(url) {
  const [size, setSize] = useState(null);
  useEffect(() => {
    let alive = true;
    const im = new Image();
    im.onload = () => { if (alive) setSize({ url, w: im.naturalWidth, h: im.naturalHeight }); };
    im.src = url;
    return () => { alive = false; };
  }, [url]);
  // 그림이 바뀌면 새로 불러올 때까지 옛 크기를 쓰지 않는다
  return size && size.url === url ? size : null;
}
