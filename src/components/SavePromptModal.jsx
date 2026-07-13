import { CHARACTERS, CHARACTER_NAMES } from '../data';
import { BMTI_RESULTS } from '../bmti_results';

/**
 * 비로그인 + 테스트 완료 유저가 다른 탭으로 이동할 때 뜨는 카카오 저장 유도 팝업.
 * M/Z 유형에 따라 문구가 다르게 표시된다.
 */
const SavePromptModal = ({ isOpen, onClose, onLogin, bmtiCode }) => {
  if (!isOpen || !bmtiCode) return null;

  const axisCode = bmtiCode.split('-')[0]; // e.g. "ACDZ"
  const lastChar = axisCode.charAt(3); // "Z" or "M"
  const isZType = lastChar === 'Z';

  const charData = CHARACTERS.find(c => c.id === axisCode);
  const charName = CHARACTER_NAMES[axisCode] || axisCode;
  const resultData = BMTI_RESULTS[axisCode];
  const nickname = resultData?.nickname?.replace(/\\n/g, '\n')?.split('\n')?.pop() || charName;

  // M vs Z 분기
  const title = isZType
    ? '결과, 저장하고 가실래요?'
    : '저를 두고 가시는 거예요? 🥲';

  const body = isZType
    ? '저장하면 7일 뒤,\n나도 몰랐던 내 몸의 패턴을 알게 돼요.'
    : '방금 만났는데... 저장해두시면\n매일 당신의 하루를 물어볼게요.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-modal-pop"
        onClick={e => e.stopPropagation()}
      >
        {/* 미니 카드 헤더 */}
        <div className="bg-gradient-to-b from-gray-50 to-white pt-8 pb-3 px-6 text-center">
          {/* 캐릭터 이미지 */}
          <div className="w-28 h-28 mx-auto mb-4 rounded-full bg-white shadow-lg border-4 border-white flex items-center justify-center overflow-hidden">
            {charData ? (
              <img
                src={charData.image}
                alt={charName}
                className="w-[90%] h-[90%] object-contain"
              />
            ) : (
              <div className="text-5xl">🧬</div>
            )}
          </div>

          {/* 유형 코드 + 캐릭터 이름 */}
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3.5 py-1.5 mb-2.5">
            <span className="text-xs font-black text-gray-800 tracking-wider">{axisCode}</span>
            <span className="text-[10px] text-gray-400">|</span>
            <span className="text-xs font-bold text-gray-600">{nickname}</span>
          </div>
        </div>

        {/* 본문 */}
        <div className="px-6 pb-7 pt-3 text-center">
          <h3 className="text-[22px] font-black text-gray-900 mb-3 leading-snug break-keep">
            {title}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line break-keep mb-6">
            {body}
          </p>

          {/* 카카오 노란 버튼 */}
          <button
            onClick={onLogin}
            className="w-full bg-[#FEE500] text-[#3C1E1E] font-bold py-4 rounded-2xl text-base hover:bg-[#F4DC00] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 mb-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#3C1E1E]">
              <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
            </svg>
            카카오로 3초 저장
          </button>

          {/* 안심 문구 */}
          <p className="text-[11px] text-gray-400 mb-4 flex items-center justify-center gap-1">
            <span>🔕</span> 광고 안 보냄 · 결과만 저장
          </p>

          {/* 나중에 할게요 */}
          <button
            onClick={onClose}
            className="w-full text-sm font-semibold text-gray-400 hover:text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 transition-all"
          >
            나중에 할게요
          </button>
        </div>

        {/* 팝업 애니메이션 */}
        <style>{`
          @keyframes modalPop {
            0% { transform: scale(0.9) translateY(20px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
          .animate-modal-pop { animation: modalPop 0.3s ease-out forwards; }
        `}</style>
      </div>
    </div>
  );
};

export default SavePromptModal;
