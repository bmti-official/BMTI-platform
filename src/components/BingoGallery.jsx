import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CHARACTERS, CHARACTER_NAMES, CODE_KO, BMTI_INFO } from '../data';

// 유형별 빙고 문구 풀(각 32개) — 각 유형의 '4가지 성향' 유연한 + 강사/탈출법/최악의 분위기에서 뽑은 핵심 단어(1~5자).
// 8개 성향축(유연한) × 5 + 강사/탈출법/최악의 분위기 각 4 = 유형마다 32개.
const TENDENCY_KW = {
  A: ['가볍게 움직임', '산책 즐김', '개운함', '리프레시', '몸 풀기'],
  O: ['조용히 휴식', '천천히 충전', '내 속도', '푹 쉬기', '고요함'],
  C: ['한 곳 집중', '콕 집어', '부위 명확', '핵심 부위', '딱 그곳'],
  L: ['전체 연결', '몸 전체', '흐름 파악', '주변까지', '큰 그림'],
  D: ['직접 해보기', '일단 실전', '몸으로 감', '해봐야 앎', '실전파'],
  Q: ['이유부터', '왜 하는지', '원리 이해', '납득되면', '알고 하기'],
  Z: ['팩트로', '방향 먼저', '핵심만', '정확하게', '군더더기X'],
  M: ['다정한 공감', '칭찬 한마디', '따뜻한 격려', '마음 위로', '공감 먼저'],
};
const INSTRUCTOR_KW = { // 실패 없는 운동 강사 (유연한)
  DZ: ['짧은 설명', '핵심 피드백', '바로 실전', '군더더기X'],
  DM: ['페이스 맞춤', '컨디션 체크', '다정한 응원', '함께 파이팅'],
  QZ: ['원리 요약', '직관적 설명', '명확한 근거', '핵심 정리'],
  QM: ['차근차근', '친절한 설명', '방향 제시', '따뜻한 코치'],
};
const ESCAPE_KW = { // 헬스장 기부천사 탈출법 (유연한)
  AD: ['강약 조절', '뚜렷한 목표', '굵고 짧게', '효율 운동'],
  AQ: ['활기+정확', '자극점 체크', '꼼꼼한 자세', '흥+디테일'],
  OD: ['마이웨이', '내 루틴', '혼자 묵묵', '내 페이스'],
  OQ: ['차분하게', '디테일 코칭', '섬세한 자극', '조용한 집중'],
};
const VIBE_KW = { // 멘탈 바사삭 최악의 운동 분위기 (유연한)
  AZ: ['효율 중시', '객관적 피드백', '적당한 강도', '스마트하게'],
  AM: ['다 같이 파이팅', '긍정 에너지', '으쌰으쌰', '웃는 분위기'],
  OZ: ['실용적', '깔끔한 피드백', '담백하게', '차분+정확'],
  OM: ['소확행 운동', '혼자 아늑', '쾌적한 공간', '다정한 방향'],
};
function poolForCode(code) {
  const raw = [
    ...[code[0], code[1], code[2], code[3]].flatMap((l) => TENDENCY_KW[l] || []),
    ...(INSTRUCTOR_KW[code.slice(2, 4)] || []),
    ...(ESCAPE_KW[code[0] + code[2]] || []),
    ...(VIBE_KW[code[0] + code[3]] || []),
  ];
  return [...new Set(raw)];
}
function pickRandom(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}
// 선택된 칸 통일 색상 — 연한 옐로우
const BINGO_ON = '#F5DE6E';

const LINES = [
  [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
  [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
  [0, 5, 10, 15], [3, 6, 9, 12],
];

const YELLOW_SHADOW = '0 2px 6px rgba(220,188,86,0.18), 0 12px 28px rgba(233,203,110,0.34)';

// 다른 유형 구경하기와 같은 오버레이 — 캐릭터를 고르면 그 유형의 4×4 빙고판.
export default function BingoGallery({ onClose }) {
  const [selected, setSelected] = useState(null);
  const scrollRef = useRef(null);
  const overlay = (
    <div ref={scrollRef} className="fixed inset-0 z-[110] bg-white overflow-y-auto" style={{ fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      {selected ? <BingoBoard key={selected} code={selected} onBack={() => setSelected(null)} onClose={onClose} scrollRef={scrollRef} /> : <BingoGrid onPick={setSelected} onClose={onClose} />}
    </div>
  );
  return createPortal(overlay, document.body);
}

// 우측 하단 '상단으로' 버튼 — 오버레이 스크롤 컨테이너를 맨 위로.
function ScrollTopFab({ scrollRef }) {
  return (
    <button onClick={() => scrollRef?.current?.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="맨 위로"
      className="fixed z-[120] bottom-6 right-5 w-11 h-11 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-600 active:scale-95 transition">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
    </button>
  );
}

function BingoGrid({ onPick, onClose }) {
  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-28">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[19px] font-black text-gray-900">⭐️ BMTI 빙고판</h2>
        <button onClick={onClose} aria-label="닫기" className="text-gray-400 hover:text-gray-700 text-2xl leading-none">✕</button>
      </div>
      <p className="text-[13px] text-gray-500 mb-6 break-keep">궁금한 유형을 눌러 <b style={{ color: '#8B7BD8' }}>나만의 빙고판</b>을 채워보세요.</p>
      <div className="rounded-[1.6rem] bg-white border border-[#F3EFE6] p-3.5" style={{ boxShadow: YELLOW_SHADOW }}>
        <div className="grid grid-cols-4 gap-2.5">
          {CHARACTERS.map((c) => (
            <button key={c.id} onClick={() => onPick(c.id)} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
              <span className={`w-full aspect-square rounded-2xl flex items-center justify-center overflow-hidden ${c.color || 'bg-gray-100'}`}>
                <img src={c.image} alt={c.id} className={`w-full h-full object-contain ${c.imgClass || ''}`} />
              </span>
              <span className="text-[10px] font-extrabold text-gray-700 leading-none">{c.id}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BingoBoard({ code, onBack, onClose, scrollRef }) {
  const color = (BMTI_INFO[code] || {}).color || '#C9975A';
  const charData = CHARACTERS.find((c) => c.id === code);
  const [cells, setCells] = useState(() => pickRandom(poolForCode(code), 16));
  const [marked, setMarked] = useState(() => new Set());
  const reshuffle = () => { setMarked(new Set()); setCells(pickRandom(poolForCode(code), 16)); };
  const toggle = (i) => setMarked((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const completed = LINES.filter((l) => l.every((i) => marked.has(i)));
  const lit = new Set(completed.flat());
  const bingoCount = completed.length;

  return (
    <div className="max-w-md mx-auto pb-28">
      {/* 상단 — '유형 목록'·타이틀·✕를 한 줄에, 스크롤해도 따라오도록 sticky */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm relative flex items-center justify-between px-5 pt-5 pb-3">
        <button onClick={onBack} className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 shadow-sm px-3.5 py-2 text-[13px] font-bold text-gray-700 active:scale-95 transition">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          유형 목록
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-[17px] font-black text-gray-900 whitespace-nowrap">⭐️ BMTI 빙고판</span>
        <button onClick={onClose} aria-label="닫기" className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 text-lg active:scale-95 transition">✕</button>
      </div>

      <ScrollTopFab scrollRef={scrollRef} />

      <div className="px-5 pt-2">
        {/* 원본 이미지 크게 */}
        <div className="rounded-2xl overflow-hidden mb-3 bg-gray-50">
          {charData && <img src={charData.originalImage} alt={code} className="w-full object-cover" style={{ maxHeight: 200 }} />}
        </div>
        <div className="flex items-end justify-between mb-3">
          <div className="min-w-0">
            <div className="text-[16px] font-black text-gray-900 leading-tight break-keep">{(CHARACTER_NAMES[code] || code).replace(/\n/g, ' ')}</div>
            <div className="text-[11px] font-extrabold text-gray-400">{code} {CODE_KO[code]} 빙고판</div>
          </div>
          <button onClick={reshuffle} className="text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1 shrink-0 ml-2">초기화</button>
        </div>
        <p className="text-[12.5px] text-gray-500 font-bold break-keep mb-3">나에게 해당하는 칸을 눌러 빙고를 만들어보세요.</p>

        <div className="grid grid-cols-4 gap-1.5">
          {cells.map((text, i) => {
            const on = marked.has(i);
            const isLit = lit.has(i);
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                className="aspect-square rounded-xl p-1 flex items-center justify-center text-center transition-all active:scale-95"
                style={{
                  background: on ? BINGO_ON : '#fff',
                  border: `2px solid ${isLit ? '#E6B800' : on ? BINGO_ON : '#EDEBE6'}`,
                  boxShadow: isLit ? `0 0 0 2px ${BINGO_ON}, 0 2px 8px rgba(230,184,0,0.4)` : 'none',
                }}
              >
                <span className="flex flex-col items-center justify-center text-[13.5px] font-extrabold leading-[1.12] break-keep text-gray-900">
                  {text.replace(/\+/g, ' + ').split(/\s+/).filter(Boolean).map((ln, k) => <span key={k}>{ln}</span>)}
                </span>
              </button>
            );
          })}
        </div>

        {bingoCount > 0 && (
          <div className="text-center mt-5 rounded-2xl py-2.5 font-black text-gray-900 text-[15px]" style={{ background: BINGO_ON }}>
            ⭐️ 빙고 {bingoCount}줄!
          </div>
        )}
        <p className="text-center text-[11.5px] text-gray-400 mt-4 break-keep">
          가로·세로·대각선 한 줄을 모두 채우면 빙고!<br />문장은 각 유형의 성향·강사 가이드 설명을 바탕으로 만들었어요.
        </p>
        <button onClick={onBack} className="w-full mt-4 bg-white border border-gray-200 rounded-[1.4rem] py-4 text-[14px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
          다른 유형 빙고판 보기
        </button>
      </div>
    </div>
  );
}
