/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { CHARACTERS, BMTI_INFO } from '../data';
import { CHARACTER_NAMES, generateChatResponse, analyzeHealthRecord, isHealthOrCrisisRelated } from '../lib/gemini';
import { getTodayMessages, addMessage, getSelectedMemories } from '../lib/chatSystem';
import { supabase } from '../lib/supabaseClient';
import { getRemainingTokens, useTokens, TOKEN_COSTS, isSubscriber } from '../lib/tokenSystem';
import { getStarBalance, spendStar } from '../lib/starSystem';
import HealthRecordDrawer, { addHealthRecord } from './HealthRecordDrawer';
import HealthRecordOnboarding from './HealthRecordOnboarding';

const AiChatRoom = ({ bmtiCode, setView, userInfo }) => {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('healthRecordAgreed') === null;
  });
  const [isHealthDrawerOpen, setIsHealthDrawerOpen] = useState(false);
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const charName = CHARACTER_NAMES[axisCode] || 'BMTI 캐릭터';
  const bmtiInfo = BMTI_INFO[axisCode];
  
  const tier = userInfo?.subscription_tier || userInfo?.subscriptionTier || 'free';
  const isPremium = isSubscriber(tier) || userInfo?.isPremium;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [remainingTokens, setRemainingTokens] = useState(0);
  const [starBalance, setStarBalance] = useState(0);
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    const fetchMessages = async () => {
      if (userInfo?.id) {
        const msgs = await getTodayMessages(userInfo.id);
        setMessages(msgs);
        scrollToBottom();
      }
    };
    fetchMessages();
    updateBalances();

    let subscription = null;
    if (userInfo?.id) {
      // Realtime Sync for Direct Messages
      subscription = supabase
        .channel('public:chat_messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${userInfo.id}` }, (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          scrollToBottom();
        })
        .subscribe();
    }
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [userInfo]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const updateBalances = () => {
    setRemainingTokens(getRemainingTokens(isPremium ? 'plus_lifetime' : 'free'));
    setStarBalance(getStarBalance());
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend = inputText) => {
    const text = typeof textToSend === 'string' ? textToSend.trim() : inputText.trim();
    if (!text) return;

    // 토큰 비용 계산
    const memories = isPremium ? getSelectedMemories(5) : [];
    const cost = memories.length > 0 ? TOKEN_COSTS.CHAT_WITH_MEMORY : TOKEN_COSTS.CHAT_MESSAGE_BASE || TOKEN_COSTS.CHAT_MESSAGE;

    if (remainingTokens < cost) {
      setShowTokenWarning(true);
      return;
    }

    // 토큰 차감
    const tokenResult = useTokens(cost, isPremium ? 'plus_lifetime' : 'free');
    if (!tokenResult.success) {
      setShowTokenWarning(true);
      return;
    }

    const userMsgData = await addMessage(userInfo.id, 'user', text, 0);
    if (userMsgData) {
      // Opt. 업데이트는 subscription이 하므로 별도 추가하지 않아도 되지만 빠른 UI를 위해 로컬 반영
      setMessages(prev => prev.find(m => m.id === userMsgData.id) ? prev : [...prev, userMsgData]);
    }
    
    setInputText('');
    setIsTyping(true);
    updateBalances();

    // AI 카테고리 감지 비동기 실행 (동의한 유저만, 1차 필터 통과 시에만)
    if (localStorage.getItem('healthRecordAgreed') === 'true') {
      if (isHealthOrCrisisRelated(text)) {
        const chatContext = messages.slice(-10).map(m => ({ sender: m.sender, content: m.content }));
        analyzeHealthRecord(text, chatContext).then(async (categories) => {
          if (!categories || categories.length === 0) return;
          
          let saveCount = 0;
          for (const cat of categories) {
            if (cat.category === 'crisis') {
              const crisisMsg = '많이 힘드시군요. 당신은 결코 혼자가 아닙니다. 도움이 필요하시다면 언제든 아래 기관에서 상담을 받으실 수 있어요.\n- 보건복지부 희망의 전화: 129\n- 정신건강 위기상담전화: 1577-0199\n- 생명의 전화: 1588-9191';
              const savedMsg = await addMessage(userInfo.id, 'system', crisisMsg, 0);
              if (savedMsg) {
                setMessages(prev => [...prev, savedMsg]);
                scrollToBottom();
              }
              return; // 위기일 경우 일반 건강 기록 저장은 건너뜀
            } else {
              await addHealthRecord(userInfo.id, cat.category, cat.summary);
              saveCount++;
            }
          }
          
          if (saveCount > 0) {
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            setToastMessage(`📝 ${saveCount > 1 ? `${saveCount}개의 항목이` : '건강 관련 내용이'} 기록되었어요`);
            setShowToast(true);
            toastTimeoutRef.current = setTimeout(() => setShowToast(false), 2500);
          }
        });
      }
    }

    try {
      const history = messages.slice(-10).map(m => ({ sender: m.sender, content: m.content }));
      history.push({ sender: 'user', content: text }); // Include just added message in history
      
      const memories = isPremium ? await getSelectedMemories(userInfo.id, 5) : [];
      const response = await generateChatResponse(axisCode, userInfo, memories, text, history);
      
      setIsTyping(false);
      
      if (!response.error) {
        await addMessage(userInfo.id, 'ai', response.text, response.tokensUsed);
      } else {
        await addMessage(userInfo.id, 'system', '앗, 일시적인 오류가 발생했어요. 다시 한 번 말씀해주시겠어요?', 0);
      }
    } catch (error) {
      setIsTyping(false);
      await addMessage(userInfo.id, 'system', '앗, 일시적인 오류가 발생했어요. 다시 한 번 말씀해주시겠어요?', 0);
    }
  };

  const handleSpendStar = () => {
    if (starBalance < 1) {
      alert("별(⭐️)이 부족합니다. 게시판 활동을 통해 별을 모아보세요!");
      return;
    }
    const result = spendStar(1, isPremium ? 'plus_lifetime' : 'free');
    if (result.success) {
      alert(result.message);
      updateBalances();
      setShowTokenWarning(false);
    } else {
      alert(result.message);
    }
  };

  if (showOnboarding) {
    return (
      <HealthRecordOnboarding 
        onComplete={(agreed) => {
          localStorage.setItem('healthRecordAgreed', agreed);
          setShowOnboarding(false);
        }} 
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-[#f8f9fa] flex flex-col z-50 h-[100dvh] w-full">
      {/* Floating Header Buttons */}
      <div className="absolute top-4 left-0 right-0 px-4 z-20 flex items-center justify-between">
        {/* Home (round) */}
        <button 
          onClick={() => setView('aichat')}
          className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 hover:text-black transition-all duration-300 ease-out active:scale-90 hover:shadow-md hover:bg-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Floating Character (center) */}
        <div className="flex items-center gap-2">
          {charData && (
            <img src={charData.image} alt={axisCode} className="w-10 h-10 object-contain drop-shadow-sm" />
          )}
        </div>

        {/* Menu buttons (round) */}
        <div className="flex items-center gap-2">
          {/* 건강 기록 */}
          <button 
            onClick={() => setIsHealthDrawerOpen(true)}
            className="h-10 px-3.5 bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-gray-100 flex items-center justify-center gap-1.5 text-gray-600 hover:text-black hover:shadow-md hover:bg-white transition-all duration-300 ease-out active:scale-95"
            aria-label="건강 기록 열기"
          >
            <span className="text-[13px] font-medium tracking-tight">기록</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
            </svg>
          </button>
        </div>
      </div>

      <HealthRecordDrawer
        isOpen={isHealthDrawerOpen}
        onClose={() => setIsHealthDrawerOpen(false)}
        characterName={charName}
        userId={userInfo?.id}
      />

      {/* Toast Notification */}
      <div 
        onClick={() => setShowToast(false)}
        style={{ transitionDuration: '280ms' }}
        className={`absolute bottom-[80px] left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur-sm text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-[13px] z-[100] font-medium whitespace-nowrap transition-all ease-in-out cursor-pointer ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        {toastMessage}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto pt-16 pb-4 px-4 space-y-4" onClick={() => document.activeElement?.blur()}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center pt-8 pb-12 fade-in w-full max-w-sm mx-auto">
            {/* 상단 프로필 및 인사말 */}
            {charData ? (
              <div className="w-16 h-16 rounded-3xl bg-blue-50 shadow-sm border border-blue-100 flex items-center justify-center p-2 mb-3">
                <img src={charData.image} alt="AI" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-3xl bg-blue-50 shadow-sm border border-blue-100 flex items-center justify-center text-2xl mb-3">
                ⭐️
              </div>
            )}
            
            <h2 className="text-lg font-bold text-gray-900 mb-2">{charName}</h2>
            <p className="text-[13px] text-gray-500 mb-1">오늘 하루 어땠는지 편하게 이야기해요.</p>
            <p className="text-[13px] text-gray-500 mb-8">건강 얘기는 자동으로 정리해 드려요.</p>

            {/* 첫 인사 말풍선 */}
            <div className="w-full flex items-start gap-2 mb-6 animate-fade-in-up">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-1 border border-blue-100">
                {charData ? <img src={charData.image} alt="AI" className="w-full h-full object-contain" /> : '⭐️'}
              </div>
              <div className="bg-white border border-gray-100 text-gray-800 text-[14px] px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm leading-relaxed max-w-[85%]">
                안녕! 오늘도 만나서 반가워 😊 요즘 컨디션은 좀 어때?
              </div>
            </div>

            {/* 추천 질문 칩 */}
            <div className="w-full flex flex-wrap gap-2 pl-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {[
                { text: '요즘 잠을 못 자', action: () => handleSend('요즘 잠을 못 자') },
                { text: '밥을 잘 못 챙겨', action: () => handleSend('밥을 잘 못 챙겨') },
                { text: '스트레스가 많아', action: () => handleSend('스트레스가 많아') },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={chip.action}
                  className="bg-white border border-gray-200 text-gray-600 text-[13px] font-medium px-4 py-2 rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
                >
                  {chip.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id || idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in-up`}>
              <div className="flex items-end gap-2 max-w-[85%]">
                {!isUser && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden mb-1">
                    {charData ? <img src={charData.image} alt="AI" className="w-full h-full object-contain scale-110" /> : '⭐️'}
                  </div>
                )}
                
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  {msg.sender === 'system' ? (
                     <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-2xl text-xs text-center border border-gray-200">
                       {msg.content}
                     </div>
                  ) : (
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isUser 
                        ? 'bg-black text-white rounded-tr-sm' 
                        : msg.error
                          ? 'bg-red-50 text-red-600 border border-red-100 rounded-tl-sm'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  )}
                  {msg.timestamp && msg.sender !== 'system' && (
                    <span className="text-[10px] text-gray-400 mt-1 mx-1">
                      {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-end gap-2 animate-pulse">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden mb-1">
              {charData ? <img src={charData.image} alt="AI" className="w-full h-full object-contain scale-110" /> : '⭐️'}
            </div>
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Token Warning Overlay */}
      {showTokenWarning && (
        <div className="absolute inset-x-0 bottom-28 mx-4 bg-white rounded-[1.5rem] p-5 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] border border-red-100 animate-pop-in z-20">
          <div className="text-center">
            <span className="text-3xl mb-2 block">🪙</span>
            <h3 className="font-bold text-gray-900 mb-1">토큰이 부족합니다</h3>
            <p className="text-xs text-gray-500 mb-4">대화를 계속하려면 토큰을 충전해주세요.</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowTokenWarning(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl active:scale-95 transition-all duration-200"
              >
                닫기
              </button>
              <button 
                onClick={handleSpendStar}
                className="flex-1 py-3 bg-[#FEE500] text-black text-sm font-bold rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all duration-200 shadow-sm"
              >
                ⭐️ 1개 사용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Input Area (Gemini style) */}
      <div className="p-4 bg-transparent pb-safe flex-shrink-0 z-10 w-full">
        <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-200 flex items-end gap-2 p-2 max-w-2xl mx-auto transition-all duration-300 focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus-within:border-gray-300">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={() => {
              setTimeout(scrollToBottom, 100);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="메시지를 입력하세요..."
            className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none resize-none max-h-32 min-h-[40px]"
            rows={1}
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0 disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-300 ease-out hover:bg-gray-800 active:scale-90 disabled:active:scale-100 shadow-sm disabled:shadow-none"
          >
            <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChatRoom;
