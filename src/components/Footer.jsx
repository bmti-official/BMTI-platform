import { useState } from 'react';
import TermsModal from './TermsModal';
import AdInquiryModal from './AdInquiryModal';

const Footer = () => {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isAdInquiryOpen, setIsAdInquiryOpen] = useState(false);

  return (
    <footer className="pt-8 pb-28 mt-8 border-t border-gray-100 fade-in px-4 md:px-6 w-full relative">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
        {/* Brand & Copyright */}
        <div className="flex flex-col items-center">
          <div className="text-sm md:text-xl font-serif font-bold text-gray-800 mb-1 text-center">BMTI.</div>
          <div className="text-[9px] md:text-xs text-gray-400 break-keep text-center">© 2026 BMTI Labs. All rights reserved.</div>
        </div>

        {/* Links */}
        <div className="flex flex-row flex-wrap items-center justify-center gap-1.5 md:gap-3 text-[10px] md:text-xs font-bold text-gray-500">
          <button onClick={() => setIsTermsOpen(true)} className="hover:text-black transition-colors break-keep">[이용약관]</button>
          <button onClick={() => setIsTermsOpen(true)} className="hover:text-black transition-colors break-keep">[개인정보처리방침]</button>
          <a href="http://www.ftc.go.kr/bizCommPop.do?wrkr_no=8770403614" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors break-keep">[사업자정보확인]</a>
          <button onClick={() => setIsAdInquiryOpen(true)} className="hover:text-black transition-colors break-keep">[광고문의]</button>
        </div>

        {/* Business Info Accordion */}
        <button
          onClick={() => setIsInfoOpen(!isInfoOpen)}
          className="group flex items-center gap-1 text-[10px] md:text-xs font-bold text-gray-500 hover:text-gray-800 transition-all text-center break-keep"
        >
          자기점검 50분 사업자 정보
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-300 ${isInfoOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Accordion Content */}
      {isInfoOpen && (
        <div className="max-w-6xl mx-auto mt-6 p-4 md:p-5 bg-gray-50 rounded-xl border border-gray-100 text-[10px] md:text-xs text-gray-500 leading-relaxed text-center animate-fade-in-up">
          <p>대표자: 이응준 | 사업자등록번호: 877-04-03614</p>
          <p>통신판매업 신고번호: 2026-서울강남-01689</p>
          <p>영업소 소재지: 서울특별시 강남구 압구정로2길 46, 214-S117호(신사동)</p>
          <p>고객센터: 카카오톡 채널 <a href="http://pf.kakao.com/_xasxgZX/chat" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 transition-colors">[@자기점검 50분]</a> (가장 빠른 답변이 가능합니다)</p>
          <p>전화번호: 070-8027-8648 (통화량이 많아 연결이 어려울 수 있습니다. 카카오톡을 이용해 주세요.)</p>
          <p>이메일: ???@gmail.com (수정 예정)</p>
          <p>호스팅 제공자: GitHub, Inc.</p>
        </div>
      )}

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <AdInquiryModal isOpen={isAdInquiryOpen} onClose={() => setIsAdInquiryOpen(false)} />
    </footer>
  );
};

export default Footer;
