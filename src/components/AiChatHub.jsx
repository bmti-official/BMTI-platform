import { useState } from 'react';
import { CHARACTERS, CHARACTER_NAMES } from '../data';
import { hasDiaryHistory, saveDiaryEntry, todayISO } from '../lib/diaryHistory';
import DiaryOnboarding from './DiaryOnboarding';
import DiaryCalendar from './DiaryCalendar';
import DiaryWriteFlow from './DiaryWriteFlow';

/**
 * BMTI 하루일기 허브 — 첫 방문자는 온보딩, 이미 기록해본 사람은 캘린더로 바로 진입.
 */
const AiChatHub = ({ bmtiCode, setView, userInfo, isLoggedIn, onRequireLogin }) => {
  const [hasHistory, setHasHistory] = useState(() => hasDiaryHistory());
  const [showDiaryFlow, setShowDiaryFlow] = useState(false);
  const [pendingDayMood, setPendingDayMood] = useState(null);
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const charName = charData ? CHARACTER_NAMES[charData.id] : undefined;

  // 온보딩(첫 기록)이나 캘린더의 무드 선택 결과를 실제로 저장하고 캘린더로 넘어간다.
  const handleEntryFinished = (mood) => {
    saveDiaryEntry(todayISO(), mood);
    setHasHistory(true);
    setShowDiaryFlow(false);
  };

  // 캘린더의 '오늘 기분은...' 카드에서 무드를 고르면, 상세 기록(DiaryWriteFlow)으로 이어간다.
  const openDiaryFlow = (moodValue) => {
    setPendingDayMood(moodValue);
    setShowDiaryFlow(true);
  };

  if (showDiaryFlow) {
    return (
      <DiaryWriteFlow
        onClose={() => setShowDiaryFlow(false)}
        onFinish={handleEntryFinished}
        charName={charName}
        initialPhase="form"
        initialDayMood={pendingDayMood}
      />
    );
  }

  if (hasHistory) {
    return <DiaryCalendar onPickMood={openDiaryFlow} />;
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
      onComplete={handleEntryFinished}
    />
  );
};

export default AiChatHub;
