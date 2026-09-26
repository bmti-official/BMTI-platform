// 고른 부위만 재도록 판을 짠다. 셋을 늘 다 잴 필요는 없다.
//
// 목만 고르면 **앉아서** 재도 된다 — 귀와 어깨만 있으면 되기 때문이다.
// 허리와 어깨는 골반을 기준으로 재므로 서 있어야 한다.
const SIDE_PHASES = [
  { sec: 4, text: '가만히 계세요', sub: '목 각도를 재고 있어요', take: 'neck', voice: 'go1' },
  { sec: 5, text: '천천히 허리를 굽혔다 펴세요', sub: '무릎은 편 채로요', take: 'trunk', voice: 'mid1' },
];
const FRONT_PHASES = [
  { sec: 2, text: '팔을 내린 채로 기다려 주세요', sub: '곧 시작해요', take: null, voice: 'go2' },
  { sec: 6, text: '두 팔을 옆으로 올렸다 내리세요', sub: '천천히, 끝까지 올려 보세요', take: 'arm', voice: 'mid2' },
];

/** 고른 부위만 재도록 판을 짠다. 셋을 늘 다 잴 필요는 없다.
 *  목만 고르면 **앉아서** 재도 된다 — 귀와 어깨만 있으면 되기 때문이다.
 *  허리와 어깨는 골반을 기준으로 재므로 서 있어야 한다. */
export function buildSteps(want = ['neck', 'trunk', 'arm']) {
  const has = (k) => want.includes(k);
  const sitting = want.length === 1 && has('neck');
  const out = [];
  const sidePhases = SIDE_PHASES.filter((p) => has(p.take));
  if (sidePhases.length) {
    out.push({
      id: 'side', sitting,
      title: sitting ? '옆을 보고 앉아 주세요' : '옆으로 서 주세요',
      how: sitting
        ? '의자에 앉아 몸 왼쪽이나 오른쪽이 화면을 보게 합니다.\n귀와 어깨만 보이면 되니 책상에 가려도 괜찮아요.\n평소 앉던 그대로 계세요.'
        : (has('trunk')
          ? '몸 왼쪽이나 오른쪽이 화면을 보게 섭니다.\n가만히 선 다음, 천천히 허리를 앞으로 굽혔다 돌아옵니다.\n무릎은 편 채로요.'
          : '몸 왼쪽이나 오른쪽이 화면을 보게 섭니다.\n가만히 선 채로 계세요.'),
      // 앉아서 잴 땐 '가만히 서 계세요' 대신 '앉은 그대로 계세요'로 시작한다
      phases: sitting ? sidePhases.map((p) => ({ ...p, voice: 'sit', text: '가만히 계세요' })) : sidePhases,
    });
  }
  if (has('arm')) {
    out.push({
      id: 'front', sitting: false, title: '정면으로 서 주세요',
      how: '화면을 마주 봅니다.\n두 팔을 옆으로 천천히 올렸다 내립니다.',
      phases: FRONT_PHASES,
    });
  }
  return out;
}

export const stepSec = (st) => st.phases.reduce((n, p) => n + p.sec, 0);
