import { useState } from 'react';
import { CHARACTERS, CHARACTER_NAMES } from '../data';
import { hasDiaryHistory, saveDiaryEntry, todayISO } from '../lib/diaryHistory';
import DiaryOnboarding from './DiaryOnboarding';
import DiaryCalendar from './DiaryCalendar';
import DiaryWriteFlow from './DiaryWriteFlow';

/**
 * BMTI 하루일기 허브 — 첫 방문자는 온보딩, 이미 기록해본 사람은 캘린더로 바로 진입.
 */
const AiChatHub = ({ bmtiCode, setView, userInfo, isLoggedIn, onRequireLogin, setUserProfile }) => {
  const [hasHistory, setHasHistory] = useState(() => hasDiaryHistory());
  const [showDiaryFlow, setShowDiaryFlow] = useState(false);
  const [pendingDayMood, setPendingDayMood] = useState(null);
  const [editingDate, setEditingDate] = useState(null); // 캘린더에서 특정 날짜를 수정하러 들어온 경우 그 날짜
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const charName = charData ? CHARACTER_NAMES[charData.id] : undefined;

  // 기록 저장 자체 (캘린더 전환 여부는 호출부마다 다르게 처리한다).
  const saveEntry = (mood) => {
    saveDiaryEntry(editingDate || todayISO(), mood);
    setHasHistory(true);
  };

  // DiaryWriteFlow의 onFinish — 저장만 하고, 화면 전환은 3초짜리 완료 팝업이 끝난 뒤
  // DiaryWriteFlow가 부르는 onClose에 맡긴다(여기서 바로 닫아버리면 팝업이 뜰 새도 없이 사라짐).
  const handleWriteFlowFinish = (mood) => {
    saveEntry(mood);
  };

  // 온보딩의 onComplete — 온보딩 자체에 완료 화면이 있으니 저장 즉시 캘린더로 전환한다.
  const handleOnboardingComplete = (mood) => {
    saveEntry(mood);
    setShowDiaryFlow(false);
    setEditingDate(null);
  };

  // 캘린더의 '오늘 기분은...' 카드에서 무드를 고르면, 상세 기록(DiaryWriteFlow)으로 이어간다.
  const openDiaryFlow = (moodValue) => {
    setPendingDayMood(moodValue);
    setEditingDate(null);
    setShowDiaryFlow(true);
  };

  // 캘린더에서 이미 기록해둔 날짜의 말랑이를 다시 누르면 그날 기록을 고칠 수 있게 연다.
  const openDiaryFlowForEdit = (dateStr, moodValue) => {
    setPendingDayMood(moodValue);
    setEditingDate(dateStr);
    setShowDiaryFlow(true);
  };

  if (showDiaryFlow) {
    return (
      <DiaryWriteFlow
        onClose={() => { setShowDiaryFlow(false); setEditingDate(null); }}
        onFinish={handleWriteFlowFinish}
        initialPhase="form"
        initialDayMood={pendingDayMood}
        targetDate={editingDate || todayISO()}
      />
    );
  }

  if (hasHistory) {
    return <DiaryCalendar onPickMood={openDiaryFlow} onEditDay={openDiaryFlowForEdit} />;
  }

  return (
    <DiaryOnboarding
      nickname={userInfo?.nickname || '회원'}
      bmtiCode={bmtiCode}
      charImage={charData?.image}
      charName={charName}
      isLoggedIn={isLoggedIn}
      onRequireLogin={onRequireLogin}
      setView={setView}
      onComplete={handleOnboardingComplete}
      userId={userInfo?.id}
      setUserProfile={setUserProfile}
    />
  );
};

export default AiChatHub;
