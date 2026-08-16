/* eslint-disable */
import { useState } from 'react';
import { CHARACTERS, CHARACTER_NAMES, BMTI_INFO, CODE_KO } from '../data';
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

// '환상의 짝꿍' 추가 후보 점수 — 결과지의 대표 짝꿍 1개에 더해 2개를 더 고른다.
// 잘 맞는 조합 = 서로의 에너지를 채워주는 상보성(활동↔안정) + 통하는 결(공감/팩트가 같음).
// 코드 자리: 0=A/O(활동·안정) 1=C/L(집중·전신) 2=D/Q(실전·탐구) 3=Z/M(팩트·공감)
function matchScore(a, b) {
  let s = 0;
  if (a[0] !== b[0]) s += 2; // 활동↔안정으로 에너지를 채워줌
  if (a[3] === b[3]) s += 2; // 공감·팩트 같은 결이라 통함
  if (a[1] === b[1]) s += 1; // 집중/전신 관점이 비슷
  if (a[2] === b[2]) s += 1; // 실전/탐구 방식이 비슷
  return s;
}
function extraGoodMatches(code, exclude, n = 2) {
  const skip = new Set(['ACDZ', 'ACDM', 'ACQZ', 'ACQM', 'ALDZ', 'ALDM', 'ALQZ', 'ALQM', 'OCDZ', 'OCDM', 'OCQZ', 'OCQM', 'OLDZ', 'OLDM', 'OLQZ', 'OLQM']);
  const all = [...skip].filter((c) => c !== code && !exclude.includes(c));
  all.sort((x, y) => matchScore(code, y) - matchScore(code, x) || x.localeCompare(y));
  return all.slice(0, n);
}

// 환상의 짝꿍 '메인 1개' — A/O(활동↔안정)만 뒤집은 짝.
// 16유형이 서로 1:1로 짝지어지는 순열(대합)이라, 어떤 유형도 메인으로 안 뽑히거나 두 번 뽑히지 않는다.
const mainMatchOf = (code) => (code[0] === 'A' ? 'O' : 'A') + code.slice(1);
const mainReasonOf = (code) => (code[0] === 'A'
  ? '성향과 관점은 거의 닮았는데 에너지 방향만 서로 반대예요. 활발한 나와 차분한 짝꿍이 만나, 넘치거나 부족한 에너지를 자연스럽게 채워주는 오래 잘 맞는 사이예요.'
  : '성향과 관점은 거의 닮았는데 에너지 방향만 서로 반대예요. 차분한 나와 활발한 짝꿍이 만나, 넘치거나 부족한 에너지를 자연스럽게 채워주는 오래 잘 맞는 사이예요.');

// 관계도 원 안에서 유독 작게 보이는 누끼들 — 유형별로 살짝 키운다.
const RELATION_BOOST = {
  ACDM: 1.18, ACQZ: 1.18, ACQM: 1.18, ALDM: 1.18, ALQM: 1.18, OLDM: 1.18, ALDZ: 1.18,
};
const boostOf = (code) => RELATION_BOOST[code] || 1;

// 결과지 문구에서 대상 코드와 설명을 뽑는다. 예:
// "💖 환상의 짝꿍 (OCDM): [다정한 마사지건]\n\n운동 후엔 …"
function parseMatch(str) {
  if (!str) return { code: null, reason: '' };
  const code = (str.match(/\(([A-Z]{4})\)/) || [])[1] || null;
  const reason = (str.split(/\n\n/)[1] || '').trim();
  return { code, reason };
}

function MiniChar({ code, size = 56, ring, bg, plain = false }) {
  const ch = charOf(code);
  // 원 배경을 흰색 위 옅은 틴트로 '불투명'하게 만든다 — 뒤에 깔린 연결선이 원과 겹치는
  // 부분에서 비쳐 보이지 않고(원이 가리고), 원 사이 여백에서만 선이 보이게 한다.
  const tint = bg || `${(BMTI_INFO[code] || {}).color || '#999'}18`;
  // plain: 작은 원(추가 짝꿍)에서는 유형별 imgClass(translate 등)를 빼서 캐릭터를 가운데로.
  return (
    <div
      className="rounded-full flex items-center justify-center overflow-hidden shrink-0"
      style={{ width: size, height: size, backgroundColor: '#fff', backgroundImage: `linear-gradient(${tint}, ${tint})`, border: `2px solid ${ring || 'transparent'}` }}
    >
      {ch && <img src={ch.image} alt="" className={plain ? '' : (ch.imgClass || '')} style={{ width: `${84 * boostOf(code)}%`, height: `${84 * boostOf(code)}%`, objectFit: 'contain' }} />}
    </div>
  );
}

export default function BmtiRelationMap({ bmtiCode }) {
  const myCode = bmtiCode ? bmtiCode.split('-')[0] : null;
  const [sel, setSel] = useState(myCode && BMTI_RESULTS[myCode] ? myCode : 'ACDZ');

  const res = BMTI_RESULTS[sel] || {};
  const bad = parseMatch(res.badMatch);
  // 환상의 짝꿍: 메인 1개(1:1 순열) + 어울리는 유형 2개(메인·조금 다른 템포와 겹치지 않게)
  const mainCode = mainMatchOf(sel);
  const goodCodes = [mainCode, ...extraGoodMatches(sel, [mainCode, bad.code].filter(Boolean), 2)];
  const goodSet = new Set(goodCodes);
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
        {/* 뒤에 깔리는 연결선 — 캐릭터 원의 세로 중앙을 지나가되, 원(zIndex 1)이 선(zIndex 0) 위에 놓여 앞에 보이게 한다 */}
        <div className="absolute left-[16%] right-[16%] top-[46px] flex items-center pointer-events-none" style={{ zIndex: 0 }}>
          <span className="flex-1 h-[2px]" style={{ background: `linear-gradient(90deg, ${GOOD}, ${selColor})` }} />
          <span className="flex-1 h-[2px]" style={{ background: `linear-gradient(90deg, ${selColor}, ${BAD})`, borderTop: '0' }} />
        </div>

        <div className="relative grid grid-cols-3 gap-1.5 items-start" style={{ zIndex: 1 }}>
          {/* 환상의 짝꿍 — 대표 1 + 어울리는 2, 총 3 */}
          <div className="flex flex-col items-center text-center gap-1">
            <span className="text-[10px] font-extrabold" style={{ color: GOOD }}>💖 환상의 짝꿍</span>
            {goodCodes.length > 0 ? (
              <>
                <MiniChar code={goodCodes[0]} size={56} ring={GOOD} />
                <div className="text-[10.5px] font-bold text-gray-900 leading-tight break-keep">{nickOf(goodCodes[0])}</div>
                <div className="text-[9px] font-extrabold text-gray-400">{goodCodes[0]} {CODE_KO[goodCodes[0]]}</div>
                {goodCodes.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-1">
                    {goodCodes.slice(1).map((c) => (
                      <div key={c} className="flex flex-col items-center gap-0.5">
                        <MiniChar code={c} size={34} ring={GOOD} plain />
                        <span className="text-[8px] font-extrabold text-gray-400">{c}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : <span className="text-[11px] text-gray-400">—</span>}
          </div>

          {/* 나 */}
          <div className="flex flex-col items-center text-center gap-1.5 -mt-1">
            <span className="text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full" style={{ background: selColor }}>나</span>
            <MiniChar code={sel} size={66} ring={selColor} />
            <div className="text-[12px] font-extrabold text-gray-900 leading-tight break-keep">{nickOf(sel)}</div>
            <div className="text-[9.5px] font-extrabold text-gray-400">{sel} {CODE_KO[sel]}</div>
          </div>

          {/* 조금 다른 템포 */}
          <div className="flex flex-col items-center text-center gap-1.5">
            <span className="text-[10px] font-extrabold" style={{ color: BAD }}>🤔 조금 다른 템포</span>
            {bad.code
              ? <><MiniChar code={bad.code} size={56} ring={BAD} />
                  <div className="text-[11px] font-bold text-gray-900 leading-tight break-keep">{nickOf(bad.code)}</div>
                  <div className="text-[9.5px] font-extrabold text-gray-400">{bad.code} {CODE_KO[bad.code]}</div></>
              : <span className="text-[11px] text-gray-400">—</span>}
          </div>
        </div>
      </div>

      {/* 16유형 선택 그리드 */}
      <p className="text-[11px] font-extrabold text-gray-400 mb-2.5 text-center tracking-wide">다른 유형도 눌러보세요</p>
      <div className="grid grid-cols-4 gap-2">
        {GRID.flat().map((code) => {
          const isSel = code === sel, isGood = goodSet.has(code), isBad = code === bad.code;
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
                {charOf(code) && <img src={charOf(code).image} alt="" className={charOf(code).imgClass || ''} style={{ width: `${86 * boostOf(code)}%`, height: `${86 * boostOf(code)}%`, objectFit: 'contain' }} />}
                {isSel && <span className="absolute top-1 left-1 text-[8px] font-extrabold text-white px-1.5 py-0.5 rounded-md" style={{ background: selColor }}>나</span>}
                {isGood && <span className={`absolute top-1 right-1 leading-none ${code === mainCode ? 'text-[18px] drop-shadow-sm' : 'text-[10px]'}`}>💖</span>}
                {isBad && <span className="absolute top-1 right-1 text-[10px]">🤔</span>}
              </div>
              <span className="flex flex-col items-center leading-tight" style={{ color: active ? '#1C1A17' : '#9B9489' }}>
                <span className="text-[9.5px] md:text-[10px] font-extrabold tracking-tight">{code}</span>
                <span className="text-[8px] font-bold text-gray-400">{CODE_KO[code]}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* 이유 카드 — 두 박스의 높이를 동일하게 고정해 유형을 바꿔도 페이지가 흔들리지 않게 한다 */}
      <div className="flex flex-col gap-2.5 mt-6 mb-3">
        <div className="rounded-2xl p-3.5 border overflow-y-auto" style={{ background: '#FDF1F5', borderColor: '#F6D8E2', height: 132 }}>
          <div className="text-[11.5px] font-extrabold mb-1" style={{ color: GOOD }}>💖 {nickOf(mainCode)}와 잘 맞는 이유</div>
          <p className="text-[12.5px] text-gray-600 leading-relaxed break-keep">{mainReasonOf(sel)}</p>
          {goodCodes.length > 1 && (
            <p className="text-[11px] font-bold mt-1.5 break-keep" style={{ color: GOOD }}>
              그 밖에 {goodCodes.slice(1).map(nickOf).join(', ')}도 잘 어울려요.
            </p>
          )}
        </div>
        <div className="rounded-2xl p-3.5 border overflow-y-auto" style={{ background: '#F4F6F9', borderColor: '#DFE5EC', height: 132 }}>
          <div className="text-[11.5px] font-extrabold mb-1" style={{ color: BAD }}>🤔 {bad.code ? `${nickOf(bad.code)}와 살짝 어긋나는 이유` : '조금 다른 템포'}</div>
          <p className="text-[12.5px] text-gray-600 leading-relaxed break-keep">{bad.reason || '아직 소개할 유형이 없어요.'}</p>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 text-center mt-2 leading-relaxed break-keep">
        관계는 각 유형의 결과지 기준이에요. 서로를 꼭 짝꿍으로 꼽지 않을 수도 있어요.
      </p>
    </section>
  );
}
