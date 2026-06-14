import React from 'react';

const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
          <h3 className="font-bold text-lg text-gray-900">이용약관 및 개인정보 처리방침</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto hide-scrollbar text-sm text-gray-700 leading-relaxed space-y-8">
          
          {/* Terms of Service */}
          <section>
            <h4 className="font-bold text-base text-black mb-4">📄 1. 제정: '자기점검 50분' 서비스 이용약관</h4>
            
            <div className="space-y-4">
              <div>
                <h5 className="font-bold text-gray-900 mb-1">제1조 (목적)</h5>
                <p className="text-gray-600 break-keep">
                  본 약관은 '자기점검 50분'(이하 "회사"라 합니다)이 운영하는 웹사이트에서 제공하는 디지털 콘텐츠(BMTI 검사, 맞춤형 운동 플레이리스트 등) 및 관련 서비스(이하 "서비스"라 합니다)를 이용함에 있어 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-gray-900 mb-1">제2조 (신원정보 등의 제공)</h5>
                <p className="text-gray-600 break-keep">
                  "회사"는 이 약관의 내용과 상호, 대표자 성명, 영업소 소재지 주소, 전화번호, 사업자등록번호, 통신판매업 신고번호 등을 이용자가 쉽게 알 수 있도록 웹사이트의 초기 서비스 화면(전면)에 게시합니다.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <h5 className="font-bold text-red-800 mb-2">제3조 (서비스의 제공 및 한계 - ★핵심 면책 조항)</h5>
                <p className="text-red-700/90 break-keep space-y-2">
                  <span className="block">"회사"는 이용자의 BMTI 검사 결과 및 신청 폼에 기재된 신체적 특성을 바탕으로 맞춤형 운동 플레이리스트 및 코칭 가이드를 제공합니다.</span>
                  <span className="block font-bold">"회사"가 제공하는 모든 서비스와 콘텐츠는 신체 기능 향상과 웰니스를 위한 '가이드 및 조언'이며, 의학적인 진단, 처방, 치료를 대신하는 의료 행위가 아닙니다.</span>
                  <span className="block">이용자는 자신의 건강 상태를 고려하여 서비스를 이용해야 하며, 심각한 통증이나 질환이 있는 경우 반드시 전문의의 진료를 받아야 합니다. 이용자가 무리한 동작을 수행하여 발생한 부상이나 문제에 대해 "회사"는 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.</span>
                </p>
              </div>

              <div>
                <h5 className="font-bold text-gray-900 mb-1">제4조 (서비스의 구매 및 청약철회)</h5>
                <p className="text-gray-600 break-keep">
                  "회사"가 제공하는 '맞춤형 플레이리스트' 등은 주문 제작형 디지털 콘텐츠의 특성을 가집니다.<br/>
                  이용자가 플리 신청을 완료하고 "회사"가 맞춤형 콘텐츠의 제작을 완료하여 링크(또는 파일)를 전송한 이후에는, 전자상거래법 제17조 제2항에 의거하여 청약철회(환불)가 제한될 수 있습니다. (단, 전송 전에는 취소 가능)
                </p>
              </div>

              <div>
                <h5 className="font-bold text-gray-900 mb-1">제5조 (이용자의 의무)</h5>
                <p className="text-gray-600 break-keep mb-2">이용자는 서비스 이용 시 다음 각 호의 행위를 하여서는 안 됩니다.</p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>미션 인증 등을 위해 타인의 사진을 도용하거나 허위 정보를 등록하는 행위</li>
                  <li>"회사"가 제공한 맞춤형 플레이리스트 링크나 콘텐츠를 영리 목적으로 제3자에게 배포, 공유, 판매하는 행위 (저작권 침해)</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Privacy Policy */}
          <section>
            <h4 className="font-bold text-base text-black mb-4">📄 2. 제정: '자기점검 50분' 개인정보처리방침</h4>
            
            <div className="space-y-4">
              <div>
                <h5 className="font-bold text-gray-900 mb-1">제1조 (개인정보의 수집 및 이용 목적)</h5>
                <p className="text-gray-600 break-keep mb-2">"자기점검 50분"은 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>서비스 제공: BMTI 검사 결과 분석, 맞춤형 운동 플레이리스트 제작 및 카카오톡(또는 문자) 발송</li>
                  <li>회원 관리: 주간 미션(사진 인증) 참여 내역 관리, 불량 이용자의 부정 이용 방지</li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-gray-900 mb-1">제2조 (수집하는 개인정보의 항목)</h5>
                <p className="text-gray-600 break-keep mb-2">"회사"는 플리 신청 및 미션 인증을 위해 아래의 개인정보를 수집하고 있습니다.</p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li><strong>필수 항목:</strong> 성명, 카카오톡 계정(또는 연락처), BMTI 검사 결과, 운동 환경 및 소도구 유무, 신체 불편/주의 부위</li>
                  <li><strong>선택 항목:</strong> 미션 수행 인증 사진 (단, 인증 사진은 환경/사물 위주로 수집하며, 얼굴 등 민감한 개인 식별 정보는 요구하지 않습니다)</li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-gray-900 mb-1">제3조 (개인정보의 보유 및 이용 기간)</h5>
                <p className="text-gray-600 break-keep mb-2">원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 아래와 같이 보관합니다.</p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>소비자의 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                  <li>대금 결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                  <li>미션 인증 사진: 목적 달성(플리 발급) 후 또는 이용자의 삭제 요청 시 지체 없이 파기 (최대 보관 기간 6개월)</li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-gray-900 mb-1">제4조 (개인정보의 제3자 제공)</h5>
                <p className="text-gray-600 break-keep">
                  "회사"는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우는 예외로 합니다.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h5 className="font-bold text-gray-900 mb-2">제5조 (개인정보 보호책임자)</h5>
                <p className="text-gray-600 break-keep mb-2">이용자의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li><strong>책임자 성명:</strong> 이응준</li>
                  <li><strong>소속/직위:</strong> 자기점검 50분 대표</li>
                  <li><strong>전화번호:</strong> 010-2885-0431</li>
                </ul>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end sticky bottom-0">
          <button 
            onClick={onClose}
            className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
