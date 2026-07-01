import re

with open('src/components/ResultView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update MatchCard internal layout
content = re.sub(
    r'<img src=\{imgUrl\}.*?className="w-32 h-32 md:w-40 md:h-40 object-contain mb-4 drop-shadow-md" />\s*<div className="flex flex-row items-center justify-center flex-wrap gap-1 md:gap-1\.5 whitespace-nowrap">\s*<span className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">\{bmtiCode\}</span>\s*<span className="text-xs sm:text-sm text-gray-400 font-medium">\(\{pronunciation\}\)</span>\s*<span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 ml-0\.5">\{shortNick\}</span>\s*</div>',
    '''<img src={imgUrl} alt={bmtiCode} className="w-24 h-24 md:w-32 md:h-32 object-contain mb-3 drop-shadow-md" />
              <div className="flex flex-col items-center justify-center text-center gap-1">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">{bmtiCode}</span>
                  <span className="text-xs sm:text-sm text-gray-400 font-medium">({pronunciation})</span>
                </div>
                <span className="text-base sm:text-lg md:text-xl font-bold text-gray-800 whitespace-pre-wrap leading-tight">{shortNick}</span>
              </div>''',
    content
)

# 2. Update MatchCard container grid
content = re.sub(
    r'<div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">',
    '<div className="w-full grid grid-cols-2 gap-2 sm:gap-4 mt-2">',
    content
)

# 3. Define the new ReportCard that takes isLoggedIn
old_report_card = r'''const ReportCard = \(\{ emoji, title, subtitle, accentColor, accentBg, children \}\) => \{
  return \(
    <div className="border border-gray-100 rounded-\[2rem\] overflow-hidden shadow-sm bg-white mb-6">
      <div className=\{`p-6 md:p-8 flex flex-col gap-4 \$\{accentBg\}`\}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0">
            \{emoji\.slice\(0, 2\)\}
          </div>
          <h5 className="font-bold text-gray-900 text-lg md:text-xl leading-snug tracking-tight">\{title\}</h5>
        </div>
        \{subtitle && \(
          <div className="mt-1">
            <p className="text-\[15px\] md:text-base text-gray-800 break-keep leading-relaxed font-bold bg-white/70 p-4 rounded-2xl border border-white/50 shadow-sm">
              "\{subtitle\}"
            </p>
          </div>
        \)\}
      </div>
      <div className="p-6 md:p-8 bg-white space-y-4">
        \{children\}
      </div>
    </div>
  \);
\};'''

new_report_card = '''const ReportCard = ({ emoji, title, subtitle, isLoggedIn, setIsLoggedIn, children }) => {
  return (
    <div className="mb-12 last:mb-0 border-b border-gray-100 last:border-0 pb-12 last:pb-0">
      <div className="flex flex-col items-center justify-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="text-lg">{emoji}</span>
          <h5 className="font-bold text-sm md:text-base">{title}</h5>
        </div>
        {isLoggedIn && subtitle && (
          <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-snug break-keep text-center mt-4">
            "{subtitle}"
          </h3>
        )}
      </div>
      
      {isLoggedIn ? (
        <div className="space-y-6 mt-4">
          {children}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-3xl p-6 md:p-8 text-center border border-gray-200 relative overflow-hidden mt-6 shadow-sm">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <p className="text-gray-700 font-bold mb-6 text-sm md:text-base leading-relaxed">
            나의 상세한 운동 심리와 꿀팁을 확인하려면<br className="hidden sm:block"/>
            카카오톡으로 간편하게 시작해보세요.
          </p>
          <button
            onClick={() => setIsLoggedIn(true)}
            className="bg-[#FEE500] text-[#000000] text-sm md:text-base font-bold px-6 py-3 rounded-full shadow hover:bg-[#F4DC00] transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <KakaoIcon className="w-5 h-5 fill-current" />
            카카오톡 간편 로그인/회원가입
          </button>
        </div>
      )}
    </div>
  );
};

const renderSubSections = (subSections) => {
  return subSections.map((sec, i) => {
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
};'''

content = re.sub(old_report_card, new_report_card, content)

# 4. Remove the `!isLoggedIn` wrapper entirely
# We want to replace:
#           {!isLoggedIn ? (
#             <div className="bg-[#fcfcfc] ...">...</div>
#           ) : (
#             <div className="fade-in bg-white ...">
#               <h4 className="text-2xl font-bold mb-2 text-center text-gray-900">상세 분석 리포트</h4>
#               <p className="text-sm text-gray-400 text-center mb-8">로그인 전용 프리미엄 콘텐츠</p>
# WITH:
#           <div className="fade-in bg-white border border-gray-200 rounded-[2rem] p-6 md:p-10 shadow-sm mt-8">
#               <h4 className="text-2xl font-bold mb-8 text-center text-gray-900">👀나의 운동 심리 이야기</h4>

wrapper_regex = r'\{\!isLoggedIn \? \(\s*<div className="bg-\[\#fcfcfc\].*?</button>\s*</div>\s*\) : \(\s*<div className="fade-in bg-white border border-gray-200 rounded-\[2rem\] p-6 md:p-10 shadow-sm">\s*<h4 className="text-2xl font-bold mb-2 text-center text-gray-900">상세 분석 리포트</h4>\s*<p className="text-sm text-gray-400 text-center mb-8">로그인 전용 프리미엄 콘텐츠</p>'
content = re.sub(wrapper_regex, '<div className="fade-in bg-white border border-gray-200 rounded-[2rem] p-6 md:p-10 shadow-sm mt-8">\n              <h4 className="text-2xl font-bold mb-8 text-center text-gray-900">👀나의 운동 심리 이야기</h4>', content, flags=re.DOTALL)

# 5. Remove the trailing `)}` that closed the `isLoggedIn` condition
# Look for the last `})()}` in `checkPoints`, and remove the `</div> </div> )}`
end_regex = r'(\{\s*resultData\.checkPoints && \(\(\) => \{[\s\S]*?\}\)\(\)\}\s*</div>\s*)</div>\s*\)\}'
content = re.sub(end_regex, r'\1</div>', content)

# 6. Replace children of ReportCard with `renderSubSections`
# and add `isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}`

# howToChooseInstructor
content = re.sub(r'(<ReportCard[^>]*?title="실패 없는 운동 강사 고르는 법"[^>]*?>)\s*\{subSections\.map\(\(sec, i\) => \{.*?\n\s*\}\)\}\s*(</ReportCard>)', r'\1\n                      {renderSubSections(subSections)}\n                    \2', content, flags=re.DOTALL)

# whyQuit
content = re.sub(r'(<ReportCard[^>]*?title="내가 자꾸 운동을 때려치우는 진짜 이유"[^>]*?>)\s*\{subSections\.map\(\(sec, i\) => \{.*?\n\s*\}\)\}\s*(</ReportCard>)', r'\1\n                      {renderSubSections(subSections)}\n                    \2', content, flags=re.DOTALL)

# worstVibe
content = re.sub(r'(<ReportCard[^>]*?title="나의 멘탈을 바사삭 부수는 \'최악의 운동 분위기\'"[^>]*?>)\s*\{subSections\.map\(\(sec, i\) => \{.*?\n\s*\}\)\}\s*(</ReportCard>)', r'\1\n                      {renderSubSections(subSections)}\n                    \2', content, flags=re.DOTALL)

# checkPoints
content = re.sub(r'(<ReportCard[^>]*?title="당장 확인해야 할 나의 점검 포인트"[^>]*?>)\s*<div className="p-6 rounded-2xl bg-blue-50/30 border border-blue-100">\s*<p className="text-\[15px\] text-gray-800 leading-\[1\.8\] break-keep whitespace-pre-line font-medium">\{bodyText\}</p>\s*</div>\s*(</ReportCard>)', r'\1\n                      {renderSubSections([bodyText])}\n                    \2', content, flags=re.DOTALL)

# add isLoggedIn props to ReportCard
content = re.sub(r'<ReportCard(\s)', r'<ReportCard isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}\1', content)

with open('src/components/ResultView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
