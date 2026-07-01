import re

with open('src/components/ResultView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

with open('extracted_constants.js', 'r', encoding='utf-8') as f:
    constants_content = f.read()

# 1. Inject constants before const ResultView = ...
if 'const QUIT_REASON_DATA' not in content:
    content = content.replace('const ResultView =', constants_content + '\n\nconst ResultView =')

# 2. Restore Quote Style
quote_style = '''                  <>
                    {/* First Paragraph (Fact) */}
                    <p className="text-[15px] md:text-[16px] text-gray-700 leading-relaxed break-keep tracking-normal whitespace-pre-line">
                      {paragraphs[0]}
                    </p>
                    
                    {/* Second Paragraph (Cheering/Comfort Quote) */}
                    {paragraphs.length > 1 && (
                      <div className="bg-[#FDFBF7] border-l-4 border-[#FF6B6B] p-5 md:p-6 rounded-r-xl md:rounded-r-2xl shadow-sm mt-4">
                        <p className="text-[15px] md:text-[16px] text-gray-800 font-medium leading-relaxed break-keep tracking-normal whitespace-pre-line">
                          {paragraphs.slice(1).join('\\n\\n')}
                        </p>
                      </div>
                    )}
                  </>'''

plain_style = r'''                  <>
                    \{paragraphs\.map\(\(paragraph, index\) => \(
                      <p key=\{index\} className="text-\[15px\] md:text-\[16px\] text-gray-700 leading-relaxed break-keep tracking-normal whitespace-pre-line">
                        \{paragraph\}
                      </p>
                    \)\)\}
                  </>'''

content = re.sub(plain_style, quote_style, content, flags=re.DOTALL)

with open('src/components/ResultView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

