import { useState, useEffect } from 'react';
import { CHARACTERS, calculateBMTIPercentages, isReservedNickname } from '../data';
import { supabase } from '../lib/supabaseClient';
import { canRetakeTest } from '../lib/bmtiSystem';
import TypeGallery from './TypeGallery';
import { Mallang } from './Mallang';
import { hasLocalHealthConsent, setLocalHealthConsent, updateHealthRecordConsent } from '../lib/healthConsentSystem';

// 하단 네비게이션 바 'BMTI' 탭과 동일한 펼친 책 아이콘 (currentColor)
const BookIcon = ({ className = 'w-6 h-6', style }) => (
  <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.2C10.3 5 7.4 4.5 4.3 5v12.6C7.4 17.1 10.3 17.6 12 18.8" />
    <path d="M12 6.2C13.7 5 16.6 4.5 19.7 5v12.6C16.6 17.1 13.7 17.6 12 18.8" />
    <path d="M12 6.2V18.8" />
  </svg>
);

// 하단 네비게이션 바 '기록·발견' 탭과 동일한 막대그래프 아이콘 (currentColor)
const ChartIcon = ({ className = 'w-6 h-6', style }) => (
  <svg viewBox="0 0 24 24" className={className} style={style} fill="none">
    <rect x="3" y="10" width="4.5" height="10" rx="2.25" fill="currentColor" />
    <rect x="9.75" y="4" width="4.5" height="16" rx="2.25" fill="currentColor" />
    <rect x="16.5" y="8" width="4.5" height="12" rx="2.25" fill="currentColor" />
  </svg>
);
import {
  POSTURE_OPTS, POSTURE_LABELS, POSTURE_KNOWN_IDS,
  FREQ_LABELS as EXERCISE_FREQ_LABELS, GOAL_LABELS as EXERCISE_GOAL_LABELS,
  SORE_PARTS, WHEN_OPTS, hasBatchim, soreSummary,
  editsThisMonth, MONTHLY_EDIT_LIMIT,
  setGuestMallang, getGuestMallangHistory, pushGuestMallangHistory,
} from '../lib/mallangProfile';

// 사이트 색상 토큰 — 배경 화이트 / 기본 버튼 연보라 / 중요 버튼 골드 / 중요 박스 그림자 연옐로우
const GOLD = '#C9975A';
const PURPLE = '#8B7BD8';
const PURPLE_SOFT_BG = '#EEE9FB';
const PURPLE_SOFT_TX = '#6E5FB8';
const YELLOW_SHADOW = '0 2px 6px rgba(220,188,86,0.18), 0 12px 28px rgba(233,203,110,0.34)';

// 섹션 헤더 — 이모지 + 제목 + (선택) 우측 액션 버튼
function SectionHeader({ emoji, title, children }) {
  return (
    <div className="flex items-center justify-between mb-3 px-1 mt-8">
      <h3 className="font-black text-[17px] text-gray-900 flex items-center gap-2"><span>{emoji}</span>{title}</h3>
      {children}
    </div>
  );
}

// 건강 기록 동의 체크 행 (다이어리 게이트와 동일한 문구)
function ConsentRow({ checked, onToggle, tag, disabled, children }) {
  return (
    <button onClick={disabled ? undefined : onToggle} disabled={disabled}
      className="w-full flex gap-2.5 items-start text-left rounded-xl p-3 border transition-colors"
      style={{ background: '#FBFAF6', borderColor: checked ? GOLD : '#EDE9E2', cursor: disabled ? 'default' : 'pointer' }}>
      <span className="w-5 h-5 shrink-0 rounded-md flex items-center justify-center text-white text-[12px] font-black mt-0.5"
        style={{ border: `2px solid ${checked ? GOLD : '#D8D3C8'}`, background: checked ? GOLD : '#fff' }}>{checked ? '✓' : ''}</span>
      <span className="flex-1">
        <span className="text-[10px] font-extrabold" style={{ color: tag === '필수' ? '#C0392B' : '#8A8378' }}>[{tag}]</span>
        <span className="block text-[12.5px] font-bold text-gray-700 leading-snug mt-0.5 break-keep">{children}</span>
      </span>
    </button>
  );
}

// 기본(연보라) 버튼 / 중요(골드) 버튼 pill
function PillButton({ gold, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-bold px-3.5 py-1.5 rounded-full transition-all disabled:opacity-60 whitespace-nowrap"
      style={gold ? { background: GOLD, color: '#fff' } : { background: PURPLE_SOFT_BG, color: PURPLE_SOFT_TX }}
    >
      {children}
    </button>
  );
}

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
  const [isEditingExercise, setIsEditingExercise] = useState(false);
  const [savingExercise, setSavingExercise] = useState(false);
  const [posturePick, setPosturePick] = useState(null);
  const [postureOther, setPostureOther] = useState('');
  const [soreEdit, setSoreEdit] = useState([]); // 수정 모드 불편한 부위 [{part, when, whenOther}]
  const [mallangHistory, setMallangHistory] = useState([]); // 일상 정보 스냅샷 박스
  const [showGallery, setShowGallery] = useState(false); // '다른 유형 구경' 갤러리

  // 건강 기록 동의(필수·선택) — 다이어리 첫 진입 게이트와 동일 항목을 마이페이지에서도 관리
  const consentStr = (() => { try { return localStorage.getItem('bmti_health_consent') || ''; } catch { return ''; } })();
  const [consentGiven, setConsentGiven] = useState(hasLocalHealthConsent());
  const [cReq, setCReq] = useState(hasLocalHealthConsent());
  const [cOpt, setCOpt] = useState(consentStr.includes(':opt'));
  const [cSaving, setCSaving] = useState(false);

  const saveConsent = async () => {
    if (!cReq || cSaving) return;
    setCSaving(true);
    if (userData?.id) { try { await updateHealthRecordConsent(userData.id, true, cOpt); } catch (e) { console.error('건강정보 동의 저장 실패', e); } }
    setLocalHealthConsent(cOpt);
    setCSaving(false);
    setConsentGiven(true);
  };
  // 이미 동의한 상태에서 선택 항목만 켜고 끈다
  const updateOptional = async (opt) => {
    setCOpt(opt);
    if (userData?.id) { try { await updateHealthRecordConsent(userData.id, true, opt); } catch (e) { console.error('선택 동의 변경 실패', e); } }
    setLocalHealthConsent(opt);
  };

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
            alert('내 BMTI 유형 코드와 같은 닉네임은 사용할 수 없습니다. 다른 닉네임을 입력해주세요.');
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
      alert(`일상 정보는 한 달에 ${MONTHLY_EDIT_LIMIT}번까지만 수정할 수 있어요. 다음 달에 다시 시도해주세요.`);
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
      console.error('일상 정보 저장 오류:', e);
      alert('일상 정보 저장 중 오류가 발생했습니다.');
      setSavingExercise(false);
      return;
    }
    setSavingExercise(false);
    setIsEditingExercise(false);
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
              displayDate: new Date(d.created_at).toLocaleDateString()
            })));
          }
        })
        .catch(console.error);
    }
  }, [userData]);

  // 일상 정보 스냅샷 히스토리 — 로그인은 서버, 게스트는 로컬
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

  const startEditMallang = () => {
    if (userData.common_posture && POSTURE_KNOWN_IDS.includes(userData.common_posture)) {
      setPosturePick(userData.common_posture); setPostureOther('');
    } else if (userData.common_posture) {
      setPosturePick('other'); setPostureOther(userData.common_posture);
    } else { setPosturePick(null); setPostureOther(''); }
    setSoreEdit(Array.isArray(userData.mallang_sore) ? userData.mallang_sore.map(s => ({ part: s.part, when: Array.isArray(s.when) ? s.when : (s.when ? [s.when] : []), whenOther: s.whenOther || '' })) : []);
    setIsEditingExercise(true);
  };

  const handleNewTest = async () => {
    const { canRetake, message, isLastForMonth } = await canRetakeTest(userData);
    if (!canRetake) { alert(message); return; }
    const confirmText = isLastForMonth
      ? `⚠️ ${message}\n\n그래도 새로운 검사를 진행하시겠습니까?`
      : '정말 새로운 검사를 진행하시겠습니까?';
    if (window.confirm(confirmText)) {
      if (userData?.id && bmtiCode) {
        try { await supabase.from('bmti_history').insert({ user_id: userData.id, bmti_code: bmtiCode }); }
        catch (e) { console.error(e); }
      }
      setView('quiz');
    }
  };

  // 상단 빠른 이동 타일 (이미지의 2×2 그리드 벤치마킹) — 하단 네비 아이콘과 통일
  const tiles = [
    { icon: <BookIcon className="w-6 h-6" style={{ color: PURPLE }} />, label: '내 유형 결과', sub: bmtiCode ? axisCode : '검사하기', onClick: () => setView(bmtiCode ? 'result' : 'quiz') },
    { icon: <Mallang v={5} size={28} noBlink />, label: '건강 다이어리', sub: '오늘 기록하기', onClick: () => setView('aichat') },
    { icon: <ChartIcon className="w-6 h-6" style={{ color: PURPLE }} />, label: '이번 달 발견', sub: '내 몸 패턴 보기', onClick: () => window.dispatchEvent(new Event('bmti:open-discovery')) },
    { emoji: '🔍', label: '다른 유형 구경', sub: '16유형 둘러보기', onClick: () => setShowGallery(true) },
  ];

  // 수정 모드 칩 스타일 — 선택 시 연보라(기본 버튼 색)
  const chipCls = 'text-xs py-1.5 px-1 rounded-lg border font-bold transition-colors text-center';
  const chipOn = { background: PURPLE, color: '#fff', borderColor: PURPLE };

  return (
    <div className="pt-20 pb-32 px-4 md:px-6 max-w-3xl mx-auto fade-in bg-white">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5 px-1">
        <h1 className="text-[26px] font-black text-gray-900">내 공간</h1>
        {onLogout && (
          <button onClick={onLogout} className="text-xs font-bold px-3.5 py-1.5 rounded-full transition-colors hover:brightness-95" style={{ background: PURPLE_SOFT_BG, color: PURPLE_SOFT_TX }}>
            로그아웃
          </button>
        )}
      </div>

      {/* 1. 프로필 카드 (중요 박스 — 연옐로우 그림자) */}
      <div className="bg-white rounded-[28px] p-6 md:p-7 border border-[#F3EFE6] mb-6 relative overflow-hidden" style={{ boxShadow: YELLOW_SHADOW }}>
        <div className="absolute top-5 right-5 z-10">
          <PillButton gold={isEditing} onClick={() => { if (isEditing) handleSaveProfile(); else setIsEditing(true); }}>
            {isEditing ? '저장하기' : '수정하기'}
          </PillButton>
        </div>

        <div className="flex items-center gap-4 md:gap-5">
          {/* 아바타 — 누끼 캐릭터만(감싸는 원·수정 배지 없음) */}
          <div className="w-[92px] h-[92px] md:w-28 md:h-28 flex items-center justify-center flex-shrink-0">
            {charInfo ? (
              <img src={charInfo.image} alt={axisCode} className={`w-full h-full object-contain ${charInfo.imgClass || 'scale-110'}`} />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-gray-400 mb-1">카카오톡 회원</div>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={userData.nickname}
                  onChange={(e) => setUserData({ ...userData, nickname: e.target.value })}
                  disabled={userData.hasEditedNickname}
                  className={`text-lg md:text-xl font-black text-gray-900 border-b-2 ${userData.hasEditedNickname ? 'border-transparent bg-transparent text-gray-500' : 'border-[#8B7BD8]'} focus:outline-none w-full max-w-[200px] pb-0.5`}
                />
                {!userData.hasEditedNickname && <div className="text-[10px] text-red-500 font-medium mt-1">※ 닉네임은 가입 후 1회만 수정 가능합니다.</div>}
                {userData.hasEditedNickname && <div className="text-[10px] text-gray-400 font-medium mt-1">닉네임 수정 횟수 초과</div>}
                <div className="flex gap-2 mt-2">
                  <select value={userData.kakaoAge} onChange={(e) => setUserData({ ...userData, kakaoAge: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
                    <option value="10대">10대</option>
                    <option value="20대">20대</option>
                    <option value="30대">30대</option>
                    <option value="40대">40대</option>
                    <option value="50대 이상">50대 이상</option>
                  </select>
                  <select value={userData.kakaoGender} onChange={(e) => setUserData({ ...userData, kakaoGender: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
                    <option value="남성">남성</option>
                    <option value="여성">여성</option>
                  </select>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 flex flex-wrap items-center gap-2 mb-2 pr-16">
                  {userData.nickname === 'BMTI' && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md shadow-sm">관리자</span>}
                  {axisCode && <span className="text-sm md:text-base font-black text-white px-2.5 py-1 rounded-xl" style={{ background: PURPLE }}>{axisCode}</span>}
                  <span className="truncate">{userData.nickname}</span>
                </h2>
                <span className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-xs font-bold text-gray-600">{userData.kakaoAge} · {userData.kakaoGender}</span>
              </>
            )}
          </div>
        </div>

        {!bmtiCode && !isEditing && (
          <button
            onClick={() => setView('home')}
            className="mt-5 w-full text-white font-bold py-3 rounded-2xl hover:brightness-105 transition-all shadow-sm text-sm flex items-center justify-center gap-2"
            style={{ background: GOLD }}
          >
            <BookIcon className="w-5 h-5" style={{ color: '#fff' }} /> BMTI 검사하기
          </button>
        )}

        {/* 앱 출시 알림 토글 */}
        {!isEditing && (
          <div className="flex justify-between items-center gap-3 mt-5 fade-in bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${userData.appNotification ? 'bg-green-50' : 'bg-white border border-gray-200'}`}>
                {userData.appNotification ? '✅' : '🔔'}
              </span>
              <span className="text-xs font-bold text-gray-700 leading-snug">
                {userData.appNotification ? "'BMTI: 건강 다이어리' 사전 알림 신청 완료" : "'BMTI: 건강 다이어리' 앱 출시 알림 받기"}
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
                    await supabase.from('users').update({ app_notification: true }).eq('id', userData.id);
                    await supabase.from('pre_registrations').insert({ user_id: userData.id });
                  } catch (e) {
                    console.error(e);
                  }
                }
              }}
              className={`w-12 h-7 rounded-full flex-shrink-0 transition-all duration-300 relative ${userData.appNotification ? 'cursor-not-allowed' : 'bg-gray-300'}`}
              style={userData.appNotification ? { background: PURPLE } : undefined}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${userData.appNotification ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        )}

        {/* 건강 기록 동의 — 아직 동의 전이면 알림 박스 밑에 필수·선택 체크를 노출 */}
        {!isEditing && !consentGiven && (
          <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: '#EDE9E2', background: '#FCFBF7' }}>
            <div className="text-[13px] font-black text-gray-900 mb-0.5">🔒 건강 기록 동의</div>
            <p className="text-[11px] text-gray-500 font-semibold mb-3 break-keep">기분·불편함·수면은 민감정보(건강정보)예요. 동의가 있어야 안전하게 기록·분석해 드려요.</p>
            <div className="flex flex-col gap-2">
              <ConsentRow checked={cReq} onToggle={() => setCReq(v => !v)} tag="필수">
                기분·통증·수면 등 건강정보를 <b>내 개인 리포트 제공</b> 목적으로 수집·이용하는 것에 동의합니다.
              </ConsentRow>
              <ConsentRow checked={cOpt} onToggle={() => setCOpt(v => !v)} tag="선택">
                <b>가명처리</b> 후 통계·연구·서비스 개선(B2B 포함)에 활용하는 것에 동의합니다.
                <span className="block mt-1 text-[11px] font-extrabold" style={{ color: GOLD }}>✨ 선택 동의를 해야 기록·발견의 분석을 모두 확인할 수 있어요.</span>
              </ConsentRow>
            </div>
            <button onClick={saveConsent} disabled={!cReq || cSaving}
              className="w-full mt-3 py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: cReq ? GOLD : '#E7E2D8', color: cReq ? '#fff' : '#B7B2A9', cursor: cReq && !cSaving ? 'pointer' : 'default' }}>
              {cSaving ? '저장 중…' : '동의하고 저장하기'}
            </button>
            <p className="text-[10px] text-gray-400 font-medium mt-2.5 leading-relaxed break-keep">동의는 마이페이지에서 관리할 수 있고, 저장·처리는 위탁·국외이전 고지에 따릅니다.</p>
          </div>
        )}
      </div>

      {/* 빠른 이동 타일 (이미지의 2×2 그리드 벤치마킹) */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        {tiles.map((tl) => (
          <button
            key={tl.label}
            onClick={tl.onClick}
            className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between text-left active:scale-[0.98] transition"
            style={{ boxShadow: '0 1px 3px rgba(220,188,86,0.14), 0 6px 16px rgba(233,203,110,0.20)' }}
          >
            <div className="min-w-0">
              <div className="text-[15px] font-black text-gray-900 leading-tight">{tl.label}</div>
              <div className="text-[11px] font-bold text-gray-400 mt-1 truncate">{tl.sub}</div>
            </div>
            <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ml-2 overflow-hidden" style={{ background: '#F4F0FC' }}>{tl.icon || tl.emoji}</span>
          </button>
        ))}
      </div>

      {/* 2. BMTI 히스토리 */}
      <SectionHeader emoji={<BookIcon className="w-[22px] h-[22px]" style={{ color: PURPLE }} />} title="BMTI 히스토리">
        <PillButton onClick={handleNewTest}>새로운 검사하기</PillButton>
      </SectionHeader>
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
                className={`min-w-[140px] md:min-w-[160px] bg-white border p-4 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden snap-start ${item.isCurrent ? 'border-[#C9975A]' : 'border-gray-200'}`}
                style={item.isCurrent ? { boxShadow: YELLOW_SHADOW } : { boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              >
                {item.isCurrent && <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: GOLD }}></div>}
                <div className="w-16 h-16 md:w-20 md:h-20 mb-3 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden">
                  {codeStr && getCharImage(codeStr) ? (
                    <img src={getCharImage(codeStr)} alt={shortCode} className="w-full h-full object-contain scale-110" />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </div>
                <h4 className="font-black text-gray-900 text-lg mb-1">{shortCode}</h4>
                {/* 확신의/유연한 축 분석 — 답변이 있는 현재 유형 카드에만 반영 */}
                {item.isCurrent && bmtiAnswers && (() => {
                  const percentages = calculateBMTIPercentages(bmtiAnswers);
                  return (
                    <div className="w-full flex flex-col gap-1 my-2 py-2 border-y border-gray-100">
                      {shortCode.split('').map((char, i) => {
                        const conf = percentages && percentages[char] !== undefined && percentages[char] >= 80;
                        return (
                          <div key={i} className="flex items-center justify-center gap-1.5 text-[11px] whitespace-nowrap">
                            <span className={`w-1.5 h-1.5 rounded-full ${conf ? 'bg-black' : 'bg-gray-300'}`}></span>
                            <span className="font-bold text-gray-500">{conf ? '확신의' : '유연한'}</span>
                            <span className="font-black text-gray-800">{char}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                <span className="text-[10px] text-gray-400 font-medium">{item.displayDate}</span>
              </div>
            );
          }) : (
            <div className="w-full text-center py-8 text-gray-400 text-sm font-medium">아직 BMTI 검사 내역이 없습니다.</div>
          );
        })()}
      </div>

      {/* 3. 일상 정보 — 온보딩에서 자동으로 채워지고, 여기서 한 달 2번까지 수정 가능 */}
      <SectionHeader emoji="📋" title="현재 일상 정보">
        <PillButton gold={isEditingExercise} disabled={savingExercise} onClick={() => { if (isEditingExercise) handleSaveMallangInfo(); else startEditMallang(); }}>
          {savingExercise ? '저장 중...' : isEditingExercise ? '저장하기' : '수정하기'}
        </PillButton>
      </SectionHeader>
      <div className="bg-white rounded-3xl p-5 md:p-7 border border-[#F3EFE6] mb-2" style={{ boxShadow: YELLOW_SHADOW }}>
        {isEditingExercise ? (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs font-bold">불편한 부위 (최대 2곳)</span>
                <button onClick={() => setSoreEdit([])}
                  className="text-[11px] py-1 px-2.5 rounded-full border font-bold transition-colors"
                  style={soreEdit.length === 0 ? chipOn : {}}>
                  <span className={soreEdit.length === 0 ? '' : 'text-gray-500'}>불편한 곳 없음</span>
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {SORE_PARTS.map((part) => {
                  const on = soreEdit.some(s => s.part === part);
                  const disabled = !on && soreEdit.length >= 2;
                  return (
                    <button key={part} onClick={() => toggleSorePart(part)} disabled={disabled}
                      className={`${chipCls} ${on ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'} ${disabled ? 'opacity-40' : ''}`}
                      style={on ? chipOn : undefined}>
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
                          className={`text-[11px] py-1 px-2 rounded-md border font-bold transition-colors ${whens.includes(w) ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                          style={whens.includes(w) ? chipOn : undefined}>
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
                    className={`text-xs py-1.5 px-2 rounded-lg border font-bold transition-colors text-center ${userData.exercise_frequency === id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                    style={userData.exercise_frequency === id ? chipOn : undefined}>
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
                      className={`text-xs py-1.5 px-2.5 rounded-lg border font-bold transition-colors ${on ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'} ${disabled ? 'opacity-40' : ''}`}
                      style={on ? chipOn : undefined}>
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
                    className={`text-xs py-1.5 px-2.5 rounded-lg border font-bold transition-colors flex flex-col items-start gap-0.5 ${posturePick === id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                    style={posturePick === id ? chipOn : undefined}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 불편한 부위 */}
            <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold mb-2">🩹 불편한 부위</div>
              <div className="text-base font-bold text-gray-800 break-keep">{soreSummary(userData.mallang_sore) || '아직 입력 전이에요'}</div>
            </div>
            {/* 운동 빈도 */}
            <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold mb-2">🏃 운동 빈도</div>
              <div className="text-base font-bold text-gray-800 break-keep">{EXERCISE_FREQ_LABELS[userData.exercise_frequency] || '아직 입력 전이에요'}</div>
            </div>
            {/* 운동 목적 */}
            <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold mb-2">🎯 운동 목적</div>
              <div className="text-base font-bold text-gray-800 break-keep">
                {(userData.exercise_goals && userData.exercise_goals.length > 0)
                  ? userData.exercise_goals.map((id) => EXERCISE_GOAL_LABELS[id] || id).join(', ')
                  : '아직 입력 전이에요'}
              </div>
            </div>
            {/* 자주 하는 자세 */}
            <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold mb-2">🪑 자주 하는 자세</div>
              <div className="text-base font-bold text-gray-800 break-keep">{POSTURE_LABELS[userData.common_posture] || userData.common_posture || '아직 입력 전이에요'}</div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm py-2">말랑 다이어리를 처음 시작할 때 물어보는 질문에 답하면 여기에 자동으로 채워져요.</p>
        )}
      </div>

      {/* 4. 일상 정보 히스토리 — 수정할 때마다 스냅샷을 BMTI 히스토리와 같은 박스로 남긴다 */}
      <SectionHeader emoji="🗂️" title="일상 정보 히스토리" />
      <div className="fade-in flex overflow-x-auto gap-3 md:gap-4 pb-4 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {mallangHistory.length > 0 ? (
          mallangHistory.map((item, idx) => {
            const goals = (item.exercise_goals || []).map(g => EXERCISE_GOAL_LABELS[g] || g).join(', ');
            const postureLabel = POSTURE_LABELS[item.common_posture] || item.common_posture;
            const HRow = ({ label, value }) => (
              <div className="flex gap-2 text-[11px] leading-snug">
                <span className="text-gray-400 font-bold w-[52px] shrink-0">{label}</span>
                <span className="text-gray-700 font-bold flex-1 break-keep">{value}</span>
              </div>
            );
            return (
              <div key={idx} className={`min-w-[220px] md:min-w-[240px] bg-white border p-4 rounded-2xl flex flex-col relative overflow-hidden snap-start ${idx === 0 ? 'border-[#C9975A]' : 'border-gray-200'}`}
                style={idx === 0 ? { boxShadow: YELLOW_SHADOW } : { boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {idx === 0 && <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: GOLD }}></div>}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-lg shrink-0">🩹</span>
                  <span className="text-[10px] text-gray-400 font-medium">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <HRow label="불편한 부위" value={soreSummary(item.sore) || '없음'} />
                  <HRow label="운동 빈도" value={EXERCISE_FREQ_LABELS[item.exercise_frequency] || '미입력'} />
                  <HRow label="운동 목적" value={goals || '미입력'} />
                  <HRow label="자주 하는 자세" value={postureLabel || '미입력'} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="w-full text-center py-8 text-gray-400 text-sm font-medium">아직 일상 정보가 없습니다.</div>
        )}
      </div>

      {/* 건강 기록 동의 — 이미 동의한 경우 일상 정보 히스토리 밑에 상태/선택 항목을 노출 */}
      {consentGiven && (
        <>
          <SectionHeader emoji="🔒" title="건강 기록 동의" />
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#F3EFE6] mb-2" style={{ boxShadow: YELLOW_SHADOW }}>
            <div className="flex flex-col gap-2">
              <ConsentRow checked disabled tag="필수">
                기분·통증·수면 등 건강정보를 <b>내 개인 리포트 제공</b> 목적으로 수집·이용에 동의함
                <span className="block mt-1 text-[11px] font-bold text-gray-400">· 동의 완료</span>
              </ConsentRow>
              <ConsentRow checked={cOpt} onToggle={() => updateOptional(!cOpt)} tag="선택">
                <b>가명처리</b> 후 통계·연구·서비스 개선(B2B 포함) 활용에 동의
                <span className="block mt-1 text-[11px] font-extrabold" style={{ color: GOLD }}>✨ 선택 동의 시 기록·발견의 분석을 모두 확인할 수 있어요.</span>
              </ConsentRow>
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-3 break-keep">선택 항목은 언제든 껐다 켤 수 있어요. 필수 동의 철회는 고객센터로 문의해 주세요.</p>
          </div>
        </>
      )}

      {showGallery && <TypeGallery onClose={() => setShowGallery(false)} />}
    </div>
  );
};

export default MyPageView;
