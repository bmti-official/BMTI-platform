/* eslint-disable */
import { useState, useEffect } from 'react';
import { Mallang } from './Mallang';

// ─────────────────────────────────────────────
// BMTI 라이브 — 랜딩페이지
// 한 페이지 세로 스크롤 / 상단 고정 예약 버튼 / 메뉴 없음
// 순서: 히어로 → 공감 → 차별점(일기연동) → 무엇을 → 코치 → 프로그램 → FAQ → 예약
// * 법적 안전: "진단·치료·솔루션·교정" 언어 배제. 면책 고지 명시.
// ─────────────────────────────────────────────

const BodyCheckView = ({ isLoggedIn, onRequireLogin }) => {
  const [showDetail, setShowDetail] = useState(false);

  if (showDetail) {
    return <ClassDetail isLoggedIn={isLoggedIn} onRequireLogin={onRequireLogin} onBack={() => setShowDetail(false)} />;
  }

  return (
    <div className="min-h-screen bg-white text-[#1C1A17] pt-28">
      <Hero isLoggedIn={isLoggedIn} onRequireLogin={onRequireLogin} onShowDetail={() => setShowDetail(true)} />
      <ForYou />
      <Signature />
      <WhatWeDo />
      <Coach />
      <Programs isLoggedIn={isLoggedIn} onRequireLogin={onRequireLogin} />
      <Faq />
      <FinalCta isLoggedIn={isLoggedIn} onRequireLogin={onRequireLogin} />
      <LiveFooter />
    </div>
  );
};

// ── ① 히어로 ──
function Hero({ isLoggedIn, onRequireLogin, onShowDetail }) {
  return (
    <Section className="pt-14 pb-16">
      <Eyebrow>물리치료사와 함께하는 1:1 온라인 클래스</Eyebrow>
      <h1 className="text-[clamp(30px,7.5vw,44px)] font-extrabold leading-[1.28] tracking-tight mt-5">
        운동에 나를<br />맞추지 말고,<br />
        <span className="relative inline-block">
          나에게 운동을
          <svg viewBox="0 0 200 12" preserveAspectRatio="none" className="absolute left-0 -bottom-0.5 w-full h-2.5">
            <path d="M2,8 Q60,2 100,7 T198,5" stroke="#FF6B9D" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </svg>
        </span><br />맞추다
      </h1>
      <p className="text-base leading-7 text-[#8A8378] mt-7 max-w-[400px]">
        남들의 방식이 아니라, 내 몸에 맞는 움직임을 함께 찾아가요.
      </p>
      <div className="flex gap-2.5 mt-8 flex-wrap">
        {!isLoggedIn ? (
          <div className="flex flex-col items-start gap-1.5 w-full sm:w-auto">
            <button onClick={onRequireLogin} className="flex items-center justify-center gap-2 px-7 py-4 rounded-[15px] bg-[#FEE500] text-[#3C1E1E] text-[15.5px] font-extrabold border-none cursor-pointer hover:scale-[1.03] hover:bg-[#F4DC00] transition-transform w-full sm:w-auto shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#3C1E1E]"><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" /></svg>
              카카오로 10초 예약
            </button>
            <p className="text-[11px] text-[#8A8378] flex items-center gap-1">
              <span>🔕</span> 광고 안 보냄 · 결과만 저장
            </p>
          </div>
        ) : (
          <button className="px-7 py-4 rounded-[15px] bg-[#1C1A17] text-white text-[15.5px] font-extrabold border-none cursor-pointer hover:scale-[1.03] transition-transform">
            예약하기
          </button>
        )}
        <button onClick={onShowDetail} className="px-5.5 py-4 rounded-[15px] border border-[#EAE6DF] bg-transparent text-[#1C1A17] text-[15.5px] font-bold cursor-pointer hover:bg-white/60 transition-colors">
          어떤 클래스인지 보기
        </button>
      </div>
    </Section>
  );
}

// ── ② 공감 ──
function ForYou() {
  const items = [
    '운동은 하는데, 몸은 계속 뻐근한 분',
    '병원 갈 정도는 아닌데, 계속 신경 쓰이는 분',
    '나에게 맞는 방법을 몰라, 여러 번 그만둔 분',
    '물어볼 곳이 없어, 유튜브만 뒤져본 분',
  ];
  return (
    <Section className="bg-[#E9F1EC] py-14">
      <Eyebrow color="sage">이런 분을 위해</Eyebrow>
      <h2 className="text-[clamp(24px,5.5vw,30px)] font-extrabold leading-[1.35] tracking-tight mt-3.5">
        혹시,<br />이런 적 있으세요?
      </h2>
      <div className="mt-7 flex flex-col gap-3">
        {items.map((t, i) => (
          <div key={i} className="flex gap-3 items-start bg-white/70 px-[18px] py-4 rounded-2xl">
            <span className="text-[#5F8A76] font-extrabold text-sm shrink-0 mt-px">✓</span>
            <span className="text-[15.5px] leading-relaxed font-medium">{t}</span>
          </div>
        ))}
      </div>
      <p className="text-[15px] leading-7 text-[#1C1A17] mt-7 font-semibold">
        지금까지 잘 안 됐던 건, 의지 탓이 아니에요.<br />
        <span className="text-[#8A8378] font-normal">남들 방식에 나를 맞추려 했을 뿐이죠.</span>
      </p>
    </Section>
  );
}

// ── ③ 차별점 (시그니처) ──
function Signature() {
  return (
    <Section className="py-16">
      <Eyebrow>BMTI 일기와 연결돼요</Eyebrow>
      <h2 className="text-[clamp(24px,5.5vw,30px)] font-extrabold leading-[1.35] tracking-tight mt-3.5">
        이미 당신을 아는<br />BMTI 가이드를 만나세요
      </h2>
      <p className="text-[15.5px] leading-7 text-[#8A8378] mt-4">
        처음부터 다시 설명하지 않아도 돼요.<br />
        매일 남긴 기록을 함께 보며 시작해요.
      </p>

      {/* 시그니처: 일기 카드가 코치에게 전달되는 장면 */}
      <div className="mt-8 relative">
        <div className="bg-white border border-[#EAE6DF] rounded-[20px] p-[18px] pb-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)] -rotate-[1.2deg]">
          <div className="text-[11.5px] text-[#8A8378] font-bold mb-2.5">지난주 기록</div>
          <div className="flex gap-1.5 mb-3">
            {[3, 2, 4, 2, 1, 5, 4].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <Mallang v={v} size={24} />
                <div className="text-[9px] text-[#8A8378] mt-0.5">{'월화수목금토일'[i]}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <RecordTag>💢 목 · 3회</RecordTag>
            <RecordTag>🪑 8시간+ 앉음</RecordTag>
            <RecordTag>😣 회의 많던 날</RecordTag>
          </div>
        </div>

        <div className="flex justify-center py-3.5">
          <div className="text-xl text-[#FF6B9D]">↓</div>
        </div>

        <div className="bg-[#1C1A17] rounded-[20px] p-5 text-white">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-[34px] h-[34px] rounded-full bg-[#FFEDF3] flex items-center justify-center text-base">🩺</div>
            <div className="text-[12.5px] text-white/60 font-semibold">BMTI 가이드가 먼저 건네는 말</div>
          </div>
          <p className="text-[15.5px] leading-7 font-medium">
            "목이 많이 아프셨고, 긴시간 앉아서 회의가 많으셨나봐요.<br />
            한주간 정말 고생 많으셨어요.<br />
            이런 경우 일반적으로 목 앞쪽 근육과 가슴 근육이 짧아지고,<br />
            뒷목과 날개뼈 사이 근육이 약해지기 쉬워요.<br />
            그럼 스트레칭과 운동을 같이 해볼게요."
          </p>
        </div>
      </div>
    </Section>
  );
}

function RecordTag({ children }) {
  return (
    <span className="text-[11.5px] font-bold bg-[#FFEDF3] text-[#C4517A] px-2.5 py-1 rounded-xl">
      {children}
    </span>
  );
}

// ── ④ 무엇을 하나요 ──
function WhatWeDo() {
  const items = [
    { icon: '🧭', t: '지금 몸에 맞는 움직임 함께 찾기', d: '오늘 컨디션에 맞춰, 무리 없는 방법으로 함께 움직여요.' },
    { icon: '🪑', t: '일상 자세 습관 이야기 나누기', d: '하루 대부분을 보내는 자세부터 하나씩 살펴봐요.' },
    { icon: '🎯', t: '안전하고 정확한 운동 방법 익히기', d: '같은 동작도 어디에 힘이 들어가야 하는지 짚어드려요.' },
    { icon: '🌿', t: '나에게 맞는 루틴 만들어가기', d: 'BMTI 성향에 맞춰, 지속할 수 있는 방식으로.' },
  ];
  return (
    <Section className="bg-[#E9F1EC] py-14">
      <Eyebrow color="sage">무엇을 하나요</Eyebrow>
      <h2 className="text-[clamp(24px,5.5vw,30px)] font-extrabold leading-[1.35] tracking-tight mt-3.5">
        함께 움직이면서<br />찾아가요
      </h2>
      <div className="mt-7 flex flex-col gap-3">
        {items.map((it, i) => (
          <div key={i} className="bg-white rounded-[18px] p-[18px]">
            <div className="text-xl mb-2">{it.icon}</div>
            <div className="text-[15.5px] font-extrabold mb-1.5">{it.t}</div>
            <div className="text-[13.5px] text-[#8A8378] leading-relaxed">{it.d}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 px-4 py-3.5 bg-white/70 rounded-[14px] border border-dashed border-[#EAE6DF] text-[12.5px] leading-relaxed text-[#8A8378]">
        ※ 진단·치료가 아닙니다. 통증이나 질환이 있으시면 병원에서 먼저 진료받아주세요.
      </div>
    </Section>
  );
}

// ── ⑤ BMTI 가이드 ──
function Coach() {
  return (
    <Section className="py-16">
      <Eyebrow>BMTI 가이드</Eyebrow>
      <h2 className="text-[clamp(24px,5.5vw,30px)] font-extrabold leading-[1.35] tracking-tight mt-3.5">
        물리치료사가<br />운동을 지도해드려요
      </h2>
      <p className="text-[15.5px] leading-7 text-[#8A8378] mt-4">
        근골격계를 전공한 물리치료사가<br />
        안전하고 정확한 움직임을 함께 찾아드려요.
      </p>

      <div className="mt-7 bg-[#E9F1EC] rounded-[18px] px-[18px] py-4 text-[13.5px] leading-relaxed text-[#3F5F4E] font-semibold">
        🚨 본 서비스는 운동·습관 코칭이며,<br />
        진단·치료·물리치료 행위가 아닙니다.
      </div>

      <blockquote className="mt-3.5 p-5 bg-[#1C1A17] text-white rounded-[20px] text-base leading-7 font-medium not-italic">
        "저는 진단하지 않습니다.<br />
        대신 안전하게 움직이는 법을 알려드리고,<br />
        무리해 보이거나 걱정되는 부분이 있으면,<br />
        병원에 먼저 가보시길 권해드려요."
      </blockquote>
    </Section>
  );
}

// ── ⑥ 프로그램 & 가격 ──
function Programs({ isLoggedIn, onRequireLogin }) {
  const [pick, setPick] = useState(1);
  const progs = [
    {
      n: '미니 점검', min: '15분', tag: '처음이라면', price: '첫 클래스 특가',
      pts: ['일기 기록 함께 보기', '지금 가장 불편한 것 이야기', '가벼운 움직임 한두 개', '어떤 방향이 맞을지 안내'],
    },
    {
      n: '핵심 점검', min: '30분', tag: '가장 많이 선택해요', price: '기본 클래스',
      pts: ['이번 주 기록 함께 보기', '오늘 몸에 맞춰 함께 움직이기', '일상 자세 습관 이야기', '집에서 할 루틴 한두 개'],
    },
    {
      n: '자기 점검', min: '50분', tag: '깊이 있게', price: '심화 클래스',
      pts: ['긴 호흡으로 움직임 익히기', 'BMTI 성향에 맞춘 방식으로', '생활 전반 습관 이야기', '나만의 루틴 함께 만들기'],
    },
  ];
  return (
    <Section className="bg-[#E9F1EC] py-14">
      <Eyebrow color="sage">프로그램</Eyebrow>
      <h2 className="text-[clamp(24px,5.5vw,30px)] font-extrabold leading-[1.35] tracking-tight mt-3.5">
        시간을 골라보세요
      </h2>

      <div className="flex gap-[7px] mt-6">
        {progs.map((p, i) => (
          <button
            key={i}
            onClick={() => setPick(i)}
            className={`flex-1 py-[11px] rounded-[14px] cursor-pointer text-[13.5px] font-extrabold transition-all ${
              pick === i
                ? 'bg-[#1C1A17] text-white border-2 border-[#1C1A17]'
                : 'bg-white text-[#8A8378] border border-[#EAE6DF] hover:border-[#1C1A17]/30'
            }`}
          >
            {p.n} {p.min}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[20px] p-5 mt-3.5">
        <span className="inline-block text-[11.5px] font-extrabold text-[#FF6B9D] bg-[#FFEDF3] px-2.5 py-1 rounded-xl mb-3">
          {progs[pick].tag}
        </span>
        <div className="text-[22px] font-extrabold mb-1">{progs[pick].n} · {progs[pick].min}</div>
        <div className="text-sm text-[#8A8378] mb-4">{progs[pick].price}</div>
        <div className="flex flex-col gap-2.5">
          {progs[pick].pts.map((pt, i) => (
            <div key={i} className="flex gap-2.5 text-[14.5px] leading-relaxed">
              <span className="text-[#5F8A76] font-extrabold">·</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>
        {!isLoggedIn ? (
          <div className="w-full mt-5">
            <button onClick={onRequireLogin} className="w-full flex items-center justify-center gap-2 px-7 py-4 rounded-[15px] bg-[#FEE500] text-[#3C1E1E] text-[15.5px] font-extrabold border-none cursor-pointer hover:scale-[1.02] hover:bg-[#F4DC00] transition-transform shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#3C1E1E]"><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" /></svg>
              카카오로 10초 예약
            </button>
            <p className="text-[11px] text-[#8A8378] mt-2 flex items-center justify-center gap-1">
              <span>🔕</span> 광고 안 보냄 · 결과만 저장
            </p>
          </div>
        ) : (
          <button className="w-full mt-5 px-7 py-4 rounded-[15px] bg-[#1C1A17] text-white text-[15.5px] font-extrabold border-none cursor-pointer hover:scale-[1.02] transition-transform">
            이 클래스 예약하기
          </button>
        )}
      </div>

      <div className="bg-white rounded-[18px] px-[18px] py-4 mt-3 flex justify-between items-center">
        <div>
          <div className="text-[14.5px] font-extrabold">4회 패키지</div>
          <div className="text-[12.5px] text-[#8A8378] mt-0.5">핵심 점검 30분 × 4회 · 함께 이어가요</div>
        </div>
        <span className="text-[12.5px] font-extrabold text-[#FF6B9D]">할인 →</span>
      </div>
    </Section>
  );
}

// ── ⑦ FAQ ──
function Faq() {
  const qs = [
    { q: '화면으로 몸을 볼 수 있나요?', a: '만져보는 검사는 할 수 없어요. 대신 함께 움직여보면서, 지금 몸에 편하고 안전한 방법을 같이 찾아가요.' },
    { q: '아픈데 병원 안 가도 되나요?', a: '아니요. 통증이나 질환은 병원이 먼저예요. 저는 진단하지 않습니다. 클래스 중에도 필요하다고 느껴지면 병원을 안내해드려요.' },
    { q: '준비물이 있나요?', a: '매트 한 장이면 충분해요. 몸을 움직일 공간이 조금 있으면 좋아요.' },
    { q: 'BMTI 일기를 꼭 써야 하나요?', a: '필수는 아니에요. 다만 기록이 있으면 이야기를 훨씬 빨리 시작할 수 있어요.' },
    { q: '운동을 잘 못해도 되나요?', a: '물론이에요. 잘하는 방법이 아니라, 나에게 맞는 방법을 찾는 시간이에요.' },
  ];
  const [open, setOpen] = useState(null);
  return (
    <Section className="py-14">
      <Eyebrow>자주 묻는 질문</Eyebrow>
      <h2 className="text-[clamp(24px,5.5vw,30px)] font-extrabold leading-[1.35] tracking-tight mt-3.5">
        궁금한 게<br />있으실 거예요
      </h2>
      <div className="mt-7 flex flex-col gap-2">
        {qs.map((item, i) => (
          <div key={i} className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex justify-between items-center gap-3 px-[18px] py-[17px] bg-transparent border-none cursor-pointer text-left text-[14.5px] font-bold text-[#1C1A17]"
            >
              {item.q}
              <span className={`text-[#8A8378] text-[15px] shrink-0 transition-transform duration-200 ${open === i ? 'rotate-45' : ''}`}>+</span>
            </button>
            {open === i && (
              <div className="px-[18px] pb-[18px] text-sm leading-7 text-[#8A8378] animate-fade-in">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── ⑧ 최종 CTA ──
function FinalCta({ isLoggedIn, onRequireLogin }) {
  return (
    <Section className="pt-14 pb-10">
      <div className="bg-[#1C1A17] rounded-3xl px-6 py-10 text-center text-white">
        <div className="text-[30px] mb-3.5">🌿</div>
        <h2 className="text-2xl font-extrabold leading-[1.4] tracking-tight">
          이제,<br />나에게 맞춰볼까요?
        </h2>
        <p className="text-[14.5px] text-white/65 leading-7 mt-4 mb-7">
          15분이면 충분해요.<br />먼저 가볍게 만나봐요.
        </p>
        {!isLoggedIn ? (
          <div className="w-full">
            <button onClick={onRequireLogin} className="w-full flex items-center justify-center gap-2 py-[17px] rounded-[15px] bg-[#FEE500] text-[#3C1E1E] text-base font-extrabold border-none cursor-pointer hover:bg-[#F4DC00] transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#3C1E1E]"><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" /></svg>
              카카오로 10초 예약
            </button>
            <p className="text-[11px] text-white/45 mt-2.5 flex items-center justify-center gap-1">
              <span>🔕</span> 광고 안 보냄 · 결과만 저장
            </p>
          </div>
        ) : (
          <button className="w-full py-[17px] rounded-[15px] bg-[#FF6B9D] text-white text-base font-extrabold border-none cursor-pointer hover:brightness-110 transition">
            예약하기
          </button>
        )}
        <p className="text-[11.5px] text-white/45 leading-7 mt-4">
          예약 시 안내 사항에 동의해주셔야 해요.<br />
          (진단·치료가 아닌 운동·습관 코칭입니다)
        </p>
      </div>
    </Section>
  );
}

// ── 라이브 전용 Footer ──
function LiveFooter() {
  return (
    <div className="py-5 px-5 pb-11 text-center">
      <div className="text-[13px] font-extrabold mb-2">
        BMTI <span className="text-[#FF6B9D]">라이브</span>
      </div>
      <p className="text-[11px] text-[#8A8378] leading-7 m-0">
        본 서비스는 의료행위(진단·치료)가 아닌 일반적인 운동·습관 코칭입니다.<br />
        통증·질환이 있는 경우 반드시 의료기관에서 진료받으시기 바랍니다.
      </p>
    </div>
  );
}

// ── 클래스 상세 안내 페이지 ("어떤 클래스인지 보기") ──
const TIMELINES = {
  mini: {
    tab: '미니 점검 15분',
    headline: '미니 점검 15분은 이렇게 흘러가요',
    blocks: [
      { time: '0~8분', t: '오늘 컨디션과 신체 고민 듣기', type: 'quote',
        quote: '"요즘 일상생활이 어떠신가요?\n몸을 사용할 때 고민이 있으신가요?"' },
      { time: '8~10분', t: '일상의 움직임 체크', type: 'quote',
        quote: '"평소 많이 하는 자세는 뭔가요?"' },
      { time: '10~15분', t: '나에게 필요한 내용 듣기', type: 'quote',
        quote: '"말씀해주신 생활 패턴을 들어보니,\n평소 이런 방향으로 관리해 보시면 좋을 것 같아요.\n다음 번에는 30분/50분 세션에서\n오늘 파악한 내용에 맞춰 저와 함께해보면 좋겠습니다."' },
    ],
  },
  core: {
    tab: '핵심 점검 30분',
    headline: '핵심 점검 30분은 이렇게 흘러가요',
    blocks: [
      { time: '0~5분', t: '오늘 컨디션 이야기', type: 'quote',
        quote: '"이번 주 컨디션을 보니 힘든 한주를 보내셨네요,\n오늘은 좀 어때요?"' },
      { time: '5~20분', t: '함께 움직이기', type: 'quote',
        quote: '"오늘 몸 상태에 맞춰 스트레칭·운동을 같이 해봐요 !"' },
      { time: '20~25분', t: '일상 습관 이야기', type: 'quote',
        quote: '"오래 앉을 때 이렇게 해보면 어때요?"' },
      { time: '25~30분', t: '집에서 할 루틴 정리', type: 'note',
        quote: '오늘 한 것 중 1~2개, 혼자 할 수 있게' },
    ],
  },
  self: {
    tab: '자기 점검 50분',
    headline: '자기 점검 50분은 이렇게 흘러가요',
    blocks: [
      { time: '0~5분', t: '주간 컨디션 & 생활 패턴 돌아보기', type: 'quote',
        quote: '"이번 주 컨디션을 보니 힘든 한주를 보내셨네요,\n오늘은 좀 어때요?"' },
      { time: '5~30분', t: '함께 움직이기', type: 'quote',
        quote: '"오늘 몸 상태에 맞춰 스트레칭·운동을 같이 해봐요 !"' },
      { time: '30~40분', t: '일상 습관 이야기', type: 'quote',
        quote: '"오래 앉을 때 이렇게 해보면 어때요?"' },
      { time: '40~50분', t: '집에서 할 루틴 정리', type: 'note',
        quote: '오늘 한 것 중 1~2개, 혼자 할 수 있게' },
    ],
  },
};

const DETAIL_FAQS = [
  { q: '운동을 잘 못해도 되나요?', a: '물론이에요. 운동을 잘하기 위해서가 아니라, 내 몸에 편안하게 맞는 움직임을 찾아가는 시간입니다.' },
  { q: '화면으로 제 몸을 정확히 알 수 있나요?', a: '직접 만져보는 검사는 할 수 없지만, 함께 다양한 동작을 해보며 어떤 자세에서 뻣뻣함이나 불편함을 느끼시는지 확인하고, 가장 편안하게 움직일 수 있는 방법을 같이 찾아가요.' },
  { q: '15분과 30분, 50분 중 무엇을 골라야 할지 모르겠어요.', a: '처음이시라면 내 몸의 뻐근한 부분을 먼저 체크해보는 15분 미니 점검으로 가볍게 시작해 보세요. 이후에 저와 함께 본격적으로 몸을 움직여보고 싶으실 때 30분이나 50분 세션을 선택해 주시면 됩니다.' },
];

function ClassDetail({ isLoggedIn, onRequireLogin, onBack }) {
  const [pick, setPick] = useState(1);
  const [openFaq, setOpenFaq] = useState(null);
  const progKeys = ['mini', 'core', 'self'];
  const timeline = TIMELINES[progKeys[pick]];

  return (
    <div className="min-h-screen bg-white text-[#1C1A17] pt-28 pb-10">
      <Section className="pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#8A8378] hover:text-[#1C1A17] transition-colors bg-transparent border-none cursor-pointer p-0"
        >
          <span className="text-base">←</span> 어떤 클래스인지 보기
        </button>
      </Section>

      {/* ① 세션 타임라인 */}
      <Section className="py-8">
        <Eyebrow>세션 타임라인</Eyebrow>
        <div className="flex gap-[7px] mt-5">
          {progKeys.map((key, i) => (
            <button
              key={key}
              onClick={() => setPick(i)}
              className={`flex-1 py-[11px] rounded-[14px] cursor-pointer text-[12.5px] font-extrabold transition-all ${
                pick === i
                  ? 'bg-[#1C1A17] text-white border-2 border-[#1C1A17]'
                  : 'bg-[#FBFAF8] text-[#8A8378] border border-[#EAE6DF] hover:border-[#1C1A17]/30'
              }`}
            >
              {TIMELINES[key].tab}
            </button>
          ))}
        </div>

        <h2 className="text-[clamp(21px,5vw,26px)] font-extrabold leading-[1.4] tracking-tight mt-7">
          {timeline.headline}
        </h2>

        <div className="mt-6 flex flex-col">
          {timeline.blocks.map((b, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B9D] mt-1.5 shrink-0" />
                {i < timeline.blocks.length - 1 && <div className="w-[1.5px] flex-1 bg-[#EAE6DF] my-1" />}
              </div>
              <div className={i < timeline.blocks.length - 1 ? 'pb-7' : 'pb-0'}>
                <div className="text-[12px] font-extrabold text-[#FF6B9D] mb-1">{b.time}</div>
                <div className="text-[15.5px] font-extrabold mb-2">{b.t}</div>
                {b.type === 'note' ? (
                  <div className="text-[13.5px] text-[#8A8378] leading-relaxed">{b.quote}</div>
                ) : (
                  <div className="bg-[#FBFAF8] border border-[#EAE6DF] rounded-[14px] px-4 py-3 text-[13.5px] leading-relaxed text-[#5B5650] whitespace-pre-line">
                    {b.quote}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ② 코치의 실제 대화 예시 */}
      <Section className="bg-[#E9F1EC] py-14">
        <Eyebrow color="sage">전문성</Eyebrow>
        <h2 className="text-[clamp(21px,5vw,26px)] font-extrabold leading-[1.4] tracking-tight mt-3.5">
          코치는 이렇게<br />이야기해요
        </h2>
        <blockquote className="mt-6 p-5 bg-[#1C1A17] text-white rounded-[20px] text-[15px] leading-7 font-medium not-italic">
          "목이 많이 아프셨고, 긴 시간 앉아서 회의가 많으셨나 봐요.<br />
          한 주간 정말 고생 많으셨어요.<br />
          이런 경우 일반적으로 목 앞쪽 근육과 가슴 근육이 짧아지고,<br />
          뒷목과 날개뼈 사이 근육이 약해지기 쉬워요.<br />
          그럼 스트레칭과 운동을 같이 해볼게요."
        </blockquote>
      </Section>

      {/* ③ 이런 건 안 해요 */}
      <Section className="py-14">
        <Eyebrow>안심하세요</Eyebrow>
        <h2 className="text-[clamp(21px,5vw,26px)] font-extrabold leading-[1.4] tracking-tight mt-3.5">
          이런 건<br />하지 않아요
        </h2>
        <div className="mt-6 flex flex-col gap-2.5">
          <div className="flex gap-2.5 items-start bg-[#FBFAF8] border border-[#EAE6DF] px-[18px] py-4 rounded-2xl">
            <span className="text-[#E0554F] font-extrabold text-sm shrink-0 mt-px">✗</span>
            <span className="text-[14.5px] leading-relaxed font-medium">무리한 운동을 강요하지 않아요</span>
          </div>
          <div className="flex gap-2.5 items-start bg-[#FBFAF8] border border-[#EAE6DF] px-[18px] py-4 rounded-2xl">
            <span className="text-[#E0554F] font-extrabold text-sm shrink-0 mt-px">✗</span>
            <span className="text-[14.5px] leading-relaxed font-medium">
              의료적인 진단이나 치료를 하지 않아요 <span className="text-[#8A8378] font-normal">(안전하고 올바른 움직임을 제안합니다)</span>
            </span>
          </div>
          <div className="flex gap-2.5 items-start bg-[#FBFAF8] border border-[#EAE6DF] px-[18px] py-4 rounded-2xl">
            <span className="text-[#E0554F] font-extrabold text-sm shrink-0 mt-px">✗</span>
            <span className="text-[14.5px] leading-relaxed font-medium">모두에게 똑같은 정해진 프로그램을 시키지 않아요</span>
          </div>
        </div>
        <p className="text-[15px] leading-7 mt-6 font-bold text-center">
          <span className="text-[#FF6B9D]">→</span> 나에게 맞는 방식을, 내 속도로
        </p>
      </Section>

      {/* ④ 준비물 */}
      <Section className="bg-[#E9F1EC] py-14">
        <Eyebrow color="sage">준비물</Eyebrow>
        <h2 className="text-[clamp(21px,5vw,26px)] font-extrabold leading-[1.4] tracking-tight mt-3.5">
          이것만 있으면<br />돼요
        </h2>
        <div className="mt-6 flex flex-col gap-2.5">
          {['매트 한 장', '몸을 움직일 작은 공간', '가장 편한 옷 차림'].map((t, i) => (
            <div key={i} className="flex gap-2.5 items-center bg-white px-[18px] py-4 rounded-2xl">
              <span className="text-[#5F8A76] font-extrabold">·</span>
              <span className="text-[14.5px] font-semibold">{t}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ⑤ FAQ */}
      <Section className="py-14">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="text-[clamp(21px,5vw,26px)] font-extrabold leading-[1.4] tracking-tight mt-3.5">
          궁금한 게<br />있으실 거예요
        </h2>
        <div className="mt-7 flex flex-col gap-2">
          {DETAIL_FAQS.map((item, i) => (
            <div key={i} className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center gap-3 px-[18px] py-[17px] bg-transparent border-none cursor-pointer text-left text-[14.5px] font-bold text-[#1C1A17]"
              >
                {item.q}
                <span className={`text-[#8A8378] text-[15px] shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-[18px] pb-[18px] text-sm leading-7 text-[#8A8378] animate-fade-in">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ⑥ 예약 CTA */}
      <Section className="pt-4 pb-6">
        <div className="bg-[#1C1A17] rounded-3xl px-6 py-9 text-center text-white">
          {!isLoggedIn ? (
            <button onClick={onRequireLogin} className="w-full flex items-center justify-center gap-2 py-[17px] rounded-[15px] bg-[#FEE500] text-[#3C1E1E] text-base font-extrabold border-none cursor-pointer hover:bg-[#F4DC00] transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#3C1E1E]"><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" /></svg>
              카카오로 10초 예약
            </button>
          ) : (
            <button className="w-full py-[17px] rounded-[15px] bg-[#FF6B9D] text-white text-base font-extrabold border-none cursor-pointer hover:brightness-110 transition">
              예약하기
            </button>
          )}
          <p className="text-[12.5px] text-white/55 mt-3.5">
            "먼저 15분으로 가볍게 만나봐도 좋아요"
          </p>
        </div>
      </Section>
    </div>
  );
}

// ── 공통 컴포넌트 ──
function Section({ children, className = '' }) {
  return (
    <div className={className}>
      <div className="max-w-[480px] mx-auto px-[22px]">{children}</div>
    </div>
  );
}

function Eyebrow({ children, color }) {
  const isSage = color === 'sage';
  const textColor = isSage ? 'text-[#5F8A76]' : 'text-[#FF6B9D]';
  const barColor = isSage ? 'bg-[#5F8A76]' : 'bg-[#FF6B9D]';
  return (
    <div className={`inline-flex items-center gap-[7px] text-xs font-extrabold tracking-wide ${textColor}`}>
      <span className={`w-4 h-[1.5px] ${barColor} inline-block`} />
      {children}
    </div>
  );
}

export default BodyCheckView;
