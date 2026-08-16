import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CHARACTERS, CHARACTER_NAMES, CODE_KO, BMTI_INFO } from '../data';

// 빙고 16칸 — 각 유형의 '4가지 성향' 유연한 설명글 10개 + 강사/탈출법/최악의 분위기 설명글 6개에서 뽑은 자가체크 문장.
const BINGO_CELLS = [
  '가볍게라도 움직이면 개운해져요',   // A 유연한
  '무리한 운동보다 조용히 쉴 때 충전돼요', // O 유연한
  '오늘 집중할 부위가 정해지면 편해요', // C 유연한
  '부위끼리 연결을 알면 더 시원해요',   // L 유연한
  '일단 직접 해보며 감을 잡아요',       // D 유연한
  '왜 좋은지 알아야 집중이 돼요',       // Q 유연한
  '친절함보다 방향을 먼저 알려주면 좋아요', // Z 유연한
  '가벼운 칭찬 한마디에 마음이 열려요', // M 유연한
  '하루 종일 앉아있으면 몸이 찌뿌둥해요', // 활동/휴식 설명
  '시끄러운 곳보다 조용한 내 시간이 좋아요', // 휴식 설명
  '설명은 짧게, 핵심만 짚어주면 좋아요', // 강사 가이드
  '차가운 지적보다 다정한 설명이 필요해요', // 강사 가이드
  '웜업보다 바로 본운동으로 직진하고 싶어요', // 탈출법
  '이어폰 끼고 혼자 내 루틴만 하고 싶어요',   // 탈출법
  '시끄러운 음악에 텐션만 높은 수업은 별로예요', // 최악의 분위기
  '여럿이 기록 재는 경쟁 분위기는 부담돼요', // 최악의 분위기
];

const LINES = [
  [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
  [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
  [0, 5, 10, 15], [3, 6, 9, 12],
];

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function shuffleByCode(arr, code) {
  return arr.map((v, i) => ({ v, k: hash(`${code}_${i}`) })).sort((a, b) => a.k - b.k).map((s) => s.v);
}

// 다른 유형 구경하기와 같은 오버레이 — 캐릭터를 고르면 그 유형의 4×4 빙고판.
export default function BingoGallery({ onClose }) {
  const [selected, setSelected] = useState(null);
  const overlay = (
    <div className="fixed inset-0 z-[110] bg-[#F7F7F6] overflow-y-auto" style={{ fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      {selected ? <BingoBoard code={selected} onBack={() => setSelected(null)} onClose={onClose} /> : <BingoGrid onPick={setSelected} onClose={onClose} />}
    </div>
  );
  return createPortal(overlay, document.body);
}

function BingoGrid({ onPick, onClose }) {
  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-28">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[19px] font-black text-gray-900">🎉 BMTI 빙고판</h2>
        <button onClick={onClose} aria-label="닫기" className="text-gray-400 hover:text-gray-700 text-2xl leading-none">✕</button>
      </div>
      <p className="text-[13px] text-gray-500 mb-6 break-keep">궁금한 유형을 눌러 <b className="text-gray-700">나만의 빙고판</b>을 채워보세요.</p>
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
      <div className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between shadow-md" style={{ background: color }}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] font-bold text-white active:opacity-70">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          유형 목록
        </button>
        <span className="text-[13px] font-black tracking-tight text-white">🎉 BMTI 빙고판</span>
        <button onClick={onClose} aria-label="닫기" className="text-white/90 hover:text-white text-xl leading-none">✕</button>
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-center gap-3 mb-3">
          <span className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 ${charData?.color || 'bg-gray-100'}`}>
            {charData && <img src={charData.image} alt={code} className={`w-full h-full object-contain ${charData.imgClass || ''}`} />}
          </span>
          <div className="min-w-0">
            <div className="text-[15px] font-black text-gray-900 leading-tight break-keep">{(CHARACTER_NAMES[code] || code).replace(/\n/g, ' ')}</div>
            <div className="text-[11px] font-extrabold text-gray-400">{code} {CODE_KO[code]} 빙고판</div>
          </div>
        </div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12.5px] text-gray-500 font-bold break-keep">나에게 해당하는 칸을 눌러 빙고를 만들어보세요.</p>
          <button onClick={() => setMarked(new Set())} className="text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1 shrink-0 ml-2">초기화</button>
        </div>

        {bingoCount > 0 && (
          <div className="text-center mb-3 rounded-2xl py-2.5 font-black text-white text-[15px]" style={{ background: color }}>
            🎉 빙고 {bingoCount}줄!
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
                  background: on ? color : '#fff',
                  border: `2px solid ${isLit ? '#fff' : on ? color : '#EDEBE6'}`,
                  boxShadow: isLit ? `0 0 0 2px ${color}, 0 2px 8px ${color}66` : 'none',
                }}
              >
                <span className="text-[9.5px] font-bold leading-[1.15] break-keep" style={{ color: on ? '#fff' : '#4B4640' }}>{text}</span>
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11.5px] text-gray-400 mt-5 break-keep">
          가로·세로·대각선 한 줄을 모두 채우면 빙고! 문장은 각 유형의 성향·강사 가이드 설명을 바탕으로 만들었어요.
        </p>
        <button onClick={onBack} className="w-full mt-4 bg-white border border-gray-200 rounded-[1.4rem] py-4 text-[14px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
          다른 유형 빙고판 보기
        </button>
      </div>
    </div>
  );
}
