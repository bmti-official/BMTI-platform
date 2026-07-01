import { useState, useRef, useEffect } from 'react';
import TermsModal from './TermsModal';

// ===== 상태 관리 데이터 =====
// 사용자의 BMTI 축(1,2번째 글자)에 따른 유형 매핑
const getBmtiType = (code) => {
  if (!code) return 'O/C';
  const axis = code.split('-')[0]; // e.g. "OCDM" -> "OCDM"
  const first = axis[0]; // O or A
  const second = axis[1]; // C or L
  return `${first}/${second}`;
};

// 4가지 BMTI 유형별 오늘의 미션 데이터
const MISSIONS = {
  'O/C': {
    badge: '🌿 O/C 유형을 위한 미션',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    mission: '오늘은 매트 위에서\n내 호흡 소리 10번 듣기',
    tip: '가벼운 환경(사물) 인증만으로 충분해요!\n깔아둔 매트나 천장 뷰를 찍어주세요.',
  },
  'O/L': {
    badge: '🌊 O/L 유형을 위한 미션',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    mission: '오늘은 5분 동안\n전신 스트레칭하며 몸 풀기',
    tip: '스트레칭 전후 매트 사진이나\n운동복 셀카를 찍어주세요.',
  },
  'A/C': {
    badge: '🔥 A/C 유형을 위한 미션',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    mission: '오늘은 플랭크 30초\n3세트 도전하기',
    tip: '타이머 스크린샷이나\n운동 장소 사진을 찍어주세요.',
  },
  'A/L': {
    badge: '⚡ A/L 유형을 위한 미션',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    mission: '오늘은 집 주변\n10분 가볍게 걷기',
    tip: '걸으면서 본 풍경이나\n운동화 사진을 찍어주세요.',
  },
};

const TicketView = ({ isLoggedIn, bmtiCode, setView, onRequireLogin }) => {
  // 사용자 BMTI 유형 결정
  const userBMTI = getBmtiType(bmtiCode);
  const missionData = MISSIONS[userBMTI] || MISSIONS['O/C'];

  // 상태 관리
  const [weeklyCount, setWeeklyCount] = useState(0); // 주간 인증 횟수 (기본 0, 목표 5)
  const [companionCount, setCompanionCount] = useState(124); // 오늘 완료한 동지 수
  const [verified, setVerified] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [oneLiner, setOneLiner] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [isWithinTime, setIsWithinTime] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [animatingIdx, setAnimatingIdx] = useState(null);
  const [canvasDataUrl, setCanvasDataUrl] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const remaining = 5 - weeklyCount;
  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

  // 시간 제한 체크 (19:00 ~ 22:00)
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const withinTime = hour >= 19 && hour < 22;
      setIsWithinTime(withinTime);
      if (!withinTime && !verified) {
        setAlertMsg('⏰ 오늘의 인증은 19:00부터 22:00까지만 가능합니다.');
      } else if (!verified) {
        setAlertMsg('');
      }
    };
    checkTime();
    const interval = setInterval(checkTime, 30000); // 30초마다 체크
    return () => clearInterval(interval);
  }, [verified]);

  // Toast 자동 숨김
  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(t);
  }, [showToast]);

  // 애니메이션 인덱스 클리어
  useEffect(() => {
    if (animatingIdx === null) return;
    const t = setTimeout(() => setAnimatingIdx(null), 800);
    return () => clearTimeout(t);
  }, [animatingIdx]);

  const isFormDisabled = !isWithinTime || verified;

  // 사진 선택 핸들러
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 인증 제출 핸들러
  const handleSubmit = () => {
    if (!photoPreview) {
      setAlertMsg('📸 사진을 첨부해 주세요!');
      return;
    }
    if (!agreedToTerms) {
      setAlertMsg('🚨 이용약관 및 개인정보 수집/이용에 동의해 주세요.');
      return;
    }

    // 워터마크 캔버스 생성
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const maxW = 800;
      const scale = img.width > maxW ? maxW / img.width : 1;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const stripH = canvas.height * 0.1;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, canvas.height - stripH, canvas.width, stripH);

      const fontSize = Math.max(14, canvas.width * 0.028);
      ctx.font = `bold ${fontSize}px 'Pretendard', sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `[${userBMTI} 유형] ${weeklyCount + 1}일 차 완료 — ${dateStr}`,
        canvas.width / 2,
        canvas.height - stripH / 2
      );
      ctx.font = `${fontSize * 0.6}px 'Pretendard', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('BMTI 플리 티켓 인증', canvas.width / 2, canvas.height - stripH / 2 + fontSize * 1.1);

      setCanvasDataUrl(canvas.toDataURL('image/jpeg', 0.92));

      // 1) 주간 인증 횟수 +1
      setWeeklyCount(prev => Math.min(prev + 1, 5));
      // 2) 동지 수 +1
      setCompanionCount(prev => prev + 1);
      // 3) 알림 메시지
      setAlertMsg('✅ 인증이 완료되었습니다! 내일 저녁 7시에 다시 만나요.');
      // 4) 폼 disabled (중복 제출 방지)
      setVerified(true);

      // 게이지 애니메이션
      setTimeout(() => {
        setAnimatingIdx(weeklyCount);
      }, 600);

      // 토스트
      setTimeout(() => {
        setShowToast(true);
      }, 1200);
    };
    img.src = photoPreview;
  };

  // ===== 인증 게이트: 설문 미완료 =====
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

  // ===== 인증 게이트: 로그인 미완료 =====
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

  // ===== 메인 렌더링 =====
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
        onChange={handlePhotoSelect}
      />

      {/* ===== 사용자 정보 + 주간 진척도 (가로 배치) ===== */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-xs text-gray-400 font-bold tracking-wider mb-1">나의 BMTI 유형</p>
          <p className="text-lg font-black text-gray-900">{userBMTI} <span className="text-sm font-medium text-gray-400">· {bmtiCode?.split('-')[0]}</span></p>
        </div>

        <div className="flex flex-col items-center flex-shrink-0">
          {/* Ticket gauge icons */}
          <div className="flex justify-center gap-1.5 md:gap-2 mb-1.5">
            {[0, 1, 2, 3, 4].map(idx => {
              const isActive = idx < weeklyCount;
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
          <span className="text-[10px] font-bold text-gray-400 tracking-wider">{weeklyCount} / 5 완료</span>
        </div>
      </div>

      {/* ===== 동기부여(소셜 프루프) ===== */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl px-4 py-3 mb-3 text-center">
        <p className="text-sm text-gray-700 break-keep">
          🔥 현재 <strong className="text-orange-600">{companionCount}명</strong>의 <strong className="text-black">{userBMTI}</strong> 유형 동지들이 오늘의 미션을 완료했습니다!
        </p>
      </div>
      <div className="text-center text-xs text-gray-400 mb-6">
        📌 미션 기간은 <strong className="text-gray-600">매주 월요일 ~ 일요일</strong>이며, 월요일에 초기화됩니다.
      </div>

      {/* ===== 오늘의 미션 카드 / 인증 완료 사진 ===== */}
      {!verified ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-8 md:p-10 shadow-sm mb-6">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className={`inline-block ${missionData.badgeColor} border text-xs md:text-sm font-bold px-4 py-1.5 rounded-full`}>
              {missionData.badge}
            </span>
          </div>

          {/* Main mission text */}
          <h2 className="text-center text-xl md:text-2xl font-bold text-gray-900 leading-relaxed mb-6 break-keep whitespace-pre-line">
            {missionData.mission}
          </h2>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-gray-300 text-xs font-bold">TIP</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          {/* Sub text */}
          <p className="text-center text-sm text-gray-400 leading-relaxed break-keep whitespace-pre-line mb-8">
            {missionData.tip}
          </p>

          {/* ===== 인증 폼 ===== */}
          <div className="space-y-4">
            {/* 사진 업로드 */}
            <div>
              <button
                onClick={() => !isFormDisabled && fileInputRef.current?.click()}
                disabled={isFormDisabled}
                className={`w-full border-2 border-dashed rounded-2xl py-6 flex flex-col items-center justify-center gap-2 transition-all duration-300
                  ${isFormDisabled
                    ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : photoPreview
                      ? 'border-[#9BB31B] bg-[#c0ff00]/10 text-[#9BB31B]'
                      : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-400 hover:bg-gray-100 cursor-pointer'
                  }
                `}
              >
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="미리보기" className="w-24 h-24 object-cover rounded-xl mb-2" />
                    <span className="text-xs font-bold">📸 사진이 첨부되었어요! (탭하여 변경)</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">📷</span>
                    <span className="text-sm font-medium">사진을 업로드해 주세요</span>
                  </>
                )}
              </button>
            </div>

            {/* 한 줄 소감 */}
            <input
              type="text"
              placeholder="오늘의 감각이나 감정을 한 줄로 남겨주세요 (선택)"
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value)}
              disabled={isFormDisabled}
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors
                ${isFormDisabled
                  ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'border-gray-200 bg-white text-gray-800 focus:outline-none focus:border-black'
                }
              `}
            />

            {/* 약관 동의 체크박스 */}
            {!verified && (
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mb-2 px-1">
                <input 
                  type="checkbox" 
                  className="accent-black w-4 h-4 cursor-pointer" 
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  disabled={isFormDisabled}
                />
                <span className={isFormDisabled ? 'text-gray-400' : ''}>
                  [필수] <button type="button" onClick={() => setIsTermsOpen(true)} className={`underline font-bold ${isFormDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900 hover:text-black'}`}>이용약관 및 개인정보 수집/이용</button>에 동의합니다.
                </span>
              </label>
            )}

            {/* 인증 완료 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={isFormDisabled}
              className={`w-full py-4 rounded-2xl text-base font-bold transition-all duration-300
                ${isFormDisabled
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white shadow-lg hover:bg-gray-800 hover:scale-[1.02] active:scale-95'
                }
              `}
            >
              {isFormDisabled && !verified ? '⏰ 인증 가능 시간: 19:00 ~ 22:00' : '📷 인증 완료하기'}
            </button>
          </div>
        </div>
      ) : (
        /* 인증 완료 사진 */
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
              <p className="text-xs text-gray-400 mt-1">{dateStr} · {weeklyCount}일 차</p>
              {oneLiner && (
                <p className="text-xs text-gray-500 mt-2 italic">"{oneLiner}"</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== 알림 메시지 영역 ===== */}
      {alertMsg && (
        <div className={`text-center py-3 px-4 rounded-2xl text-sm font-medium mb-6 break-keep fade-in
          ${verified
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : alertMsg.includes('⏰')
              ? 'bg-amber-50 text-amber-700 border border-amber-100'
              : 'bg-red-50 text-red-600 border border-red-100'
          }
        `}>
          {alertMsg}
        </div>
      )}

      {/* ===== 진척도 메시지 ===== */}
      {remaining > 0 && !verified && (
        <div className="bg-gradient-to-r from-[#f5f9e6] to-[#eef5d6] border-2 border-[#e2edbc] rounded-2xl p-5 text-center mb-6 fade-in">
          <p className="text-base font-bold text-gray-800 break-keep">
            이번 주 <span className="text-[#9BB31B] text-xl">{remaining}번</span>만 더 인증하면,
          </p>
          <p className="text-base font-bold text-[#6b7c30] mt-1 break-keep">
            나만의 <span className="bg-[#c0ff00] text-black px-2 py-0.5 rounded-lg">[10분 맞춤 플리]</span>를 신청할 수 있어요! 🎉
          </p>
        </div>
      )}
      {weeklyCount >= 5 && (
        <div className="text-center text-sm text-[#9BB31B] font-bold break-keep">
          🎉 축하해요! 이번 주 인증을 모두 완료했어요! 나만의 맞춤 플리를 신청해 보세요!
        </div>
      )}

      {/* ===== 이전 미션 기록 ===== */}
      <div className="mt-12 mb-8 text-left w-full fade-in">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>📅</span> 나의 미션 내역<span className="text-sm font-medium text-gray-400">(월요일에 초기화 됩니다!)</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center aspect-[4/5] relative overflow-hidden group cursor-pointer hover:border-gray-300 transition-colors">
            <span className="text-2xl mb-2 opacity-50 group-hover:scale-110 transition-transform">📷</span>
            <p className="text-[10px] md:text-xs font-bold text-gray-400">2026.06.12</p>
            <p className="text-xs md:text-sm font-bold text-gray-700 mt-1">1일 차 완료</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center aspect-[4/5] relative overflow-hidden group cursor-pointer hover:border-gray-300 transition-colors">
            <span className="text-2xl mb-2 opacity-50 group-hover:scale-110 transition-transform">📷</span>
            <p className="text-[10px] md:text-xs font-bold text-gray-400">2026.06.13</p>
            <p className="text-xs md:text-sm font-bold text-gray-700 mt-1">2일 차 완료</p>
          </div>
        </div>
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

      {/* Terms Modal */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};

export default TicketView;
