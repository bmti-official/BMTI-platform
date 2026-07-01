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

# 3. Update "상세 분석 리포트" and remove "로그인 전용 프리미엄 콘텐츠"
content = re.sub(
    r'<h4 className="text-2xl font-bold mb-2 text-center text-gray-900">상세 분석 리포트</h4>\s*<p className="text-sm text-gray-400 text-center mb-8">로그인 전용 프리미엄 콘텐츠</p>',
    '<h4 className="text-2xl font-bold mb-8 text-center text-gray-900">👀나의 운동 심리 이야기</h4>',
    content
)

# 4. Redefine ReportCard component
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

new_report_card = '''const ReportCard = ({ emoji, title, subtitle, children }) => {
  return (
    <div className="mb-12 last:mb-0 border-b border-gray-100 last:border-0 pb-12 last:pb-0">
      <div className="flex flex-col items-center justify-center gap-3 mb-8">
        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="text-lg">{emoji}</span>
          <h5 className="font-bold text-sm md:text-base">{title}</h5>
        </div>
        {subtitle && (
          <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-snug break-keep text-center">
            "{subtitle}"
          </h3>
        )}
      </div>
      <div className="space-y-6">
        {children}
      </div>
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

# Now we need to replace the children of ReportCard invocations with renderSubSections(subSections)
# Let's replace the .map() inside each ReportCard invocation.
def replace_map_block(match):
    # This matches the {subSections.map(...)} block inside ReportCard
    return "{renderSubSections(subSections)}"

# For howToChooseInstructor
content = re.sub(r'\{subSections\.map\(\(sec, i\) => \{.*?\n\s*\}\)\}', '{renderSubSections(subSections)}', content, flags=re.DOTALL)


with open('src/components/ResultView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

