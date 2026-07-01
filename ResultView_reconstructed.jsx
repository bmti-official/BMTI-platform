// MISSING LINE 1
// MISSING LINE 2
// MISSING LINE 3
// MISSING LINE 4
// MISSING LINE 5
// MISSING LINE 6
// MISSING LINE 7
// MISSING LINE 8
// MISSING LINE 9
// MISSING LINE 10
// MISSING LINE 11
// MISSING LINE 12
// MISSING LINE 13
// MISSING LINE 14
// MISSING LINE 15
// MISSING LINE 16
// MISSING LINE 17
// MISSING LINE 18
// MISSING LINE 19
// MISSING LINE 20
// MISSING LINE 21
// MISSING LINE 22
// MISSING LINE 23
// MISSING LINE 24
// MISSING LINE 25
// MISSING LINE 26
// MISSING LINE 27
// MISSING LINE 28
// MISSING LINE 29
// MISSING LINE 30
// MISSING LINE 31
// MISSING LINE 32
// MISSING LINE 33
// MISSING LINE 34
// MISSING LINE 35
// MISSING LINE 36
// MISSING LINE 37
// MISSING LINE 38
// MISSING LINE 39
// MISSING LINE 40
// MISSING LINE 41
// MISSING LINE 42
// MISSING LINE 43
// MISSING LINE 44
// MISSING LINE 45
  if (fullMap[code]) return fullMap[code];
  return code.split('').map(char => BMTI_PRONUNCIATION[char] || char).join('');
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


const MatchCard = ({ typeTitle, matchText, fallbackText }) => {
  let bmtiCode = fallbackText;
  let pronunciation = '';
  let shortNick = fallbackText;
  let description = '';

  if (matchText) {
    const match = matchText.match(/^.*?\(([A-Z]{4})\):\s*\[(.*?)\]\n"(.*?)"\n(.*)$/m);
    if (match) {
      bmtiCode = match[1];
      shortNick = match[2];
      description = match[4].replace(/\. /g, '.\n');
    }
  }

  // Get pronunciation (e.g., 애씨디지)
  const getKoreanNameLocal = (code) => {
    if (!code) return '';
    const fullMap = {
      'ACDZ': '애씨디지', 'ACDM': '애씨디엠', 'ACQZ': '애씨큐지', 'ACQM': '애씨큐엠',
      'ALDZ': '앨디지', 'ALDM': '앨디엠', 'ALQZ': '앨큐지', 'ALQM': '앨큐엠',
      'OCDZ': '오씨디지', 'OCDM': '오씨디엠', 'OCQZ': '오씨큐지', 'OCQM': '오씨큐엠',
      'OLDZ': '올디지', 'OLDM': '올디엠', 'OLQZ': '올큐지', 'OLQM': '올큐엠'
    };
    if (fullMap[code]) return fullMap[code];
    return code;
  };
  pronunciation = getKoreanNameLocal(bmtiCode);
    if (match) {
      bmtiCode = match[1];
      description = match[4].replace(/\. /g, '.\n');
    }
  }

  // Get pronunciation (e.g., 애씨디지)
  const getKoreanNameLocal = (code) => {
    if (!code) return '';
    const fullMap = {
      'ACDZ': '애씨디지', 'ACDM': '애씨디엠', 'ACQZ': '애씨큐지', 'ACQM': '애씨큐엠',
      'ALDZ': '앨디지', 'ALDM': '앨디엠', 'ALQZ': '앨큐지', 'ALQM': '앨큐엠',
      'OCDZ': '오씨디지', 'OCDM': '오씨디엠', 'OCQZ': '오씨큐지', 'OCQM': '오씨큐엠',
      'OLDZ': '올디지', 'OLDM': '올디엠', 'OLQZ': '올큐지', 'OLQM': '올큐엠'
    };
    if (fullMap[code]) return fullMap[code];
    return code;
  };
  pronunciation = getKoreanNameLocal(bmtiCode);
  
  const shortNick = BMTI_SHORT_NAMING_FOR_MATCH[bmtiCode] || fallbackText;
  const charData = CHARACTERS.find(c => c.id === bmtiCode);
  const imgUrl = charData?.image;

  return (
    <div className="bg-white border border-gray-200 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 shadow-sm flex flex-col items-center relative h-full">
      {/* Title Badge */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-full px-3 md:px-4 py-1.5 mb-5 md:mb-6 text-xs md:text-sm font-bold text-gray-500 inline-block">
        {typeTitle}
      </div>

      {!isExpanded ? (
        <div className="flex flex-col items-center justify-center text-center w-full flex-grow">
          {imgUrl && <img src={imgUrl} alt={bmtiCode} className="w-24 h-24 md:w-32 md:h-32 object-contain mb-3 drop-shadow-md" />}
          
          <div className="flex flex-col items-center justify-center text-center mt-1 mb-5 md:mb-6">
            <div className="flex items-end justify-center gap-1.5 mb-1">
              <span className="text-lg md:text-xl font-black text-gray-900 tracking-tight">{bmtiCode}</span>
              <span className="text-xs md:text-sm text-gray-400 font-medium pb-0.5">({pronunciation})</span>
            </div>
            <span className="text-sm md:text-base font-bold text-gray-800 whitespace-pre-wrap leading-tight">{shortNick}</span>
          </div>

          <button 
            onClick={() => setIsExpanded(true)}
            className="mt-auto px-4 md:px-6 py-1.5 md:py-2 bg-white border border-gray-200 text-gray-400 rounded-full text-xs md:text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors w-max mx-auto"
          >
            설명 보기 ∨
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-start text-left w-full h-full">
          <div className="flex items-center justify-start w-full gap-3 mb-4 pl-1">
            {imgUrl && <img src={imgUrl} alt={bmtiCode} className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-sm" />}
            <div className="flex flex-col justify-center">
              <span className="text-xs md:text-sm font-bold text-gray-400 tracking-wider mb-0.5">{bmtiCode}</span>
              <span className="text-sm md:text-base font-bold text-gray-900">{shortNick}</span>
            </div>
          </div>
          
          <hr className="w-full border-gray-100 mb-4" />
          
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed break-keep w-full mb-5 whitespace-pre-line px-1">
            {description}
          </p>

          <button 
            onClick={() => setIsExpanded(false)}
            className="mt-auto px-4 md:px-6 py-1.5 md:py-2 bg-white border border-gray-200 text-gray-400 rounded-full text-xs md:text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors w-max mx-auto"
          >
            돌아가기 ∧
          </button>
        </div>
      )}
    </div>
  );
};





const parseReportSection = (text) => {
  if (!text) return { subtitle: '', subSections: [] };
  if (typeof text === 'object') return text;
  const lines = text.split('\n\n').filter(Boolean);
  const subtitle = (lines[0] || '').replace(/^"|"$/g, '');
  const subSections = lines.slice(1);
  return { subtitle, subSections };
};

const renderSection = (emoji, title, dataField, isLoggedIn, onLoginClick) => {
  if (!dataField) return null;
  const parsed = parseReportSection(dataField);
  
  return (
    <div className="mb-12 last:mb-0 border-b border-gray-100 last:border-0 pb-12 last:pb-0 text-left">
      <h5 className="font-bold text-base md:text-lg text-gray-900 mb-6 flex items-center gap-2">
        <span className="text-2xl">{emoji}</span> {title}
      </h5>
      
      {!isLoggedIn ? (
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-6 flex flex-col items-center justify-center min-h-[160px] mt-4">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
          <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <p className="text-[15px] font-bold text-gray-800 mb-5 break-keep">상세 내용을 확인하려면 로그인해주세요</p>
            <button
              onClick={onLoginClick}
              className="w-full bg-[#FEE500] text-black text-sm font-semibold px-6 py-3.5 rounded-full shadow-sm hover:bg-[#F4DC00] transition-colors flex items-center justify-center gap-2"
            >
              <KakaoIcon className="w-5 h-5" />
              카카오톡 간편 로그인
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-snug break-keep">
            "{parsed.subtitle}"
          </h3>
          <div className="flex flex-col gap-5 mt-2">
            {parsed.subSections.map((sec, i) => {
              const parts = sec.split(/:(.*)/s);
              let secTitle = '';
              let secBody = sec;
              if (parts.length > 1 && parts[0].length < 20) {
                secTitle = parts[0].trim();
                secBody = parts[1].trim();
              }
              return (
                <div key={i} className="flex flex-col gap-1.5">
                  {secTitle && (
                    <h6 className="font-bold text-gray-900 text-[15px] md:text-base w-max mb-0.5">
                      {secTitle}
                    </h6>
                  )}
                  <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">
                    {secBody}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
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

          {/* Catchphrase & Name Layout */}
          <div className="w-full flex flex-col md:flex-row items-center justify-center mb-10 relative md:min-h-[220px]">
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

          {/* Catchphrase & Name Layout */}
          <div className="w-full flex flex-col items-center justify-center mb-6 relative">
            {/* Center Content */}
            <div className="flex flex-col items-center text-center w-full">
              <div className="flex items-end justify-center gap-2 mb-3">
                <span className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">{axisCode}</span>
                <span className="text-base md:text-lg text-gray-400 font-medium pb-1">{getKoreanName(axisCode)}</span>
              </div>
              <p className="text-lg md:text-xl text-gray-800 font-bold whitespace-pre-line leading-relaxed">"{BMTI_NAMING[axisCode] || ''}"</p>
            </div>
          </div>

          {/* Chemistry section */}
          <div className="w-full grid grid-cols-2 gap-2 sm:gap-4 mt-8 mb-4">
    good: '말 많은 건 딱 질색입니다. "자, 잡담 생략하고 스쿼트 20개 들어갑니다. 등 굽었어요, 펴세요."처럼 내 자세의 문제점만 정확히 팩트로 짚고 바로 몸을 굴려주는 강사가 맞습니다.',
    bad: '동작 하나 하기 전에 근육의 기시점, 정지점 운운하며 10분씩 이론 설명하는 강사를 만나면 하품부터 나옵니다.',
    tools: '고탄력 루프 밴드, 케틀벨, 튜빙 밴드'
  },
  'DM': {
    name: '"파이팅 넘치는 치어리더형"',
    good: '"회원님! 너무 좋아요! 조금만 더! 할 수 있어요!" 하면서 긍정적인 에너지를 쏟아붓고 같이 땀 흘려주는 강사가 최고입니다. 몸으로 부딪히며 배우되, 칭찬을 먹어야 에너지가 납니다.',
    bad: '숫자만 기계적으로 세거나, "회원님 식단 안 하니까 살이 안 빠지죠"라며 팩트 폭격을 날리는 강사를 만나면 상처받고 헬스장 발길을 끊습니다.',
    tools: '스텝박스, 짐볼, 워터백(아쿠아백)'
  },
  'QZ': {
    name: '"족집게 1타 강사형"',
    good: '"왜 내가 스쿼트를 하면 앞벅지만 아픈지" 그 원리를 명확한 근거(팩트)로 납득시켜 줘야 직성이 풀립니다. 내 체형의 문제점과 해결책을 인체 해부학적 원리로 깔끔하게 브리핑해 주는 강사를 신뢰합니다.',
    bad: '원리 설명 없이 "그냥 제가 시키는 대로 하세요", "원래 처음엔 다 아픈 거예요"라고 뭉뚱그려 말하는 강사를 만나면 전문성을 의심하게 됩니다.',
    tools: '보수(BOSU), 밸런스 패드, 하드 폼롤러'
  },
  'QM': {
    name: '"따뜻한 밀착 가이드형"',
    good: '내 몸이 아프거나 동작이 안 나오는 것에 대해 충분히 공감해 주면서, "회원님은 지금 골반이 타이트해서 그런 거니, 이 스트레칭부터 차근차근해볼게요"라고 친절하게 원리를 설명해 주는 강사가 필요합니다.',
    bad: '내 두려움(혹은 통증)은 무시한 채 "다 엄살이에요, 한 세트 더 하세요!"라고 밀어붙이거나, 차갑게 지적만 하는 강사를 만나면 몸과 마음이 모두 얼어붙습니다.',
    tools: '소프트 폼롤러, 요가 블록, 스트레칭 스트랩, 요가링(젠링)'
  }
};

const QUIT_REASON_DATA = {
  'AD': {
    name: '🏃‍♂️ "이론은 됐고 일단 땀부터 빼고 보는 오운완 열정러"',
    trait: '텐션 높은 분위기 속에서, 잡다한 설명 없이 바로 본운동에 들어가 땀을 쫙 빼야 "아, 오늘 오운완 제대로 했다!"라고 느낍니다.',
    refund: '강사가 근육의 원리를 10분 넘게 설명하거나, 매트에 가만히 누워 호흡만 길게 시킬 때. 지루해서 하품이 나고 몸이 굳어버려 다음 날부터 헬스장 갈 맛이 뚝 떨어집니다.',
    escape: '정적인 운동은 금물! 크로스핏, 스피닝 등 신나는 음악과 함께 몸을 불태우는 고강도 운동을 선택하세요.'
  },
  'AQ': {
    name: '🔥 "텐션은 신나게! 하지만 자극점은 알아야 직성이 풀리는 타입"',
    trait: '혼자 조용히 하는 운동보다는 다 같이 파이팅하는 분위기를 좋아합니다. 하지만 텐션만 높고 전문성이 떨어지면 참지 못합니다. "왜 이 동작을 할 때 무릎이 아프지?" 혹은 "어디에 자극이 와야 하지?"라는 의문이 풀려야 제대로 운동할 수 있습니다.',
    refund: '그룹 수업 분위기는 신나서 좋은데, 동작을 따라 하다가 "선생님, 저 허리가 아파요"라고 질문했을 때 "원래 처음엔 다 아픈 거예요~ 그냥 따라오세요!"라고 얼버무리는 강사를 만날 때. 신뢰가 바닥으로 떨어져 더 이상 나가지 않습니다.',
    escape: '텐션 위주의 운동보다는 활기찬 분위기와 체계적인 자세 교정(티칭)이 공존하는 소규모 그룹 웨이트가 제격입니다.'
  },
  'OD': {
    name: '🎧 "조용히 내 루틴만 돌리고 칼퇴하고 싶은 헬스장 솔플러"',
    trait: '남들과 섞이거나 대화하는 것은 피곤해합니다. 그저 혼자 조용히 이어폰을 꽂고, 복잡한 이론 생각할 것 없이 정해진 루틴대로 깔끔하게 오늘치 할당량만 채우고 집에 가길 원합니다.',
    refund: '큰맘 먹고 1:1 PT를 끊었는데, 강사가 자꾸 "주말에 뭐 하셨어요?"라며 사적인 스몰톡을 시도하거나 동작 하나하나마다 너무 길게 설명하며 흐름을 끊을 때. 혼자 텐션을 유지하며 운동하고 싶은데 자꾸 방해받는 느낌이 들어 운동 시간이 피곤해집니다.',
            <div className="w-full mt-8 mb-6">
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-xl">🔍</span>
                <h3 className="text-xl font-bold text-gray-900">나를 움직이게 하는 4가지 성향</h3>
              </div>
              
              <div className="flex flex-col gap-4 text-left">
                {axisCode.split('').map((letter, idx) => {
                  const percentagesMap = calculateBMTIPercentages(bmtiAnswers);
                  const pct = percentagesMap ? percentagesMap[letter] : 50;
                  const isHigh = pct >= 80;
                  const content = TRAITS_CONTENT[letter][isHigh ? 'high' : 'low'];
                  const color = ['#FF6B6B', '#34D399', '#60A5FA', '#38BDF8'][idx];
                  
                  return (
                    <div key={letter} className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mr-4">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                        </div>
                        <span className="font-bold text-sm whitespace-nowrap" style={{ color: color }}>{pct}%</span>
                      </div>
                      <h4 className="text-lg md:text-xl font-bold mb-4 text-gray-900">
                        {content.emoji} {content.type} {TRAITS_CONTENT[letter].name}
                      </h4>
                      <p className="text-base md:text-lg font-bold text-gray-900 mb-3 break-keep leading-relaxed">
                        "{content.quote}"
                      </p>
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed break-keep">
                        {content.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chemistry section */}
            ) : (
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-t-[2.5rem]">
                <div className="w-32 h-32 bg-black rounded-[40%] animate-spin-slow absolute"></div>
                <div className="w-24 h-24 bg-[#c0ff00] rounded-full absolute mix-blend-multiply opacity-90"></div>
              </div>
            )}
          </div>


          <div className="w-full flex flex-col items-center justify-center mb-6 relative">
            {/* Center Content */}
            <div className="flex flex-col items-center text-center w-full">
              <div className="flex items-end justify-center gap-2 mb-3">
                <span className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">{axisCode}</span>
                <span className="text-base md:text-lg text-gray-400 font-medium pb-1">{getKoreanName(axisCode)}</span>
              </div>
              <p className="text-lg md:text-xl text-gray-800 font-bold whitespace-pre-line leading-relaxed">"{BMTI_NAMING[axisCode] || ''}"</p>
            </div>
          </div>

          {/* Traits (4 Axes) */}
          {bmtiAnswers && bmtiAnswers.length > 0 && (
            <div className="w-full mt-8 mb-6">
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-xl">🔍</span>
                <h3 className="text-xl font-bold text-gray-900">나를 움직이게 하는 4가지 성향</h3>
              </div>
              
              <div className="flex flex-col gap-4 text-left">
                {axisCode.split('').map((letter, idx) => {
                  const percentagesMap = calculateBMTIPercentages(bmtiAnswers);
                  const pct = percentagesMap ? percentagesMap[letter] : 50;
                  const isHigh = pct >= 80;
                  const content = TRAITS_CONTENT[letter][isHigh ? 'high' : 'low'];
                  const color = ['#FF6B6B', '#34D399', '#60A5FA', '#38BDF8'][idx];
                  
                  return (
                    <div key={letter} className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mr-4">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                        </div>
                        <span className="font-bold text-sm whitespace-nowrap" style={{ color: color }}>{pct}%</span>
                      </div>
                      <h4 className="text-lg md:text-xl font-bold mb-4 text-gray-900">
                        {content.emoji} {content.type} {TRAITS_CONTENT[letter].name}
                      </h4>
                      <p className="text-base md:text-lg font-bold text-gray-900 mb-3 break-keep leading-relaxed">
                        "{content.quote}"
                      </p>
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed break-keep">
                        {content.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chemistry section */}
          <div className="w-full grid grid-cols-2 gap-2 sm:gap-4 mt-8 mb-4">
            <MatchCard typeTitle="💖 환상의 짝꿍 BMTI" matchText={resultData?.goodMatch} fallbackText={info?.bestMatch} />
            <MatchCard typeTitle="🤔 조금 다른 템포 BMTI" matchText={resultData?.badMatch} fallbackText={info?.diffTempo} />
          </div>

        </div>
      </div>

      {/* Detailed Result Locked CTA */}
      <div className="bg-white border border-gray-200 rounded-[2rem] p-6 md:p-10 shadow-sm mt-8">
        <h4 className="text-2xl font-bold mb-10 text-center text-gray-900">👀나의 운동 심리 이야기</h4>
        
        {renderSection("🧑‍🏫", "실패 없는 운동 강사(or 홈트 채널) 고르는 법", resultData?.howToChooseInstructor, isLoggedIn, () => setIsLoggedIn(true))}
        {renderSection("🏃‍♂️", "작심삼일 탈출! 내가 운동을 그만두는 진짜 이유", resultData?.whyQuit, isLoggedIn, () => setIsLoggedIn(true))}
        {renderSection("⚡️", "운동 효율 뚝! 나를 지치게 하는 헬스장 최악의 분위기", resultData?.worstVibe, isLoggedIn, () => setIsLoggedIn(true))}
        {renderSection("🔍", "무의식 업무자세 점검 (10분)", resultData?.checkPoints, isLoggedIn, () => setIsLoggedIn(true))}
      </div>

      {/* Logged in Floating CTAs */}
      {isLoggedIn && quizCompleted && (
// MISSING LINE 461
// MISSING LINE 462
// MISSING LINE 463
// MISSING LINE 464
// MISSING LINE 465
// MISSING LINE 466
// MISSING LINE 467
// MISSING LINE 468
// MISSING LINE 469
// MISSING LINE 470
// MISSING LINE 471
// MISSING LINE 472
// MISSING LINE 473
// MISSING LINE 474
// MISSING LINE 475
// MISSING LINE 476
// MISSING LINE 477
// MISSING LINE 478
// MISSING LINE 479
// MISSING LINE 480
// MISSING LINE 481
// MISSING LINE 482
// MISSING LINE 483
// MISSING LINE 484
// MISSING LINE 485
// MISSING LINE 486
// MISSING LINE 487
// MISSING LINE 488
// MISSING LINE 489
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <p className="text-[15px] font-bold text-gray-800 mb-5 break-keep">상세 내용을 확인하려면 로그인해주세요</p>
                <button
                  onClick={() => setIsLoggedIn(true)}
                  className="w-full bg-[#FEE500] text-black text-sm font-semibold px-6 py-3.5 rounded-full shadow-sm hover:bg-[#F4DC00] transition-colors flex items-center justify-center gap-2"
                >
                  <KakaoIcon className="w-5 h-5" />
                  카카오톡 간편 로그인
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {(() => {
                const instructorType = axisCode.slice(2, 4);
                const instructorData = INSTRUCTOR_GUIDE_DATA[instructorType] || INSTRUCTOR_GUIDE_DATA['QM'];
                
// MISSING LINE 511
// MISSING LINE 512
// MISSING LINE 513
// MISSING LINE 514
// MISSING LINE 515
// MISSING LINE 516
// MISSING LINE 517
// MISSING LINE 518
// MISSING LINE 519
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h6 className="font-bold text-gray-900 text-[15px] md:text-base w-max mb-0.5">최악의 운동 가이드:</h6>
                        <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">{instructorData.bad}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h6 className="font-bold text-gray-900 text-[15px] md:text-base w-max mb-0.5">추천하는 자기점검 도구:</h6>
                        <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">{instructorData.tools}</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {renderSection("🏃‍♂️", "작심삼일 탈출! 내가 운동을 그만두는 진짜 이유", resultData?.whyQuit, isLoggedIn, () => setIsLoggedIn(true))}
        {renderSection("⚡️", "운동 효율 뚝! 나를 지치게 하는 헬스장 최악의 분위기", resultData?.worstVibe, isLoggedIn, () => setIsLoggedIn(true))}
        {renderSection("🔍", "무의식 업무자세 점검 (10분)", resultData?.checkPoints, isLoggedIn, () => setIsLoggedIn(true))}
      </div>

      {/* Logged in Floating CTAs */}
      {isLoggedIn && quizCompleted && (
        <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] md:max-w-2xl bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl p-1.5 md:p-3 rounded-2xl md:rounded-3xl z-50 flex flex-row items-center justify-between gap-1 md:gap-3 fade-in overflow-x-auto hide-scrollbar">
          <button
// MISSING LINE 546
// MISSING LINE 547
// MISSING LINE 548
// MISSING LINE 549
// MISSING LINE 550
// MISSING LINE 551
// MISSING LINE 552
// MISSING LINE 553
// MISSING LINE 554
// MISSING LINE 555
// MISSING LINE 556
// MISSING LINE 557
// MISSING LINE 558
// MISSING LINE 559
// MISSING LINE 560
// MISSING LINE 561
// MISSING LINE 562
// MISSING LINE 563
// MISSING LINE 564
// MISSING LINE 565
// MISSING LINE 566
// MISSING LINE 567
// MISSING LINE 568
// MISSING LINE 569
// MISSING LINE 570
// MISSING LINE 571
// MISSING LINE 572
// MISSING LINE 573
// MISSING LINE 574
// MISSING LINE 575
// MISSING LINE 576
// MISSING LINE 577
// MISSING LINE 578
// MISSING LINE 579
// MISSING LINE 580
// MISSING LINE 581
// MISSING LINE 582
// MISSING LINE 583
// MISSING LINE 584
                  카카오톡 간편 로그인
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {(() => {
                const quitType = axisCode[0] + axisCode[2];
                const quitData = QUIT_REASON_DATA[quitType] || QUIT_REASON_DATA['OQ'];
                
                return (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-[#FF6B6B] leading-snug break-keep tracking-tight">
                      {quitData.name}
                    </h3>
                    <div className="flex flex-col gap-5 mt-2">
// MISSING LINE 601
// MISSING LINE 602
// MISSING LINE 603
// MISSING LINE 604
// MISSING LINE 605
// MISSING LINE 606
// MISSING LINE 607
// MISSING LINE 608
// MISSING LINE 609
                        <h6 className="font-bold text-gray-900 text-[15px] md:text-base w-max mb-0.5">기부천사 탈출법:</h6>
                        <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">{quitData.escape}</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
        {renderSection("⚡️", "운동 효율 뚝! 나를 지치게 하는 헬스장 최악의 분위기", resultData?.worstVibe, isLoggedIn, () => setIsLoggedIn(true))}
        {renderSection("🔍", "무의식 업무자세 점검 (10분)", resultData?.checkPoints, isLoggedIn, () => setIsLoggedIn(true))}
      </div>

      {/* Logged in Floating CTAs */}
      {isLoggedIn && quizCompleted && (
        <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] md:max-w-2xl bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl p-1.5 md:p-3 rounded-2xl md:rounded-3xl z-50 flex flex-row items-center justify-between gap-1 md:gap-3 fade-in overflow-x-auto hide-scrollbar">
          <button
            id="kakao-share-bottom"
            onClick={() => alert('카카오톡 공유가 완료되었습니다.')}
                        <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">{quitData.refund}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h6 className="font-bold text-gray-900 text-[15px] md:text-base w-max mb-0.5">기부천사 탈출법:</h6>
                        <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">{quitData.escape}</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
        {/* Custom Worst Vibe Section */}
        <div className="mb-12 last:mb-0 border-b border-gray-100 last:border-0 pb-12 last:pb-0 text-left">
          <h5 className="font-semibold text-sm md:text-base text-gray-500 mb-5 flex items-center gap-2">
            <span className="text-xl">💥</span> 멘탈 바사삭 '최악의 운동 분위기'
          </h5>
          
          {!isLoggedIn ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-6 flex flex-col items-center justify-center min-h-[160px] mt-4">
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
              <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <p className="text-[15px] font-bold text-gray-800 mb-5 break-keep">상세 내용을 확인하려면 로그인해주세요</p>
                <button
                  onClick={() => setIsLoggedIn(true)}
// MISSING LINE 661
// MISSING LINE 662
// MISSING LINE 663
// MISSING LINE 664
// MISSING LINE 665
// MISSING LINE 666
// MISSING LINE 667
// MISSING LINE 668
// MISSING LINE 669
// MISSING LINE 670
// MISSING LINE 671
// MISSING LINE 672
// MISSING LINE 673
// MISSING LINE 674
// MISSING LINE 675
// MISSING LINE 676
// MISSING LINE 677
// MISSING LINE 678
// MISSING LINE 679
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
          )}
        </div>
        {renderSection("🔍", "무의식 업무자세 점검 (10분)", resultData?.checkPoints, isLoggedIn, () => setIsLoggedIn(true))}
      </div>

      {/* Logged in Floating CTAs */}
      {isLoggedIn && quizCompleted && (
        <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] md:max-w-2xl bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl p-1.5 md:p-3 rounded-2xl md:rounded-3xl z-50 flex flex-row items-center justify-between gap-1 md:gap-3 fade-in overflow-x-auto hide-scrollbar">
// MISSING LINE 701
// MISSING LINE 702
// MISSING LINE 703
// MISSING LINE 704
// MISSING LINE 705
// MISSING LINE 706
// MISSING LINE 707
// MISSING LINE 708
// MISSING LINE 709
// MISSING LINE 710
// MISSING LINE 711
// MISSING LINE 712
// MISSING LINE 713
// MISSING LINE 714
        {/* Custom Body Guide Letter Section */}
        <div className="mb-12 last:mb-0 border-b border-gray-100 last:border-0 pb-12 last:pb-0 text-left">
          <h5 className="font-semibold text-sm md:text-base text-gray-500 mb-5 flex items-center gap-2">
            <span className="text-xl">💌</span> 바디 가이드의 따뜻한 시선
          </h5>
          
          {!isLoggedIn ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-6 flex flex-col items-center justify-center min-h-[160px] mt-4">
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
              <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <p className="text-[15px] font-bold text-gray-800 mb-5 break-keep">상세 내용을 확인하려면 로그인해주세요</p>
                <button
                  onClick={() => setIsLoggedIn(true)}
                  className="w-full bg-[#FEE500] text-black text-sm font-semibold px-6 py-3.5 rounded-full shadow-sm hover:bg-[#F4DC00] transition-colors flex items-center justify-center gap-2"
                >
                  <KakaoIcon className="w-5 h-5" />
                  카카오톡 간편 로그인
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col mt-4">
              {(() => {
                const guideData = BODY_GUIDE_DATA[axisCode] || BODY_GUIDE_DATA['ACDZ'];
                const paragraphs = guideData.split('\n\n');
                
                return (
                  <div className="flex flex-col gap-6">
                    {paragraphs.map((paragraph, index) => (
                      <p key={index} className="text-[15px] md:text-[16px] text-gray-700 leading-relaxed break-keep tracking-normal">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
            className="flex flex-col items-center gap-4 max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Story Card (9:16 ratio) */}
            <div
              ref={storyRef}
              style={{
                width: "540px",
                height: "960px",
                background: info.bgGradient,
                fontFamily: "'Pretendard', sans-serif",
              }}
              className="rounded-3xl overflow-hidden relative flex flex-col items-center justify-between p-10 text-white shadow-2xl"
            >
              {/* Top */}
              <div className="text-center z-10">
                <p
                  style={{
                    fontSize: "14px",
                    letterSpacing: "0.3em",
                    opacity: 0.8,
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  MY BODY TYPE IS
                </p>
                <h2
                  style={{
                    fontSize: "72px",
                    fontWeight: 900,
