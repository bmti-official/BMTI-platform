/* eslint-disable */
import { Mallang } from './Mallang';
import { getTypeAccent, GOLD, YELLOW, YELLOW_LINE } from '../lib/typeAccent';

// ─────────────────────────────────────────────
// 말랑방 — 같은 반(말랑 클래스)에 든 다섯 명이 수업이 없는 날에도
// 가볍게 안부를 나누는 채팅 공간. 아직 반에 들어가기 전이면 소개/대기 화면을 보여준다.
// 전체 색상 규칙: 배경 화이트 / 문구 검정 / 핵심 버튼 골드 / 박스 연옐로우 /
//               강조 요소는 유형별(M 연분홍, Z 연보라)
// ─────────────────────────────────────────────

const INK = '#1C1A17', SUB = '#8A8378', MUTE = '#B7B2A9';

// 미리보기용 샘플 대화 (실제 채팅 연동 전 데모)
const SAMPLE = [
  { mood: 4, name: '단단한 케틀벨', text: '오늘 목이 좀 뻐근하네요 다들 어떠세요?', me: false },
  { mood: 5, name: '나', text: '전 어제 스트레칭 하고 자니까 한결 나아요!', me: true },
  { mood: 3, name: '포근 폼롤러', text: '오 저도 오늘 해봐야겠다', me: false },
];

const MallangRoom = ({ bmtiCode }) => {
  const t = getTypeAccent(bmtiCode);

  return (
    <div className="min-h-screen bg-white text-[#1C1A17] pt-24 pb-28">
      <div className="max-w-[480px] mx-auto px-[22px]">

        {/* eyebrow */}
        <div style={{ color: t.accentDeep }} className="inline-flex items-center gap-[7px] text-xs font-extrabold tracking-wide">
          <span style={{ background: t.accent }} className="w-4 h-[1.5px] inline-block" />
          말랑방
        </div>

        <h1 className="text-[clamp(26px,6.5vw,34px)] font-extrabold leading-[1.3] tracking-tight mt-4">
          같은 반 다섯 명이<br />도란도란 모이는 방
        </h1>
        <p className="text-[15px] leading-7 mt-4" style={{ color: SUB }}>
          수업이 없는 날에도, 오늘 몸이 어땠는지<br />가볍게 한마디씩 나눌 수 있어요.
        </p>

        {/* 채팅 미리보기 박스 (연옐로우) */}
        <div className="mt-7 rounded-[20px] p-4 pb-5" style={{ background: YELLOW, border: `1px solid ${YELLOW_LINE}` }}>
          <div className="text-[11.5px] font-bold mb-3" style={{ color: SUB }}>목·어깨 평일반 · 3말랑방 미리보기</div>
          <div className="flex flex-col gap-3">
            {SAMPLE.map((m, i) => (
              <div key={i} className={`flex items-end gap-2 ${m.me ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <Mallang v={m.mood} size={24} />
                </div>
                <div className={`max-w-[74%] ${m.me ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {!m.me && <div className="text-[10.5px] font-bold px-1" style={{ color: MUTE }}>{m.name}</div>}
                  <div
                    className="px-3.5 py-2.5 text-[13.5px] leading-relaxed font-medium"
                    style={m.me
                      ? { background: t.accent, color: '#fff', borderRadius: '16px 16px 4px 16px' }
                      : { background: '#fff', color: INK, borderRadius: '16px 16px 16px 4px', border: `1px solid ${YELLOW_LINE}` }}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 안내 카드들 (연옐로우) */}
        <div className="mt-4 flex flex-col gap-2.5">
          {[
            { t: '오늘의 말랑이 한 번이면 충분해요', d: '많이 신경 쓸 필요 없이, 오늘 어땠는지만 남겨도 돼요.' },
            { t: '눈치 볼 필요 없어요', d: '다들 같은 곳이 뻐근한 사람들이라, 나만 그런 게 아니에요.' },
            { t: '4주가 끝나도 닫지 않아요', d: '수업이 끝난 뒤에도 말랑방은 계속 열려 있어요.' },
          ].map((it, i) => (
            <div key={i} className="rounded-[16px] px-[18px] py-4" style={{ background: YELLOW, border: `1px solid ${YELLOW_LINE}` }}>
              <div className="text-[14.5px] font-extrabold mb-1">{it.t}</div>
              <div className="text-[13px] leading-relaxed" style={{ color: SUB }}>{it.d}</div>
            </div>
          ))}
        </div>

        {/* 대기 안내 + 핵심 버튼(골드) */}
        <div className="mt-8 rounded-3xl px-6 py-9 text-center" style={{ background: YELLOW, border: `1px solid ${YELLOW_LINE}` }}>
          <div className="flex justify-center mb-4"><Mallang v={5} size={56} /></div>
          <h2 className="text-xl font-extrabold leading-[1.4] tracking-tight">
            아직 들어간 반이 없어요
          </h2>
          <p className="text-[14px] leading-7 mt-3 mb-6" style={{ color: SUB }}>
            말랑 클래스에서 반을 신청하면<br />나만의 말랑방이 열려요.
          </p>
          <button
            onClick={() => window.dispatchEvent(new Event('open_mallang_class'))}
            className="w-full py-[16px] rounded-[15px] text-white text-[15.5px] font-extrabold border-none cursor-pointer hover:brightness-105 active:scale-[0.99] transition"
            style={{ background: GOLD }}
          >
            말랑 클래스에서 반 둘러보기
          </button>
        </div>

        <p className="text-[11px] leading-7 mt-6 text-center" style={{ color: MUTE }}>
          말랑방은 같은 반 참가자끼리만 볼 수 있어요.<br />
          닉네임으로만 참여하고, 결제 정보와는 분리돼 있어요.
        </p>
      </div>
    </div>
  );
};

export default MallangRoom;
