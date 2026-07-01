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
    { id: 'aichat', label: '⭐️ BMTI TALK' },
    { id: 'board', label: '💌 BMTI 과몰입' },
    { id: 'bodycheck', label: '☘️ 무브먼트 라이브' },
    { id: 'spot', label: '📍 무브먼트 맵' }
  ];
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const defaultAiImage = '⭐️';
  const aiAvatar = charData ? <img src={charData.image} alt="AI" className="w-full h-full object-contain drop-shadow-sm scale-110" /> : <div className="text-2xl">{defaultAiImage}</div>;

  return (
    <nav id="main-nav" className="fixed top-0 left-0 right-0 z-40 flex flex-col">
      {/* Top Row: Logo & Login */}
      {!isChat && (
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto h-14 md:h-16 flex items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <div
            className="cursor-pointer flex items-baseline gap-2"
            onClick={() => setView('home')}
          >
            <span className="text-xl md:text-2xl font-serif font-bold tracking-tight whitespace-nowrap">BMTI</span>
            <span className="hidden sm:inline-block text-xs md:text-sm font-sans font-medium text-gray-400 whitespace-nowrap">자기점검 50</span>
          </div>

          {/* Right: Login */}
          <div className="flex font-medium items-center gap-1 sm:gap-3 md:gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-1.5 sm:gap-3">
                {userProfile && (
                  <div className="flex items-center gap-1.5 sm:gap-2">

                    {/* 닉네임 및 프리미엄 뱃지 영역 */}
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 text-sm flex items-center">
                          {userProfile.nickname === 'BMTI' && <span className="mr-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md">관리자</span>}
                          {userProfile.isPremium && userProfile.nickname !== 'BMTI' ? '🎟️ ' : ''}{userProfile.nickname}
                        </span>
                      </div>

                    {/* BMTI Badge */}
                    {bmtiCode && (() => {
                      const code = bmtiCode.split('-')[0];
                      const isZ = code.includes('Z');
                      const isM = code.includes('M');
                      
                      let badgeColors = "bg-[#c0ff00] text-black border-[#9BB31B]/30";
                      if (isZ) {
                        badgeColors = "bg-blue-100 text-blue-700 border-blue-200";
                      } else if (isM) {
                        badgeColors = "bg-pink-100 text-pink-700 border-pink-200";
                      }

                      return (
                        <span className={`inline-flex items-center justify-center text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColors}`}>
                          {code}
                        </span>
                      );
                    })()}

                    {/* My Page Button */}
                    <button
                      onClick={() => setView('mypage')}
                      className={`text-[10px] sm:text-xs md:text-sm font-bold border px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors whitespace-nowrap ${
                        currentView === 'mypage' 
                          ? 'bg-black text-[#c0ff00] border-black' 
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      마이페이지
                    </button>
                  </div>
                )}
                <div
                  className="text-[10px] sm:text-xs md:text-sm font-bold text-gray-600 hover:text-black border border-gray-200 hover:border-gray-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                  onClick={() => setIsLoggedIn(false)}
                >
                  로그아웃
                </div>
              </div>
            ) : (
              <div
                id="login-button"
                className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors cursor-pointer"
                onClick={() => setIsLoggedIn(true)}
              >
                <div className="w-5 h-5 bg-[#FEE500] rounded-full flex items-center justify-center">
                  <KakaoIcon className="w-3 h-3 fill-black" />
                </div>
                <span className="hidden sm:inline">카카오톡 간편 로그인/회원가입</span>
                <span className="sm:hidden">로그인</span>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Bottom Row: Navigation Tabs */}
      <div 
        className={`origin-top transition-all duration-300 ${isChat && !showCategory ? 'hidden' : 'block'} ${isChat ? 'absolute top-3 left-0 right-0 z-30' : 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100/50 relative'}`}
      >
        <div 
          className={`max-w-7xl mx-auto flex overflow-x-auto hide-scrollbar ${isChat ? 'pl-[140px] pr-[80px] md:pl-[200px] md:pr-[100px] justify-start py-0 w-full' : 'px-4 md:px-6 justify-center py-2.5'}`}
          style={isChat ? { maskImage: 'linear-gradient(to right, transparent, black 130px, black calc(100% - 70px), transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 130px, black calc(100% - 70px), transparent)' } : {}}
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
