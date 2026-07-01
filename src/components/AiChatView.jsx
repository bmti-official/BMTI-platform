/* eslint-disable */
import { useState, useRef, useEffect } from 'react';
import { CHARACTERS, BMTI_INFO, calculateBMTIPercentages } from '../data';

const AiChatView = ({ bmtiCode, setView, bmtiAnswers, userInfo }) => {
  // AI 프로필 캐릭터 가져오기
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const bmtiInfo = BMTI_INFO[axisCode];
  
  // 기본 이미지 설정 (BMTI 결과가 없을 경우)
  const defaultAiImage = '⭐️'; // 기본 봇 이모지 또는 로고 대체 가능
  const aiAvatar = charData ? <img src={charData.image} alt="AI" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-sm" /> : <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-3xl md:text-4xl">{defaultAiImage}</div>;
  const aiName = bmtiInfo ? `'${bmtiInfo.kr}'` : 'BMTI 캐릭터';

  if (!bmtiCode) {
    return (
      <div className="min-h-[100dvh] pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center fade-in bg-[#f8f9fa] relative">
        <button 
          onClick={() => setView('home')}
          className="absolute top-16 left-6 flex items-center gap-1.5 text-gray-500 hover:text-black font-bold text-sm bg-white px-3 py-2 rounded-full shadow-sm border border-gray-100 transition-colors z-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          홈으로
        </button>
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
          <span className="text-4xl">⭐️</span>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-gray-900">운동 심리 AI</h2>
        <p className="text-gray-500 mb-8 max-w-sm break-keep leading-relaxed text-sm">
          정확한 맞춤형 대화를 위해 카카오 간편 로그인 및 BMTI 설문 완료가 필요합니다. 
          나를 대변하는 BMTI 캐릭터를 만나보세요!
        </p>
        <button
          onClick={() => setView('quiz')}
          className="bg-black text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-black/20 hover:bg-gray-800 transition-all hover:-translate-y-1"
        >
          로그인 및 설문 시작하기
        </button>
      </div>
    );
  }

  const getGreeting = (code) => {
    if (!code) return '안녕하세요! BMTI 에이전트입니다. 아직 BMTI 검사를 안 하셨다면, 검사를 먼저 받아보시면 훨씬 정확한 코칭이 가능해요!';
    
    const hour = new Date().getHours();
    const isM = code.includes('M');
    
    if (hour >= 5 && hour < 10) { // 오전
      return isM ? '좋은 아침! 밤새 굳어있던 몸을 가볍게 깨우는 명상이나 스트레칭 자기점검으로 기분 좋게 하루를 시작해볼까? 🧘🏻‍♀️' : '눈 떴으면 핑계는 그만, 오늘 목표한 루틴부터 미루지말고 당장 끝내자! 🌱';
    } else if (hour >= 10 && hour < 12) { // 늦은 오전
      return isM ? '오전 내내 집중하느라 고생했어! 맛있는 점심 먹으러 가기 전에, 뻐근해진 목이랑 어깨 한번 가볍게 점검하고 갈까?? 💆🏻‍♀️' : '점심시간 다가온다고 들떠있지 말고, 오전 내내 구부정하게 앉아있던 네 허리 상태부터 똑바로 점검해 🐢';
    } else if (hour >= 12 && hour < 17) { // 오후
      return isM ? '조금 지치고 나른해질 시간이지? 하던 일 잠깐 멈추고, 너를 위해 숨 한번 크게 쉬어보자 😮‍💨' : '오후 내내 그 구부정한 자세로 앉아서 피로만 쌓고 있을 거야? 몸 더 굳어서 고생하기 전에 지금 당장 일어나서 점검부터 해 🙆🏻‍♀️';
    } else if (hour >= 17 && hour <= 23) { // 늦은 오후 (5시~12시)
      return isM ? '오늘 하루도 일하느라 정말 고생 많았어, 무거워진 몸을 가볍게 움직이는 자기점검으로 긴장된 근육부터 다독여주자. 🏡' : '퇴근(또는 하교)했다고 씻고 바로 누울 생각 마. 하루 종일 삐딱한 자세로 혹사시킨 네 몸 상태부터 똑바로 점검하고 쉬어 🛏️';
    } else { // 새벽 (0시~5시)
      return isM ? '오늘 하루도 버텨내느라 정말 애썼어. 긴장했던 몸 푹 내려놓고 이제 정말 편안하게 쉬자! 💤' : '이 시간까지 안자고 뭐해? 내일 컨디션 망치지 말고 폰 끄고 당장 눈감아 💤';
    }
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: getGreeting(axisCode),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 모바일 키보드 올라올 때 스크롤 보정
  const handleInputFocus = () => {
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;

    const newUserMessage = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);

    // Update red dot state
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    localStorage.setItem('last_chat_date', todayStr);
    window.dispatchEvent(new Event('chat_updated'));

    // Mock AI Response
    setTimeout(() => {
      const mockResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: '이 기능은 현재 MVP(초안) 단계로 시연용 더미 텍스트입니다. 추후 Gemini API가 연동되면 이곳에 BMTI 맞춤형 답변이 출력될 예정입니다.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, mockResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };


  const [viewportStyle, setViewportStyle] = useState({ height: '100dvh', transform: 'translateY(0px)' });

  // Memory Modal States
  const [showMemoryDate, setShowMemoryDate] = useState(false);
  const [showMemoryDetails, setShowMemoryDetails] = useState(false);
  const [memorySummary, setMemorySummary] = useState("오른쪽 어깨 뻐근함 호소 (6/28)\n주 2회 필라테스 중\n목표: 통증 없는 데드리프트");
  const [isEditingMemory, setIsEditingMemory] = useState(false);

  useEffect(() => {
    document.body.classList.add('chat-mode-fixed');

    const handleResize = () => {
      if (window.visualViewport) {
        setViewportStyle({
          height: `${window.visualViewport.height}px`,
          transform: `translateY(${window.visualViewport.pageTop}px)`
        });
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
      handleResize();
    }

    return () => {
      document.body.classList.remove('chat-mode-fixed');
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, []);

  return (
    <div 
      className="relative w-full bg-[#f9fafb] fade-in overflow-hidden"
      style={viewportStyle}
    >
      {/* Top Floating Elements */}
      <div className="fixed top-3 left-0 right-0 z-50 flex items-center justify-between px-4 pointer-events-none">
        
        {/* Left: Home Button */}
        <button 
          onClick={() => setView('home')}
          className="w-10 h-10 md:w-12 md:h-12 bg-white/70 backdrop-blur-md border border-gray-200/50 rounded-full shadow-sm flex items-center justify-center text-gray-500 hover:text-black hover:bg-white transition-all pointer-events-auto"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
        </button>
        
        {/* Center: Title (Floating Text) */}
        <span className="text-base md:text-lg font-serif font-black text-gray-900 tracking-wider absolute left-1/2 -translate-x-1/2 drop-shadow-sm pointer-events-auto">BMTI</span>

        {/* Right: AI Avatar (Memory Button) */}
        <div className="relative pointer-events-auto">
          <button 
            onClick={() => {
              setShowMemoryDetails(!showMemoryDetails);
              setIsEditingMemory(false);
            }}
            className="w-12 h-12 md:w-14 md:h-14 bg-white/70 backdrop-blur-md border border-gray-200/50 text-gray-700 rounded-full shadow-sm flex items-center justify-center p-1 hover:bg-white transition-all active:scale-95"
          >
            {aiAvatar}
          </button>

          {/* Memory Details Modal */}
          {showMemoryDetails && (
            <div className="absolute top-14 right-0 mt-2 w-64 md:w-72 bg-white border border-gray-200 shadow-xl rounded-2xl p-4 fade-in">
              <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <span className="text-lg">🧠</span> AI 기억 저장소
                </h4>
                <button onClick={() => setShowMemoryDetails(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              {isEditingMemory ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="w-full text-xs text-gray-600 p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[80px]"
                    value={memorySummary}
                    onChange={(e) => setMemorySummary(e.target.value)}
                  />
                  <button 
                    onClick={() => setIsEditingMemory(false)}
                    className="bg-black text-white text-xs font-bold py-2 rounded-lg transition-colors hover:bg-gray-800"
                  >
                    저장하기
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-line leading-relaxed border border-gray-100">
                    <div className="font-bold text-gray-900 mb-1 border-b border-gray-200 pb-1">👤 기본 정보 (수정 불가)</div>
                    {userInfo ? (
                      <div className="mb-3 space-y-1">
                        <div><span className="font-medium text-gray-500">연령대/성별:</span> {userInfo.kakaoAge || '-'} / {userInfo.kakaoGender || '-'}</div>
                        <div><span className="font-medium text-gray-500">신체:</span> {userInfo.height || '-'}cm / {userInfo.weight || '-'}kg</div>
                        <div><span className="font-medium text-gray-500">운동 빈도:</span> {userInfo.frequency || '-'}</div>
                        <div><span className="font-medium text-gray-500">운동 목적:</span> {(userInfo.goals || []).join(', ')}</div>
                        
                        <div className="mt-2">
                          <span className="font-medium text-gray-500">현재 BMTI:</span> <span className="font-bold text-[#9BB31B]">{axisCode}</span>
                          <div className="flex flex-col gap-0.5 mt-1 ml-1">
                            {(() => {
                              const percentages = calculateBMTIPercentages(bmtiAnswers);
                              const chars = axisCode.split('');
                              return chars.map((char, index) => {
                                let isConfident = false;
                                if (percentages && percentages[char] !== undefined) {
                                  isConfident = percentages[char] >= 80;
                                }
                                return (
                                  <div key={index} className="flex items-center gap-1.5 text-[10px]">
                                    <span className={`w-1 h-1 rounded-full ${isConfident ? 'bg-black' : 'bg-gray-300'}`}></span>
                                    <span className="font-medium">{isConfident ? '확신의' : '유연한'}</span>
                                    <span className="font-bold">{char}</span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 mb-3">기본 정보가 없습니다.</div>
                    )}
                    
                    <div className="font-bold text-gray-900 mb-1 border-b border-gray-200 pb-1 mt-3">🗓️ 6월 28일 기억 요약</div>
                    {memorySummary}
                  </div>
                  <button 
                    onClick={() => setIsEditingMemory(true)}
                    className="text-gray-500 hover:text-black text-[11px] font-medium self-end flex items-center gap-1 transition-colors mt-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    수정하기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>



      {/* Messages Area */}
      <div className="absolute inset-0 overflow-y-auto px-4 pt-20 pb-[140px] md:pb-[160px] md:pt-24 md:px-8 flex flex-col scroll-smooth hide-scrollbar">
        <div className="flex-1 min-h-0"></div>
        <div className="flex flex-col space-y-4 md:space-y-6 w-full">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} fade-in`}>
            {msg.sender === 'ai' && (
              <div className="flex-shrink-0 mr-2 md:mr-3 mt-1">
                {aiAvatar}
              </div>
            )}
            <div className={`max-w-[75%] md:max-w-[65%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-[13px] md:text-[15px] leading-relaxed break-keep shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-black text-white rounded-tr-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start fade-in">
            <div className="flex-shrink-0 mr-2 md:mr-3 mt-1">
              {aiAvatar}
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        {/* Suggestion Chips (only show when there's only 1 message) */}
        {messages.length === 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar fade-in pb-2 pt-2 snap-x">
            {bmtiCode ? (
              <>
                <button onClick={() => sendMessage('오늘 운동 가기 너무 싫어, 나 좀 혼내줘 🤬')} className="snap-start flex-shrink-0 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs md:text-sm font-medium hover:bg-gray-50 whitespace-nowrap shadow-sm transition-colors">
                  오늘 운동 가기 너무 싫어, 나 좀 혼내줘 🤬
                </button>
                <button onClick={() => sendMessage('자고 일어났더니 목에 담이 왔어, 당장 1분 처방 알려줘 🚑')} className="snap-start flex-shrink-0 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs md:text-sm font-medium hover:bg-gray-50 whitespace-nowrap shadow-sm transition-colors">
                  자고 일어났더니 목에 담이 왔어, 당장 1분 처방 알려줘 🚑
                </button>
                <button onClick={() => sendMessage('다이어트 중인데 치킨이 너무 먹고 싶어... 말려줘 🍗')} className="snap-start flex-shrink-0 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs md:text-sm font-medium hover:bg-gray-50 whitespace-nowrap shadow-sm transition-colors">
                  다이어트 중인데 치킨이 너무 먹고 싶어... 말려줘 🍗
                </button>
                <button onClick={() => sendMessage('사무실에서 몰래 할 수 있는 스트레칭 알려줘 🪑')} className="snap-start flex-shrink-0 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs md:text-sm font-medium hover:bg-gray-50 whitespace-nowrap shadow-sm transition-colors">
                  사무실에서 몰래 할 수 있는 스트레칭 알려줘 🪑
                </button>
              </>
            ) : (
              <button onClick={() => setView('home')} className="flex-shrink-0 bg-[#c0ff00] border border-[#9BB31B]/30 text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-[#b0eb00] shadow-sm">🧬 BMTI 검사하러 가기</button>
            )}
          </div>
        )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Area (Glassmorphism) */}
      <div className="absolute bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:w-[700px] md:-translate-x-1/2 z-50 pointer-events-none flex flex-col items-center">
        <div className="w-full bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-1.5 pointer-events-auto mb-2">
          <form onSubmit={handleSendMessage} className="flex gap-2 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="메시지를 입력하세요..."
              className="flex-1 bg-transparent border-none rounded-full px-5 py-3.5 md:py-4 text-[16px] md:text-sm focus:ring-0 focus:outline-none placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center bg-black text-white rounded-full disabled:opacity-30 disabled:bg-gray-400 transition-colors self-center mr-1"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19V5m0 0l-6 6m6-6l6 6"></path>
              </svg>
            </button>
          </form>
        </div>
        <p className="text-[10px] text-gray-400 text-center leading-tight">
          오늘 대화에서 나온 주요 통증 부위, 현재 목표, 운동 상태를 기억해드립니다.<br className="md:hidden" /> 대화는 하루를 기준으로 초기화 됩니다.
        </p>
      </div>
    </div>
  );
};

export default AiChatView;
