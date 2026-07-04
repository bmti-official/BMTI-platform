/* eslint-disable */
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isSavingPDF, setIsSavingPDF] = useState(false);
  const printRef = useRef(null);

  const [expandBestMatch, setExpandBestMatch] = useState(false);
  const [expandDiffTempo, setExpandDiffTempo] = useState(false);
  const [openTendencies, setOpenTendencies] = useState({});
  const [openDetailSections, setOpenDetailSections] = useState({});

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
  const info = BMTI_INFO[axisCode] || BMTI_INFO['ACDM'];
  const resultData = BMTI_RESULTS[axisCode] || {};
  const charData = CHARACTERS.find(c => c.id === axisCode);

  const siteUrl = 'https://dmdwns777.github.io/BMTI-platform/';

  // 상세 결과 4개 섹션(강사 가이드/탈출법/최악의 분위기/바디가이드)의 확신·유연 변형 선택 —
  // 화면 아코디언과 PDF 결과지가 같은 값을 쓰도록 한 번만 계산해 둔다.
  const percentages = bmtiAnswers && bmtiAnswers.length > 0 ? calculateBMTIPercentages(bmtiAnswers) : null;
  const getLevel = (letter) => (percentages && percentages[letter] >= 80 ? 'strong' : 'flexible');

  const instructorKey = (axisCode && axisCode.length === 4 ? axisCode.substring(2, 4) : 'DZ') + '_' + getLevel(axisCode ? axisCode[2] : 'D');
  const guideData = INSTRUCTOR_GUIDE_DATA[instructorKey] || INSTRUCTOR_GUIDE_DATA['DZ_flexible'];

  const escapeKey = (axisCode && axisCode.length >= 3 ? axisCode[0] + axisCode[2] : 'OQ') + '_' + getLevel(axisCode ? axisCode[0] : 'O');
  const escapeInfo = ESCAPE_DATA[escapeKey] || ESCAPE_DATA['OQ_flexible'];

  const vibeKey = (axisCode && axisCode.length >= 4 ? axisCode[0] + axisCode[3] : 'OM') + '_' + getLevel(axisCode ? axisCode[3] : 'M');
  const vibeData = WORST_VIBE_DATA[vibeKey] || WORST_VIBE_DATA['OM_flexible'];

  const bodyGuideText = (axisCode && BODY_GUIDE_DATA[axisCode]) || BODY_GUIDE_DATA['ACDZ'];
  const bodyGuideParagraphs = bodyGuideText ? bodyGuideText.split('\n\n') : [];

  const bestMatchBody = resultData.goodMatch ? resultData.goodMatch.split('\n').slice(2).join(' ') : '';
  const diffTempoBody = resultData.badMatch ? resultData.badMatch.split('\n').slice(2).join(' ') : '';

  // 1. "카카오톡으로 내 결과지 저장하기" — 전체 결과지를 PDF로 만들어 카톡(OS 공유 시트)으로 전달
  const handleSaveResultPDF = async () => {
    if (!printRef.current || isSavingPDF) return;
    setIsSavingPDF(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 800,
        windowWidth: 800,
      });

      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const pdfBlob = pdf.output('blob');
      const fileName = `BMTI_${axisCode}_결과지.pdf`;

      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: 'BMTI 결과지',
          text: `${info.kr} — ${axisCode} 전체 결과지예요.`,
        });
      } else {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = URL.createObjectURL(pdfBlob);
        link.click();
        URL.revokeObjectURL(link.href);
        alert('결과지 PDF가 저장되었어요. 카카오톡 채팅방에서 파일을 첨부해 보내주세요.');
      }
    } catch (err) {
      console.error('PDF 생성 오류:', err);
      alert('결과지를 만드는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSavingPDF(false);
    }
  };

  // 2. "카카오톡으로 친구에게 자랑하기" — 카카오링크 임베드 카드로 공유
  const handleShareToFriend = () => {
    if (!(window.Kakao && window.Kakao.Share)) {
      alert('카카오톡 공유가 준비 중입니다.');
      return;
    }
    const imageUrl = charData ? new URL(charData.originalImage, window.location.href).href : undefined;
    const shareUrl = `${siteUrl}#${axisCode}`;

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `나는 ${resultData.nickname ? resultData.nickname.replace('\n', ' ') : axisCode}!`,
        description: info.catchphrase.replace('\n', ' '),
        imageUrl,
        link: { webUrl: shareUrl, mobileWebUrl: shareUrl },
      },
      buttons: [
        { title: '내 BMTI도 확인하기', link: { webUrl: shareUrl, mobileWebUrl: shareUrl } },
      ],
    });
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
                const isOpen = !!openTendencies[letter1];

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
                    <p className="font-bold text-gray-800 text-[16px] md:text-[17px] mb-1 leading-relaxed break-keep">
                      "{data[level].quote}"
                    </p>
                    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <p className="text-gray-600 text-[15px] md:text-base leading-[1.7] break-keep">
                          {data[level].desc}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenTendencies(prev => ({ ...prev, [letter1]: !prev[letter1] }))}
                      className={`${textClass} text-sm font-bold mt-3 flex items-center gap-1`}
                    >
                      {isOpen ? '접기' : '자세히 보기'}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
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
          
          {/* CTA section: 4 buttons in priority order */}
          <div className="w-full mt-8 mb-4 flex flex-col gap-3">
            {/* 1. 카카오톡으로 내 결과지 저장하기 / 친구에게 자랑하기 */}
            <div className="w-full grid grid-cols-2 gap-3">
              <button
                onClick={handleSaveResultPDF}
                disabled={isSavingPDF}
                className="w-full bg-[#FEE500] hover:bg-[#F4DC00] disabled:opacity-60 disabled:cursor-wait p-5 md:p-6 rounded-3xl flex flex-col items-center justify-center text-center transition-all shadow-sm group border border-[#F4DC00]/50"
              >
                <span className="text-2xl md:text-3xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">💬</span>
                <span className="font-bold text-[#3C1E1E] text-[13px] md:text-base mb-1.5 leading-snug break-keep">
                  {isSavingPDF ? '결과지 만드는 중...' : (<>카카오톡으로<br />내 결과지 저장하기</>)}
                </span>
                <span className="text-[10px] md:text-[11px] text-[#3C1E1E]/70 font-bold bg-black/5 px-2.5 py-1 rounded-full">PDF 파일</span>
              </button>
              <button
                onClick={handleShareToFriend}
                className="w-full bg-[#FEE500] hover:bg-[#F4DC00] p-5 md:p-6 rounded-3xl flex flex-col items-center justify-center text-center transition-all shadow-sm group border border-[#F4DC00]/50"
              >
                <span className="text-2xl md:text-3xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">💬</span>
                <span className="font-bold text-[#3C1E1E] text-[13px] md:text-base mb-1.5 leading-snug break-keep">
                  카카오톡으로<br />친구에게 자랑하기
                </span>
                <span className="text-[10px] md:text-[11px] text-[#3C1E1E]/70 font-bold bg-black/5 px-2.5 py-1 rounded-full">공유 카드</span>
              </button>
            </div>

            {/* 2. 무브먼트 맵 사전 알림 (hero CTA) — 이미 신청했다면 마이페이지에서만 확인 가능하도록 숨김 */}
            {!appNotification && (
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
                    <div className="w-12 h-7 rounded-full flex-shrink-0 relative bg-gray-500">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-1 left-1 shadow-sm" />
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* 3 & 4. BMTI 과몰입 / BMTI 교환일기 작성 (secondary pair) */}
            <div className="w-full grid grid-cols-2 gap-3">
              <button
                onClick={() => setView('board')}
                className="bg-[#fdf0f3] hover:bg-[#fce4e9] p-5 rounded-3xl flex flex-col items-center justify-center text-center transition-all shadow-sm group border border-[#f7d7de]"
              >
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">💌</span>
                <span className="font-bold text-[#3C1E1E] text-[13px] md:text-sm leading-snug break-keep">BMTI 과몰입 하기</span>
              </button>
              <button
                onClick={() => setView('aichat')}
                className="bg-[#eef4fb] hover:bg-[#e0ecf8] p-5 rounded-3xl flex flex-col items-center justify-center text-center transition-all shadow-sm group border border-[#d7e6f7]"
              >
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📝</span>
                <span className="font-bold text-[#3C1E1E] text-[13px] md:text-sm leading-snug break-keep">BMTI 교환일기 작성하기</span>
              </button>
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
                
                const isOpen = !!openDetailSections.instructor;
                return (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-[#7C6FF0] leading-snug break-keep tracking-tight">
                      {guideData.title}
                    </h3>
                    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="md:bg-gray-50/80 md:rounded-2xl p-0 md:p-7 space-y-5 mt-4 md:mt-0">
                          <div>
                            <span className="text-sm md:text-[15px] font-bold text-gray-800 mb-1.5 block">맞춤 운동 가이드:</span>
                            <p className="text-[15px] md:text-base text-gray-600 leading-relaxed break-keep">
                              {guideData.goodGuide}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm md:text-[15px] font-bold text-[#7C6FF0] mb-1.5 block">최악의 운동 가이드:</span>
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
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenDetailSections(prev => ({ ...prev, instructor: !prev.instructor }))}
                      className="text-[#7C6FF0] text-sm font-bold mt-4 flex items-center gap-1"
                    >
                      {isOpen ? '접기' : '자세히 보기'}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
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
                
                const isOpen = !!openDetailSections.escape;
                return (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-[#C9862A] leading-snug break-keep tracking-tight">
                      {escapeInfo.title}
                    </h3>
                    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="md:bg-gray-50/80 md:rounded-2xl p-0 md:p-7 space-y-5 mt-4 md:mt-0">
                          <div>
                            <span className="text-sm md:text-[15px] font-bold text-gray-800 mb-1.5 block">당신의 특징:</span>
                            <p className="text-[15px] md:text-base text-gray-600 leading-relaxed break-keep">
                              {escapeInfo.trait}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm md:text-[15px] font-bold text-[#C9862A] mb-1.5 block">환불 하고 싶어지는 순간:</span>
                            <p className="text-[15px] md:text-base text-gray-600 leading-relaxed break-keep">
                              {escapeInfo.refund}
                            </p>
                          </div>
                          <div className="pt-2">
                            <span className="inline-block bg-[#C9862A]/10 text-[#C9862A] text-sm md:text-[15px] font-bold px-3 py-1 rounded-lg mb-2">
                              💡 기부천사 탈출법
                            </span>
                            <p className="text-[15px] md:text-base text-gray-700 font-medium leading-relaxed break-keep">
                              {escapeInfo.escape}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenDetailSections(prev => ({ ...prev, escape: !prev.escape }))}
                      className="text-[#C9862A] text-sm font-bold mt-4 flex items-center gap-1"
                    >
                      {isOpen ? '접기' : '자세히 보기'}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
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
                
                const isOpen = !!openDetailSections.vibe;
                return (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-[#D6486D] leading-snug break-keep tracking-tight">
                      {vibeData.name}
                    </h3>
                    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
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
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenDetailSections(prev => ({ ...prev, vibe: !prev.vibe }))}
                      className="text-[#D6486D] text-sm font-bold mt-4 flex items-center gap-1"
                    >
                      {isOpen ? '접기' : '자세히 보기'}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
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

      {/* Logged in Floating FAB */}
      {isLoggedIn && quizCompleted && (
        <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[100] flex flex-col items-end gap-3 fade-in pointer-events-none">
          {/* Menu Items (Vertical Stack) */}
          <div className={`flex flex-col items-end gap-3 transition-all duration-300 origin-bottom ${isFabOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8 pointer-events-none'}`}>
            <button
              onClick={() => { handleShareToFriend(); setIsFabOpen(false); }}
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

      {/* ===== PDF 결과지 소스 (화면에는 보이지 않고 html2canvas 캡처용으로만 존재) ===== */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }}>
        <div ref={printRef} style={{ width: '800px', background: '#ffffff', color: '#1f2937', fontFamily: "'Pretendard', sans-serif", padding: '56px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', paddingBottom: '32px', borderBottom: '2px solid #f3f4f6', marginBottom: '36px' }}>
            <p style={{ fontSize: '13px', letterSpacing: '0.3em', color: '#9ca3af', fontWeight: 700, marginBottom: '10px' }}>MY BMTI RESULT</p>
            <h1 style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-1px', margin: '0 0 6px' }}>{axisCode}</h1>
            <p style={{ fontSize: '15px', color: '#6b7280', fontWeight: 600, marginBottom: '18px' }}>{info.kr}</p>
            {resultData.nickname && (
              <h2 style={{ fontSize: '26px', fontWeight: 800, whiteSpace: 'pre-line', lineHeight: 1.3, margin: '0 0 14px' }}>{resultData.nickname}</h2>
            )}
            <p style={{ fontSize: '15px', color: '#4b5563', whiteSpace: 'pre-line', lineHeight: 1.6 }}>"{info.catchphrase}"</p>
          </div>

          {/* 4가지 성향 */}
          {percentages && (
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '18px' }}>🔍 나를 움직이게 하는 4가지 성향</h3>
              {[['A', 'O'], ['C', 'L'], ['D', 'Q'], ['Z', 'M']].map(([l1, l2]) => {
                const isLeft = percentages[l1] >= 50;
                const activeLetter = isLeft ? l1 : l2;
                const percent = Math.max(percentages[l1], percentages[l2]);
                const level = percent >= 80 ? 'confident' : 'flexible';
                const data = TENDENCY_DATA[activeLetter];
                return (
                  <div key={l1} style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{data[level].emoji}</span>
                      <span style={{ fontWeight: 800, fontSize: '15px' }}>{data[level].modifier} {data.name}</span>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: '#9ca3af', marginLeft: 'auto' }}>{percent}%</span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 6px' }}>"{data[level].quote}"</p>
                    <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{data[level].desc}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* 궁합 */}
          <div style={{ marginBottom: '40px', display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, background: '#fafaf9', borderRadius: '14px', padding: '18px' }}>
              <p style={{ fontSize: '12px', fontWeight: 800, color: '#9ca3af', marginBottom: '6px' }}>💖 환상의 짝꿍 ({info.bestMatch})</p>
              <p style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.7, margin: 0 }}>{bestMatchBody}</p>
            </div>
            <div style={{ flex: 1, background: '#fafaf9', borderRadius: '14px', padding: '18px' }}>
              <p style={{ fontSize: '12px', fontWeight: 800, color: '#9ca3af', marginBottom: '6px' }}>🤔 조금 다른 템포 ({info.diffTempo})</p>
              <p style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.7, margin: 0 }}>{diffTempoBody}</p>
            </div>
          </div>

          {/* 강사 가이드 */}
          <div style={{ marginBottom: '36px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px' }}>🙋🏻‍♂️🙋🏻‍♀️ 실패 없는 운동 강사 고르는 방법</p>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#7C6FF0', marginBottom: '14px' }}>{guideData.title}</h3>
            <p style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '4px' }}>맞춤 운동 가이드</p>
            <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: 1.7, marginBottom: '14px' }}>{guideData.goodGuide}</p>
            <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#7C6FF0', marginBottom: '4px' }}>최악의 운동 가이드</p>
            <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: 1.7, marginBottom: '14px' }}>{guideData.badGuide}</p>
            <p style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '4px' }}>💡 추천하는 자기점검 도구</p>
            <p style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.7, margin: 0 }}>{guideData.tools}</p>
          </div>

          {/* 탈출법 */}
          <div style={{ marginBottom: '36px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px' }}>💸 헬스장 기부천사 탈출법</p>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#C9862A', marginBottom: '14px' }}>{escapeInfo.title}</h3>
            <p style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '4px' }}>당신의 특징</p>
            <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: 1.7, marginBottom: '14px' }}>{escapeInfo.trait}</p>
            <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#C9862A', marginBottom: '4px' }}>환불 하고 싶어지는 순간</p>
            <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: 1.7, marginBottom: '14px' }}>{escapeInfo.refund}</p>
            <p style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '4px' }}>💡 기부천사 탈출법</p>
            <p style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.7, margin: 0 }}>{escapeInfo.escape}</p>
          </div>

          {/* 최악의 분위기 */}
          <div style={{ marginBottom: '36px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px' }}>💥 멘탈 바사삭 '최악의 운동 분위기'</p>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#D6486D', marginBottom: '14px' }}>{vibeData.name}</h3>
            <p style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '4px' }}>당신의 특징</p>
            <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: 1.7, marginBottom: '14px', whiteSpace: 'pre-line' }}>{vibeData.trait}</p>
            <p style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '4px' }}>최악의 분위기</p>
            <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{vibeData.worst}</p>
          </div>

          {/* 바디 가이드 */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px' }}>💌 바디 가이드의 따뜻한 시선</p>
            {bodyGuideParagraphs.map((para, i) => (
              <p key={i} style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-line', marginBottom: i < bodyGuideParagraphs.length - 1 ? '14px' : 0 }}>{para}</p>
            ))}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '44px', paddingTop: '20px', borderTop: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: '11.5px', color: '#9ca3af', marginBottom: '4px' }}>나도 BMTI 검사하기 👇</p>
            <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#4b5563' }}>{siteUrl}</p>
            <p style={{ fontSize: '10.5px', color: '#d1d5db', marginTop: '6px' }}>BMTI — Body Management Type Indicator</p>
          </div>
        </div>
      </div>

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
