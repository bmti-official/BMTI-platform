import { useState, useRef, useEffect } from 'react';

const TicketView = () => {
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

  return (
    <div className="min-h-screen pt-32 pb-40 px-4 md:px-6 max-w-2xl mx-auto fade-in">
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

      {/* ===== Progress Section ===== */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm mb-6">
        <p className="text-center text-base md:text-lg text-gray-700 mb-6 leading-relaxed break-keep" style={{ fontFamily: "'Pretendard', sans-serif" }}>
          {remaining > 0 ? (
            <>
              이번 주 <strong className="text-black">{remaining}번</strong>만 더 인증하면,<br />
              나만의 <strong className="text-[#9BB31B]">[10분 맞춤 플리]</strong>를 신청할 수 있어요!
            </>
          ) : (
            <>
              🎉 <strong className="text-[#9BB31B]">축하해요!</strong> 이번 주 인증을 모두 완료했어요!<br />
              나만의 <strong className="text-[#9BB31B]">[10분 맞춤 플리]</strong>를 신청해 보세요!
            </>
          )}
        </p>

        {/* Ticket gauge icons */}
        <div className="flex justify-center gap-3 md:gap-5">
          {[0, 1, 2, 3, 4].map(idx => {
            const isActive = idx < progress;
            const isAnimating = idx === animatingIdx;
            return (
              <div
                key={idx}
                className={`
                  w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl md:text-2xl
                  transition-all duration-500 ease-out
                  ${isActive
                    ? 'bg-[#c0ff00] border-2 border-[#9BB31B]/40 shadow-md shadow-[#c0ff00]/30'
                    : 'bg-gray-100 border-2 border-gray-200 text-gray-300'
                  }
                  ${isAnimating ? 'scale-125 animate-bounce' : ''}
                `}
              >
                {isActive ? '🎟️' : '🎵'}
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <span className="text-xs font-bold text-gray-400 tracking-wider">{progress} / 5 완료</span>
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
