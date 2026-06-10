import { useState, useRef } from 'react';
import { CHARACTERS } from '../data';

const HomeView = ({ setView, quizCompleted, isLoggedIn }) => {
  const [activeChar, setActiveChar] = useState(null);
  const sliderRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragDistRef = useRef(0);

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

  return (
    <div className="fade-in pb-32">
      {/* Full-screen Modal */}
      {activeChar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-lg cursor-pointer"
          onClick={() => setActiveChar(null)}
        >
          <div className="flex flex-col items-center animate-[fadeIn_0.3s_ease-out]">
            <div className={`w-72 h-72 md:w-96 md:h-96 rounded-full ${activeChar.color} flex items-center justify-center overflow-hidden shadow-2xl border-2 border-white/30 p-2`}>
              <img src={activeChar.image} alt={activeChar.id} className={`w-full h-full object-contain drop-shadow-2xl ${activeChar.imgClass || ''}`} />
            </div>
            <div className="mt-8 px-8 py-3 bg-white/20 backdrop-blur-lg rounded-full border border-white/30 text-white font-bold text-3xl tracking-widest shadow-xl">
              {activeChar.id}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-40 pb-12 px-6 max-w-5xl mx-auto text-center">
        <h1 className="font-serif leading-tight mb-8">
          <div className="flex flex-col items-center justify-center mb-2 md:mb-4">
            <span className="text-6xl md:text-8xl font-bold">BMTI</span>
            <span className="text-2xl md:text-3xl font-medium mt-3 text-gray-400">운동 심리검사</span>
          </div>
          <span className="text-sm md:text-lg text-gray-400 font-sans tracking-[0.2em] md:tracking-[0.3em] font-medium mt-6 block uppercase">
            BODY MANAGEMENT TYPE INDICATOR
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed break-keep">
          운동에 나를 맞추지 말고, 나에게 운동을 맞추다.
        </p>
      </section>

      {/* Sticky CTA Button */}
      {!(isLoggedIn && quizCompleted) && (
        <div className="sticky top-32 md:top-28 left-0 right-0 px-6 flex justify-center z-50 fade-in mb-16 pointer-events-none">
          <button
            id="start-quiz-cta"
            onClick={() => setView('quiz')}
            className="pointer-events-auto bg-black text-white text-lg font-medium px-12 py-4 rounded-full shadow-2xl hover:scale-105 hover:bg-gray-900 transition-all duration-300 flex items-center gap-2"
          >
            BMTI test GO!
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </button>
        </div>
      )}

      {/* 16 Characters Scroll Section */}
      <section className="w-full overflow-hidden mb-24 relative">
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

      {/* Removed Cards Section */}

      {/* Quote Section */}
      <section className="max-w-4xl mx-auto px-6 text-center mb-32">
        <p className="text-xl md:text-3xl font-serif leading-relaxed italic">
          당신의 의지가 부족했던 게 아니라,<br/>
          내 몸의 진짜 성향을 몰랐을 뿐입니다.<br/>
          성격이 모두 다르듯,
        </p>
      </section>
    </div>
  );
};

export default HomeView;
