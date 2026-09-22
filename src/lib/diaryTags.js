// 오늘의 태그 — 갈래와 부담 셈.
//
// '오늘 평소보다 무리했나요' 질문을 없애고 그 자리를 태그가 맡는다.
// 예전 '무리한 이유' 넷(오래 앉음·오래 선 자세·많이 걸음·무거운 물건 들기)도
// 활동·환경 태그로 들어왔고, 업무과다가 새로 생겼다.
//
// 부담인지 아닌지는 **갈래가 아니라 태그마다** 정한다.
// 갈래로 묶어 두면 나중에 항목 하나를 더할 때 저도 모르게 부담이 되어 버린다.
//   strain 2 … 몸이 이미 신호를 보낸 것, 또는 확실히 무거운 것
//   strain 1 … 쌓이면 부담이 되는 것
//   strain 0 … 부담이 아닌 것
//
// 음식 섭취는 부담 점수에서 뺀다. 각도보다 잠·불편함과 엮이는 게 자연스럽다.
// 막대그래프에는 그대로 나온다.

export const TAG_CATEGORIES = [
  {
    id: 'food',
    title: '음식 섭취',
    scored: false,                 // 부담 점수에 넣지 않는다
    tags: [
      { label: '카페인', icon: 'caffeine', strain: 1 },
      { label: '음주', icon: 'alcohol', strain: 1 },
      { label: '야식·과식', icon: 'snacking', strain: 1 },
      { label: '수분 보충', icon: 'water', strain: 0 },
      { label: '맵거나 짠 음식', icon: 'spicy', strain: 1 },
      { label: '달달 디저트', icon: 'dessert', strain: 1 },
      { label: '영양제', icon: 'supplement', strain: 0 },
    ],
  },
  {
    id: 'act',
    title: '활동·환경',
    scored: true,
    tags: [
      { label: '스마트폰·PC', icon: 'phone', strain: 1 },
      { label: '오래 앉음', icon: 'sitLong', strain: 1 },
      { label: '오래 선 자세', icon: 'standLong', strain: 1 },
      { label: '많이 걸음', icon: 'walkLot', strain: 1 },
      { label: '무거운 물건 들기', icon: 'liftHeavy', strain: 2 },
      { label: '업무과다', icon: 'overwork', strain: 2 },
      { label: '장거리 운전', icon: 'driving', strain: 1 },
      { label: '불편한 신발', icon: 'shoes', strain: 1 },
      { label: '무거운 짐', icon: 'heavyBag', strain: 2 },
      { label: '에어컨·추위', icon: 'coldAir', strain: 1 },
    ],
  },
  {
    id: 'body',
    title: '상태·기타',
    scored: true,
    tags: [
      { label: '스트레스', icon: 'stress', strain: 1 },
      { label: '긴장함', icon: 'nervous', strain: 1 },
      { label: '방전됨', icon: 'drained', strain: 2 },
      { label: '소화 불량', icon: 'indigestion', strain: 1 },
      // 본인이 고를 수 있는 게 아니다. 점수에는 넣되 '무리했다'는 말은 붙이지 않는다.
      { label: '생리 중', icon: 'period', strain: 1, femaleOnly: true, notMyFault: true },
      { label: '진통제', icon: 'medicine', strain: 2 },
    ],
  },
];

export const ALL_TAGS = TAG_CATEGORIES.flatMap((c) => c.tags.map((t) => ({ ...t, cat: c.id, scored: c.scored })));
export const TAG_BY_LABEL = Object.fromEntries(ALL_TAGS.map((t) => [t.label, t]));
export const TAG_LABEL_TO_ICON = Object.fromEntries(ALL_TAGS.map((t) => [t.label, t.icon]));

/** 하루치 부담 점수. 고른 태그의 무게를 더한다. 음식 섭취는 세지 않는다. */
export function strainScore(labels = []) {
  return labels.reduce((n, lb) => {
    const t = TAG_BY_LABEL[lb];
    return n + (t && t.scored ? t.strain : 0);
  }, 0);
}

/** 점수를 말로 옮긴다. 숫자만 보여 주면 '내가 몇 점짜리 하루였나'가 되어 버린다. */
export function strainWord(score) {
  if (score <= 0) return '가벼운 날';
  if (score <= 2) return '보통';
  if (score <= 5) return '좀 많았던 날';
  return '많이 쌓인 날';
}

/** 한 달치 기록에서 태그가 며칠에 나왔는지 센다.
 *  분모는 '기록한 날 수'다. 고른 횟수 총합으로 나누면 태그를 많이 고른 날이 과하게 반영된다. */
export function tagShare(entries = []) {
  const days = entries.length;
  const count = {};
  entries.forEach((e) => {
    [...new Set(e.tags || [])].forEach((lb) => { count[lb] = (count[lb] || 0) + 1; });
  });
  return TAG_CATEGORIES.map((c) => ({
    id: c.id,
    title: c.title,
    rows: c.tags
      .map((t) => ({ ...t, days: count[t.label] || 0, pct: days > 0 ? Math.round(((count[t.label] || 0) / days) * 100) : 0 }))
      .filter((r) => r.days > 0)
      .sort((a, b) => b.days - a.days),
  })).filter((c) => c.rows.length > 0);
}
