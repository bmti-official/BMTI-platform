import { getTypeAccent, GOLD, YELLOW, YELLOW_LINE } from "../lib/typeAccent";

// ─────────────────────────────────────────────
// '큐레이션' · '예약' 준비 중 화면 — 별도의 콘텐츠·DB 저장 없이 깔끔한 안내만.
// (기존 말랑 클래스/말랑방 및 바라는 점(service_wishes) 저장 기능은 제거됨)
// ─────────────────────────────────────────────

const INK = "#1C1A17", SUB = "#8A8378", MUTE = "#B7B2A9";

// 큐레이션 — 펼쳐진 책
const BookArt = ({ col }) => (
  <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
    <path d="M24 12c-3.4-2.2-7.4-3.2-11.5-3.2-1.4 0-2.5 1.1-2.5 2.5v22c0 1.4 1.1 2.5 2.5 2.5 4.1 0 8.1 1 11.5 3.2" stroke={col} strokeWidth="2.2" strokeLinejoin="round" fill="none" />
    <path d="M24 12c3.4-2.2 7.4-3.2 11.5-3.2 1.4 0 2.5 1.1 2.5 2.5v22c0 1.4-1.1 2.5-2.5 2.5-4.1 0-8.1 1-11.5 3.2" stroke={col} strokeWidth="2.2" strokeLinejoin="round" fill="none" />
    <path d="M24 12v29" stroke={col} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M15 18h4.5M15 23h4.5M28.5 18H33M28.5 23H33" stroke={col} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
  </svg>
);
// 예약 — 티켓
const TicketArt = ({ col }) => (
  <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
    <path d="M6 16a3 3 0 0 1 3-3h30a3 3 0 0 1 3 3v3.2a3.2 3.2 0 0 0 0 6.4V32a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-2.4a3.2 3.2 0 0 0 0-6.4V16Z" stroke={col} strokeWidth="2.2" strokeLinejoin="round" fill="none" />
    <path d="M24 15v3M24 22.5v3M24 30v3" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeDasharray="0.1 5" />
  </svg>
);

const CONTENT = {
  curation: {
    heading: "큐레이션,\n곧 찾아옵니다",
    tagline: "내 몸 상태와 성향에 딱 맞는 콘텐츠와 아이템을 골라 담아 보여드리는 큐레이션을 준비하고 있어요.",
    Art: BookArt,
    points: ["유형·부위별 맞춤 스트레칭과 콘텐츠", "지금 내 몸에 필요한 관리 아이템 추천", "매달 새롭게 채워지는 큐레이션 목록"],
  },
  reservation: {
    heading: "예약,\n곧 열립니다",
    tagline: "필요할 때 전문가 세션이나 클래스를 간편하게 예약하는 기능을 준비하고 있어요.",
    Art: TicketArt,
    points: ["원하는 시간에 전문가 세션 예약", "같은 유형끼리 모이는 소그룹 클래스", "간편한 일정 확인과 알림"],
  },
};

export default function ServicePrep({ kind = "curation", bmtiCode }) {
  const t = getTypeAccent(bmtiCode);
  const c = CONTENT[kind];
  const Art = c.Art;
  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "12px 22px 40px", fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 800, color: t.accentDeep, background: t.accentSoft, padding: "7px 14px", borderRadius: 999 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.accent, display: "inline-block" }} />
          준비 중
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <span style={{ width: 108, height: 108, borderRadius: 28, background: YELLOW, border: `1px solid ${YELLOW_LINE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Art col={t.accentDeep} />
        </span>
      </div>

      <h1 style={{ fontSize: "clamp(24px,6.5vw,30px)", fontWeight: 800, lineHeight: 1.32, letterSpacing: "-0.02em", textAlign: "center", margin: 0, whiteSpace: "pre-line" }}>{c.heading}</h1>
      <p style={{ fontSize: 14, color: SUB, lineHeight: 1.7, textAlign: "center", margin: "12px auto 0", maxWidth: 330 }}>{c.tagline}</p>

      <div style={{ marginTop: 26, background: "#fff", border: `1px solid #EDE9E2`, borderRadius: 20, padding: "18px 18px 8px", boxShadow: "0 1px 2px rgba(28,26,23,0.03), 0 8px 20px rgba(28,26,23,0.05)" }}>
        {c.points.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 2px", borderTop: i ? "1px solid #F3F1EC" : "none" }}>
            <span style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, background: t.accentSoft, color: t.accentDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.45 }}>{p}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.7, textAlign: "center", marginTop: 18 }}>
        오픈하면 가장 먼저 알려드릴게요.
      </p>
    </div>
  );
}
