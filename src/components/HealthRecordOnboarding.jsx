import { useState } from 'react';

const HealthRecordOnboarding = ({ onComplete }) => {
  const [isAgreed, setIsAgreed] = useState(false);

  const categories = [
    { emoji: '🍎', label: '식습관·영양' },
    { emoji: '😴', label: '수면' },
    { emoji: '💪', label: '운동·활동' },
    { emoji: '🧠', label: '정서·멘탈' },
    { emoji: '🩺', label: '증상·컨디션' },
  ];

  return (
    <div className="fixed inset-0 bg-[#f8f9fa] z-[100] overflow-y-auto">
      <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white shadow-sm relative">
        <div className="flex-1 px-6 py-10 flex flex-col">
          {/* 상단 아이콘 */}
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
            대화하면서 건강을 기록해요
          </h2>
          <p className="text-[15px] text-gray-600 leading-relaxed mb-8">
            캐릭터와 나눈 이야기 속 건강 관련 내용을 5가지로 자동 정리해, 다음 대화에서 기억해요.
          </p>

          <div className="mb-8">
            <h3 className="text-[13px] font-bold text-gray-400 mb-4 px-1">이런 내용을 기록해요</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {categories.map((cat, idx) => (
                <div key={idx} className={`bg-gray-50 border border-gray-100 rounded-2xl p-3.5 flex items-center gap-3 ${idx === 4 ? 'col-span-2' : ''}`}>
                  <span className="text-xl drop-shadow-sm">{cat.emoji}</span>
                  <span className="text-[14px] font-bold text-gray-800">{cat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3 mb-auto">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-[13px] text-blue-800 leading-relaxed font-medium">
              기록은 나만 볼 수 있고, 대화 분석 외 다른 목적으로 쓰지 않아요. 언제든 삭제할 수 있어요.
            </p>
          </div>
        </div>

        {/* 하단 플로팅 바 영역 */}
        <div className="p-6 bg-white border-t border-gray-100 flex flex-col gap-4 pb-8">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input 
                type="checkbox" 
                className="peer sr-only"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
              />
              <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-black peer-checked:border-black transition-colors"></div>
              <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-[14px] text-gray-700 font-medium select-none flex-1">
              건강 관련 대화 내용의 자동 기록에 동의해요.{' '}
              <button 
                onClick={(e) => { e.preventDefault(); alert("준비 중입니다."); }}
                className="text-blue-500 font-bold hover:underline ml-1"
              >
                자세히
              </button>
            </div>
          </label>

          <button 
            disabled={!isAgreed}
            onClick={() => onComplete(true)}
            className="w-full py-4 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed bg-black text-white hover:bg-gray-800 active:scale-[0.98]"
          >
            동의하고 대화 시작
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button 
            onClick={() => onComplete(false)}
            className="w-full py-2 text-[13px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            기록 없이 대화만 할래요
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthRecordOnboarding;
