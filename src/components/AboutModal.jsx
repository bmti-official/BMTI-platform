/* eslint-disable */
import React from 'react';

// 서비스 소개(About) — 무엇을 하는 서비스인지 한 장으로.
// 강사 이야기를 적을 때의 기준: 누가 가르치는가만 말하고, 무엇을 고치는가는 말하지 않는다.
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
              BMTI(Body Management Type Indicator)는 물리치료사가 설계한 <strong>움직임 성향 검사</strong>에서 시작했어요.
              2분이면 끝나는 검사로 내 몸을 어떻게 움직이고 관리하는지 16가지 유형으로 알려 드리고,
              매일의 컨디션을 적는 <strong>건강 다이어리</strong>와 집에서 따라 하는 <strong>바디카드·바디플리</strong>,
              강사가 보내는 운동 과제까지 한곳에서 이어 주는 웹 서비스입니다.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-base text-black mb-2">이런 걸 할 수 있어요</h4>
            <ul className="list-disc pl-5 text-gray-600 space-y-1.5 break-keep">
              <li><strong>BMTI 검사</strong> — 2분 만에 내 움직임 성향(16유형)과 파트너 캐릭터 확인</li>
              <li><strong>건강 다이어리</strong> — 하루 1분, 기분·수면·불편한 부위·운동을 귀엽게 기록</li>
              <li><strong>기록·발견 리포트</strong> — 쌓인 기록으로 내 몸의 월간 패턴과 인사이트를 발견</li>
              <li><strong>각도기록</strong> — 휴대폰 카메라로 목 숙임·허리 굽힘·팔 들기 각도를 재고 주마다 변화를 확인(사진·영상은 저장하지 않아요)</li>
              <li><strong>바디카드·바디플리</strong> — 영상과 음성 안내를 따라 하는 스트레칭·마사지·운동 동작과, 여러 동작을 묶은 플리. 나만의 마이플리도 만들 수 있어요</li>
              <li><strong>추천루틴</strong> — 건강 정보 한 장에 적은 불편한 부위에 맞춰, 이번 주에 할 바디플리를 골라 드려요</li>
              <li><strong>BMTI 관계도·빙고판</strong> — 16가지 유형이 어떻게 이어지는지 살펴보고, 유형별 문구로 나만의 빙고판 채우기</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-base text-black mb-2">강사와 함께할 수 있어요</h4>
            <ul className="list-disc pl-5 text-gray-600 space-y-1.5 break-keep">
              <li>물리치료사 면허를 확인한 운동 강사가 보낸 링크로 연결하면, 강사가 <strong>수업 사이에 할 과제</strong>(바디플리)를 보내고 한 날을 함께 확인해요.</li>
              <li>연결할 때 강사와 무엇을 나눌지 직접 고르고, 언제든 끊을 수 있어요. 다이어리와 각도기록은 강사에게 보이지 않아요.</li>
              <li>강사는 운동을 지도합니다. 진단·치료는 하지 않습니다.</li>
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
              ※ BMTI가 제공하는 검사 결과·리포트·가이드·동작 안내와 강사가 보내는 운동 과제는 신체 기능 향상과 웰니스를 위한 참고용 정보이며,
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
