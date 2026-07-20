import { useState, useRef } from "react";
import { CHARACTERS } from "../data";
import { getTypeAccent, GOLD, YELLOW, YELLOW_LINE } from "../lib/typeAccent";

// ============================================
// 말랑 클래스 — 같은 BMTI 유형·같은 부위가 뻐근한 사람들끼리 모이는
// 4주 온라인 그룹 클래스 목록 화면.
//
// 전체 색상 통일 규칙:
//   기본 배경 화이트 / 기본 문구 검정
//   핵심 버튼('내 유형' 필터, 탭 밑줄)     → 골드(#C9975A)
//   안 중요한 버튼(부위·평일/주말 필터)      → 연한 옐로우
//   박스/카드(소개 카루셀, 반 카드)          → 연한 옐로우(#FDF6DC)
//   강조 요소(태그·배지·게이지·인원수·점)    → 유형별(M 연분홍 / Z 연보라)
// ============================================

const C = {
  bg: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2", mute: "#C9C4B8",
  yellow: YELLOW, yellowLine: YELLOW_LINE,
};
const PRESS = "active:scale-95 transition-transform";
const KO_NUM = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열", "열한", "열두"];

// 실제 예약 데이터가 아직 없어 데모 값을 쓴다. typeBreakdown은 이 반에 실제로 모인
// 사람들의 BMTI 유형 구성(합계 = taken) — 한 가지 유형만 있는 게 아니라는 걸 보여준다.
const ROOMS = [
  {
    id: "neck_weekday", part: "목 · 어깨", type: "OM", when: "월·목 20:00", desc: "평일반 · 월·목 20:00 · 50분 8회",
    taken: 14, cap: 20, status: "open",
    typeBreakdown: [
      { type: "ACDZ", count: 4 }, { type: "OCQM", count: 3 }, { type: "OLQM", count: 3 },
      { type: "ALDM", count: 2 }, { type: "ACQZ", count: 2 },
    ],
  },
  {
    id: "neck_weekend", part: "목 · 어깨", type: "OM", when: "토·일 10:00", desc: "주말반 · 토·일 10:00 · 50분 8회",
    taken: 8, cap: 20, status: "open",
    typeBreakdown: [
      { type: "OCDZ", count: 3 }, { type: "OLQZ", count: 2 }, { type: "ACDM", count: 2 }, { type: "ALQM", count: 1 },
    ],
  },
  { id: "neck_am", part: "목 · 어깨", type: "AM", when: "다음 달", desc: "움직이면서 푸는 반", taken: 0, cap: 20, status: "soon", typeBreakdown: [] },
  { id: "waist_om", part: "허리 · 골반", type: "OM", when: "다음 달", desc: "오래 앉거나 서 있는 분", taken: 0, cap: 20, status: "soon", typeBreakdown: [] },
];

// 중요도가 낮은(단순 분류용) 필터 칩 id 목록 — 활성 시 골드 대신 연한 옐로우를 쓴다.
const MINOR_CHIP_IDS = ["neck", "waist", "weekday", "weekend"];

const CHIPS = [
  { id: "my", label: "내 유형" },
  { id: "neck", label: "목 · 어깨" },
  { id: "waist", label: "허리 · 골반" },
  { id: "weekday", label: "평일반" },
  { id: "weekend", label: "주말반" },
];

const CATEGORY_SLIDES = [
  { key: "together", title: "같은 사람들끼리 모여요", desc: "같은 BMTI 유형과 뻐근한 부위가 겹치는 사람끼리 20명이 모이는 4주 온라인 클래스예요.", visual: "characters" },
  { key: "room", title: "말랑방", desc: "20명이 다 모이면 5명씩 말랑방 네 개로 나뉘어요. 수업이 없는 날에도 서로 오늘 어땠는지 가볍게 나눌 수 있어요.", visual: "rooms" },
  { key: "face", title: "얼굴 모드", desc: "강사만 참가자를 보고, 참가자끼리는 서로 화면이 보이지 않아요. 부담 없이 참여하셔도 돼요.", visual: "face" },
  { key: "prep", title: "준비물", desc: "매트 한 장과 몸을 움직일 작은 공간이면 충분해요.", visual: "mat" },
];

export default function MallangClass({ onClose, bmtiCode, charImage, onRequireLogin }) {
  const [filter, setFilter] = useState("neck");
  const [showHelp, setShowHelp] = useState(false);
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

        {/* 앱바 — 이전(홈으로) / 도움말 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 10px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={onClose} aria-label="이전" className={PRESS} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "transparent", color: C.ink, fontSize: 19, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ‹
            </button>
            <button
              onClick={() => setShowHelp(true)}
              aria-label="말랑 클래스가 뭔지 보기"
              className={PRESS}
              style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${C.line}`, background: "transparent", color: C.sub, fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ?
            </button>
          </div>
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>말랑 클래스</div>
          <div style={{ width: 30 }} />
        </div>

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

        {/* 소개 카루셀 — 좌우로 넘겨보는 4가지 카테고리 */}
        <div style={{ padding: "18px 20px 0" }}>
          <CategoryCarousel t={t} />
        </div>

        {/* 필터 칩 — 골드 톤 가로 스크롤 */}
        <FilterChips filter={filter} setFilter={setFilter} />

        {/* 반 목록 */}
        <div style={{ padding: "18px 20px 0" }}>
          <h3 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>지금 모으는 반</h3>
          <p style={{ fontSize: 13, color: C.sub, marginBottom: 16, fontWeight: 500 }}>스무 명이 다 모이면 다섯 명씩 말랑방 네 개로 나뉘어요</p>

          {rooms.length === 0 ? (
            <p style={{ fontSize: 13, color: C.mute, textAlign: "center", padding: "30px 0" }}>조건에 맞는 반이 아직 없어요.</p>
          ) : (
            rooms.map(r => <RoomCard key={r.id} room={r} t={t} />)
          )}
        </div>
      </div>

      {showHelp && <HelpPopup onClose={() => setShowHelp(false)} />}
    </div>
  );
}

// ── 소개 카루셀 ──
function CategoryCarousel({ t }) {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="mc-hide-scrollbar"
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {CATEGORY_SLIDES.map((s) => (
          <div key={s.key} style={{ flex: "0 0 100%", scrollSnapAlign: "start", padding: "0 2px" }}>
            <CategorySlideCard slide={s} t={t} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "10px 0 0" }}>
        {CATEGORY_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`${i + 1}번째 소개`}
            style={{ width: active === i ? 20 : 7, height: 7, borderRadius: 99, border: "none", padding: 0, background: active === i ? t.accent : t.accentSoft, cursor: "pointer", transition: "width .2s, background .2s" }}
          />
        ))}
      </div>
      <style>{`.mc-hide-scrollbar::-webkit-scrollbar{display:none}.mc-hide-scrollbar{scrollbar-width:none}`}</style>
    </div>
  );
}

function CategorySlideCard({ slide, t }) {
  return (
    <div style={{ background: C.yellow, border: `1px solid ${C.yellowLine}`, borderRadius: 20, padding: "24px 20px", minHeight: 188, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 12 }}>
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
          return (
            <div key={id} style={{ width: 50, height: 50, borderRadius: "50%", background: "#fff", border: `2px solid ${C.yellow}`, marginLeft: i === 0 ? 0 : -14, boxShadow: "0 2px 6px rgba(28,26,23,0.1)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: SAMPLE_TYPES.length - i, flexShrink: 0 }}>
              {c && <img src={c.image} alt="" style={{ width: "80%", height: "80%", objectFit: "contain" }} />}
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
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke={t.accentDeep} strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3" stroke={t.accentDeep} strokeWidth="1.8" />
          <line x1="3" y1="21" x2="21" y2="3" stroke={t.accentDeep} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  // mat
  return (
    <div style={{ width: 60, height: 60, borderRadius: 16, background: t.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="10" rx="3" stroke={t.accentDeep} strokeWidth="1.8" />
        <line x1="9" y1="7" x2="9" y2="17" stroke={t.accentDeep} strokeWidth="1.8" />
      </svg>
    </div>
  );
}

// ── 필터 칩: 골드 톤 가로 스크롤(가장자리 페이드 + 진행바) ──
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
          const activeBg = minor ? C.yellow : GOLD;
          const activeText = minor ? "#8A6A2E" : "#fff";
          const activeBorder = minor ? C.yellowLine : "transparent";
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={PRESS}
              style={{
                whiteSpace: "nowrap", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, padding: "10px 16px", borderRadius: 999, flexShrink: 0,
                border: `1.5px solid ${on ? activeBorder : C.line}`, cursor: "pointer",
                background: on ? activeBg : "#fff",
                color: on ? activeText : C.sub,
              }}
            >
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
        return (
          <div key={b.type} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", border: `1px solid ${C.yellowLine}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {char ? <img src={char.image} alt={b.type} style={{ width: "82%", height: "82%", objectFit: "contain" }} /> : <span style={{ fontSize: 10 }}>{b.type}</span>}
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: t.accentDeep }}>{b.count}명</span>
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

function Badge({ status, t }) {
  if (status !== "open") return <span style={{ ...badgePill, background: C.mute }}>준비 중</span>;
  return <span style={{ ...badgePill, background: t.accent }}>모집 중</span>;
}
const badgePill = { position: "absolute", top: 14, right: 14, fontSize: 11, fontWeight: 800, color: "#fff", padding: "4px 10px", borderRadius: 8 };

function RoomCard({ room, t }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ position: "relative", background: C.yellow, border: `1px solid ${C.yellowLine}`, borderRadius: 18, padding: "24px 16px 20px" }}>
        <Badge status={room.status} t={t} />
        <Crowd breakdown={room.typeBreakdown} t={t} />
        <Gauge taken={room.taken} cap={room.cap} status={room.status} t={t} />
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 17, fontWeight: 800 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: t.accentDeep, background: t.accentSoft, padding: "3px 9px", borderRadius: 7 }}>{room.type}</span>
          <span style={room.status !== "open" ? { color: C.mute } : undefined}>{room.part}</span>
        </div>
        <div style={{ fontSize: 13.5, color: room.status !== "open" ? C.mute : C.sub, marginTop: 4 }}>{room.desc}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: t.accentDeep, background: t.accentSoft, borderRadius: 999, padding: "7px 13px" }}>
            {room.status === "open" ? room.when : "다음 달"}
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: C.ink }}>5만 원 · 8회</span>
        </div>
      </div>
    </div>
  );
}

// ── '?' 도움말 팝업 — 말랑 클래스가 뭔지 짧게 다시 보기 ──
function HelpPopup({ onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(28,26,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 340, maxHeight: "80vh", overflowY: "auto", background: "#fff", borderRadius: 22, padding: "24px 22px 20px", position: "relative" }}>
        <button onClick={onClose} aria-label="닫기" style={{ position: "absolute", top: 12, right: 14, border: "none", background: "transparent", color: C.sub, fontSize: 16, cursor: "pointer", padding: 4 }}>✕</button>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>말랑 클래스가 뭔가요?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {CATEGORY_SLIDES.map((it) => (
            <div key={it.key} style={{ background: C.yellow, border: `1px solid ${C.yellowLine}`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 5 }}>{it.title}</div>
              <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{it.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: C.mute, lineHeight: 1.6, marginTop: 16 }}>
          진단·치료가 아닌 운동·습관 코칭이에요. 불편함이 계속된다면 전문가와 상담해 주세요.
        </p>
      </div>
    </div>
  );
}
