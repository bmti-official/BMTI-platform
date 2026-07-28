import { useState, useEffect } from 'react';
import { CHARACTERS, calculateBMTIPercentages, isReservedNickname } from '../data';
import { supabase } from '../lib/supabaseClient';
import { canRetakeTest } from '../lib/bmtiSystem';
import {
  POSTURE_OPTS, POSTURE_LABELS, POSTURE_KNOWN_IDS,
  FREQ_LABELS as EXERCISE_FREQ_LABELS, GOAL_LABELS as EXERCISE_GOAL_LABELS,
  SORE_PARTS, WHEN_OPTS, hasBatchim, soreSummary,
  editsThisMonth, MONTHLY_EDIT_LIMIT,
  setGuestMallang, getGuestMallangHistory, pushGuestMallangHistory,
} from '../lib/mallangProfile';

const MyPageView = ({ setView, userInfo, bmtiCode, setBmtiCode, bmtiAnswers, onLogout }) => {
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
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [showBmtiDetails, setShowBmtiDetails] = useState(false);
  const [isEditingExercise, setIsEditingExercise] = useState(false);
  const [savingExercise, setSavingExercise] = useState(false);
  const [posturePick, setPosturePick] = useState(null);
  const [postureOther, setPostureOther] = useState('');
  const [soreEdit, setSoreEdit] = useState([]); // 수정 모드 불편한 부위 [{part, when, whenOther}]
  const [mallangHistory, setMallangHistory] = useState([]); // 말랑 정보 스냅샷 박스

  // 수정 모드에서 부위 토글(최대 2) / when 지정
  const toggleSorePart = (part) => setSoreEdit(prev => {
    const has = prev.find(s => s.part === part);
    if (has) return prev.filter(s => s.part !== part);
    if (prev.length >= 2) return prev;
    return [...prev, { part, when: [], whenOther: '' }];
  });
  const toggleSoreWhen = (part, w) => setSoreEdit(prev => prev.map(s => {
    if (s.part !== part) return s;
    const cur = Array.isArray(s.when) ? s.when : (s.when ? [s.when] : []);
    return { ...s, when: cur.includes(w) ? cur.filter(x => x !== w) : [...cur, w] };
  }));
  const setSoreWhenOther = (part, txt) => setSoreEdit(prev => prev.map(s => s.part === part ? { ...s, whenOther: txt } : s));

  // 상위에서 userInfo가 업데이트될 경우(ex. 새로운 BMTI 검사 완료 후) 동기화
  useEffect(() => {
    if (userInfo) {
      setUserData(prev => ({ ...prev, ...userInfo }));
    }
  }, [userInfo]);


  const handleSaveProfile = async () => {
    let updatedUserData = { ...userData };
    
    // Check if any field changed
    const hasChanged = userInfo && userInfo.nickname !== userData.nickname;

    if (hasChanged) {
      try {
        if (userInfo.nickname !== userData.nickname) {
          if (isReservedNickname(userData.nickname)) {
            alert('BMTI 파트너 코드와 같은 닉네임은 사용할 수 없습니다. 다른 닉네임을 입력해주세요.');
            return;
          }
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

  const toggleExerciseGoal = (id) => {
    setUserData(prev => {
      const goals = prev.exercise_goals || [];
      const nextGoals = goals.includes(id)
        ? goals.filter(g => g !== id)
        : (goals.length >= 2 ? goals : [...goals, id]);
      return { ...prev, exercise_goals: nextGoals };
    });
  };

  const handleSaveMallangInfo = async () => {
    // 한 달 2회 수정 제한 — 이번 달 'edit' 스냅샷이 이미 2개면 막는다.
    if (editsThisMonth(mallangHistory) >= MONTHLY_EDIT_LIMIT) {
      alert(`말랑 정보는 한 달에 ${MONTHLY_EDIT_LIMIT}번까지만 수정할 수 있어요. 다음 달에 다시 시도해주세요.`);
      return;
    }
    const finalPosture = posturePick === 'other' ? postureOther.trim() : posturePick;
    const soreClean = soreEdit.map(s => {
      const whens = Array.isArray(s.when) ? s.when : (s.when ? [s.when] : []);
      return { part: s.part, when: whens, whenOther: whens.includes('기타') ? (s.whenOther || '').trim() : '' };
    });
    const freq = userData.exercise_frequency || null;
    const goals = userData.exercise_goals || [];
    setSavingExercise(true);
    const snapshot = { sore: soreClean, exercise_frequency: freq, exercise_goals: goals, common_posture: finalPosture || null, source: 'edit', created_at: new Date().toISOString() };
    try {
      if (userData?.id) {
        const { error } = await supabase
          .from('users')
          .update({
            exercise_frequency: freq,
            exercise_goals: goals,
            common_posture: finalPosture || null,
            mallang_sore: soreClean,
            mallang_info_updated_at: new Date().toISOString(),
          })
          .eq('id', userData.id);
        if (error) throw error;
        await supabase.from('mallang_info_history').insert({ user_id: userData.id, sore: soreClean, exercise_frequency: freq, exercise_goals: goals, common_posture: finalPosture || null, source: 'edit' });
      } else {
        // 게스트 — 로컬에만 저장
        setGuestMallang({ mallang_sore: soreClean, exercise_frequency: freq, exercise_goals: goals, common_posture: finalPosture || null });
        pushGuestMallangHistory(snapshot);
      }
      const updated = { ...userData, common_posture: finalPosture, mallang_sore: soreClean };
      setUserData(updated);
      localStorage.setItem('bmti_user', JSON.stringify(updated));
      setMallangHistory(prev => [snapshot, ...prev]);
    } catch (e) {
      console.error('말랑 정보 저장 오류:', e);
      alert('말랑 정보 저장 중 오류가 발생했습니다.');
      setSavingExercise(false);
      return;
    }
    setSavingExercise(false);
    setIsEditingExercise(false);
  };

  const axisCode = bmtiCode ? String(bmtiCode).split('-')[0] : '';
  const charInfo = axisCode ? CHARACTERS.find(c => c.id === axisCode) : null;
  // 유형 톤(색상 통일) — Z=연보라, M=연분홍, 그 외(미검사)=연보라(기본)
  const typeAccent = axisCode.includes('M')
    ? { ring: 'ring-pink-200', badgeBg: 'bg-pink-50', badgeBorder: 'border-pink-200', badgeText: 'text-pink-700', wash: 'from-pink-50' }
    : { ring: 'ring-purple-200', badgeBg: 'bg-purple-50', badgeBorder: 'border-purple-200', badgeText: 'text-purple-700', wash: 'from-purple-50' };

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
              displayDate: new Date(d.created_at).toLocaleDateString()
            })));
          }
        })
        .catch(console.error);
    }
  }, [userData]);

  // 말랑 정보 스냅샷 히스토리 — 로그인은 서버, 게스트는 로컬
  useEffect(() => {
    if (userData?.id) {
      supabase.from('mallang_info_history')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { if (data) setMallangHistory(data); })
        .catch(console.error);
    } else {
      setMallangHistory(getGuestMallangHistory());
    }
  }, [userData?.id]);

  return (
    <div className="pt-24 pb-32 px-4 md:px-6 max-w-3xl mx-auto fade-in">

      {/* 1. 프로필 요약 카드 */}
      <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-[0_2px_24px_rgba(0,0,0,0.05)] border border-gray-100 mb-8 relative overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${typeAccent.wash} to-transparent -z-10`}></div>

        <div className="flex justify-between items-start mb-6">
          <h3 className="font-bold text-lg text-gray-900">내 기본 정보</h3>
          <div className="flex items-center gap-2">
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-xs font-bold text-gray-400 bg-gray-100 hover:bg-red-50 hover:text-red-500 px-3 py-1.5 rounded-full transition-colors"
              >
                로그아웃
              </button>
            )}
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
        </div>

        <div className="flex items-center gap-4 md:gap-5">
          <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-50 ring-4 ${typeAccent.ring} overflow-hidden flex-shrink-0 relative shadow-sm`}>
            {charInfo ? (
              <img src={charInfo.image} alt={axisCode} className={`w-full h-full object-contain ${charInfo.imgClass || 'scale-110'}`} />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-3xl">👤</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={userData.nickname}
                  onChange={(e) => setUserData({...userData, nickname: e.target.value})}
                  disabled={userData.hasEditedNickname}
                  className={`text-lg md:text-xl font-black text-gray-900 border-b-2 ${userData.hasEditedNickname ? 'border-transparent bg-transparent text-gray-500' : 'border-black'} focus:outline-none w-full max-w-[220px] pb-0.5`}
                />
                {!userData.hasEditedNickname && <div className="text-[10px] text-red-500 font-medium mt-1">※ 닉네임은 가입 후 1회만 수정 가능합니다.</div>}
                {userData.hasEditedNickname && <div className="text-[10px] text-gray-400 font-medium mt-1">닉네임 수정 횟수 초과</div>}
              </div>
            ) : (
              <h2 className="text-xl md:text-2xl font-black text-gray-900 flex flex-wrap items-center gap-1.5 mb-2">
                {userData.nickname === 'BMTI' && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md shadow-sm">관리자</span>}
                {userData.nickname}
              </h2>
            )}

            {!isEditing && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-xs font-bold text-gray-600">{userData.kakaoAge} · {userData.kakaoGender}</span>
                {charInfo && (
                  <button
                    onClick={() => setShowBmtiDetails(!showBmtiDetails)}
                    className={`inline-flex items-center gap-1 ${typeAccent.badgeBg} border ${typeAccent.badgeBorder} rounded-full pl-3 pr-2 py-1 text-xs font-black ${typeAccent.badgeText} hover:opacity-80 transition-opacity`}
                  >
                    {axisCode}
                    <svg className={`w-3 h-3 opacity-60 transition-transform ${showBmtiDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                )}
              </div>
            )}

            {isEditing && (
              <div className="flex gap-2 mt-2">
                <select
                  value={userData.kakaoAge}
                  onChange={(e) => setUserData({...userData, kakaoAge: e.target.value})}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
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
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                >
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {!bmtiCode && !isEditing && (
          <button
            onClick={() => setView('home')}
            className="mt-5 w-full bg-[#C9975A] text-white font-bold py-3 rounded-2xl hover:brightness-105 transition-all shadow-sm text-sm"
          >
            🧬 BMTI 검사하기
          </button>
        )}

        {charInfo && !isEditing && showBmtiDetails && (
          <div className="bg-gray-50 p-3.5 md:p-4 rounded-xl border border-gray-200 mt-4 fade-in">
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

        {/* App Notification Toggle — 이 페이지에서만 신청 여부를 확인/변경 가능 */}
        {!isEditing && (
          <div className="flex justify-between items-center gap-3 mt-5 fade-in bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${userData.appNotification ? 'bg-green-50' : 'bg-white border border-gray-200'}`}>
                {userData.appNotification ? '✅' : '🔔'}
              </span>
              <span className="text-xs font-bold text-gray-700 leading-snug">
                {userData.appNotification ? "'BMTI: 말랑 다이어리' 사전 알림 신청 완료" : "'BMTI: 말랑 다이어리' 앱 출시 알림 받기"}
              </span>
            </div>
            <button
              onClick={async () => {
                if (userData.appNotification) return; // 한번 켜면 끌 수 없음
                const updatedUser = { ...userData, appNotification: true };
                setUserData(updatedUser);
                localStorage.setItem('bmti_user', JSON.stringify(updatedUser));
                if (userData.id) {
                  try {
                    // pre_registrations는 신청 이력 로그일 뿐이라, users.app_notification도 같이
                    // 켜둬야 새로고침/재로그인 후에도 "신청 완료" 상태가 그대로 유지된다.
                    await supabase.from('users').update({ app_notification: true }).eq('id', userData.id);
                    await supabase.from('pre_registrations').insert({ user_id: userData.id });
                  } catch (e) {
                    console.error(e);
                  }
                }
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

      {/* 2. BMTI 히스토리 — 아래 블록. (말랑 정보는 그 다음으로 이동) */}

      <div className="mb-4 px-1 mt-6 flex justify-between items-center border-b border-gray-200 pb-3">
        <h3 className="font-bold text-lg text-gray-900">BMTI 히스토리</h3>
        <button 
          onClick={async () => {
            const { canRetake, message, isLastForMonth } = await canRetakeTest(userData);
            if (!canRetake) {
              alert(message);
              return;
            }
            const confirmText = isLastForMonth
              ? `⚠️ ${message}\n\n그래도 새로운 검사를 진행하시겠습니까?`
              : '정말 새로운 검사를 진행하시겠습니까?';
            if (window.confirm(confirmText)) {
              // 재검사로 덮어써지기 전에, 지금까지의 결과를 히스토리에 남겨둔다.
              if (userData?.id && bmtiCode) {
                try {
                  await supabase.from('bmti_history').insert({ user_id: userData.id, bmti_code: bmtiCode });
                } catch (e) {
                  console.error(e);
                }
              }
              setView('quiz');
            }
          }}
          className="border border-gray-200 text-gray-500 font-medium py-1.5 px-4 rounded-full hover:bg-gray-50 transition-colors text-xs shadow-sm whitespace-nowrap"
        >
          새로운 검사하기
        </button>
      </div>
      {/* BMTI 히스토리 리스트 (가로 스크롤) — 현재 유형을 맨 앞에 두고, 그 뒤로 과거 재검사 이력을 최신순으로 */}
      <div className="fade-in flex overflow-x-auto gap-3 md:gap-4 pb-4 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {(() => {
          const fullHistory = [
            ...(bmtiCode ? [{ code: bmtiCode, displayDate: '현재', isCurrent: true }] : []),
            ...bmtiHistory.map(h => ({ ...h, isCurrent: false })),
          ];
          return fullHistory.length > 0 ? fullHistory.map((item, idx) => {
            const codeStr = item.code || '';
            const shortCode = codeStr ? codeStr.split('-')[0] : '알수없음';
            return (
              <div
                key={idx}
                className={`min-w-[140px] md:min-w-[160px] bg-white border p-4 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-sm snap-start ${item.isCurrent ? 'border-[#C9975A]' : 'border-gray-200'}`}
              >
                {item.isCurrent && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#C9975A]"></div>}
                <div className="w-16 h-16 md:w-20 md:h-20 mb-3 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden">
                  {codeStr && getCharImage(codeStr) ? (
                    <img src={getCharImage(codeStr)} alt={shortCode} className="w-full h-full object-contain scale-110" />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </div>
                <h4 className="font-black text-gray-900 text-lg mb-1">{shortCode}</h4>
                <span className="text-[10px] text-gray-400 font-medium">{item.displayDate}</span>
              </div>
            );
          }) : (
            <div className="w-full text-center py-8 text-gray-400 text-sm font-medium">아직 BMTI 검사 내역이 없습니다.</div>
          );
        })()}
      </div>

      {/* 3. 말랑 정보 — 온보딩에서 자동으로 채워지고, 여기서 한 달 2번까지 수정 가능 */}
      <div className="mb-4 px-1 mt-8 flex justify-between items-center border-b border-gray-200 pb-3">
        <h3 className="font-bold text-lg text-gray-900">말랑 정보</h3>
        <button
          onClick={() => {
            if (isEditingExercise) {
              handleSaveMallangInfo();
            } else {
              if (userData.common_posture && POSTURE_KNOWN_IDS.includes(userData.common_posture)) {
                setPosturePick(userData.common_posture); setPostureOther('');
              } else if (userData.common_posture) {
                setPosturePick('other'); setPostureOther(userData.common_posture);
              } else { setPosturePick(null); setPostureOther(''); }
              setSoreEdit(Array.isArray(userData.mallang_sore) ? userData.mallang_sore.map(s => ({ part: s.part, when: Array.isArray(s.when) ? s.when : (s.when ? [s.when] : []), whenOther: s.whenOther || '' })) : []);
              setIsEditingExercise(true);
            }
          }}
          disabled={savingExercise}
          className="text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
        >
          {savingExercise ? '저장 중...' : isEditingExercise ? '저장하기' : '수정하기'}
        </button>
      </div>
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
        {isEditingExercise ? (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs font-bold">불편한 부위 (최대 2곳)</span>
                <button onClick={() => setSoreEdit([])}
                  className={`text-[11px] py-1 px-2.5 rounded-full border font-bold transition-colors ${soreEdit.length === 0 ? 'bg-[#C9975A] text-white border-[#C9975A]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                  불편한 곳 없음
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {SORE_PARTS.map((part) => {
                  const on = soreEdit.some(s => s.part === part);
                  const disabled = !on && soreEdit.length >= 2;
                  return (
                    <button key={part} onClick={() => toggleSorePart(part)} disabled={disabled}
                      className={`text-xs py-1.5 px-1 rounded-lg border font-bold transition-colors text-center ${on ? 'bg-[#C9975A] text-white border-[#C9975A]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'} ${disabled ? 'opacity-40' : ''}`}>
                      {part}
                    </button>
                  );
                })}
              </div>
              {soreEdit.map((s) => {
                const whens = Array.isArray(s.when) ? s.when : (s.when ? [s.when] : []);
                return (
                  <div key={s.part} className="mt-3">
                    <span className="text-gray-500 text-[11px] font-bold block mb-1.5">'{s.part}'{hasBatchim(s.part) ? '은' : '는'} 언제 그러셨어요? <span className="text-gray-400 font-semibold">중복 선택</span></span>
                    <div className="flex flex-wrap gap-1.5">
                      {[...WHEN_OPTS, '기타'].map((w) => (
                        <button key={w} onClick={() => toggleSoreWhen(s.part, w)}
                          className={`text-[11px] py-1 px-2 rounded-md border font-bold transition-colors ${whens.includes(w) ? 'bg-[#C9975A] text-white border-[#C9975A]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                          {w}
                        </button>
                      ))}
                    </div>
                    {whens.includes('기타') && (
                      <input type="text" value={s.whenOther || ''} onChange={(e) => setSoreWhenOther(s.part, e.target.value.slice(0, 30))}
                        placeholder="예: 계단 오를 때" className="mt-2 w-full text-xs px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-gray-400" />
                    )}
                  </div>
                );
              })}
            </div>
            <div>
              <span className="text-gray-400 text-xs font-bold block mb-2">평소 운동, 어떻게 하세요?</span>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(EXERCISE_FREQ_LABELS).map(([id, label]) => (
                  <button key={id} onClick={() => setUserData({ ...userData, exercise_frequency: id })}
                    className={`text-xs py-1.5 px-2 rounded-lg border font-bold transition-colors text-center ${userData.exercise_frequency === id ? 'bg-[#C9975A] text-white border-[#C9975A]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-xs font-bold block mb-2">몸 관리에서 제일 신경 쓰는 건? (최대 2개)</span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(EXERCISE_GOAL_LABELS).map(([id, label]) => {
                  const on = (userData.exercise_goals || []).includes(id);
                  const disabled = !on && (userData.exercise_goals || []).length >= 2;
                  return (
                    <button key={id} onClick={() => toggleExerciseGoal(id)} disabled={disabled}
                      className={`text-xs py-1.5 px-2.5 rounded-lg border font-bold transition-colors ${on ? 'bg-[#C9975A] text-white border-[#C9975A]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'} ${disabled ? 'opacity-40' : ''}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-xs font-bold block mb-2">요즘 하루 대부분 어떻게 지내요?</span>
              <div className="flex flex-wrap gap-1.5">
                {POSTURE_OPTS.map(({ id, label, sub }) => (
                  <button key={id} onClick={() => setPosturePick(id)}
                    className={`text-xs py-1.5 px-2.5 rounded-lg border font-bold transition-colors flex flex-col items-start gap-0.5 ${posturePick === id ? 'bg-[#C9975A] text-white border-[#C9975A]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    <span>{label}</span>
                    {sub && <span className={`text-[10px] font-semibold ${posturePick === id ? 'text-white/75' : 'text-gray-400'}`}>{sub}</span>}
                  </button>
                ))}
              </div>
              {posturePick === 'other' && (
                <input type="text" value={postureOther} onChange={(e) => setPostureOther(e.target.value.slice(0, 20))}
                  placeholder="짧게 적어주세요 (예: 운전을 오래 해요)" className="mt-2 w-full text-xs px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-gray-400" />
              )}
            </div>
            <p className="text-[11px] text-gray-400 font-medium">이번 달 수정 {editsThisMonth(mallangHistory)}/{MONTHLY_EDIT_LIMIT}회</p>
          </div>
        ) : (userData.mallang_sore?.length || userData.exercise_frequency || (userData.exercise_goals && userData.exercise_goals.length > 0) || userData.common_posture) ? (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-600 flex flex-col md:flex-row md:items-start gap-1 md:gap-2">
              <span className="w-full md:w-20 text-gray-400 text-xs shrink-0 md:mt-0.5">불편한 부위</span>
              <span className="text-sm">{soreSummary(userData.mallang_sore) || '아직 입력 전이에요'}</span>
            </div>
            <div className="text-sm font-medium text-gray-600 flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <span className="w-full md:w-20 text-gray-400 text-xs shrink-0">운동 빈도</span>
              <span className="text-sm">{EXERCISE_FREQ_LABELS[userData.exercise_frequency] || '아직 입력 전이에요'}</span>
            </div>
            <div className="text-sm font-medium text-gray-600 flex flex-col md:flex-row md:items-start gap-1 md:gap-2">
              <span className="w-full md:w-20 text-gray-400 text-xs shrink-0 md:mt-0.5">운동 목적</span>
              <div className="flex-1 flex flex-wrap gap-1.5">
                {(userData.exercise_goals && userData.exercise_goals.length > 0) ? (
                  userData.exercise_goals.map((id) => (
                    <span key={id} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-[11px] whitespace-nowrap font-bold">{EXERCISE_GOAL_LABELS[id] || id}</span>
                  ))
                ) : (<span className="text-sm">아직 입력 전이에요</span>)}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600 flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <span className="w-full md:w-20 text-gray-400 text-xs shrink-0">자주 하는 자세</span>
              <span className="text-sm">{POSTURE_LABELS[userData.common_posture] || userData.common_posture || '아직 입력 전이에요'}</span>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm py-2">말랑 다이어리를 처음 시작할 때 물어보는 질문에 답하면 여기에 자동으로 채워져요.</p>
        )}
      </div>

      {/* 4. 말랑 정보 히스토리 — 수정할 때마다 스냅샷을 BMTI 히스토리와 같은 박스로 남긴다 */}
      <div className="mb-4 px-1 mt-8 flex justify-between items-center border-b border-gray-200 pb-3">
        <h3 className="font-bold text-lg text-gray-900">말랑 정보 히스토리</h3>
      </div>
      <div className="fade-in flex overflow-x-auto gap-3 md:gap-4 pb-4 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {mallangHistory.length > 0 ? (
          mallangHistory.map((item, idx) => (
            <div key={idx} className={`min-w-[150px] md:min-w-[170px] bg-white border p-4 rounded-2xl flex flex-col items-center relative overflow-hidden shadow-sm snap-start ${idx === 0 ? 'border-[#C9975A]' : 'border-gray-200'}`}>
              {idx === 0 && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#C9975A]"></div>}
              <div className="w-14 h-14 mb-2 bg-gray-50 rounded-full flex items-center justify-center text-2xl">🩹</div>
              <h4 className="font-bold text-gray-900 text-xs text-center mb-1 leading-snug">{soreSummary(item.sore) || '부위 미입력'}</h4>
              <span className="text-[10px] text-gray-500 font-medium text-center">{EXERCISE_FREQ_LABELS[item.exercise_frequency] || '운동 미입력'}</span>
              <span className="text-[10px] text-gray-400 font-medium mt-1">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
            </div>
          ))
        ) : (
          <div className="w-full text-center py-8 text-gray-400 text-sm font-medium">아직 말랑 정보가 없습니다.</div>
        )}
      </div>

    </div>
  );
};

export default MyPageView;
