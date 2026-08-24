/* eslint-disable */
const KakaoIcon = ({ className = "w-3.5 h-3.5 fill-current" }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
  </svg>
);

import { useState, useEffect } from 'react';
import { CHARACTERS } from '../data';
import { Mallang } from './Mallang';
import { todayISO, getEntryForDate } from '../lib/diaryHistory';
import MallangDiscoveryReport from './MallangDiscoveryReport';
import BmtiPartnerPopup from './BmtiPartnerPopup';
import TypeGallery from './TypeGallery';
import DiscoveryConsentPrompt from './DiscoveryConsentPrompt';
import { hasOptionalHealthConsent } from '../lib/healthConsentSystem';

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

// 하단 네비 '큐레이션' 아이콘 — 펼쳐진 책
const BookIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="M12 6.2C10.3 5 8.3 4.4 6 4.4c-.8 0-1.4.6-1.4 1.4v11c0 .8.6 1.4 1.4 1.4 2.3 0 4.3.6 6 1.8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    <path d="M12 6.2C13.7 5 15.7 4.4 18 4.4c.8 0 1.4.6 1.4 1.4v11c0 .8-.6 1.4-1.4 1.4-2.3 0-4.3.6-6 1.8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    <path d="M12 6.2V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 하단 네비 '예약' 아이콘 — 티켓
const TicketIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h15A1.5 1.5 0 0 1 21 8.5v1.6a1.6 1.6 0 0 0 0 3.2v1.7a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15v-1.7a1.6 1.6 0 0 0 0-3.2V8.5Z" fill="currentColor" />
    <path d="M12 8v1.6M12 11.6v1.6M12 15.2V17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
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
// 나의유형 탭 — 체크 아이콘(활성 시 색 순환 + 내려갔다 올라오며 색 변경)
const CheckIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'nav-check-anim' : 'text-gray-500'}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);
// BMTI 탭 — 펼친 책 아이콘(활성 시 페이지 넘김 + 넘길 때마다 색 변경)
const OpenBookIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'nav-book-anim' : 'text-gray-500'}`} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.2C10.3 5 7.4 4.5 4.3 5v12.6C7.4 17.1 10.3 17.6 12 18.8" />
    <path d="M12 6.2C13.7 5 16.6 4.5 19.7 5v12.6C16.6 17.1 13.7 17.6 12 18.8" />
    <path d="M12 6.2V18.8" />
    <path className="book-page" d="M12 6.4C13.6 5.3 16 4.9 18.4 5.2v10.9C16 15.8 13.6 16.2 12 17.3Z" fill="currentColor" stroke="none" opacity="0.22" />
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
      // 캘린더가 떠 있으면(현재 달/주 카드 존재) 캘린더 자체 버튼이 위/아래 이동을 담당하므로 전역 버튼은 숨긴다.
      if (document.querySelector('[data-current="true"]')) { setShow(false); return; }
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

const Navbar = ({ currentView, setView, isLoggedIn, setIsLoggedIn, onRequireLogin, userProfile, bmtiCode }) => {

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

  // 하단 '건강 다이어리' 탭 아이콘 — 5가지 말랑이 표정이 번갈아가며 나온다.
  const [diaryMoodTick, setDiaryMoodTick] = useState(1);
  useEffect(() => {
    const id = setInterval(() => {
      setDiaryMoodTick(v => (v % 5) + 1);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  // 말랑이의 발견 — 기분 기록이 쌓인 달에서 패턴을 찾아 보여주는 월간 리포트.
  const [showDiscovery, setShowDiscovery] = useState(false);
  // 기록·발견은 [선택] 동의가 있어야 열람 가능 — 없으면 동의 유도 팝업.
  const [showDiscConsent, setShowDiscConsent] = useState(false);
  const openDiscovery = () => {
    if (hasOptionalHealthConsent()) { setShowDiscovery(true); setView('home'); }
    else { setShowDiscConsent(true); }
  };
  // 홈·결과지·파트너 팝업의 '이번달 기록·발견 알아보기' CTA(DiaryCta)가 발행하는 이벤트로 기록·발견을 연다.
  useEffect(() => {
    window.addEventListener('bmti:open-discovery', openDiscovery);
    return () => window.removeEventListener('bmti:open-discovery', openDiscovery);
  }, [setView]);

  // 가운데 캐릭터를 누르면 뜨는 '내 BMTI 유형' 팝업.
  const [showPartner, setShowPartner] = useState(false);
  // 검사 전 유저가 '나의유형'을 누르면 뜨는 16유형 구경 갤러리.
  const [showTypeGallery, setShowTypeGallery] = useState(false);
  const [galleryCode, setGalleryCode] = useState(null); // 공유 링크로 열 때 미리 선택된 유형
  useEffect(() => {
    const open = (e) => { setGalleryCode(e.detail || null); setShowTypeGallery(true); };
    window.addEventListener('bmti:open-gallery', open);
    return () => window.removeEventListener('bmti:open-gallery', open);
  }, []);
  const hasLoggedToday = !!getEntryForDate(todayISO());

  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const defaultAiImage = '⭐️';
  // OLQM('키다리 폼롤러')만 세로로 길고 폭이 좁아 정사각 슬롯에서 유독 작아 보인다.
  // 다른 유형은 그대로 두고 이 유형의 누끼만 살짝 키운다.
  const navAvatarScale = axisCode === 'OLQM' ? ' scale-[1.22]' : '';
  const aiAvatar = charData ? <img src={charData.image} alt="AI" className={`w-full h-full object-contain drop-shadow-md${navAvatarScale}`} /> : <div className="text-3xl">{defaultAiImage}</div>;

  return (
    <>
      <style>{`
        /* 색은 무한 순환, 위아래 바운스는 처음 3번만(=첫 한 바퀴) */
        @keyframes navCheckColor { 0%{color:#C9B8F0;} 33%{color:#C9975A;} 66%{color:#EBCF6A;} 100%{color:#C9B8F0;} }
        @keyframes navCheckBounce { 0%{transform:translateY(0);} 45%{transform:translateY(4px);} 100%{transform:translateY(0);} }
        .nav-check-anim { animation: navCheckColor 2.4s steps(1) infinite, navCheckBounce 0.8s ease-in-out 3; }
        @keyframes navBookColor { 0%,100%{color:#C9B8F0;} 33%{color:#C9975A;} 66%{color:#EBCF6A;} }
        @keyframes navPageFlip { 0%{transform:scaleX(1);} 50%{transform:scaleX(0.06);} 100%{transform:scaleX(1);} }
        .nav-book-anim { animation: navBookColor 2.7s steps(1) infinite; }
        .nav-book-anim .book-page { transform-box: fill-box; transform-origin: left center; animation: navPageFlip 0.9s ease-in-out infinite; }
      `}</style>
      {/* 모든 페이지: 위로 한번에 올리기 버튼 */}
      <AppScrollTop />

      {/* 상단: 홈(집) 원형 버튼 — 항상 떠 있음 */}
      <div className="fixed top-3 left-3 z-40">
        <button
          onClick={() => { setShowDiscovery(false); setView('home'); }}
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
            onClick={() => { setShowDiscovery(false); setView('mypage'); }}
            className={`flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.12)] border transition-colors active:scale-95 ${currentView === 'mypage' ? 'border-black' : 'border-gray-100'}`}
          >
            {userProfile && (
              <span className="flex items-center gap-1.5">
                {userProfile.nickname === 'BMTI' && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md">관리자</span>}
                {axisCode && <span className="text-[11px] font-black text-white px-2 py-0.5 rounded-lg" style={{ background: '#8B7BD8' }}>{axisCode}</span>}
                <span className="font-bold text-gray-800 text-sm max-w-[90px] truncate">{userProfile.nickname}</span>
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
            className="flex items-center gap-1.5 bg-[#FEE500] rounded-full pl-2.5 pr-3.5 h-11 shadow-[0_2px_10px_rgba(0,0,0,0.12)] hover:bg-[#F4DC00] transition-colors active:scale-95"
          >
            <KakaoIcon className="w-5 h-5 fill-black" />
            <span className="text-[13px] font-bold text-[#3C1E1E] whitespace-nowrap">3초 로그인/회원가입</span>
          </button>
        )}
      </div>

      {/* 하단: 하나의 기다란 떠 있는 알약(가운데 캐릭터 자리) — BMTI 설문 중에는 숨긴다 */}
      {currentView !== 'quiz' && (
        <>
          <div className="fixed bottom-3 left-2 right-2 z-40">
            <div className="flex items-center bg-white/95 backdrop-blur-md rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.14)] border border-gray-100 px-1.5 py-1">
              <PillTab active={currentView === 'home' && !showDiscovery} onClick={() => { setShowDiscovery(false); setView('home'); }}
                icon={<OpenBookIcon active={currentView === 'home' && !showDiscovery} />} label="BMTI" />
              <PillTab active={currentView === 'result'} onClick={() => { setShowDiscovery(false); if (bmtiCode) setView('result'); else setShowPartner(true); }}
                icon={<CheckIcon active={currentView === 'result'} />} label="나의유형" />
              {/* 가운데 캐릭터 자리 */}
              <span className="w-14 shrink-0" aria-hidden="true" />
              <PillTab active={currentView === 'aichat'} onClick={() => { setView('aichat'); setShowDiscovery(false); }}
                icon={<Mallang v={diaryMoodTick} size={24} noBlink />} label="다이어리" />
              <PillTab active={showDiscovery} onClick={openDiscovery}
                icon={<ChartIcon className="w-5 h-5 text-gray-500" active={showDiscovery} />} label="기록·발견" />
            </div>
          </div>

          {/* 중앙 캐릭터 — 알약 위로 떠 있는 버튼. 누르면 '내 BMTI 유형' 팝업을 연다 */}
          <button
            onClick={() => setShowPartner(true)}
            aria-label="내 BMTI 유형"
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
          setView={(v) => { setShowDiscovery(false); setView(v); }}
          onRequireLogin={() => setIsLoggedIn(true)}
          onClose={() => setShowPartner(false)}
          onExploreTypes={() => setShowTypeGallery(true)}
          nickname={userProfile?.nickname}
        />
      )}

      {showDiscovery && (
        <MallangDiscoveryReport onClose={() => setShowDiscovery(false)} bmtiCode={bmtiCode} userData={userProfile} isLoggedIn={isLoggedIn} onRequireLogin={onRequireLogin} />
      )}

      {showTypeGallery && (
        <TypeGallery
          initialCode={galleryCode}
          hasBmti={!!bmtiCode}
          onStartTest={() => { setShowTypeGallery(false); setGalleryCode(null); setView('quiz'); }}
          onClose={() => { setShowTypeGallery(false); setGalleryCode(null); }}
        />
      )}

      {showDiscConsent && (
        <DiscoveryConsentPrompt
          userId={userProfile?.id}
          onClose={() => setShowDiscConsent(false)}
          onAgreed={() => { setShowDiscConsent(false); setShowDiscovery(true); setView('home'); }}
        />
      )}

    </>
  );
};

export default Navbar;
