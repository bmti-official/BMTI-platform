import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CHARACTERS, CHARACTER_NAMES, CODE_KO, BMTI_INFO } from '../data';

// 빙고 16칸 — 각 유형의 '4가지 성향' 유연한 설명 10개 + 강사/탈출법/최악의 분위기 6개에서 뽑은 핵심 단어(1~5자).
const BINGO_CELLS = [
  '움직임',   // A 유연한 — 가볍게라도 움직이면 개운
  '휴식',     // O 유연한 — 조용히 쉴 때 충전
  '집중',     // C 유연한 — 집중할 부위
  '연결',     // L 유연한 — 부위 연결
  '직접',     // D 유연한 — 직접 해보며
  '이유',     // Q 유연한 — 왜 좋은지
  '팩트',     // Z 유연한 — 방향 먼저
  '공감',     // M 유연한 — 가벼운 칭찬
  '찌뿌둥',   // 오래 앉으면
  '혼자',     // 조용한 내 시간
  '핵심만',   // 강사: 짧게 핵심만
  '다정함',   // 강사: 다정한 설명
  '직진',     // 탈출법: 바로 본운동
  '마이웨이', // 탈출법: 혼자 루틴
  '정숙',     // 최악: 시끄러운 텐션 수업
  '비경쟁',   // 최악: 경쟁 분위기
];
// 선택된 칸 통일 색상 — 연한 옐로우
const BINGO_ON = '#F5DE6E';

const LINES = [
  [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
  [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
  [0, 5, 10, 15], [3, 6, 9, 12],
];

const YELLOW_SHADOW = '0 2px 6px rgba(220,188,86,0.18), 0 12px 28px rgba(233,203,110,0.34)';

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function shuffleByCode(arr, code) {
  return arr.map((v, i) => ({ v, k: hash(`${code}_${i}`) })).sort((a, b) => a.k - b.k).map((s) => s.v);
}

// 다른 유형 구경하기와 같은 오버레이 — 캐릭터를 고르면 그 유형의 4×4 빙고판.
export default function BingoGallery({ onClose }) {
  const [selected, setSelected] = useState(null);
  const overlay = (
    <div className="fixed inset-0 z-[110] bg-white overflow-y-auto" style={{ fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      {selected ? <BingoBoard code={selected} onBack={() => setSelected(null)} onClose={onClose} /> : <BingoGrid onPick={setSelected} onClose={onClose} />}
    </div>
  );
  return createPortal(overlay, document.body);
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

function BingoBoard({ code, onBack, onClose }) {
  const color = (BMTI_INFO[code] || {}).color || '#C9975A';
  const charData = CHARACTERS.find((c) => c.id === code);
  const cells = useMemo(() => shuffleByCode(BINGO_CELLS, code), [code]);
  const [marked, setMarked] = useState(() => new Set());
  const toggle = (i) => setMarked((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const completed = LINES.filter((l) => l.every((i) => marked.has(i)));
  const lit = new Set(completed.flat());
  const bingoCount = completed.length;

  return (
    <div className="max-w-md mx-auto pb-28">
      {/* 상단 — 바 없이 알약 버튼(유형 목록·✕)과 큰 검은 타이틀 */}
      <div className="flex items-center justify-between px-5 pt-5">
        <button onClick={onBack} className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 shadow-sm px-3.5 py-2 text-[13px] font-bold text-gray-700 active:scale-95 transition">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          유형 목록
        </button>
        <button onClick={onClose} aria-label="닫기" className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 text-lg active:scale-95 transition">✕</button>
      </div>
      <div className="text-center text-[22px] font-black text-gray-900 mt-3 mb-4">⭐️ BMTI 빙고판</div>

      <div className="px-5">
        {/* 원본 이미지 크게 */}
        <div className="rounded-2xl overflow-hidden mb-3 bg-gray-50">
          {charData && <img src={charData.originalImage} alt={code} className="w-full object-cover" style={{ maxHeight: 200 }} />}
        </div>
        <div className="flex items-end justify-between mb-3">
          <div className="min-w-0">
            <div className="text-[16px] font-black text-gray-900 leading-tight break-keep">{(CHARACTER_NAMES[code] || code).replace(/\n/g, ' ')}</div>
            <div className="text-[11px] font-extrabold text-gray-400">{code} {CODE_KO[code]} 빙고판</div>
          </div>
          <button onClick={() => setMarked(new Set())} className="text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1 shrink-0 ml-2">초기화</button>
        </div>
        <p className="text-[12.5px] text-gray-500 font-bold break-keep mb-3">나에게 해당하는 칸을 눌러 빙고를 만들어보세요.</p>

        {bingoCount > 0 && (
          <div className="text-center mb-3 rounded-2xl py-2.5 font-black text-gray-900 text-[15px]" style={{ background: BINGO_ON }}>
            ⭐️ 빙고 {bingoCount}줄!
          </div>
        )}

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
                <span className="text-[13px] font-extrabold leading-[1.15] break-keep text-gray-900">{text}</span>
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11.5px] text-gray-400 mt-5 break-keep">
          가로·세로·대각선 한 줄을 모두 채우면 빙고!<br />문장은 각 유형의 성향·강사 가이드 설명을 바탕으로 만들었어요.
        </p>
        <button onClick={onBack} className="w-full mt-4 bg-white border border-gray-200 rounded-[1.4rem] py-4 text-[14px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
          다른 유형 빙고판 보기
        </button>
      </div>
    </div>
  );
}
