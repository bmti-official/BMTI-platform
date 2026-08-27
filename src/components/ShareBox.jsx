/* eslint-disable */
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { CHARACTERS, CODE_KO, calculateBMTIPercentages } from '../data';
import { BMTI_RESULTS } from '../bmti_results';
import { TENDENCY_DATA } from '../customResultData';
import { TENDENCY_HL, TENDENCY_HEX, BMTI_INFO } from '../lib/resultMeta';
import { track } from '../lib/analytics';

// 친구에게 공유하기 — 결과지·메인에서 함께 쓰는 공용 박스.
// 카카오/인스타/X 3개를 나란히, 이미지 저장·링크 복사·더보기는 작게.
// 캡처용 '결과 카드'(화면에 보이지 않음)도 이 컴포넌트가 함께 들고 있다.
export default function ShareBox({ bmtiCode, bmtiAnswers, isLoggedIn, onRequireLogin, className = '' }) {
  const [shareBusy, setShareBusy] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const shareCardRef = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  };

  const siteUrl = 'https://bmti-official.co.kr/';
  const axisCode = bmtiCode ? String(bmtiCode).split('-')[0] : '';
  const info = BMTI_INFO[axisCode] || BMTI_INFO['ACDM'];
  const resultData = BMTI_RESULTS[axisCode] || {};
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const percentages = bmtiAnswers && bmtiAnswers.length > 0 ? calculateBMTIPercentages(bmtiAnswers) : null;
  const waitForImages = (el) => Promise.all(Array.from(el.querySelectorAll('img')).map((img) => (
    img.complete ? Promise.resolve() : new Promise((res) => { img.onload = res; img.onerror = res; })
  )));

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
    const shareUrl = `${siteUrl}t/${axisCode}.html`;

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
  const shareUrl = `${siteUrl}t/${axisCode}.html`;
  // 공유 문구 — 닉네임은 대표 줄만 쓰고(윗줄 수식어는 붙이면 두 문장이 뭉개진다), 줄바꿈을 살려 읽기 쉽게.
  const shareText = (() => {
    const parts = (resultData.nickname || '').split('\n').map(s => s.trim()).filter(Boolean);
    const main = parts.length > 1 ? parts.slice(1).join(' ') : (parts[0] || axisCode);
    const catchphrase = (info.catchphrase || '').trim();
    return `나의 BMTI는 '${main}' (${axisCode} ${CODE_KO[axisCode] || ''})\n\n${catchphrase}\n\n#BMTI #움직임성향테스트`;
  })();

  // 공유 카드(이력서 형태)를 이미지로 — 인스타 스토리/X/이미지 저장/기본공유에서 함께 쓴다.
  const captureShareImage = async () => {
    const el = shareCardRef.current;
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
  // X는 웹 인텐트로 이미지를 첨부할 수 없다.
  //  · 모바일: OS 공유 시트로 결과 카드 이미지를 X 앱에 직접 첨부
  //  · 그 외: 문구+링크 인텐트 — 링크(유형별 카드 페이지)의 트위터 카드로 큰 이미지가 뜬다
  const shareToX = async () => {
    const openIntent = () => {
      const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(u, '_blank', 'noopener');
    };
    const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
    if (!isMobile) { openIntent(); return; }
    try {
      setShareBusy('x');
      const blob = await captureShareImage();
      const file = blob ? new File([blob], `BMTI_${axisCode}.png`, { type: 'image/png' }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: `${shareText} ${shareUrl}` });
      } else {
        openIntent();
      }
    } catch { /* 사용자가 취소한 경우 포함 */ } finally { setShareBusy(null); }
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

  if (!axisCode) return null;

  return (
    <>
          {/* 친구에게 공유하기 — 대표(카카오) 1개 + 보조 채널 5개를 한 박스에 */}
          <div className={`w-full ${className}`}>
            <div className="w-full bg-white rounded-[1.75rem] p-5 md:p-6">
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
                    key: 'x', label: 'X', sub: shareBusy === 'x' ? '준비 중…' : '트위터', onClick: shareToX,
                    bg: 'bg-black', fg: 'text-white',
                    icon: (<svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M18.9 2H22l-7.1 8.1L23.2 22h-6.5l-5.1-6.6L5.8 22H2.7l7.6-8.7L1.5 2H8l4.6 6.1L18.9 2Zm-1.1 18h1.7L7.3 3.7H5.5L17.8 20Z" /></svg>),
                  },
                ].map((b) => (
                  <button
                    key={b.key}
                    onClick={() => { track('share_click', { channel: b.key }); b.onClick(); }}
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
                    onClick={() => { track('share_click', { channel: b.key }); b.onClick(); }}
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

      {/* 공유 결과 안내 토스트 */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-28 z-[130] bg-black/85 text-white text-[13px] font-bold px-5 py-3 rounded-2xl shadow-lg pointer-events-none max-w-[calc(100%-48px)] text-center break-keep">
          {toast}
        </div>
      )}

      {/* 캡처 전용 — 화면에는 보이지 않는다 */}
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
          const card = { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '26px', boxShadow: '0 8px 26px rgba(0,0,0,0.28)', padding: '22px 24px', boxSizing: 'border-box' };
          return (
            <div ref={shareCardRef} style={{ width: '900px', background: '#FFFFFF', padding: '30px 26px', fontFamily: "'Pretendard', sans-serif", boxSizing: 'border-box', color: '#1C1A17' }}>
              {/* 헤더 카드 — 원본 이미지를 가로 꽉 차게, 문구는 그 아래 */}
              <div style={{ ...card, padding: 0, overflow: 'hidden', marginBottom: '12px' }}>
                {charData && (
                  <img src={charData.originalImage} alt={axisCode} style={{ width: '100%', height: 'auto', display: 'block' }} crossOrigin="anonymous" />
                )}
                {/* 문구 배치·크기·색상은 웹 결과지와 동일 — 닉네임(윗줄 회색 + 본문 검정) → 유형 코드 → 캐치프레이즈 */}
                <div style={{ padding: '26px 24px 28px', textAlign: 'center' }}>
                  {(() => {
                    const parts = (resultData.nickname || '').split('\n');
                    const first = parts.length > 1 ? parts[0] : null;
                    const main = parts.length > 1 ? parts.slice(1).join(' ') : (resultData.nickname || '');
                    return (
                      <div style={{ lineHeight: 1.2, letterSpacing: '-0.5px' }}>
                        {first && <div style={{ fontSize: '25px', fontWeight: 800, color: '#9CA3AF', lineHeight: 1.25, marginBottom: '5px' }}>{first}</div>}
                        <div style={{ fontSize: '54px', fontWeight: 900, color: '#111827', lineHeight: 1.2 }}>{main}</div>
                      </div>
                    );
                  })()}
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#9CA3AF', lineHeight: 1.3, marginTop: '13px', letterSpacing: '-0.3px' }}>
                    {axisCode} <span style={{ color: '#D1D5DB' }}>{CODE_KO[axisCode]}</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.65, color: '#4B5563', whiteSpace: 'pre-line', marginTop: '18px' }}>{info.catchphrase}</div>
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
      </div>
    </>
  );
}
