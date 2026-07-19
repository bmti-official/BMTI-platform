import { useState } from "react";
import { Mallang } from "./Mallang";

// ============================================
// 말랑 클래스 — 같은 BMTI 유형·같은 부위가 뻐근한 사람들끼리 모이는
// 4주 온라인 그룹 클래스 소개/예약 화면.
// 색감·톤·구조는 다른 "말랑" 계열 화면(말랑 다이어리, 말랑이의 발견)과 통일한다.
// ============================================

const C = {
  page: "#F7F5F1", bg: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2",
  sage: "#5F8A76", sageSoft: "#E9F1EC", sageBorder: "#D8E9E0",
  mute: "#C9C4B8",
};
const CARD_SHADOW = "0 1px 2px rgba(28,26,23,0.03), 0 8px 20px rgba(28,26,23,0.05)";
const SAGE_SHADOW = "0 4px 14px rgba(95,138,118,0.25)";
const PRESS = "active:scale-95 transition-transform";

const KO_NUM = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];

// 실제 예약 데이터가 아직 없어 데모 값을 쓴다 — 정원(CAP)이 다 차면 다섯 명씩
// "말랑방" 네 개로 나뉜다는 설명과 숫자가 맞도록 20/5로 고정.
const CAP = 20;
const TAKEN = 14;

const PARTIES = [
  { label: "아침에 뻐근", moods: [2, 3, 2, 4, 3] },
  { label: "앉아있을 때", moods: [3, 2, 4, 3, 2] },
  { label: "움직일 때", moods: [2, 4, 3, 2, 4] },
  { label: "그 밖에", moods: [3, 2, 4, 3, 2] },
];

const WEEKS = [
  { n: 1, title: "가장 가벼운 것부터", body: "지금 할 수 있는 것으로 시작해요. 카메라를 안 켜셔도 돼요." },
  { n: 2, title: "한 칸 올려요", body: "몸이 조금씩 익숙해져요." },
  { n: 3, title: "또 한 칸", body: "힘들면 절대 무리하지 않고 가요." },
  { n: 4, title: "4주를 같이 봐요", body: "우리의 4주가 어땠는지 함께 보고 마무리해요." },
];

const FAQS = [
  { q: "실력이 어느 정도여야 하나요?", a: "1주차는 지금 할 수 있는 것부터 시작해요. 스무 명이 다 비슷한 상태예요." },
  { q: "스무 명이면 못 따라가는 거 아닐까요?", a: "참가자끼리는 서로 화면이 보이지 않아서 속도가 다르다고 티가 나지 않아요. 각자 편한 만큼 따라오시면 돼요." },
  { q: "평일반과 주말반 중 하나만 고르나요?", a: "네, 하나만 선택하시면 돼요. 둘 다 같은 4주 과정이에요." },
  { q: "한 주 빠지면 어떻게 되나요?", a: "강사 화면만 녹화해서 보내드려요. 참가자는 녹화에 나오지 않아요." },
  { q: "이름이 나오나요?", a: "닉네임만 써요. 결제 정보는 이름이나 말랑방과 분리돼 있어요." },
  { q: "4주 다음엔요?", a: "다음 반이 이어져요. 수료하신 분은 더 편한 가격으로 함께하실 수 있어요." },
  { q: "어깨가 많이 불편한데 들어도 될까요?", a: "많이 불편하시다면 이 클래스보다 전문가를 먼저 만나보시길 권해드려요. 여기는 일상에서 몸을 돌보는 습관을 함께 만드는 자리예요." },
];

export default function MallangClass({ onClose }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [screenTab, setScreenTab] = useState("me"); // me | coach
  const left = CAP - TAKEN;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: C.page, overflowY: "auto", fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "18px 18px 60px" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <button onClick={onClose} aria-label="닫기" className={PRESS} style={{ border: "none", background: "transparent", fontSize: 22, color: C.ink, cursor: "pointer", padding: 4, lineHeight: 1 }}>‹</button>
          <div style={{ fontSize: 15, fontWeight: 800 }}>말랑 클래스</div>
          <div style={{ width: 26 }} />
        </div>

        <div style={{ padding: "18px 2px 24px" }}>
          <h1 style={{ fontSize: 25, fontWeight: 800, lineHeight: 1.35, letterSpacing: "-0.01em", margin: 0 }}>
            당신과 같은 유형,<br />같은 곳이 뻐근한<br />스무 명이 모여요
          </h1>
          <p style={{ fontSize: 13.5, color: C.sub, fontWeight: 700, marginTop: 10 }}>목·어깨 4주 온라인 클래스</p>
        </div>

        {/* 예약 목록 */}
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, letterSpacing: "0.02em", marginBottom: 10 }}>지금 모이는 중</div>

        {/* 모집 중 슬롯 */}
        <div style={{ background: C.bg, border: `1px solid ${C.sageBorder}`, borderRadius: 20, padding: "20px 20px 18px", boxShadow: CARD_SHADOW, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800 }}>목 · 어깨</div>
              <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: C.sage, background: C.sageSoft, padding: "4px 10px", borderRadius: 999, marginTop: 6 }}>OM 유형</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, paddingTop: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.sage }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: C.sage }}>모집 중</span>
            </div>
          </div>

          {/* 모집 진행바 */}
          <div style={{ margin: "16px 0 4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
              <div style={{ fontSize: 13, color: C.sub }}><b style={{ fontSize: 18, color: C.sage }}>{TAKEN}</b><span style={{ color: C.mute }}>/{CAP}</span> 모였어요</div>
              <div style={{ fontSize: 12, color: C.sage, fontWeight: 700 }}>{KO_NUM[left]} 자리 남음</div>
            </div>
            <div style={{ height: 10, background: C.line, borderRadius: 999, display: "flex", gap: 2, padding: 2 }}>
              {Array.from({ length: CAP }).map((_, i) => (
                <div key={i} style={{ flex: 1, borderRadius: 2, background: i < TAKEN ? C.sage : C.line, transition: "background .2s" }} />
              ))}
            </div>
            <p style={{ fontSize: 11, color: C.mute, marginTop: 8 }}>스무 명이 다 모이면 <b style={{ color: C.sub }}>다섯 명씩 말랑방 네 개</b>로 나뉘어요</p>
          </div>

          <p style={{ fontSize: 13, color: C.sub, margin: "12px 0 2px" }}>
            평일반 <b style={{ color: C.ink, fontWeight: 700 }}>화·목 20:00</b> 또는 주말반 <b style={{ color: C.ink, fontWeight: 700 }}>토·일 10:00</b> · 50분 · 8회
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, borderTop: `1px solid ${C.line}`, paddingTop: 16, marginTop: 14 }}>
            <div style={{ fontSize: 13, color: C.sub }}><b style={{ fontSize: 17, color: C.ink, fontWeight: 800 }}>5만 원</b><span style={{ fontSize: 11, color: C.mute, marginLeft: 4 }}>8회·인당</span></div>
            <button className={PRESS} style={{ background: C.sage, color: "#fff", fontSize: 13.5, fontWeight: 700, padding: "11px 22px", borderRadius: 999, border: "none", cursor: "pointer", boxShadow: SAGE_SHADOW }}>신청하기</button>
          </div>

          <button
            onClick={() => setDetailOpen(v => !v)}
            aria-expanded={detailOpen}
            className={PRESS}
            style={{ width: "100%", marginTop: 12, background: detailOpen ? C.sageSoft : "transparent", border: `1.5px solid ${detailOpen ? C.sageBorder : C.line}`, color: detailOpen ? C.sage : C.sub, fontSize: 12.5, fontWeight: 700, padding: 11, borderRadius: 999, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 6, transition: "background .2s, border-color .2s, color .2s" }}
          >
            말랑 클래스가 뭔지 자세히 보기
            <span style={{ transition: "transform .25s cubic-bezier(.22,.9,.32,1)", transform: detailOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
          </button>
        </div>

        {/* 준비 중 슬롯 2개 */}
        <SoonSlot part="목 · 어깨" type="AM 유형" when="활동적으로 움직이며 뻐근해지는 분들을 위한 반이에요 · 다음 달 시작" />
        <SoonSlot part="허리 · 골반" type="OM 유형" when="오래 앉거나 서 있는 분들을 위한 반이에요 · 다음 달 시작" />

        <p style={{ fontSize: 12, color: C.mute, textAlign: "center", padding: "8px 0 6px" }}>
          바로 <b style={{ color: C.sub }}>BMTI 유형</b>과 <b style={{ color: C.sub }}>뻐근한 곳</b>으로 나뉘어요
        </p>

        {/* 상세 패널 */}
        <div style={{ overflow: "hidden", maxHeight: detailOpen ? 6000 : 0, transition: "max-height .45s cubic-bezier(.22,.9,.32,1)" }}>
          <div style={{ paddingTop: 8 }}>

            <Block eyebrow="이 반이 뭐예요">
              <h2 style={sectionH2}>체력이 아니라<br />같은 몸으로 모여요</h2>
              <P>보통 운동 앱에서 초급·중급으로 나누죠. 그러면 같은 반에 있어도 실력은 다 달라요.</P>
              <P>말랑 클래스는 <b>BMTI 유형</b>과 <b>뻐근한 곳</b>이 같은 사람만 모아요. 그래서 4주 내내 우리 모두를 위한 수업이 돼요.</P>
              <P>강사가 실력을 평가하고 지적하는 수업이 아니에요. 대신 <b>나와 비슷한 사람들과 같은 걸 같이 한다는 것</b>이 이 클래스의 자리예요.</P>
            </Block>

            <Block eyebrow="파티">
              <h2 style={sectionH2}>뻐근한 곳이 모이면<br />네 파티로 나뉘어요</h2>
              <P>스무 명이 한 방에 있으면 아무래도 많이 신경 쓰여요. 그래서 다 모이면 비슷한 시간에 뻐근한 사람끼리 다섯 명씩 묶어요.</P>
              <div style={{ display: "flex", gap: 8, margin: "16px 0 4px", flexWrap: "wrap" }}>
                {PARTIES.map(p => (
                  <div key={p.label} style={{ flex: "1 1 130px", background: C.page, border: `1px solid ${C.line}`, borderRadius: 14, padding: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sage, marginBottom: 8 }}>{p.label}</div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {p.moods.map((m, i) => <Mallang key={i} v={m} size={18} />)}
                    </div>
                  </div>
                ))}
              </div>
              <P style={{ marginTop: 14 }}>전체는 스무 명이 함께, <b>말랑방은 다섯 명이 오붓하게.</b></P>
            </Block>

            <Block eyebrow="말랑방">
              <h2 style={sectionH2}>수업이 없는 날에도</h2>
              <P>수업이 끝나고 나면 다음 수업까지 며칠이 비어요. 말랑방이 그 사이를 이어줘요.</P>
              <P>매일 오늘의 말랑이를 한 번 누르면 남고, 많이 신경 쓸 필요 없어요. 다들 오늘 어땠는지 보이는 것만으로 충분히 덜 외로우니까요. 서로 눈치는 없어요.</P>
              <P><b>4주가 끝나면 말랑방은 닫지 않아요.</b></P>
            </Block>

            <Block eyebrow="4주">
              <h2 style={sectionH2}>한 주에 한 칸씩</h2>
              <div style={{ marginTop: 6 }}>
                {WEEKS.map(w => (
                  <div key={w.n} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 14, padding: "12px 0" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.sage }}>{w.n}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{w.title}</div>
                      <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>{w.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Block>

            <Block eyebrow="얼굴 모드">
              <h2 style={sectionH2}>서로의 몸을<br />보지 않아요</h2>
              <P><b>강사만 참가자를 봐요.</b> 참가자끼리는 서로 보이지 않아요. 부담 갖지 마세요.</P>
              <div style={{ display: "inline-flex", background: C.page, border: `1px solid ${C.line}`, borderRadius: 999, padding: 3, margin: "14px 0 12px" }}>
                {[["me", "내가 보는 화면"], ["coach", "강사가 보는 화면"]].map(([k, label]) => (
                  <button key={k} onClick={() => setScreenTab(k)} className={PRESS} style={{
                    fontSize: 12, fontWeight: 700, border: "none", padding: "8px 14px", borderRadius: 999, cursor: "pointer",
                    background: screenTab === k ? C.sage : "transparent", color: screenTab === k ? "#fff" : C.sub, transition: "background .2s, color .2s",
                  }}>{label}</button>
                ))}
              </div>
              <ScreenMock tab={screenTab} />
              <P style={{ marginTop: 12 }}>1주차는 얼굴을 꺼두셔도 돼요. 채팅으로만 참여하셔도 괜찮아요.</P>
            </Block>

            <Block eyebrow="강사">
              <h2 style={sectionH2}>함께 이끌어요</h2>
              <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>이서진 강사 ●●●</div>
              <div style={{ fontSize: 12, color: C.mute, margin: "4px 0 12px" }}>물리치료사 면허 · 필라테스 지도자 자격</div>
              <P>스무 명이 같은 곳이 뻐근한 사람들이라, 한 사람을 위한 도움이 곧 모두를 위한 도움이 돼요. 수업에서는 <b>닉네임으로만</b> 불러드려요.</P>
            </Block>

            <Block eyebrow="궁금한 것">
              <div>
                {FAQS.map((f, i) => (
                  <details key={i} className="mc-faq" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                    <summary style={{ fontSize: 14, fontWeight: 700, padding: "15px 0", cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
                      {f.q}
                      <span className="mc-faq-plus" style={{ display: "inline-block", color: C.sage, fontSize: 18, fontWeight: 400, transition: "transform .2s" }}>+</span>
                    </summary>
                    <p className="mc-faq-a" style={{ fontSize: 13, color: C.sub, padding: "0 0 16px", lineHeight: 1.7, margin: 0 }}>{f.a}</p>
                  </details>
                ))}
              </div>
              <style>{`
                .mc-faq[open] > summary .mc-faq-plus { transform: rotate(45deg); }
                .mc-faq[open] > .mc-faq-a { animation: mcFaqIn .22s ease; }
                @keyframes mcFaqIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
              `}</style>
            </Block>

          </div>
        </div>

        {/* 마무리 CTA */}
        <div style={{ padding: "40px 0 20px", textAlign: "center", borderTop: `1px solid ${C.line}`, marginTop: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>같이 모여요</div>
          <p style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>{KO_NUM[left]} 자리 남았어요</p>
          <button className={PRESS} style={{ background: C.sage, color: "#fff", fontSize: 13.5, fontWeight: 700, padding: "12px 26px", borderRadius: 999, border: "none", cursor: "pointer", boxShadow: SAGE_SHADOW }}>신청하기</button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 18, padding: "12px 14px", background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 14 }}>
          <span style={{ fontSize: 13 }}>ℹ️</span>
          <p style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.6, margin: 0 }}>
            말랑 클래스는 일상에서 몸을 돌보는 운동을 함께하는 프로그램이에요. 건강 상태를 진단하거나 의학적 조언을 드리는 것이 아니에요. 불편함이 계속된다면 전문가와 상담해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

function SoonSlot({ part, type, when }) {
  return (
    <div style={{ background: "transparent", border: `1px dashed ${C.line}`, borderRadius: 20, padding: "18px 20px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.mute }}>{part}</div>
          <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: C.mute, background: C.page, padding: "4px 10px", borderRadius: 999, marginTop: 6 }}>{type}</span>
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.mute, paddingTop: 5 }}>준비 중</div>
      </div>
      <p style={{ fontSize: 12.5, color: C.mute, margin: "12px 0 0" }}>{when}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
        <span style={{ fontSize: 13, color: C.mute }}>곧 열려요</span>
        <button disabled style={{ background: "transparent", color: C.mute, border: `1.5px solid ${C.line}`, fontSize: 12.5, fontWeight: 700, padding: "10px 18px", borderRadius: 999, cursor: "default" }}>열리면 알려드려요</button>
      </div>
    </div>
  );
}

function ScreenMock({ tab }) {
  if (tab === "me") {
    return (
      <div style={{ background: "#1F2E27", borderRadius: 14, padding: 12 }}>
        <div style={{ background: "#324840", borderRadius: 8, height: 90, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#9FBBAC" }}>강사</div>
        <p style={{ fontSize: 12.5, color: C.sub, marginTop: 10, lineHeight: 1.6 }}>학생이 보는 화면엔 <b style={{ color: C.ink }}>강사님 뷰만</b> 있어요. 다른 분들은 보이지 않아요.</p>
      </div>
    );
  }
  return (
    <div style={{ background: "#1F2E27", borderRadius: 14, padding: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ background: "#2C4038", borderRadius: 6, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Mallang v={(i % 5) + 1} size={16} />
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: C.sub, marginTop: 10, lineHeight: 1.6 }}>강사 화면엔 <b style={{ color: C.ink }}>참가자들이 다</b> 보여요. 다만 한 사람씩 지적하는 것은 아니에요.</p>
    </div>
  );
}

function Block({ eyebrow, children }) {
  return (
    <div style={{ padding: "26px 0", borderTop: `1px solid ${C.line}` }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sage, letterSpacing: "0.03em", marginBottom: 8 }}>{eyebrow}</div>
      {children}
    </div>
  );
}

function P({ children, style }) {
  return <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.75, margin: "10px 0 0", ...style }}>{children}</p>;
}

const sectionH2 = { fontSize: 21, fontWeight: 800, margin: "4px 0 4px", lineHeight: 1.35 };
