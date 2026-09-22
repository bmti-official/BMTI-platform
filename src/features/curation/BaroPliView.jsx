// 바로플리 — 담긴 플리를 게시물처럼 한 줄에 하나씩 보여 준다.
// 바로카드 격자는 '둘러보기'(BrowseView)가 따로 맡는다.
import { useState } from 'react';
import RoutineView from './RoutineView';
import RoutinePlayer from './RoutinePlayer';
import { CHARACTERS } from '../../data';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';

// 골라 둔 누끼 캐릭터를 그림 주소로 바꿔 넘긴다.
function charProps(r, tone) {
  const codes = ((tone === 'm' ? r?.chars_m : r?.chars_z) || []).filter(Boolean);
  return { charCodes: codes, charImages: codes.map((id) => CHARACTERS.find((c) => c.id === id)?.image).filter(Boolean) };
}

export default function BaroPliView({ routines = [], tone = 'z', bmtiCode, onOpenRoutine }) {
  const [playing, setPlaying] = useState(null);   // 재생 중인 바로플리

  return (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {routines.length === 0 && <Empty text="아직 담긴 플리가 없어요." />}
        {routines.map((r) => (
          <RoutineView key={r.id} routine={r} cards={r.cards || []} tone={tone} bmtiCode={bmtiCode}
            onStart={() => setPlaying(r)}
            onBrowse={() => onOpenRoutine && onOpenRoutine(r)}
            {...charProps(r, tone)} />
        ))}
      </div>

      {playing && (
        <RoutinePlayer routine={playing} cards={playing.cards || []} tone={tone} bmtiCode={bmtiCode}
          onClose={() => setPlaying(null)} />
      )}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: '26px 16px', textAlign: 'center',
      fontSize: 13, color: SUB, fontWeight: 600 }}>{text}</div>
  );
}
