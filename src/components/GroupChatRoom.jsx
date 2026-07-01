/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { CHARACTERS, BMTI_INFO } from '../data';
import { CHARACTER_NAMES, generateGroupResponse } from '../lib/gemini';
import { getGroupMessages, addGroupMessage, useGroupBmtiCall } from '../lib/chatSystem';
import { getRemainingTokens, useTokens, TOKEN_COSTS, isSubscriber } from '../lib/tokenSystem';
import { getStarBalance, spendStar } from '../lib/starSystem';
import ChatDrawer from './ChatDrawer';

const GroupChatRoom = ({ bmtiCode, room, setView, userInfo, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [remainingTokens, setRemainingTokens] = useState(0);
  const [starBalance, setStarBalance] = useState(0);
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  const [bmtiCallCount, setBmtiCallCount] = useState(0);
  
  const userAxisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const tier = userInfo?.subscription_tier || userInfo?.subscriptionTier || 'free';
  const isPremium = isSubscriber(tier) || userInfo?.isPremium;
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (room) {
      setMessages(getGroupMessages(room.id));
      setBmtiCallCount(useGroupBmtiCall(room.id).used - 1); // 렌더링용이라 차감 취소 효과
    }
    updateBalances();
    scrollToBottom();
  }, [room]);

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

  // 단톡방 멤버들의 BMTI 코드를 랜덤하게 3개 뽑기 (나 제외)
  const getRandomOtherCharacters = (count = 2) => {
    const others = Object.keys(CHARACTER_NAMES).filter(code => code !== userAxisCode);
    const shuffled = others.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // 내가 쓴 메시지 저장
    const userMsg = { 
      senderType: 'user', 
      user_id: userInfo?.id,
      senderName: userInfo?.nickname || '사용자',
      content: inputText.trim() 
    };
    
    const isBmtiCall = inputText.includes('@BMTI');
    
    if (isBmtiCall) {
      if (remainingTokens < TOKEN_COSTS.GROUP_MENTION) {
        setShowTokenWarning(true);
        return;
      }
      
      const tokenResult = useTokens(TOKEN_COSTS.GROUP_MENTION, isPremium ? 'plus_lifetime' : 'free');
      if (!tokenResult.success) {
        setShowTokenWarning(true);
        return;
      }
      useGroupBmtiCall(room.id);
      setBmtiCallCount(prev => prev + 1);
    }

    const updatedMessages = addGroupMessage(room.id, userMsg);
    setMessages(updatedMessages);
    setInputText('');
    updateBalances();

    // @BMTI 호출 시 AI 응답
    if (isBmtiCall) {
      setIsTyping(true);
      
      const history = updatedMessages.slice(-10);
      const otherChars = getRandomOtherCharacters(2);
      
      try {
        const response = await generateGroupResponse(userAxisCode, otherChars, history);
        
        setIsTyping(false);
        
        if (response.error) {
          const errorMsg = { 
            senderType: 'system', 
            content: 'AI 코치들을 불러오는 데 실패했어요. 잠시 후 다시 시도해주세요.' 
          };
          setMessages(addGroupMessage(room.id, errorMsg));
          return;
        }

        // 응답들을 순차적으로 추가 (약간의 딜레이)
        let currentMessages = [...updatedMessages];
        for (const aiResponse of response.responses) {
          const aiMsg = {
            senderType: 'bmti_ai',
            bmti_character: aiResponse.character,
            senderName: aiResponse.name,
            content: aiResponse.message
          };
          currentMessages = addGroupMessage(room.id, aiMsg);
          setMessages(currentMessages);
        }
      } catch (error) {
        setIsTyping(false);
      }
    }
  };

  const handleSpendStar = () => {
    if (starBalance < 1) {
      alert("별(⭐️)이 부족합니다.");
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

  if (!room) return null;

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 flex-shrink-0 z-10 pt-safe">
        <div className="h-14 flex items-center justify-between px-4 relative">
          <button onClick={() => setView('home')} className="p-2 -ml-2 text-gray-500 hover:text-black transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          
          <div className="flex flex-col items-center flex-1">
            <h2 className="font-bold text-gray-900 text-base">{room.name}</h2>
            <p className="text-[10px] text-gray-500 font-medium">참여 인원 {room.members.length}명</p>
          </div>
          
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 -mr-2 text-gray-500 hover:text-black transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
            </svg>
          </button>
        </div>
        
        {/* Token Info Bar */}
        <div className="bg-gray-50 border-t border-gray-100 py-2 px-4 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700">🪙 {remainingTokens.toLocaleString()}</span>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-yellow-600">⭐️ {starBalance}</span>
          </div>
          <span className="text-[10px] text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
            @BMTI 호출: {bmtiCallCount}/5
          </span>
        </div>
      </div>

      <ChatDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        setView={setView} 
        userInfo={userInfo} 
        bmtiCode={bmtiCode} 
      />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10 fade-in flex flex-col items-center">
            <div className="w-24 h-24 rounded-3xl bg-purple-50 mb-4 flex items-center justify-center p-2 border border-purple-100">
              <span className="text-4xl">👥</span>
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">{room.name}</p>
            <p className="text-xs text-gray-500">함께 운동 목표를 다져보세요!</p>
            <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-sm text-gray-700 leading-relaxed text-left max-w-sm">
              <span className="font-bold block mb-2">💡 단톡방 가이드</span>
              메시지에 <strong className="text-purple-600">@BMTI</strong> 를 포함하여 전송하면, 방 안의 BMTI 캐릭터들이 대화에 참여합니다.
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.senderType === 'user' && msg.user_id === userInfo?.id;
          const isAI = msg.senderType === 'bmti_ai';
          const isSystem = msg.senderType === 'system';
          
          if (isSystem) {
             return (
               <div key={msg.id || idx} className="bg-gray-100 text-gray-500 px-4 py-2 rounded-2xl text-xs text-center border border-gray-200 my-4 max-w-xs mx-auto">
                 {msg.content}
               </div>
             );
          }

          return (
            <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in-up`}>
              {!isMe && (
                <span className="text-[10px] text-gray-500 ml-10 mb-1 font-medium flex items-center gap-1">
                  {isAI && '🤖'} {msg.senderName}
                </span>
              )}
              <div className="flex items-end gap-2 max-w-[85%]">
                {!isMe && (
                  <div className={`w-8 h-8 rounded-full ${isAI ? 'bg-purple-100' : 'bg-gray-200'} flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100 overflow-hidden mb-1`}>
                    {isAI ? (
                      <img src={CHARACTERS.find(c => c.id === msg.bmti_character)?.image} className="w-full h-full object-contain scale-110" alt="" />
                    ) : (
                      <span className="text-xs">👤</span>
                    )}
                  </div>
                )}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isMe 
                      ? 'bg-black text-white rounded-tr-sm' 
                      : isAI
                        ? 'bg-purple-50 text-gray-900 border border-purple-100 rounded-tl-sm'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.timestamp && (
                    <span className="text-[10px] text-gray-400 mt-1 mx-1">{msg.timestamp}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-end gap-2 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mb-1">
              <span className="text-xs">🤖</span>
            </div>
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Token Warning */}
      {showTokenWarning && (
        <div className="absolute inset-x-0 bottom-20 mx-4 bg-white rounded-2xl p-4 shadow-xl border border-red-100 z-20">
          <div className="text-center">
            <h3 className="font-bold text-gray-900 mb-2">토큰 부족</h3>
            <div className="flex gap-2">
              <button onClick={() => setShowTokenWarning(false)} className="flex-1 py-2 bg-gray-100 text-sm font-bold rounded-xl">닫기</button>
              <button onClick={handleSpendStar} className="flex-1 py-2 bg-[#FEE500] text-sm font-bold rounded-xl">⭐️ 사용</button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-3 pb-safe z-10">
        <div className="flex items-end gap-2 max-w-2xl mx-auto">
          <button 
            onClick={() => setInputText(prev => prev + '@BMTI ')}
            className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 font-bold text-xs flex items-center justify-center flex-shrink-0"
          >
            @
          </button>
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
              placeholder="메시지를 입력하세요... (@BMTI 호출 가능)"
              className="w-full bg-transparent p-3 text-sm focus:outline-none resize-none max-h-32 min-h-[44px]"
              rows={1}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-11 h-11 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0 disabled:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatRoom;
