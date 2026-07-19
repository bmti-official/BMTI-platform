import { useState } from "react";
import { Mallang } from "./Mallang";

// ============================================
// 말랑 클래스 — 같은 BMTI 유형·같은 부위가 뻐근한 사람들끼리 모이는
// 4주 온라인 그룹 클래스 목록 화면. 상단 탭(모집 중/준비 중/내 클래스) +
// 대표 반 배너 + 필터 칩 + 반 카드 목록 구조.
//
// 색상 규칙(말랑 클래스 전용 팔레트, 라이브 탭과 톤 맞춤) — 이 페이지 안에서만 쓴다.
//   버튼 중 중요한 것(탭 선택 표시, '내 유형' 필터)   → 골든 팜(GOLDEN_PALM)
//   버튼 중 안 중요한 것(부위·평일/주말 필터)         → 연한 옐로우(YELLOW)
//   박스/카드(배너, 반 카드 미리보기)                 → 연한 옐로우(YELLOW, 그라데이션 없음)
//   강조 요소(유형·일정 태그, 인원수, 게이지, 배지)     → 딥 퍼플(DEEP_PURPLE)
// ============================================

const C = {
  bg: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2", mute: "#C9C4B8",
  goldenPalm: "#9C7C3D",
  yellow: "#FDF6DC", yellowLine: "#F0E4B8",
  deepPurple: "#4B2E83", deepPurpleSoft: "#E4DBF3",
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

// 중요도가 낮은(단순 분류용) 필터 칩 id 목록 — 활성 시 골든 팜 대신 연한 옐로우를 쓴다.
const MINOR_CHIP_IDS = ["neck", "waist", "weekday", "weekend"];

const CHIPS = [
  { id: "my", label: "내 유형" },
  { id: "neck", label: "목 · 어깨" },
  { id: "waist", label: "허리 · 골반" },
  { id: "weekday", label: "평일반" },
  { id: "weekend", label: "주말반" },
];

export default function MallangClass({ onClose, bmtiCode, charImage, isLoggedIn, onRequireLogin }) {
  const [tab, setTab] = useState("open");
  const [filter, setFilter] = useState("neck");
  const [showHelp, setShowHelp] = useState(false);

  const myType = bmtiCode ? bmtiCode.split("-")[0] : "측정 전";

  const rooms = ROOMS.filter(r => (tab === "mine" ? r.mine : r.status === tab)).filter(r => {
    if (tab === "mine") return true;
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
    mine: { title: "내가 신청한 반", sub: "신청한 반은 여기서 다시 볼 수 있어요" },
  }[tab];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 30, background: C.bg, overflowY: "auto", fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "76px 0 96px" }}>

        {/* 앱바 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 10px" }}>
          <button
            onClick={() => setShowHelp(true)}
            aria-label="말랑 클래스가 뭔지 보기"
            className={PRESS}
            style={{ width: 30, height: 30, borderRadius: "50%", border: `1.5px solid ${C.line}`, background: "transparent", color: C.sub, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ?
          </button>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>말랑 클래스</div>
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
          <span style={{ display: "flex", alignItems: "center", gap: 6, background: C.deepPurpleSoft, borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 800, color: C.deepPurple, whiteSpace: "nowrap" }}>
            내 유형 {myType}
          </span>
        </div>

        {/* 상단 탭 */}
        <div style={{ display: "flex", gap: 24, padding: "10px 20px 0", borderBottom: `1px solid ${C.line}` }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 15.5, fontWeight: 700, color: tab === t.id ? C.ink : C.mute, padding: "13px 0", cursor: "pointer", position: "relative" }}
            >
              {t.label}
              {tab === t.id && <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 3, background: C.goldenPalm, borderRadius: 3 }} />}
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

        {/* 필터 칩 — 가로 스크롤 없이 필요하면 다음 줄로 줄바꿈 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, padding: "14px 20px 6px" }}>
          {CHIPS.map(c => {
            const on = filter === c.id;
            const minor = MINOR_CHIP_IDS.includes(c.id);
            const activeBg = minor ? C.yellow : C.goldenPalm;
            const activeText = minor ? "#8A6A2E" : "#fff";
            const activeBorder = minor ? C.yellowLine : "transparent";
            return (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={PRESS}
                style={{
                  whiteSpace: "nowrap", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, padding: "10px 16px", borderRadius: 999,
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

        {/* 섹션 + 반 목록 */}
        <div style={{ padding: "22px 20px 0" }}>
          <h3 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>{sectionCopy.title}</h3>
          <p style={{ fontSize: 13, color: C.sub, marginBottom: 16, fontWeight: 500 }}>{sectionCopy.sub}</p>

          {rooms.length === 0 ? (
            <p style={{ fontSize: 13, color: C.mute, textAlign: "center", padding: "30px 0" }}>
              {tab === "mine" ? "아직 신청한 반이 없어요." : "조건에 맞는 반이 아직 없어요."}
            </p>
          ) : (
            rooms.map(r => <RoomCard key={r.id} room={r} />)
          )}
        </div>
      </div>

      {showHelp && <HelpPopup onClose={() => setShowHelp(false)} />}
    </div>
  );
}

const dotOn = { width: 20, height: 7, borderRadius: 99, background: "#4B2E83" };
const dotOff = { width: 7, height: 7, borderRadius: "50%", background: "#E4DBF3" };

function Banner({ room }) {
  const left = room.cap - room.taken;
  return (
    <div style={{ borderRadius: 20, padding: 24, position: "relative", overflow: "hidden", minHeight: 176, display: "flex", flexDirection: "column", justifyContent: "center", background: C.yellow, border: `1px solid ${C.yellowLine}` }}>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: C.deepPurple, background: "#fff", alignSelf: "flex-start", padding: "5px 11px", borderRadius: 999, marginBottom: 12 }}>내 유형에 딱 맞아요</span>
      <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: C.ink, lineHeight: 1.3 }}>{room.part} 4주 클래스</h2>
      <p style={{ fontSize: 13.5, color: C.sub, marginTop: 8, fontWeight: 600, maxWidth: "62%" }}>나와 같은 곳이 뻐근한 스무 명이 모여요</p>
      <div style={{ display: "inline-flex", alignItems: "baseline", gap: 3, marginTop: 14 }}>
        <b style={{ fontSize: 26, fontWeight: 800, color: C.deepPurple }}>{room.taken}</b>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.sub }}>/ {room.cap}명 모였어요</span>
      </div>
      {left > 0 && left <= 3 && (
        <span style={{ position: "absolute", top: 14, right: 14, fontSize: 11, fontWeight: 800, color: "#fff", background: C.deepPurple, padding: "4px 10px", borderRadius: 8 }}>마감 임박</span>
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
          : <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", border: `2px dashed ${C.yellowLine}`, margin: "2px 0" }} />
      ))}
      {taken > show && <span style={{ alignSelf: "center", fontSize: 12.5, fontWeight: 800, color: C.deepPurple, marginLeft: 4 }}>+{taken - show}</span>}
    </div>
  );
}

function Gauge({ taken, cap, status }) {
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
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: C.deepPurple, transition: "width .3s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontSize: 12.5, fontWeight: 600, color: C.sub }}>
        <span><b style={{ color: C.deepPurple }}>{taken}</b> / {cap}명</span>
        <span>{KO_NUM[left]} 자리 남음</span>
      </div>
    </div>
  );
}

function Badge({ status }) {
  if (status !== "open") return <span style={{ ...badgePill, background: C.mute }}>준비 중</span>;
  return <span style={{ ...badgePill, background: C.deepPurple }}>모집 중</span>;
}
const badgePill = { position: "absolute", top: 14, right: 14, fontSize: 11, fontWeight: 800, color: "#fff", padding: "4px 10px", borderRadius: 8 };

function RoomCard({ room }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ position: "relative", background: C.yellow, border: `1px solid ${C.yellowLine}`, borderRadius: 18, padding: "24px 16px 20px" }}>
        <Badge status={room.status} />
        <Crowd taken={room.taken} cap={room.cap} />
        <Gauge taken={room.taken} cap={room.cap} status={room.status} />
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 17, fontWeight: 800 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: C.deepPurple, background: C.deepPurpleSoft, padding: "3px 9px", borderRadius: 7 }}>{room.type}</span>
          <span style={room.status !== "open" ? { color: C.mute } : undefined}>{room.part}</span>
        </div>
        <div style={{ fontSize: 13.5, color: room.status !== "open" ? C.mute : C.sub, marginTop: 4 }}>{room.desc}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.deepPurple, background: C.deepPurpleSoft, borderRadius: 999, padding: "7px 13px" }}>
            {room.status === "open" ? room.when : "다음 달"}
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: C.ink }}>5만 원 · 8회</span>
        </div>
      </div>
    </div>
  );
}

// ── '?' 도움말 팝업 — 말랑 클래스가 뭔지 짧게 설명 ──
function HelpPopup({ onClose }) {
  const items = [
    { t: "같은 사람들끼리 모여요", d: "같은 BMTI 유형과 뻐근한 부위가 겹치는 사람끼리 20명이 모이는 4주 온라인 클래스예요." },
    { t: "말랑방", d: "20명이 다 모이면 5명씩 말랑방 네 개로 나뉘어요. 수업이 없는 날에도 서로 오늘 어땠는지 가볍게 나눌 수 있어요." },
    { t: "얼굴 모드", d: "강사만 참가자를 보고, 참가자끼리는 서로 화면이 보이지 않아요. 부담 없이 참여하셔도 돼요." },
    { t: "준비물", d: "매트 한 장과 몸을 움직일 작은 공간이면 충분해요." },
  ];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(28,26,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 340, maxHeight: "80vh", overflowY: "auto", background: "#fff", borderRadius: 22, padding: "24px 22px 20px", position: "relative" }}>
        <button onClick={onClose} aria-label="닫기" style={{ position: "absolute", top: 12, right: 14, border: "none", background: "transparent", color: C.sub, fontSize: 16, cursor: "pointer", padding: 4 }}>✕</button>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>말랑 클래스가 뭔가요?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((it, i) => (
            <div key={i} style={{ background: C.yellow, border: `1px solid ${C.yellowLine}`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 5 }}>{it.t}</div>
              <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{it.d}</div>
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
