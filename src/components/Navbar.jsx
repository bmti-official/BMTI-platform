/* eslint-disable */
const KakaoIcon = ({ className = "w-3.5 h-3.5 fill-current" }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
  </svg>
);

import { useState, useEffect } from 'react';
import { BMTI_RESULTS } from '../bmti_results';
import { CHARACTERS } from '../data';

const Navbar = ({ currentView, setView, isLoggedIn, setIsLoggedIn, userProfile, bmtiCode }) => {

  const [lastChatDate, setLastChatDate] = useState(localStorage.getItem('last_chat_date'));
  const [lastVoteDate, setLastVoteDate] = useState(localStorage.getItem('last_vote_date'));

  useEffect(() => {
    const handleChatUpdate = () => setLastChatDate(localStorage.getItem('last_chat_date'));
    const handleVoteUpdate = () => setLastVoteDate(localStorage.getItem('last_vote_date'));
    
    window.addEventListener('chat_updated', handleChatUpdate);
    window.addEventListener('vote_updated', handleVoteUpdate);
    
    return () => {
      window.removeEventListener('chat_updated', handleChatUpdate);
      window.removeEventListener('vote_updated', handleVoteUpdate);
    };
  }, []);

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  const todayStr = getTodayString();
  const showAiChatDot = !!bmtiCode && lastChatDate !== todayStr;
  const showBoardDot = !!bmtiCode && lastVoteDate !== todayStr;

  const isChat = false;
  const [showTopBar, setShowTopBar] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const tabs = [
    { id: 'home', label: '🧬 BMTI' },
    { id: 'aichat', label: '📝 BMTI 운동일기' },
    { id: 'board', label: '💌 BMTI 과몰입' },
    { id: 'bodycheck', label: '☘️ BMTI 라이브' }
  ];
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const defaultAiImage = '⭐️';
  const aiAvatar = charData ? <img src={charData.image} alt="AI" className="w-full h-full object-contain drop-shadow-md scale-125" /> : <div className="text-3xl md:text-4xl">{defaultAiImage}</div>;

  // 다른 화면으로 넘어가면 펼쳐둔 카테고리는 자동으로 접는다.
  useEffect(() => {
    setShowCategory(false);
  }, [currentView]);

  const hasUnreadDot = showAiChatDot || showBoardDot;

  return (
    <nav id="main-nav" className="fixed top-0 left-0 right-0 z-40 flex flex-col">
      {/* Top Row: Logo & Login */}
      {!isChat && (
      <div className="relative bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 md:px-6 py-3 md:py-3.5">
          {/* Left: 여백 (가운데 아바타를 정중앙에 맞추기 위한 자리) */}
          <div />

          {/* Center: 캐릭터 아바타 + BMTI 로고 — 바 경계/카테고리와 겹치지 않게 자체 높이 안에 위치 */}
          <div className="flex flex-col items-center justify-self-center">
            <button
              onClick={() => setShowCategory(v => !v)}
              aria-label="카테고리 열기"
              aria-expanded={showCategory}
              className="relative active:scale-95 transition-transform"
            >
              <div className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                {aiAvatar}
                {hasUnreadDot && !showCategory && (
                  <span className="absolute -top-1.5 -right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </div>
            </button>
            <button
              onClick={() => setView('home')}
              className="mt-0.5 text-sm md:text-base font-serif font-bold tracking-tight text-gray-800 leading-none whitespace-nowrap"
            >
              BMTI
            </button>
          </div>

          {/* Right: Login */}
          <div className="flex font-medium items-center gap-1 sm:gap-3 md:gap-4 justify-self-end">
            {isLoggedIn ? (
              <div className="flex items-center gap-1.5 sm:gap-3">
                {userProfile && (
                  <button
                    onClick={() => setView('mypage')}
                    className={`flex items-center gap-1.5 sm:gap-2 pl-2 pr-2.5 py-1 -mx-2 rounded-full transition-colors ${
                      currentView === 'mypage' ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* 닉네임 영역 */}
                    <span className="font-bold text-gray-800 text-sm flex items-center">
                      {userProfile.nickname === 'BMTI' && <span className="mr-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md">관리자</span>}
                      {userProfile.nickname}
                    </span>
                  </button>
                )}
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
      </div>
      )}

      {/* Bottom Row: Navigation Tabs — 캐릭터 아바타를 눌러야 펼쳐진다 */}
      <div
        className={`origin-top overflow-hidden transition-all duration-300 ease-out bg-white/90 backdrop-blur-md relative ${
          showCategory ? 'max-h-24 opacity-100 shadow-sm border-b border-gray-100/50' : 'max-h-0 opacity-0'
        }`}
      >
        <div
          className="max-w-7xl mx-auto flex overflow-x-auto hide-scrollbar px-4 md:px-6 justify-center py-2.5"
        >
          <div className="bg-gray-100/90 backdrop-blur-lg border border-gray-200/50 rounded-full p-1 flex gap-1 items-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] whitespace-nowrap flex-shrink-0 h-10 md:h-12">
            {tabs.map(tab => (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setView(tab.id)}
                className={`px-4 md:px-6 h-full flex items-center justify-center rounded-full text-xs md:text-sm font-bold transition-all duration-300 relative ${
                  currentView === tab.id
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-500 hover:text-black hover:bg-white/60'
                }`}
              >
                {tab.label}
                {tab.id === 'aichat' && showAiChatDot && (
                  <span className="absolute top-2 right-2 md:top-2 md:right-3 w-1.5 h-1.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
                )}
                {tab.id === 'board' && showBoardDot && (
                  <span className="absolute top-2 right-2 md:top-2 md:right-3 w-1.5 h-1.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
