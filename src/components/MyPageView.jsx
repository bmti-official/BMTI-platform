import { useState, useEffect } from 'react';
import { CHARACTERS, calculateBMTIPercentages } from '../data';
import { getStarBalance } from '../lib/starSystem';
import { getRemainingTokens, getTotalDailyLimit, isSubscriber } from '../lib/tokenSystem';
import { getAllMemories, toggleMemorySelection } from '../lib/chatSystem';
import { supabase } from '../lib/supabaseClient';
import { canRetakeTest } from '../lib/bmtiSystem';

const EXERCISE_GOALS = [
  { id: 'diet', label: '다이어트', emoji: '🔥' },
  { id: 'muscle', label: '근력 강화', emoji: '💪' },
  { id: 'health', label: '건강 유지', emoji: '💚' },
  { id: 'flexibility', label: '유연성 향상', emoji: '🧘' },
  { id: 'stress', label: '스트레스 해소', emoji: '🧠' },
  { id: 'posture', label: '체형 교정', emoji: '🦴' },
];

const EXERCISE_FREQUENCY = [
  { id: 'none', label: '거의 안 함' },
  { id: '1-2', label: '주 1~2회' },
  { id: '3-4', label: '주 3~4회' },
  { id: '5+', label: '주 5회 이상' },
];

const MyPageView = ({ setView, userInfo, bmtiCode, setBmtiCode, bmtiAnswers }) => {
  const getCharImage = (fullCode) => {
    if (!fullCode) return null;
    const axis = fullCode.split('-')[0];
    const char = CHARACTERS.find(c => c.id === axis);
    return char ? char.image : null;
  };

  const [userData, setUserData] = useState(userInfo || {
    nickname: '건강한요기니658',
    kakaoAge: '20대',
    kakaoGender: '여성',
    height: 162,
    weight: 52,

    goals: ['🔥 다이어트', '💪 근력 강화'],
    frequency: '주 3~4회',
    isPremium: true
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [showBmtiDetails, setShowBmtiDetails] = useState(false);

  // 상위에서 userInfo가 업데이트될 경우(ex. 새로운 BMTI 검사 완료 후) 동기화
  useEffect(() => {
    if (userInfo) {
      setUserData(prev => ({ ...prev, ...userInfo }));
    }
  }, [userInfo]);

  const [starBalance, setStarBalance] = useState(0);
  const [remainingTokens, setRemainingTokens] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [memories, setMemories] = useState([]);

  useEffect(() => {
    const tier = userData?.subscription_tier || userData?.subscriptionTier || 'free';
    const isPremium = isSubscriber(tier) || userData?.isPremium;
    const effTier = userData?.nickname === 'BMTI' ? 'admin' : (isPremium ? 'plus_lifetime' : 'free');
    
    setStarBalance(getStarBalance());
    setRemainingTokens(getRemainingTokens(effTier));
    setTotalTokens(getTotalDailyLimit(effTier));
    if (userData?.id) {
      getAllMemories(userData.id).then(setMemories);
    }
  }, [userData]);

  const handleToggleMemory = async (id) => {
    if (!userData?.id) return;
    const result = await toggleMemorySelection(id, userData.id, 5);
    if (!result.success && result.isSelected === undefined) {
      alert(result.message);
    } else {
      setMemories(await getAllMemories(userData.id));
    }
  };

  const handleSaveProfile = async () => {
    let updatedUserData = { ...userData };
    
    // Check if any field changed
    const hasChanged = userInfo && (
      userInfo.nickname !== userData.nickname ||
      userInfo.height !== userData.height ||
      userInfo.weight !== userData.weight ||
      userInfo.frequency !== userData.frequency ||
      JSON.stringify(userInfo.goals) !== JSON.stringify(userData.goals)
    );

    if (hasChanged) {
      try {
        if (userInfo.nickname !== userData.nickname) {
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('nickname', userData.nickname);
            
          if (error) throw error;
          if (data && data.length > 0) {
            alert('이미 사용중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
            return;
          }
        }

        
        // Update all fields in Supabase
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            nickname: userData.nickname,
            height: userData.height,
            weight: userData.weight,
            frequency: userData.frequency,
            goals: userData.goals
          })
          .eq('id', userData.id);
          
        if (updateError) throw updateError;
        
        if (userInfo && userInfo.nickname !== userData.nickname) {
          updatedUserData.hasEditedNickname = true;
        }
      } catch (e) {
        console.error('프로필 변경 오류:', e);
        alert('프로필 변경 중 오류가 발생했습니다.');
        return;
      }
    }
    setUserData(updatedUserData);
    localStorage.setItem('bmti_user', JSON.stringify(updatedUserData));
    
    // Check if App.jsx provided a setter to update global state
    // To make sure Navbar and other components re-render, we'd need to update global state.
    // Assuming setUserProfile might not be passed down, but usually changing localStorage is enough 
    // if we refresh or it triggers an effect. Actually, let's just reload if nickname changed.
    if (updatedUserData.hasEditedNickname) {
      window.location.reload();
    }
    
    setIsEditing(false);
  };

  const toggleGoal = (goal) => {
    setUserData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const axisCode = bmtiCode ? String(bmtiCode).split('-')[0] : '';
  const charInfo = axisCode ? CHARACTERS.find(c => c.id === axisCode) : null;

  const [bmtiHistory, setBmtiHistory] = useState([]);

  useEffect(() => {
    if (userData?.id) {
      supabase.from('bmti_history')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) {
            setBmtiHistory(data.map(d => ({
              code: d.bmti_code,
              date: new Date(d.created_at).toLocaleDateString()
            })));
          }
        })
        .catch(console.error);
    }
  }, [userData]);

  // 모의 무브먼트 라이브 히스토리 데이터
  const liveHistory = [];

  return (
    <div className="pt-32 pb-32 px-4 md:px-6 max-w-3xl mx-auto fade-in">

      {/* 1. 프로필 요약 카드 */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#c0ff00]/10 rounded-bl-full -z-10"></div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-gray-900">내 기본 정보</h3>
          <button 
            onClick={() => {
              if (isEditing) {
                handleSaveProfile();
              } else {
                setIsEditing(true);
              }
            }}
            className="text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
          >
            {isEditing ? '저장하기' : '수정하기'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-5 md:gap-6 items-start">
          <div className="flex items-center gap-4 md:flex-col md:items-start flex-shrink-0 w-full md:w-auto">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0 relative shadow-inner">
              {charInfo ? (
                <img src={charInfo.image} alt={axisCode} className={`w-full h-full object-contain ${charInfo.imgClass || 'scale-110'}`} />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-3xl">👤</span>
              )}
            </div>
            
            <div className="flex-1 md:hidden">
              {isEditing ? (
                <div className="flex flex-col">
                  <input 
                    type="text" 
                    value={userData.nickname}
                    onChange={(e) => setUserData({...userData, nickname: e.target.value})}
                    disabled={userData.hasEditedNickname}
                    className={`text-lg font-black text-gray-900 border-b-2 ${userData.hasEditedNickname ? 'border-transparent bg-transparent text-gray-500' : 'border-black'} focus:outline-none w-full pb-0.5`}
                  />
                  {!userData.hasEditedNickname && <div className="text-[10px] text-red-500 font-medium mt-1">※ 가입 후 1회만 수정 가능</div>}
                  {userData.hasEditedNickname && <div className="text-[10px] text-gray-400 font-medium mt-1">수정 횟수 초과</div>}
                </div>
              ) : (
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-gray-900 flex flex-wrap items-center gap-1.5">
                    {userData.nickname === 'BMTI' && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-sm shadow-sm">관리자</span>}
                    {userData.nickname}
                  </h2>
                  {userData.isPremium && userData.nickname !== 'BMTI' && (
                    <span className="bg-[#c0ff00] text-black text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex w-fit mt-1 shadow-sm">
                      🎟️ 자기점검 평생구독권
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {charInfo && !isEditing && (
                <div className="md:hidden flex-shrink-0">
                  <button 
                    onClick={() => setShowBmtiDetails(!showBmtiDetails)}
                    className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
                  >
                    <span className="text-[9px] font-bold text-gray-500">현재 BMTI</span>
                    <span className="text-sm font-black text-[#9BB31B]">{axisCode}</span>
                  </button>
                </div>
            )}
          </div>
          
          <div className="flex-1 w-full">
            <div className="hidden md:flex flex-col mb-4">
              {isEditing ? (
                <div>
                  <input 
                    type="text" 
                    value={userData.nickname}
                    onChange={(e) => setUserData({...userData, nickname: e.target.value})}
                    disabled={userData.hasEditedNickname}
                    className={`text-xl font-black text-gray-900 border-b-2 ${userData.hasEditedNickname ? 'border-transparent bg-transparent text-gray-500' : 'border-black'} focus:outline-none w-48 pb-0.5`}
                  />
                  {!userData.hasEditedNickname && <div className="text-[10px] text-red-500 font-medium mt-1">※ 닉네임은 가입 후 1회만 수정 가능합니다.</div>}
                  {userData.hasEditedNickname && <div className="text-[10px] text-gray-400 font-medium mt-1">닉네임 수정 횟수 초과</div>}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black text-gray-900 flex items-center">
                    {userData.nickname === 'BMTI' && <span className="mr-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-md shadow-sm align-middle">관리자</span>}
                    {userData.nickname}
                  </h2>
                  {userData.isPremium && userData.nickname !== 'BMTI' && (
                    <span className="bg-[#c0ff00] text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      🎟️ 자기점검 평생구독권
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="space-y-3 md:space-y-2.5 flex-1 w-full">
                    <div className="text-sm font-medium text-gray-600 flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                      <span className="w-full md:w-16 text-gray-400 text-xs shrink-0">연령대/성별</span>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <select 
                            value={userData.kakaoAge} 
                            onChange={(e) => setUserData({...userData, kakaoAge: e.target.value})} 
                            className="border rounded px-2 py-1 text-xs w-24"
                          >
                            <option value="10대">10대</option>
                            <option value="20대">20대</option>
                            <option value="30대">30대</option>
                            <option value="40대">40대</option>
                            <option value="50대 이상">50대 이상</option>
                          </select>
                          <select 
                            value={userData.kakaoGender} 
                            onChange={(e) => setUserData({...userData, kakaoGender: e.target.value})} 
                            className="border rounded px-2 py-1 text-xs w-20"
                          >
                            <option value="남성">남성</option>
                            <option value="여성">여성</option>
                          </select>
                        </div>
                      ) : (
                        <span className="text-sm md:text-sm">{userData.kakaoAge} {userData.kakaoGender}</span>
                      )}
                    </div>

                    <div className="text-sm font-medium text-gray-600 flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                      <span className="w-full md:w-14 text-gray-400 text-xs shrink-0">신체 정보</span>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input type="number" value={userData.height} onChange={(e) => setUserData({...userData, height: e.target.value})} className="w-16 border rounded px-2 py-1 text-xs text-center" /> cm / 
                          <input type="number" value={userData.weight} onChange={(e) => setUserData({...userData, weight: e.target.value})} className="w-16 border rounded px-2 py-1 text-xs text-center" /> kg
                        </div>
                      ) : (
                        <span className="text-sm md:text-sm">{userData.height}cm / {userData.weight}kg</span>
                      )}
                    </div>

                    <div className="text-sm font-medium text-gray-600 flex flex-col sm:flex-row sm:items-start gap-1.5 md:gap-2">
                      <span className="w-full md:w-14 text-gray-400 text-xs shrink-0 md:mt-1">운동 빈도</span>
                      {isEditing ? (
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-1.5 w-full">
                          {EXERCISE_FREQUENCY.map(freq => (
                            <button
                              key={freq.id}
                              onClick={() => setUserData({...userData, frequency: freq.id})}
                              className={`text-xs py-1.5 px-1 md:px-2 rounded-lg border font-bold transition-colors text-center ${
                                userData.frequency === freq.id ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              {freq.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="md:mt-0.5 text-sm">{EXERCISE_FREQUENCY.find(f => f.id === userData.frequency)?.label || userData.frequency}</span>
                      )}
                    </div>

                    <div className="text-sm font-medium text-gray-600 flex flex-col sm:flex-row sm:items-start gap-1.5 md:gap-2">
                      <span className="w-full md:w-14 text-gray-400 text-xs shrink-0 md:mt-1">운동 목적</span>
                      <div className="flex-1 flex flex-wrap gap-1.5 w-full">
                        {isEditing ? (
                          EXERCISE_GOALS.map(goal => (
                            <button
                              key={goal.id}
                              onClick={() => toggleGoal(goal.id)}
                              className={`text-xs py-1.5 px-2 md:px-2.5 rounded-lg border font-bold transition-colors ${
                                (userData.goals || []).includes(goal.id) ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              {goal.emoji} {goal.label}
                            </button>
                          ))
                        ) : (
                          (userData.goals || []).map((goalId, i) => {
                            const found = EXERCISE_GOALS.find(g => g.id === goalId);
                            const text = found ? `${found.emoji} ${found.label}` : goalId;
                            return (
                              <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-[11px] whitespace-nowrap font-bold">{text}</span>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {!bmtiCode && (
                      <div className="flex items-center justify-start py-4 mt-2">
                        <button 
                          onClick={() => setView('home')} 
                          className="bg-black text-[#c0ff00] font-bold py-2.5 px-6 rounded-full hover:bg-gray-900 transition-colors shadow-sm text-sm w-full md:w-auto"
                        >
                          🧬 BMTI 검사하기
                        </button>
                      </div>
                    )}
                  </div>
              
              {charInfo && !isEditing && (
                <div className="hidden md:block w-24 flex-shrink-0">
                  <button 
                    onClick={() => setShowBmtiDetails(!showBmtiDetails)}
                    className="w-full aspect-square bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
                  >
                    <span className="text-[10px] font-bold text-gray-500">현재 BMTI</span>
                    <span className="text-lg font-black text-[#9BB31B] mt-0.5">{axisCode}</span>
                    <svg className={`w-3.5 h-3.5 text-gray-400 mt-1.5 transition-transform ${showBmtiDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                </div>
              )}
            </div>

            {charInfo && !isEditing && showBmtiDetails && (
              <div className="bg-gray-50 p-3.5 md:p-4 rounded-xl border border-gray-200 mt-3 fade-in relative z-10">
                <div className="flex flex-wrap items-center gap-y-2 text-xs md:text-sm">
                  {(() => {
                    const percentages = calculateBMTIPercentages(bmtiAnswers);
                    const chars = (axisCode || '').split('');
                    return chars.map((char, index) => {
                      let isConfident = false;
                      if (percentages && percentages[char] !== undefined) {
                        isConfident = percentages[char] >= 80;
                      }
                      
                      return (
                        <div key={index} className="flex items-center gap-1.5 whitespace-nowrap">
                          {index > 0 && <span className="text-gray-300 mx-1 md:mx-1.5">/</span>}
                          <span className={`w-1.5 h-1.5 rounded-full ${isConfident ? 'bg-black' : 'bg-gray-300'}`}></span>
                          <span className="font-bold text-gray-600">{isConfident ? '확신의' : '유연한'}</span>
                          <span className="font-black text-gray-800 text-sm">{char}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* App Notification Toggle (Moved to normal flow to prevent overlap) */}
        {!isEditing && (
          <div className="flex justify-end items-center gap-3 mt-4 fade-in">
            <span className="text-xs font-bold text-gray-600">'무브먼트 맵' 앱 출시 알림 받기</span>
            <button
              onClick={() => {
                if (userData.appNotification) return; // Cannot disable once enabled
                const updatedUser = { ...userData, appNotification: true };
                setUserData(updatedUser);
                localStorage.setItem('bmti_user', JSON.stringify(updatedUser));
              }}
              className={`w-12 h-7 rounded-full flex-shrink-0 transition-all duration-300 relative ${
                userData.appNotification ? 'bg-black cursor-not-allowed' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${
                userData.appNotification ? 'left-6' : 'left-1'
              }`} />
            </button>
          </div>
        )}
      </div>

      {/* 2. 구독 및 자산 현황 */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
        <h3 className="font-bold text-lg text-gray-900 mb-4">구독 및 토큰 관리</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col items-center justify-center text-center">
            <span className="text-2xl mb-1">🪙</span>
            <span className="text-[10px] text-gray-500 font-bold mb-1">오늘 남은 토큰</span>
            <span className="font-black text-gray-900">{remainingTokens.toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">/ {totalTokens.toLocaleString()}</span></span>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100 flex flex-col items-center justify-center text-center">
            <span className="text-2xl mb-1">⭐️</span>
            <span className="text-[10px] text-yellow-700 font-bold mb-1">보유 스타</span>
            <span className="font-black text-gray-900">{starBalance.toLocaleString()} <span className="text-[10px] font-normal text-yellow-600">개</span></span>
          </div>
        </div>
      </div>

      {/* 3. AI 기억 관리 (구독자 전용) */}
      {(isSubscriber(userData?.subscription_tier || userData?.subscriptionTier) || userData?.isPremium) && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900">AI 기억 관리</h3>
              <p className="text-xs text-gray-500 mt-1">대화에 참고할 중요한 기억을 선택하세요 (최대 5개)</p>
            </div>
            <span className="text-[10px] font-bold bg-[#c0ff00] text-black px-2 py-1 rounded-full">
              {memories.filter(m => m.isSelected).length} / 5 선택됨
            </span>
          </div>
          
          {memories.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {memories.map(mem => (
                <div key={mem.id} className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${mem.isSelected ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                  <div className="flex-1 min-w-0 pr-4 cursor-pointer" onClick={() => handleToggleMemory(mem.id)}>
                    <p className="text-sm text-gray-800 font-medium truncate">{mem.summary}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{mem.chatDate}</p>
                  </div>
                  <button 
                    onClick={() => handleToggleMemory(mem.id)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${mem.isSelected ? 'bg-purple-500 text-white' : 'bg-gray-200 text-transparent'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-2xl block mb-2 text-gray-300">🧠</span>
              <p className="text-sm text-gray-500">아직 저장된 기억이 없습니다.<br/>BMTI 캐릭터와 대화를 나누면 자동으로 기록됩니다.</p>
            </div>
          )}
        </div>
      )}

      <div className="mb-4 px-1 mt-6 flex justify-between items-center border-b border-gray-200 pb-3">
        <h3 className="font-bold text-lg text-gray-900">BMTI 히스토리</h3>
        <button 
          onClick={async () => {
            const { canRetake, message } = await canRetakeTest(userData);
            if (!canRetake) {
              if (window.confirm(`${message}\n\n평생구독권(Plus)을 구매하시겠습니까?`)) {
                setView('ticket');
              }
              return;
            }
            if (window.confirm('정말 새로운 검사를 진행하시겠습니까?')) {
              setView('quiz');
            }
          }} 
          className="border border-gray-200 text-gray-500 font-medium py-1.5 px-4 rounded-full hover:bg-gray-50 transition-colors text-xs shadow-sm whitespace-nowrap"
        >
          새로운 검사하기
        </button>
      </div>
      {/* BMTI 히스토리 리스트 (가로 스크롤) */}
      <div className="fade-in flex overflow-x-auto gap-3 md:gap-4 pb-4 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {bmtiHistory.length > 0 ? (
          [...bmtiHistory].sort((a, b) => new Date(b.date) - new Date(a.date)).map((item, idx) => {
            const codeStr = item.code || '';
            const shortCode = codeStr ? codeStr.split('-')[0] : '알수없음';
            const isCurrent = idx === 0; // Since it's sorted descending, newest is index 0
            return (
              <div 
                key={idx} 
                className={`min-w-[140px] md:min-w-[160px] bg-white border p-4 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-sm snap-start ${isCurrent ? 'border-[#c0ff00]' : 'border-gray-200'}`}
              >
                {isCurrent && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#c0ff00]"></div>}
                <div className="w-16 h-16 md:w-20 md:h-20 mb-3 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden">
                  {codeStr && getCharImage(codeStr) ? (
                    <img src={getCharImage(codeStr)} alt={shortCode} className="w-full h-full object-contain scale-110" />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </div>
                <h4 className="font-black text-gray-900 text-lg mb-1">{shortCode}</h4>
                <span className="text-[10px] text-gray-400 font-medium">{item.date}</span>
              </div>
            );
          })
        ) : (
          <div className="w-full text-center py-8 text-gray-400 text-sm font-medium">아직 BMTI 검사 내역이 없습니다.</div>
        )}
      </div>

      <div className="mb-4 px-1 mt-8 flex justify-between items-center border-b border-gray-200 pb-3">
        <h3 className="font-bold text-lg text-gray-900">무브먼트 라이브 히스토리</h3>
        <button onClick={() => setView('bodycheck')} className="bg-black text-white font-medium py-1.5 px-4 rounded-full hover:bg-gray-800 transition-colors text-xs shadow-sm whitespace-nowrap">
          신청하기
        </button>
      </div>
      {/* 무브먼트 라이브 히스토리 리스트 (가로 스크롤) */}
      <div className="fade-in flex overflow-x-auto gap-3 md:gap-4 pb-4 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {liveHistory.length > 0 ? (
          liveHistory.map((item, idx) => (
            <div 
              key={idx} 
              className="min-w-[140px] md:min-w-[160px] bg-white border border-gray-200 p-4 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-sm snap-start"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 mb-3 bg-gray-50 rounded-full flex items-center justify-center text-2xl">
                🎥
              </div>
              <h4 className="font-bold text-gray-900 text-xs text-center mb-1 whitespace-pre-line leading-snug h-8 flex items-center justify-center">{item.title}</h4>
              <span className="text-[10px] text-gray-400 font-medium mt-1">{item.date}</span>
            </div>
          ))
        ) : (
          <div className="w-full text-center py-8 text-gray-400 text-sm font-medium">아직 무브먼트 라이브 신청 내역이 없습니다.</div>
        )}
      </div>

    </div>
  );
};

export default MyPageView;
