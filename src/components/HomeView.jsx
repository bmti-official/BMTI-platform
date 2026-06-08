import { CHARACTERS } from '../data';

const HomeView = ({ setView, quizCompleted, isLoggedIn }) => (
  <div className="fade-in pb-32">
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
      <p className="text-lg md:text-xl text-gray-600 mb-16 max-w-2xl mx-auto leading-relaxed break-keep">
        운동에 나를 맞추지 말고, 나에게 운동을 맞추다.
      </p>
    </section>

    {/* Sticky CTA Button */}
    {!(isLoggedIn && quizCompleted) && (
      <div className="sticky top-6 md:top-10 left-0 right-0 px-6 flex justify-center z-50 fade-in mb-16 pointer-events-none">
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

    {/* 16 Characters Marquee Section */}
    <section className="w-full overflow-hidden mb-24 relative">
      {/* Gradient Fade Edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

      {/* Marquee Content */}
      <div className="marquee-content flex gap-6 md:gap-8 px-4">
        {[...CHARACTERS, ...CHARACTERS].map((char, idx) => (
          <div
            key={idx}
            className={`flex-shrink-0 w-36 h-36 md:w-56 md:h-56 rounded-full border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-center justify-center ${char.color} hover:-translate-y-2 transition-transform duration-300 cursor-pointer overflow-hidden`}
          >
            <img src={char.image} alt={char.id} className="w-full h-full object-cover scale-[1.35] drop-shadow-sm" />
          </div>
        ))}
      </div>
    </section>

    {/* Cards Section */}
    <section className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-6 mb-24">
      <div className="bg-[#f2f2f2] rounded-3xl p-10 h-[500px] flex flex-col justify-between relative overflow-hidden group">
        <div className="z-10 relative">
          <h3 className="text-2xl font-medium mb-2">BMTI Analysis</h3>
          <p className="text-gray-600">정밀한 신체 유형 분석 에이전트</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-200/50 to-transparent"></div>
        <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-white/40 rounded-full blur-3xl"></div>
        <button id="explore-analysis" className="z-10 bg-black text-white px-6 py-2 rounded-full w-max text-sm hover:bg-gray-800 transition-colors">Explore</button>
      </div>

      <div className="bg-[#f8f9fa] border border-gray-100 rounded-3xl p-10 h-[500px] flex flex-col justify-between relative overflow-hidden group">
        <div className="z-10 relative">
          <h3 className="text-2xl font-medium mb-2">Personalized Plan</h3>
          <p className="text-gray-600">유형별 맞춤 라이프스타일 플랫폼</p>
        </div>
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#c0ff00]/20 rounded-full blur-3xl"></div>
        <button id="explore-plan" className="z-10 bg-black text-white px-6 py-2 rounded-full w-max text-sm hover:bg-gray-800 transition-colors">Explore</button>
      </div>
    </section>

    {/* Quote Section */}
    <section className="max-w-4xl mx-auto px-6 text-center mb-32">
      <p className="text-3xl font-serif leading-relaxed mb-6">
        "If we're going to move to the level of true physical wellness that we want, then understanding BMTI is the key."
      </p>
      <p className="text-sm font-medium">BMTI Research Lab</p>
      <p className="text-xs text-gray-500">Director of Human Body Analytics</p>
    </section>

  </div>
);

export default HomeView;
