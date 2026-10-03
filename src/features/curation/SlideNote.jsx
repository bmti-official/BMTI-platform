// 한 줄 안내가 부드럽게 열리고 닫히는 자리 — "비슷한 것을 보여 드려요" 같은 말에 쓴다.
import { useState } from 'react';

const SUB = '#8A8378';

export default function SlideNote({ show, text }) {
  // 닫히는 동안에도 글이 남아 있게 마지막 글을 쥐고 있는다(글이 먼저 사라지면 빈 줄이 접히는 것처럼 보인다)
  const [kept, setKept] = useState(text);
  if (show && text !== kept) setKept(text);
  return (
    <div aria-hidden={!show}
      style={{ display: 'grid', gridTemplateRows: show ? '1fr' : '0fr', opacity: show ? 1 : 0,
        transition: 'grid-template-rows .5s cubic-bezier(.4,.1,.3,1), opacity .4s ease' }}>
      <div style={{ overflow: 'hidden', minHeight: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: SUB, padding: '0 2px 8px', lineHeight: 1.6, wordBreak: 'keep-all' }}>
          {kept}
        </div>
      </div>
    </div>
  );
}
