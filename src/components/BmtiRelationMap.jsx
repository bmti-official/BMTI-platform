/* eslint-disable */
import { useState } from 'react';
import { CHARACTERS, CHARACTER_NAMES, BMTI_INFO } from '../data';

// ─────────────────────────────────────────────
// BMTI 유형 관계도 — 16가지 유형이 어떻게 이어지는지 보여주는 지도.
// 4×4 격자에서 행=[AC·AL·OC·OL], 열=[DZ·DM·QZ·QM]로 놓으면
// '환상의 짝꿍'(네 글자가 모두 반대인 유형)이 정확히 격자 중심을 지나 마주 본다.
// 유형을 누르면 그 유형과 짝꿍을 강조하고 둘을 잇는 선을 그린다.
// ─────────────────────────────────────────────

const ROWS = ['AC', 'AL', 'OC', 'OL'];
const COLS = ['DZ', 'DM', 'QZ', 'QM'];
const codeAt = (r, c) => ROWS[r] + COLS[c];
const posOf = (code) => {
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (codeAt(r, c) === code) return { r, c };
  return { r: 0, c: 0 };
};

// 축 4개 — 각 글자의 뜻 (kr 이름에서 도출: A 활동적 / O 정적인 …)
const AXES = [
  { left: 'A', leftKr: '활동적', right: 'O', rightKr: '정적인', note: '얼마나 몸을 적극적으로 쓰는지' },
  { left: 'C', leftKr: '집중', right: 'L', rightKr: '전신', note: '한 부위 위주인지 몸 전체인지' },
  { left: 'D', leftKr: '실전', right: 'Q', rightKr: '탐구', note: '바로 해보는지 원리부터 파는지' },
  { left: 'Z', leftKr: '팩트', right: 'M', rightKr: '공감', note: '사실 위주인지 마음 위주인지' },
];

const charOf = (code) => CHARACTERS.find((c) => c.id === code);
const nickOf = (code) => (CHARACTER_NAMES[code] || code).replace(/\n/g, ' ');

export default function BmtiRelationMap({ bmtiCode }) {
  const myCode = bmtiCode ? bmtiCode.split('-')[0] : null;
  const [sel, setSel] = useState(myCode && BMTI_INFO[myCode] ? myCode : 'ACDZ');

  // 환상의 짝꿍 = 네 글자가 모두 반대인 유형. 4×4 격자에서 중심을 기준으로 마주 본 칸(점대칭).
  const selPos = posOf(sel);
  const matchPos = { r: 3 - selPos.r, c: 3 - selPos.c };
  const match = codeAt(matchPos.r, matchPos.c);
  const selColor = (BMTI_INFO[sel] || {}).color || '#C9975A';
  const matchColor = (BMTI_INFO[match] || {}).color || '#C9975A';
  const cx = (c) => ((c + 0.5) / 4) * 100;
  const cy = (r) => ((r + 0.5) / 4) * 100;
  const selLetters = sel.split('');

  return (
    <section className="px-6 max-w-md mx-auto mb-20">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide text-gray-400 mb-2">
          <span className="w-4 h-[1.5px] bg-gray-300 inline-block" /> BMTI 관계도
        </div>
        <h2 className="text-[22px] md:text-2xl font-extrabold tracking-tight leading-snug text-gray-900 break-keep">
          16가지 말랑이,<br />이렇게 이어져 있어요
        </h2>
        <p className="text-[13px] md:text-sm text-gray-500 mt-3 leading-relaxed break-keep">
          네 글자가 모두 반대면 서로의 빈 곳을 채워주는 <b className="text-gray-700">‘환상의 짝꿍’</b>이에요.<br />
          유형을 눌러 짝꿍을 찾아보세요.
        </p>
      </div>

      {/* 4×4 관계 격자 + 짝꿍 연결선 */}
      <div className="relative select-none">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
          <line
            x1={cx(selPos.c)} y1={cy(selPos.r)} x2={cx(matchPos.c)} y2={cy(matchPos.r)}
            stroke={selColor} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 3"
            vectorEffect="non-scaling-stroke" opacity="0.85"
          />
        </svg>

        <div className="grid grid-cols-4 gap-2">
          {ROWS.map((_, r) =>
            COLS.map((__, c) => {
              const code = codeAt(r, c);
              const info = BMTI_INFO[code] || {};
              const ch = charOf(code);
              const isSel = code === sel, isMatch = code === match;
              const active = isSel || isMatch;
              const ringColor = isSel ? selColor : isMatch ? matchColor : 'transparent';
              return (
                <button
                  key={code}
                  onClick={() => setSel(code)}
                  aria-label={`${nickOf(code)} 유형`}
                  className="group flex flex-col items-center gap-1 focus:outline-none"
                  style={{ opacity: active ? 1 : 0.5, transition: 'opacity .2s, transform .2s', transform: isSel ? 'scale(1.06)' : 'none' }}
                >
                  <div
                    className="relative w-full aspect-square rounded-2xl overflow-hidden flex items-center justify-center"
                    style={{
                      background: `${info.color || '#999'}14`,
                      border: `2px solid ${active ? ringColor : '#EDEBE6'}`,
                      boxShadow: active ? `0 4px 12px ${ringColor}44` : 'none',
                    }}
                  >
                    {ch && <img src={ch.image} alt="" className={ch.imgClass || ''} style={{ width: '86%', height: '86%', objectFit: 'contain' }} />}
                    {isSel && <span className="absolute top-1 left-1 text-[8px] font-extrabold text-white px-1.5 py-0.5 rounded-md" style={{ background: selColor }}>나</span>}
                    {isMatch && <span className="absolute top-1 left-1 text-[8px] font-extrabold text-white px-1.5 py-0.5 rounded-md" style={{ background: matchColor }}>짝꿍</span>}
                  </div>
                  <span className="text-[9.5px] md:text-[10px] font-extrabold tracking-tight" style={{ color: active ? '#1C1A17' : '#9B9489' }}>{code}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 선택한 유형 ↔ 짝꿍 캡션 */}
      <div className="mt-5 rounded-2xl border p-4" style={{ background: '#FBFAF6', borderColor: '#EFEBE2' }}>
        <div className="flex items-center justify-center gap-2.5 flex-wrap text-center">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: selColor }} />
            <b className="text-[13px] text-gray-900">{nickOf(sel)}</b>
            <span className="text-[11px] text-gray-400 font-bold">{sel}</span>
          </span>
          <span className="text-gray-300 font-bold">↔</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: matchColor }} />
            <b className="text-[13px] text-gray-900">{nickOf(match)}</b>
            <span className="text-[11px] text-gray-400 font-bold">{match}</span>
          </span>
        </div>
        <p className="text-[12px] text-gray-500 text-center mt-2.5 leading-relaxed break-keep">
          네 글자가 모두 달라요. 그래서 <b className="text-gray-700">부족한 결을 서로 채워주는</b> 환상의 짝꿍이에요.
        </p>
      </div>

      {/* 4개의 축 — 선택한 유형이 각 축에서 어디에 있는지 함께 표시 */}
      <div className="mt-5">
        <p className="text-[11px] font-extrabold text-gray-400 mb-2.5 text-center tracking-wide">유형을 가르는 4개의 축</p>
        <div className="flex flex-col gap-2">
          {AXES.map((ax, i) => {
            const hasLeft = selLetters.includes(ax.left);
            const Pole = ({ letter, kr, on }) => (
              <span
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-center transition-colors"
                style={{
                  background: on ? `${selColor}16` : '#F6F5F2',
                  border: `1.5px solid ${on ? selColor : 'transparent'}`,
                }}
              >
                <b className="text-[13px]" style={{ color: on ? selColor : '#9B9489' }}>{letter}</b>
                <span className="text-[12px] font-bold" style={{ color: on ? '#1C1A17' : '#9B9489' }}>{kr}</span>
              </span>
            );
            return (
              <div key={i} className="flex items-stretch gap-2">
                <Pole letter={ax.left} kr={ax.leftKr} on={hasLeft} />
                <span className="flex items-center text-gray-300 text-xs font-bold">↔</span>
                <Pole letter={ax.right} kr={ax.rightKr} on={!hasLeft} />
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 text-center mt-3 leading-relaxed break-keep">
          같은 글자를 많이 공유할수록 결이 비슷하고,<br />반대 글자가 많을수록 서로를 채워줘요.
        </p>
      </div>
    </section>
  );
}
