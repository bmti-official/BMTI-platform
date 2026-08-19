/* eslint-disable */
import { useState, useRef, useEffect, Fragment } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CHARACTERS, calculateBMTIPercentages, CHARACTER_NAMES as SHORT_NICKNAMES, CODE_KO } from '../data';
import DiaryCta, { YELLOW_HL } from './DiaryCta';
import TypeGallery from './TypeGallery';
import BingoGallery from './BingoGallery';
import { getEntryForDate, todayISO } from '../lib/diaryHistory';
import { BMTI_RESULTS } from '../bmti_results';
import { INSTRUCTOR_GUIDE_DATA, ESCAPE_DATA, WORST_VIBE_DATA, TENDENCY_DATA } from '../customResultData';

// 4가지 성향 대표 문장에서 항목 메인 색상으로 강조할 핵심 문구
export const TENDENCY_HL = {
  A: { confident: '몸을 움직여야', flexible: '가볍게 몸을 움직이면' },
  O: { confident: '조용히', flexible: '조용히 쉬는' },
  C: { confident: "'여기'", flexible: '집중할 부위' },
  L: { confident: '전체적으로', flexible: '연결' },
  D: { confident: '직접 움직여', flexible: '직접 움직이면서' },
  Q: { confident: '납득이 돼야', flexible: '왜 좋은지' },
  Z: { confident: '팩트', flexible: '뭘 케어해야' },
  M: { confident: '다정한 위로', flexible: '가벼운 칭찬이나 다정한 격려' },
};
// 각 성향 카드의 메인 색상(축 왼쪽 글자 기준)
export const TENDENCY_HEX = { A: '#FF6B6B', C: '#4ECDC4', D: '#60A5FA', Z: '#A78BFA' };

const getKoreanName = (code) => {
  const map = {
    'ACDZ': '애씨디지', 'ACDM': '애씨디엠', 'ACQZ': '애씨큐지', 'ACQM': '애씨큐엠',
    'ALDZ': '앨디지', 'ALDM': '앨디엠', 'ALQZ': '앨큐지', 'ALQM': '앨큐엠',
    'OCDZ': '오씨디지', 'OCDM': '오씨디엠', 'OCQZ': '오씨큐지', 'OCQM': '오씨큐엠',
    'OLDZ': '올디지', 'OLDM': '올디엠', 'OLQZ': '올큐지', 'OLQM': '올큐엠'
  };
  return map[code] || '';
};

// BMTI 유형별 정보
export const BMTI_INFO = {
  'ACDM': { kr: '활동적 집중 실전 공감형', catchphrase: '몸으로 부딪히며 배우고,\n응원받을 때 더 힘내는 사람', bestMatch: 'OLQZ', diffTempo: 'OLQM', color: '#FF6B6B', bgGradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' },
  'ACDZ': { kr: '활동적 집중 실전 팩트형', catchphrase: '말보다 행동이 앞서고,\n핵심만 딱 원하는 사람', bestMatch: 'OCDM', diffTempo: 'ALQM', color: '#4ECDC4', bgGradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)' },
  'ACQM': { kr: '활동적 집중 탐구 공감형', catchphrase: '궁금하면 바로 파고들고,\n마음까지 챙기는 사람', bestMatch: 'OLDZ', diffTempo: 'OLDM', color: '#A78BFA', bgGradient: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)' },
  'ACQZ': { kr: '활동적 집중 탐구 팩트형', catchphrase: '이유를 확실히 알아야\n움직이는 사람', bestMatch: 'OLQZ', diffTempo: 'ALDM', color: '#60A5FA', bgGradient: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)' },
  'ALDM': { kr: '활동적 전신 실전 공감형', catchphrase: '온몸으로 부딪히고,\n함께라서 더 신나는 사람', bestMatch: 'OCQZ', diffTempo: 'OCQM', color: '#F472B6', bgGradient: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)' },
  'ALDZ': { kr: '활동적 전신 실전 팩트형', catchphrase: '재지 않고 몸부터 움직이는\n시원시원한 사람', bestMatch: 'OLDZ', diffTempo: 'OCQM', color: '#34D399', bgGradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' },
  'ALQM': { kr: '활동적 전신 탐구 공감형', catchphrase: '궁금한 것도 정도 많은,\n다정한 탐구가 같은 사람', bestMatch: 'OLQZ', diffTempo: 'ACDM', color: '#FBBF24', bgGradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' },
  'ALQZ': { kr: '활동적 전신 탐구 팩트형', catchphrase: '원리와 숫자로\n내 몸을 이해하는 사람', bestMatch: 'OCQM', diffTempo: 'ACQZ', color: '#818CF8', bgGradient: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)' },
  'OCDM': { kr: '안정적 집중 실전 공감형', catchphrase: '차분하지만 확실하게,\n마음까지 챙기는 사람', bestMatch: 'ACDM', diffTempo: 'ALQZ', color: '#FB923C', bgGradient: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)' },
  'OCDZ': { kr: '안정적 집중 실전 팩트형', catchphrase: '군더더기 없이\n필요한 것만 딱 하는 사람', bestMatch: 'OLDZ', diffTempo: 'ACQM', color: '#2DD4BF', bgGradient: 'linear-gradient(135deg, #2DD4BF 0%, #14B8A6 100%)' },
  'OCQM': { kr: '안정적 집중 탐구 공감형', catchphrase: '꼼꼼히 알아보고\n다정하게 다가가는 사람', bestMatch: 'ACDM', diffTempo: 'ALDZ', color: '#E879F9', bgGradient: 'linear-gradient(135deg, #E879F9 0%, #C026D3 100%)' },
  'OCQZ': { kr: '안정적 집중 탐구 팩트형', catchphrase: '원리를 이해해야\n마음이 놓이는 사람', bestMatch: 'ACQZ', diffTempo: 'ALDM', color: '#38BDF8', bgGradient: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)' },
  'OLDM': { kr: '안정적 전신 실전 공감형', catchphrase: '편안한 분위기에서\n다 같이 움직이는 게 좋은 사람', bestMatch: 'ALDM', diffTempo: 'ACQZ', color: '#FB7185', bgGradient: 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)' },
  'OLDZ': { kr: '안정적 전신 실전 팩트형', catchphrase: '무리 없이 꾸준한 게\n제일 잘 맞는 사람', bestMatch: 'ALDZ', diffTempo: 'ACQM', color: '#4ADE80', bgGradient: 'linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)' },
  'OLQM': { kr: '안정적 전신 탐구 공감형', catchphrase: '천천히, 하지만 확실하게\n마음을 담아 움직이는 사람', bestMatch: 'ALQM', diffTempo: 'ACDZ', color: '#F9A8D4', bgGradient: 'linear-gradient(135deg, #F9A8D4 0%, #EC4899 100%)' },
  'OLQZ': { kr: '안정적 전신 탐구 팩트형', catchphrase: '정확한 균형을 찾을 때\n마음이 편한 사람', bestMatch: 'ALQZ', diffTempo: 'ACDM', color: '#67E8F9', bgGradient: 'linear-gradient(135deg, #67E8F9 0%, #06B6D4 100%)' },
};

const ChemistryCard = ({ type, targetCode, resultData, isExpanded, onToggle }) => {
  const isBest = type === 'bestMatch';
  const badgeTitle = isBest ? '💖 환상의 짝꿍 BMTI' : '🤔 조금 다른 템포 BMTI';
  const charImage = CHARACTERS.find(c => c.id === targetCode)?.image;
  const shortNickname = SHORT_NICKNAMES[targetCode];
  
  const matchString = isBest ? resultData.goodMatch : resultData.badMatch;
  const matchLines = matchString ? matchString.split('\n') : [];
  const description = matchLines.length >= 3 ? matchLines[2] : matchString;

  return (
    <div 
      className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[2rem] border border-gray-100 flex flex-col items-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer transition-all duration-300 w-full"
      onClick={onToggle}
    >
      <div className="bg-white border border-gray-100 rounded-full px-3 md:px-4 py-1.5 mb-2 md:mb-4 text-[11px] md:text-sm font-bold text-gray-500 shadow-sm whitespace-nowrap z-10 relative">
        {badgeTitle}
      </div>
      
      {!isExpanded ? (
        <div className="flex flex-col items-center w-full">
          <div className="w-24 h-24 md:w-36 md:h-36 mb-1 md:mb-2 flex items-center justify-center">
             {charImage && <img src={charImage} alt={targetCode} className={`w-full h-full object-contain ${['OCDZ', 'OCQM', 'OLQM'].includes(targetCode) ? 'scale-100' : 'scale-[1.2] md:scale-[1.1]'}`} />}
          </div>
          <p className="font-extrabold text-[#111827] text-base md:text-xl mb-1 flex items-baseline justify-center gap-1 text-center">
             <span>{targetCode}</span> <span className="text-gray-400 text-[10px] md:text-sm font-medium">({getKoreanName(targetCode)})</span>
          </p>
          <p className="font-bold text-gray-800 text-[13px] md:text-lg text-center break-keep">{shortNickname}</p>
          
          <div className="mt-4 md:mt-6 border border-gray-100 text-gray-500 bg-white rounded-full px-3 md:px-4 py-1.5 text-[11px] md:text-sm font-medium flex items-center gap-1 md:gap-2 shadow-sm">
            설명 보기 
            <svg width="10" height="10" className="md:w-3 md:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      ) : (
        <div className="w-full text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start md:gap-4 mb-4 md:mb-5">
            <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 mb-2 md:mb-0 flex items-center justify-center">
               {charImage && <img src={charImage} alt={targetCode} className={`w-full h-full object-contain ${['OCDZ', 'OCQM', 'OLQM'].includes(targetCode) ? 'scale-100' : 'scale-[1.2] md:scale-[1.1]'}`} />}
            </div>
            <div className="flex flex-col text-center md:text-left mt-1 md:mt-3">
              <p className="font-extrabold text-gray-500 text-[11px] md:text-sm mb-0.5 tracking-wider flex items-baseline justify-center md:justify-start gap-1">
                 <span>{targetCode}</span> <span className="text-gray-400 font-normal text-[9px] md:text-[11px] hidden md:inline">({getKoreanName(targetCode)})</span>
              </p>
              <p className="font-bold text-gray-800 text-[13px] md:text-lg leading-tight break-keep">{shortNickname}</p>
            </div>
          </div>
          
          <div className="w-full h-px bg-gray-100 mb-4 md:mb-5"></div>
          
          <p className="text-gray-600 text-[13px] md:text-[15.5px] leading-relaxed break-keep mb-5 md:mb-6">
            {description}
          </p>
          
          <div className="w-full flex justify-center">
            <div className="border border-gray-100 text-gray-500 bg-white rounded-full px-3 md:px-4 py-1.5 text-[11px] md:text-sm font-medium flex items-center gap-1 md:gap-2 shadow-sm">
              돌아가기 
              <svg width="10" height="10" className="md:w-3 md:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultView = ({ setView, quizCompleted, setQuizCompleted, isLoggedIn, setIsLoggedIn, onRequireLogin, bmtiCode, bmtiAnswers, userProfile }) => {
  const [isSavingPDF, setIsSavingPDF] = useState(false);
  const [shareBusy, setShareBusy] = useState(null);   // 'image' | 'native'
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  };
  const [showGallery, setShowGallery] = useState(false);
  const [showBingo, setShowBingo] = useState(false);
  // 오늘 건강 다이어리 기록 완료 여부 — CTA 문구(기록하기 vs 기록·발견)를 가른다
  const hasLoggedToday = !!getEntryForDate(todayISO());
  const printHeaderRef = useRef(null);
  const printTendencyRefs = useRef([]);
  const printMatchesRef = useRef(null);
  const printInstructorRef = useRef(null);
  const printEscapeRef = useRef(null);
  const printVibeRef = useRef(null);
  const printFooterRef = useRef(null);
  const shareCardRef = useRef(null);   // 공유용 '이력서' 카드 (화면에 안 보이고 캡처 전용)

  const [expandBestMatch, setExpandBestMatch] = useState(false);
  const [expandDiffTempo, setExpandDiffTempo] = useState(false);
  const [openTendencies, setOpenTendencies] = useState({});
  const [openDetailSections, setOpenDetailSections] = useState({});

  // Parse BMTI code
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const info = BMTI_INFO[axisCode] || BMTI_INFO['ACDM'];
  const resultData = BMTI_RESULTS[axisCode] || {};
  const charData = CHARACTERS.find(c => c.id === axisCode);

  const siteUrl = 'https://bmti-official.co.kr/';

  // 상세 결과 4개 섹션(강사 가이드/탈출법/최악의 분위기/바디가이드)의 확신·유연 변형 선택 —
  // 화면 아코디언과 PDF 결과지가 같은 값을 쓰도록 한 번만 계산해 둔다.
  const percentages = bmtiAnswers && bmtiAnswers.length > 0 ? calculateBMTIPercentages(bmtiAnswers) : null;
  const getLevel = (letter) => (percentages && percentages[letter] >= 80 ? 'strong' : 'flexible');

  const instructorKey = (axisCode && axisCode.length === 4 ? axisCode.substring(2, 4) : 'DZ') + '_' + getLevel(axisCode ? axisCode[2] : 'D');
  const guideData = INSTRUCTOR_GUIDE_DATA[instructorKey] || INSTRUCTOR_GUIDE_DATA['DZ_flexible'];

  const escapeKey = (axisCode && axisCode.length >= 3 ? axisCode[0] + axisCode[2] : 'OQ') + '_' + getLevel(axisCode ? axisCode[0] : 'O');
  const escapeInfo = ESCAPE_DATA[escapeKey] || ESCAPE_DATA['OQ_flexible'];

  const vibeKey = (axisCode && axisCode.length >= 4 ? axisCode[0] + axisCode[3] : 'OM') + '_' + getLevel(axisCode ? axisCode[3] : 'M');
  const vibeData = WORST_VIBE_DATA[vibeKey] || WORST_VIBE_DATA['OM_flexible'];

  const bestMatchBody = resultData.goodMatch ? resultData.goodMatch.split('\n').slice(2).join(' ') : '';
  const diffTempoBody = resultData.badMatch ? resultData.badMatch.split('\n').slice(2).join(' ') : '';
  const bestMatchChar = CHARACTERS.find(c => c.id === info.bestMatch);
  const diffTempoChar = CHARACTERS.find(c => c.id === info.diffTempo);

  // html2canvas가 아직 로드 안 된 <img>를 빈 채로 캡처하지 않도록, 캡처 전 이미지 로딩을 기다린다.
  const waitForImages = (el) => {
    const imgs = Array.from(el.querySelectorAll('img'));
    return Promise.all(imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));
  };

  // 1. "카카오톡으로 내 결과지 저장하기" — 전체 결과지를 PDF로 만들어 카톡(OS 공유 시트)으로 전달
  // 섹션(카드) 단위로 각각 캡처해 페이지에 배치 — 한 이미지를 통째로 슬라이싱하면
  // 페이지가 넘어갈 때 문단 중간이 잘리므로, 블록이 페이지 하단을 넘으면 다음 페이지로 통째로 넘긴다.
  const handleSaveResultPDF = async () => {
    if (!isLoggedIn) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    if (isSavingPDF) return;
    setIsSavingPDF(true);
    try {
      const sections = [
        printHeaderRef.current,
        ...(percentages ? printTendencyRefs.current.filter(Boolean) : []),
        printInstructorRef.current,
        printEscapeRef.current,
        printVibeRef.current,
        printFooterRef.current,
      ].filter(Boolean);

      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 32;
      const contentWidth = pageWidth - margin * 2;
      const gap = 14;
      let cursorY = margin;

      for (let i = 0; i < sections.length; i++) {
        await waitForImages(sections[i]);
        const canvas = await html2canvas(sections[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        if (cursorY !== margin && cursorY + imgHeight > pageHeight - margin) {
          pdf.addPage();
          cursorY = margin;
        }
        pdf.addImage(imgData, 'JPEG', margin, cursorY, contentWidth, imgHeight);
        if (sections[i] === printFooterRef.current) {
          pdf.link(margin, cursorY, contentWidth, imgHeight, { url: siteUrl });
        }
        cursorY += imgHeight + gap;
      }

      const pdfBlob = pdf.output('blob');
      const fileName = `BMTI_${axisCode}_결과지.pdf`;

      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: 'BMTI 결과지',
          text: `${info.kr} — ${axisCode} 전체 결과지예요.`,
        });
      } else {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = URL.createObjectURL(pdfBlob);
        link.click();
        URL.revokeObjectURL(link.href);
        alert('결과지 PDF가 저장되었어요. 카카오톡 채팅방에서 파일을 첨부해 보내주세요.');
      }
    } catch (err) {
      console.error('PDF 생성 오류:', err);
      alert('결과지를 만드는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSavingPDF(false);
    }
  };

  // 2. "카카오톡으로 친구에게 자랑하기" — 카카오링크 임베드 카드로 공유
  const handleShareToFriend = () => {
    if (!isLoggedIn) {
      if (onRequireLogin) onRequireLogin();
      return;
    }

    if (!(window.Kakao && window.Kakao.Share)) {
      alert('카카오톡 공유가 준비 중입니다.');
      return;
    }
    const imageUrl = charData ? new URL(charData.originalImage, window.location.href).href : undefined;
    // 받은 사람은 공유자 유형의 '예시 결과지'(다른 유형 구경하기)로 바로 들어온다.
    const shareUrl = `${siteUrl}#example-${axisCode}`;

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `나의 BMTI는 ${resultData.nickname ? resultData.nickname.replace('\n', ' ') : axisCode} (${axisCode})!`,
        description: `${info.catchphrase.replace('\n', ' ')}\n나와 다른 유형도 구경해보세요!`,
        imageUrl,
        link: { webUrl: shareUrl, mobileWebUrl: shareUrl },
      },
      buttons: [
        { title: '다른 유형 구경하기 →', link: { webUrl: shareUrl, mobileWebUrl: shareUrl } },
      ],
    });
  };

  // ── 친구에게 공유하기 — 공용 헬퍼 ──────────────────────────────
  const shareUrl = `${siteUrl}#example-${axisCode}`;
  const shareText = `나의 BMTI는 ${resultData.nickname ? resultData.nickname.replace('\n', ' ') : axisCode} (${axisCode})! ${info.catchphrase.replace('\n', ' ')}`;

  // 공유 카드(이력서 형태)를 이미지로 — 인스타 스토리/X/이미지 저장/기본공유에서 함께 쓴다.
  const captureShareImage = async () => {
    const el = shareCardRef.current || printHeaderRef.current;
    if (!el) return null;
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch { /* noop */ } }
    await waitForImages(el);
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  };
  const downloadShareImage = async () => {
    try {
      setShareBusy('image');
      const blob = await captureShareImage();
      if (!blob) return;
      const link = document.createElement('a');
      link.download = `BMTI_${axisCode}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      showToast('결과 이미지를 저장했어요');
    } catch { showToast('이미지를 만들지 못했어요'); } finally { setShareBusy(null); }
  };
  const shareToInstagram = async () => {
    // 웹에서 스토리에 바로 올릴 수는 없어, 이미지를 저장한 뒤 인스타그램을 열어준다.
    await downloadShareImage();
    showToast('이미지를 저장했어요 · 인스타그램 스토리에 올려보세요');
    setTimeout(() => { window.open('https://www.instagram.com/', '_blank', 'noopener'); }, 900);
  };
  const shareToX = () => {
    const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(u, '_blank', 'noopener');
  };
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('링크를 복사했어요');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); showToast('링크를 복사했어요'); } catch { showToast('복사에 실패했어요'); }
      document.body.removeChild(ta);
    }
  };
  const shareNative = async () => {
    try {
      setShareBusy('native');
      const blob = await captureShareImage();
      const file = blob ? new File([blob], `BMTI_${axisCode}.png`, { type: 'image/png' }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'BMTI 결과', text: shareText, url: shareUrl });
      } else if (navigator.share) {
        await navigator.share({ title: 'BMTI 결과', text: shareText, url: shareUrl });
      } else {
        await copyShareLink();
      }
    } catch { /* 사용자가 취소한 경우 포함 — 조용히 무시 */ } finally { setShareBusy(null); }
  };

  if (!bmtiCode && !quizCompleted) {
    return (
      <div className="min-h-screen pt-32 md:pt-40 pb-28 px-6 flex flex-col items-center justify-center text-center fade-in">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-200">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">아직 분석 결과가 없습니다</h2>
        <p className="text-gray-500 mb-8 max-w-sm break-keep leading-relaxed">
          BMTI 설문을 완료하고 나에게 딱 맞는 움직임 성향을 확인 후 주변 친구들과 소통하세요!
        </p>
        <button
          id="start-quiz-from-result"
          onClick={() => setView('quiz')}
          className="bg-black text-white px-8 py-3.5 rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-black/10"
        >
          설문 시작하기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 md:pt-40 pb-32 px-6 max-w-2xl mx-auto fade-in">
      <div className="text-center mb-8">
        <p className="text-gray-500 mb-2 font-medium tracking-widest text-sm">ANALYSIS COMPLETE</p>
        <h2 className="text-3xl md:text-4xl font-serif font-bold">내 BMTI 유형은</h2>
        {/* 건강 다이어리 CTA — '내 BMTI 유형은' 바로 밑 */}
        <div className="w-full flex justify-center mt-6">
          <DiaryCta loggedToday={hasLoggedToday} onGoDiary={() => setView('aichat')} />
        </div>
      </div>

      {/* Brief Character Card */}
      <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 md:p-12 shadow-xl relative overflow-hidden mb-8">

        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c0ff00]/10 rounded-bl-full -z-10"></div>

        <div className="flex flex-col items-center text-center">
          {/* Character Image - Full Bleed */}
          <div className="w-[calc(100%+4rem)] md:w-[calc(100%+6rem)] -mt-8 md:-mt-12 -mx-8 md:-mx-12 mb-8 relative">
            {charData ? (
              <img src={charData.originalImage} alt={axisCode} className="w-full h-auto object-cover rounded-t-[2.5rem]" />
            ) : (
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-t-[2.5rem]">
                <div className="w-32 h-32 bg-black rounded-[40%] animate-spin-slow absolute"></div>
                <div className="w-24 h-24 bg-[#c0ff00] rounded-full absolute mix-blend-multiply opacity-90"></div>
              </div>
            )}
          </div>

          {/* Catchphrase & Name Layout */}
          <div className="w-full flex flex-col items-center justify-center mb-10 mt-6 relative px-4">
            {resultData.nickname && (() => {
              const parts = resultData.nickname.split('\n');
              const first = parts.length > 1 ? parts[0] : null;
              const main = parts.length > 1 ? parts.slice(1).join(' ') : resultData.nickname;
              return (
                <h1 className="leading-[1.2] font-black tracking-tight text-gray-900 break-keep text-center">
                  {first && <span className="block text-[clamp(0.95rem,3.6vw,1.35rem)] font-extrabold text-gray-400 mb-1">{first}</span>}
                  <span className="block text-[clamp(1.75rem,6vw,3rem)]">{main}</span>
                </h1>
              );
            })()}
            <span className="text-base sm:text-lg md:text-xl font-bold text-gray-400 tracking-tight mt-2.5">
              {axisCode} <span className="text-gray-300">{CODE_KO[axisCode]}</span>
            </span>
            <p className="text-gray-600 text-[15px] md:text-lg font-bold whitespace-pre-line break-keep text-center mt-4 leading-relaxed">
              {info.catchphrase}
            </p>
          </div>

          {/* 4 Tendencies Section */}
          <div className="w-full mb-10 fade-in">
            <h3 className="text-[15px] md:text-lg font-bold text-gray-700 mb-5 flex items-center justify-center gap-2">
              <span>🔍 나를 움직이게 하는 4가지 성향</span>
            </h3>
            
            {(() => {
              const percentages = calculateBMTIPercentages(bmtiAnswers);
              if (!percentages) return null;

              const renderTendencyCard = (letter1, letter2) => {
                const isLeft = percentages[letter1] >= 50;
                const activeLetter = isLeft ? letter1 : letter2;
                const percent = Math.max(percentages[letter1], percentages[letter2]);
                const level = percent >= 80 ? 'confident' : 'flexible';
                const data = TENDENCY_DATA[activeLetter];
                const isOpen = !!openTendencies[letter1];

                // Colors based on axis
                let colorClass = 'bg-[#4ECDC4]'; // Default
                let textClass = 'text-[#4ECDC4]';
                if (letter1 === 'A') { colorClass = 'bg-[#FF6B6B]'; textClass = 'text-[#FF6B6B]'; }
                else if (letter1 === 'C') { colorClass = 'bg-[#4ECDC4]'; textClass = 'text-[#4ECDC4]'; }
                else if (letter1 === 'D') { colorClass = 'bg-[#60A5FA]'; textClass = 'text-[#60A5FA]'; }
                else if (letter1 === 'Z') { colorClass = 'bg-[#A78BFA]'; textClass = 'text-[#A78BFA]'; }

                const hlPhrase = (TENDENCY_HL[activeLetter] || {})[level];
                const hlColor = TENDENCY_HEX[letter1] || '#4ECDC4';
                const renderQuote = () => {
                  const q = data[level].quote;
                  if (!hlPhrase || !q.includes(hlPhrase)) return `"${q}"`;
                  const i = q.indexOf(hlPhrase);
                  return <>&quot;{q.slice(0, i)}<span style={{ color: hlColor }} className="font-extrabold">{hlPhrase}</span>{q.slice(i + hlPhrase.length)}&quot;</>;
                };

                return (
                  <div key={letter1} className="md:bg-white md:border md:border-gray-100 md:shadow-[0_4px_20px_rgba(0,0,0,0.03)] md:rounded-3xl p-0 md:p-8 mb-7 md:mb-5 w-full text-left">
                    {/* 유형명(작게, 줄바꿈 없음) + 게이지 — 가장 긴 유형명 폭(고정)으로 맞춰 게이지 시작점이 카드마다 동일하게, 남은 폭을 채워 PC는 길게·모바일은 짧게 */}
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <h4 className="shrink-0 whitespace-nowrap w-[168px] md:w-[188px] text-[13px] md:text-[14px] font-bold text-gray-500 flex items-center gap-1.5">
                        <span className="text-base md:text-lg">{data[level].emoji}</span>
                        <span>{data[level].modifier} {data.name}</span>
                      </h4>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="flex-1 min-w-0 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className={`${colorClass} h-2 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className={`${textClass} font-bold text-[11px] md:text-xs w-8 text-right shrink-0`}>{percent}%</span>
                      </div>
                    </div>
                    <p className="font-bold text-gray-800 text-[15.5px] md:text-[17px] mb-1 leading-relaxed break-keep">
                      {renderQuote()}
                    </p>
                    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <p className="text-gray-600 text-[15px] md:text-base leading-[1.7] break-keep">
                          {data[level].desc}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenTendencies(prev => ({ ...prev, [letter1]: !prev[letter1] }))}
                      className={`${textClass} text-sm font-bold mt-3 flex items-center gap-1`}
                    >
                      {isOpen ? '접기' : '자세히 보기'}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                  </div>
                );
              };

              return (
                <div className="flex flex-col gap-1 w-full max-w-lg mx-auto">
                  {renderTendencyCard('A', 'O')}
                  {renderTendencyCard('C', 'L')}
                  {renderTendencyCard('D', 'Q')}
                  {renderTendencyCard('Z', 'M')}
                </div>
              );
            })()}
          </div>

          {/* Chemistry section 제거 — BMTI 관계도가 대신 보여준다 */}

          {/* 친구에게 공유하기 — 대표(카카오) 1개 + 보조 채널 5개를 한 박스에 */}
          <div className="w-full mt-8 mb-4">
            <div className="w-full bg-white border border-gray-200 rounded-[1.75rem] p-5 md:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] md:text-lg font-extrabold text-gray-900">친구에게 공유하기</h3>
                <span className="text-[11px] md:text-xs text-gray-400 font-bold">내 유형을 자랑해보세요</span>
              </div>

              {/* 주요 채널 — 카카오 · 인스타 스토리 · X 나란히 */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {[
                  {
                    key: 'kakao', label: '카카오톡', sub: '친구에게', onClick: handleShareToFriend,
                    bg: 'bg-[#FEE500]', fg: 'text-[#3C1E1E]',
                    icon: (<svg viewBox="0 0 24 24" className="w-7 h-7 fill-current"><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" /></svg>),
                  },
                  {
                    key: 'insta', label: '인스타', sub: '스토리', onClick: shareToInstagram,
                    bg: 'bg-gradient-to-br from-[#FEDA75] via-[#D62976] to-[#4F5BD5]', fg: 'text-white',
                    icon: (<svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none" /></svg>),
                  },
                  {
                    key: 'x', label: 'X', sub: '트위터', onClick: shareToX,
                    bg: 'bg-black', fg: 'text-white',
                    icon: (<svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M18.9 2H22l-7.1 8.1L23.2 22h-6.5l-5.1-6.6L5.8 22H2.7l7.6-8.7L1.5 2H8l4.6 6.1L18.9 2Zm-1.1 18h1.7L7.3 3.7H5.5L17.8 20Z" /></svg>),
                  },
                ].map((b) => (
                  <button
                    key={b.key}
                    onClick={b.onClick}
                    disabled={!!shareBusy}
                    className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-gray-100 hover:bg-gray-50 active:scale-[0.97] transition disabled:opacity-60"
                  >
                    <span className={`w-14 h-14 rounded-2xl flex items-center justify-center ${b.bg} ${b.fg} shadow-sm`}>{b.icon}</span>
                    <span className="leading-tight text-center">
                      <span className="block text-[12.5px] font-extrabold text-gray-800">{b.label}</span>
                      <span className="block text-[10.5px] font-bold text-gray-400">{b.sub}</span>
                    </span>
                  </button>
                ))}
              </div>

              {/* 보조 — 작게 한 줄 */}
              <div className="flex items-center justify-center gap-2 pt-3 border-t border-gray-100">
                {[
                  {
                    key: 'image', label: shareBusy === 'image' ? '만드는 중…' : '이미지 저장', onClick: downloadShareImage,
                    icon: (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M4 20h16" /></svg>),
                  },
                  {
                    key: 'link', label: '링크 복사', onClick: copyShareLink,
                    icon: (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1" /></svg>),
                  },
                  {
                    key: 'native', label: shareBusy === 'native' ? '여는 중…' : '더보기', onClick: shareNative,
                    icon: (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>),
                  },
                ].map((b) => (
                  <button
                    key={b.key}
                    onClick={b.onClick}
                    disabled={!!shareBusy}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#F5F3EF] hover:bg-gray-200 active:scale-[0.97] transition text-gray-600 disabled:opacity-60"
                  >
                    {b.icon}
                    <span className="text-[11px] font-bold whitespace-nowrap">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
        {/* CTA 줄 — '다른 유형 구경하기' + 'BMTI 빙고판 하러가기'(형광펜 글자). '실패 없는 운동 강사 고르는 방법' 박스 위 */}
        <div className="w-full flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-8">
          <button
            onClick={() => setShowGallery(true)}
            className="inline-flex items-center gap-2 bg-transparent border-none active:scale-[0.98] transition-transform"
          >
            <span className="w-8 h-8 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            </span>
            <span className="text-[13px] md:text-base font-extrabold text-gray-900 whitespace-nowrap" style={YELLOW_HL}>다른 유형 구경하기</span>
            <span className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-900 flex items-center justify-center text-base font-bold shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.12)]">→</span>
          </button>
          <button
            onClick={() => setShowBingo(true)}
            className="inline-flex items-center gap-2 bg-transparent border-none active:scale-[0.98] transition-transform"
          >
            <span className="w-8 h-8 flex items-center justify-center shrink-0 text-lg">⭐️</span>
            <span className="text-[13px] md:text-base font-extrabold text-gray-900 whitespace-nowrap" style={YELLOW_HL}>BMTI 빙고판 하러가기</span>
            <span className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-900 flex items-center justify-center text-base font-bold shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.12)]">→</span>
          </button>
        </div>
        {showGallery && <TypeGallery hasBmti={!!bmtiCode} onStartTest={() => { setShowGallery(false); setView('quiz'); }} onClose={() => setShowGallery(false)} />}
        {showBingo && <BingoGallery onClose={() => setShowBingo(false)} />}
        <div className="fade-in flex flex-col gap-5">
          {/* Custom Instructor Guide Section */}
          <div className="bg-white border border-gray-200 rounded-[2rem] px-5 py-8 md:p-10 text-left shadow-[0_6px_22px_rgba(0,0,0,0.20)]">
            <h5 className="font-semibold text-sm md:text-base text-gray-500 mb-5 flex items-center gap-2">
              <span className="text-xl">🙋🏻‍♂️🙋🏻‍♀️</span> 실패 없는 운동 강사 고르는 방법
            </h5>
            <div className="flex flex-col gap-6">
              {(() => {
                let instructorKey = 'DZ_strong';
                const baseInstructor = axisCode && axisCode.length === 4 ? axisCode.substring(2, 4) : 'DZ';
                if (bmtiAnswers && bmtiAnswers.length > 0) {
                  const percentages = calculateBMTIPercentages(bmtiAnswers);
                  const thirdLetter = axisCode ? axisCode[2] : 'D';
                  if (percentages && percentages[thirdLetter] >= 80) {
                    instructorKey = baseInstructor + '_strong';
                  } else {
                    instructorKey = baseInstructor + '_flexible';
                  }
                } else {
                  // Fallback if no answers are available (e.g. direct entry to result)
                  instructorKey = baseInstructor + '_flexible';
                }
                const guideData = INSTRUCTOR_GUIDE_DATA[instructorKey] || INSTRUCTOR_GUIDE_DATA['DZ_flexible'];
                
                const isOpen = !!openDetailSections.instructor;
                return (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-[#7C6FF0] leading-snug break-keep tracking-tight">
                      {guideData.title}
                    </h3>
                    <div className="grid grid-rows-[1fr] opacity-100">
                      <div className="overflow-hidden">
                        <div className="md:bg-gray-50/80 md:rounded-2xl p-0 md:p-7 space-y-5 mt-4 md:mt-0">
                          <div>
                            <span className="text-sm md:text-[15px] font-bold text-gray-800 mb-1.5 block">맞춤 운동 가이드:</span>
                            <p className="text-[15px] md:text-base text-gray-600 leading-relaxed break-keep">
                              {guideData.goodGuide}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm md:text-[15px] font-bold text-[#7C6FF0] mb-1.5 block">최악의 운동 가이드:</span>
                            <p className="text-[15px] md:text-base text-gray-600 leading-relaxed break-keep">
                              {guideData.badGuide}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Custom Escape Data Section */}
          <div className="bg-white border border-gray-200 rounded-[2rem] px-5 py-8 md:p-10 text-left shadow-[0_6px_22px_rgba(0,0,0,0.20)]">
            <h5 className="font-semibold text-sm md:text-base text-gray-500 mb-5 flex items-center gap-2">
              <span className="text-xl">💸</span> 헬스장 기부천사 탈출법
            </h5>
            <div className="flex flex-col gap-6">
              {(() => {
                let escapeKey = 'OQ_strong';
                const baseEscape = axisCode && axisCode.length >= 3 ? axisCode[0] + axisCode[2] : 'OQ';
                if (bmtiAnswers && bmtiAnswers.length > 0) {
                  const percentages = calculateBMTIPercentages(bmtiAnswers);
                  const firstLetter = axisCode ? axisCode[0] : 'O';
                  if (percentages && percentages[firstLetter] >= 80) {
                    escapeKey = baseEscape + '_strong';
                  } else {
                    escapeKey = baseEscape + '_flexible';
                  }
                } else {
                  escapeKey = baseEscape + '_flexible';
                }
                const escapeInfo = ESCAPE_DATA[escapeKey] || ESCAPE_DATA['OQ_flexible'];
                
                const isOpen = !!openDetailSections.escape;
                return (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-[#C9862A] leading-snug break-keep tracking-tight">
                      {escapeInfo.title}
                    </h3>
                    <div className="grid grid-rows-[1fr] opacity-100">
                      <div className="overflow-hidden">
                        <div className="md:bg-gray-50/80 md:rounded-2xl p-0 md:p-7 space-y-5 mt-4 md:mt-0">
                          <div>
                            <span className="text-sm md:text-[15px] font-bold text-gray-800 mb-1.5 block">당신의 특징:</span>
                            <p className="text-[15px] md:text-base text-gray-600 leading-relaxed break-keep">
                              {escapeInfo.trait}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm md:text-[15px] font-bold text-[#C9862A] mb-1.5 block">환불 하고 싶어지는 순간:</span>
                            <p className="text-[15px] md:text-base text-gray-600 leading-relaxed break-keep">
                              {escapeInfo.refund}
                            </p>
                          </div>
                          <div className="pt-2">
                            <span className="inline-block bg-[#C9862A]/10 text-[#C9862A] text-sm md:text-[15px] font-bold px-3 py-1 rounded-lg mb-2">
                              💡 기부천사 탈출법
                            </span>
                            <p className="text-[15px] md:text-base text-gray-700 font-medium leading-relaxed break-keep">
                              {escapeInfo.escape}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Custom Worst Vibe Section */}
          <div className="bg-white border border-gray-200 rounded-[2rem] px-5 py-8 md:p-10 text-left shadow-[0_6px_22px_rgba(0,0,0,0.20)]">
            <h5 className="font-semibold text-sm md:text-base text-gray-500 mb-5 flex items-center gap-2">
              <span className="text-xl">💥</span> 멘탈 바사삭 '최악의 운동 분위기'
            </h5>
            <div className="flex flex-col gap-6">
              {(() => {
                let vibeKey = 'OM_strong';
                const baseVibe = axisCode && axisCode.length >= 4 ? axisCode[0] + axisCode[3] : 'OM';
                if (bmtiAnswers && bmtiAnswers.length > 0) {
                  const percentages = calculateBMTIPercentages(bmtiAnswers);
                  const fourthLetter = axisCode ? axisCode[3] : 'M';
                  if (percentages && percentages[fourthLetter] >= 80) {
                    vibeKey = baseVibe + '_strong';
                  } else {
                    vibeKey = baseVibe + '_flexible';
                  }
                } else {
                  vibeKey = baseVibe + '_flexible';
                }
                const vibeData = WORST_VIBE_DATA[vibeKey] || WORST_VIBE_DATA['OM_flexible'];
                
                const isOpen = !!openDetailSections.vibe;
                return (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-[#D6486D] leading-snug break-keep tracking-tight">
                      {vibeData.name}
                    </h3>
                    <div className="grid grid-rows-[1fr] opacity-100">
                      <div className="overflow-hidden">
                        <div className="flex flex-col gap-5 mt-2">
                          <div className="flex flex-col gap-1.5">
                            <h6 className="font-bold text-gray-900 text-[15px] md:text-base w-max mb-0.5">당신의 특징:</h6>
                            <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">{vibeData.trait}</p>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <h6 className="font-bold text-[#D6486D] text-[15px] md:text-base w-max mb-0.5">최악의 분위기:</h6>
                            <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">{vibeData.worst}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

        </div>

        {/* 제일 하단 — 카카오톡으로 내 결과지 저장하기(가로로 길게) */}
        <button
          onClick={handleSaveResultPDF}
          disabled={isSavingPDF}
          className="w-full mt-8 bg-[#FEE500] hover:bg-[#F4DC00] disabled:opacity-60 disabled:cursor-wait rounded-3xl py-5 px-6 flex items-center justify-center gap-3 transition-all shadow-sm border border-[#F4DC00]/60 active:scale-[0.99]"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#3C1E1E] shrink-0"><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" /></svg>
          <span className="font-extrabold text-[#3C1E1E] text-[15px] md:text-lg">
            {isSavingPDF ? '결과지 만드는 중...' : '카카오톡으로 내 결과지 저장하기'}
          </span>
          <span className="text-[10px] md:text-[11px] text-[#3C1E1E]/70 font-bold bg-black/5 px-2.5 py-1 rounded-full shrink-0">PDF</span>
        </button>

        {/* 공유 결과 안내 토스트 */}
        {toast && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-28 z-[130] bg-black/85 text-white text-[13px] font-bold px-5 py-3 rounded-2xl shadow-lg pointer-events-none max-w-[calc(100%-48px)] text-center break-keep">
            {toast}
          </div>
        )}

      {/* ===== PDF 결과지 소스 (화면에는 보이지 않고 html2canvas 캡처용으로만 존재) =====
          섹션마다 별도 ref로 캡처해 PDF에서 각 블록이 통째로 다음 페이지로 넘어가도록 한다. */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }}>
        {/* ── 공유용 '이력서' 카드 (인스타 스토리·X·이미지 저장 공용) ───────────── */}
        {(() => {
          const B = '2px solid #1C1A17';                      // 표 테두리
          const cell = { border: B, padding: '14px 12px', textAlign: 'center', fontSize: '20px', fontWeight: 700, color: '#1C1A17' };
          const label = { ...cell, fontWeight: 800, fontSize: '19px' };
          const axes = percentages ? [['A', 'O'], ['C', 'L'], ['D', 'Q'], ['Z', 'M']].map(([l1, l2]) => {
            const isLeft = percentages[l1] >= 50;
            const active = isLeft ? l1 : l2;
            const percent = Math.max(percentages[l1], percentages[l2]);
            const level = percent >= 80 ? 'confident' : 'flexible';
            const d = TENDENCY_DATA[active];
            return { key: l1, emoji: d[level].emoji, name: `${d[level].modifier} ${d.name.replace(/\s*\(.*\)$/, '')}`, quote: d[level].quote, hl: (TENDENCY_HL[active] || {})[level], percent, color: TENDENCY_HEX[l1] || '#8B7BD8' };
          }) : [];
          // 대표 문장의 핵심 문구만 성향 색으로 — 웹 결과지와 동일
          const renderCardQuote = (a) => {
            const i = a.hl && a.quote.includes(a.hl) ? a.quote.indexOf(a.hl) : -1;
            if (i < 0) return <>&quot;{a.quote}&quot;</>;
            return <>&quot;{a.quote.slice(0, i)}<span style={{ color: a.color, fontWeight: 800 }}>{a.hl}</span>{a.quote.slice(i + a.hl.length)}&quot;</>;
          };
          // 결과지(웹) 스타일 그대로 — 흰 배경 · 둥근 박스 · 검은 그림자 · 얇은 구분선 · 핵심 문구 색상
          const card = { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '26px', boxShadow: '0 5px 18px rgba(0,0,0,0.18)', padding: '22px 24px', boxSizing: 'border-box' };
          const hr = { height: '1px', background: '#1C1A17', opacity: 0.12, margin: '13px 0' };
          return (
            <div ref={shareCardRef} style={{ width: '900px', background: '#FFFFFF', padding: '22px', fontFamily: "'Pretendard', sans-serif", boxSizing: 'border-box', color: '#1C1A17' }}>
              {/* 헤더 카드 — 원본 이미지를 가로 꽉 차게, 문구는 그 아래 */}
              <div style={{ ...card, padding: 0, overflow: 'hidden', marginBottom: '12px' }}>
                {charData && (
                  <img src={charData.originalImage} alt={axisCode} style={{ width: '100%', height: 'auto', display: 'block' }} crossOrigin="anonymous" />
                )}
                <div style={{ padding: '20px 24px 22px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.2em', color: '#9CA3AF', lineHeight: 1.2, marginBottom: '8px' }}>BMTI 움직임 성향 테스트</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.5px' }}>
                    {axisCode}<span style={{ color: '#B7B2A9', marginLeft: '12px' }}>{CODE_KO[axisCode]}</span>
                  </div>
                  <div style={{ ...hr, margin: '13px 0' }} />
                  <div style={{ fontSize: '24px', fontWeight: 900, lineHeight: 1.25, color: '#8B7BD8', whiteSpace: 'pre-line', marginBottom: '6px' }}>
                    {(resultData.nickname || '').replace(/\n/g, ' ')}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.45, color: '#4B5563', whiteSpace: 'pre-line' }}>{info.catchphrase}</div>
                </div>
              </div>

              {/* 4가지 성향 */}
              <div style={card}>
                <div style={{ fontSize: '19px', fontWeight: 900, lineHeight: 1.2, marginBottom: '14px' }}>🔍 나를 움직이게 하는 4가지 성향</div>
                {axes.map((a, i) => (
                  <div key={a.key} style={{ marginTop: i > 0 ? '13px' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap', color: '#4B5563' }}>
                        <span style={{ marginRight: '7px' }}>{a.emoji}</span>{a.name}
                      </span>
                      <div style={{ flex: 1, height: '11px', background: '#F3F1EC', borderRadius: '999px', overflow: 'hidden', minWidth: '100px' }}>
                        <div style={{ width: `${a.percent}%`, height: '11px', background: a.color, borderRadius: '999px' }} />
                      </div>
                      <span style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.2, color: a.color, width: '54px', textAlign: 'right' }}>{a.percent}%</span>
                    </div>
                    <div style={{ fontSize: '16.5px', fontWeight: 700, lineHeight: 1.45, color: '#1C1A17', marginTop: '5px' }}>{renderCardQuote(a)}</div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '16px', fontWeight: 800, lineHeight: 1.2, color: '#9CA3AF' }}>
                나도 검사하기 · bmti-official.co.kr
              </div>
            </div>
          );
        })()}

        <div style={{ width: '736px', background: '#ffffff', color: '#1f2937', fontFamily: "'Pretendard', sans-serif" }}>
          {/* Header */}
          <div ref={printHeaderRef} style={{ textAlign: 'center', padding: '8px 8px 24px' }}>
            <p style={{ fontSize: '13px', letterSpacing: '0.3em', color: '#9ca3af', fontWeight: 700, marginBottom: '10px' }}>MY BMTI RESULT</p>
            <h1 style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-1px', margin: '0 0 18px' }}>{axisCode} <span style={{ color: '#B7B2A9' }}>{CODE_KO[axisCode]}</span></h1>
            {charData && (
              <img src={charData.originalImage} alt={axisCode} style={{ width: '280px', height: 'auto', margin: '0 auto 18px', display: 'block', borderRadius: '20px' }} crossOrigin="anonymous" />
            )}
            {resultData.nickname && (
              <h2 style={{ fontSize: '26px', fontWeight: 800, whiteSpace: 'pre-line', lineHeight: 1.3, margin: '0 0 14px' }}>{resultData.nickname}</h2>
            )}
            <p style={{ fontSize: '15px', color: '#4b5563', whiteSpace: 'pre-line', lineHeight: 1.6 }}>"{info.catchphrase}"</p>
          </div>

          {/* 4가지 성향 (성향별로 각각 별도 캡처) */}
          {percentages && [['A', 'O'], ['C', 'L'], ['D', 'Q'], ['Z', 'M']].map(([l1, l2], idx) => {
            const isLeft = percentages[l1] >= 50;
            const activeLetter = isLeft ? l1 : l2;
            const percent = Math.max(percentages[l1], percentages[l2]);
            const level = percent >= 80 ? 'confident' : 'flexible';
            const data = TENDENCY_DATA[activeLetter];
            const barColor = { A: '#FF6B6B', C: '#4ECDC4', D: '#60A5FA', Z: '#A78BFA' }[l1] || '#4ECDC4';
            const hlPhrase = (TENDENCY_HL[activeLetter] || {})[level];
            const hlColor = TENDENCY_HEX[l1] || barColor;
            const q = data[level].quote;
            const qi = hlPhrase && q.includes(hlPhrase) ? q.indexOf(hlPhrase) : -1;
            return (
              <div
                key={l1}
                ref={(el) => { printTendencyRefs.current[idx] = el; }}
                style={{ background: '#fafaf9', borderRadius: '14px', padding: '18px', margin: '8px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{data[level].emoji}</span>
                  <span style={{ fontWeight: 800, fontSize: '15px' }}>{data[level].modifier} {data.name}</span>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: barColor, marginLeft: 'auto' }}>{percent}%</span>
                </div>
                {/* 게이지 바 — 화면 결과지와 동일 */}
                <div style={{ height: '8px', background: '#efedea', borderRadius: '999px', overflow: 'hidden', margin: '0 0 10px' }}>
                  <div style={{ height: '8px', width: `${percent}%`, background: barColor, borderRadius: '999px' }}></div>
                </div>
                <p style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 6px' }}>
                  {qi >= 0 ? (<>&quot;{q.slice(0, qi)}<span style={{ color: hlColor, fontWeight: 800 }}>{hlPhrase}</span>{q.slice(qi + hlPhrase.length)}&quot;</>) : `"${q}"`}
                </p>
                <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{data[level].desc}</p>
              </div>
            );
          })}

          {/* 궁합(환상의 짝꿍·다른 템포) 제거 — BMTI 관계도가 대신 보여준다 */}

          {/* 강사 가이드 */}
          <div ref={printInstructorRef} style={{ padding: '20px 8px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px' }}>🙋🏻‍♂️🙋🏻‍♀️ 실패 없는 운동 강사 고르는 방법</p>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#7C6FF0', marginBottom: '14px' }}>{guideData.title}</h3>
            <p style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '4px' }}>맞춤 운동 가이드</p>
            <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: 1.7, marginBottom: '14px' }}>{guideData.goodGuide}</p>
            <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#7C6FF0', marginBottom: '4px' }}>최악의 운동 가이드</p>
            <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{guideData.badGuide}</p>
          </div>

          {/* 탈출법 */}
          <div ref={printEscapeRef} style={{ padding: '20px 8px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px' }}>💸 헬스장 기부천사 탈출법</p>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#C9862A', marginBottom: '14px' }}>{escapeInfo.title}</h3>
            <p style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '4px' }}>당신의 특징</p>
            <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: 1.7, marginBottom: '14px' }}>{escapeInfo.trait}</p>
            <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#C9862A', marginBottom: '4px' }}>환불 하고 싶어지는 순간</p>
            <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: 1.7, marginBottom: '14px' }}>{escapeInfo.refund}</p>
            <p style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '4px' }}>💡 기부천사 탈출법</p>
            <p style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.7, margin: 0 }}>{escapeInfo.escape}</p>
          </div>

          {/* 최악의 분위기 */}
          <div ref={printVibeRef} style={{ padding: '20px 8px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px' }}>💥 멘탈 바사삭 '최악의 운동 분위기'</p>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#D6486D', marginBottom: '14px' }}>{vibeData.name}</h3>
            <p style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '4px' }}>당신의 특징</p>
            <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: 1.7, marginBottom: '14px', whiteSpace: 'pre-line' }}>{vibeData.trait}</p>
            <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#D6486D', marginBottom: '4px' }}>최악의 분위기:</p>
            <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{vibeData.worst}</p>
          </div>

          {/* Footer */}
          <div ref={printFooterRef} style={{ textAlign: 'center', padding: '24px 8px 8px' }}>
            <p style={{ fontSize: '11.5px', color: '#9ca3af', marginBottom: '4px' }}>나도 BMTI 검사하기 👇</p>
            <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#4b5563' }}>{siteUrl}</p>
            <p style={{ fontSize: '10.5px', color: '#d1d5db', marginTop: '6px' }}>BMTI — Body Management Type Indicator</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ResultView;
