import { useState } from 'react';
import { CHARACTERS, CHARACTER_NAMES, DAY_MOODS } from '../data';
import DiaryWriteFlow from './DiaryWriteFlow';

/**
 * BMTI 일기장 허브 — 소개 페이지
 */
const AiChatHub = ({ bmtiCode, setView, userInfo, isLoggedIn, onRequireLogin }) => {
  const [showDiaryFlow, setShowDiaryFlow] = useState(false);
  const [pendingDayMood, setPendingDayMood] = useState(null);
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);

  const handlePickMood = (moodValue) => {
    if (!isLoggedIn) {
      alert('카카오톡 로그인이 필요해요.');
      if (onRequireLogin) onRequireLogin();
      return;
    }
    if (!bmtiCode) {
      alert('먼저 BMTI 설문을 완료해주세요.');
      setView('quiz');
      return;
    }
    setPendingDayMood(moodValue);
    setShowDiaryFlow(true);
  };

  if (showDiaryFlow) {
    return (
      <DiaryWriteFlow
        onClose={() => setShowDiaryFlow(false)}
        charName={charData ? CHARACTER_NAMES[charData.id] : undefined}
        initialPhase="work"
        initialDayMood={pendingDayMood}
      />
    );
  }

  return (
    <div className="min-h-screen pt-40 pb-32 px-4 md:px-6 max-w-2xl mx-auto fade-in">
      {/* 타이틀 영역 */}
      <div className="text-center mb-10">
        <h1 className="mb-3 leading-snug break-keep">
          <span className="block text-xl md:text-2xl font-black text-gray-900">
            {bmtiCode ? (
              <>
                <span className="text-pink-300">{userInfo?.nickname || '회원'}</span> 님,<br />
                이제 당신의{' '}
                <span className="bg-[#c0ff00]/70 px-1 rounded whitespace-nowrap">성향을 알았어요</span>
              </>
            ) : (
              <>
                <span className="text-pink-300">{userInfo?.nickname || '회원'}</span> 님,<br />
                아직 당신의{' '}
                <span className="bg-[#c0ff00]/70 px-1 rounded whitespace-nowrap">성향을 몰라요</span>
              </>
            )}
          </span>
          <span className="block text-sm md:text-base font-semibold text-gray-400 mt-1.5">
            근데 이건 시작일 뿐이에요.
          </span>
        </h1>
        <p className="text-gray-500 font-medium text-[15px] px-4 break-keep leading-relaxed">
          이제부터 매일 조금씩, 진짜 내 몸을 알아가요.
        </p>
      </div>

      {/* 상세 설명 */}
      <div className="px-2">
        {/* Chat Box */}
        <div className="space-y-3 mb-8 mx-auto max-w-sm">
          <div className="flex gap-2 items-start">
            <div className="relative w-10 h-10 flex-shrink-0 mt-1">
              {charData ? (
                <div className={`w-10 h-10 rounded-full ${charData.color || 'bg-gray-50'} flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden`}>
                  <img src={charData.image} alt="AI" className={`w-[85%] h-[85%] object-contain ${charData.imgClass || ''}`} />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-sm shadow-sm border border-blue-100">🤖</div>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <span className="text-[13px] font-bold text-gray-700 px-1">{charData ? CHARACTER_NAMES[charData.id] : '[유형명]'}</span>
              <div className="bg-white text-gray-800 border border-gray-100 text-[14px] px-4 py-3 rounded-2xl rounded-tl-sm shadow-[0_2px_10px_rgb(0,0,0,0.02)] leading-relaxed whitespace-pre-wrap">
                {`하루 10초면 충분해요.
매일 당신의 하루를 물어보고,
오래오래 기억해둘게요. 🧠`}
              </div>
              <div className="bg-white text-gray-800 border border-gray-100 text-[14px] px-4 py-3 rounded-2xl rounded-tl-sm shadow-[0_2px_10px_rgb(0,0,0,0.02)] leading-relaxed whitespace-pre-wrap">
                {`대신 저는 의사가 아니라,
진단은 못 해요.
많이 아플 땐 병원에 먼저 가주세요. 🏥`}
              </div>
              <div className="bg-white text-gray-800 border border-gray-100 text-[14px] px-4 py-3 rounded-2xl rounded-tl-sm shadow-[0_2px_10px_rgb(0,0,0,0.02)] leading-relaxed whitespace-pre-wrap">
                {`여기 남긴 이야기는
아무에게도 보이지 않아요.
오직 당신과 저만 아는 비밀이에요. 🔒`}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-2">
            <h3 className="text-base font-black text-gray-900 mb-1">오늘 하루 어떠셨어요?</h3>
            <p className="text-gray-400 text-xs mb-4">지금 마음에 가장 가까운 표정을 골라주세요.</p>
            <div className="grid grid-cols-5 gap-1">
              {DAY_MOODS.map(m => (
                <button
                  key={m.v}
                  onClick={() => handlePickMood(m.v)}
                  className="flex items-center justify-center py-1 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <img src={m.image} alt={m.label} className="w-full max-w-[64px] object-contain" />
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-5">
          {/* 일기장 컨셉 1 */}
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-900 text-[15px] mb-4 flex items-center gap-2">
              <span className="text-xl">✍️</span> 나만의 캐릭터와 일상 공유
            </h4>
            <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl">
              <div className="flex flex-col items-end">
                <div className="bg-black text-white text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%]">
                  요즘 자꾸 늘어지네.. 일기 쓰기도 귀찮아 ㅠ
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div className="relative w-7 h-7 flex-shrink-0">
                  {charData ? (
                    <img src={charData.image} alt="AI" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-sm shadow-sm border border-blue-100">🤖</div>
                  )}
                </div>
                <div className="bg-white text-gray-800 border border-gray-100 text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%] leading-relaxed">
                  나를 대변하는 BMTI 캐릭터와 함께 일기를 쓰고, <strong className="text-blue-600">내 성향에 꼭 맞는 따뜻한 답장</strong>을 실시간으로 받아보세요.
                </div>
              </div>
            </div>
          </div>

          {/* 일기장 컨셉 2 */}
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-900 text-[15px] mb-4 flex items-center gap-2">
              <span className="text-xl">💌</span> 매일매일 남기는 나의 기록
            </h4>
            <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl">
              <div className="flex flex-col items-end">
                <div className="bg-black text-white text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%]">
                  오늘 드디어 목표 달성했어! 너무 뿌듯해!
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div className="relative w-7 h-7 flex-shrink-0">
                  {charData ? (
                    <img src={charData.image} alt="AI" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-sm shadow-sm border border-amber-100">🤖</div>
                  )}
                </div>
                <div className="bg-white border border-gray-100 text-gray-800 text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%] leading-relaxed">
                  사소한 성취부터 오늘 하루의 감정까지! <strong className="text-amber-600">일기로 남기면 캐릭터가 특별한 피드백을 보내줍니다.</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AiChatHub;
