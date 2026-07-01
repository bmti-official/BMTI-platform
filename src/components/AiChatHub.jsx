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
        <h3 className="font-black text-xl mb-6 text-gray-900 text-center">BMTI TALK이란?</h3>
        
        <div className="space-y-4">
          {/* 1:1 나만의 캐릭터 대화 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[1.5rem] p-6 border border-blue-100/60 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100/40 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm border border-blue-100">
                💬
              </div>
              <h4 className="font-bold text-gray-900 text-[15px]">1:1 나만의 캐릭터와 대화</h4>
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed break-keep pl-14">
              나를 대변하는 BMTI 캐릭터와 1:1로 대화하며, 내 성향에 꼭 맞는 운동 피드백과 동기부여를 실시간으로 받아보세요.
            </p>
          </div>

          {/* 친구들과 단톡방 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[1.5rem] p-6 border border-purple-100/60 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-100/40 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm border border-purple-100">
                👥
              </div>
              <h4 className="font-bold text-gray-900 text-[15px]">친구들과 단톡방</h4>
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed break-keep pl-14">
              친구들을 초대해 단체 채팅방을 만들고, BMTI 캐릭터들과 함께 운동 목표를 세우며 재밌게 소통해보세요.
            </p>
          </div>

          {/* 스마트한 AI 기억력 */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-[1.5rem] p-6 border border-amber-100/60 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-100/40 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm border border-amber-100">
                🧠
              </div>
              <h4 className="font-bold text-gray-900 text-[15px]">스마트한 AI 기억력</h4>
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed break-keep pl-14">
              사용자가 '기억해줘'라고 지정한 내용을 AI가 기억하여, 다음 번 대화에서도 이전 대화 맥락을 파악하고 더 자연스럽게 대화합니다.
            </p>
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
