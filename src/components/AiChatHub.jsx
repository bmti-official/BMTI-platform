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
  const charName = CHARACTER_NAMES[axisCode] || 'BMTI 코치';
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
    <div className="min-h-screen pt-32 pb-32 px-4 md:px-6 max-w-2xl mx-auto fade-in">
      {/* 타이틀 영역 */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black mb-3 flex items-center justify-center gap-2">⭐️ BMTI TALK</h1>
        <p className="text-gray-500 font-medium text-[15px] px-4 break-keep leading-relaxed">
          나의 아바타 BMTI 캐릭터와 대화하거나<br/>친구들과 단체톡을 만들어 BMTI 캐릭터와 대화하세요.
        </p>
      </div>

      {/* 입장 버튼 */}
      <div className="px-4 mb-16">
        <button 
          onClick={() => {
            if (onOpenChat) onOpenChat();
          }}
          className="w-full bg-black text-white font-bold py-4 rounded-2xl text-lg hover:bg-gray-800 transition-colors shadow-xl shadow-black/20 transform hover:-translate-y-1"
        >
          BMTI TALK 입장!
        </button>
      </div>

      {/* 상세 설명 (상세 페이지 느낌) */}
      <div className="px-4">
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#c0ff00]/10 rounded-bl-full -z-10"></div>
          
          <h3 className="font-bold text-xl mb-6 text-gray-900 text-center">BMTI TALK이란?</h3>
          
          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                💬
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">1:1 맞춤형 AI 코칭</h4>
                <p className="text-sm text-gray-500 leading-relaxed break-keep">
                  나의 BMTI 성향에 딱 맞는 전담 코치와 대화하며, 내 몸과 마음에 맞는 운동 피드백과 동기부여를 실시간으로 받을 수 있습니다.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                👥
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">친구들과 단톡방</h4>
                <p className="text-sm text-gray-500 leading-relaxed break-keep">
                  친구들을 초대해 단체 채팅방을 만들고, AI 코치를 방에 불러 함께 운동 목표를 세우며 재밌게 소통해보세요.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                🧠
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">스마트한 AI 기억력</h4>
                <p className="text-sm text-gray-500 leading-relaxed break-keep">
                  사용자가 '기억해줘'라고 지정한 내용을 AI가 기억하여, 다음 번 대화에서도 이전 대화 맥락을 파악하고 더 자연스럽게 대화합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChatHub;
