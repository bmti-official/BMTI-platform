// AI로 만들었다는 표시 — 큐레이션·바로카드·플레이리스트가 함께 쓴다.
// 문구를 한 곳에서만 고치면 세 군데에 모두 반영된다.
export const AI_NOTE = 'AI의 도움을 받아 만들고 BMTI가 확인했습니다.';

export default function AiNote({ align = 'left', top = 14 }) {
  return (
    <p style={{ fontSize: 10.5, color: '#A9A297', fontWeight: 600, lineHeight: 1.5,
      margin: `${top}px 0 0`, textAlign: align, wordBreak: 'keep-all' }}>
      {AI_NOTE}
    </p>
  );
}
