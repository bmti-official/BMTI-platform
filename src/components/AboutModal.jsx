/* eslint-disable */
import React from 'react';

// 서비스 소개(About) — 애드센스 심사 및 이용자 이해를 돕는 소개 페이지.
const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
          <h3 className="font-bold text-lg text-gray-900">서비스 소개</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto hide-scrollbar text-sm text-gray-700 leading-relaxed space-y-6">
          <section>
            <h4 className="font-bold text-base text-black mb-2">BMTI, 내 몸을 알아가는 가장 귀여운 방법</h4>
            <p className="text-gray-600 break-keep">
              BMTI(Body Management Type Indicator)는 물리치료사가 설계한 <strong>움직임 성향 검사</strong>예요.
              2분이면 끝나는 검사로 내 몸을 어떻게 움직이고 관리하는지 16가지 유형으로 알려드리고,
              그에 맞춰 매일의 컨디션을 기록·분석하도록 돕는 <strong>건강 다이어리 웹 서비스</strong>입니다.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-base text-black mb-2">이런 걸 할 수 있어요</h4>
            <ul className="list-disc pl-5 text-gray-600 space-y-1.5 break-keep">
              <li><strong>BMTI 검사</strong> — 2분 만에 내 움직임 성향(16유형)과 파트너 캐릭터 확인</li>
              <li><strong>말랑 다이어리</strong> — 하루 1분, 기분·수면·불편한 부위·운동을 귀엽게 기록</li>
              <li><strong>발견 리포트</strong> — 쌓인 기록으로 내 몸의 월간 패턴과 인사이트를 발견</li>
              <li><strong>큐레이션</strong> — 자세 교정·회복·스트레칭 등 몸 관리 콘텐츠를 큐레이션</li>
              <li><strong>예약</strong> — 전문가 세션·소그룹 클래스 예약(준비 중)</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-base text-black mb-2">우리가 지키는 것</h4>
            <p className="text-gray-600 break-keep">
              몸과 마음을 다정하게 챙기는 경험을 만들기 위해, 어렵고 딱딱한 건강 정보 대신
              누구나 매일 부담 없이 이어갈 수 있는 기록 습관을 지향합니다.
            </p>
          </section>

          <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-gray-500 break-keep text-[13px] leading-relaxed">
              ※ BMTI가 제공하는 검사 결과·리포트·가이드는 신체 기능 향상과 웰니스를 위한 참고용 정보이며,
              의학적 진단·처방·치료를 대신하는 의료 행위가 아닙니다. 통증이나 질환이 있는 경우 반드시 전문의의 진료를 받아주세요.
            </p>
            <p className="text-gray-500 break-keep text-[13px] leading-relaxed mt-2">
              ※ 일부 캐릭터·이미지와 콘텐츠는 생성형 AI로 제작되었으며, 결과지·리포트는 입력하신 기록을 바탕으로 자동 생성됩니다.
            </p>
          </section>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end sticky bottom-0">
          <button onClick={onClose} className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">확인</button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
