/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { CHARACTERS, BMTI_INFO } from '../data';
import { CHARACTER_NAMES, generateChatResponse } from '../lib/gemini';
import { getTodayMessages, addMessage, getSelectedMemories } from '../lib/chatSystem';
import { getRemainingTokens, useTokens, TOKEN_COSTS, isSubscriber } from '../lib/tokenSystem';
import { getStarBalance, spendStar } from '../lib/starSystem';

const AiChatRoom = ({ bmtiCode, setView, userInfo }) => {
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const charName = CHARACTER_NAMES[axisCode] || 'BMTI 코치';
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
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 flex-shrink-0 z-10 pt-safe">
        <div className="h-14 flex items-center justify-between px-4 relative">
          <button 
            onClick={() => setView('home')}
            className="p-2 -ml-2 text-gray-500 hover:text-black transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          
          <div className="flex flex-col items-center flex-1">
            <h2 className="font-bold text-gray-900 text-base">'{charName}' 코치</h2>
            <p className="text-[10px] text-gray-500 font-medium">1:1 맞춤형 코칭</p>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => {
                const el = document.getElementById('chat-menu');
                if (el) el.classList.toggle('hidden');
              }}
              className="p-2 -mr-2 text-gray-500 hover:text-black transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
              </svg>
            </button>
            <div id="chat-menu" className="hidden absolute top-12 right-0 w-40 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
              <button onClick={() => setView('aichat_room')} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 border-b border-gray-50">
                1:1 대화방
              </button>
              <button onClick={() => setView('aichat')} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 border-b border-gray-50">
                단톡방
              </button>
              <button onClick={() => setView('chat_history')} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50">
                이전 대화 기록
              </button>
            </div>
          </div>
        </div>
        
        {/* Token Info Bar */}
        <div className="bg-gray-50 border-t border-gray-100 py-2 px-4 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700">🪙 {remainingTokens.toLocaleString()}</span>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-yellow-600">⭐️ {starBalance}</span>
          </div>
          {isPremium && (
            <button 
              onClick={() => setView('mypage')}
              className="text-[10px] font-bold bg-[#c0ff00] text-black px-2 py-1 rounded-full"
            >
              기억 관리
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10 fade-in flex flex-col items-center">
            <div className={`w-24 h-24 rounded-3xl ${charData?.color || 'bg-gray-100'} mb-4 flex items-center justify-center p-2 shadow-sm border border-gray-100`}>
              {charData ? (
                <img src={charData.image} alt={axisCode} className="w-full h-full object-contain" />
              ) : (
                <span className="text-4xl">⭐️</span>
              )}
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">{charName}</p>
            <p className="text-xs text-gray-500 max-w-[200px] break-keep">{bmtiInfo?.catchphrase}</p>
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
                  <div className={`w-8 h-8 rounded-full ${charData?.color || 'bg-gray-100'} flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100 overflow-hidden mb-1`}>
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
            <div className={`w-8 h-8 rounded-full ${charData?.color || 'bg-gray-100'} flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100 overflow-hidden mb-1`}>
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
        <div className="absolute inset-x-0 bottom-20 mx-4 bg-white rounded-2xl p-4 shadow-xl border border-red-100 animate-fade-in-up z-20">
          <div className="text-center">
            <span className="text-3xl mb-2 block">🪙</span>
            <h3 className="font-bold text-gray-900 mb-1">토큰이 부족합니다</h3>
            <p className="text-xs text-gray-500 mb-4">대화를 계속하려면 토큰을 충전해주세요.</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowTokenWarning(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl"
              >
                닫기
              </button>
              <button 
                onClick={handleSpendStar}
                className="flex-1 py-2.5 bg-[#FEE500] text-black text-sm font-bold rounded-xl flex items-center justify-center gap-1"
              >
                ⭐️ 1개 사용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 p-3 pb-safe flex-shrink-0 z-10">
        <div className="flex items-end gap-2 max-w-2xl mx-auto">
          <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden flex items-end">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="메시지를 입력하세요..."
              className="w-full bg-transparent p-3 text-sm focus:outline-none resize-none max-h-32 min-h-[44px]"
              rows={1}
              disabled={isTyping}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className="w-11 h-11 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChatRoom;
