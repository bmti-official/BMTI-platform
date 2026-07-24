/* eslint-disable */
import { useState } from 'react';
import { CHARACTERS, CHARACTER_NAMES, BMTI_INFO } from '../data';
import { BMTI_RESULTS } from '../bmti_results';

// ─────────────────────────────────────────────
// BMTI 유형 관계도 — 각 유형의 결과지에 있는 '환상의 짝꿍'(goodMatch)과
// '조금 다른 템포'(badMatch)를 그대로 가져와 관계를 보여준다.
// 이 관계는 대칭이 아니다(내 짝꿍이 나를 짝꿍으로 꼽지 않을 수 있고,
// 아무에게도 짝꿍으로 안 뽑히는 유형도 있다) — 그래서 방향이 있는 관계로 그린다.
// ─────────────────────────────────────────────

// 4×4 격자 배치 (관계와 무관한 단순 배열 — 16개를 한눈에 고르기 위한 지도)
const GRID = [
  ['ACDZ', 'ACDM', 'ACQZ', 'ACQM'],
  ['ALDZ', 'ALDM', 'ALQZ', 'ALQM'],
  ['OCDZ', 'OCDM', 'OCQZ', 'OCQM'],
  ['OLDZ', 'OLDM', 'OLQZ', 'OLQM'],
];

const GOOD = '#E8618C';   // 환상의 짝꿍 (핑크 하트)
const BAD = '#7C8BA5';    // 조금 다른 템포 (차분한 슬레이트)

const charOf = (code) => CHARACTERS.find((c) => c.id === code);
const nickOf = (code) => (CHARACTER_NAMES[code] || code).replace(/\n/g, ' ');

// 결과지 문구에서 대상 코드와 설명을 뽑는다. 예:
// "💖 환상의 짝꿍 (OCDM): [다정한 마사지건]\n\n운동 후엔 …"
function parseMatch(str) {
  if (!str) return { code: null, reason: '' };
  const code = (str.match(/\(([A-Z]{4})\)/) || [])[1] || null;
  const reason = (str.split(/\n\n/)[1] || '').trim();
  return { code, reason };
}

function MiniChar({ code, size = 56, ring, bg }) {
  const ch = charOf(code);
  return (
    <div
      className="rounded-full flex items-center justify-center overflow-hidden shrink-0"
      style={{ width: size, height: size, background: bg || `${(BMTI_INFO[code] || {}).color || '#999'}18`, border: `2px solid ${ring || 'transparent'}` }}
    >
      {ch && <img src={ch.image} alt="" className={ch.imgClass || ''} style={{ width: '84%', height: '84%', objectFit: 'contain' }} />}
    </div>
  );
}

export default function BmtiRelationMap({ bmtiCode }) {
  const myCode = bmtiCode ? bmtiCode.split('-')[0] : null;
  const [sel, setSel] = useState(myCode && BMTI_RESULTS[myCode] ? myCode : 'ACDZ');

  const res = BMTI_RESULTS[sel] || {};
  const good = parseMatch(res.goodMatch);
  const bad = parseMatch(res.badMatch);
  const selColor = (BMTI_INFO[sel] || {}).color || '#C9975A';

  return (
    <section className="px-6 max-w-md mx-auto mb-20">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide text-gray-400 mb-2">
          <span className="w-4 h-[1.5px] bg-gray-300 inline-block" /> BMTI 관계도
        </div>
        <h2 className="text-[22px] md:text-2xl font-extrabold tracking-tight leading-snug text-gray-900 break-keep">
          내 유형과<br />잘 맞는 BMTI는?
        </h2>
        <p className="text-[13px] md:text-sm text-gray-500 mt-3 leading-relaxed break-keep">
          유형마다 <b className="text-gray-700">환상의 짝꿍</b>과 <b className="text-gray-700">조금 다른 템포</b>가 있어요.<br />
          아래에서 유형을 눌러 관계를 살펴보세요.
        </p>
      </div>

      {/* 트리오 — 환상의 짝꿍 ↔ 나 ↔ 조금 다른 템포 */}
      <div className="relative mb-4">
        {/* 뒤에 깔리는 연결선 */}
        <div className="absolute left-[16%] right-[16%] top-[46px] flex items-center pointer-events-none" style={{ zIndex: 0 }}>
          <span className="flex-1 h-[2px]" style={{ background: `linear-gradient(90deg, ${GOOD}, ${selColor})` }} />
          <span className="flex-1 h-[2px]" style={{ background: `linear-gradient(90deg, ${selColor}, ${BAD})`, borderTop: '0' }} />
        </div>

        <div className="relative grid grid-cols-3 gap-1.5 items-start" style={{ zIndex: 1 }}>
          {/* 환상의 짝꿍 */}
          <div className="flex flex-col items-center text-center gap-1.5">
            <span className="text-[10px] font-extrabold" style={{ color: GOOD }}>💖 환상의 짝꿍</span>
            {good.code
              ? <><MiniChar code={good.code} size={56} ring={GOOD} />
                  <div className="text-[11px] font-bold text-gray-900 leading-tight break-keep">{nickOf(good.code)}</div>
                  <div className="text-[9.5px] font-extrabold text-gray-400">{good.code}</div></>
              : <span className="text-[11px] text-gray-400">—</span>}
          </div>

          {/* 나 */}
          <div className="flex flex-col items-center text-center gap-1.5 -mt-1">
            <span className="text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full" style={{ background: selColor }}>나</span>
            <MiniChar code={sel} size={66} ring={selColor} />
            <div className="text-[12px] font-extrabold text-gray-900 leading-tight break-keep">{nickOf(sel)}</div>
            <div className="text-[9.5px] font-extrabold text-gray-400">{sel}</div>
          </div>

          {/* 조금 다른 템포 */}
          <div className="flex flex-col items-center text-center gap-1.5">
            <span className="text-[10px] font-extrabold" style={{ color: BAD }}>🤔 조금 다른 템포</span>
            {bad.code
              ? <><MiniChar code={bad.code} size={56} ring={BAD} />
                  <div className="text-[11px] font-bold text-gray-900 leading-tight break-keep">{nickOf(bad.code)}</div>
                  <div className="text-[9.5px] font-extrabold text-gray-400">{bad.code}</div></>
              : <span className="text-[11px] text-gray-400">—</span>}
          </div>
        </div>
      </div>

      {/* 이유 카드 */}
      <div className="flex flex-col gap-2.5 mb-6">
        {good.reason && (
          <div className="rounded-2xl p-3.5 border" style={{ background: '#FDF1F5', borderColor: '#F6D8E2' }}>
            <div className="text-[11.5px] font-extrabold mb-1" style={{ color: GOOD }}>💖 {nickOf(good.code)}와 잘 맞는 이유</div>
            <p className="text-[12.5px] text-gray-600 leading-relaxed break-keep">{good.reason}</p>
          </div>
        )}
        {bad.reason && (
          <div className="rounded-2xl p-3.5 border" style={{ background: '#F4F6F9', borderColor: '#DFE5EC' }}>
            <div className="text-[11.5px] font-extrabold mb-1" style={{ color: BAD }}>🤔 {nickOf(bad.code)}와 살짝 어긋나는 이유</div>
            <p className="text-[12.5px] text-gray-600 leading-relaxed break-keep">{bad.reason}</p>
          </div>
        )}
      </div>

      {/* 16유형 선택 그리드 */}
      <p className="text-[11px] font-extrabold text-gray-400 mb-2.5 text-center tracking-wide">다른 유형도 눌러보세요</p>
      <div className="grid grid-cols-4 gap-2">
        {GRID.flat().map((code) => {
          const isSel = code === sel, isGood = code === good.code, isBad = code === bad.code;
          const ring = isSel ? selColor : isGood ? GOOD : isBad ? BAD : '#EDEBE6';
          const active = isSel || isGood || isBad;
          return (
            <button
              key={code}
              onClick={() => setSel(code)}
              aria-label={`${nickOf(code)} 유형`}
              className="group flex flex-col items-center gap-1 focus:outline-none"
              style={{ opacity: active ? 1 : 0.55, transition: 'opacity .2s, transform .2s', transform: isSel ? 'scale(1.06)' : 'none' }}
            >
              <div
                className="relative w-full aspect-square rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ background: `${(BMTI_INFO[code] || {}).color || '#999'}14`, border: `2px solid ${ring}`, boxShadow: active ? `0 4px 12px ${ring}44` : 'none' }}
              >
                {charOf(code) && <img src={charOf(code).image} alt="" className={charOf(code).imgClass || ''} style={{ width: '86%', height: '86%', objectFit: 'contain' }} />}
                {isSel && <span className="absolute top-1 left-1 text-[8px] font-extrabold text-white px-1.5 py-0.5 rounded-md" style={{ background: selColor }}>나</span>}
                {isGood && <span className="absolute top-1 right-1 text-[10px]">💖</span>}
                {isBad && <span className="absolute top-1 right-1 text-[10px]">🤔</span>}
              </div>
              <span className="text-[9.5px] md:text-[10px] font-extrabold tracking-tight" style={{ color: active ? '#1C1A17' : '#9B9489' }}>{code}</span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed break-keep">
        관계는 각 유형의 결과지 기준이에요. 서로를 꼭 짝꿍으로 꼽지 않을 수도 있어요.
      </p>
    </section>
  );
}
