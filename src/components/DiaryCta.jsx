import { useState, useEffect } from 'react';
import { Mallang } from './Mallang';

// 연한 옐로우의 '대충 칠한 듯한' 형광펜 — 글자 뒤에만 칠해지고 양끝이 불규칙하게 흐려진다.
export const YELLOW_HL = {
  background: 'linear-gradient(104deg, rgba(246,222,110,0) 0.9%, rgba(246,222,110,0.92) 2.4%, rgba(246,222,110,0.55) 6%, rgba(246,222,110,0.5) 92%, rgba(246,222,110,0.92) 96%, rgba(246,222,110,0) 98.5%)',
  padding: '0.08em 0.32em',
  WebkitBoxDecorationBreak: 'clone',
  boxDecorationBreak: 'clone',
};

// 오늘 건강 다이어리 기록 전이면 '건강 다이어리 10초 기록하기 →'(→ 다이어리),
// 오늘 기록을 마쳤으면 '이번달 기록·발견 알아보기 →'(→ 기록·발견 오버레이)로 바뀌는 공용 CTA.
// 말랑이 표정은 2.6초 주기로 순환하고 눈은 깜박이지 않는다.
export default function DiaryCta({ loggedToday, onGoDiary, onGoDiscovery, className = '', filled = false }) {
  const [mood, setMood] = useState(0);
  useEffect(() => { const id = setInterval(() => setMood(m => (m + 1) % 5), 2600); return () => clearInterval(id); }, []);

  const label = loggedToday ? '이번달 기록·발견 알아보기' : '건강 다이어리 10초 기록하기';
  const onClick = () => {
    if (loggedToday) {
      if (onGoDiscovery) onGoDiscovery();
      else window.dispatchEvent(new Event('bmti:open-discovery'));
    } else if (onGoDiary) onGoDiary();
  };

  // filled: 팝업용 — 버튼 배경 없음, 글자에만 검은 형광펜(흰 글자), 크게
  if (filled) {
    return (
      <button onClick={onClick} className={`w-full flex items-center justify-center gap-2 bg-transparent border-none active:scale-[0.98] transition-transform ${className}`}>
        <span className="w-9 h-9 flex items-center justify-center shrink-0"><Mallang v={mood} size={34} noBlink /></span>
        <span className="text-[17px] font-extrabold text-gray-900 whitespace-nowrap" style={YELLOW_HL}>{label}</span>
        <span className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-900 flex items-center justify-center text-lg font-bold shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.12)]">→</span>
      </button>
    );
  }

  return (
    <span className={`relative inline-block ${className}`}>
      <button onClick={onClick} className="inline-flex items-center gap-2 bg-transparent border-none active:scale-[0.98] transition-transform">
        <span className="w-8 h-8 flex items-center justify-center shrink-0"><Mallang v={mood} size={31} noBlink /></span>
        <span className="text-[13px] md:text-base font-extrabold text-gray-800 whitespace-nowrap">{label}</span>
        <span className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-900 flex items-center justify-center text-base font-bold shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.12)]">→</span>
      </button>
      {!loggedToday && (
        <span className="absolute -top-1 right-7 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      )}
    </span>
  );
}
