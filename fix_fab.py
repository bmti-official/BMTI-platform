import re

with open('src/components/ResultView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add isFabOpen state
if 'const [isFabOpen, setIsFabOpen] = useState(false);' not in content:
    content = content.replace('const [urlCopied, setUrlCopied] = useState(false);',
                              'const [urlCopied, setUrlCopied] = useState(false);\n  const [isFabOpen, setIsFabOpen] = useState(false);')

# Replace the floating CTAs section
old_cta_block = """      {/* Logged in Floating CTAs */}
      {isLoggedIn && quizCompleted && (
        <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] md:max-w-2xl bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl p-1.5 md:p-3 rounded-2xl md:rounded-3xl z-50 flex flex-row items-center justify-between gap-1 md:gap-3 fade-in overflow-x-auto hide-scrollbar">
          <button
            id="kakao-share-bottom"
            onClick={() => alert('카카오톡 공유가 완료되었습니다.')}
            className="flex-1 bg-[#FEE500] text-black py-2.5 md:py-3 px-1 md:px-4 rounded-xl md:rounded-2xl text-[10px] sm:text-xs md:text-sm font-bold shadow-sm hover:bg-[#F4DC00] hover:-translate-y-0.5 transition-transform flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 whitespace-nowrap"
          >
            <KakaoIcon className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            <span>친구에게 카톡 공유</span>
          </button>
          <button
            id="bodyscan-bottom"
            onClick={() => setView('bodyscan')}
            className="flex-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white py-2.5 md:py-3 px-1 md:px-4 rounded-xl md:rounded-2xl text-[10px] sm:text-xs md:text-sm font-bold shadow-sm hover:-translate-y-0.5 transition-transform flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 whitespace-nowrap"
          >
            <span className="text-base md:text-lg leading-none">📸</span>
            <span>무너진 자세 측정</span>
          </button>
          <button
            id="go-to-community-bottom"
            onClick={() => setView('board')}
            className="flex-1 bg-[#FF6B6B] text-white py-2.5 md:py-3 px-1 md:px-4 rounded-xl md:rounded-2xl text-[10px] sm:text-xs md:text-sm font-bold shadow-sm hover:bg-[#FF5252] hover:-translate-y-0.5 transition-transform flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 whitespace-nowrap"
          >
            <span className="text-base md:text-lg leading-none">💌</span>
            <span>BMTI 과몰입 커뮤</span>
          </button>
          <button
            id="go-to-bodycheck-bottom"
            onClick={() => setView('bodycheck')}
            className="flex-1 bg-black text-[#c0ff00] py-2.5 md:py-3 px-1 md:px-4 rounded-xl md:rounded-2xl text-[10px] sm:text-xs md:text-sm font-bold shadow-sm hover:bg-gray-800 hover:-translate-y-0.5 transition-transform flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 whitespace-nowrap"
          >
            <span className="text-base md:text-lg leading-none">☘️</span>
            <span>전문가 코칭상담</span>
          </button>
          <button
            id="retake-quiz-bottom"
            onClick={() => setShowConfirm(true)}
            className="flex-1 bg-white text-black border border-gray-200 py-2.5 md:py-3 px-1 md:px-4 rounded-xl md:rounded-2xl text-[10px] sm:text-xs md:text-sm font-bold shadow-sm hover:bg-gray-50 hover:-translate-y-0.5 transition-transform flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 whitespace-nowrap"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>다시 검사하기</span>
          </button>
        </div>
      )}"""

new_cta_block = """      {/* Logged in Floating FAB */}
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
              onClick={() => { setView('bodyscan'); setIsFabOpen(false); }}
              className="pointer-events-auto bg-white text-black px-5 py-3 rounded-full font-bold shadow-xl border border-gray-100 hover:bg-gray-50 flex items-center justify-center gap-2 whitespace-nowrap transition-transform active:scale-95"
            >
              <span className="text-lg leading-none">📸</span>
              <span className="text-sm">무너진 자세 측정</span>
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
              onClick={() => { setShowConfirm(true); setIsFabOpen(false); }}
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
      )}"""

if old_cta_block in content:
    content = content.replace(old_cta_block, new_cta_block)
else:
    print("Could not find the CTA block to replace.")

with open('src/components/ResultView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
