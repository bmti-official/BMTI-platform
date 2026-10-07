import { useState, useEffect } from 'react';
import { badNameReason, badNameMessage } from '../lib/nameFilter';
import { CHARACTERS, calculateBMTIPercentages, isReservedNickname } from '../data';
import { supabase } from '../lib/supabaseClient';
import MallangInfoPopup from './MallangInfoPopup';
import { canRetakeTest, archiveBeforeRetake } from '../lib/bmtiSystem';
import TypeGallery from './TypeGallery';
import { Mallang } from './Mallang';
import { hasLocalHealthConsent, setLocalHealthConsent, updateHealthRecordConsent, hasOptionalHealthConsent, withdrawHealthConsent, deleteMyAccount, CONSENT_ITEMS, CONSENT_WITHDRAW_NOTE } from '../lib/healthConsentSystem';

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
  POSTURE_LABELS, SINCE_LABELS,
  FREQ_LABELS as EXERCISE_FREQ_LABELS, GOAL_LABELS as EXERCISE_GOAL_LABELS,
  soreSummary,
  editsThisMonth,
  getGuestMallangHistory, readMallangProfile,
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
  const [sheetOpen, setSheetOpen] = useState(false);   // 건강 정보 한 장 창
  const [sheetVer, setSheetVer] = useState(0);         // 저장할 때마다 올려 히스토리를 다시 읽는다
  const [mallangHistory, setMallangHistory] = useState([]); // 일상 정보 스냅샷 박스
  const [showGallery, setShowGallery] = useState(false); // '다른 유형 구경' 갤러리

  // 건강 기록 동의(필수·선택) — 다이어리 첫 진입 게이트와 동일 항목을 마이페이지에서도 관리
  const [consentGiven, setConsentGiven] = useState(hasLocalHealthConsent());
  const [cReq, setCReq] = useState(hasLocalHealthConsent());
  const [cOpt, setCOpt] = useState(hasOptionalHealthConsent());
  const [cSaving, setCSaving] = useState(false);

  const saveConsent = async () => {
    if (!cReq || cSaving) return;
    setCSaving(true);
    if (userData?.id) { try { await updateHealthRecordConsent(userData.id, true, cOpt); } catch (e) { console.error('건강정보 동의 저장 실패', e); } }
    setLocalHealthConsent(cOpt);
    setCSaving(false);
    setConsentGiven(true);
  };
  // 필수 동의 철회 — 다이어리 기록과 각도기록이 지워진다(개인정보처리방침 제4-1조)
  const [busyLeave, setBusyLeave] = useState(false);
  const withdraw = async () => {
    if (busyLeave) return;
    if (!window.confirm('건강 기록 동의를 철회할까요?\n\n철회하면 지금까지의 다이어리 기록과 각도기록이 모두 지워지고, 되살릴 수 없어요.\n다시 기록하려면 동의를 새로 해 주셔야 해요.')) return;
    setBusyLeave(true);
    const r = await withdrawHealthConsent();
    setBusyLeave(false);
    if (!r.ok) { window.alert(r.why); return; }
    setConsentGiven(false); setCReq(false); setCOpt(false);
    window.alert('동의를 철회했어요. 다이어리 기록과 각도기록을 지웠어요.');
  };
  // 회원 탈퇴 — 회원 정보와 모든 기록을 지우고 로그아웃한다
  const leave = async () => {
    if (busyLeave) return;
    if (!window.confirm('회원 탈퇴를 할까요?\n\n회원 정보, BMTI 검사 결과, 다이어리·각도기록, 보관함·마이플리, 알림 설정이 모두 지워지고 되살릴 수 없어요.')) return;
    if (!window.confirm('정말 탈퇴할까요? 이 선택은 되돌릴 수 없어요.')) return;
    setBusyLeave(true);
    const r = await deleteMyAccount();
    setBusyLeave(false);
    if (!r.ok) { window.alert(r.why); return; }
    window.alert('탈퇴했어요. 그동안 BMTI와 함께해 주셔서 고마워요.');
    if (onLogout) onLogout();
  };

  // 이미 동의한 상태에서 선택 항목만 켜고 끈다
  const updateOptional = async (opt) => {
    setCOpt(opt);
    if (userData?.id) { try { await updateHealthRecordConsent(userData.id, true, opt); } catch (e) { console.error('선택 동의 변경 실패', e); } }
    setLocalHealthConsent(opt);
  };

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
          // 욕설·성적인 말·정치적인 말·혐오 표현·운영자 사칭은 닉네임으로 쓰지 못한다
          const bad = badNameReason(userData.nickname);
          if (bad) { alert(badNameMessage(bad)); return; }
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
  }, [userData?.id, sheetVer]);

  const handleNewTest = async () => {
    const { canRetake, message, isLastForMonth } = await canRetakeTest(userData);
    if (!canRetake) { alert(message); return; }
    const confirmText = isLastForMonth
      ? `⚠️ ${message}\n\n그래도 새로운 검사를 진행하시겠습니까?`
      : '정말 새로운 검사를 진행하시겠습니까?';
    if (window.confirm(confirmText)) {
      if (userData?.id && bmtiCode) {
        await archiveBeforeRetake(userData.id, bmtiCode);
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
              <img src={charInfo.image} alt={axisCode} className="w-full h-full object-contain" />
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
            <p className="text-[11px] text-gray-500 font-semibold mb-3 break-keep">기분·통증·수면, 몸 상태 태그, 각도기록은 민감정보(건강정보)예요. 동의가 있어야 안전하게 기록·분석해 드려요.</p>
            <div className="flex flex-col gap-2">
              <ConsentRow checked={cReq} onToggle={() => setCReq(v => !v)} tag="필수">
                {CONSENT_ITEMS} 등 건강정보를 <b>내 개인 리포트 제공</b> 목적으로 수집·이용하는 것에 동의합니다.
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
            <p className="text-[10px] text-gray-400 font-medium mt-2.5 leading-relaxed break-keep">{CONSENT_WITHDRAW_NOTE} 저장·처리는 개인정보처리방침의 위탁·국외이전 고지에 따릅니다.</p>
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
                    <img src={getCharImage(codeStr)} alt={shortCode} className="w-full h-full object-contain" />
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

      {/* 3. 건강 정보 한 장 — 예전의 '현재 일상 정보'. 한 번 적어 두면 추천과 강사 연결에 쓰인다.
          고치는 일은 창(MallangInfoPopup, mode 'all')이 맡는다 — 둘러보기와 같은 창이라 한 곳에만 저장된다. */}
      <SectionHeader emoji="📋" title="건강 정보 한 장">
        <PillButton onClick={() => setSheetOpen(true)}>
          {(userData.mallang_sore?.length || userData.exercise_frequency || (userData.exercise_goals && userData.exercise_goals.length > 0) || userData.common_posture) ? '수정하기' : '적어 두기'}
        </PillButton>
      </SectionHeader>
      <div className="bg-white rounded-3xl p-5 md:p-7 border border-[#F3EFE6] mb-2" style={{ boxShadow: YELLOW_SHADOW }}>
        {(userData.mallang_sore?.length || userData.exercise_frequency || (userData.exercise_goals && userData.exercise_goals.length > 0) || userData.common_posture) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 불편한 부위 */}
            <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold mb-2">🩹 불편한 부위</div>
              <div className="text-base font-bold text-gray-800 break-keep">{soreSummary(userData.mallang_sore) || '불편한 곳 없음'}</div>
              {userData.mallang_sore?.length > 0 && SINCE_LABELS[userData.sore_since] && (
                <div className="text-xs font-bold text-gray-400 mt-1">{SINCE_LABELS[userData.sore_since]} 됐어요</div>
              )}
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
          <p className="text-center text-gray-400 text-sm py-2 break-keep">불편한 곳과 평소 생활을 한 번만 적어 두면, 내 몸에 맞는 것부터 보여 드려요. 1~2분이면 끝나요.</p>
        )}
        {mallangHistory.length > 0 && <p className="text-[11px] text-gray-400 font-medium mt-3">이번 달 수정 {editsThisMonth(mallangHistory)}회</p>}
      </div>
      {sheetOpen && (
        <MallangInfoPopup mode="all" userInfo={userData?.id ? userData : null} isLoggedIn={!!userData?.id}
          gender={userData.kakaoGender || userData.kakao_gender} setUserProfile={setUserData}
          onClose={() => setSheetOpen(false)}
          onSaved={() => {
            // 게스트는 이 기기에 저장되므로, 화면에 보이는 값도 거기서 다시 읽는다
            if (!userData?.id) {
              const g = readMallangProfile(null);
              setUserData((prev) => ({ ...prev, mallang_sore: g.sore || [], exercise_frequency: g.exercise_frequency, exercise_goals: g.exercise_goals, common_posture: g.common_posture, sore_since: g.sore_since }));
            }
            setSheetVer((v) => v + 1);
          }} />
      )}

      {/* 4. 건강 정보 히스토리 — 수정할 때마다 스냅샷을 BMTI 히스토리와 같은 박스로 남긴다 */}
      <SectionHeader emoji="🗂️" title="건강 정보 히스토리" />
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
                  <HRow label="불편한 부위" value={(soreSummary(item.sore) || '없음') + (SINCE_LABELS[item.sore_since] ? ` · ${SINCE_LABELS[item.sore_since]}` : '')} />
                  <HRow label="운동 빈도" value={EXERCISE_FREQ_LABELS[item.exercise_frequency] || '미입력'} />
                  <HRow label="운동 목적" value={goals || '미입력'} />
                  <HRow label="자주 하는 자세" value={postureLabel || '미입력'} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="w-full text-center py-8 text-gray-400 text-sm font-medium">아직 적어 둔 건강 정보가 없습니다.</div>
        )}
      </div>

      {/* 건강 기록 동의 — 이미 동의한 경우 일상 정보 히스토리 밑에 상태/선택 항목을 노출 */}
      {consentGiven && (
        <>
          <SectionHeader emoji="🔒" title="건강 기록 동의" />
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#F3EFE6] mb-2" style={{ boxShadow: YELLOW_SHADOW }}>
            <div className="flex flex-col gap-2">
              <ConsentRow checked disabled tag="필수">
                {CONSENT_ITEMS} 등 건강정보를 <b>내 개인 리포트 제공</b> 목적으로 수집·이용에 동의함
                <span className="block mt-1 text-[11px] font-bold text-gray-400">· 동의 완료</span>
              </ConsentRow>
              <ConsentRow checked={cOpt} onToggle={() => updateOptional(!cOpt)} tag="선택">
                <b>가명처리</b> 후 통계·연구·서비스 개선(B2B 포함) 활용에 동의
                <span className="block mt-1 text-[11px] font-extrabold" style={{ color: GOLD }}>✨ 선택 동의 시 기록·발견의 분석을 모두 확인할 수 있어요.</span>
              </ConsentRow>
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-3 break-keep">선택 항목은 언제든 껐다 켤 수 있어요. 필수 동의를 철회하면 다이어리 기록과 각도기록이 지워져요.</p>
            <button type="button" onClick={withdraw} disabled={busyLeave}
              className="mt-3 text-[12px] font-extrabold underline underline-offset-2" style={{ color: '#B23B36' }}>
              {busyLeave ? '처리 중…' : '필수 동의 철회하기'}
            </button>
          </div>
        </>
      )}

      {/* 회원 탈퇴 — 맨 아래에 작게 */}
      <div className="text-center mt-8 mb-4">
        <button type="button" onClick={leave} disabled={busyLeave}
          className="text-[11.5px] font-bold text-gray-400 underline underline-offset-2">
          {busyLeave ? '처리 중…' : '회원 탈퇴'}
        </button>
      </div>

      {showGallery && <TypeGallery onClose={() => setShowGallery(false)} />}
    </div>
  );
};

export default MyPageView;
