import { useState } from 'react';

const HealthRecordOnboarding = ({ onComplete }) => {
  const [isRequiredAgreed, setIsRequiredAgreed] = useState(false);
  const [isOptionalAgreed, setIsOptionalAgreed] = useState(false);

  const notices = [
    {
      icon: '📝',
      title: '무엇을 기록하나요',
      desc: '식습관·수면·운동·정서·증상 5개 영역에서 나눈 대화 요약. 대화 원문 전체가 아닌 핵심 요약만 저장돼요.'
    },
    {
      icon: '🎯',
      title: '왜 기록하나요',
      desc: '지난 대화 맥락을 기억해 더 자연스러운 대화를 이어가기 위해서예요. 광고나 외부 제공에는 쓰지 않아요.'
    },
    {
      icon: '⏳',
      title: '얼마나 보관하나요',
      desc: '동의를 철회하거나 계정을 삭제하면 즉시 삭제돼요. 개별 기록도 언제든 직접 지울 수 있어요.'
    },
    {
      icon: '🔒',
      title: '누가 볼 수 있나요',
      desc: '나만 볼 수 있어요. 다른 이용자나 제3자에게 공유되지 않아요.'
    }
  ];

  return (
    <div className="fixed inset-0 bg-[#f8f9fa] z-[100] overflow-y-auto">
      <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white shadow-sm relative">
        <div className="flex-1 px-6 py-10 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <span className="bg-red-50 text-red-600 text-[11px] font-bold px-2.5 py-1 rounded-full border border-red-100">
              민감정보
            </span>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
            건강 정보 수집·이용 동의
          </h2>
          <p className="text-[14px] text-gray-600 leading-relaxed mb-8">
            건강 관련 대화는 민감정보에 해당해, 아래 내용을 확인하고 동의를 받아요.
          </p>

          <div className="space-y-6 mb-8">
            {notices.map((notice, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <span className="text-xl mt-0.5">{notice.icon}</span>
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900 mb-1">{notice.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{notice.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 mb-auto">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-[13px] text-amber-800 leading-relaxed font-medium">
              이 기능은 의료 진단이나 치료를 대신하지 않아요. 건강이 걱정되면 전문가와 상담하세요.
            </p>
          </div>
        </div>

        {/* 하단 플로팅 바 영역 */}
        <div className="p-6 bg-white border-t border-gray-100 flex flex-col gap-4 pb-8">
          <div className="flex flex-col gap-3 mb-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  className="peer sr-only"
                  checked={isRequiredAgreed}
                  onChange={(e) => setIsRequiredAgreed(e.target.checked)}
                />
                <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-black peer-checked:border-black transition-colors"></div>
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-[14px] text-gray-900 font-bold select-none">
                (필수) 건강 민감정보 수집·이용에 동의해요
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  className="peer sr-only"
                  checked={isOptionalAgreed}
                  onChange={(e) => setIsOptionalAgreed(e.target.checked)}
                />
                <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-black peer-checked:border-black transition-colors"></div>
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-[14px] text-gray-600 font-medium select-none">
                (선택) 기록을 활용한 맞춤 대화 제안을 받을래요
              </div>
            </label>
          </div>

          <button 
            disabled={!isRequiredAgreed}
            onClick={() => onComplete(true, isOptionalAgreed)}
            className="w-full py-4 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed bg-black text-white hover:bg-gray-800 active:scale-[0.98]"
          >
            동의하고 시작
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button 
            onClick={() => onComplete(false, false)}
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
