import { useState, useEffect } from 'react';
import { CHARACTERS, CHARACTER_NAMES } from '../data';
import { hasDiaryHistory, saveDiaryEntry, syncDiaryHistoryFromServer, todayISO } from '../lib/diaryHistory';
import DiaryCalendar from './DiaryCalendar';
import DiaryWriteFlow from './DiaryWriteFlow';

/**
 * BMTI 하루일기 허브 — 첫 방문자는 온보딩, 이미 기록해본 사람은 캘린더로 바로 진입.
 */
const ONBOARDED_KEY = 'bmti_diary_onboarded';

const AiChatHub = ({ bmtiCode, setView, userInfo, isLoggedIn, onRequireLogin, setUserProfile }) => {
  const [hasHistory, setHasHistory] = useState(() => hasDiaryHistory());
  // 온보딩을 한 번 마친 사람은(첫 기록이 없어도) 다시 온보딩을 보지 않고 바로 캘린더로 간다.
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === '1');
  const [showDiaryFlow, setShowDiaryFlow] = useState(false);
  const [pendingDayMood, setPendingDayMood] = useState(null);
  const [pendingEntry, setPendingEntry] = useState(null); // 수정하러 들어온 경우, 그날 기존 기록 전체
  const [editingDate, setEditingDate] = useState(null); // 캘린더에서 특정 날짜를 수정하러 들어온 경우 그 날짜
  const [syncTick, setSyncTick] = useState(0); // 서버 동기화가 끝나면 캘린더를 새로 읽도록 리마운트
  const [postStressMood, setPostStressMood] = useState(null); // 상세 기록 완료 후, 캘린더로 돌아가 띄울 말랑이 팝업 무드
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const charName = charData ? CHARACTER_NAMES[charData.id] : undefined;

  // 하루일기 진입 시 한 번, 다른 기기에서 기록해둔 내용을 서버에서 받아와 로컬 캐시에 반영한다.
  useEffect(() => {
    if (!userInfo?.id) return;
    syncDiaryHistoryFromServer().then(() => {
      setHasHistory(hasDiaryHistory());
      setSyncTick((t) => t + 1);
    });
  }, [userInfo?.id]);

  // 기록 저장 자체 (캘린더 전환 여부는 호출부마다 다르게 처리한다).
  // extra: sleep/overwork/exercise/soreness/note — 말랑이의 발견(월간 리포트)이 쓰는 상세 답변.
  const saveEntry = (mood, extra) => {
    saveDiaryEntry(editingDate || todayISO(), mood, extra);
    setHasHistory(true);
  };

  // DiaryWriteFlow의 onFinish — 저장 후 상세 폼을 닫고 캘린더로 돌아가, 그 위(블러 배경)에
  // 말랑이 완료 팝업을 띄운다. (기존엔 상세 폼 위 흰 배경에서 팝업이 떴음)
  const handleWriteFlowFinish = (mood, extra) => {
    saveEntry(mood, extra);
    setPostStressMood(mood);
    setShowDiaryFlow(false);
    setEditingDate(null);
    setPendingEntry(null);
  };

  // 캘린더의 '오늘 기분은...' 카드에서 무드를 고르면, 상세 기록(DiaryWriteFlow)으로 이어간다.
  const openDiaryFlow = (moodValue) => {
    setPendingDayMood(moodValue);
    setEditingDate(null);
    setShowDiaryFlow(true);
  };

  // 캘린더에서 '이전 기록을 수정할래요'를 고르면(또는 아직 기록 없는 날을 고르면) 들어온다 —
  // entry가 있으면 DiaryWriteFlow가 그 값으로 폼을 그때 답변 그대로 미리 채운다.
  const openDiaryFlowForEdit = (dateStr, entry) => {
    setPendingDayMood(entry?.mood ?? null);
    setPendingEntry(entry || null);
    setEditingDate(dateStr);
    setShowDiaryFlow(true);
  };

  if (showDiaryFlow) {
    return (
      <DiaryWriteFlow
        onClose={() => { setShowDiaryFlow(false); setEditingDate(null); setPendingEntry(null); }}
        onFinish={handleWriteFlowFinish}
        initialPhase="form"
        initialDayMood={pendingDayMood}
        initialEntry={pendingEntry}
        targetDate={editingDate || todayISO()}
        charImage={charData?.image}
        gender={userInfo?.kakaoGender || userInfo?.kakao_gender}
        mallangSore={userInfo?.mallang_sore}
        isLoggedIn={isLoggedIn}
        onRequireLogin={onRequireLogin}
      />
    );
  }

  // 온보딩 3페이지 제거 — 처음 들어온 사용자도 바로 월간 캘린더로.
  // (일상 정보(불편 부위·운동 습관·자세)는 마이페이지 '말랑 정보'에서 입력·수정)
  return <DiaryCalendar key={syncTick} onPickMood={openDiaryFlow} onEditDay={openDiaryFlowForEdit} bmtiCode={bmtiCode} isLoggedIn={isLoggedIn} onRequireLogin={onRequireLogin} initialStressMood={postStressMood} onStressShown={() => setPostStressMood(null)} userInfo={userInfo} setUserProfile={setUserProfile} gender={userInfo?.kakaoGender || userInfo?.kakao_gender} />;
};

export default AiChatHub;
