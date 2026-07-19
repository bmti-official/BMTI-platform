import { useState } from "react";
import { Mallang } from "./Mallang";

// ============================================
// 말랑 클래스 — 같은 BMTI 유형·같은 부위가 뻐근한 사람들끼리 모이는
// 4주 온라인 그룹 클래스 목록 화면. 상단 탭(모집 중/준비 중/내 클래스) +
// 대표 반 배너 + 필터 칩 + 반 카드 목록 구조.
// 색감·톤은 사이트의 다른 "말랑" 계열 화면과 통일(세이지 그린 중심).
// ============================================

const C = {
  bg: "#FFFFFF", card: "#F8F9F7", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2",
  sage: "#5F8A76", sageSoft: "#E9F1EC", mute: "#C9C4B8",
  pink: "#FF6B9D", pinkSoft: "#FFEDF3",
  gold: "#C9975A", goldSoft: "#F3E7D2", goldInk: "#8A6A2E",
};
const PRESS = "active:scale-95 transition-transform";
const KO_NUM = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열", "열한", "열두"];

// 실제 예약 데이터가 아직 없어 데모 값을 쓴다.
const ROOMS = [
  { id: "neck_weekday", part: "목 · 어깨", type: "OM", when: "월·목 20:00", desc: "평일반 · 월·목 20:00 · 50분 8회", taken: 14, cap: 20, status: "open", mine: true },
  { id: "neck_weekend", part: "목 · 어깨", type: "OM", when: "토·일 10:00", desc: "주말반 · 토·일 10:00 · 50분 8회", taken: 8, cap: 20, status: "open" },
  { id: "neck_am", part: "목 · 어깨", type: "AM", when: "다음 달", desc: "움직이면서 푸는 반", taken: 0, cap: 20, status: "soon" },
  { id: "waist_om", part: "허리 · 골반", type: "OM", when: "다음 달", desc: "오래 앉거나 서 있는 분", taken: 0, cap: 20, status: "soon" },
];

const TABS = [
  { id: "open", label: "모집 중" },
  { id: "soon", label: "준비 중" },
  { id: "mine", label: "내 클래스" },
];

const CHIPS = [
  { id: "my", label: "내 유형", recommend: true },
  { id: "neck", label: "목 · 어깨" },
  { id: "waist", label: "허리 · 골반" },
  { id: "weekday", label: "평일반" },
  { id: "weekend", label: "주말반" },
];

export default function MallangClass({ onClose, bmtiCode }) {
  const [tab, setTab] = useState("open");
  const [filter, setFilter] = useState("neck");
  const [liked, setLiked] = useState(() => new Set(ROOMS.filter(r => r.mine).map(r => r.id)));

  const myType = bmtiCode ? bmtiCode.split("-")[0] : "측정 전";

  const toggleLike = (id) => setLiked(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const byTab = ROOMS.filter(r => (tab === "mine" ? liked.has(r.id) : r.status === tab));
  const rooms = tab === "mine" ? byTab : byTab.filter(r => {
    if (filter === "my") return r.type === "OM";
    if (filter === "neck") return r.part === "목 · 어깨";
    if (filter === "waist") return r.part === "허리 · 골반";
    if (filter === "weekday") return r.desc.includes("평일");
    if (filter === "weekend") return r.desc.includes("주말");
    return true;
  });

  const bannerRoom = ROOMS.find(r => r.status === "open" && r.type === "OM") || ROOMS[0];

  const sectionCopy = {
    open: { title: "지금 모으는 중", sub: "스무 명이 다 모이면 다섯 명씩 말랑방 네 개로 나뉘어요" },
    soon: { title: "곧 열리는 반", sub: "다음 달 시작 예정이에요. 열리면 알려드릴게요" },
    mine: { title: "내가 찜한 반", sub: "하트를 눌러두면 여기서 다시 볼 수 있어요" },
  }[tab];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 30, background: C.bg, overflowY: "auto", fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "76px 0 96px" }}>

        {/* 앱바 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 10px" }}>
          <button onClick={onClose} aria-label="닫기" className={PRESS} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, color: C.ink }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>말랑 클래스</div>
          <span style={{ display: "flex", alignItems: "center", gap: 6, background: C.sageSoft, borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 800, color: C.sage, whiteSpace: "nowrap" }}>
            내 유형 {myType}
          </span>
        </div>

        {/* 상단 탭 */}
        <div style={{ display: "flex", gap: 24, padding: "0 20px", borderBottom: `1px solid ${C.line}` }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 15.5, fontWeight: 700, color: tab === t.id ? C.ink : C.mute, padding: "13px 0", cursor: "pointer", position: "relative" }}
            >
              {t.label}
              {tab === t.id && <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 3, background: C.sage, borderRadius: 3 }} />}
            </button>
          ))}
        </div>

        {/* 배너 = 대표 반 */}
        <div style={{ padding: "16px 20px 0" }}>
          <Banner room={bannerRoom} />
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "14px 0 4px" }}>
          <i style={dotOn} /><i style={dotOff} /><i style={dotOff} />
        </div>

        {/* 필터 칩 */}
        <div style={{ display: "flex", gap: 9, padding: "14px 20px 6px", overflowX: "auto" }}>
          {CHIPS.map(c => {
            const on = filter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={PRESS}
                style={{
                  whiteSpace: "nowrap", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, padding: "10px 16px", borderRadius: 999,
                  border: on ? "1.5px solid transparent" : `1.5px solid ${C.line}`, cursor: "pointer", flexShrink: 0,
                  background: on ? (c.recommend ? C.gold : C.sage) : "#fff",
                  color: on ? "#fff" : (c.recommend ? C.goldInk : C.sub),
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* 섹션 + 반 목록 */}
        <div style={{ padding: "22px 20px 0" }}>
          <h3 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>{sectionCopy.title}</h3>
          <p style={{ fontSize: 13, color: C.sub, marginBottom: 16, fontWeight: 500 }}>{sectionCopy.sub}</p>

          {rooms.length === 0 ? (
            <p style={{ fontSize: 13, color: C.mute, textAlign: "center", padding: "30px 0" }}>
              {tab === "mine" ? "아직 찜한 반이 없어요. 하트를 눌러보세요." : "조건에 맞는 반이 아직 없어요."}
            </p>
          ) : (
            rooms.map(r => (
              <RoomCard key={r.id} room={r} liked={liked.has(r.id)} onToggleLike={() => toggleLike(r.id)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const dotOn = { width: 20, height: 7, borderRadius: 99, background: "#5F8A76" };
const dotOff = { width: 7, height: 7, borderRadius: "50%", background: "#E9F1EC" };

function Banner({ room }) {
  const left = room.cap - room.taken;
  return (
    <div style={{ borderRadius: 20, padding: 24, position: "relative", overflow: "hidden", minHeight: 176, display: "flex", flexDirection: "column", justifyContent: "center", background: "linear-gradient(135deg, #EFF6F1, #E1EEE5)" }}>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: C.sage, background: "#fff", alignSelf: "flex-start", padding: "5px 11px", borderRadius: 999, marginBottom: 12 }}>내 유형에 딱 맞아요</span>
      <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "#2C3B32", lineHeight: 1.3 }}>{room.part} 4주 클래스</h2>
      <p style={{ fontSize: 13.5, color: "#4E6459", marginTop: 8, fontWeight: 600, maxWidth: "62%" }}>나와 같은 곳이 뻐근한 스무 명이 모여요</p>
      <div style={{ display: "inline-flex", alignItems: "baseline", gap: 3, marginTop: 14 }}>
        <b style={{ fontSize: 26, fontWeight: 800, color: C.sage }}>{room.taken}</b>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#7C9686" }}>/ {room.cap}명 모였어요</span>
      </div>
      {left > 0 && left <= 3 && (
        <span style={{ position: "absolute", top: 14, right: 14, fontSize: 11, fontWeight: 800, color: "#fff", background: C.pink, padding: "4px 10px", borderRadius: 8 }}>마감 임박</span>
      )}
      <div style={{ position: "absolute", right: -8, bottom: -10 }}><Mallang v={5} size={132} /></div>
    </div>
  );
}

function Crowd({ taken, cap }) {
  const show = Math.min(cap, 10);
  const shown = Math.min(taken, show);
  const moods = [4, 5, 3, 4, 5, 3, 4, 5, 3, 4];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, justifyContent: "center", flexWrap: "wrap", minHeight: 44 }}>
      {Array.from({ length: show }).map((_, i) => (
        i < shown
          ? <Mallang key={i} v={moods[i]} size={30} />
          : <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", border: `2px dashed ${C.line}`, margin: "2px 0" }} />
      ))}
      {taken > show && <span style={{ alignSelf: "center", fontSize: 12.5, fontWeight: 800, color: C.sage, marginLeft: 4 }}>+{taken - show}</span>}
    </div>
  );
}

function Gauge({ taken, cap, status }) {
  const left = cap - taken;
  const almost = status === "open" && left <= 3 && left > 0;
  const pct = Math.round((taken / cap) * 100);
  if (status !== "open") {
    return (
      <div style={{ marginTop: 14 }}>
        <div style={{ height: 8, background: C.line, borderRadius: 999 }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontSize: 12.5, fontWeight: 600, color: C.mute }}>
          <span>곧 열려요</span><span>다음 달 예정</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ height: 8, background: C.line, borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: almost ? C.pink : C.sage, transition: "width .3s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontSize: 12.5, fontWeight: 600, color: C.sub }}>
        <span><b style={{ color: almost ? C.pink : C.sage }}>{taken}</b> / {cap}명</span>
        <span>{KO_NUM[left]} 자리 남음</span>
      </div>
    </div>
  );
}

function Badge({ status, almost }) {
  if (status !== "open") return <span style={{ ...badgePill, background: C.mute }}>준비 중</span>;
  if (almost) return <span style={{ ...badgePill, background: C.pink }}>마감 임박</span>;
  return <span style={{ ...badgePill, background: C.sage }}>모집 중</span>;
}
const badgePill = { position: "absolute", top: 14, right: 14, fontSize: 11, fontWeight: 800, color: "#fff", padding: "4px 10px", borderRadius: 8 };

function HeartIcon({ filled }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill={filled ? C.sage : "none"} stroke={filled ? C.sage : C.mute} strokeWidth="2">
      <path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.3 4 2.5.8-1.2 2-2.5 4-2.5 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z" strokeLinejoin="round" />
    </svg>
  );
}

function RoomCard({ room, liked, onToggleLike }) {
  const left = room.cap - room.taken;
  const almost = room.status === "open" && left <= 3 && left > 0;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ position: "relative", background: C.card, borderRadius: 18, padding: "24px 16px 20px" }}>
        <Badge status={room.status} almost={almost} />
        <Crowd taken={room.taken} cap={room.cap} />
        <Gauge taken={room.taken} cap={room.cap} status={room.status} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 14, gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 17, fontWeight: 800 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: C.sage, background: C.sageSoft, padding: "3px 9px", borderRadius: 7 }}>{room.type}</span>
            <span style={room.status !== "open" ? { color: C.mute } : undefined}>{room.part}</span>
          </div>
          <div style={{ fontSize: 13.5, color: room.status !== "open" ? C.mute : C.sub, marginTop: 4 }}>{room.desc}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.goldInk, background: C.goldSoft, borderRadius: 999, padding: "7px 13px" }}>
              {room.status === "open" ? room.when : "다음 달"}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: C.ink }}>5만 원 · 8회</span>
          </div>
        </div>
        <button onClick={onToggleLike} aria-label="찜하기" className={PRESS} style={{ border: "none", background: "transparent", cursor: "pointer", flexShrink: 0, padding: 4 }}>
          <HeartIcon filled={liked} />
        </button>
      </div>
    </div>
  );
}
