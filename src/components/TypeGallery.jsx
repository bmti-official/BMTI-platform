import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CHARACTERS, CHARACTER_NAMES, CODE_KO } from '../data';
import { BMTI_INFO, TENDENCY_HL } from './ResultView';
import { BMTI_RESULTS } from '../bmti_results';
import { TENDENCY_DATA } from '../customResultData';

// 4글자 코드를 성향 카드 4장으로 쪼갠다. 각 자리의 글자가 '활성 성향'.
const PAIRS = [['A', 'O'], ['C', 'L'], ['D', 'Q'], ['Z', 'M']];
const CARD_COLOR = { A: '#FF6B6B', C: '#4ECDC4', D: '#60A5FA', Z: '#A78BFA' };
const YELLOW_SHADOW = '0 2px 6px rgba(220,188,86,0.18), 0 12px 28px rgba(233,203,110,0.34)';

// 대표 문장에서 핵심 문구를 항목 색상으로 강조 — 결과지와 동일
function renderHlQuote(q, active, level, color) {
  const hl = (TENDENCY_HL[active] || {})[level];
  if (!hl || !q.includes(hl)) return `"${q}"`;
  const i = q.indexOf(hl);
  return <>&quot;{q.slice(0, i)}<span style={{ color }} className="font-extrabold">{hl}</span>{q.slice(i + hl.length)}&quot;</>;
}

// 다른 유형 구경하기 — 16가지 유형(4×4)의 누끼 캐릭터를 보여주고,
// 하나를 고르면 '확신의' 기준 예시 결과지(성향 박스까지만, 아코디언 없음)를 띄운다.
export default function TypeGallery({ onClose }) {
  const [selected, setSelected] = useState(null);

  const overlay = (
    <div className="fixed inset-0 z-[110] bg-white overflow-y-auto" style={{ fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      {selected ? (
        <TypePreview code={selected} onBack={() => setSelected(null)} onClose={onClose} />
      ) : (
        <TypeGrid onPick={setSelected} onClose={onClose} />
      )}
    </div>
  );
  return createPortal(overlay, document.body);
}

function TypeGrid({ onPick, onClose }) {
  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-28">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[19px] font-black text-gray-900">다른 유형 구경하기</h2>
        <button onClick={onClose} aria-label="닫기" className="text-gray-400 hover:text-gray-700 text-2xl leading-none">✕</button>
      </div>
      <p className="text-[13px] text-gray-500 mb-6 break-keep">궁금한 유형을 눌러 <b className="text-gray-700">예시 결과지</b>를 살펴보세요.</p>

      <div className="rounded-[1.6rem] bg-white border border-[#F3EFE6] p-3.5" style={{ boxShadow: YELLOW_SHADOW }}>
        <div className="grid grid-cols-4 gap-2.5">
          {CHARACTERS.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick(c.id)}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
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

function TypePreview({ code, onBack, onClose }) {
  const charData = CHARACTERS.find(c => c.id === code);
  const info = BMTI_INFO[code] || {};
  const resultData = BMTI_RESULTS[code] || {};
  // 확신의 ↔ 유연한 성향을 좌우로 넘겨보는 미리보기.
  const [level, setLevel] = useState('confident');
  const toggleLevel = () => setLevel(l => (l === 'confident' ? 'flexible' : 'confident'));
  const percent = level === 'confident' ? 85 : 60;

  return (
    <div className="max-w-md mx-auto pb-28">
      {/* 예시 안내 배너 — 실제 내 결과와 헷갈리지 않도록 상단 고정 */}
      <div className="sticky top-0 z-10 bg-[#C9975A] text-white px-5 py-3 flex items-center justify-between shadow-md">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] font-bold active:opacity-70">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          유형 목록
        </button>
        <span className="text-[13px] font-black tracking-tight">🔍 예시 결과지</span>
        <button onClick={onClose} aria-label="닫기" className="text-white/90 hover:text-white text-xl leading-none">✕</button>
      </div>

      <div className="px-5 pt-4">
        <div className="rounded-[1.2rem] bg-[#FBF4EA] border border-[#EBD8B8] px-4 py-3 mb-5 text-center">
          <p className="text-[13px] font-bold text-[#8A6A34] break-keep leading-relaxed">
            내 실제 유형이 아니라,
            <br /><b>{code} {CODE_KO[code]}</b> 유형을 골랐을 때 보이는 <b>예시</b>예요.
          </p>
        </div>

        {/* 히어로 — 캐릭터 이미지 + 별명 + 코드 + 캐치프레이즈 */}
        <div className="bg-white border border-gray-200 rounded-[2rem] px-5 pt-0 pb-8 shadow-sm overflow-hidden">
          <div className="w-[calc(100%+2.5rem)] -mx-5 mb-6">
            {charData && <img src={charData.originalImage} alt={code} className="w-full h-auto object-cover" />}
          </div>
          <div className="flex flex-col items-center text-center px-1">
            {resultData.nickname && (() => {
              const parts = resultData.nickname.split('\n');
              const first = parts.length > 1 ? parts[0] : null;
              const main = parts.length > 1 ? parts.slice(1).join(' ') : resultData.nickname;
              return (
                <h1 className="leading-[1.2] font-black tracking-tight text-gray-900 break-keep">
                  {first && <span className="block text-[clamp(0.85rem,3.2vw,1.2rem)] font-extrabold text-gray-400 mb-1">{first}</span>}
                  <span className="block text-[clamp(1.5rem,5.5vw,2.5rem)]">{main}</span>
                </h1>
              );
            })()}
            <span className="text-lg sm:text-xl font-bold text-gray-400 tracking-tight mt-3">
              {code} <span className="text-gray-300">{CODE_KO[code]}</span>
            </span>
            {info.catchphrase && (
              <p className="text-gray-500 text-sm font-medium whitespace-pre-line break-keep mt-4 leading-relaxed">
                {info.catchphrase}
              </p>
            )}
          </div>

          {/* 🔍 나를 움직이게 하는 4가지 성향 — 확신의 ↔ 유연한 좌우로 넘겨보기, 아코디언 없이 대표 문장까지만 */}
          <div className="w-full mt-10">
            <h3 className="text-[15px] md:text-lg font-bold text-gray-700 mb-4 flex items-center justify-center gap-2">
              <span>🔍 나를 움직이게 하는 4가지 성향</span>
            </h3>
            {/* 확신의/유연한 성향 스와이프 토글 */}
            <div className="flex items-center justify-center gap-3 mb-7">
              <button onClick={toggleLevel} aria-label="다른 성향 보기" className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 active:scale-90 transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span className="min-w-[92px] text-center px-4 py-1.5 rounded-full bg-gray-900 text-white text-sm font-extrabold">
                {level === 'confident' ? '확신의 성향' : '유연한 성향'}
              </span>
              <button onClick={toggleLevel} aria-label="다른 성향 보기" className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 active:scale-90 transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
            <div className="flex flex-col gap-1 w-full">
              {PAIRS.map(([l1, l2], i) => {
                const active = code[i];
                const data = TENDENCY_DATA[active];
                if (!data) return null;
                const v = data[level];
                const color = CARD_COLOR[l1];
                return (
                  <div key={l1} className="p-0 mb-7 w-full text-left">
                    <div className="flex items-center gap-3 mb-2.5">
                      <h4 className="shrink-0 whitespace-nowrap text-[13px] md:text-[14px] font-bold text-gray-500 flex items-center gap-1.5">
                        <span className="text-base md:text-lg">{v.emoji}</span>
                        <span>{v.modifier} {data.name}</span>
                      </h4>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="flex-1 min-w-0 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: color }}></div>
                        </div>
                        <span className="font-bold text-[11px] md:text-xs w-8 text-right shrink-0" style={{ color }}>{percent}%</span>
                      </div>
                    </div>
                    <p className="font-bold text-gray-800 text-[15.5px] md:text-[17px] leading-relaxed break-keep">
                      {renderHlQuote(v.quote, active, level, color)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-center text-[12px] text-gray-400 mt-6 break-keep">
          여기까지가 예시 미리보기예요. 내 유형의 전체 결과지는 BMTI 테스트로 확인할 수 있어요.
        </p>
        <button
          onClick={onBack}
          className="w-full mt-4 bg-white border border-gray-200 rounded-[1.4rem] py-4 text-[14px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          다른 유형 더 보기
        </button>
      </div>
    </div>
  );
}
