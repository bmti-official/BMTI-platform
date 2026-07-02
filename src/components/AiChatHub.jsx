/* eslint-disable */
import { useState, useEffect } from 'react';
import { CHARACTERS, BMTI_INFO } from '../data';
import { CHARACTER_NAMES } from '../lib/gemini';
import { getStarBalance } from '../lib/starSystem';
import { getRemainingTokens, getTotalDailyLimit, getUsedTokens, isSubscriber, getTierDisplayName } from '../lib/tokenSystem';
import { getArchives, getMyGroupRooms } from '../lib/chatSystem';

/**
 * AI 채팅 허브 — 채팅방 목록 + 토큰/스타 상태 표시
 */
const AiChatHub = ({ bmtiCode, bmtiAnswers, setView, userInfo, onOpenChat, onOpenGroup, onOpenHistory }) => {
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const charName = CHARACTER_NAMES[axisCode] || 'BMTI 캐릭터';
  const bmtiInfo = BMTI_INFO[axisCode];
  const tier = userInfo?.subscription_tier || userInfo?.subscriptionTier || 'free';
  const isPremium = isSubscriber(tier) || userInfo?.isPremium;

  const [starBalance, setStarBalance] = useState(getStarBalance());
  const [remainingTokens, setRemainingTokens] = useState(getRemainingTokens(isPremium ? 'plus_lifetime' : 'free'));
  const [totalTokens, setTotalTokens] = useState(getTotalDailyLimit(isPremium ? 'plus_lifetime' : 'free'));
  const [archives, setArchives] = useState([]);
  const [groupRooms, setGroupRooms] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setStarBalance(getStarBalance());
    const t = userInfo?.nickname === 'BMTI' ? 'admin' : (isPremium ? 'plus_lifetime' : 'free');
    setRemainingTokens(getRemainingTokens(t));
    setTotalTokens(getTotalDailyLimit(t));
    setArchives(getArchives());
    if (userInfo?.id) {
      setGroupRooms(getMyGroupRooms(userInfo.id));
    }
  }, []);

  const usagePercent = totalTokens > 0 ? Math.round(((totalTokens - remainingTokens) / totalTokens) * 100) : 0;

  // 접근 제어: BMTI 미완료
  if (!bmtiCode) {
    return (
      <div className="min-h-[100dvh] pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center fade-in bg-[#f8f9fa]">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
          <span className="text-4xl">⭐️</span>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-gray-900">운동 심리 AI</h2>
        <p className="text-gray-500 mb-8 max-w-sm break-keep leading-relaxed text-sm">
          정확한 맞춤형 코칭을 위해 카카오 간편 로그인 및 BMTI 설문 완료가 필요합니다.
        </p>
        <button onClick={() => setView('quiz')} className="bg-black text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-black/20 hover:bg-gray-800 transition-all hover:-translate-y-1">
          로그인 및 설문 시작하기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-40 pb-32 px-4 md:px-6 max-w-2xl mx-auto fade-in">
      {/* 타이틀 영역 */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black mb-3 flex items-center justify-center gap-2">⭐️ BMTI TALK</h1>
        <p className="text-gray-500 font-medium text-[15px] px-4 break-keep leading-relaxed">
          나를 대변하는 BMTI 캐릭터와 대화하거나<br/>친구들과 단체톡을 만들어 BMTI 캐릭터와 대화하세요.
        </p>
      </div>

      {/* 입장 버튼 */}
      <div className="px-4 mb-16">
        <button 
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              if (onOpenChat) onOpenChat();
            }, 2000);
          }}
          disabled={isLoading}
          className="relative w-full bg-gradient-to-r from-gray-900 to-black text-white font-extrabold py-4.5 rounded-2xl text-[17px] transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3 group border border-gray-800 overflow-hidden"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10"></div>
              <span className="relative z-10">입장 중...</span>
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {charData && (
                <div className="relative">
                  <div className="absolute inset-0 bg-[#c0ff00] blur-md opacity-30 rounded-full group-hover:opacity-60 transition-opacity duration-300"></div>
                  <img src={charData.image} alt="" className="w-9 h-9 object-contain relative z-10 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300" />
                </div>
              )}
              <span className="relative z-10 tracking-wide">BMTI TALK 입장!</span>
              <svg className="w-5 h-5 relative z-10 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/>
              </svg>
            </>
          )}
        </button>
      </div>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center gap-6">
          <div className="relative">
            {charData && (
              <img src={charData.image} alt="" className="w-28 h-28 object-contain animate-bounce" />
            )}
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-gray-900 mb-1">'{charName}'과 연결 중...</p>
            <p className="text-sm text-gray-400">잠시만 기다려주세요</p>
          </div>
          <div className="w-40 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-black rounded-full animate-loading-bar"></div>
          </div>
        </div>
      )}

      {/* 상세 설명 */}
      <div className="px-2">
        {/* Quote Box */}
        <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-8 mx-auto max-w-sm relative overflow-hidden flex flex-col items-center justify-center gap-1">
          <p className="text-[15px] font-extrabold text-gray-900 tracking-tight">
            "나 지금 너무 나태해졌어 팩폭해줘!"
          </p>
          <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full my-1">vs</span>
          <p className="text-[15px] font-extrabold text-gray-900 tracking-tight">
            "나 오늘 너무 힘들었어 공감해줘ㅜㅜ"
          </p>
        </div>
        
        <div className="space-y-5">
          {/* 1:1 나만의 캐릭터 대화 */}
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-900 text-[15px] mb-4 flex items-center gap-2">
              <span className="text-xl">💬</span> 1:1 나만의 캐릭터와 대화
            </h4>
            <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl">
              <div className="flex flex-col items-end">
                <div className="bg-black text-white text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%]">
                  요즘 자꾸 늘어지네.. 운동 자극 좀 줘!
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-sm shadow-sm border border-blue-100">🤖</div>
                <div className="bg-white text-gray-800 border border-gray-100 text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%] leading-relaxed">
                  나를 대변하는 BMTI 캐릭터와 1:1로 대화하며, <strong className="text-blue-600">내 성향에 꼭 맞는 운동 피드백과 동기부여</strong>를 실시간으로 받아보세요.
                </div>
              </div>
            </div>
          </div>


          {/* 스마트한 AI 기억력 */}
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-900 text-[15px] mb-4 flex items-center gap-2">
              <span className="text-xl">🧠</span> 스마트한 AI 기억력
            </h4>
            <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl">
              <div className="flex flex-col items-end">
                <div className="bg-black text-white text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%]">
                  나 내일 인바디 재니까 기억해줘
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 text-sm shadow-sm border border-amber-100">🤖</div>
                <div className="bg-white border border-gray-100 text-gray-800 text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%] leading-relaxed">
                  사용자가 '기억해줘'라고 지정한 내용을 기억하여, <strong className="text-amber-600">이전 대화 맥락을 파악하고 더 자연스럽게 대화</strong>합니다.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="text-center mt-8 mb-4">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            💡 모든 대화는 하루마다 초기화됩니다.<br />
            이전 대화 기록은 <strong className="text-gray-500">7일 후 자동으로 삭제</strong>됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiChatHub;
