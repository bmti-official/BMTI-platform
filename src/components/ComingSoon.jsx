import { useEffect, useRef, useState } from "react";
import { getTypeAccent, GOLD, YELLOW, YELLOW_LINE } from "../lib/typeAccent";
import { supabase } from "../lib/supabaseClient";

// ─────────────────────────────────────────────
// 말랑 클래스 · 말랑방 '준비 중' 화면 — 관리자를 제외한 이용자에게 노출.
// "이렇게 준비 중입니다!" + 어떤 식으로 만드는지 좌우로 넘기는 카루셀 + 바라는 점 입력칸.
// 색상 규칙: 배경 화이트 / 문구 검정 / 핵심 버튼 골드 / 박스 연옐로우 / 강조 유형별.
// ─────────────────────────────────────────────

const INK = "#1C1A17", SUB = "#8A8378", MUTE = "#B7B2A9", LINE = "#EDE9E2";

const CONTENT = {
  class: {
    heading: "말랑 클래스,\n이렇게 준비 중입니다!",
    tagline: "비슷한 몸·성향끼리 모여 4주간 함께 몸을 챙기는 그룹 수업을 만들고 있어요.",
    slides: [
      { icon: "group", title: "같은 유형끼리 다섯 명 반 편성", desc: "비슷한 몸과 성향끼리 묶어, 눈치 보지 않아도 되는 편안한 반을 만들고 있어요." },
      { icon: "calendar", title: "부위별 4주 커리큘럼", desc: "목·어깨, 허리·골반처럼 자주 불편한 부위별로 4주 프로그램을 짜고 있어요." },
      { icon: "coach", title: "전문 강사와 동작 검수", desc: "각 반을 이끌 강사님들과 동작 하나하나를 함께 다듬고 있어요." },
      { icon: "refund", title: "부담 없는 참가비·환불 정책", desc: "가볍게 시작하고 언제든 빠질 수 있도록 합리적인 정책을 준비하고 있어요." },
    ],
    inputLabel: "어떤 걸 배우고 싶으세요?",
    inputPlaceholder: "예: 거북목 교정, 자세 습관 잡기, 집에서 하는 스트레칭…",
    storageKey: "bmti_wish_class",
  },
  room: {
    heading: "말랑방,\n이렇게 준비 중입니다!",
    tagline: "같은 반 다섯 명이 수업 없는 날에도 가볍게 안부를 나누는 공간을 만들고 있어요.",
    slides: [
      { icon: "chat", title: "같은 반 다섯 명의 작은 방", desc: "스무 명이 다 모이면 다섯 명씩, 조용하고 아늑한 방으로 나뉘어요." },
      { icon: "mood", title: "오늘의 말랑이 하나면 충분", desc: "긴 말 없이 오늘 몸이 어땠는지만 툭 남겨도 되는 방식을 준비 중이에요." },
      { icon: "shield", title: "결제와 분리된 닉네임 참여", desc: "결제 정보와 완전히 분리된 닉네임으로만 참여하도록 설계하고 있어요." },
      { icon: "infinity", title: "4주 뒤에도 닫지 않아요", desc: "수업이 끝나도 말랑방은 계속 이어지도록 만들고 있어요." },
    ],
    inputLabel: "어떤 소통을 나누고 싶으세요?",
    inputPlaceholder: "예: 오늘 몸 상태 공유, 스트레칭 인증, 소소한 응원 주고받기…",
    storageKey: "bmti_wish_room",
  },
};

function SlideIcon({ kind, t }) {
  const s = 30, sw = 1.8, col = t.accentDeep;
  const paths = {
    group: <><circle cx="8" cy="9" r="3" stroke={col} strokeWidth={sw} /><circle cx="16" cy="9" r="3" stroke={col} strokeWidth={sw} /><path d="M3 19c0-2.5 2.2-4 5-4s5 1.5 5 4M13 16c.8-.6 1.9-1 3-1 2.8 0 5 1.5 5 4" stroke={col} strokeWidth={sw} strokeLinecap="round" fill="none" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15" rx="3" stroke={col} strokeWidth={sw} /><path d="M3.5 9.5h17" stroke={col} strokeWidth={sw} /><path d="M8 3v3.4M16 3v3.4" stroke={col} strokeWidth={sw} strokeLinecap="round" /></>,
    coach: <><circle cx="12" cy="7" r="3.2" stroke={col} strokeWidth={sw} /><path d="M5.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6" stroke={col} strokeWidth={sw} strokeLinecap="round" fill="none" /><path d="M12 10.2v3.8" stroke={col} strokeWidth={sw} strokeLinecap="round" /></>,
    refund: <><path d="M12 21a9 9 0 1 0-8.5-6" stroke={col} strokeWidth={sw} strokeLinecap="round" fill="none" /><path d="M3 9v4h4" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" /><path d="M12 8v4l2.5 1.5" stroke={col} strokeWidth={sw} strokeLinecap="round" fill="none" /></>,
    chat: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-4 4v-4H6.5" stroke={col} strokeWidth={sw} strokeLinejoin="round" fill="none" /><path d="M8.5 10h7M8.5 12.6h4.5" stroke={col} strokeWidth={sw} strokeLinecap="round" /></>,
    mood: <><circle cx="12" cy="12" r="8.5" stroke={col} strokeWidth={sw} /><circle cx="9" cy="10.6" r="1.1" fill={col} /><circle cx="15" cy="10.6" r="1.1" fill={col} /><path d="M8.6 14.4c1 1.2 5.8 1.2 6.8 0" stroke={col} strokeWidth={sw} strokeLinecap="round" fill="none" /></>,
    shield: <><path d="M12 3l7 2.5v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V5.5L12 3Z" stroke={col} strokeWidth={sw} strokeLinejoin="round" fill="none" /><path d="M9.2 12l2 2 3.6-3.8" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" /></>,
    infinity: <path d="M8 12c0-1.7-1.3-3-3-3S2 10.3 2 12s1.3 3 3 3 3-1.3 4-3 2.3-3 4-3 3 1.3 3 3-1.3 3-3 3-3-1.3-4-3" stroke={col} strokeWidth={sw} strokeLinecap="round" fill="none" />,
  };
  return (
    <span style={{ width: 58, height: 58, borderRadius: 18, background: t.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">{paths[kind]}</svg>
    </span>
  );
}

// 좌/우 3분할 클릭 · 드래그 스냅 · 4초 자동전환 (말랑 클래스 카루셀과 동일 제스처)
function PrepCarousel({ slides, t }) {
  const N = slides.length;
  const [active, setActive] = useState(0);
  const [dragX, setDragX] = useState(0);
  const dragging = useRef(false), startX = useRef(0), moved = useRef(0), box = useRef(null);
  const go = (d) => setActive((a) => (a + d + N) % N);

  useEffect(() => {
    const id = setInterval(() => { if (!dragging.current) setActive((a) => (a + 1) % N); }, 4000);
    return () => clearInterval(id);
  }, [N]);

  const down = (e) => { dragging.current = true; startX.current = e.clientX; moved.current = 0; };
  const move = (e) => { if (!dragging.current) return; const dx = e.clientX - startX.current; moved.current = dx; setDragX(dx); };
  const up = (e) => {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = moved.current, w = box.current ? box.current.clientWidth : 1;
    setDragX(0);
    if (Math.abs(dx) < 6) {
      const r = box.current.getBoundingClientRect(), x = e.clientX - r.left;
      if (x < r.width / 3) go(-1); else if (x > (r.width * 2) / 3) go(1);
    } else if (Math.abs(dx) > w * 0.16) { go(dx < 0 ? 1 : -1); }
  };

  return (
    <div>
      <div ref={box} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
        style={{ overflow: "hidden", position: "relative", touchAction: "pan-y", cursor: "grab", userSelect: "none" }}>
        <div style={{ display: "flex", transform: `translateX(calc(${-active * 100}% + ${dragX}px))`, transition: dragging.current ? "none" : "transform .35s cubic-bezier(.22,.9,.32,1)" }}>
          {slides.map((s, i) => (
            <div key={i} style={{ flex: "0 0 100%" }}>
              <div style={{ background: YELLOW, border: `1px solid ${YELLOW_LINE}`, borderRadius: 20, padding: "26px 22px", minHeight: 190, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 14, pointerEvents: "none" }}>
                <SlideIcon kind={s.icon} t={t} />
                <div>
                  <div style={{ display: "inline-block", fontSize: 11, fontWeight: 800, color: t.accentDeep, background: "#fff", padding: "3px 10px", borderRadius: 999, marginBottom: 8 }}>준비 {i + 1} / {N}</div>
                  <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: "-0.01em" }}>{s.title}</div>
                  <p style={{ fontSize: 12.5, color: SUB, marginTop: 6, lineHeight: 1.6, maxWidth: 270 }}>{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "12px 0 0" }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} aria-label={`${i + 1}번째 준비 내용`}
            style={{ width: active === i ? 20 : 7, height: 7, borderRadius: 99, border: "none", padding: 0, background: active === i ? t.accent : t.accentSoft, cursor: "pointer", transition: "width .2s, background .2s" }} />
        ))}
      </div>
    </div>
  );
}

export default function ComingSoon({ kind = "class", bmtiCode, userProfile }) {
  const t = getTypeAccent(bmtiCode);
  const c = CONTENT[kind];
  const [text, setText] = useState("");
  const [sent, setSent] = useState(() => !!localStorage.getItem(c.storageKey));

  const submit = () => {
    const content = text.trim();
    if (!content) return;
    // 서버에 남길 수 있으면 남기고(fire-and-forget), 안 되더라도 화면은 고맙다고 응답한다.
    try {
      supabase.from("service_wishes").insert({
        kind,
        user_id: userProfile?.id ?? null,
        nickname: userProfile?.nickname ?? null,
        bmti_code: bmtiCode ?? null,
        content,
      }).then(({ error }) => { if (error) console.warn("바라는 점 저장 보류(테이블 준비 전일 수 있어요)", error.message); });
    } catch (e) { /* 무시 — 아래에서 로컬로 갈무리 */ }
    // 로컬에도 보관해 두어, 다시 들어와도 남긴 걸 기억한다.
    try {
      const key = c.storageKey;
      const prev = JSON.parse(localStorage.getItem(key + "_log") || "[]");
      prev.push({ content, at: new Date().toISOString() });
      localStorage.setItem(key + "_log", JSON.stringify(prev));
      localStorage.setItem(key, "1");
    } catch {}
    setSent(true);
    setText("");
  };

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "8px 22px 8px", fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      {/* 준비 중 배지 + 헤딩 */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 800, color: t.accentDeep, background: t.accentSoft, padding: "7px 14px", borderRadius: 999 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.accent, display: "inline-block" }} />
          준비 중
        </span>
      </div>
      <h1 style={{ fontSize: "clamp(24px,6.5vw,30px)", fontWeight: 800, lineHeight: 1.32, letterSpacing: "-0.02em", textAlign: "center", margin: 0, whiteSpace: "pre-line" }}>{c.heading}</h1>
      <p style={{ fontSize: 14, color: SUB, lineHeight: 1.7, textAlign: "center", margin: "12px auto 0", maxWidth: 330 }}>{c.tagline}</p>

      {/* 어떤 식으로 준비 중인지 — 좌우 카루셀 */}
      <div style={{ marginTop: 22 }}>
        <PrepCarousel slides={c.slides} t={t} />
      </div>

      {/* 바라는 점 입력 */}
      <div style={{ marginTop: 26, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 20, padding: "18px 18px 20px", boxShadow: "0 1px 2px rgba(28,26,23,0.03), 0 8px 20px rgba(28,26,23,0.05)" }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "8px 4px" }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>💌</div>
            <div style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 6 }}>잘 전달됐어요, 고마워요!</div>
            <p style={{ fontSize: 12.5, color: SUB, lineHeight: 1.6, margin: "0 0 14px" }}>남겨주신 이야기를 참고해서 더 잘 준비할게요.</p>
            <button onClick={() => setSent(false)} style={{ border: "none", background: "transparent", color: t.accentDeep, fontSize: 12.5, fontWeight: 800, cursor: "pointer", padding: 4 }}>다른 의견도 남기기</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{c.inputLabel}</div>
            <p style={{ fontSize: 12, color: SUB, margin: "0 0 12px", lineHeight: 1.55 }}>남겨주시면 준비하는 데 큰 힘이 돼요. 오픈하면 가장 먼저 알려드릴게요.</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 300))}
              placeholder={c.inputPlaceholder}
              rows={3}
              style={{ width: "100%", resize: "none", padding: "13px 14px", borderRadius: 14, border: `1px solid ${LINE}`, fontSize: 14, lineHeight: 1.55, outline: "none", fontFamily: "inherit", boxSizing: "border-box", color: INK }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 11, color: MUTE, fontWeight: 700, margin: "6px 2px 12px" }}>{text.length}/300</div>
            <button
              onClick={submit}
              disabled={!text.trim()}
              style={{ width: "100%", padding: "15px 0", borderRadius: 14, border: "none", background: text.trim() ? GOLD : "#E7E2D8", color: text.trim() ? "#fff" : "#B7B2A9", fontSize: 15, fontWeight: 800, cursor: text.trim() ? "pointer" : "default", fontFamily: "inherit", transition: "background .2s" }}
            >
              의견 남기기
            </button>
          </>
        )}
      </div>

      <p style={{ fontSize: 11, color: MUTE, lineHeight: 1.7, textAlign: "center", marginTop: 16 }}>
        남겨주신 의견은 서비스 준비 목적으로만 소중히 활용돼요.
      </p>
    </div>
  );
}
