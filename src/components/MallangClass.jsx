import { useState, useRef, useEffect } from "react";
import { CHARACTERS } from "../data";
import { getTypeAccent, GOLD, YELLOW, YELLOW_LINE } from "../lib/typeAccent";
import ComingSoon from "./ComingSoon";

// ============================================
// 말랑 클래스 — 같은 BMTI 유형끼리 모이는 4주 온라인 그룹 클래스 목록 화면.
// 색상: 배경 화이트 / 버튼 골드 / 박스 연옐로우 / 강조 유형별(M 연분홍·Z 연보라)
// ============================================

const C = {
  bg: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2", mute: "#C9C4B8",
  yellow: YELLOW, yellowLine: YELLOW_LINE,
};
const PRESS = "active:scale-95 transition-transform";
const KO_NUM = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열", "열한", "열두"];

const ROOMS = [
  {
    id: "neck_weekday", part: "목 · 어깨", type: "OM", when: "월·목 20:00", desc: "평일반 · 월·목 20:00 · 50분 8회",
    price: "5만 원 · 8회", taken: 14, cap: 20, status: "open",
    typeBreakdown: [
      { type: "ACDZ", count: 4 }, { type: "OCQM", count: 3 }, { type: "OLQM", count: 3 },
      { type: "ALDM", count: 2 }, { type: "ACQZ", count: 2 },
    ],
  },
  {
    id: "neck_weekend", part: "목 · 어깨", type: "OM", when: "토·일 10:00", desc: "주말반 · 토·일 10:00 · 50분 8회",
    price: "5만 원 · 8회", taken: 8, cap: 20, status: "open",
    typeBreakdown: [
      { type: "OCDZ", count: 3 }, { type: "OLQZ", count: 2 }, { type: "ACDM", count: 2 }, { type: "ALQM", count: 1 },
    ],
  },
  { id: "neck_am", part: "목 · 어깨", type: "AM", when: "다음 달", desc: "움직이면서 푸는 반", price: "5만 원 · 8회", taken: 0, cap: 20, status: "soon", typeBreakdown: [] },
  { id: "waist_om", part: "허리 · 골반", type: "OM", when: "다음 달", desc: "오래 앉거나 서 있는 분", price: "5만 원 · 8회", taken: 0, cap: 20, status: "soon", typeBreakdown: [] },
];

// 신청 버튼 소제목 — 반의 대상 유형에 따라 다른 응원 문구를 붙인다.
const APPLY_SUBTITLE = {
  OM: "지금도 잘하고 있지만",
  AM: "이미 부지런히 움직이고 있지만",
  OZ: "혼자서도 잘 해내고 있지만",
  AZ: "지금 페이스도 충분하지만",
};

const MINOR_CHIP_IDS = ["neck", "waist", "weekday", "weekend"];
const CHIPS = [
  { id: "my", label: "내 유형" },
  { id: "neck", label: "목 · 어깨" },
  { id: "waist", label: "허리 · 골반" },
  { id: "weekday", label: "평일반" },
  { id: "weekend", label: "주말반" },
];

const CATEGORY_SLIDES = [
  { key: "together", title: "같은 사람들끼리 모여요", desc: "BMTI 유형이 비슷한 사람 20명이 모이는 4주 온라인 클래스예요.", visual: "characters" },
  { key: "room", title: "말랑방", desc: "20명이 다 모이면 5명씩 말랑방 네 개로 나뉘어요. 수업이 없는 날에도 서로 오늘 어땠는지 가볍게 나눌 수 있어요.", visual: "rooms" },
  { key: "focus", title: "포커스 모드", desc: "강사만 참가자를 보고, 참가자끼리는 서로 화면이 보이지 않아요. 부담 없이 참여하셔도 돼요.", visual: "face" },
  { key: "prep", title: "준비물", desc: "매트 한 장과 몸을 움직일 작은 공간이면 충분하지만 프로그램마다 추천 드리는 소도구들은 있어요.", visual: "mat" },
];

const REFUND_FAQ = [
  { q: "언제까지 취소하면 전액 환불되나요?", a: "첫 수업 시작 전까지 취소하시면 전액 환불해 드려요." },
  { q: "수업이 시작된 뒤에도 환불되나요?", a: "이미 진행한 회차를 제외하고, 남은 회차만큼 환불해 드려요." },
  { q: "제가 빠진 회차는 어떻게 되나요?", a: "개인 사정으로 빠진 회차는 강사 화면 녹화본으로 보내드리고, 환불 대상에는 포함되지 않아요." },
  { q: "반이 안 열리면요?", a: "정원이 모이지 않아 반이 열리지 않으면 전액 환불해 드려요." },
  { q: "환불은 얼마나 걸리나요?", a: "영업일 기준 3~5일 안에 결제하신 수단으로 돌려드려요." },
];

// ── 반 상세(강사·주차별 프로그램) — 관리자가 수정하면 localStorage에 저장돼 모두에게 반영 ──
const DETAIL_KEY = "mallang_class_detail_v1";
const DEFAULT_DETAIL = {
  instructor: "이서진 강사 · 물리치료사 면허 · 필라테스 지도자 자격",
  weeks: [
    "1주차 · 가장 가벼운 것부터 — 지금 할 수 있는 것으로 시작해요. 카메라를 안 켜셔도 돼요.",
    "2주차 · 한 칸 올려요 — 몸이 조금씩 익숙해져요.",
    "3주차 · 또 한 칸 — 힘들면 절대 무리하지 않고 가요.",
    "4주차 · 4주를 같이 봐요 — 우리의 4주가 어땠는지 함께 보고 마무리해요.",
  ],
};
function loadDetail() {
  try {
    const saved = JSON.parse(localStorage.getItem(DETAIL_KEY) || "null");
    if (saved && saved.instructor && Array.isArray(saved.weeks)) return saved;
  } catch { /* noop */ }
  return DEFAULT_DETAIL;
}

export default function MallangClass({ onClose, bmtiCode, charImage, onRequireLogin, isAdmin, userProfile }) {
  const [filter, setFilter] = useState("neck");
  const [showRefund, setShowRefund] = useState(false);
  const t = getTypeAccent(bmtiCode);
  const myType = bmtiCode ? bmtiCode.split("-")[0] : "측정 전";

  const rooms = ROOMS.filter(r => {
    if (filter === "my") return r.type === "OM";
    if (filter === "neck") return r.part === "목 · 어깨";
    if (filter === "waist") return r.part === "허리 · 골반";
    if (filter === "weekday") return r.desc.includes("평일");
    if (filter === "weekend") return r.desc.includes("주말");
    return true;
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 30, background: C.bg, overflowY: "auto", fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "76px 0 96px" }}>

        {/* 앱바 — 이전 / 제목 / 햄버거(환불 FAQ, 관리자만) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 10px", position: "relative" }}>
          <button onClick={onClose} aria-label="이전" className={PRESS} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "transparent", color: C.ink, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>말랑 클래스</div>
          {isAdmin ? (
            <button onClick={() => setShowRefund(true)} aria-label="환불 FAQ 열기" className={PRESS} style={{ width: 34, height: 34, borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.ink }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          ) : <div style={{ width: 34 }} />}
        </div>

        {/* 관리자를 제외한 이용자에게는 '준비 중' 화면을 보여준다. */}
        {!isAdmin ? (
          <ComingSoon kind="class" bmtiCode={bmtiCode} userProfile={userProfile} />
        ) : (
        <>

        {/* 내 캐릭터(또는 로그인 유도) + 내 유형 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "6px 20px 4px" }}>
          {charImage ? (
            <img src={charImage} alt="내 캐릭터" style={{ width: 56, height: 56, objectFit: "contain" }} />
          ) : (
            <button onClick={onRequireLogin} className={PRESS} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 18px", borderRadius: 999, border: "none", background: "#FEE500", color: "#3C1E1E", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
              <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "#3C1E1E" }}><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" /></svg>
              카카오로 3초 로그인
            </button>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: 6, background: t.accentSoft, borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 800, color: t.accentDeep, whiteSpace: "nowrap" }}>
            내 유형 {myType}
          </span>
        </div>

        {/* 소개 카루셀 */}
        <div style={{ padding: "18px 20px 0" }}>
          <CategoryCarousel t={t} />
        </div>

        {/* 필터 칩 */}
        <FilterChips filter={filter} setFilter={setFilter} />

        {/* 반 목록 */}
        <div style={{ padding: "18px 20px 0" }}>
          <h3 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>지금 모으는 반</h3>
          <p style={{ fontSize: 13, color: C.sub, marginBottom: 16, fontWeight: 500 }}>스무 명이 다 모이면 다섯 명씩 말랑방 네 개로 나뉘어요</p>

          {rooms.length === 0 ? (
            <p style={{ fontSize: 13, color: C.mute, textAlign: "center", padding: "30px 0" }}>조건에 맞는 반이 아직 없어요.</p>
          ) : (
            rooms.map((r, i) => (
              <div key={r.id}>
                {i > 0 && <div style={{ height: 1, background: C.line, margin: "4px 0 22px" }} />}
                <RoomCard room={r} t={t} isAdmin={isAdmin} />
              </div>
            ))
          )}
        </div>
        </>
        )}
      </div>

      {showRefund && <RefundDrawer onClose={() => setShowRefund(false)} t={t} />}
    </div>
  );
}

// ── 소개 카루셀: 좌/우 3분할 클릭·드래그·자동전환 ──
function CategoryCarousel({ t }) {
  const N = CATEGORY_SLIDES.length;
  const [active, setActive] = useState(0);
  const [dragX, setDragX] = useState(0);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const movedRef = useRef(0);
  const boxRef = useRef(null);

  const go = (dir) => setActive(a => (a + dir + N) % N);

  // 클릭을 안 해도 일정 시간마다 우측으로 한 칸씩 넘어간다(드래그 중엔 멈춤).
  useEffect(() => {
    const id = setInterval(() => { if (!draggingRef.current) setActive(a => (a + 1) % N); }, 4000);
    return () => clearInterval(id);
  }, [N]);

  const onDown = (e) => {
    draggingRef.current = true;
    startXRef.current = e.clientX;
    movedRef.current = 0;
  };
  const onMove = (e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    movedRef.current = dx;
    setDragX(dx);
  };
  const onUp = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const dx = movedRef.current;
    const w = boxRef.current ? boxRef.current.clientWidth : 1;
    setDragX(0);
    if (Math.abs(dx) < 6) {
      // 클릭: 좌측 1/3 이전, 우측 1/3 다음, 가운데는 그대로
      const rect = boxRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 3) go(-1);
      else if (x > (rect.width * 2) / 3) go(1);
    } else if (Math.abs(dx) > w * 0.16) {
      go(dx < 0 ? 1 : -1); // 왼쪽으로 끌면 다음
    }
  };

  return (
    <div>
      <div
        ref={boxRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onPointerCancel={onUp}
        style={{ overflow: "hidden", position: "relative", touchAction: "pan-y", cursor: "grab", userSelect: "none" }}
      >
        <div style={{ display: "flex", transform: `translateX(calc(${-active * 100}% + ${dragX}px))`, transition: draggingRef.current ? "none" : "transform .35s cubic-bezier(.22,.9,.32,1)" }}>
          {CATEGORY_SLIDES.map((s) => (
            <div key={s.key} style={{ flex: "0 0 100%" }}>
              <CategorySlideCard slide={s} t={t} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "10px 0 0" }}>
        {CATEGORY_SLIDES.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} aria-label={`${i + 1}번째 소개`}
            style={{ width: active === i ? 20 : 7, height: 7, borderRadius: 99, border: "none", padding: 0, background: active === i ? t.accent : t.accentSoft, cursor: "pointer", transition: "width .2s, background .2s" }} />
        ))}
      </div>
    </div>
  );
}

function CategorySlideCard({ slide, t }) {
  return (
    <div style={{ background: C.yellow, border: `1px solid ${C.yellowLine}`, borderRadius: 20, padding: "24px 20px", minHeight: 188, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 12, pointerEvents: "none" }}>
      <SlideVisual kind={slide.visual} t={t} />
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 800 }}>{slide.title}</div>
        <p style={{ fontSize: 11.5, color: C.sub, marginTop: 4, lineHeight: 1.55, maxWidth: 250 }}>{slide.desc}</p>
      </div>
    </div>
  );
}

const SAMPLE_TYPES = ["ACDZ", "OLQM", "ACQM", "OCDZ", "ALQZ"];

function SlideVisual({ kind, t }) {
  if (kind === "characters") {
    return (
      <div style={{ display: "flex" }}>
        {SAMPLE_TYPES.map((id, i) => {
          const c = CHARACTERS.find(x => x.id === id);
          const full = ["OCDZ", "OCQM", "OLQM"].includes(id);
          return (
            <div key={id} style={{ width: 50, height: 50, borderRadius: "50%", background: "#fff", border: `2px solid ${C.yellow}`, marginLeft: i === 0 ? 0 : -14, boxShadow: "0 2px 6px rgba(28,26,23,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", zIndex: SAMPLE_TYPES.length - i, flexShrink: 0 }}>
              {c && <img src={c.image} alt="" className={full ? "scale-100" : "scale-125"} style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
            </div>
          );
        })}
      </div>
    );
  }
  if (kind === "rooms") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
        {[0, 1, 2, 3].map(n => (
          <div key={n} style={{ width: 32, height: 32, borderRadius: 9, background: t.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 800, color: t.accentDeep }}>5</div>
        ))}
      </div>
    );
  }
  if (kind === "face") {
    return (
      <div style={{ width: 60, height: 60, borderRadius: "50%", background: t.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="9" r="4" stroke={t.accentDeep} strokeWidth="1.8" />
          <path d="M5 20c0-3.3 3-5.5 7-5.5s7 2.2 7 5.5" stroke={t.accentDeep} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    );
  }
  return (
    <div style={{ width: 60, height: 60, borderRadius: 16, background: t.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="10" rx="3" stroke={t.accentDeep} strokeWidth="1.8" />
        <line x1="9" y1="7" x2="9" y2="17" stroke={t.accentDeep} strokeWidth="1.8" />
      </svg>
    </div>
  );
}

// ── 필터 칩 (골드 톤 가로 스크롤) ──
function FilterChips({ filter, setFilter }) {
  const trackRef = useRef(null);
  const [pct, setPct] = useState(0);
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setPct(max > 0 ? el.scrollLeft / max : 0);
  };
  return (
    <div style={{ position: "relative", padding: "16px 0 0" }}>
      <div ref={trackRef} onScroll={onScroll} className="mc-hide-scrollbar" style={{ display: "flex", gap: 9, overflowX: "auto", padding: "0 20px" }}>
        {CHIPS.map(c => {
          const on = filter === c.id;
          const minor = MINOR_CHIP_IDS.includes(c.id);
          return (
            <button key={c.id} onClick={() => setFilter(c.id)} className={PRESS}
              style={{ whiteSpace: "nowrap", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, padding: "10px 16px", borderRadius: 999, flexShrink: 0,
                border: `1.5px solid ${on ? (minor ? C.yellowLine : "transparent") : C.line}`, cursor: "pointer",
                background: on ? (minor ? C.yellow : GOLD) : "#fff", color: on ? (minor ? "#8A6A2E" : "#fff") : C.sub }}>
              {c.label}
            </button>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, top: 16, bottom: 0, width: 22, background: "linear-gradient(90deg, #fff, rgba(255,255,255,0))", pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 0, top: 16, bottom: 0, width: 22, background: "linear-gradient(270deg, #fff, rgba(255,255,255,0))", pointerEvents: "none" }} />
      <div style={{ margin: "8px 20px 0", height: 3, background: "#F1E6CF", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: "30%", borderRadius: 99, background: `linear-gradient(90deg, #DDBB80, ${GOLD})`, transform: `translateX(${pct * 233}%)`, transition: "transform .08s linear" }} />
      </div>
      <style>{`.mc-hide-scrollbar::-webkit-scrollbar{display:none}.mc-hide-scrollbar{scrollbar-width:none}`}</style>
    </div>
  );
}

function Crowd({ breakdown, t }) {
  if (!breakdown || breakdown.length === 0) {
    return <p style={{ fontSize: 12.5, color: C.mute, textAlign: "center", padding: "16px 0" }}>아직 신청자가 없어요. 첫 번째로 신청해보세요!</p>;
  }
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", padding: "4px 0" }}>
      {breakdown.map(b => {
        const char = CHARACTERS.find(c => c.id === b.type);
        const full = ["OCDZ", "OCQM", "OLQM"].includes(b.type);
        return (
          <div key={b.type} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#fff", border: `1px solid ${C.yellowLine}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {char
                ? <img src={char.image} alt={b.type} className={full ? "scale-100" : "scale-125"} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : <span style={{ fontSize: 10 }}>{b.type}</span>}
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.04em", color: C.sub }}>{b.type}</span>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: t.accentDeep, marginTop: -2 }}>{b.count}명</span>
          </div>
        );
      })}
    </div>
  );
}

function Gauge({ taken, cap, status, t }) {
  const left = cap - taken;
  const pct = Math.round((taken / cap) * 100);
  if (status !== "open") {
    return (
      <div style={{ marginTop: 14 }}>
        <div style={{ height: 8, background: "#F1EACB", borderRadius: 999 }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontSize: 12.5, fontWeight: 600, color: C.mute }}>
          <span>곧 열려요</span><span>다음 달 예정</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ height: 8, background: "#F1EACB", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: t.accent, transition: "width .3s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontSize: 12.5, fontWeight: 600, color: C.sub }}>
        <span><b style={{ color: t.accentDeep }}>{taken}</b> / {cap}명</span>
        <span>{KO_NUM[left]} 자리 남음</span>
      </div>
    </div>
  );
}

function RoomCard({ room, t, isAdmin }) {
  const [open, setOpen] = useState(false);
  const isOpen = room.status === "open";
  const sub = APPLY_SUBTITLE[room.type] || "지금 시작해도 충분해요";
  return (
    <div style={{ marginBottom: 22 }}>
      {/* 헤더(누르면 아코디언 열림) */}
      <button onClick={() => setOpen(o => !o)} className={PRESS} style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", padding: 0, cursor: "pointer", display: "block" }}>
        <div style={{ background: C.yellow, border: `1px solid ${C.yellowLine}`, borderRadius: 18, padding: "16px 16px 20px" }}>
          {/* 상단 행: 요일·시간 알약 / 상태 배지 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            {isOpen
              ? <span style={{ fontSize: 11.5, fontWeight: 800, color: t.accentDeep, background: t.accentSoft, borderRadius: 999, padding: "5px 11px" }}>{room.when}</span>
              : <span style={{ fontSize: 11.5, fontWeight: 700, color: C.mute, background: "#fff", borderRadius: 999, padding: "5px 11px", border: `1px solid ${C.yellowLine}` }}>다음 달</span>}
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", padding: "4px 10px", borderRadius: 8, background: isOpen ? t.accent : C.mute }}>{isOpen ? "모집 중" : "준비 중"}</span>
          </div>
          <Crowd breakdown={room.typeBreakdown} t={t} />
          <Gauge taken={room.taken} cap={room.cap} status={room.status} t={t} />
        </div>

        {/* 반 정보: 'OM 목 · 어깨' / 설명 + 펼침 화살표 */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginTop: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 17, fontWeight: 800 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: t.accentDeep, background: t.accentSoft, padding: "3px 9px", borderRadius: 7 }}>{room.type}</span>
              <span style={isOpen ? undefined : { color: C.mute }}>{room.part}</span>
            </div>
            <div style={{ fontSize: 13.5, color: isOpen ? C.sub : C.mute, marginTop: 4 }}>{room.desc}</div>
          </div>
          <span style={{ fontSize: 13, color: C.sub, flexShrink: 0, marginTop: 4, transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
        </div>
      </button>

      {/* 신청하기 버튼(모집 중일 때만) — 유형별 응원 문구 */}
      {isOpen && (
        <button className={PRESS} style={{ width: "100%", marginTop: 12, padding: "12px 16px", borderRadius: 16, border: "none", background: GOLD, color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontSize: 15.5, fontWeight: 800 }}>신청하기</span>
          <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>{sub}</span>
        </button>
      )}

      {/* 아코디언 상세: 강사 + 주차별 프로그램 */}
      {open && <RoomDetail room={room} isAdmin={isAdmin} t={t} />}
    </div>
  );
}

function RoomDetail({ room, isAdmin, t }) {
  const [detail, setDetail] = useState(loadDetail);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(detail);

  const startEdit = () => { setDraft(detail); setEditing(true); };
  const save = () => {
    const clean = { instructor: draft.instructor.trim(), weeks: draft.weeks.map(w => w.trim()) };
    localStorage.setItem(DETAIL_KEY, JSON.stringify(clean));
    setDetail(clean);
    setEditing(false);
  };

  return (
    <div style={{ marginTop: 12, background: "#FBFAF6", border: `1px solid ${C.yellowLine}`, borderRadius: 16, padding: "16px 16px 18px", animation: "mcAcc .22s ease" }}>
      {/* 강사 */}
      <div style={{ fontSize: 11.5, fontWeight: 800, color: t.accentDeep, marginBottom: 6 }}>강사</div>
      {editing
        ? <input value={draft.instructor} onChange={e => setDraft(d => ({ ...d, instructor: e.target.value }))} style={inputStyle} />
        : <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>{detail.instructor}</div>}

      {/* 주차별 프로그램 */}
      <div style={{ fontSize: 11.5, fontWeight: 800, color: t.accentDeep, margin: "14px 0 6px" }}>주차별 프로그램</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(editing ? draft.weeks : detail.weeks).map((w, i) => (
          editing
            ? <textarea key={i} value={w} onChange={e => setDraft(d => { const weeks = [...d.weeks]; weeks[i] = e.target.value; return { ...d, weeks }; })} rows={2} style={{ ...inputStyle, resize: "none" }} />
            : <div key={i} style={{ fontSize: 13, color: C.ink, lineHeight: 1.55, display: "flex", gap: 8 }}>
                <span style={{ color: t.accent, fontWeight: 800 }}>·</span><span>{w}</span>
              </div>
        ))}
      </div>

      {/* 수강료 */}
      <div style={{ fontSize: 12.5, color: C.sub, marginTop: 14 }}>수강료 · <b style={{ color: C.ink, fontWeight: 800 }}>{room.price}</b></div>

      {/* 관리자 전용 수정 */}
      {isAdmin && (
        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          {editing ? (
            <>
              <button onClick={save} className={PRESS} style={{ flex: 1, padding: 10, borderRadius: 12, border: "none", background: GOLD, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>저장</button>
              <button onClick={() => setEditing(false)} className={PRESS} style={{ padding: "10px 16px", borderRadius: 12, border: `1px solid ${C.line}`, background: "#fff", color: C.sub, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>취소</button>
            </>
          ) : (
            <button onClick={startEdit} className={PRESS} style={{ padding: "9px 16px", borderRadius: 12, border: `1px solid ${C.line}`, background: "#fff", color: C.ink, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, background: "#1D4ED8", color: "#fff", padding: "1px 6px", borderRadius: 5 }}>관리자</span> 수정하기
            </button>
          )}
        </div>
      )}
      <style>{`@keyframes mcAcc{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
const inputStyle = { width: "100%", padding: "9px 11px", borderRadius: 10, border: "1px solid #E3DCC8", background: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

// ── 환불 FAQ 드로어(우측에서 슬라이드) ──
function RefundDrawer({ onClose, t }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(28,26,23,0.4)" }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "86%", maxWidth: 360, background: "#fff", padding: "70px 20px 30px", overflowY: "auto", boxShadow: "-8px 0 24px rgba(0,0,0,0.12)", animation: "mcSlide .28s cubic-bezier(.22,.9,.32,1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>환불 FAQ</div>
          <button onClick={onClose} aria-label="닫기" style={{ border: "none", background: "transparent", color: C.sub, fontSize: 18, cursor: "pointer", padding: 4 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {REFUND_FAQ.map((f, i) => (
            <details key={i} className="mc-rf" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
              <summary style={{ fontSize: 14, fontWeight: 700, padding: "15px 0", cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
                {f.q}
                <span className="mc-rf-plus" style={{ color: t.accent, fontSize: 18, transition: "transform .2s", display: "inline-block" }}>+</span>
              </summary>
              <p style={{ fontSize: 13, color: C.sub, padding: "0 0 15px", lineHeight: 1.7, margin: 0 }}>{f.a}</p>
            </details>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: C.mute, lineHeight: 1.6, marginTop: 18 }}>
          환불 규정은 상황에 따라 달라질 수 있어요. 자세한 문의는 고객센터로 남겨주세요.
        </p>
        <style>{`
          @keyframes mcSlide{from{transform:translateX(100%)}to{transform:translateX(0)}}
          .mc-rf[open] > summary .mc-rf-plus{transform:rotate(45deg)}
        `}</style>
      </div>
    </div>
  );
}
