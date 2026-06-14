const KakaoIcon = ({ className = "w-3.5 h-3.5 fill-current" }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
  </svg>
);

const Navbar = ({ currentView, setView, isLoggedIn, setIsLoggedIn, userProfile, bmtiCode }) => {
  const tabs = [
    { id: 'home', label: '홈' },
    { id: 'result', label: '결과지' },
    { id: 'board', label: '커뮤니티' },
    { id: 'ticket', label: '🎟️ 플리 티켓' },
    { id: 'lab', label: 'BMTI 플리 연구소🧪' }
  ];

  return (
    <nav id="main-nav" className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-40 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-auto md:h-20 py-3 md:py-0 flex flex-wrap md:flex-nowrap items-center justify-between relative gap-y-3">
        {/* Logo */}
        <div
          className="cursor-pointer flex items-baseline gap-2 z-10"
          onClick={() => setView('home')}
        >
          <span className="text-xl md:text-2xl font-serif font-bold tracking-tight">BMTI</span>
          <span className="text-xs md:text-sm font-sans font-medium text-gray-400">자기점검 50</span>
        </div>

        {/* Center Navigation Tabs */}
        <div className="w-full md:w-auto order-3 md:order-none flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2 z-0">
          <div className="bg-gray-100/80 backdrop-blur-lg border border-gray-200/50 rounded-full p-1 flex gap-1 items-center shadow-sm">
            {tabs.map(tab => (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setView(tab.id)}
                className={`px-5 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
                  currentView === tab.id
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-500 hover:text-black hover:bg-gray-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Login */}
        <div className="flex text-xs md:text-sm font-medium items-center gap-3 md:gap-4 z-10 order-2 md:order-none">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              {userProfile && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-black">{userProfile.nickname}</span>
                  {bmtiCode && (
                    <span className="text-[10px] font-bold bg-[#c0ff00] px-2 py-0.5 rounded-full text-black border border-[#9BB31B]/30">
                      {bmtiCode.split('-')[0]}
                    </span>
                  )}
                </div>
              )}
              <div
                className="font-bold text-gray-600 hover:text-black border border-gray-200 hover:border-gray-300 px-4 py-1.5 rounded-full transition-colors cursor-pointer"
                onClick={() => setIsLoggedIn(false)}
              >
                로그아웃
              </div>
            </div>
          ) : (
            <div
              id="login-button"
              className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors cursor-pointer"
              onClick={() => setIsLoggedIn(true)}
            >
              <div className="w-5 h-5 bg-[#FEE500] rounded-full flex items-center justify-center">
                <KakaoIcon className="w-3 h-3 fill-black" />
              </div>
              <span className="hidden sm:inline">카카오톡 간편 로그인/회원가입</span>
              <span className="sm:hidden">로그인</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
