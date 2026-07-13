/* eslint-disable */
const AdInquiryModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-900">광고 · 제휴 문의</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-sm text-gray-700 leading-relaxed space-y-4">
          <p className="break-keep">
            '자기점검 50분(BMTI)'과 함께할 브랜드 제휴, 배너/콘텐츠 광고, 공동 이벤트 제안을 기다리고 있어요.
          </p>

          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-1.5">
            <p className="font-bold text-gray-900 text-xs mb-1.5">문의 시 아래 내용을 함께 남겨주시면 검토가 빨라져요</p>
            <ul className="list-disc pl-4 text-gray-600 text-xs space-y-1">
              <li>브랜드 · 제품명</li>
              <li>제안 형태 (배너 광고 / 콘텐츠 제작 / 공동 이벤트 등)</li>
              <li>희망 진행 일정</li>
              <li>예산 범위</li>
              <li>담당자 연락처</li>
            </ul>
          </div>

          <p className="text-xs text-gray-400 break-keep">
            남겨주신 제안은 검토 후 영업일 기준 3일 이내에 순서대로 회신드리고 있어요.
          </p>
        </div>

        {/* Footer: Contact CTA */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
          <a
            href="http://pf.kakao.com/_xasxgZX/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FEE500] text-[#3C1E1E] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#F4DC00] transition-colors text-center"
          >
            카카오톡으로 문의하기
          </a>
          <p className="text-[11px] text-gray-400 text-center">가장 빠르게 확인 가능한 채널이에요</p>
        </div>
      </div>
    </div>
  );
};

export default AdInquiryModal;
