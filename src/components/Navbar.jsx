/* eslint-disable */
const KakaoIcon = ({ className = "w-3.5 h-3.5 fill-current" }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
  </svg>
);

import { useState, useEffect, useRef } from 'react';
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

// ── 10월 하단 네비 — 두 층 ─────────────────────────────────
// 루트: 다이어리 · [캐릭터] · 자기점검
// 다이어리: 이전 · 오늘 쓰기 · [캐릭터] · 이번달 기록 · 이번달 발견
// 자기점검: 이전 · 둘러보기 · [캐릭터] · 바디플리 · 내 보관함
// 모양은 관리자 미리보기(admin/PreviewModal.jsx)와 같다.
// 자기점검 — 두께가 있는 노란 번개. 가끔 번쩍 친다(nav-bolt).
// 같은 화면에 두 번(하단 네비·상단 제목) 설 수 있어 그러데이션 이름을 자리마다 달리 받는다.
const BOLT_D = 'M13.2 1.8 4.6 13.1h5.5l-1 8.6 8.9-11.6h-5.8l1-8.3Z';
const Bolt3D = ({ size = 24, id = 'nav' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" className="nav-bolt" style={{ overflow: 'visible' }} aria-hidden="true">
    <defs>
      <linearGradient id={`bolt-face-${id}`} x1="6" y1="2" x2="16" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFF3A3" /><stop offset="0.45" stopColor="#FFD233" /><stop offset="1" stopColor="#FF9F0A" />
      </linearGradient>
      <linearGradient id={`bolt-side-${id}`} x1="6" y1="2" x2="18" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#D98A0B" /><stop offset="1" stopColor="#A85F05" />
      </linearGradient>
    </defs>
    {/* 옆면 — 같은 모양을 조금씩 밀어 겹쳐 두께를 만든다 */}
    {[1.5, 1.1, 0.7, 0.35].map((k) => (
      <path key={k} d={BOLT_D} transform={`translate(${k} ${k * 0.85})`} fill={`url(#bolt-side-${id})`} stroke={`url(#bolt-side-${id})`} strokeWidth="0.9" strokeLinejoin="round" />
    ))}
    {/* 앞면 */}
    <path d={BOLT_D} fill={`url(#bolt-face-${id})`} stroke="#E9A40F" strokeWidth="0.7" strokeLinejoin="round" />
    {/* 빛 받은 모서리 */}
    <path d="M12.3 3.6 6.4 11.9" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.1" strokeLinecap="round" />
    <path d="M11.2 14.2 10.6 18.6" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.9" strokeLinecap="round" />
    {/* 번쩍일 때 튀는 불꽃 */}
    <g className="nav-bolt-spark" stroke="#FFD233" strokeWidth="1.3" strokeLinecap="round">
      <path d="M2.2 6.2 4 7.4" /><path d="M20.4 4.2 19 5.8" /><path d="M21.6 16.2 19.8 15.6" /><path d="M3 19.4 4.6 18.2" />
    </g>
  </svg>
);
const GlassMark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
);
const PlayMark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M8 5.5l11 6.5-11 6.5z" fill="currentColor" /></svg>
);
const BoxMark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5h18v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5z" /><path d="M2.5 4.5h19v4h-19zM9.5 13h5" /></svg>
);
const PenMark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20l4.5-1.2L20 7.3a2 2 0 0 0 0-2.8l-.5-.5a2 2 0 0 0-2.8 0L5.2 15.5z" /><path d="M15.5 6l2.5 2.5" /></svg>
);
const ChartMark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 20V12M12 20V5M19 20v-6" /></svg>
);
const CalMark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3.5v3M16 3.5v3" /></svg>
);
const BackMark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 5.5L8 12l6.5 6.5" /></svg>
);
const ROUND = "'Jua','Pretendard',-apple-system,sans-serif";

// 알약 안의 한 칸(아이콘 + 라벨). 여러 칸을 묶어 화면 가로를 꽉 채우는 알약을 만든다.
// color: 루트 칸(다이어리·자기점검)은 고른 칸이 없으므로 회색으로 죽이지 않고 제 색 그대로 둔다.
const PillTab = ({ active, onClick, icon, label, color = false }) => (
  <button onClick={onClick} className="nav-tab flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1.5 rounded-2xl active:scale-95"
    style={active ? { background: '#F3F1EC' } : undefined}>
    {/* 고른 칸은 예전 '나의 유형'처럼 세 번 내려갔다 올라오며 색이 바뀐다 */}
    <span className={`nav-tab-ico w-6 h-6 flex items-center justify-center ${active ? 'nav-check-anim' : color ? '' : 'opacity-45 grayscale'}`}>{icon}</span>
    <span className={`nav-tab-lb ${label.length > 4 ? 'text-[8.5px]' : 'text-[9.5px]'} font-bold whitespace-nowrap ${active ? 'text-black' : color ? 'text-gray-600' : 'text-gray-400'}`}>{label}</span>
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

const Navbar = ({ currentView, setView, isLoggedIn, setIsLoggedIn, onRequireLogin, userProfile, bmtiCode, selfTab = 'browse', setSelfTab }) => {

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
  const [discTab, setDiscTab] = useState('records');   // 'records' 이번달 기록 | 'discovery' 이번달 발견
  // 기록·발견은 [선택] 동의가 있어야 열람 가능 — 없으면 동의 유도 팝업.
  const [showDiscConsent, setShowDiscConsent] = useState(false);
  // 기록·발견은 다이어리 층 안에서 연다 — 뒤에는 오늘 쓰기(캘린더)를 깔아 둔다
  const openDiscovery = (tab = 'records') => {
    const t = typeof tab === 'string' ? tab : 'records';
    setDiscTab(t);
    if (hasOptionalHealthConsent()) { enterLayer(); setShowDiscovery(true); setView('aichat'); }
    else { setShowDiscConsent(true); }
  };

  // ── 어느 층에 있나 ──
  const layer = showDiscovery || currentView === 'aichat' ? 'diary' : currentView === 'self' ? 'self' : 'root';
  const layerRef = useRef(layer);
  useEffect(() => { layerRef.current = layer; }, [layer]);
  // 펼쳐지는 결 — 다이어리는 왼쪽 칸이라 오른쪽으로, 자기점검은 오른쪽 칸이라 왼쪽으로
  const [grow, setGrow] = useState('');
  // 휴대폰 뒤로가기·가장자리 스와이프 — 층 안에서 누르면 루트로 나온다(사이트를 떠나지 않게).
  // 루트에서 층으로 들어갈 때 한 칸을 쌓아 두고, 뒤로가기가 그 칸을 꺼내면 루트로 돌린다.
  const pushed = useRef(false);
  const enterLayer = () => {
    if (layerRef.current !== 'root' || pushed.current) return;
    try { window.history.pushState({ bmtiLayer: 1 }, ''); pushed.current = true; } catch { /* 무시 */ }
  };
  const toRoot = () => { setGrow('right'); setShowDiscovery(false); setView('home'); };
  // 어느 길로 들어왔든(첫 화면이 다이어리인 재방문 회원, 홈의 '다이어리 기록하기' 버튼 등)
  // 층에 들어온 순간 한 칸을 쌓아 둔다 — 그래야 첫 뒤로가기가 사이트를 떠나지 않고 루트로 온다.
  useEffect(() => {
    if (layer === 'root' || pushed.current) return;
    try { window.history.pushState({ bmtiLayer: 1 }, ''); pushed.current = true; } catch { /* 무시 */ }
  }, [layer]);
  useEffect(() => {
    const onPop = () => {
      pushed.current = false;
      if (layerRef.current !== 'root') toRoot();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const goBack = () => {
    if (pushed.current) { try { window.history.back(); return; } catch { /* 무시 */ } }
    toRoot();
  };
  const goDiary = () => { enterLayer(); setGrow('right'); setShowDiscovery(false); setView('aichat'); };
  const goSelf = (tab = 'browse') => { enterLayer(); setGrow('left'); setShowDiscovery(false); setSelfTab && setSelfTab(tab); setView('self'); };
  const tabOn = (k) => (layer === 'diary' ? (showDiscovery ? discTab === k : k === 'today') : layer === 'self' ? selfTab === k : false);
  const ROWS = {
    root: [
      { key: 'diary', label: '다이어리', icon: <Mallang v={diaryMoodTick} size={24} noBlink />, on: goDiary, color: true },
      { key: 'char' },
      { key: 'self', label: '자기점검', icon: <Bolt3D size={24} id="tab" />, on: () => goSelf('browse'), color: true },
    ],
    diary: [
      { key: 'back', label: '이전', icon: <BackMark />, on: goBack },
      { key: 'today', label: '오늘 쓰기', icon: <PenMark />, on: () => { setShowDiscovery(false); setView('aichat'); } },
      { key: 'char' },
      { key: 'records', label: '이번달 기록', icon: <CalMark />, on: () => openDiscovery('records') },
      { key: 'discovery', label: '이번달 발견', icon: <ChartMark />, on: () => openDiscovery('discovery') },
    ],
    self: [
      { key: 'back', label: '이전', icon: <BackMark />, on: goBack },
      { key: 'browse', label: '둘러보기', icon: <GlassMark />, on: () => setSelfTab && setSelfTab('browse') },
      { key: 'char' },
      // 바디플리는 둘러보기 안으로 들어갔다. 비운 자리에는 강사·회원을 잇는 칸이 들어올 예정이라,
      // 그때까지는 내 보관함이 두 칸 너비를 써서 가운데 캐릭터 자리가 틀어지지 않게 한다.
      { key: 'box', label: '내 보관함', icon: <BoxMark />, on: () => setSelfTab && setSelfTab('box'), wide: true },
    ],
  };
  // ── 오른쪽 위 마이페이지 알약 ──
  // 다이어리·자기점검에서는 가운데 방 이름과 겹치지 않게 사람 아이콘만 남기고 줄인다.
  // 한 번 누르면 (구독·관리자)닉네임이 펼쳐지고, 펼친 채로 다시 누르면 마이페이지로 간다.
  // 펼쳐 둔 채 다른 곳을 누르거나 화면을 밀면(하던 일을 이어 가면) 다시 줄어든다.
  const pillRef = useRef(null);
  const [openAt, setOpenAt] = useState(null);          // 어느 방에서 펼쳤는지 — 방이 바뀌면 저절로 접힌다
  const pillOpen = openAt === layer;
  const pillSmall = layer !== 'root' && !pillOpen;
  useEffect(() => {
    if (!pillOpen) return undefined;
    const close = (e) => { if (pillRef.current && e && pillRef.current.contains(e.target)) return; setOpenAt(null); };
    const t = setTimeout(() => setOpenAt(null), 6000);
    window.addEventListener('pointerdown', close, true);
    window.addEventListener('scroll', close, true);
    window.addEventListener('wheel', close, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', close, true);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('wheel', close, true);
    };
  }, [pillOpen]);
  const tier = ['plus', 'pro'].includes(String(userProfile?.subscription_tier || '').toLowerCase())
    ? String(userProfile.subscription_tier).toUpperCase() : '';

  const TITLE = { diary: { text: '다이어리', icon: <Mallang v={4} size={22} noBlink /> }, self: { text: '자기점검', icon: <Bolt3D size={23} id="title" /> } };
  // 홈·결과지·파트너 팝업의 '이번달 기록·발견 알아보기' CTA(DiaryCta)가 발행하는 이벤트로 기록·발견을 연다.
  useEffect(() => {
    const open = () => openDiscovery('records');
    window.addEventListener('bmti:open-discovery', open);
    return () => window.removeEventListener('bmti:open-discovery', open);
  }, [setView]);
  // 다이어리 안에서 '각도기록 보기' 등으로 이번달 기록을 열 때
  useEffect(() => {
    const open = (e) => openDiscovery(e.detail || 'records');
    window.addEventListener('bmti:open-report', open);
    return () => window.removeEventListener('bmti:open-report', open);
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
        /* 번개 — 대부분은 가만히 있다가 가끔 두 번 번쩍인다 */
        @keyframes navBoltStrike {
          0%, 83%, 100% { filter: none; transform: none; }
          85% { filter: brightness(1.7) drop-shadow(0 0 5px #FFE25A); transform: scale(1.16) rotate(-5deg); }
          87% { filter: none; transform: scale(1); }
          89.5% { filter: brightness(1.9) drop-shadow(0 0 8px #FFF0A0); transform: scale(1.2) rotate(4deg); }
          93% { filter: brightness(1.15) drop-shadow(0 0 3px #FFE25A); transform: scale(1.04); }
        }
        @keyframes navBoltSpark { 0%, 84%, 92%, 100% { opacity: 0; } 85.5%, 90% { opacity: 1; } 87.5% { opacity: 0; } }
        .nav-bolt { animation: navBoltStrike 4.8s ease-out infinite; transform-origin: 50% 55%; }
        .nav-bolt-spark { opacity: 0; animation: navBoltSpark 4.8s linear infinite; }
        /* 커서를 올리면 반응 — 손가락 화면에서는 눌린 채 남지 않게 커서가 있는 기기에서만 */
        .nav-tab { transition: background-color .18s ease, transform .15s ease; }
        .nav-tab .nav-tab-ico { transition: transform .22s cubic-bezier(.3,1.6,.5,1), opacity .18s ease, filter .18s ease; }
        .nav-tab .nav-tab-lb { transition: color .18s ease; }
        .nav-top { transition: transform .2s cubic-bezier(.3,1.5,.5,1), box-shadow .2s ease, background-color .18s ease; }
        .nav-char-in { transition: transform .26s cubic-bezier(.3,1.7,.5,1); }
        @media (hover: hover) and (pointer: fine) {
          .nav-tab:hover { background-color: #F7F4EC; }
          .nav-tab:hover .nav-tab-ico { transform: translateY(-2px) scale(1.14); opacity: 1; filter: none; }
          .nav-tab:hover .nav-tab-lb { color: #1C1A17; }
          .nav-top:hover { transform: translateY(-2px) scale(1.05); box-shadow: 0 6px 18px rgba(0,0,0,0.2); }
          .nav-char:hover .nav-char-in { transform: translateY(-5px) scale(1.09) rotate(-5deg); }
        }
        @media (prefers-reduced-motion: reduce) { .nav-bolt, .nav-bolt-spark { animation: none !important; } }
      `}</style>
      {/* 모든 페이지: 위로 한번에 올리기 버튼 */}
      <AppScrollTop />

      {/* 상단: 홈(집) 원형 버튼 — 항상 떠 있음 */}
      <div className="fixed top-3 left-3 z-40">
        <button
          onClick={() => { if (layer !== 'root') goBack(); else { setShowDiscovery(false); setView('home'); } }}
          aria-label="홈"
          className="nav-top w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-center active:scale-95"
        >
          <HomeIcon className={`w-6 h-6 ${currentView === 'home' ? 'text-black' : 'text-gray-500'}`} />
        </button>
      </div>

      {/* 이번달 기록·발견도 같은 띠를 깐다(달력 화면은 스스로 깔고 있다) */}
      {((layer === 'self' && currentView === 'self') || (layer === 'diary' && showDiscovery)) && (
        <div aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 34, pointerEvents: 'none',
          background: 'linear-gradient(#FFFFFF, rgba(255,255,255,0))', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} />
      )}

      {/* 상단 가운데: 지금 어느 방인지 — 하단 줄이 통째로 바뀌니 여기가 길잡이다 */}
      {layer !== 'root' && currentView !== 'quiz' && (
        <div className="fixed top-3 z-40 pointer-events-none flex items-center justify-center gap-1.5"
          style={{ left: 64, right: isLoggedIn ? 64 : 150, height: 44,
            opacity: isLoggedIn && pillOpen ? 0 : 1, transition: 'opacity .25s ease' }}>
          <span className="w-6 h-6 flex items-center justify-center text-black">{TITLE[layer].icon}</span>
          <span style={{ fontFamily: ROUND, fontSize: 21, color: '#111', lineHeight: 1, whiteSpace: 'nowrap' }}>{TITLE[layer].text}</span>
        </div>
      )}

      {/* 상단: 닉네임 + 마이페이지(사람) 알약 / 미로그인 시 카카오 로그인 — 항상 떠 있음 */}
      <div id="login-button" className="fixed top-3 right-3 z-40">
        {isLoggedIn ? (
          <button ref={pillRef}
            onClick={() => {
              if (pillSmall) { setOpenAt(layer); return; }     // 줄어 있을 땐 먼저 펼친다
              setOpenAt(null); setShowDiscovery(false); setView('mypage');
            }}
            aria-label={pillSmall ? '내 정보 펼치기' : '마이페이지'} aria-expanded={!pillSmall}
            className={`nav-top flex items-center py-1.5 pr-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.12)] border active:scale-95 ${currentView === 'mypage' ? 'border-black' : 'border-gray-100'}`}
            style={{ paddingLeft: pillSmall ? 6 : 14, transition: 'padding-left .38s cubic-bezier(.3,.7,.2,1), border-color .2s, transform .2s cubic-bezier(.3,1.5,.5,1), box-shadow .2s ease' }}
          >
            {userProfile && (
              <span className="flex items-center gap-1.5"
                style={{ maxWidth: pillSmall ? 0 : 260, opacity: pillSmall ? 0 : 1, marginRight: pillSmall ? 0 : 8,
                  overflow: 'hidden', whiteSpace: 'nowrap',
                  transition: 'max-width .38s cubic-bezier(.3,.7,.2,1), opacity .25s ease, margin-right .38s cubic-bezier(.3,.7,.2,1)' }}>
                {userProfile.nickname === 'BMTI' && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md">관리자</span>}
                {tier && <span className="text-[10px] font-black text-white px-1.5 py-0.5 rounded-md" style={{ background: '#C9975A' }}>{tier}</span>}
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
            className="nav-top flex items-center gap-1.5 bg-[#FEE500] rounded-full pl-2.5 pr-3.5 h-11 shadow-[0_2px_10px_rgba(0,0,0,0.12)] hover:bg-[#F4DC00] active:scale-95"
          >
            <KakaoIcon className="w-5 h-5 fill-black" />
            <span className="text-[13px] font-bold text-[#3C1E1E] whitespace-nowrap">3초 로그인/회원가입</span>
          </button>
        )}
      </div>

      {/* 하단: 하나의 기다란 떠 있는 알약(가운데 캐릭터 자리) — BMTI 설문 중에는 숨긴다 */}
      {currentView !== 'quiz' && (
        <>
          <style>{
            '@keyframes navGrowR{0%{clip-path:inset(0 100% 0 0);opacity:.35;transform:translateX(-6px)}55%{opacity:1}100%{clip-path:inset(0 0 0 0);opacity:1;transform:translateX(0)}}'
            + '@keyframes navGrowL{0%{clip-path:inset(0 0 0 100%);opacity:.35;transform:translateX(6px)}55%{opacity:1}100%{clip-path:inset(0 0 0 0);opacity:1;transform:translateX(0)}}'
            + '@keyframes navTabIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}'
            + '@media (prefers-reduced-motion: reduce){.bmti-nav,.bmti-nav *{animation:none!important}}'
          }</style>
          <div className="fixed bottom-3 left-2 right-2 z-40">
            <div key={`${layer}-${grow}`} className="bmti-nav flex items-center bg-white/95 backdrop-blur-md rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.14)] border border-gray-100 px-1.5 py-1"
              style={{ animation: grow ? `navGrow${grow === 'right' ? 'R' : 'L'} .5s cubic-bezier(.16,.84,.28,1) both` : 'none' }}>
              {ROWS[layer].map((t, i) => (t.key === 'char' ? (
                <span key="char" className="w-14 shrink-0" aria-hidden="true" />
              ) : (
                <span key={t.key} className="flex-1 min-w-0 flex" style={{ flex: t.wide ? '2 1 0%' : undefined, animation: grow ? `navTabIn .34s ease-out ${0.08 + i * 0.045}s both` : 'none' }}>
                  <PillTab active={tabOn(t.key)} onClick={t.on} icon={t.icon} label={t.label} color={!!t.color} />
                </span>
              )))}
            </div>
          </div>

          {/* 중앙 캐릭터 — 알약 위로 떠 있는 버튼. 누르면 '내 BMTI 유형' 팝업을 연다 */}
          <button
            onClick={() => setShowPartner(true)}
            aria-label="내 BMTI 유형"
            className="nav-char fixed left-1/2 -translate-x-1/2 bottom-5 z-40 active:scale-95 transition-transform"
          >
            <div className="nav-char-in relative w-14 h-14 flex items-center justify-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]">
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
        <MallangDiscoveryReport oct tab={discTab} onTab={setDiscTab} onClose={() => setShowDiscovery(false)} bmtiCode={bmtiCode} userData={userProfile} isLoggedIn={isLoggedIn} onRequireLogin={onRequireLogin} />
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
          onAgreed={() => { setShowDiscConsent(false); enterLayer(); setShowDiscovery(true); setView('aichat'); }}
        />
      )}

    </>
  );
};

export default Navbar;
