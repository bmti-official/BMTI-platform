// 플리 표지 — 담긴 동작의 그림이 담긴 차례대로 3초마다 넘어간다. 표지를 따로 올리지 않는다.
// 문구는 적어 둔 표지 문구를 얹는다. 없으면 그림만 보인다(titleIfEmpty면 제목을 대신 얹는다).
import { CurationThumb } from './CurationCard';
import { useCoverTick } from './coverTick';
import { pliFrames, pliCoverItem } from './pliFrames';

// lift: 칸 아래 모서리에 표(시간·동작 수)를 얹는 곳에서, 문구가 그 표에 가리지 않게 올릴 높이(px)
export default function PliCover({ pli, cards = null, radius = 12, ratio = '4 / 5', big = false, titleIfEmpty = false, text = null, emptyText = '', lift = 0 }) {
  const tick = useCoverTick();
  const list = cards || pli?.cards || [];
  const frames = pliFrames(pli, list);
  const item = pliCoverItem(pli, { titleIfEmpty, text });
  return (
    <CurationThumb item={item} radius={radius} ratio={ratio} big={big} showRead={false}
      frames={frames} frameAt={tick} textLift={lift}
      // 그림이 아직 없는 동작뿐이면(격자용 그림을 안 뽑은 카드) 첫 동작의 영상을 대신 깐다
      clip={frames.length ? '' : ((list[0] || {}).video_url || '')}
      emptyText={emptyText} />
  );
}
