// 이름 뒤에 붙는 조사를 받침에 맞춘다 — '목의 정렬을' / '옆으로 팔 들기를'.
// 항목 이름을 바꿀 때마다 문장 곳곳의 조사를 손으로 고치지 않아도 되게.
const hasJong = (w) => {
  const c = String(w || '').trim().slice(-1).charCodeAt(0);
  return !Number.isNaN(c) && c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
};
const PAIR = { 을: ['을', '를'], 이: ['이', '가'], 은: ['은', '는'], 과: ['과', '와'] };

/** josa('목의 정렬', '을') → '목의 정렬을', josa('옆으로 팔 들기', '을') → '옆으로 팔 들기를' */
export const josa = (word, kind) => {
  const [withJ, without] = PAIR[kind] || [kind, kind];
  return `${word}${hasJong(word) ? withJ : without}`;
};
