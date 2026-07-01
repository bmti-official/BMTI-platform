/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { CHARACTERS, BMTI_INFO } from '../data';
import { CHARACTER_NAMES, generateGroupResponse } from '../lib/gemini';
import { getGroupMessages, addGroupMessage, useGroupBmtiCall } from '../lib/chatSystem';
import { supabase } from '../lib/supabaseClient';
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
    const fetchMessages = async () => {
      if (room) {
        const msgs = await getGroupMessages(room.id);
        setMessages(msgs);
        setBmtiCallCount(useGroupBmtiCall(room.id).used - 1);
        scrollToBottom();
      }
    };
    fetchMessages();
    updateBalances();
    
    let subscription = null;
    if (room?.id) {
      subscription = supabase
        .channel(`public:group_messages:${room.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `room_id=eq.${room.id}` }, (payload) => {
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
    }
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

    const userMsgData = await addGroupMessage(room.id, userInfo?.id, 'user', inputText.trim(), null, 0);
    if (userMsgData) {
      setMessages(prev => prev.find(m => m.id === userMsgData.id) ? prev : [...prev, userMsgData]);
    }
    
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
            content: 'BMTI 캐릭터들을 불러오는 데 실패했어요. 잠시 후 다시 시도해주세요.' 
          };
          setMessages(addGroupMessage(room.id, errorMsg));
          return;
        }

        // 응답들을 순차적으로 추가 (약간의 딜레이)
        for (const aiResponse of response.responses) {
          await addGroupMessage(
            room.id, 
            null, 
            'bmti_ai', 
            aiResponse.message, 
            aiResponse.character, 
            Math.floor(response.tokensUsed / response.responses.length)
          );
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
    <div className="fixed inset-0 bg-[#f8f9fa] flex flex-col z-50 h-[100dvh] w-full">
      {/* Floating Header Buttons */}
      <div className="absolute top-4 left-0 right-0 px-4 z-20 flex items-center justify-between">
        {/* Home (round) */}
        <button 
          onClick={() => setView('aichat_room')}
          className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 hover:text-black transition-all duration-300 ease-out active:scale-90 hover:shadow-md hover:bg-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Room Title */}
        <div className="flex items-center justify-center flex-1 mx-4">
          <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-md border border-gray-100 flex items-center gap-2">
            <span className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{room.name}</span>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{room.members.length}</span>
          </div>
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
            <div className="w-24 h-24 rounded-3xl bg-purple-50 mb-4 flex items-center justify-center p-2 border border-purple-100 shadow-sm">
              <span className="text-5xl">🙋🏻🙋🏻‍♀️</span>
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">{room.name}</p>
            <p className="text-xs text-gray-500">함께 운동 목표를 다져보세요!</p>
            <div className="mt-6 inline-block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-sm text-gray-700 leading-relaxed text-left max-w-sm">
              <span className="font-bold block mb-2 text-center">💡 단톡방 가이드</span>
              메시지에 <strong className="text-purple-600">@BMTI</strong> 를 포함하여 전송하면, 방 안의 BMTI 캐릭터들이 대화에 참여합니다.
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.sender_type === 'user' && msg.user_id === userInfo?.id;
          const isOtherUser = msg.sender_type === 'user' && msg.user_id !== userInfo?.id;
          const isSystem = msg.sender_type === 'system';
          const isAI = msg.sender_type === 'bmti_ai';
          
          let aiChar = null;
          let aiName = '';
          if (isAI && msg.bmti_character) {
            aiChar = CHARACTERS.find(c => c.id === msg.bmti_character);
            aiName = CHARACTER_NAMES[msg.bmti_character] || 'BMTI 캐릭터';
          }

          if (isSystem) {
            return (
              <div key={msg.id || idx} className="flex justify-center my-2 fade-in">
                <span className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-2xl text-[11px]">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in-up`}>
              {!isMe && (
                <span className="text-[11px] font-bold text-gray-600 mb-1 ml-11">
                  {isAI ? aiName : (msg.senderName || '참여자')}
                </span>
              )}
              <div className="flex items-end gap-2 max-w-[85%]">
                {!isMe && (
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden mb-1 shadow-sm border border-gray-100 ${isAI ? 'bg-purple-50' : 'bg-gray-100'}`}>
                    {isAI ? (aiChar ? <img src={aiChar.image} alt="AI" className="w-full h-full object-contain scale-110" /> : <span className="text-sm">🤖</span>) : <span className="text-xs">👤</span>}
                  </div>
                )}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                    isMe 
                      ? 'bg-black text-white rounded-tr-sm' 
                      : isAI ? 'bg-purple-50 text-gray-900 border border-purple-100 rounded-tl-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.created_at && (
                    <span className="text-[10px] text-gray-400 mt-1 mx-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-end gap-2 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mb-1 shadow-sm border border-purple-200">
              <span className="text-xs">🤖</span>
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

      {/* Token Warning */}
      {showTokenWarning && (
        <div className="absolute inset-x-0 bottom-28 mx-4 bg-white rounded-[1.5rem] p-5 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] border border-red-100 z-20 animate-pop-in">
          <div className="text-center">
            <span className="text-3xl mb-2 block">🪙</span>
            <h3 className="font-bold text-gray-900 mb-2">토큰 부족</h3>
            <div className="flex gap-2">
              <button onClick={() => setShowTokenWarning(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl active:scale-95 transition-all duration-200">닫기</button>
              <button onClick={handleSpendStar} className="flex-1 py-3 bg-[#FEE500] text-black text-sm font-bold rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all duration-200 shadow-sm">⭐️ 사용</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Input Area (Gemini style) */}
      <div className="p-4 bg-transparent pb-safe flex-shrink-0 z-10 w-full">
        <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-200 flex items-end gap-2 p-2 max-w-2xl mx-auto transition-all duration-300 focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus-within:border-gray-300">
          <button 
            onClick={() => setInputText(prev => prev + '@BMTI ')}
            className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 font-bold text-xs flex items-center justify-center flex-shrink-0 hover:bg-purple-100 active:scale-90 transition-all duration-200"
          >
            @
          </button>
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
            placeholder="메시지 입력... (@BMTI 호출 가능)"
            className="flex-1 bg-transparent px-2 py-2.5 text-sm focus:outline-none resize-none max-h-32 min-h-[40px]"
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
        {/* Token Info under input */}
        <div className="text-center mt-2">
          <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">@BMTI 호출: {bmtiCallCount}/5</span>
        </div>
      </div>
    </div>
  );
};

export default GroupChatRoom;
