import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { CHARACTERS } from '../data';

const KakaoIcon = ({ className = "w-3.5 h-3.5 fill-current" }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
  </svg>
);

const getKoreanName = (code) => {
  if (!code) return '';
  const map = {
    'A': '애', 'O': '오', 'C': '씨', 'L': '엘',
    'D': '디', 'Q': '큐', 'M': '엠', 'Z': '지'
  };
  return code.split('').map(char => map[char] || char).join('');
};

// BMTI 유형별 정보
const BMTI_INFO = {
  'ACDM': { kr: '활동적 집중 실전 공감형', catchphrase: '몸으로 먼저 느끼고,\n마음으로 함께 움직이는 사람', bestMatch: 'OLQZ', diffTempo: 'OLQM', color: '#FF6B6B', bgGradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' },
  'ACDZ': { kr: '활동적 집중 실전 팩트형', catchphrase: '결과로 말하는\n실전 파워 무버', bestMatch: 'OLQM', diffTempo: 'OLQZ', color: '#4ECDC4', bgGradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)' },
  'ACQM': { kr: '활동적 집중 탐구 공감형', catchphrase: '이론과 감성 사이에서\n최적의 균형을 찾는 사람', bestMatch: 'OLDZ', diffTempo: 'OLDM', color: '#A78BFA', bgGradient: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)' },
  'ACQZ': { kr: '활동적 집중 탐구 팩트형', catchphrase: '데이터로 파고드는\n분석형 액티비스트', bestMatch: 'OLDM', diffTempo: 'OLDZ', color: '#60A5FA', bgGradient: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)' },
  'ALDM': { kr: '활동적 전신 실전 공감형', catchphrase: '전신으로 느끼며\n사람과 함께 성장하는 무버', bestMatch: 'OCQZ', diffTempo: 'OCQM', color: '#F472B6', bgGradient: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)' },
  'ALDZ': { kr: '활동적 전신 실전 팩트형', catchphrase: '거침없는 실행력으로\n몸 전체를 깨우는 사람', bestMatch: 'OCQM', diffTempo: 'OCQZ', color: '#34D399', bgGradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' },
  'ALQM': { kr: '활동적 전신 탐구 공감형', catchphrase: '호기심과 따뜻함이\n공존하는 밸런스 탐험가', bestMatch: 'OCDZ', diffTempo: 'OCDM', color: '#FBBF24', bgGradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' },
  'ALQZ': { kr: '활동적 전신 탐구 팩트형', catchphrase: '과학적 근거 위에\n움직임을 설계하는 전략가', bestMatch: 'OCDM', diffTempo: 'OCDZ', color: '#818CF8', bgGradient: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)' },
  'OCDM': { kr: '안정적 집중 실전 공감형', catchphrase: '조용하지만 깊게,\n마음까지 챙기는 꼼꼼 무버', bestMatch: 'ALQZ', diffTempo: 'ALQM', color: '#FB923C', bgGradient: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)' },
  'OCDZ': { kr: '안정적 집중 실전 팩트형', catchphrase: '묵묵히 집중하며\n효율을 극대화하는 장인', bestMatch: 'ALQM', diffTempo: 'ALQZ', color: '#2DD4BF', bgGradient: 'linear-gradient(135deg, #2DD4BF 0%, #14B8A6 100%)' },
  'OCQM': { kr: '안정적 집중 탐구 공감형', catchphrase: '깊이 있는 탐구와\n따뜻한 소통의 조화', bestMatch: 'ALDZ', diffTempo: 'ALDM', color: '#E879F9', bgGradient: 'linear-gradient(135deg, #E879F9 0%, #C026D3 100%)' },
  'OCQZ': { kr: '안정적 집중 탐구 팩트형', catchphrase: '냉철한 분석력으로\n최적의 루틴을 설계하는 사람', bestMatch: 'ALDM', diffTempo: 'ALDZ', color: '#38BDF8', bgGradient: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)' },
  'OLDM': { kr: '안정적 전신 실전 공감형', catchphrase: '편안한 리듬 속에\n모두와 함께 움직이는 힐러', bestMatch: 'ACQZ', diffTempo: 'ACQM', color: '#FB7185', bgGradient: 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)' },
  'OLDZ': { kr: '안정적 전신 실전 팩트형', catchphrase: '꾸준함의 힘을 아는\n묵직한 실행가', bestMatch: 'ACQM', diffTempo: 'ACQZ', color: '#4ADE80', bgGradient: 'linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)' },
  'OLQM': { kr: '안정적 전신 탐구 공감형', catchphrase: '천천히, 하지만 확실하게\n마음을 담아 움직이는 사람', bestMatch: 'ACDZ', diffTempo: 'ACDM', color: '#F9A8D4', bgGradient: 'linear-gradient(135deg, #F9A8D4 0%, #EC4899 100%)' },
  'OLQZ': { kr: '안정적 전신 탐구 팩트형', catchphrase: '데이터와 균형 감각으로\n최적의 웰니스를 설계하는 사람', bestMatch: 'ACDM', diffTempo: 'ACDZ', color: '#67E8F9', bgGradient: 'linear-gradient(135deg, #67E8F9 0%, #06B6D4 100%)' },
};

const ResultView = ({ setView, quizCompleted, setQuizCompleted, isLoggedIn, setIsLoggedIn, bmtiCode }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const storyRef = useRef(null);

  // Parse BMTI code
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const suffix = bmtiCode ? bmtiCode.split('-')[1] || '' : '';
  const info = BMTI_INFO[axisCode] || BMTI_INFO['ACDM'];
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const bestChar = CHARACTERS.find(c => c.id === info.bestMatch);
  const diffChar = CHARACTERS.find(c => c.id === info.diffTempo);

  const siteUrl = 'https://dmdwns777.github.io/BMTI-platform/';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(siteUrl).then(() => {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    });
  };

  const handleDownloadStory = async () => {
    if (!storyRef.current) return;
    try {
      const canvas = await html2canvas(storyRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        width: 540,
        height: 960,
      });
      const link = document.createElement('a');
      link.download = `BMTI_${axisCode}_story.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    }
  };

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

        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c0ff00]/10 rounded-bl-full -z-10"></div>

        <div className="flex flex-col items-center text-center">
          {/* Character Image - Full Bleed */}
          <div className="w-[calc(100%+4rem)] md:w-[calc(100%+6rem)] -mt-8 md:-mt-12 -mx-8 md:-mx-12 mb-8 relative">
            {charData ? (
              <img src={charData.originalImage} alt={axisCode} className="w-full h-full object-cover rounded-t-[2.5rem]" style={{ maxHeight: '400px' }} />
            ) : (
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-t-[2.5rem]">
                <div className="w-32 h-32 bg-black rounded-[40%] animate-spin-slow absolute"></div>
                <div className="w-24 h-24 bg-[#c0ff00] rounded-full absolute mix-blend-multiply opacity-90"></div>
              </div>
            )}
          </div>

          {/* Catchphrase & Name & Buttons Layout */}
          <div className="w-full flex flex-col md:flex-row items-center justify-center mb-10 relative md:min-h-[220px]">
            
            {/* Left CTAs */}
            {quizCompleted && (
              <div className="flex flex-col gap-2 z-20 fade-in shrink-0 w-full md:w-auto md:absolute md:left-0 md:top-0 mb-6 md:mb-0">
                {!isLoggedIn ? (
                  <button
                    id="kakao-login-result"
                    onClick={() => setIsLoggedIn(true)}
                    className="bg-[#FEE500] text-black px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold shadow-sm hover:bg-[#F4DC00] hover:-translate-y-0.5 transition-transform flex items-center gap-1.5 w-fit"
                  >
                    <KakaoIcon className="w-3.5 h-3.5 fill-current" />
                    카카오톡 로그인
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
                      id="insta-story-btn"
                      onClick={() => setShowStoryModal(true)}
                      className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold shadow-sm hover:-translate-y-0.5 transition-transform flex items-center gap-1.5 w-fit"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      인스타그램 공유
                    </button>
                    <button
                      id="go-to-lab-card"
                      onClick={() => setView('lab')}
                      className="bg-black text-[#c0ff00] px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold shadow-sm hover:bg-gray-800 hover:-translate-y-0.5 transition-transform flex items-center gap-1.5 w-fit"
                    >
                      🎧 BMTI 플리 신청
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
                  </>
                )}
              </div>
            )}

            {/* Center Content */}
            <div className="flex flex-col items-center text-center w-full">
              <p className="text-[#9BB31B] font-bold text-lg md:text-xl mb-2">당신의 분석 코드</p>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black mb-1 tracking-tight text-gray-900 flex flex-col items-center gap-0">
                <span>{axisCode}</span>
                {suffix && <span className="text-xl sm:text-2xl md:text-3xl text-gray-400 font-bold">-{suffix}</span>}
              </h3>
              <p className="text-base sm:text-lg text-gray-500 font-bold mb-4">{getKoreanName(axisCode)}</p>
              <p className="text-xs sm:text-sm text-gray-500 mb-2 font-medium">{info.kr}</p>
              <p className="text-sm sm:text-base text-gray-600 whitespace-pre-line leading-relaxed italic">{info.catchphrase}</p>
            </div>
          </div>

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
              <p className="font-bold text-gray-800 text-lg">{info.bestMatch}</p>
              <p className="text-xs text-gray-500 mt-1">{BMTI_INFO[info.bestMatch]?.kr}</p>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
              <p className="text-xs text-gray-400 mb-2 font-semibold tracking-wider">조금 다른 템포 BMTI</p>
              <p className="font-bold text-gray-800 text-lg">{info.diffTempo}</p>
              <p className="text-xs text-gray-500 mt-1">{BMTI_INFO[info.diffTempo]?.kr}</p>
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
            id="insta-story-bottom"
            onClick={() => setShowStoryModal(true)}
            className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white px-4 py-4 rounded-2xl text-sm font-bold shadow-sm hover:-translate-y-1 transition-transform flex items-center justify-center gap-2"
          >
            📸 인스타그램 공유
          </button>
          <button
            id="go-to-lab-bottom"
            onClick={() => setView('lab')}
            className="flex-1 bg-black text-[#c0ff00] px-4 py-4 rounded-2xl text-sm font-bold shadow-sm hover:bg-gray-800 hover:-translate-y-1 transition-transform flex items-center justify-center gap-2"
          >
            🎧 BMTI 플리 신청
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
        </div>
      )}

      {/* ===== Instagram Story Modal ===== */}
      {showStoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md fade-in" onClick={() => setShowStoryModal(false)}>
          <div className="flex flex-col items-center gap-4 max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Story Card (9:16 ratio) */}
            <div
              ref={storyRef}
              style={{
                width: '540px',
                height: '960px',
                background: info.bgGradient,
                fontFamily: "'Pretendard', sans-serif",
              }}
              className="rounded-3xl overflow-hidden relative flex flex-col items-center justify-between p-10 text-white shadow-2xl"
            >
              {/* Top */}
              <div className="text-center z-10">
                <p style={{ fontSize: '14px', letterSpacing: '0.3em', opacity: 0.8, marginBottom: '8px', fontWeight: 600 }}>MY BODY TYPE IS</p>
                <h2 style={{ fontSize: '72px', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1, marginBottom: '8px' }}>{axisCode}</h2>
                <p style={{ fontSize: '16px', fontWeight: 600, opacity: 0.9 }}>{info.kr}</p>
              </div>

              {/* Character Image */}
              <div className="z-10" style={{ width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.3)' }}>
                {charData && <img src={charData.originalImage} alt={axisCode} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
              </div>

              {/* Catchphrase */}
              <div className="text-center z-10">
                <p style={{ fontSize: '18px', fontWeight: 600, lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: '16px', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                  "{info.catchphrase}"
                </p>

                {/* State Indicator */}
                {suffix && (
                  <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(5px)', borderRadius: '50px', padding: '6px 20px', fontSize: '13px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.3)' }}>
                    현재 상태: {axisCode}-{suffix}
                  </div>
                )}
              </div>

              {/* Chemistry */}
              <div className="w-full z-10" style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(5px)', borderRadius: '16px', padding: '14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <p style={{ fontSize: '10px', opacity: 0.8, marginBottom: '4px', fontWeight: 600, letterSpacing: '0.1em' }}>환상의 짝꿍</p>
                  <p style={{ fontSize: '20px', fontWeight: 900 }}>{info.bestMatch}</p>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(5px)', borderRadius: '16px', padding: '14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <p style={{ fontSize: '10px', opacity: 0.8, marginBottom: '4px', fontWeight: 600, letterSpacing: '0.1em' }}>다른 템포</p>
                  <p style={{ fontSize: '20px', fontWeight: 900 }}>{info.diffTempo}</p>
                </div>
              </div>

              {/* Bottom: URL area */}
              <div className="w-full z-10 text-center">
                <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)', borderRadius: '12px', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.25)' }}>
                  <p style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>나도 BMTI 검사하기 👇</p>
                  <p style={{ fontSize: '12px', fontWeight: 700, wordBreak: 'break-all' }}>여기에 붙여넣기</p>
                </div>
                <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '8px', fontWeight: 500 }}>BMTI — Body Management Type Indicator</p>
              </div>

              {/* Decorative Elements */}
              <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
              <div style={{ position: 'absolute', bottom: '80px', left: '-40px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }}></div>
            </div>

            {/* Action Buttons below the card */}
            <div className="flex gap-3 w-full max-w-[540px]">
              <button
                onClick={handleCopyUrl}
                className="flex-1 bg-white/20 backdrop-blur-md text-white border border-white/30 px-4 py-3 rounded-2xl text-sm font-bold hover:bg-white/30 transition-all flex items-center justify-center gap-2"
              >
                {urlCopied ? '✅ 복사 완료!' : '🔗 URL 복사'}
              </button>
              <button
                onClick={handleDownloadStory}
                className="flex-1 bg-white text-black px-4 py-3 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                📥 이미지 저장
              </button>
            </div>
            <button
              onClick={() => setShowStoryModal(false)}
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              닫기
            </button>
          </div>
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
