import { useState, useEffect, useCallback } from "react";
import { CHARACTERS } from "../data";
import { getTypeAccent } from "../lib/typeAccent";
import { supabase } from "../lib/supabaseClient";
import { curationTheme } from "../lib/curationMeta";
import CurationAdmin from "./CurationAdmin";

// ─────────────────────────────────────────────
// 큐레이션 — 관리자(닉네임 BMTI)가 등록한 콘텐츠를 DB(curation_content)에서 불러와 보여준다.
// 등록된 콘텐츠가 아직 없으면 브랜드 톤 '미리보기 샘플'을 대신 띄워 페이지가 비어보이지 않게 한다.
// 히어로 카드 → 구독 배너 → '지금 많이 보고 있어요'(조회 랭킹) → '새로 나온 콘텐츠'(피드).
// ─────────────────────────────────────────────

const INK = "#1C1A17", SUB = "#8A8378", MUTE = "#B7B2A9", LINE = "#EEEAE2";
const CARD_SHADOW = "0 1px 2px rgba(28,26,23,0.03), 0 8px 20px rgba(28,26,23,0.05)";

// 등록된 콘텐츠가 없을 때만 보여줄 미리보기 샘플
const SAMPLE_HERO = { sample: true, category: "회복·수면", title: "거북목 탈출 프로젝트\n하루 1분, 목이 편해지는 스트레칭" };
const SAMPLE_RANKED = [
  { sample: true, category: "자세교정", title: "굽은 등, 하루 3분이면 펴져요", author: "말랑 연구소", views: 2688 },
  { sample: true, category: "회복·수면", title: "잠들기 전 5분, 몸을 녹이는 이완 루틴", author: "말랑 연구소", views: 4045 },
  { sample: true, category: "스트레칭", title: "오래 앉는 당신을 위한 골반 이완법", author: "말랑 연구소", views: 1732 },
];
const SAMPLE_FEED = [
  { sample: true, category: "계절 관리", title: "여름 냉방병, 목·어깨부터 지켜요 🧊", author: "말랑 연구소", date: "2026-08-01", views: 317 },
  { sample: true, category: "아이템", title: "말랑이가 고른 이달의 회복 아이템 🎁", author: "말랑 연구소", date: "2026-07-30", views: 296 },
  { sample: true, category: "루틴", title: "아침을 깨우는 5분 활력 루틴 ☀️", author: "말랑 연구소", date: "2026-07-28", views: 277 },
  { sample: true, category: "마음챙김", title: "바쁜 하루, 1분 호흡 명상 🫧", author: "말랑 연구소", date: "2026-07-25", views: 264 },
];

const dateOf = (r) => (r.date || (r.created_at ? r.created_at.slice(0, 10) : ""));

function Chip({ children, t }) {
  return <span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 800, color: t.accentDeep, background: t.accentSoft, borderRadius: 999, padding: "5px 11px" }}>{children}</span>;
}
function Thumb({ cat, emoji, size, radius = 14 }) {
  const th = curationTheme(cat);
  return (
    <div style={{ width: size, height: size, flexShrink: 0, borderRadius: radius, background: th.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.42, boxShadow: "inset 0 -6px 14px rgba(0,0,0,0.06)" }}>
      <span style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.12))" }}>{emoji || th.emoji}</span>
    </div>
  );
}

export default function CurationView({ bmtiCode }) {
  const t = getTypeAccent(bmtiCode);
  const mascot = CHARACTERS.find(c => c.id === (bmtiCode ? bmtiCode.split("-")[0] : ""));
  const nickname = (() => { try { return JSON.parse(localStorage.getItem("bmti_user") || "null")?.nickname || null; } catch { return null; } })();
  const isAdmin = nickname === "BMTI";

  const [rows, setRows] = useState(null); // null = 로딩 전, [] = 등록 없음
  const [subscribed, setSubscribed] = useState(false);
  const [toast, setToast] = useState(null);
  const [reading, setReading] = useState(null); // 상세 보기 중인 콘텐츠
  const [showAdmin, setShowAdmin] = useState(false);
  const ping = (msg) => { setToast(msg); clearTimeout(window.__curToast); window.__curToast = setTimeout(() => setToast(null), 1600); };

  const fetchRows = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("curation_content")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows(data || []);
    } catch {
      setRows([]); // 테이블이 아직 없거나 오류 → 샘플로 대체
    }
  }, []);
  useEffect(() => { fetchRows(); }, [fetchRows]);

  const hasReal = Array.isArray(rows) && rows.length > 0;

  // 실제 데이터 우선, 없으면 샘플
  const heroReal = hasReal ? (rows.find(r => r.featured) || rows[0]) : null;
  const ranked = hasReal ? [...rows].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3) : SAMPLE_RANKED;
  const feed = hasReal
    ? (() => { const f = rows.filter(r => r.id !== heroReal?.id); return f.length ? f : rows; })()
    : SAMPLE_FEED;
  const hero = heroReal || SAMPLE_HERO;

  // 콘텐츠 열기 — 실제 콘텐츠는 상세 보기 + 조회수 +1, 샘플은 준비중 안내
  const openContent = (r) => {
    if (r.sample) { ping("콘텐츠는 준비 중이에요. 곧 만나요!"); return; }
    setReading(r);
    const next = (r.views || 0) + 1;
    setRows(prev => prev ? prev.map(x => x.id === r.id ? { ...x, views: next } : x) : prev);
    supabase.from("curation_content").update({ views: next }).eq("id", r.id).then(() => {});
  };

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "62px 18px 40px", fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      {/* 상태 배지 — 등록 콘텐츠가 없을 때만 '미리보기' 안내 */}
      {!hasReal && (
        <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 14px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 800, color: t.accentDeep, background: t.accentSoft, padding: "6px 13px", borderRadius: 999 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.accent }} />
            큐레이션 미리보기 · 곧 진짜 콘텐츠로 채워져요
          </span>
        </div>
      )}

      {/* 히어로 카드 */}
      <button onClick={() => openContent(hero)}
        style={{ width: "100%", border: "none", cursor: "pointer", padding: 0, borderRadius: 24, overflow: "hidden", position: "relative", display: "block", textAlign: "left", boxShadow: CARD_SHADOW }}>
        <div style={{ position: "relative", height: 260, background: `linear-gradient(150deg, ${t.accent} 0%, ${t.accentDeep} 100%)`, display: "flex", alignItems: "flex-end" }}>
          <div style={{ position: "absolute", top: -40, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
          <div style={{ position: "absolute", top: 40, left: -30, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
          {mascot && (
            <img src={mascot.image} alt="" className={mascot.imgClass || ""}
              style={{ position: "absolute", right: 6, bottom: 44, width: 150, height: 150, objectFit: "contain", filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.22))" }} />
          )}
          <div style={{ position: "relative", padding: "0 20px 22px", zIndex: 1 }}>
            <span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 800, color: "#fff", background: "rgba(255,255,255,0.24)", borderRadius: 999, padding: "5px 11px", marginBottom: 10 }}>이달의 추천</span>
            <h2 style={{ margin: 0, fontSize: 23, fontWeight: 900, lineHeight: 1.32, letterSpacing: "-0.02em", color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,0.18)", wordBreak: "keep-all", whiteSpace: "pre-line" }}>
              {hero.title}
            </h2>
          </div>
        </div>
      </button>

      {/* 구독 배너 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, background: t.accentSoft, borderRadius: 16, padding: "14px 16px" }}>
        <span style={{ fontSize: 18 }}>💌</span>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.4, wordBreak: "keep-all" }}>금요일마다 새로운 몸 관리 팁을 알려드려요!</span>
        <button onClick={() => { setSubscribed(s => !s); ping(subscribed ? "구독을 취소했어요" : "구독 완료! 금요일에 만나요 💌"); }}
          style={{ flexShrink: 0, border: "none", cursor: "pointer", borderRadius: 999, padding: "8px 14px", fontSize: 12.5, fontWeight: 800, fontFamily: "inherit", background: subscribed ? "#fff" : t.accentDeep, color: subscribed ? t.accentDeep : "#fff", boxShadow: subscribed ? `inset 0 0 0 1.5px ${t.accentDeep}` : "none" }}>
          {subscribed ? "구독 중" : "구독하기"}
        </button>
      </div>

      {/* 지금 많이 보고 있어요 */}
      <section style={{ marginTop: 26 }}>
        <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 14px" }}>🔥 지금 많이 보고 있어요</h3>
        <div style={{ background: "#FBFAF7", border: `1px solid ${LINE}`, borderRadius: 20, padding: "6px 14px" }}>
          {ranked.map((r, i) => (
            <button key={r.id ?? i} onClick={() => openContent(r)}
              style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 13, padding: "14px 0", borderTop: i ? `1px solid ${LINE}` : "none", textAlign: "left" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Thumb cat={r.category} emoji={r.emoji} size={70} />
                <span style={{ position: "absolute", top: -6, left: -6, width: 26, height: 26, borderRadius: "50%", background: INK, color: "#fff", fontSize: 13, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>{i + 1}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: 6 }}><Chip t={t}>{r.category}</Chip></div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, lineHeight: 1.35, wordBreak: "keep-all" }}>{r.title}</div>
                <div style={{ fontSize: 11.5, color: MUTE, fontWeight: 600, marginTop: 6 }}>by. {r.author} · 조회 {(r.views || 0).toLocaleString()}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 새로 나온 콘텐츠 */}
      <section style={{ marginTop: 28 }}>
        <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 14px" }}>✨ 새로 나온 콘텐츠</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {feed.map((a, i) => {
            const th = curationTheme(a.category);
            return (
              <button key={a.id ?? i} onClick={() => openContent(a)}
                style={{ width: "100%", border: `1px solid ${LINE}`, background: "#fff", cursor: "pointer", padding: 0, borderRadius: 20, overflow: "hidden", textAlign: "left", boxShadow: CARD_SHADOW }}>
                <div style={{ height: 168, background: th.grad, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <span style={{ fontSize: 62, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.14))" }}>{a.emoji || th.emoji}</span>
                </div>
                <div style={{ padding: "14px 16px 16px" }}>
                  <div style={{ marginBottom: 9 }}><Chip t={t}>{a.category}</Chip></div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: INK, lineHeight: 1.4, letterSpacing: "-0.01em", wordBreak: "keep-all" }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: MUTE, fontWeight: 600, marginTop: 10 }}>by. {a.author} · {dateOf(a)} · 조회 {(a.views || 0).toLocaleString()}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {!hasReal && (
        <p style={{ fontSize: 11.5, color: MUTE, textAlign: "center", lineHeight: 1.7, marginTop: 22 }}>
          지금 보이는 콘텐츠는 예시예요. 곧 회원님 몸 상태와 성향에 맞는 큐레이션으로 채워드릴게요.
        </p>
      )}

      {/* 관리자 전용 — 콘텐츠 관리 버튼 */}
      {isAdmin && (
        <button onClick={() => setShowAdmin(true)}
          style={{ position: "fixed", right: 16, bottom: 92, zIndex: 55, border: "none", borderRadius: 999, padding: "12px 18px", fontSize: 13.5, fontWeight: 900, fontFamily: "inherit", color: "#fff", background: t.accentDeep, boxShadow: "0 6px 20px rgba(107,91,181,0.4)", cursor: "pointer" }}>
          🛠 콘텐츠 관리
        </button>
      )}

      {showAdmin && (
        <CurationAdmin accent={t} onClose={() => setShowAdmin(false)} onChanged={fetchRows} />
      )}

      {/* 콘텐츠 상세 보기 */}
      {reading && (() => {
        const th = curationTheme(reading.category);
        return (
          <div onClick={() => setReading(null)} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(28,26,23,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "90vh", background: "#fff", borderRadius: "24px 24px 0 0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ height: 180, background: th.grad, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
                <span style={{ fontSize: 68, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.14))" }}>{reading.emoji || th.emoji}</span>
                <button onClick={() => setReading(null)} style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.9)", color: SUB, fontSize: 16, cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ overflowY: "auto", padding: "18px 20px 28px" }}>
                <div style={{ marginBottom: 10 }}><Chip t={t}>{reading.category}</Chip></div>
                <h2 style={{ margin: "0 0 8px", fontSize: 21, fontWeight: 900, lineHeight: 1.35, letterSpacing: "-0.02em", wordBreak: "keep-all" }}>{reading.title}</h2>
                <div style={{ fontSize: 12, color: MUTE, fontWeight: 600, marginBottom: 18 }}>by. {reading.author} · {dateOf(reading)} · 조회 {(reading.views || 0).toLocaleString()}</div>
                {reading.body ? (
                  <p style={{ fontSize: 15, color: "#33302B", lineHeight: 1.75, whiteSpace: "pre-line", wordBreak: "keep-all", margin: 0 }}>{reading.body}</p>
                ) : (
                  <p style={{ fontSize: 14, color: SUB, lineHeight: 1.7, margin: 0 }}>본문이 아직 없어요.</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 토스트 */}
      {toast && (
        <div style={{ position: "fixed", left: "50%", bottom: 96, transform: "translateX(-50%)", zIndex: 85, background: "rgba(28,26,23,0.9)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "11px 18px", borderRadius: 999, boxShadow: "0 6px 20px rgba(0,0,0,0.25)", whiteSpace: "nowrap", animation: "curToastUp .25s ease-out" }}>
          {toast}
        </div>
      )}
      <style>{`@keyframes curToastUp{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
    </div>
  );
}
