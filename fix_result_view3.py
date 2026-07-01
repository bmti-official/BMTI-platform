import re

with open('src/components/ResultView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove ReportCard component
content = re.sub(r'const ReportCard =.*?\{\s*children\s*\}\s*<\/div>\s*<\/div>\s*\);\s*\};', '', content, flags=re.DOTALL)

# Re-define renderSubSections and parseReportSection
new_helper = """
const parseReportSection = (text) => {
  if (!text) return { subtitle: '', subSections: [] };
  if (typeof text === 'object') return text;
  const lines = text.split('\\n\\n').filter(Boolean);
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
  );
};
"""
# Replace old renderSubSections and parseReportSection
content = re.sub(r'const parseReportSection =.*?\};\n', new_helper, content, flags=re.DOTALL)
content = re.sub(r'const renderSubSections =.*?\}\);\n\};', '', content, flags=re.DOTALL)

# Replace the unified report section
unified_report = """{/* Detailed Result Locked CTA */}
      <div className="bg-white border border-gray-200 rounded-[2rem] p-6 md:p-10 shadow-sm mt-8">
        <h4 className="text-2xl font-bold mb-10 text-center text-gray-900">👀나의 운동 심리 이야기</h4>
        
        {renderSection("🧑‍🏫", "실패 없는 운동 강사(or 홈트 채널) 고르는 법", resultData?.howToChooseInstructor, isLoggedIn, () => setIsLoggedIn(true))}
        {renderSection("🏃‍♂️", "작심삼일 탈출! 내가 운동을 그만두는 진짜 이유", resultData?.whyQuit, isLoggedIn, () => setIsLoggedIn(true))}
        {renderSection("⚡️", "운동 효율 뚝! 나를 지치게 하는 헬스장 최악의 분위기", resultData?.worstVibe, isLoggedIn, () => setIsLoggedIn(true))}
        {renderSection("🔍", "무의식 업무자세 점검 (10분)", resultData?.checkPoints, isLoggedIn, () => setIsLoggedIn(true))}
      </div>"""

blocks_regex = r'\{\/\* Detailed Result Locked CTA \*\/\}.*?<\/div>'
content = re.sub(blocks_regex, unified_report, content, flags=re.DOTALL)

with open('src/components/ResultView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
