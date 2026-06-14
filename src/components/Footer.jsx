import { useState } from 'react';
import TermsModal from './TermsModal';

const Footer = () => {
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <footer className="py-10 mt-8 mb-4 border-t border-gray-100 flex flex-col items-center justify-center text-center fade-in">
      <div className="text-xl font-serif font-bold text-gray-800 mb-1">BMTI.</div>
      <div className="text-xs text-gray-400 mb-6">© 2026 BMTI Labs. All rights reserved.</div>

      <div className="text-[11px] md:text-xs text-gray-400 leading-relaxed break-keep max-w-xl px-4 space-y-1 mb-6">
        <p className="font-bold text-gray-500 mb-2">자기점검 50분</p>
        <p>대표자: 이응준 | 사업자등록번호: 877-04-03614</p>
        <p>통신판매업 신고번호: 2026-서울강남-01689</p>
        <p>영업소 소재지: 서울특별시 강남구 (수정 예정)</p>
        <p>고객센터: 070-0000-0000 (수정 예정) (운영시간 평일 10:00 ~ 18:00)</p>
        <p>이메일: ???@gmail.com (수정 예정)</p>
        <p>호스팅 제공자: GitHub, Inc.</p>
      </div>

      <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
        <button onClick={() => setIsTermsOpen(true)} className="hover:text-black transition-colors">이용약관</button>
        <span className="text-gray-300">|</span>
        <button onClick={() => setIsTermsOpen(true)} className="hover:text-black transition-colors">개인정보처리방침</button>
        <span className="text-gray-300">|</span>
        <a href="http://www.ftc.go.kr/bizCommPop.do?wrkr_no=8770403614" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">사업자정보확인</a>
      </div>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </footer>
  );
};

export default Footer;
