/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { CHARACTERS, BMTI_INFO } from '../data';
import { CHARACTER_NAMES, generateChatResponse } from '../lib/gemini';
import { getTodayMessages, addMessage, getSelectedMemories } from '../lib/chatSystem';
import { getRemainingTokens, useTokens, TOKEN_COSTS, isSubscriber } from '../lib/tokenSystem';
import { getStarBalance, spendStar } from '../lib/starSystem';
import ChatDrawer from './ChatDrawer';

const AiChatRoom = ({ bmtiCode, setView, userInfo }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
  
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    setMessages(getTodayMessages());
    updateBalances();
    scrollToBottom();
  }, []);

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

  const handleSend = async () => {
    if (!inputText.trim()) return;

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

    const userMsg = { sender: 'user', content: inputText.trim() };
    const updatedMessages = addMessage(userMsg);
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);
    updateBalances();

    try {
      // 대화 히스토리는 최근 10개만 전송
      const history = updatedMessages.slice(-10);
      const response = await generateChatResponse(axisCode, userInfo, memories, userMsg.content, history);
      
      setIsTyping(false);
      
      const aiMsg = { 
        sender: 'ai', 
        content: response.text,
        error: response.error,
        tokensUsed: response.tokensUsed 
      };
      
      const finalMessages = addMessage(aiMsg);
      setMessages(finalMessages);
    } catch (error) {
      setIsTyping(false);
      const errorMsg = { 
        sender: 'ai', 
        content: '앗, 일시적인 오류가 발생했어요. 다시 한 번 말씀해주시겠어요?',
        error: true
      };
      setMessages(addMessage(errorMsg));
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

        {/* Menu (round) */}
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 hover:text-black transition-all duration-300 ease-out active:scale-90 hover:shadow-md hover:bg-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <ChatDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        setView={setView} 
        userInfo={userInfo} 
        bmtiCode={bmtiCode} 
      />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto pt-16 pb-4 px-4 space-y-4" onClick={() => document.activeElement?.blur()}>
        {messages.length === 0 && (
          <div className="text-center py-16 fade-in flex flex-col items-center">
            <div className="mt-6 inline-block bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-700">궁금한 점이나 오늘의 몸 상태를 자유롭게 이야기해주세요!</p>
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
                    <span className="text-[10px] text-gray-400 mt-1 mx-1">{msg.timestamp}</span>
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
