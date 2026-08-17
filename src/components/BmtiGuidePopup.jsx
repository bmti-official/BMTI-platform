import { createPortal } from 'react-dom';

// BMTI 활용법 안내 — 메인 상단 'BMTI' 옆 '?' 버튼으로 여는 팝업.
// 핵심 용도는 '트레이너·강사에게 내 유형 보여주기'이고, 그 밖의 활용법을 함께 안내한다.
const USES = [
  {
    emoji: '🏋️',
    title: '트레이너·강사에게 내 유형 보여주기',
    body: 'PT·필라테스·요가 첫 수업 전에 BMTI 결과지를 보여주면, 강사가 내 성향(설명이 먼저 필요한지·직접 해봐야 하는지 등)과 자주 불편한 부위를 빠르게 파악해 수업을 나에게 맞춰줄 수 있어요.',
  },
  {
    emoji: '🧭',
    title: '나에게 맞는 몸 관리 방향 잡기',
    body: '활동형/휴식형, 집중형/연결형 같은 내 움직임 성향을 알면, 무리 없이 이어갈 수 있는 운동·회복 방식을 고르기 쉬워져요.',
  },
  {
    emoji: '📔',
    title: '건강 다이어리와 함께 쓰기',
    body: '매일 기분·수면·불편한 부위를 10초만 기록하면, ‘이번 달 발견’에서 내 몸의 패턴을 리포트로 정리해줘요. 유형과 기록을 같이 보면 원인을 찾기 쉬워요.',
  },
  {
    emoji: '👥',
    title: '친구와 비교하고 공유하기',
    body: '결과지를 친구에게 공유하고, BMTI 관계도로 서로 잘 맞는 유형인지·어떻게 다른지 살펴볼 수 있어요.',
  },
];

export default function BmtiGuidePopup({ onClose }) {
  const node = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-5 backdrop-blur-md"
      style={{ background: 'rgba(28,26,23,0.45)', fontFamily: "'Pretendard',-apple-system,sans-serif" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2rem] w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-[fadeIn_.25s_ease-out]"
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900">BMTI, 이렇게 활용해요</h3>
            <p className="text-[13px] text-gray-500 mt-1 break-keep">내 움직임 성향(16유형)을 어디에 쓰면 좋은지 알려드려요.</p>
          </div>
          <button onClick={onClose} aria-label="닫기" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto hide-scrollbar flex flex-col gap-4">
          {USES.map((u, i) => (
            <div key={i} className="flex gap-3.5 items-start">
              <span className="w-10 h-10 shrink-0 rounded-2xl bg-[#F5F1E8] flex items-center justify-center text-xl">{u.emoji}</span>
              <div className="min-w-0">
                {i === 0 && <div className="mb-1"><span className="inline-block text-[10px] font-extrabold text-white bg-[#C9975A] rounded-full px-2 py-0.5">가장 많이 써요</span></div>}
                <h4 className="text-[15px] font-extrabold text-gray-900 break-keep mb-1">{u.title}</h4>
                <p className="text-[13px] text-gray-600 leading-relaxed break-keep">{u.body}</p>
              </div>
            </div>
          ))}

          <div className="bg-gray-50 rounded-2xl border border-gray-100 px-4 py-3">
            <p className="text-[12px] text-gray-500 leading-relaxed break-keep">
              ※ BMTI 결과·리포트는 몸을 돌아보기 위한 참고용 웰니스 정보예요. 통증이나 질환이 있다면 무리하지 말고 전문의의 진료를 받아주세요.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">확인</button>
        </div>
      </div>
    </div>
  );
  return createPortal(node, document.body);
}
