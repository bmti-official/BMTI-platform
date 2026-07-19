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
import MallangDiscoveryReport from './MallangDiscoveryReport';
import MallangClass from './MallangClass';

// 하단 네비 '말랑이의 발견' 아이콘 — 막대그래프 모양.
// 활성 상태(말랑이의 발견을 보고 있을 때)엔 막대 3개가 분홍/초록/회색을 돌아가며
// 하나씩 번갈아 보여주도록 애니메이션한다 — 비활성 땐 기존처럼 단색 그대로.
const CHART_BAR_COLORS = ["#FF6B9D", "#5F8A76", "#B7B2A9"];
const ChartIcon = ({ className, active }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    {active && (
      <style>{`
        @keyframes chartBarCycle {
          0%, 32% { fill: ${CHART_BAR_COLORS[0]}; }
          33%, 65% { fill: ${CHART_BAR_COLORS[1]}; }
          66%, 100% { fill: ${CHART_BAR_COLORS[2]}; }
        }
      `}</style>
    )}
    <rect x="3" y="10" width="4.5" height="10" rx="2.25" fill="currentColor" style={active ? { animation: "chartBarCycle 2.4s linear infinite", animationDelay: "0s" } : undefined} />
    <rect x="9.75" y="4" width="4.5" height="16" rx="2.25" fill="currentColor" style={active ? { animation: "chartBarCycle 2.4s linear infinite", animationDelay: "-0.8s" } : undefined} />
    <rect x="16.5" y="8" width="4.5" height="12" rx="2.25" fill="currentColor" style={active ? { animation: "chartBarCycle 2.4s linear infinite", animationDelay: "-1.6s" } : undefined} />
  </svg>
);

// 하단 네비 '말랑 클래스' 아이콘 — 함께 모인 사람들 모양
const GroupIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="8.5" cy="8" r="3.2" fill="currentColor" />
    <circle cx="16.5" cy="9" r="2.6" fill="currentColor" opacity="0.55" />
    <path d="M2.8 20c0-3.3 2.6-5.7 5.7-5.7s5.7 2.4 5.7 5.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M14.6 20c0-2.5 1.7-4.4 3.9-4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55" />
  </svg>
);

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

  // 말랑이의 발견 — 기분 기록이 쌓인 달에서 패턴을 찾아 보여주는 월간 리포트.
  const [showDiscovery, setShowDiscovery] = useState(false);

  // 말랑 클래스 — 같은 유형·같은 부위끼리 모이는 소그룹 온라인 클래스 소개/예약.
  const [showMallangClass, setShowMallangClass] = useState(false);

  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const defaultAiImage = '⭐️';
  const aiAvatar = charData ? <img src={charData.image} alt="AI" className={`w-full h-full object-contain drop-shadow-md ${charData.imgClass || 'scale-110'}`} /> : <div className="text-3xl">{defaultAiImage}</div>;

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
            <span className="text-[10px] md:text-xs font-serif font-normal text-gray-400 tracking-tight whitespace-nowrap">: 말랑 다이어리</span>
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
            <div className="max-w-7xl mx-auto grid grid-cols-5 items-center px-4 md:px-10" style={{ height: 66 }}>
              {/* 말랑 다이어리 */}
              <button onClick={() => { setView('aichat'); setShowDiscovery(false); setShowMallangClass(false); }} className="flex flex-col items-center gap-0.5 justify-self-start active:scale-95 transition-transform">
                <div className={`w-7 h-7 flex items-center justify-center ${currentView === 'aichat' ? '' : 'opacity-40 grayscale'}`}>
                  <Mallang v={diaryMoodTick} size={26} />
                </div>
                <span className={`text-[10px] font-bold whitespace-nowrap ${currentView === 'aichat' ? 'text-black' : 'text-gray-400'}`}>말랑 다이어리</span>
              </button>

              {/* 말랑이의 발견 */}
              <button onClick={() => { setShowMallangClass(false); setShowDiscovery(true); }} className="flex flex-col items-center gap-0.5 justify-self-start active:scale-95 transition-transform">
                <ChartIcon className="w-6 h-6 text-gray-300" active={showDiscovery} />
                <span className={`text-[10px] font-bold whitespace-nowrap ${showDiscovery ? 'text-black' : 'text-gray-400'}`}>말랑이의 발견</span>
              </button>

              {/* 중앙 캐릭터 자리 — 실제 아바타는 절대위치로 위에 떠 있음 */}
              <div />

              {/* 말랑 클래스 — 캐릭터와 라이브 사이 중앙에 오도록 */}
              <button onClick={() => { setShowDiscovery(false); setShowMallangClass(true); }} className="flex flex-col items-center gap-0.5 justify-self-end active:scale-95 transition-transform">
                <GroupIcon className="w-6 h-6 text-gray-300" />
                <span className="text-[10px] font-bold whitespace-nowrap text-gray-400">말랑 클래스</span>
              </button>

              {/* 라이브 */}
              <button onClick={() => { setView('bodycheck'); setShowDiscovery(false); setShowMallangClass(false); }} className="flex flex-col items-center gap-0.5 justify-self-end active:scale-95 transition-transform">
                <PlayIcon className={`w-7 h-7 ${currentView === 'bodycheck' ? 'text-black' : 'text-gray-300'}`} />
                <span className={`text-[10px] font-bold ${currentView === 'bodycheck' ? 'text-black' : 'text-gray-400'}`}>라이브</span>
              </button>
            </div>

            {/* 캐릭터 — 바 위로 떠 있는 홈 버튼, 배경원 없이 누끼 캐릭터만 */}
            <button
              onClick={() => { setView('home'); setShowDiscovery(false); setShowMallangClass(false); }}
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

      {showDiscovery && (
        <MallangDiscoveryReport onClose={() => setShowDiscovery(false)} bmtiCode={bmtiCode} userData={userProfile} />
      )}

      {showMallangClass && (
        <MallangClass onClose={() => setShowMallangClass(false)} bmtiCode={bmtiCode} />
      )}
    </>
  );
};

export default Navbar;
