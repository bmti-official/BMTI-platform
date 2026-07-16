import { useState, useEffect } from 'react';
import { CHARACTERS, CHARACTER_NAMES } from '../data';
import { hasDiaryHistory, saveDiaryEntry, syncDiaryHistoryFromServer, todayISO } from '../lib/diaryHistory';
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
  const [pendingEntry, setPendingEntry] = useState(null); // 수정하러 들어온 경우, 그날 기존 기록 전체
  const [editingDate, setEditingDate] = useState(null); // 캘린더에서 특정 날짜를 수정하러 들어온 경우 그 날짜
  const [syncTick, setSyncTick] = useState(0); // 서버 동기화가 끝나면 캘린더를 새로 읽도록 리마운트
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

  // DiaryWriteFlow의 onFinish — 저장만 하고, 화면 전환은 3초짜리 완료 팝업이 끝난 뒤
  // DiaryWriteFlow가 부르는 onClose에 맡긴다(여기서 바로 닫아버리면 팝업이 뜰 새도 없이 사라짐).
  const handleWriteFlowFinish = (mood, extra) => {
    saveEntry(mood, extra);
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
      />
    );
  }

  if (hasHistory) {
    return <DiaryCalendar key={syncTick} onPickMood={openDiaryFlow} onEditDay={openDiaryFlowForEdit} bmtiCode={bmtiCode} />;
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
