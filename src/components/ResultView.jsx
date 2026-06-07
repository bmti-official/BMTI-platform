import { useState } from 'react';

const KakaoIcon = ({ className = "w-3.5 h-3.5 fill-current" }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
  </svg>
);

const ResultView = ({ setView, quizCompleted, setQuizCompleted, isLoggedIn, setIsLoggedIn, bmtiCode }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!quizCompleted) {
    return (
      <div className="min-h-screen pt-32 md:pt-40 pb-20 px-6 flex flex-col items-center justify-center text-center fade-in">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-200">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">아직 분석 결과가 없습니다</h2>
        <p className="text-gray-500 mb-8 max-w-sm break-keep leading-relaxed">
          BMTI 설문을 완료하고 나에게 딱 맞는 움직임 성향을 확인 후 주변 친구들과 소통하세요!
        </p>
        <button
          id="start-quiz-from-result"
          onClick={() => setView('quiz')}
          className="bg-black text-white px-8 py-3.5 rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-black/10"
        >
          설문 시작하기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 md:pt-24 pb-32 px-6 max-w-2xl mx-auto fade-in">
      <div className="text-center mb-10">
        <p className="text-gray-500 mb-2 font-medium tracking-widest text-sm">ANALYSIS COMPLETE</p>
        <h2 className="text-3xl md:text-4xl font-serif font-bold">당신의 BMTI 유형은</h2>
      </div>

      {/* Brief Character Card */}
      <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 md:p-12 shadow-xl relative overflow-hidden mb-8">

        {/* Top-Left CTAs based on login state */}
        {quizCompleted && (
          <div className="absolute top-6 left-6 md:top-8 md:left-8 flex flex-col gap-2 z-20 fade-in">
            {!isLoggedIn ? (
              <button
                id="kakao-login-result"
                onClick={() => setIsLoggedIn(true)}
                className="bg-[#FEE500] text-black px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold shadow-sm hover:bg-[#F4DC00] hover:-translate-y-0.5 transition-transform flex items-center gap-1.5 w-fit"
              >
                <KakaoIcon className="w-3.5 h-3.5 fill-current" />
                카카오톡 간편 로그인 하여 친구에게 공유하기
              </button>
            ) : (
              <>
                <button
                  id="kakao-share"
                  onClick={() => alert('카카오톡 공유가 완료되었습니다.')}
                  className="bg-[#FEE500] text-black px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold shadow-sm hover:bg-[#F4DC00] hover:-translate-y-0.5 transition-transform flex items-center gap-1.5 w-fit"
                >
                  <KakaoIcon className="w-3.5 h-3.5 fill-current" />
                  카카오톡 공유
                </button>
                <button
                  id="retake-quiz-card"
                  onClick={() => setShowConfirm(true)}
                  className="bg-white text-black border border-gray-200 px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold shadow-sm hover:bg-gray-50 hover:-translate-y-0.5 transition-transform flex items-center gap-1.5 w-fit"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  다시 검사하기
                </button>
                <button
                  id="go-board-card"
                  onClick={() => setView('board')}
                  className="bg-black text-white px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold shadow-sm hover:bg-gray-800 hover:-translate-y-0.5 transition-transform flex items-center gap-1.5 w-fit"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                  </svg>
                  <span className="text-left leading-tight">나와 같은<br />BMTI와 소통하기</span>
                </button>
              </>
            )}
          </div>
        )}

        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c0ff00]/10 rounded-bl-full -z-10"></div>

        <div className={`flex flex-col items-center text-center ${quizCompleted ? 'mt-28 md:mt-16' : ''}`}>
          {/* Character Image (Abstract Concept) */}
          <div className="w-48 h-48 bg-gray-50 rounded-full flex items-center justify-center relative border border-gray-200 overflow-hidden mb-8 shadow-inner">
            <div className="w-32 h-32 bg-black rounded-[40%] animate-spin-slow absolute"></div>
            <div className="w-24 h-24 bg-[#c0ff00] rounded-full absolute mix-blend-multiply opacity-90"></div>
          </div>

          {/* Catchphrase & Name */}
          <p className="text-[#9BB31B] font-bold text-lg md:text-xl mb-2">당신의 분석 코드</p>
          <h3 className="text-4xl md:text-5xl font-black mb-8 tracking-tight text-gray-900">
            {bmtiCode || '분석 중...'}
          </h3>

          {/* 5-Line Description */}
          <p className="text-gray-600 leading-relaxed text-base md:text-lg mb-10 break-keep w-full max-w-md mx-auto">
            기본적인 골격이 크고 근육량이 많아 조금만 운동해도 효과가 빠르게 나타나는 축복받은 체형입니다.<br />
            하지만 에너지 흡수율도 높아 방심하면 체중이 쉽게 증가할 수 있습니다.<br />
            무산소 운동보다는 꾸준한 유산소와 유연성 위주의 스트레칭을 병행했을 때,<br />
            가장 완벽한 밸런스와 건강한 라이프스타일을 만들어낼 수 있습니다.<br />
            당신의 숨겨진 잠재력을 끌어올려줄 디테일한 맞춤 솔루션을 확인해보세요.
          </p>

          {/* Chemistry section */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
              <p className="text-xs text-gray-400 mb-2 font-semibold tracking-wider">환상의 짝꿍 BMTI</p>
              <p className="font-bold text-gray-800 text-lg">날쌘돌이 표범형 🐆</p>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
              <p className="text-xs text-gray-400 mb-2 font-semibold tracking-wider">조금 다른 템포 BMTI</p>
              <p className="font-bold text-gray-800 text-lg">느긋한 나무늘보형 🦥</p>
            </div>
          </div>
        </div>
      </div>

      {!isLoggedIn ? (
        /* Detailed Result Locked CTA */
        <div className="bg-[#fcfcfc] border border-gray-200 rounded-[2rem] p-8 md:p-10 text-center shadow-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h4 className="text-2xl font-bold mb-3 text-gray-900">전체 결과지가 궁금하신가요?</h4>
          <p className="text-gray-500 text-sm md:text-base mb-8 break-keep">
            움직임 성향을 보다 자세하게 확인 후 주변 친구들과 소통하세요!
          </p>

          <button
            id="kakao-login-unlock"
            onClick={() => setIsLoggedIn(true)}
            className="bg-[#FEE500] text-[#000000] text-base md:text-lg font-semibold px-8 py-4 rounded-full shadow hover:bg-[#F4DC00] transition-all duration-300 w-full flex items-center justify-center gap-3"
          >
            <KakaoIcon className="w-6 h-6 fill-current" />
            카카오톡으로 간편 로그인/회원가입
          </button>
        </div>
      ) : (
        /* Full Result Rendered when logged in */
        <div className="fade-in bg-white border border-gray-200 rounded-[2rem] p-8 md:p-10 shadow-sm">
          <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mx-auto mb-5 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <h4 className="text-2xl font-bold mb-8 text-center text-gray-900 border-b border-gray-100 pb-6">상세 분석 리포트</h4>
          <div className="space-y-6 text-gray-700 leading-relaxed break-keep text-left">
            <div>
              <h5 className="font-bold text-black mb-2 text-lg">🏃‍♀️ 추천 운동</h5>
              <p className="bg-gray-50 p-4 rounded-xl border border-gray-100">가벼운 조깅, 실내 자전거, 필라테스. 규칙적인 유산소 운동이 에너지 대사를 높여줍니다.</p>
            </div>
            <div>
              <h5 className="font-bold text-black mb-2 text-lg">⚠️ 피해야 할 운동</h5>
              <p className="bg-gray-50 p-4 rounded-xl border border-gray-100">고중량 스쿼트 및 데드리프트. 관절에 무리가 갈 수 있는 폭발적인 무산소 운동은 피하는 것이 좋습니다.</p>
            </div>
            <div>
              <h5 className="font-bold text-black mb-2 text-lg">🥗 맞춤 식단 가이드</h5>
              <p className="bg-gray-50 p-4 rounded-xl border border-gray-100">탄수화물 흡수율이 높은 편입니다. 정제 탄수화물보다는 현미, 고구마 등 복합 탄수화물 위주로 섭취하고 양질의 단백질 비중을 높여주세요.</p>
            </div>
            <div>
              <h5 className="font-bold text-black mb-2 text-lg">💡 데일리 라이프스타일 팁</h5>
              <p className="bg-gray-50 p-4 rounded-xl border border-gray-100">하체 부종이 쉽게 생길 수 있으니, 매일 취침 전 10분 하체 스트레칭과 L자 다리 운동을 루틴으로 만들어보세요.</p>
            </div>
          </div>
        </div>
      )}

      {/* Logged in Bottom CTAs */}
      {isLoggedIn && quizCompleted && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3 fade-in">
          <button
            id="kakao-share-bottom"
            onClick={() => alert('카카오톡 공유가 완료되었습니다.')}
            className="flex-1 bg-[#FEE500] text-black px-4 py-4 rounded-2xl text-sm font-bold shadow-sm hover:bg-[#F4DC00] hover:-translate-y-1 transition-transform flex items-center justify-center gap-2"
          >
            <KakaoIcon className="w-5 h-5 fill-current" />
            카카오톡 공유
          </button>
          <button
            id="retake-quiz-bottom"
            onClick={() => setShowConfirm(true)}
            className="flex-1 bg-white text-black border border-gray-200 px-4 py-4 rounded-2xl text-sm font-bold shadow-sm hover:bg-gray-50 hover:-translate-y-1 transition-transform flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            다시 검사하기
          </button>
          <button
            id="go-board-bottom"
            onClick={() => setView('board')}
            className="flex-1 bg-black text-white px-4 py-4 rounded-2xl text-sm font-bold shadow-sm hover:bg-gray-800 hover:-translate-y-1 transition-transform flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
            </svg>
            <span className="text-left leading-tight">나와 같은<br />BMTI와 소통하기</span>
          </button>
        </div>
      )}

      {/* Retake Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">정말 다시 검사하시겠습니까?</h3>
            <p className="text-gray-500 mb-8 text-sm">이전 결과지는 사라집니다.</p>
            <div className="flex gap-3 justify-center">
              <button
                id="confirm-retake-yes"
                onClick={() => {
                  setShowConfirm(false);
                  setQuizCompleted(false);
                  setView('quiz');
                }}
                className="flex-1 bg-white text-black border border-gray-200 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                예
              </button>
              <button
                id="confirm-retake-no"
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-colors"
              >
                아니요
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultView;
