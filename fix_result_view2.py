import re

with open('src/components/ResultView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import BMTI_RESULTS
if "import { BMTI_RESULTS }" not in content:
    content = content.replace("import { CHARACTERS } from '../data';", "import { CHARACTERS } from '../data';\nimport { BMTI_RESULTS } from '../bmti_results';")

# 2. Add MatchCard and ReportCard component definitions BEFORE ResultView
components = """
const MatchCard = ({ typeTitle, matchText, fallbackText }) => {
  let bmtiCode = fallbackText;
  let pronunciation = '';
  let shortNick = fallbackText;
  let description = '';

  if (matchText) {
    const match = matchText.match(/^.*?\(([A-Z]{4})\):\s*\[(.*?)\]\\s*"(.*?)"\\s*(.*)$/m);
    if (match) {
      bmtiCode = match[1];
      shortNick = match[2];
      description = match[4].replace(/\\n/g, '\\n');
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

  const imgUrl = CHARACTERS[bmtiCode]?.image;

  return (
    <div className="bg-gray-50 p-3 sm:p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-start text-center">
      <p className="text-[10px] sm:text-xs text-gray-400 mb-3 font-semibold tracking-wider">{typeTitle}</p>
      {imgUrl && <img src={imgUrl} alt={bmtiCode} className="w-32 h-32 md:w-48 md:h-48 object-contain mb-4 drop-shadow-md" />}
      <div className="flex flex-col items-center justify-center text-center gap-1">
        <span className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 whitespace-pre-wrap">{bmtiCode}\\n({pronunciation})</span>
        <span className="text-sm sm:text-base md:text-lg font-bold text-gray-800 whitespace-pre-wrap leading-tight mt-2">{shortNick.replace(/ /g, '\\n')}</span>
      </div>
      <p className="text-[11px] sm:text-xs text-gray-500 mt-4 whitespace-pre-wrap leading-relaxed break-keep text-left">{description}</p>
    </div>
  );
};

const ReportCard = ({ emoji, title, children }) => {
  return (
    <div className="mb-12 last:mb-0 border-b border-gray-100 last:border-0 pb-12 last:pb-0">
      <div className="flex flex-col items-start gap-1 mb-6">
        <h5 className="font-bold text-base md:text-lg text-gray-900 flex items-center gap-2">
          <span className="text-2xl">{emoji}</span> {title}
        </h5>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

const renderSubSections = (subSections, isLoggedIn, onLoginClick) => {
  if (!isLoggedIn) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-6 flex flex-col items-center justify-center min-h-[180px] mt-4">
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
    );
  }

  return subSections.map((sec, i) => {
    const parts = sec.split(/:(.*)/s);
    let secTitle = '';
    let secBody = sec;
    if (parts.length > 1 && parts[0].length < 20) {
      secTitle = parts[0].trim();
      secBody = parts[1].trim();
    }
    return (
      <div key={i} className="flex flex-col gap-1.5 mt-2">
        {secTitle && (
          <h6 className="font-bold text-gray-900 text-base md:text-lg">
            {secTitle}
          </h6>
        )}
        <p className="text-base md:text-lg text-gray-700 leading-relaxed break-keep whitespace-pre-line">
          {secBody}
        </p>
      </div>
    );
  });
};
"""
if "const MatchCard =" not in content:
    content = content.replace("const ResultView = ({", components + "\nconst ResultView = ({")

# 3. Inside ResultView, get resultData
if "const resultData = BMTI_RESULTS[bmtiCode];" not in content:
    content = content.replace("const info = BMTI_INFO[bmtiCode];", "const info = BMTI_INFO[bmtiCode];\n  const resultData = BMTI_RESULTS[bmtiCode] || {};")

# 4. Replace Chemistry section
chem_regex = r'\{\/\* Chemistry section \*\/\}.*?<\/div>\s*<\/div>'
match_cards = """{/* Chemistry section */}
          <div className="w-full grid grid-cols-2 gap-2 sm:gap-4 mt-8 mb-4">
            <MatchCard typeTitle="💖 환상의 짝꿍 BMTI" matchText={resultData?.goodMatch} fallbackText={info?.bestMatch} />
            <MatchCard typeTitle="🤔 조금 다른 템포 BMTI" matchText={resultData?.badMatch} fallbackText={info?.diffTempo} />
          </div>
"""
content = re.sub(chem_regex, match_cards, content, flags=re.DOTALL)

# 5. Replace !isLoggedIn logic
unified_report = """{/* Detailed Result Locked CTA */}
      <div className="bg-white border border-gray-200 rounded-[2rem] p-6 md:p-10 shadow-sm mt-8">
        <h4 className="text-2xl font-bold mb-10 text-center text-gray-900">👀나의 운동 심리 이야기</h4>
        
        <ReportCard emoji="🧑‍🏫" title="실패 없는 운동 강사(or 홈트 채널) 고르는 법">
          {resultData?.howToChooseInstructor && (
            <>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-snug break-keep mb-6">
                "{resultData.howToChooseInstructor.subtitle}"
              </h3>
              {renderSubSections(resultData.howToChooseInstructor.subSections, isLoggedIn, () => setIsLoggedIn(true))}
            </>
          )}
        </ReportCard>

        <ReportCard emoji="🏃‍♂️" title="작심삼일 탈출! 내가 운동을 그만두는 진짜 이유">
          {resultData?.whyQuit && (
            <>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-snug break-keep mb-6">
                "{resultData.whyQuit.subtitle}"
              </h3>
              {renderSubSections(resultData.whyQuit.subSections, isLoggedIn, () => setIsLoggedIn(true))}
            </>
          )}
        </ReportCard>

        <ReportCard emoji="⚡️" title="운동 효율 뚝! 나를 지치게 하는 헬스장 최악의 분위기">
          {resultData?.worstVibe && (
            <>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-snug break-keep mb-6">
                "{resultData.worstVibe.subtitle}"
              </h3>
              {renderSubSections(resultData.worstVibe.subSections, isLoggedIn, () => setIsLoggedIn(true))}
            </>
          )}
        </ReportCard>

        <ReportCard emoji="🔍" title="무의식 업무자세 점검 (10분)">
          {resultData?.checkPoints && (
            <>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-snug break-keep mb-6">
                "{resultData.checkPoints.subtitle}"
              </h3>
              {renderSubSections(resultData.checkPoints.subSections, isLoggedIn, () => setIsLoggedIn(true))}
            </>
          )}
        </ReportCard>
      </div>"""

blocks_regex = r'\{!isLoggedIn \? \(\s*\/\* Detailed Result Locked CTA \*\/.*?\)\s*:\s*\(\s*\/\* Full Result Rendered when logged in \*\/.*?<\/div>\s*\)\}'
content = re.sub(blocks_regex, unified_report, content, flags=re.DOTALL)

with open('src/components/ResultView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
