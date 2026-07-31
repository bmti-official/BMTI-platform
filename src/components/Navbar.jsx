/* eslint-disable */
const KakaoIcon = ({ className = "w-3.5 h-3.5 fill-current" }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
  </svg>
);

// 하단 네비 우측 — 말랑방(채팅) 아이콘
const ChatIcon = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <path d="M6 5h20a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H13l-6 5v-5H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z" fill="currentColor" />
    <circle cx="11.5" cy="13.5" r="1.7" fill="white" />
    <circle cx="16" cy="13.5" r="1.7" fill="white" />
    <circle cx="20.5" cy="13.5" r="1.7" fill="white" />
  </svg>
);

import { useState, useEffect } from 'react';
import { CHARACTERS } from '../data';
import { Mallang } from './Mallang';
import { todayISO, getEntryForDate } from '../lib/diaryHistory';
import MallangDiscoveryReport from './MallangDiscoveryReport';
import MallangClass from './MallangClass';
import BmtiPartnerPopup from './BmtiPartnerPopup';

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

// 상단 홈 아이콘 — 집 실루엣
const HomeIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1v-8.8Z" fill="currentColor" />
  </svg>
);

// 상단 마이페이지 아이콘 — 사람 실루엣
const PersonIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="12" cy="8" r="4" fill="currentColor" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8Z" fill="currentColor" />
  </svg>
);

// 알약 안의 한 칸(아이콘 + 라벨). 여러 칸을 묶어 화면 가로를 꽉 채우는 알약을 만든다.
const PillTab = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className="flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1.5 rounded-2xl active:scale-95 transition-transform"
    style={active ? { background: '#F3F1EC' } : undefined}>
    <span className={`w-6 h-6 flex items-center justify-center ${active ? '' : 'opacity-45 grayscale'}`}>{icon}</span>
    <span className={`text-[9.5px] font-bold whitespace-nowrap ${active ? 'text-black' : 'text-gray-400'}`}>{label}</span>
  </button>
);

// 모든 페이지 우측 하단 — 위로 한번에 올리는 동그란 버튼(창/내부 스크롤 모두 맨 위로).
const AppScrollTop = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const check = () => {
      let any = (window.scrollY || document.documentElement.scrollTop || 0) > 320;
      document.querySelectorAll('[data-scroll-top]').forEach((el) => { if (el.scrollTop > 320) any = true; });
      setShow(any);
    };
    const id = setInterval(check, 350);
    window.addEventListener('scroll', check, { passive: true });
    check();
    return () => { clearInterval(id); window.removeEventListener('scroll', check); };
  }, []);
  const up = () => {
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { window.scrollTo(0, 0); }
    document.querySelectorAll('[data-scroll-top]').forEach((el) => { try { el.scrollTo({ top: 0, behavior: 'smooth' }); } catch { el.scrollTop = 0; } });
  };
  return (
    <button onClick={up} aria-label="맨 위로"
      style={{ position: 'fixed', right: 12, bottom: 82, zIndex: 41, width: 44, height: 44, borderRadius: '50%', border: '1px solid #EDE9E2', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', boxShadow: '0 3px 12px rgba(0,0,0,0.16)', cursor: 'pointer', display: show ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 19V7M6 13l6-6 6 6" stroke="#6B6459" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
};

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

  // 가운데 캐릭터를 누르면 뜨는 '내 BMTI 파트너' 팝업.
  const [showPartner, setShowPartner] = useState(false);
  const hasLoggedToday = !!getEntryForDate(todayISO());

  // 말랑방 화면의 '반 둘러보기' 버튼이 보내는 이벤트 → 말랑 클래스 오버레이를 연다.
  useEffect(() => {
    const openClass = () => { setShowDiscovery(false); setShowMallangClass(true); setView('home'); };
    window.addEventListener('open_mallang_class', openClass);
    return () => window.removeEventListener('open_mallang_class', openClass);
  }, [setView]);

  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const defaultAiImage = '⭐️';
  const aiAvatar = charData ? <img src={charData.image} alt="AI" className={`w-full h-full object-contain drop-shadow-md ${charData.imgClass || 'scale-110'}`} /> : <div className="text-3xl">{defaultAiImage}</div>;

  return (
    <>
      {/* 모든 페이지: 위로 한번에 올리기 버튼 */}
      <AppScrollTop />

      {/* 상단: 홈(집) 원형 버튼 — 항상 떠 있음 */}
      <div className="fixed top-3 left-3 z-40">
        <button
          onClick={() => { setShowDiscovery(false); setShowMallangClass(false); setView('home'); }}
          aria-label="홈"
          className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <HomeIcon className={`w-6 h-6 ${currentView === 'home' ? 'text-black' : 'text-gray-500'}`} />
        </button>
      </div>

      {/* 상단: 닉네임 + 마이페이지(사람) 알약 / 미로그인 시 카카오 로그인 — 항상 떠 있음 */}
      <div id="login-button" className="fixed top-3 right-3 z-40">
        {isLoggedIn ? (
          <button
            onClick={() => { setShowDiscovery(false); setShowMallangClass(false); setView('mypage'); }}
            className={`flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.12)] border transition-colors active:scale-95 ${currentView === 'mypage' ? 'border-black' : 'border-gray-100'}`}
          >
            {userProfile && (
              <span className="font-bold text-gray-800 text-sm flex items-center max-w-[110px] truncate">
                {userProfile.nickname === 'BMTI' && <span className="mr-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md">관리자</span>}
                {userProfile.nickname}
              </span>
            )}
            <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${currentView === 'mypage' ? 'bg-black' : 'bg-gray-100'}`}>
              <PersonIcon className={`w-4 h-4 ${currentView === 'mypage' ? 'text-white' : 'text-gray-500'}`} />
            </span>
          </button>
        ) : (
          <button
            onClick={() => setIsLoggedIn(true)}
            aria-label="카카오 로그인"
            className="w-11 h-11 bg-[#FEE500] rounded-full flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.12)] hover:bg-[#F4DC00] transition-colors active:scale-95"
          >
            <KakaoIcon className="w-5 h-5 fill-black" />
          </button>
        )}
      </div>

      {/* 하단: 하나의 기다란 떠 있는 알약(가운데 캐릭터 자리) — BMTI 설문 중에는 숨긴다 */}
      {currentView !== 'quiz' && (
        <>
          <div className="fixed bottom-3 left-2 right-2 z-40">
            <div className="flex items-center bg-white/95 backdrop-blur-md rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.14)] border border-gray-100 px-1.5 py-1">
              <PillTab active={currentView === 'aichat'} onClick={() => { setView('aichat'); setShowDiscovery(false); setShowMallangClass(false); }}
                icon={<Mallang v={diaryMoodTick} size={24} />} label="다이어리" />
              <PillTab active={showDiscovery} onClick={() => { setShowMallangClass(false); setShowDiscovery(true); setView('home'); }}
                icon={<ChartIcon className="w-5 h-5 text-gray-500" active={showDiscovery} />} label="기록·발견" />
              {/* 가운데 캐릭터 자리 */}
              <span className="w-14 shrink-0" aria-hidden="true" />
              <PillTab active={showMallangClass} onClick={() => { setShowDiscovery(false); setShowMallangClass(true); setView('home'); }}
                icon={<GroupIcon className="w-5 h-5 text-gray-500" />} label="클래스" />
              <PillTab active={currentView === 'mallangroom'} onClick={() => { setView('mallangroom'); setShowDiscovery(false); setShowMallangClass(false); }}
                icon={<ChatIcon className="w-5 h-5 text-gray-500" />} label="말랑방" />
            </div>
          </div>

          {/* 중앙 캐릭터 — 알약 위로 떠 있는 버튼. 누르면 '내 BMTI 파트너' 팝업을 연다 */}
          <button
            onClick={() => setShowPartner(true)}
            aria-label="내 BMTI 파트너"
            className="fixed left-1/2 -translate-x-1/2 bottom-5 z-40 active:scale-95 transition-transform"
          >
            <div className="relative w-14 h-14 flex items-center justify-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]">
              {aiAvatar}
              {showAiChatDot && (
                <span className="absolute top-0.5 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </div>
          </button>
        </>
      )}

      {showPartner && (
        <BmtiPartnerPopup
          bmtiCode={bmtiCode}
          isLoggedIn={isLoggedIn}
          hasLoggedToday={hasLoggedToday}
          setView={setView}
          onRequireLogin={() => setIsLoggedIn(true)}
          onClose={() => setShowPartner(false)}
        />
      )}

      {showDiscovery && (
        <MallangDiscoveryReport onClose={() => setShowDiscovery(false)} bmtiCode={bmtiCode} userData={userProfile} />
      )}

      {showMallangClass && (
        <MallangClass
          onClose={() => setShowMallangClass(false)}
          bmtiCode={bmtiCode}
          charImage={charData?.image}
          isLoggedIn={isLoggedIn}
          onRequireLogin={() => setIsLoggedIn(true)}
          isAdmin={userProfile?.nickname === 'BMTI'}
          userProfile={userProfile}
        />
      )}
    </>
  );
};

export default Navbar;
