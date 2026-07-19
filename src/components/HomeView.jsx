/* eslint-disable */
import { useState, useRef } from 'react';
import { CHARACTERS, CHARACTER_NAMES } from '../data';
import { canRetakeTest } from '../lib/bmtiSystem';
import { supabase } from '../lib/supabaseClient';
import { BMTI_INFO } from './ResultView';
import { getEntryForDate, todayISO } from '../lib/diaryHistory';
import mTypeImage from '../assets/M 유형.png';
import zTypeImage from '../assets/Z 유형.jpg';

const HomeView = ({ setView, quizCompleted, isLoggedIn, onRequireLogin, bmtiCode, userProfile }) => {
  const [activeChar, setActiveChar] = useState(null);
  const sliderRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
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


  // Mouse events
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    dragDistRef.current = 0;
    startXRef.current = e.pageX;
    scrollLeftRef.current = sliderRef.current.scrollLeft;
    sliderRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const dx = e.pageX - startXRef.current;
    dragDistRef.current = Math.abs(dx);
    sliderRef.current.scrollLeft = scrollLeftRef.current - dx;
  };

  const handleMouseEnd = () => {
    isDraggingRef.current = false;
    if (sliderRef.current) sliderRef.current.style.cursor = 'grab';
  };

  // Touch events
  const handleTouchStart = (e) => {
    isDraggingRef.current = true;
    dragDistRef.current = 0;
    startXRef.current = e.touches[0].pageX;
    scrollLeftRef.current = sliderRef.current.scrollLeft;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.touches[0].pageX - startXRef.current;
    dragDistRef.current = Math.abs(dx);
    sliderRef.current.scrollLeft = scrollLeftRef.current - dx;
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const handleCharClick = (char) => {
    if (dragDistRef.current < 8) {
      setActiveChar(char);
    }
  };

  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const charInfo = BMTI_INFO[axisCode];
  const hasLoggedToday = !!getEntryForDate(todayISO());

  return (
    <div className="fade-in pb-32">
      {/* Full-screen Modal */}
      {activeChar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-lg cursor-pointer"
          onClick={() => setActiveChar(null)}
        >
          <div className="flex flex-col items-center animate-[fadeIn_0.3s_ease-out]">
            <div className={`w-72 h-72 md:w-96 md:h-96 rounded-full ${activeChar.color} flex items-center justify-center overflow-hidden shadow-2xl border-2 border-white/30`}>
              <img src={activeChar.image} alt={activeChar.id} className={`w-full h-full object-contain drop-shadow-2xl ${['OCDZ', 'OCQM', 'OLQM'].includes(activeChar.id) ? 'scale-100' : 'scale-125'} ${activeChar.imgClass || ''}`} />
            </div>
            <div className="mt-8 px-8 py-3 bg-white/20 backdrop-blur-lg rounded-full border border-white/30 text-white font-bold text-3xl tracking-widest shadow-xl">
              {activeChar.id}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6 max-w-5xl mx-auto text-center">
        <h1 className="font-serif leading-tight mb-8">
          <div className="flex flex-col items-center justify-center mb-2 md:mb-4">
            <span className="text-6xl md:text-8xl font-bold">BMTI</span>
            <span className="text-2xl md:text-3xl font-medium mt-3 text-gray-400">움직임 성향 테스트</span>
          </div>
          <span className="text-[min(3vw,11px)] md:text-lg whitespace-nowrap text-gray-400 font-sans tracking-widest md:tracking-[0.3em] font-medium mt-6 block uppercase">
            BODY MANAGEMENT TYPE INDICATOR
          </span>
        </h1>
        <p className="text-[min(3.5vw,16px)] md:text-xl whitespace-nowrap text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed break-keep w-full">
          나를 알아야, 나에게 맞출 수 있다.
        </p>
      </section>

      {/* CTA Buttons */}
      <div className="px-6 flex justify-center gap-4 fade-in mb-16">
        {(!bmtiCode) ? (
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
        ) : (
          <div className="w-full max-w-md flex flex-col gap-4">
            {/* 내 BMTI 파트너 미리보기 */}
            <div className="bg-[#F7F6F3] rounded-[2rem] p-6 md:p-8">
              <p className="text-xs md:text-sm font-bold text-gray-400 mb-4">내 BMTI 파트너</p>
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${charData?.color || 'bg-gray-100'}`}>
                  {charData && <img src={charData.image} alt={axisCode} className={`w-full h-full object-contain ${charData.imgClass || ''}`} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-2xl md:text-3xl font-black tracking-tight">{axisCode}</span>
                    <span className="bg-pink-100 text-pink-600 text-xs md:text-sm font-bold px-2.5 py-1 rounded-full whitespace-nowrap">{CHARACTER_NAMES[axisCode]}</span>
                  </div>
                  <p className="text-gray-500 text-sm md:text-base leading-snug whitespace-pre-line break-keep">{charInfo?.catchphrase}</p>
                </div>
              </div>
              {!isLoggedIn ? (
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => { if (onRequireLogin) onRequireLogin(); }}
                    className="w-full bg-[#FEE500] text-[#3C1E1E] font-bold py-4 rounded-2xl text-[min(3.5vw,15px)] md:text-lg hover:bg-[#F4DC00] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md mb-3"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#3C1E1E]">
                      <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
                    </svg>
                    카카오로 3초 저장
                  </button>
                  <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
                    <span>🔕</span> 광고 안 보냄 · 결과만 저장
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setView('result')}
                  className="w-full bg-black text-white text-[min(3.5vw,15px)] md:text-lg font-bold py-4 rounded-2xl hover:bg-gray-900 transition-colors"
                >
                  내 결과 자세히 보기
                </button>
              )}
            </div>

            {/* 오늘 하루일기 기록 유도 — 오늘 이미 기록했으면 숨김 */}
            {(isLoggedIn && !hasLoggedToday) && (
              <button
                onClick={() => setView('aichat')}
                className="w-full bg-[#E9F1EC] hover:bg-[#DDEBE3] rounded-[2rem] p-6 text-left flex items-center justify-between transition-colors"
              >
                <div>
                  <p className="font-black text-gray-900 mb-1">오늘 기록, 아직이에요</p>
                  <p className="text-sm text-[#5F8A76] font-medium">10초면 충분해요</p>
                </div>
                <span className="text-2xl text-gray-300">›</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 16 Characters Scroll Section */}
      <section className="w-full overflow-hidden mb-6 relative">
        {/* Gradient Fade Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

        {/* Scrollable Content */}
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseEnd}
          onMouseLeave={handleMouseEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="marquee-content flex gap-6 md:gap-8 px-4 select-none cursor-grab"
        >
          {[...CHARACTERS, ...CHARACTERS].map((char, idx) => (
            <div
              key={idx}
              onClick={() => handleCharClick(char)}
              className={`flex-shrink-0 w-28 h-28 md:w-40 md:h-40 rounded-full border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-center justify-center ${char.color} hover:-translate-y-2 hover:shadow-lg transition-all duration-300 overflow-hidden p-1 relative z-10 cursor-pointer`}
            >
              <img src={char.image} alt={char.id} className={`w-full h-full object-contain scale-[1.10] drop-shadow-sm pointer-events-none ${char.imgClass || ''}`} />
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

      {/* M/Z 유형 이미지 — 화면 꽉 차게, 화면 크기 상관없이 항상 위아래로만 배치.
          M은 원본 비율이 정사각형에 가까워 꽉 채워도 잘리는 캐릭터가 없지만,
          Z는 원본이 더 옆으로 넓어서 정사각형으로 꽉 채우면(object-cover) 좌우
          캐릭터가 잘리므로 object-contain으로 축소해 전체가 다 보이게 한다.
          위아래 끝은 흰 배경으로 자연스럽게 번지도록 그라데이션을 얹는다. */}
      <div className="w-full mb-24 flex flex-col">
        <div className="relative w-full aspect-square overflow-hidden">
          <img src={mTypeImage} alt="M 유형" className="absolute inset-0 w-full h-full object-cover" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
        </div>
        <div className="relative w-full aspect-square overflow-hidden">
          <img src={zTypeImage} alt="Z 유형" className="absolute inset-0 w-full h-full object-contain" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>

      {/* Removed Cards Section */}
    </div>
  );
};

export default HomeView;
