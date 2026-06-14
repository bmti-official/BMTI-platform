import { useState, useRef, useEffect } from 'react';

const TicketView = ({ isLoggedIn, bmtiCode, setView, onRequireLogin }) => {
  const [progress, setProgress] = useState(3); // 3/5 active
  const [verified, setVerified] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [canvasDataUrl, setCanvasDataUrl] = useState(null);
  const [animatingIdx, setAnimatingIdx] = useState(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const remaining = 5 - progress;

  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Draw on canvas with watermark
        const canvas = canvasRef.current;
        const maxW = 800;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');

        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Semi-transparent overlay strip at bottom
        const stripH = canvas.height * 0.1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, canvas.height - stripH, canvas.width, stripH);

        // Watermark text
        const fontSize = Math.max(14, canvas.width * 0.028);
        ctx.font = `bold ${fontSize}px 'Pretendard', sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `[O/C 유형] 다정한 센터 안정화 ${progress + 1}일 차 완료 — ${dateStr}`,
          canvas.width / 2,
          canvas.height - stripH / 2
        );

        // Small BMTI branding
        ctx.font = `${fontSize * 0.6}px 'Pretendard', sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('BMTI 플리 티켓 인증', canvas.width / 2, canvas.height - stripH / 2 + fontSize * 1.1);

        setCanvasDataUrl(canvas.toDataURL('image/jpeg', 0.92));
        setVerified(true);

        // Animate gauge after short delay
        setTimeout(() => {
          setAnimatingIdx(progress);
          setProgress(prev => Math.min(prev + 1, 5));
        }, 600);

        // Show toast
        setTimeout(() => {
          setShowToast(true);
        }, 1200);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);

    // Reset input so re-selecting same file works
    e.target.value = '';
  };

  // Auto-hide toast
  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(t);
  }, [showToast]);

  // Clear animation index
  useEffect(() => {
    if (animatingIdx === null) return;
    const t = setTimeout(() => setAnimatingIdx(null), 800);
    return () => clearTimeout(t);
  }, [animatingIdx]);

  if (!bmtiCode) {
    return (
      <div className="min-h-screen pt-44 pb-40 px-6 flex flex-col items-center justify-center text-center fade-in max-w-md mx-auto">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-200">
          <span className="text-3xl">🎟️</span>
        </div>
        <h2 className="text-2xl font-serif font-bold mb-4">플리 티켓 활성화 대기 중</h2>
        <p className="text-gray-500 mb-8 break-keep leading-relaxed text-sm md:text-base">
          설문을 완료하고 결과지를 분석 받은 후, 카카오톡 로그인을 하시면 플리 티켓 기능을 이용하실 수 있습니다.
        </p>
        <button
          onClick={() => setView('quiz')}
          className="bg-black text-white px-8 py-3.5 rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 w-full md:w-auto"
        >
          설문하러 가기
        </button>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen pt-44 pb-40 px-6 flex flex-col items-center justify-center text-center fade-in max-w-md mx-auto">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-200">
          <span className="text-3xl">🎟️</span>
        </div>
        <h2 className="text-2xl font-serif font-bold mb-4">로그인이 필요합니다</h2>
        <p className="text-gray-500 mb-8 break-keep leading-relaxed text-sm md:text-base">
          플리 티켓 인증을 위해 카카오톡으로 간편하게 로그인해 주세요.
        </p>
        <button
          onClick={() => onRequireLogin && onRequireLogin()}
          className="bg-[#FEE500] text-[#000000] text-base font-semibold px-8 py-3.5 rounded-full shadow hover:bg-[#F4DC00] transition-all duration-300 w-full md:w-auto flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
          </svg>
          카카오톡 로그인/회원가입
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-44 pb-40 px-4 md:px-6 max-w-2xl mx-auto fade-in">
      {/* Hidden canvas for watermarking */}
      <canvas ref={canvasRef} className="hidden" />
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ===== Progress Section (Horizontal) ===== */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left text-sm text-gray-700 leading-relaxed break-keep">
          {remaining > 0 ? (
            <>
              이번 주 <strong className="text-black">{remaining}번</strong>만 더 인증하면,<br className="sm:hidden" />
              나만의 <strong className="text-[#9BB31B]">[10분 맞춤 플리]</strong>를 신청할 수 있어요!
            </>
          ) : (
            <>
              🎉 <strong className="text-[#9BB31B]">축하해요!</strong> 이번 주 인증 완료!<br className="sm:hidden" />
              나만의 <strong className="text-[#9BB31B]">[10분 맞춤 플리]</strong>를 신청해 보세요!
            </>
          )}
        </div>

        <div className="flex flex-col items-center flex-shrink-0">
          {/* Ticket gauge icons */}
          <div className="flex justify-center gap-1.5 md:gap-2 mb-1.5">
            {[0, 1, 2, 3, 4].map(idx => {
              const isActive = idx < progress;
              const isAnimating = idx === animatingIdx;
              return (
                <div
                  key={idx}
                  className={`
                    w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-sm md:text-base
                    transition-all duration-500 ease-out
                    ${isActive
                      ? 'bg-[#c0ff00] border border-[#9BB31B]/40 shadow-sm shadow-[#c0ff00]/30'
                      : 'bg-gray-100 border border-gray-200 text-gray-300'
                    }
                    ${isAnimating ? 'scale-125 animate-bounce' : ''}
                  `}
                >
                  {isActive ? '🎟️' : '🎵'}
                </div>
              );
            })}
          </div>
          <span className="text-[10px] font-bold text-gray-400 tracking-wider">{progress} / 5 완료</span>
        </div>
      </div>

      {/* ===== Mission Card / Verified Photo ===== */}
      {!verified ? (
        /* Mission Card */
        <div className="bg-white border border-gray-100 rounded-3xl p-8 md:p-10 shadow-sm mb-6">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs md:text-sm font-bold px-4 py-1.5 rounded-full">
              🌿 O/C 유형을 위한 미션
            </span>
          </div>

          {/* Main mission text */}
          <h2 className="text-center text-xl md:text-2xl font-bold text-gray-900 leading-relaxed mb-6 break-keep">
            오늘은 매트 위에서<br />내 호흡 소리 10번 듣기
          </h2>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-gray-300 text-xs font-bold">TIP</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          {/* Sub text */}
          <p className="text-center text-sm text-gray-400 leading-relaxed break-keep">
            가벼운 환경(사물) 인증만으로 충분해요!<br />
            땀 흘리는 얼굴 대신, 깔아둔 매트나<br />
            천장 뷰를 찍어주세요.
          </p>
        </div>
      ) : (
        /* Verified Polaroid Photo */
        <div className="flex flex-col items-center mb-6 fade-in">
          <div className="bg-white p-3 md:p-4 rounded-2xl shadow-xl border border-gray-100 rotate-[-1deg] hover:rotate-0 transition-transform duration-500">
            <img
              src={canvasDataUrl}
              alt="인증 완료"
              className="rounded-xl max-w-full"
              style={{ maxHeight: '420px', objectFit: 'contain' }}
            />
            <div className="mt-3 text-center">
              <p className="text-sm font-bold text-gray-800">✅ 오늘의 미션 인증 완료!</p>
              <p className="text-xs text-gray-400 mt-1">{dateStr} · {progress}일 차</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== Bottom CTA Button ===== */}
      <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-40 pointer-events-none">
        {!verified ? (
          <button
            id="mission-verify-btn"
            onClick={handleButtonClick}
            className="pointer-events-auto bg-black text-white text-base md:text-lg font-bold px-10 py-4 md:py-5 rounded-full shadow-2xl shadow-black/25 hover:bg-gray-800 hover:scale-[1.03] active:scale-95 transition-all duration-300 flex items-center gap-2"
          >
            <span className="text-xl">📷</span>
            오늘의 미션 사진 1초 인증하기
          </button>
        ) : (
          <button
            id="mission-done-btn"
            onClick={() => {
              setVerified(false);
              setCanvasDataUrl(null);
            }}
            className="pointer-events-auto bg-white text-gray-600 border border-gray-200 text-sm font-bold px-8 py-3.5 rounded-full shadow-lg hover:bg-gray-50 transition-all duration-300"
          >
            다른 미션 인증하기
          </button>
        )}
      </div>

      {/* ===== Toast Notification ===== */}
      {showToast && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 fade-in">
          <div className="bg-black/90 backdrop-blur-lg text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-medium">
            <span className="text-lg">🎉</span>
            <span className="break-keep">인증 완료! 5개를 모두 모아 맞춤 플리를 신청해 보세요.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketView;
