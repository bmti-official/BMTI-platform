/* eslint-disable */
const KakaoIcon = ({ className = "w-3.5 h-3.5 fill-current" }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
  </svg>
);

// 하단 네비 우측 — 재생 버튼(라이브)
const PlayIcon = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <rect x="3" y="7" width="26" height="18" rx="6" fill="currentColor" />
    <path d="M13.5 12.2v7.6a1 1 0 0 0 1.53.85l6.2-3.8a1 1 0 0 0 0-1.7l-6.2-3.8a1 1 0 0 0-1.53.85Z" fill="white" />
  </svg>
);

import { useState, useEffect } from 'react';
import { CHARACTERS } from '../data';
import { Mallang } from './Mallang';
import { todayISO } from '../lib/diaryHistory';

const Navbar = ({ currentView, setView, isLoggedIn, setIsLoggedIn, userProfile, bmtiCode }) => {

  const [lastChatDate, setLastChatDate] = useState(localStorage.getItem('last_chat_date'));

  useEffect(() => {
    const handleChatUpdate = () => setLastChatDate(localStorage.getItem('last_chat_date'));

    window.addEventListener('chat_updated', handleChatUpdate);

    return () => {
      window.removeEventListener('chat_updated', handleChatUpdate);
    };
  }, []);

  const todayStr = todayISO();
  const showAiChatDot = !!bmtiCode && lastChatDate !== todayStr;

  // 하단 '말랑 다이어리' 탭 아이콘 — 5가지 말랑이 표정이 번갈아가며 나온다.
  const [diaryMoodTick, setDiaryMoodTick] = useState(1);
  useEffect(() => {
    const id = setInterval(() => {
      setDiaryMoodTick(v => (v % 5) + 1);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const defaultAiImage = '⭐️';
  const aiAvatar = charData ? <img src={charData.image} alt="AI" className="w-full h-full object-contain drop-shadow-md scale-125" /> : <div className="text-3xl">{defaultAiImage}</div>;

  return (
    <>
      {/* 상단 바: 로고 + 로그인/마이페이지 */}
      <nav id="main-nav" className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 px-4 md:px-6 py-3 md:py-3.5">
          {/* Left: 로고 */}
          <div
            className="cursor-pointer flex items-baseline gap-2"
            onClick={() => setView('home')}
          >
            <span className="text-xl md:text-2xl font-serif font-bold tracking-tight whitespace-nowrap">BMTI</span>
          </div>

          {/* Right: Login */}
          <div className="flex font-medium items-center gap-1 sm:gap-3 md:gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {userProfile && (
                  <span className="font-bold text-gray-800 text-sm flex items-center">
                    {userProfile.nickname === 'BMTI' && <span className="mr-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md">관리자</span>}
                    {userProfile.nickname}
                  </span>
                )}
                <button
                  onClick={() => setView('mypage')}
                  className={`text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                    currentView === 'mypage' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  마이페이지
                </button>
              </div>
            ) : (
              <div
                id="login-button"
                className="flex items-center cursor-pointer"
                onClick={() => setIsLoggedIn(true)}
              >
                <div className="w-8 h-8 bg-[#FEE500] rounded-full flex items-center justify-center hover:bg-[#F4DC00] transition-colors">
                  <KakaoIcon className="w-4 h-4 fill-black" />
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 하단 바: 운동일기 / 캐릭터(홈) / 라이브 — BMTI 설문 중에는 숨긴다 */}
      {currentView !== 'quiz' && (
        <nav id="bottom-nav" className="fixed bottom-0 left-0 right-0 z-40">
          <div className="relative bg-white/95 backdrop-blur-md border-t border-gray-100">
            <div className="max-w-7xl mx-auto grid grid-cols-3 items-center px-8 md:px-16" style={{ height: 66 }}>
              {/* 말랑 다이어리 */}
              <button onClick={() => setView('aichat')} className="flex flex-col items-center gap-0.5 justify-self-start active:scale-95 transition-transform">
                <div className={`w-7 h-7 flex items-center justify-center ${currentView === 'aichat' ? '' : 'opacity-40 grayscale'}`}>
                  <Mallang v={diaryMoodTick} size={26} />
                </div>
                <span className={`text-[10px] font-bold whitespace-nowrap ${currentView === 'aichat' ? 'text-black' : 'text-gray-400'}`}>말랑 다이어리</span>
              </button>

              {/* 중앙 캐릭터 자리 — 실제 아바타는 절대위치로 위에 떠 있음 */}
              <div />

              {/* 라이브 */}
              <button onClick={() => setView('bodycheck')} className="flex flex-col items-center gap-0.5 justify-self-end active:scale-95 transition-transform">
                <PlayIcon className={`w-7 h-7 ${currentView === 'bodycheck' ? 'text-black' : 'text-gray-300'}`} />
                <span className={`text-[10px] font-bold ${currentView === 'bodycheck' ? 'text-black' : 'text-gray-400'}`}>라이브</span>
              </button>
            </div>

            {/* 캐릭터 — 바 위로 떠 있는 홈 버튼, 배경원 없이 누끼 캐릭터만 */}
            <button
              onClick={() => setView('home')}
              aria-label="홈으로"
              className="absolute left-1/2 -translate-x-1/2 -top-5 z-30 active:scale-95 transition-transform"
            >
              <div className="relative w-14 h-14 flex items-center justify-center">
                {aiAvatar}
                {showAiChatDot && (
                  <span className="absolute top-0.5 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </div>
            </button>
          </div>
        </nav>
      )}
    </>
  );
};

export default Navbar;
