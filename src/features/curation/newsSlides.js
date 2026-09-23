// 카드뉴스 슬라이드 셈 — 화면 부품이 아니라 값만 다룬다.

/** 사진별 묶음을 한 장씩 펼친다. 같은 사진이 이어지는지 함께 표시해 둔다. */
export function flatten(groups = []) {
  const out = [];
  groups.forEach((g, gi) => {
    const texts = (g.texts || []).filter((t) => String(t || '').trim());
    (texts.length ? texts : ['']).forEach((text, ti) => {
      out.push({ image: g.image || '', y: Number(g.y) > 0 ? Number(g.y) : 88, text, sameAsBefore: ti > 0, gi });
    });
  });
  return out.slice(0, 20);   // 스무 장까지
}


/** 한 장에 담을 수 있는 글자 수. 넘으면 사진 위에서 읽기 힘들어진다. */
export const MAX_CHARS = 90;
/** 전체 장수 상한. 이보다 길면 끝까지 읽지 않는다. */
export const MAX_CARDS = 20;

/** 슬라이드 글을 이어 붙여 본문으로 만든다.
 *  정적 페이지 생성기가 body 를 읽으므로, 이걸 저장해 두어야 검색 유입이 끊기지 않는다. */
export function slidesToBody(groups = []) {
  return groups
    .flatMap((g) => (g.texts || []).map((t) => String(t || '').trim()).filter(Boolean))
    .join('\n\n');
}

/** 펼쳤을 때 몇 장이 되는지 — 관리자에서 상한을 넘었는지 보여 줄 때 쓴다. */
export const cardCount = (groups = []) =>
  groups.reduce((n, g) => n + Math.max(1, (g.texts || []).filter((t) => String(t || '').trim()).length), 0);
