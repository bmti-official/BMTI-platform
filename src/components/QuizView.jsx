import { useState } from 'react';
import { QUESTIONS, PART2_QUESTION, PART2_OPTIONS, calculateBMTI } from '../data';

const QuizView = ({ setView, setQuizCompleted, setBmtiCode }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]); // 20 answers (1~4)
  const [phase, setPhase] = useState('part1'); // 'part1' | 'part2'

  const totalSteps = QUESTIONS.length + 1; // 20 questions + 1 Part 2
  const currentStep = phase === 'part1' ? step + 1 : QUESTIONS.length + 1;
  const progress = (currentStep / totalSteps) * 100;

  const handlePart1Answer = (score) => {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(prev => prev + 1);
    } else {
      // Part 1 완료 → Part 2로 전환
      setPhase('part2');
    }
  };

  const handleBack = () => {
    if (phase === 'part1' && step === 0) return; // 첫 문제에서는 뒤로 가기 불가

    // 이전 답변 제거
    setAnswers(prev => prev.slice(0, -1));

    if (phase === 'part2') {
      setPhase('part1');
      // step은 이미 마지막 문제(QUESTIONS.length - 1)를 가리키고 있으므로 그대로 둠
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handlePart2Answer = (choiceId) => {
    // 최종 BMTI 코드 계산
    const finalCode = calculateBMTI(answers, choiceId);
    console.log('🧬 BMTI Code:', finalCode);
    console.log('📊 Answers:', answers);
    setBmtiCode(finalCode);
    setQuizCompleted(true);
    setView('result');
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 max-w-3xl mx-auto fade-in">
      {/* Progress bar */}
      <div className="mb-12">
        <div className="flex items-center mb-2">
          {(step > 0 || phase === 'part2') && (
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
            <span>{phase === 'part1' ? 'Part 1 · 성향 분석' : 'Part 2 · 상태 지표'}</span>
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
      {phase === 'part1' && (
        <>
          {/* Question */}
          <div key={step} className="bg-white border border-gray-200 rounded-[2rem] p-8 md:p-12 shadow-sm text-center mb-8 min-h-[300px] flex flex-col justify-center items-center fade-in">
            <p className="text-sm text-gray-400 font-bold mb-4 tracking-wider">Q{step + 1}</p>
            <div className="text-5xl md:text-6xl mb-6">{QUESTIONS[step].emoji}</div>
            <h2 className="text-xl md:text-2xl font-serif font-bold leading-relaxed break-keep whitespace-pre-wrap">
              {QUESTIONS[step].prefix && (
                <span className="text-sm md:text-base text-gray-400 block mb-2 font-normal">
                  {QUESTIONS[step].prefix}
                </span>
              )}
              {QUESTIONS[step].text}
            </h2>
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
                  onClick={() => handlePart1Answer(val)}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white border-2 border-gray-200 shadow-sm relative z-10 flex items-center justify-center hover:border-black hover:bg-black hover:text-white transition-all duration-200 group active:scale-95"
                >
                  <span className="opacity-0 group-hover:opacity-100 font-bold transition-opacity">{val}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ===== Part 2: State Indicator ===== */}
      {phase === 'part2' && (
        <div className="fade-in">
          {/* Transition banner */}
          <div className="bg-gradient-to-r from-black to-gray-800 text-white rounded-2xl p-5 mb-8 flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm">Part 1 완료!</p>
              <p className="text-xs text-gray-300">마지막 질문 하나만 더 답해주세요.</p>
            </div>
          </div>

          {/* Part 2 Question */}
          <div className="bg-white border border-gray-200 rounded-[2rem] p-8 md:p-12 shadow-sm text-center mb-8">
            <p className="text-sm text-[#c0ff00] font-bold mb-4 tracking-wider bg-black inline-block px-4 py-1 rounded-full">PART 2</p>
            <h2 className="text-2xl md:text-3xl font-serif font-bold leading-relaxed break-keep">
              {PART2_QUESTION}
            </h2>
          </div>

          {/* Part 2 Linear Scale Answers (1~5) */}
          <div className="max-w-xl mx-auto mt-8">
            <div className="flex justify-between text-xs md:text-sm text-gray-400 font-bold mb-4 px-2">
              <span className="text-left w-1/3 break-keep">에너지 바닥이고<br/>휴식이 필요한 상태</span>
              <span className="text-right w-1/3 break-keep">에너지가 넘치고<br/>컨디션 최상인 상태</span>
            </div>
            <div className="flex justify-between items-center relative px-2">
              {/* Connecting Line */}
              <div className="absolute left-0 right-0 h-1 bg-gray-100 top-1/2 -translate-y-1/2 z-0 rounded-full"></div>

              {/* Nodes */}
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  id={`part2-answer-${val}`}
                  onClick={() => handlePart2Answer(val)}
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-white border-2 border-gray-200 shadow-sm relative z-10 flex items-center justify-center hover:border-black hover:bg-black hover:text-white transition-all duration-200 group active:scale-95"
                >
                  <span className="opacity-0 group-hover:opacity-100 font-bold transition-opacity">{val}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizView;
