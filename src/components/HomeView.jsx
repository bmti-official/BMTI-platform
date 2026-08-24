/* eslint-disable */
import { useState, useRef, useEffect } from 'react';
import { CHARACTERS, CHARACTER_NAMES } from '../data';
import { canRetakeTest } from '../lib/bmtiSystem';
import { supabase } from '../lib/supabaseClient';
import { BMTI_INFO } from './ResultView';
import { BMTI_RESULTS } from '../bmti_results';
import { getEntryForDate, todayISO } from '../lib/diaryHistory';
import { getTypeAccent } from '../lib/typeAccent';
import BmtiRelationMap from './BmtiRelationMap';
import DiaryCta from './DiaryCta';
import TypeGallery from './TypeGallery';
import BingoGallery from './BingoGallery';
import { YELLOW_HL } from './DiaryCta';
import BmtiGuidePopup from './BmtiGuidePopup';
import ShareBox from './ShareBox';
import mTypeImage from '../assets/M 유형.png';
import zTypeImage from '../assets/Z 유형.png';

const HomeView = ({ setView, quizCompleted, isLoggedIn, onRequireLogin, bmtiCode, bmtiAnswers, userProfile }) => {
  const [activeChar, setActiveChar] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showBingo, setShowBingo] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);        // 현재 좌우 이동 위치(px)
  const halfRef = useRef(0);          // 캐릭터 목록 한 벌의 폭(무한 루프 기준)
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const dragDistRef = useRef(0);

  const handleRetakeQuiz = async () => {
    if (!isLoggedIn) {
      if (window.confirm('정말 다시 검사하시겠습니까?\n이전 결과지는 사라집니다.')) {
        setView('quiz');
      }
      return;
    }
    
    const { canRetake, message, isLastForMonth } = await canRetakeTest(userProfile);
    if (!canRetake) {
      alert(message);
      return;
    }

    const confirmText = isLastForMonth
      ? `⚠️ ${message}\n\n그래도 새로운 검사를 진행하시겠습니까?`
      : '정말 다시 검사하시겠습니까?\n이전 결과지는 히스토리에 저장됩니다.';
    if (window.confirm(confirmText)) {
      // 재검사로 덮어써지기 전에, 지금까지의 결과를 히스토리에 남겨둔다.
      if (userProfile?.id && bmtiCode) {
        try {
          await supabase.from('bmti_history').insert({ user_id: userProfile.id, bmti_code: bmtiCode });
        } catch (e) {
          console.error(e);
        }
      }
      setView('quiz');
    }
  };


  // 캐릭터 캐러셀 — 평소엔 자동으로 좌우로 흐르고, 눌러서 드래그하면 손짓 그대로 좌우로 움직인다.
  // (CSS 마퀴 애니메이션 대신 JS로 직접 transform을 제어해 드래그 조작이 가능하게 한다.)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.style.animation = 'none';
    const measure = () => { halfRef.current = el.scrollWidth / 2; };
    measure();
    window.addEventListener('resize', measure);
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const half = halfRef.current || 1;
      if (!draggingRef.current) {
        offsetRef.current -= (half / 40) * dt; // 기존 40초에 한 벌 흐르던 속도 유지
      }
      // 목록을 두 벌 이어 붙였으므로, 한 벌 폭만큼 지나면 되돌려 무한 루프처럼 보이게 한다.
      if (offsetRef.current <= -half) offsetRef.current += half;
      if (offsetRef.current > 0) offsetRef.current -= half;
      el.style.transform = `translateX(${offsetRef.current}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure); };
  }, []);

  const handlePointerDown = (e) => {
    draggingRef.current = true;
    dragDistRef.current = 0;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    if (trackRef.current) trackRef.current.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    dragDistRef.current = Math.abs(dx);
    offsetRef.current = dragStartOffsetRef.current + dx;
  };

  const handlePointerEnd = () => {
    draggingRef.current = false;
    if (trackRef.current) trackRef.current.style.cursor = 'grab';
  };

  const handleCharClick = (char) => {
    if (dragDistRef.current < 8) {
      setActiveChar(char);
    }
  };

  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const charInfo = BMTI_INFO[axisCode];
  const t = getTypeAccent(bmtiCode);
  const hasLoggedToday = !!getEntryForDate(todayISO());

  // 결과 공유 — 링크가 항상 현재 도메인(bmti-official.co.kr)이 되도록,
  // 모바일에선 OS 네이티브 공유(카카오톡 선택 가능)를 우선 사용한다.
  // (카카오 SDK 경로는 카카오 앱에 등록된 도메인/캐시에 따라 예전 주소로 갈 수 있어 폴백으로 둔다.)
  const shareToFriend = () => {
    const siteUrl = 'https://bmti-official.co.kr/';
    // 받은 사람은 공유자 유형의 '예시 결과지'(다른 유형 구경하기)로 바로 들어온다.
    const shareUrl = `${siteUrl}t/${axisCode}.html`;
    const nick = (BMTI_RESULTS[axisCode]?.nickname || CHARACTER_NAMES[axisCode] || axisCode).replace(/\n/g, ' ');
    const title = `나의 BMTI는 ${nick} (${axisCode})!`;
    const description = `${(charInfo?.catchphrase || '내 몸이 원하는 움직임 성향, BMTI').replace(/\n/g, ' ')}\n나와 다른 유형도 구경해보세요!`;
    // 1) 카카오 공유 카드 — '친구에게 자랑하기'와 동일하게 이미지·버튼 있는 피드 카드로 공유
    if (window.Kakao && window.Kakao.Share) {
      const imageUrl = charData ? new URL(charData.originalImage || charData.image, window.location.href).href : undefined;
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: { title, description, imageUrl, link: { webUrl: shareUrl, mobileWebUrl: shareUrl } },
        buttons: [{ title: '다른 유형 구경하기 →', link: { webUrl: shareUrl, mobileWebUrl: shareUrl } }],
      });
      return;
    }
    // 2) 폴백: OS 공유 시트
    if (navigator.share) { navigator.share({ title, text: description.replace(/\n/g, ' '), url: shareUrl }).catch(() => {}); return; }
    // 3) 링크 복사
    navigator.clipboard?.writeText(shareUrl);
    alert('공유 링크를 복사했어요. 카카오톡에 붙여넣어 친구에게 보내보세요!');
  };

  return (
    <div className="fade-in pb-32">
      {/* Full-screen Modal */}
      {activeChar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-lg cursor-pointer"
          onClick={() => setActiveChar(null)}
        >
          <button
            onClick={() => setActiveChar(null)}
            aria-label="닫기"
            className="fixed top-4 right-4 z-[101] w-10 h-10 rounded-full bg-white/25 backdrop-blur-md border border-white/30 text-white text-xl font-bold flex items-center justify-center active:scale-95 transition-transform"
          >
            ✕
          </button>
          <div className="flex flex-col items-center animate-[fadeIn_0.3s_ease-out] px-6 max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className={`w-72 h-72 md:w-96 md:h-96 rounded-full ${activeChar.color} flex items-center justify-center overflow-hidden shadow-2xl border-2 border-white/30`}>
              <img src={activeChar.image} alt={activeChar.id} className="w-full h-full object-contain drop-shadow-2xl" />
            </div>
            {/* 결과지 문구 반영: 코드(제목) → 별명 → 캐치프레이즈 */}
            <div className="mt-7 px-7 py-2.5 bg-white/20 backdrop-blur-lg rounded-full border border-white/30 text-white font-bold text-xl md:text-2xl tracking-wide shadow-xl">
              {BMTI_RESULTS[activeChar.id]?.title || activeChar.id}
            </div>
            {BMTI_RESULTS[activeChar.id]?.nickname && (
              <div className="mt-4 text-white font-bold text-base md:text-lg text-center">{BMTI_RESULTS[activeChar.id].nickname.replace('\n', ' ')}</div>
            )}
            {BMTI_INFO[activeChar.id]?.catchphrase && (
              <p className="mt-2 text-white/80 text-sm md:text-base text-center leading-relaxed whitespace-pre-line">{BMTI_INFO[activeChar.id].catchphrase}</p>
            )}
            <div className="mt-6 text-white/50 text-xs">화면을 누르면 닫혀요</div>
          </div>
        </div>
      )}

      {/* Hero Section — 원래 중앙 정렬 단일 컬럼 + 건강 다이어리 CTA */}
      <section className="pt-24 md:pt-28 pb-16 md:pb-20 px-6 max-w-5xl mx-auto text-center">
        <h1 className="font-serif leading-tight mb-0">
          <div className="flex flex-col items-center justify-center mb-2 md:mb-4">
            <span className="relative inline-flex items-center">
              <span className="text-6xl md:text-8xl font-bold">BMTI</span>
              <button
                type="button"
                onClick={() => setShowGuide(true)}
                aria-label="BMTI 활용법 보기"
                className="absolute left-full ml-2 md:ml-3 top-2 md:top-4 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-500 font-sans font-bold text-[11px] md:text-[13px] px-3 py-1.5 whitespace-nowrap flex items-center justify-center shadow-sm transition"
              >
                어디에 써요?
              </button>
            </span>
            <span className="text-2xl md:text-3xl font-medium mt-3 text-gray-400">움직임 성향 테스트</span>
          </div>
          <span className="text-[min(3vw,11px)] md:text-lg whitespace-nowrap text-gray-400 font-sans tracking-widest md:tracking-[0.3em] font-medium mt-6 block uppercase">
            BODY MANAGEMENT TYPE INDICATOR
          </span>
        </h1>
        {/* CTA — 오늘 기록 전이면 '건강 다이어리 10초 기록하기'(미기록 빨강 점), 기록을 마쳤으면 '이번달 기록·발견 알아보기' */}
        <DiaryCta loggedToday={hasLoggedToday} onGoDiary={() => setView('aichat')} className="mt-9" />
      </section>
      {showGuide && <BmtiGuidePopup onClose={() => setShowGuide(false)} />}

      {/* 검사 전 유저에게만 테스트 유도 버튼 — '내 BMTI 유형'/기록 유도 박스는
          하단 네비 가운데 캐릭터를 누르면 뜨는 팝업(BmtiPartnerPopup)으로 옮겼다. */}
      {!bmtiCode && (
        <div className="px-6 flex justify-center gap-4 fade-in mb-16">
          <div className="flex flex-col items-center w-full max-w-sm">
            <button
              onClick={() => setView('quiz')}
              className="w-full bg-black text-white text-[min(3.5vw,16px)] md:text-lg whitespace-nowrap font-medium px-4 md:px-8 py-4 rounded-full shadow-2xl hover:scale-105 hover:bg-gray-900 transition-all duration-300 flex items-center justify-center gap-2"
            >
              BMTI 테스트 하기!
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </button>
            <p className="mt-3.5 text-xs md:text-sm text-gray-400/80 font-medium tracking-tight">
              2분이면 끝나요 · 로그인 없이 가능
            </p>
          </div>
        </div>
      )}

      {/* 16 Characters Scroll Section — 모바일 폭으로 제한 */}
      <section className="w-full max-w-md mx-auto overflow-hidden mb-6 relative">
        {/* Gradient Fade Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

        {/* Scrollable Content */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          style={{ touchAction: 'pan-y' }}
          className="marquee-content flex gap-6 md:gap-8 px-4 select-none cursor-grab"
        >
          {[...CHARACTERS, ...CHARACTERS].map((char, idx) => (
            <div
              key={idx}
              onClick={() => handleCharClick(char)}
              className={`flex-shrink-0 w-28 h-28 md:w-40 md:h-40 rounded-full border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-center justify-center ${char.color} hover:-translate-y-2 hover:shadow-lg transition-all duration-300 overflow-hidden p-1 relative z-10 cursor-pointer`}
            >
              <img src={char.image} alt={char.id} className="w-full h-full object-contain drop-shadow-sm pointer-events-none" />
            </div>
          ))}
        </div>
      </section>

      {isLoggedIn && bmtiCode && (
        <div className="text-center mb-8">
          <button
            onClick={handleRetakeQuiz}
            className="text-gray-400 hover:text-gray-600 text-xs md:text-sm font-medium underline underline-offset-4 transition-colors"
          >
            다시 검사하기
          </button>
        </div>
      )}

      {/* 친구에게 공유하기 — 결과를 받은 이용자에게만 (결과지와 같은 공용 박스) */}
      {bmtiCode && (
        <div className="px-4 mb-12 w-full max-w-md mx-auto">
          <ShareBox bmtiCode={bmtiCode} bmtiAnswers={bmtiAnswers} isLoggedIn={isLoggedIn} onRequireLogin={onRequireLogin} />
        </div>
      )}

      {/* 다른 유형 구경하기 + BMTI 빙고판 — 관계도 위. 결과지 CTA와 동일한 스타일 */}
      <div className="w-full flex flex-wrap justify-center items-center gap-x-6 gap-y-3 mb-6">
        <button
          onClick={() => setShowGallery(true)}
          className="inline-flex items-center gap-2 bg-transparent border-none active:scale-[0.98] transition-transform"
        >
          <span className="w-8 h-8 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
          </span>
          <span className="text-[13px] md:text-base font-extrabold text-gray-900 whitespace-nowrap" style={YELLOW_HL}>다른 유형 구경하기</span>
          <span className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-900 flex items-center justify-center text-base font-bold shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.12)]">→</span>
        </button>
        <button
          onClick={() => setShowBingo(true)}
          className="inline-flex items-center gap-2 bg-transparent border-none active:scale-[0.98] transition-transform"
        >
          <span className="w-8 h-8 flex items-center justify-center shrink-0 text-lg">⭐️</span>
          <span className="text-[13px] md:text-base font-extrabold text-gray-900 whitespace-nowrap" style={YELLOW_HL}>BMTI 빙고판 하러가기</span>
          <span className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-900 flex items-center justify-center text-base font-bold shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.12)]">→</span>
        </button>
      </div>
      {showGallery && <TypeGallery hasBmti={!!bmtiCode} onStartTest={() => { setShowGallery(false); setView('quiz'); }} onClose={() => setShowGallery(false)} />}
      {showBingo && <BingoGallery onClose={() => setShowBingo(false)} />}

      {/* BMTI 유형 관계도 — 16가지 유형이 어떻게 이어지는지 보여주는 지도 */}
      <BmtiRelationMap bmtiCode={bmtiCode} />

      {/* M/Z 유형 이미지 — 화면 꽉 차게, 화면 크기 상관없이 항상 위아래로만 배치.
          M은 원본 비율이 정사각형에 가까워 꽉 채워도 잘리는 캐릭터가 없지만,
          Z는 원본이 더 옆으로 넓어서(2304x1840) 박스를 그 원본 비율 그대로 맞춰
          object-cover로 채운다 — 비율이 같으므로 크롭 없이 꽉 차면서, 이미지가
          박스 끝까지 닿아 위아래 그라데이션도 M처럼 실제 사진 위에 자연스럽게 걸린다. */}
      <div className="w-full mb-24 flex flex-col">
        <div className="relative w-full max-w-md mx-auto aspect-square overflow-hidden">
          <img src={mTypeImage} alt="M 유형" className="absolute inset-0 w-full h-full object-cover" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
        </div>
        <div className="relative w-full max-w-md mx-auto aspect-[2304/1838] overflow-hidden">
          <img src={zTypeImage} alt="Z 유형" className="absolute inset-0 w-full h-full object-cover" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* 서비스 설명 — 검색 유입과 첫 방문자를 위한 본문. 각 정적 페이지로 가는 길목이기도 하다. */}
        <section className="w-full max-w-2xl mx-auto px-6 pt-4 text-center">
          <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-3 break-keep">BMTI는 어떤 서비스인가요?</h2>
          <p className="text-[13px] md:text-[15px] text-gray-500 leading-relaxed break-keep mb-3">
            BMTI(Body Management Type Indicator)는 물리치료사가 설계한 움직임 성향 검사예요.
            같은 뻐근함이라도 사람마다 반응이 다릅니다. 어떤 사람은 일단 움직여야 풀리고, 어떤 사람은 쉬어야 회복돼요.
            어떤 사람은 &quot;여기가 문제입니다&quot;라는 말에 힘을 얻고, 어떤 사람은 그 말에 마음을 닫습니다.
          </p>
          <p className="text-[13px] md:text-[15px] text-gray-500 leading-relaxed break-keep mb-3">
            BMTI는 그 차이를 <b className="text-gray-700">에너지·시야·학습·피드백</b> 네 가지 축으로 나눠 16가지 유형으로 정리해요.
            2분이면 끝나고 로그인도 필요 없습니다. 검사를 마치면 내 성향에 맞는 회복 습관, 잘 맞는 강사 유형,
            피해야 할 운동 환경까지 담긴 결과지를 받아볼 수 있어요.
          </p>
          <p className="text-[13px] md:text-[15px] text-gray-500 leading-relaxed break-keep mb-3">
            검사 이후에는 <b className="text-gray-700">건강 다이어리</b>로 매일의 기분·수면·불편한 부위를 10초 만에 기록하고,
            한 달치 기록이 쌓이면 나만의 패턴을 정리한 발견 리포트를 받아볼 수 있어요.
          </p>
          <p className="text-[13px] md:text-[15px] text-gray-500 leading-relaxed break-keep">
            <a href="/t/" className="text-gray-700 underline underline-offset-2 font-semibold">16가지 유형 자세히 보기</a>
            {' · '}
            <a href="/magazine.html" className="text-gray-700 underline underline-offset-2 font-semibold">건강 매거진</a>
            {' · '}
            <a href="/about.html" className="text-gray-700 underline underline-offset-2 font-semibold">서비스 소개</a>
          </p>
        </section>
      </div>

      {/* Removed Cards Section */}
    </div>
  );
};

export default HomeView;
