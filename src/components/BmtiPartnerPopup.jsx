import { CHARACTERS, CHARACTER_NAMES, CODE_KO } from '../data';
import { BMTI_INFO } from './ResultView';
import { getTypeAccent } from '../lib/typeAccent';

// 하단 네비 가운데 캐릭터를 누르면 뜨는 팝업 — 메인으로 바로 가지 않고
// '내 BMTI 파트너'를 보여준다. 오늘 하루일기를 아직 안 남겼으면 위에 기록 유도 CTA도 함께.
export default function BmtiPartnerPopup({ bmtiCode, isLoggedIn, hasLoggedToday, setView, onRequireLogin, onClose }) {
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const charInfo = BMTI_INFO[axisCode];
  const t = getTypeAccent(bmtiCode);
  const go = (v) => { onClose(); setView(v); };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-5" style={{ background: 'rgba(28,26,23,0.45)' }}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md relative animate-[fadeIn_.25s_ease-out]" style={{ fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
        <button onClick={onClose} aria-label="닫기" className="absolute -top-9 right-1 text-white/80 hover:text-white text-2xl leading-none z-10">✕</button>

        {!bmtiCode ? (
          // 아직 검사 전 — 테스트 유도
          <div className="bg-white rounded-[2rem] p-7 text-center shadow-2xl">
            <div className="text-[40px] mb-2">⭐️</div>
            <h3 className="text-lg font-black text-gray-900 mb-1.5">아직 내 BMTI를 몰라요</h3>
            <p className="text-sm text-gray-500 mb-6 break-keep">2분이면 끝나요 · 로그인 없이 가능해요</p>
            <button onClick={() => go('quiz')} className="w-full bg-black text-white font-bold py-4 rounded-2xl text-[15px] hover:bg-gray-900 transition-all flex items-center justify-center gap-2">
              BMTI 테스트 하기
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* 내 BMTI 파트너 */}
            <div className="rounded-[2rem] p-6 border shadow-2xl" style={{ background: '#F7F7F6', borderColor: '#EDEDEB' }}>
              <p className="text-xs font-bold text-gray-400 mb-4">내 BMTI 파트너</p>
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${charData?.color || 'bg-gray-100'}`}>
                  {charData && <img src={charData.image} alt={axisCode} className={`w-full h-full object-contain ${charData.imgClass || ''}`} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-2xl font-black tracking-tight">{axisCode} <span className="text-lg font-bold text-gray-400">{CODE_KO[axisCode]}</span></span>
                    <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">{CHARACTER_NAMES[axisCode]}</span>
                  </div>
                  <p className="text-gray-500 text-sm leading-snug whitespace-pre-line break-keep">{charInfo?.catchphrase}</p>
                </div>
              </div>
              {!isLoggedIn ? (
                <div className="flex flex-col items-center">
                  <button onClick={() => { onClose(); onRequireLogin && onRequireLogin(); }} className="w-full bg-[#FEE500] text-[#3C1E1E] font-bold py-4 rounded-2xl text-[15px] hover:bg-[#F4DC00] transition-all flex items-center justify-center gap-2 mb-3">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#3C1E1E]"><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" /></svg>
                    카카오로 3초 저장
                  </button>
                  <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1"><span>🔕</span> 광고 안 보냄 · 결과만 저장</p>
                </div>
              ) : (
                <button onClick={() => go('result')} className="w-full text-white text-[15px] font-bold py-4 rounded-2xl hover:brightness-105 transition-all" style={{ background: '#C9975A' }}>
                  내 결과 자세히 보기
                </button>
              )}
            </div>

            {/* 파트너 박스 밑 — 오늘 하루일기 기록 유도(오늘 아직 안 남겼을 때만) */}
            {(isLoggedIn && !hasLoggedToday) && (
              <button onClick={() => go('aichat')} className="w-full rounded-[1.6rem] p-5 text-left flex items-center justify-between transition-colors hover:brightness-95 shadow-lg" style={{ background: t.accentSoft }}>
                <div>
                  <p className="font-black mb-0.5 text-gray-900">오늘 기록, 아직이에요</p>
                  <p className="text-sm font-medium" style={{ color: t.accent }}>10초면 충분해요</p>
                </div>
                <span className="text-2xl" style={{ color: t.accent }}>›</span>
              </button>
            )}

            {/* 메인 페이지로 이동 */}
            <button onClick={() => go('home')} className="w-full bg-white rounded-[1.6rem] py-4 text-[14px] font-bold text-gray-700 shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1v-8.8Z" fill="currentColor" /></svg>
              메인 페이지로 이동
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
