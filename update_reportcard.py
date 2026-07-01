import re

with open('src/components/ResultView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_report_card = '''const ReportCard = ({ emoji, title, subtitle, children }) => {
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
};'''

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
};'''

content = content.replace(old_report_card, new_report_card)

# Now we need to remove the isLoggedIn check around the container
# Find the start of the isLoggedIn block:
#           {!isLoggedIn ? (
#             <div className="bg-[#fcfcfc] border border-gray-200 rounded-[2rem] p-8 md:p-10 text-center shadow-sm">
# ...
#             </div>
#           ) : (
#             <div className="fade-in bg-white border border-gray-200 rounded-[2rem] p-6 md:p-10 shadow-sm">
#               <h4 className="text-2xl font-bold mb-8 text-center text-gray-900">👀나의 운동 심리 이야기</h4>

regex = r'\{!isLoggedIn \? \(\s*<div className="bg-\[#fcfcfc\] border border-gray-200 rounded-\[2rem\] p-8 md:p-10 text-center shadow-sm">.*?카카오톡으로 간편 로그인/회원가입\s*</button>\s*</div>\s*\) : \(\s*<div className="fade-in bg-white border border-gray-200 rounded-\[2rem\] p-6 md:p-10 shadow-sm">'
content = re.sub(regex, '<div className="fade-in bg-white border border-gray-200 rounded-[2rem] p-6 md:p-10 shadow-sm mt-8">', content, flags=re.DOTALL)

# And remove the closing )} for the isLoggedIn block
# We can find where the ReportCards end and remove the `)}` before `{/* Logged in Floating CTAs */}`
end_regex = r'\}\)\(\)\}\s*</div>\s*</div>\s*\)\}'
content = re.sub(end_regex, '})()}\n              </div>\n            </div>', content)

# Finally, pass isLoggedIn and setIsLoggedIn to all ReportCard instances
content = content.replace('<ReportCard', '<ReportCard isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}')

with open('src/components/ResultView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
