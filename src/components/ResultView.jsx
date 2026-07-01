/* eslint-disable */
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabaseClient';
import { CHARACTERS, calculateBMTIPercentages } from '../data';
import { BMTI_RESULTS } from '../bmti_results';
import { INSTRUCTOR_GUIDE_DATA, ESCAPE_DATA, WORST_VIBE_DATA, BODY_GUIDE_DATA, TENDENCY_DATA } from '../customResultData';
import { canRetakeTest } from '../lib/bmtiSystem';

const KakaoIcon = ({ className = "w-3.5 h-3.5 fill-current" }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
  </svg>
);

const getKoreanName = (code) => {
  const map = {
    'ACDZ': '애씨디지', 'ACDM': '애씨디엠', 'ACQZ': '애씨큐지', 'ACQM': '애씨큐엠',
    'ALDZ': '앨디지', 'ALDM': '앨디엠', 'ALQZ': '앨큐지', 'ALQM': '앨큐엠',
    'OCDZ': '오씨디지', 'OCDM': '오씨디엠', 'OCQZ': '오씨큐지', 'OCQM': '오씨큐엠',
    'OLDZ': '올디지', 'OLDM': '올디엠', 'OLQZ': '올큐지', 'OLQM': '올큐엠'
  };
  return map[code] || '';
};

// BMTI 유형별 정보
const BMTI_INFO = {
  'ACDM': { kr: '활동적 집중 실전 공감형', catchphrase: '몸으로 먼저 느끼고,\n마음으로 함께 움직이는 사람', bestMatch: 'OLQZ', diffTempo: 'OLQM', color: '#FF6B6B', bgGradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' },
  'ACDZ': { kr: '활동적 집중 실전 팩트형', catchphrase: '결과로 말하는\n실전 파워 무버', bestMatch: 'OCDM', diffTempo: 'ALQM', color: '#4ECDC4', bgGradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)' },
  'ACQM': { kr: '활동적 집중 탐구 공감형', catchphrase: '이론과 감성 사이에서\n최적의 균형을 찾는 사람', bestMatch: 'OLDZ', diffTempo: 'OLDM', color: '#A78BFA', bgGradient: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)' },
  'ACQZ': { kr: '활동적 집중 탐구 팩트형', catchphrase: '데이터로 파고드는\n분석형 액티비스트', bestMatch: 'OLQZ', diffTempo: 'ALDM', color: '#60A5FA', bgGradient: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)' },
  'ALDM': { kr: '활동적 전신 실전 공감형', catchphrase: '전신으로 느끼며\n사람과 함께 성장하는 무버', bestMatch: 'OCQZ', diffTempo: 'OCQM', color: '#F472B6', bgGradient: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)' },
  'ALDZ': { kr: '활동적 전신 실전 팩트형', catchphrase: '거침없는 실행력으로\n몸 전체를 깨우는 사람', bestMatch: 'OLDZ', diffTempo: 'OCQM', color: '#34D399', bgGradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' },
  'ALQM': { kr: '활동적 전신 탐구 공감형', catchphrase: '호기심과 따뜻함이\n공존하는 밸런스 탐험가', bestMatch: 'OLQZ', diffTempo: 'ACDM', color: '#FBBF24', bgGradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' },
  'ALQZ': { kr: '활동적 전신 탐구 팩트형', catchphrase: '과학적 근거 위에\n움직임을 설계하는 전략가', bestMatch: 'OCQM', diffTempo: 'ACQZ', color: '#818CF8', bgGradient: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)' },
  'OCDM': { kr: '안정적 집중 실전 공감형', catchphrase: '조용하지만 깊게,\n마음까지 챙기는 꼼꼼 무버', bestMatch: 'ACDM', diffTempo: 'ALQZ', color: '#FB923C', bgGradient: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)' },
  'OCDZ': { kr: '안정적 집중 실전 팩트형', catchphrase: '묵묵히 집중하며\n효율을 극대화하는 장인', bestMatch: 'OLDZ', diffTempo: 'ACQM', color: '#2DD4BF', bgGradient: 'linear-gradient(135deg, #2DD4BF 0%, #14B8A6 100%)' },
  'OCQM': { kr: '안정적 집중 탐구 공감형', catchphrase: '깊이 있는 탐구와\n따뜻한 소통의 조화', bestMatch: 'ACDM', diffTempo: 'ALDZ', color: '#E879F9', bgGradient: 'linear-gradient(135deg, #E879F9 0%, #C026D3 100%)' },
  'OCQZ': { kr: '안정적 집중 탐구 팩트형', catchphrase: '냉철한 분석력으로\n최적의 루틴을 설계하는 사람', bestMatch: 'ACQZ', diffTempo: 'ALDM', color: '#38BDF8', bgGradient: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)' },
  'OLDM': { kr: '안정적 전신 실전 공감형', catchphrase: '편안한 리듬 속에\n모두와 함께 움직이는 힐러', bestMatch: 'ALDM', diffTempo: 'ACQZ', color: '#FB7185', bgGradient: 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)' },
  'OLDZ': { kr: '안정적 전신 실전 팩트형', catchphrase: '꾸준함의 힘을 아는\n묵직한 실행가', bestMatch: 'ALDZ', diffTempo: 'ACQM', color: '#4ADE80', bgGradient: 'linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)' },
  'OLQM': { kr: '안정적 전신 탐구 공감형', catchphrase: '천천히, 하지만 확실하게\n마음을 담아 움직이는 사람', bestMatch: 'ALQM', diffTempo: 'ACDZ', color: '#F9A8D4', bgGradient: 'linear-gradient(135deg, #F9A8D4 0%, #EC4899 100%)' },
  'OLQZ': { kr: '안정적 전신 탐구 팩트형', catchphrase: '데이터와 균형 감각으로\n최적의 웰니스를 설계하는 사람', bestMatch: 'ALQZ', diffTempo: 'ACDM', color: '#67E8F9', bgGradient: 'linear-gradient(135deg, #67E8F9 0%, #06B6D4 100%)' },
};

const SHORT_NICKNAMES = {
  ACDZ: '단단한 케틀벨', ACDM: '복근 슬라이더', ACQZ: '핵심만 \'아령(알려)\'줘요', ACQM: '수다쟁이 루프밴드',
  ALDZ: '팩트폭행 짐볼', ALDM: '뜨끈뜨끈 보수볼', ALQZ: '분석가 트레드밀', ALQM: '물음표 운동화',
  OCDZ: '저격수 땅콩볼', OCDM: '다정한 마사지건', OCQZ: '심리학자 온냉팩', OCQM: '친절한 하트괄사',
  OLDZ: '실용주의 요가링', OLDM: '포근포근 운동매트', OLQZ: '깐깐한 꺼꾸리', OLQM: '키다리 폼롤러'
};

const ChemistryCard = ({ type, targetCode, resultData, isExpanded, onToggle }) => {
  const isBest = type === 'bestMatch';
  const badgeTitle = isBest ? '💖 환상의 짝꿍 BMTI' : '🤔 조금 다른 템포 BMTI';
  const charImage = CHARACTERS.find(c => c.id === targetCode)?.image;
  const shortNickname = SHORT_NICKNAMES[targetCode];
  
  const matchString = isBest ? resultData.goodMatch : resultData.badMatch;
  const matchLines = matchString ? matchString.split('\n') : [];
  const description = matchLines.length >= 3 ? matchLines[2] : matchString;

  return (
    <div 
      className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[2rem] border border-gray-100 flex flex-col items-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer transition-all duration-300 w-full"
      onClick={onToggle}
    >
      <div className="bg-white border border-gray-100 rounded-full px-3 md:px-4 py-1.5 mb-2 md:mb-4 text-[11px] md:text-sm font-bold text-gray-500 shadow-sm whitespace-nowrap z-10 relative">
        {badgeTitle}
      </div>
      
      {!isExpanded ? (
        <div className="flex flex-col items-center w-full">
          <div className="w-24 h-24 md:w-36 md:h-36 mb-1 md:mb-2 flex items-center justify-center">
             {charImage && <img src={charImage} alt={targetCode} className={`w-full h-full object-contain ${['OCDZ', 'OCQM', 'OLQM'].includes(targetCode) ? 'scale-100' : 'scale-[1.2] md:scale-[1.1]'}`} />}
          </div>
          <p className="font-extrabold text-[#111827] text-base md:text-xl mb-1 flex items-baseline justify-center gap-1 text-center">
             <span>{targetCode}</span> <span className="text-gray-400 text-[10px] md:text-sm font-medium">({getKoreanName(targetCode)})</span>
          </p>
          <p className="font-bold text-gray-800 text-[13px] md:text-lg text-center break-keep">{shortNickname}</p>
          
          <div className="mt-4 md:mt-6 border border-gray-100 text-gray-500 bg-white rounded-full px-3 md:px-4 py-1.5 text-[11px] md:text-sm font-medium flex items-center gap-1 md:gap-2 shadow-sm">
            설명 보기 
            <svg width="10" height="10" className="md:w-3 md:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      ) : (
        <div className="w-full text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start md:gap-4 mb-4 md:mb-5">
            <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 mb-2 md:mb-0 flex items-center justify-center">
               {charImage && <img src={charImage} alt={targetCode} className={`w-full h-full object-contain ${['OCDZ', 'OCQM', 'OLQM'].includes(targetCode) ? 'scale-100' : 'scale-[1.2] md:scale-[1.1]'}`} />}
            </div>
            <div className="flex flex-col text-center md:text-left mt-1 md:mt-3">
              <p className="font-extrabold text-gray-500 text-[11px] md:text-sm mb-0.5 tracking-wider flex items-baseline justify-center md:justify-start gap-1">
                 <span>{targetCode}</span> <span className="text-gray-400 font-normal text-[9px] md:text-[11px] hidden md:inline">({getKoreanName(targetCode)})</span>
              </p>
              <p className="font-bold text-gray-800 text-[13px] md:text-lg leading-tight break-keep">{shortNickname}</p>
            </div>
          </div>
          
          <div className="w-full h-px bg-gray-100 mb-4 md:mb-5"></div>
          
          <p className="text-gray-600 text-[13px] md:text-[15.5px] leading-relaxed break-keep mb-5 md:mb-6">
            {description}
          </p>
          
          <div className="w-full flex justify-center">
            <div className="border border-gray-100 text-gray-500 bg-white rounded-full px-3 md:px-4 py-1.5 text-[11px] md:text-sm font-medium flex items-center gap-1 md:gap-2 shadow-sm">
              돌아가기 
              <svg width="10" height="10" className="md:w-3 md:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultView = ({ setView, quizCompleted, setQuizCompleted, isLoggedIn, setIsLoggedIn, bmtiCode, bmtiAnswers, userProfile }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const storyRef = useRef(null);
  
  const [expandBestMatch, setExpandBestMatch] = useState(false);
  const [expandDiffTempo, setExpandDiffTempo] = useState(false);

  const [appNotification, setAppNotification] = useState(() => {
    try {
      const saved = localStorage.getItem('bmti_user');
      return saved ? JSON.parse(saved).appNotification : false;
    } catch (e) {
      return false;
    }
  });

  const handleRetakeClick = async () => {
    setIsFabOpen(false);
    if (!isLoggedIn) {
      setShowConfirm(true);
      return;
    }
    const { canRetake, message } = await canRetakeTest(userProfile);
    if (!canRetake) {
      if (window.confirm(`${message}\n\n평생구독권(Plus)을 구매하시겠습니까?`)) {
        setView('ticket');
      }
      return;
    }
    setShowConfirm(true);
  };

  const handleToggleAppNotification = async () => {
    if (!isLoggedIn) {
      alert("알림 받기를 위해선 카카오톡 로그인/회원가입이 필요합니다.");
      if (setIsLoggedIn) setIsLoggedIn(true);
      return;
    }
    if (appNotification) return; // 한번 켜면 끌 수 없음
    setAppNotification(true);
    try {
      const saved = localStorage.getItem('bmti_user');
      const userObj = saved ? JSON.parse(saved) : {};
      userObj.appNotification = true;
      localStorage.setItem('bmti_user', JSON.stringify(userObj));
      
      if (userObj.id) {
        await supabase.from('pre_registrations').insert({ user_id: userObj.id }).catch(e => console.error(e));
      }
    } catch (e) {}
  };

  // Parse BMTI code
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const suffix = bmtiCode && bmtiCode.includes('-') ? bmtiCode.split('-')[1] : '';
  const info = BMTI_INFO[axisCode] || BMTI_INFO['ACDM'];
  const resultData = BMTI_RESULTS[axisCode] || {};
  const charData = CHARACTERS.find(c => c.id === axisCode);

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

  if (!bmtiCode && !quizCompleted) {
    return (
      <div className="min-h-screen pt-44 md:pt-52 pb-20 px-6 flex flex-col items-center justify-center text-center fade-in">
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
    <div className="min-h-screen pt-44 md:pt-52 pb-32 px-6 max-w-2xl mx-auto fade-in">
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
              <img src={charData.originalImage} alt={axisCode} className="w-full h-auto object-cover rounded-t-[2.5rem]" />
            ) : (
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-t-[2.5rem]">
                <div className="w-32 h-32 bg-black rounded-[40%] animate-spin-slow absolute"></div>
                <div className="w-24 h-24 bg-[#c0ff00] rounded-full absolute mix-blend-multiply opacity-90"></div>
              </div>
            )}
          </div>

          {/* Catchphrase & Name Layout */}
          <div className="w-full flex flex-col items-center justify-center mb-10 mt-6 relative px-4">
            {resultData.nickname && (
              <h1 className="text-[clamp(1.75rem,6vw,3rem)] leading-[1.2] font-black tracking-tight text-gray-900 whitespace-pre-line break-keep text-center">
                {resultData.nickname}
              </h1>
            )}
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-400 tracking-tight mt-3">
              {axisCode}
            </span>
          </div>

          {/* 4 Tendencies Section */}
          <div className="w-full mb-10 fade-in">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center gap-2">
              <span>🔍 나를 움직이게 하는 4가지 성향</span>
            </h3>
            
            {(() => {
              const percentages = calculateBMTIPercentages(bmtiAnswers);
              if (!percentages) return null;

              const renderTendencyCard = (letter1, letter2) => {
                const isLeft = percentages[letter1] >= 50;
                const activeLetter = isLeft ? letter1 : letter2;
                const percent = Math.max(percentages[letter1], percentages[letter2]);
                const level = percent >= 80 ? 'confident' : 'flexible';
                const data = TENDENCY_DATA[activeLetter];
                
                // Colors based on axis
                let colorClass = 'bg-[#4ECDC4]'; // Default
                let textClass = 'text-[#4ECDC4]';
                if (letter1 === 'A') { colorClass = 'bg-[#FF6B6B]'; textClass = 'text-[#FF6B6B]'; }
                else if (letter1 === 'C') { colorClass = 'bg-[#4ECDC4]'; textClass = 'text-[#4ECDC4]'; }
                else if (letter1 === 'D') { colorClass = 'bg-[#60A5FA]'; textClass = 'text-[#60A5FA]'; }
                else if (letter1 === 'Z') { colorClass = 'bg-[#A78BFA]'; textClass = 'text-[#A78BFA]'; }

                return (
                  <div key={letter1} className="md:bg-white md:border md:border-gray-100 md:shadow-[0_4px_20px_rgba(0,0,0,0.03)] md:rounded-3xl p-0 md:p-8 mb-8 md:mb-5 w-full text-left">
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-full bg-gray-100 rounded-full h-3 flex-1 mr-4 overflow-hidden">
                        <div className={`${colorClass} h-3 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }}></div>
                      </div>
                      <span className={`${textClass} font-bold text-sm md:text-base min-w-[40px] text-right`}>{percent}%</span>
                    </div>
                    <h4 className="text-[17px] md:text-[19px] font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-xl md:text-2xl">{data[level].emoji}</span>
                      <span>{data[level].modifier} {data.name}</span>
                    </h4>
                    <p className="font-bold text-gray-800 text-[16px] md:text-[17px] mb-3 leading-relaxed break-keep">
                      "{data[level].quote}"
                    </p>
                    <p className="text-gray-600 text-[15px] md:text-base leading-[1.7] break-keep">
                      {data[level].desc}
                    </p>
                  </div>
                );
              };

              return (
                <div className="flex flex-col gap-1 w-full max-w-lg mx-auto">
                  {renderTendencyCard('A', 'O')}
                  {renderTendencyCard('C', 'L')}
                  {renderTendencyCard('D', 'Q')}
                  {renderTendencyCard('Z', 'M')}
                </div>
              );
            })()}
          </div>

          {/* Chemistry section */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-2">
            <ChemistryCard 
              type="bestMatch" 
              targetCode={info.bestMatch} 
              resultData={resultData} 
              isExpanded={expandBestMatch}
              onToggle={() => setExpandBestMatch(!expandBestMatch)}
            />
            <ChemistryCard 
              type="diffTempo" 
              targetCode={info.diffTempo} 
              resultData={resultData} 
              isExpanded={expandDiffTempo}
              onToggle={() => setExpandDiffTempo(!expandDiffTempo)}
            />
          </div>
          
          {/* New 1-column CTA section */}
          <div className="w-full mt-8 mb-4">
            <button 
              onClick={() => {
                if (window.Kakao && window.Kakao.Channel) {
                  window.Kakao.Channel.addChannel({ channelPublicId: '_xasxgZX' }); 
                } else {
                  alert('카카오톡 채널 연동이 준비 중입니다.');
                }
              }}
              className="w-full bg-[#FEE500] hover:bg-[#F4DC00] p-6 rounded-3xl flex flex-col items-center justify-center text-center transition-all shadow-sm group border border-[#F4DC00]/50"
            >
              <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">💬</span>
              <span className="font-bold text-[#3C1E1E] text-sm md:text-base mb-1.5">내 BMTI 결과지 카톡으로 받아보기</span>
              <span className="text-[11px] text-[#3C1E1E]/70 font-bold bg-black/5 px-2.5 py-1 rounded-full">(카카오톡 채널 추가)</span>
            </button>
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
        <div className="fade-in bg-white border border-gray-200 rounded-[2rem] px-5 py-8 md:p-10 shadow-sm space-y-12">
          {/* Custom Instructor Guide Section */}
          <div className="border-b border-gray-100 pb-12 text-left">
            <h5 className="font-semibold text-sm md:text-base text-gray-500 mb-5 flex items-center gap-2">
              <span className="text-xl">🙋🏻‍♂️🙋🏻‍♀️</span> 실패 없는 운동 강사 고르는 방법
            </h5>
            <div className="flex flex-col gap-6">
              {(() => {
                let instructorKey = 'DZ_strong';
                const baseInstructor = axisCode && axisCode.length === 4 ? axisCode.substring(2, 4) : 'DZ';
                if (bmtiAnswers && bmtiAnswers.length > 0) {
                  const percentages = calculateBMTIPercentages(bmtiAnswers);
                  const thirdLetter = axisCode ? axisCode[2] : 'D';
                  if (percentages && percentages[thirdLetter] >= 80) {
                    instructorKey = baseInstructor + '_strong';
                  } else {
                    instructorKey = baseInstructor + '_flexible';
                  }
                } else {
                  // Fallback if no answers are available (e.g. direct entry to result)
                  instructorKey = baseInstructor + '_flexible';
                }
                const guideData = INSTRUCTOR_GUIDE_DATA[instructorKey] || INSTRUCTOR_GUIDE_DATA['DZ_flexible'];
                
                return (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-[#FF6B6B] leading-snug break-keep tracking-tight">
                      {guideData.title}
                    </h3>
                    <div className="md:bg-gray-50/80 md:rounded-2xl p-0 md:p-7 space-y-5 mt-4 md:mt-0">
                      <div>
                        <span className="text-sm md:text-[15px] font-bold text-gray-800 mb-1.5 block">맞춤 운동 가이드:</span>
                        <p className="text-[15px] md:text-base text-gray-600 leading-relaxed break-keep">
                          {guideData.goodGuide}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm md:text-[15px] font-bold text-[#FF6B6B] mb-1.5 block">최악의 운동 가이드:</span>
                        <p className="text-[15px] md:text-base text-gray-600 leading-relaxed break-keep">
                          {guideData.badGuide}
                        </p>
                      </div>
                      <div className="pt-2">
                        <div>
                          <span className="text-sm md:text-[15px] font-bold text-gray-800 mb-1.5 block">💡 추천하는 자기점검 도구:</span>
                          <p className="text-[15px] md:text-base text-gray-700 font-medium leading-relaxed break-keep">
                            {guideData.tools}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Custom Escape Data Section */}
          <div className="border-b border-gray-100 pb-12 text-left">
            <h5 className="font-semibold text-sm md:text-base text-gray-500 mb-5 flex items-center gap-2">
              <span className="text-xl">💸</span> 헬스장 기부천사 탈출법
            </h5>
            <div className="flex flex-col gap-6">
              {(() => {
                let escapeKey = 'OQ_strong';
                const baseEscape = axisCode && axisCode.length >= 3 ? axisCode[0] + axisCode[2] : 'OQ';
                if (bmtiAnswers && bmtiAnswers.length > 0) {
                  const percentages = calculateBMTIPercentages(bmtiAnswers);
                  const firstLetter = axisCode ? axisCode[0] : 'O';
                  if (percentages && percentages[firstLetter] >= 80) {
                    escapeKey = baseEscape + '_strong';
                  } else {
                    escapeKey = baseEscape + '_flexible';
                  }
                } else {
                  escapeKey = baseEscape + '_flexible';
                }
                const escapeInfo = ESCAPE_DATA[escapeKey] || ESCAPE_DATA['OQ_flexible'];
                
                return (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-[#FF6B6B] leading-snug break-keep tracking-tight">
                      {escapeInfo.title}
                    </h3>
                    <div className="md:bg-gray-50/80 md:rounded-2xl p-0 md:p-7 space-y-5 mt-4 md:mt-0">
                      <div>
                        <span className="text-sm md:text-[15px] font-bold text-gray-800 mb-1.5 block">당신의 특징:</span>
                        <p className="text-[15px] md:text-base text-gray-600 leading-relaxed break-keep">
                          {escapeInfo.trait}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm md:text-[15px] font-bold text-[#FF6B6B] mb-1.5 block">환불 하고 싶어지는 순간:</span>
                        <p className="text-[15px] md:text-base text-gray-600 leading-relaxed break-keep">
                          {escapeInfo.refund}
                        </p>
                      </div>
                      <div className="pt-2">
                        <span className="inline-block bg-[#FF6B6B]/10 text-[#FF6B6B] text-sm md:text-[15px] font-bold px-3 py-1 rounded-lg mb-2">
                          💡 기부천사 탈출법
                        </span>
                        <p className="text-[15px] md:text-base text-gray-700 font-medium leading-relaxed break-keep">
                          {escapeInfo.escape}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Custom Worst Vibe Section */}
          <div className="border-b border-gray-100 pb-12 text-left">
            <h5 className="font-semibold text-sm md:text-base text-gray-500 mb-5 flex items-center gap-2">
              <span className="text-xl">💥</span> 멘탈 바사삭 '최악의 운동 분위기'
            </h5>
            <div className="flex flex-col gap-6">
              {(() => {
                let vibeKey = 'OM_strong';
                const baseVibe = axisCode && axisCode.length >= 4 ? axisCode[0] + axisCode[3] : 'OM';
                if (bmtiAnswers && bmtiAnswers.length > 0) {
                  const percentages = calculateBMTIPercentages(bmtiAnswers);
                  const fourthLetter = axisCode ? axisCode[3] : 'M';
                  if (percentages && percentages[fourthLetter] >= 80) {
                    vibeKey = baseVibe + '_strong';
                  } else {
                    vibeKey = baseVibe + '_flexible';
                  }
                } else {
                  vibeKey = baseVibe + '_flexible';
                }
                const vibeData = WORST_VIBE_DATA[vibeKey] || WORST_VIBE_DATA['OM_flexible'];
                
                return (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-[#FF6B6B] leading-snug break-keep tracking-tight">
                      {vibeData.name}
                    </h3>
                    <div className="flex flex-col gap-5 mt-2">
                      <div className="flex flex-col gap-1.5">
                        <h6 className="font-bold text-gray-900 text-[15px] md:text-base w-max mb-0.5">당신의 특징:</h6>
                        <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">{vibeData.trait}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h6 className="font-bold text-gray-900 text-[15px] md:text-base w-max mb-0.5">최악의 분위기:</h6>
                        <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">{vibeData.worst}</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          
          {/* Custom Body Guide Letter Section */}
          <div className="text-left">
            <h5 className="font-semibold text-sm md:text-base text-gray-500 mb-5 flex items-center gap-2">
              <span className="text-xl">💌</span> 바디 가이드의 따뜻한 시선
            </h5>
            <div className="flex flex-col mt-4 gap-6">
              {(() => {
                const guideData = (axisCode && BODY_GUIDE_DATA[axisCode]) || BODY_GUIDE_DATA['ACDZ'];
                const paragraphs = guideData ? guideData.split('\n\n') : [];
                
                return (
                  <>
                    {/* First Paragraph (Fact) */}
                    {paragraphs.length > 0 && (
                      <p className="text-[15px] md:text-[16px] text-gray-700 leading-relaxed break-keep tracking-normal whitespace-pre-line">
                        {paragraphs[0]}
                      </p>
                    )}
                    
                    {/* Second Paragraph (Cheering/Comfort Quote) */}
                    {paragraphs.length > 1 && (
                      <p className="text-[15px] md:text-[16px] text-gray-700 leading-relaxed break-keep tracking-normal whitespace-pre-line mt-4">
                        {paragraphs.slice(1).join('\n\n')}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Bottom CTA for Movement Map Pre-registration */}
      <div className="mt-8 mb-6 fade-in px-4 md:px-0">
        <button 
          onClick={() => setView('spot')}
          className="w-full bg-black hover:bg-gray-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center transition-all shadow-sm group border border-gray-800 relative overflow-hidden"
        >
          <div className="flex flex-col items-center z-10 w-full">
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎁</span>
            <span className="font-bold text-white text-sm md:text-base mb-1 leading-snug break-keep">☃️ 올 겨울 출시 예정!! 🎅🏻</span>
            <span className="text-white text-3xl md:text-4xl font-black my-3">무브먼트 맵</span>
            <span className="font-bold text-white text-sm md:text-base mb-1 leading-snug break-keep">어플 런칭 시</span>
            <span className="text-[#c0ff00] text-[18px] md:text-[20px] font-black mt-1 mb-6">50% 할인 쿠폰 100% 증정!</span>
            
            {/* Toggle Switch */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                handleToggleAppNotification();
              }}
              className="flex items-center justify-between w-full max-w-[260px] bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
            >
              <span className="font-bold text-sm md:text-base break-keep text-white text-left leading-tight">
                사전 알림 신청으로<br/>할인 쿠폰 받기 !
              </span>
              <div
                className={`w-12 h-7 rounded-full flex-shrink-0 transition-all duration-300 relative ${
                  appNotification ? 'bg-[#c0ff00] cursor-not-allowed' : 'bg-gray-500'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${
                  appNotification ? 'left-6' : 'left-1'
                }`} />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Logged in Floating FAB */}
      {isLoggedIn && quizCompleted && (
        <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[100] flex flex-col items-end gap-3 fade-in pointer-events-none">
          {/* Menu Items (Vertical Stack) */}
          <div className={`flex flex-col items-end gap-3 transition-all duration-300 origin-bottom ${isFabOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8 pointer-events-none'}`}>
            <button
              onClick={() => { alert('카카오톡 공유가 완료되었습니다.'); setIsFabOpen(false); }}
              className="pointer-events-auto bg-white text-black px-5 py-3 rounded-full font-bold shadow-xl border border-gray-100 hover:bg-gray-50 flex items-center justify-center gap-2 whitespace-nowrap transition-transform active:scale-95"
            >
              <KakaoIcon className="w-5 h-5 fill-[#FEE500]" />
              <span className="text-sm">친구에게 카톡 공유</span>
            </button>
            <button
              onClick={() => { setView('board'); setIsFabOpen(false); }}
              className="pointer-events-auto bg-white text-black px-5 py-3 rounded-full font-bold shadow-xl border border-gray-100 hover:bg-gray-50 flex items-center justify-center gap-2 whitespace-nowrap transition-transform active:scale-95"
            >
              <span className="text-lg leading-none">💌</span>
              <span className="text-sm">BMTI 과몰입 커뮤</span>
            </button>
            <button
              onClick={() => { setView('bodycheck'); setIsFabOpen(false); }}
              className="pointer-events-auto bg-white text-black px-5 py-3 rounded-full font-bold shadow-xl border border-gray-100 hover:bg-gray-50 flex items-center justify-center gap-2 whitespace-nowrap transition-transform active:scale-95"
            >
              <span className="text-lg leading-none">☘️</span>
              <span className="text-sm">전문가 코칭상담</span>
            </button>
            <button
              onClick={handleRetakeClick}
              className="pointer-events-auto bg-white text-black px-5 py-3 rounded-full font-bold shadow-xl border border-gray-100 hover:bg-gray-50 flex items-center justify-center gap-2 whitespace-nowrap transition-transform active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span className="text-sm">다시 검사하기</span>
            </button>
          </div>

          {/* Main FAB Toggle Button */}
          <button
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`pointer-events-auto w-14 h-14 md:w-16 md:h-16 rounded-full bg-black text-[#c0ff00] shadow-2xl flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 ${isFabOpen ? 'rotate-45' : 'rotate-0'}`}
          >
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </button>
          
          {/* Overlay when FAB is open */}
          {isFabOpen && (
            <div 
              className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[-1] pointer-events-auto"
              onClick={() => setIsFabOpen(false)}
            />
          )}
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
