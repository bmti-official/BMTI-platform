/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { QUESTIONS, PART2_QUESTION, PART2_OPTIONS, calculateBMTI } from '../data';

const QuizView = ({ setView, setQuizCompleted, setBmtiCode, setBmtiAnswers }) => {
  const [shuffledQuestions] = useState(() => [...QUESTIONS].sort(() => Math.random() - 0.5));
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]); // Array of { id, score }
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'disclaimer' | 'loading'
  const [pendingCode, setPendingCode] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const textRef = useRef(null);
  const prefixRef = useRef(null);



  const totalSteps = shuffledQuestions.length;
  const currentStep = phase === 'quiz' ? step + 1 : shuffledQuestions.length;
  const progress = (currentStep / totalSteps) * 100;

  const handleAnswer = (score) => {
    const currentQuestion = shuffledQuestions[step];
    const newAnswers = [...answers, { id: currentQuestion.id, score }];
    setAnswers(newAnswers);

    if (step < shuffledQuestions.length - 1) {
      setStep(prev => prev + 1);
    } else {
      const orderedAnswers = new Array(QUESTIONS.length);
      newAnswers.forEach(ans => {
        orderedAnswers[ans.id - 1] = ans.score;
      });
      const finalCode = calculateBMTI(orderedAnswers);
      console.log('🧬 BMTI Code:', finalCode);
      console.log('📊 Answers:', orderedAnswers);
      setPendingCode(finalCode);
      setPhase('disclaimer');
    }
  };

  const handleBack = () => {
    if (phase === 'quiz' && step === 0) return;

    setAnswers(prev => prev.slice(0, -1));

    if (phase === 'disclaimer') {
      setPhase('quiz');
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handleProceedToResult = () => {
    setPhase('loading');
    setLoadingProgress(0);
  };

  const handleGoBackToEdit = () => {
    setAnswers(prev => prev.slice(0, -1));
    setPhase('quiz');
  };

  // 로딩 3초 후 결과지로 전환
  useEffect(() => {
    if (phase !== 'loading') return;
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 60); // ~3s for 0→100

    const timer = setTimeout(() => {
      setBmtiCode(pendingCode);
      if (setBmtiAnswers) {
        const orderedAnswers = new Array(QUESTIONS.length);
        answers.forEach(ans => {
          orderedAnswers[ans.id - 1] = ans.score;
        });
        setBmtiAnswers(orderedAnswers);
      }
      setQuizCompleted(true);
      setView('result');
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [phase]);

  return (
    <div className="min-h-screen pt-24 pb-24 px-6 max-w-3xl mx-auto fade-in">
      {/* Progress bar */}
      <div className="mb-12">
        <div className="flex items-center mb-2">
          {(step > 0) && (
            <button
              onClick={handleBack}
              className="bg-white border border-gray-200 rounded-full flex items-center justify-center mr-4 flex-shrink-0 hover:bg-gray-50 transition-colors shadow-sm px-4 py-2 text-sm font-bold gap-1 text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
              이전
            </button>
          )}
          <div className="flex justify-between text-sm text-gray-500 font-medium w-full">
            <span>진행률 {Math.round(progress)}%</span>
            <span>{currentStep} / {totalSteps}</span>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* ===== Part 1: 20 Questions ===== */}
      {phase === 'quiz' && (
        <>
          {/* Question */}
          <div key={step} className="bg-white border border-gray-200 rounded-[2rem] p-8 md:p-12 shadow-sm text-center mb-8 min-h-[300px] flex flex-col justify-center items-center fade-in overflow-hidden w-full max-w-full">
            <p className="text-sm text-gray-400 font-bold mb-4 tracking-wider">Q{step + 1}</p>
            <div className="text-5xl md:text-6xl mb-6">{shuffledQuestions[step].emoji}</div>
            <div className="w-full flex flex-col items-center">
              {shuffledQuestions[step].prefix && (
                <span ref={prefixRef} className="text-black block mb-2 font-normal whitespace-pre-line break-keep text-base md:text-lg">
                  {shuffledQuestions[step].prefix}
                </span>
              )}
              <h2 ref={textRef} className="text-black text-xl md:text-2xl font-serif font-bold whitespace-pre-line break-keep leading-relaxed">
                {shuffledQuestions[step].text}
              </h2>
            </div>
          </div>

          {/* Linear Scale Answers (1~4) */}
          <div className="max-w-xl mx-auto">
            <div className="flex justify-between text-xs md:text-sm text-gray-400 font-bold mb-4 px-2">
              <span>전혀 아니다</span>
              <span>매우 그렇다</span>
            </div>
            <div className="flex justify-between items-center relative px-2">
              {/* Connecting Line */}
              <div className="absolute left-0 right-0 h-1 bg-gray-100 top-1/2 -translate-y-1/2 z-0 rounded-full"></div>

              {/* Nodes */}
              {[1, 2, 3, 4].map((val) => (
                <button
                  key={val}
                  id={`answer-${val}`}
                  onClick={() => handleAnswer(val)}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white border-2 border-gray-200 shadow-sm relative z-10 flex items-center justify-center hover:border-black hover:bg-black hover:text-white transition-all duration-200 group active:scale-95"
                >
                  <span className="opacity-0 group-hover:opacity-100 font-bold transition-opacity">{val}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}



      {/* ===== Disclaimer Screen ===== */}
      {phase === 'disclaimer' && (
        <div className="fade-in flex flex-col items-center justify-center text-center">
          <div className="bg-white border border-gray-200 rounded-[2rem] p-8 md:p-12 shadow-sm mb-8 max-w-xl mx-auto">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
              <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">안내 사항</h3>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed break-keep">
              본 리포트는 고객의 운동 성향을 돕기 위한 웰니스 가이드이며,<br/>
              의학적 진단이나 치료를 대신하지 않습니다.<br/>
              심각한 뻐근함이나 불편감이 지속될 경우<br/>
              반드시 전문의의 진료를 받으시길 권장합니다.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 w-full max-w-xl mx-auto">
            <button
              id="proceed-to-result"
              onClick={handleProceedToResult}
              className="w-full bg-black text-white text-lg md:text-xl font-bold py-5 rounded-2xl shadow-lg hover:bg-gray-800 hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
            >
              이어서 결과지 확인하기
            </button>
            <button
              id="go-back-to-edit"
              onClick={handleGoBackToEdit}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors py-2 font-medium"
            >
              답변 수정하기
            </button>
          </div>
        </div>
      )}

      {/* ===== Loading Screen ===== */}
      {phase === 'loading' && (
        <div className="fade-in flex flex-col items-center justify-center text-center min-h-[50vh]">
          <div className="relative mb-8">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-gray-100 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="46"
                  fill="none" stroke="black" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${loadingProgress * 2.89} 289`}
                  className="transition-all duration-100 ease-linear"
                />
              </svg>
              <span className="text-2xl md:text-3xl font-black text-gray-900">{Math.min(loadingProgress, 100)}%</span>
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">설문을 분석하고 있어요</h3>
          <p className="text-sm md:text-base text-gray-400 font-medium">나만의 BMTI 결과지를 생성하는 중...</p>
          <div className="flex gap-1.5 mt-6">
            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizView;
