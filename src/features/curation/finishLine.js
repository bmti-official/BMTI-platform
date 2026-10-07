// 마무리 멘트 자막 — 아직 음성을 올리지 않았어도 파트너가 한마디는 건네게.
// 말투만 둘로 나눈다. 담백한 Z, 다정한 M.
export const FINISH_LINE = {
  z: '끝났습니다.\n오늘 몫은 여기까지예요.\n숨 고르고 마무리하세요.',
  m: '다 하셨어요!\n오늘도 한 칸 채우셨네요.\n천천히 숨 고르세요.',
};
export const finishLine = (tone) => FINISH_LINE[tone === 'm' ? 'm' : 'z'];

// 다음 동작으로 넘어갈 때 — 바디플리에서만 나온다.
export const NEXT_LINE = {
  z: '좋습니다.\n잠깐 숨 고르고 다음 동작으로 가겠습니다.',
  m: '잘하셨어요!\n잠깐 숨 고르고 다음 동작 갈게요.',
};
export const nextLine = (tone) => NEXT_LINE[tone === 'm' ? 'm' : 'z'];
