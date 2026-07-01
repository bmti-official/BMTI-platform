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
    const t = isPremium ? 'plus_lifetime' : 'free';
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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-2 flex items-center justify-center gap-2">⭐️ BMTI TALK</h1>
        <p className="text-gray-500 font-medium text-sm px-4 break-keep">
          나의 아바타 BMTI 캐릭터와 대화하거나 친구들과 단체톡을 만들어 BMTI 캐틱터와 대화하세요.
        </p>
      </div>

      {/* 프로필 + 토큰 상태 카드 */}
      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 mb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#c0ff00]/10 to-transparent rounded-bl-full -z-0"></div>
        
        <div className="flex items-center gap-4 mb-5 relative z-10">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
            {charData ? (
              <img src={charData.image} alt={axisCode} className="w-full h-full object-contain scale-110" />
            ) : (
              <span className="text-3xl">⭐️</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-black text-gray-900 truncate">'{charName}' 코치</h2>
            <p className="text-xs text-gray-500 mt-0.5">{bmtiInfo?.kr || axisCode} · {bmtiInfo?.catchphrase || ''}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPremium ? 'bg-[#c0ff00] text-black' : 'bg-gray-100 text-gray-500'}`}>
                {isPremium ? '🎟️ Plus 구독' : '무료'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                ⭐️ {starBalance}개
              </span>
            </div>
          </div>
        </div>

        {/* 토큰 게이지 */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500">🪙 오늘 남은 토큰</span>
            <span className="text-xs font-bold text-gray-900">{remainingTokens.toLocaleString()} / {totalTokens.toLocaleString()}</span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${usagePercent > 80 ? 'bg-red-400' : usagePercent > 50 ? 'bg-yellow-400' : 'bg-[#9BB31B]'}`}
              style={{ width: `${100 - usagePercent}%` }}
            ></div>
          </div>
          {remainingTokens < 1000 && (
            <p className="text-[10px] text-orange-500 font-medium mt-2">⚠️ 토큰이 부족합니다. ⭐️를 사용하여 충전하세요!</p>
          )}
        </div>
      </div>

      {/* 채팅방 목록 */}
      <div className="space-y-3">
        {/* 1:1 대화방 */}
        <button
          onClick={() => onOpenChat && onOpenChat()}
          className="w-full bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition-all group text-left"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c0ff00]/30 to-[#9BB31B]/10 border border-[#9BB31B]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {charData ? (
              <img src={charData.image} alt="" className="w-full h-full object-contain scale-110" />
            ) : (
              <span className="text-2xl">💬</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm md:text-base">💬 1:1 대화방</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">'{charName}'과 대화하기</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>

        {/* 단톡방 섹션 */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              👥 단톡방
              {!isPremium && <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">구독자 전용 개설</span>}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowInviteModal(true)}
                className="text-[11px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
              >
                🔗 초대코드 입력
              </button>
              {isPremium && groupRooms.length < 3 && (
                <button
                  onClick={() => onOpenGroup && onOpenGroup('create')}
                  className="text-[11px] font-bold text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-full transition-colors"
                >
                  + 방 만들기
                </button>
              )}
            </div>
          </div>

          {groupRooms.length > 0 ? (
            <div className="space-y-2">
              {groupRooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => onOpenGroup && onOpenGroup('room', room)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">👥</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{room.name}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">{room.members.length}명 참여 중 · 코드: {room.inviteCode}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
              <span className="text-3xl block mb-2">👥</span>
              <p className="text-sm text-gray-400">
                {isPremium 
                  ? '아직 참여 중인 단톡방이 없어요. 방을 만들거나 초대코드를 입력해보세요!' 
                  : '단톡방은 구독자만 개설할 수 있어요. 초대코드가 있다면 입력해보세요!'}
              </p>
            </div>
          )}
        </div>

        {/* 이전 대화 기록 */}
        <div className="pt-2">
          <button
            onClick={() => onOpenHistory && onOpenHistory()}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">📁</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm">📁 이전 대화 기록</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{archives.length}개의 대화 기록 · 7일 후 자동 삭제</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>

        {/* 안내 문구 */}
        <div className="text-center pt-4 pb-2">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            💡 모든 대화는 하루마다 초기화됩니다.<br />
            이전 대화 기록은 <strong className="text-gray-500">7일 후 자동으로 삭제</strong>됩니다.
          </p>
        </div>
      </div>

      {/* 초대코드 입력 모달 */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-[90%] max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-gray-900 mb-4">🔗 초대코드 입력</h3>
            <input
              type="text"
              value={inviteInput}
              onChange={e => setInviteInput(e.target.value.toUpperCase())}
              placeholder="초대코드 6자리"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-lg font-bold tracking-widest focus:outline-none focus:border-black transition-colors mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setShowInviteModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">취소</button>
              <button 
                onClick={() => {
                  if (inviteInput.length === 6) {
                    const { joinGroupRoom } = require('../lib/chatSystem');
                    const result = joinGroupRoom(inviteInput, userInfo?.id);
                    if (result.success) {
                      setGroupRooms(getMyGroupRooms(userInfo?.id));
                      setShowInviteModal(false);
                      setInviteInput('');
                    } else {
                      alert(result.message);
                    }
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-black text-white font-bold text-sm disabled:bg-gray-300"
                disabled={inviteInput.length !== 6}
              >
                참여하기
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-3">
              ⚠️ BMTI 설문과 카카오 로그인을 완료해야 참여할 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiChatHub;
