import { useState, useEffect, useCallback } from "react";
import { CHARACTERS } from "../data";
import { getTypeAccent } from "../lib/typeAccent";
import { supabase } from "../lib/supabaseClient";
import { curationTheme, CURATION_BODY_PARTS, toCurationType } from "../lib/curationMeta";
import CurationAdmin from "./CurationAdmin";

// ─────────────────────────────────────────────
// 큐레이션 — '최신순 피드'가 아니라 '내 몸에서 출발'하는 구조.
//   ① 어디가 불편해요? (부위 필터) → ② 내 유형이 많이 본 글 → ③ 꼭 알아두면 좋은 것(고정)
//   → ④ 이번 달 새 글(최신순, 맨 아래). 글이 자주 안 생겨도 '나를 위한 화면'으로 느껴지게.
//   한 글에 부위 × 유형 × 성격 태그를 달아, 부위로 들어와도·유형으로 들어와도 발견되게 한다.
// ─────────────────────────────────────────────

const INK = "#1C1A17", SUB = "#8A8378", MUTE = "#B7B2A9", LINE = "#EEEAE2";
const CARD_SHADOW = "0 1px 2px rgba(28,26,23,0.03), 0 8px 20px rgba(28,26,23,0.05)";
const ALL = "전체";

const arr = (x) => (Array.isArray(x) ? x : []);
const dateOf = (r) => (r.date || (r.created_at ? r.created_at.slice(0, 10) : ""));
const matchPart = (r, part) => part === ALL || arr(r.body_parts).includes(part);

// 등록된 콘텐츠가 없을 때 구조를 보여줄 미리보기 샘플 (부위·유형·성격 태그 포함)
const SAMPLE = [
  { sample: true, id: "s1", category: "자세교정", emoji: "🧍", title: "오래 앉는 사람이 꼭 알아둘 목·어깨 습관", author: "말랑 연구소", views: 2688, body_parts: ["목·어깨", "허리·골반"], bmti_types: ["OZ", "OM"], kind: "구별해주는 글", created_at: "2026-08-01" },
  { sample: true, id: "s2", category: "회복·수면", emoji: "🩺", title: "이 뻐근함, 병원 갈 일인가요?", author: "말랑 연구소", views: 4045, body_parts: ["목·어깨", "허리·골반", "무릎", "손목"], bmti_types: ["AZ", "AM", "OZ", "OM"], pinned: true, kind: "경계 알려주는 글", created_at: "2026-07-20" },
  { sample: true, id: "s3", category: "스트레칭", emoji: "🪑", title: "오래 앉는 당신을 위한 골반 이완법", author: "말랑 연구소", views: 1732, body_parts: ["허리·골반"], bmti_types: ["OM"], kind: "구별해주는 글", created_at: "2026-07-28" },
  { sample: true, id: "s4", category: "계절 관리", emoji: "🧊", title: "여름 냉방병, 목·어깨부터 지켜요", author: "말랑 연구소", views: 317, body_parts: ["목·어깨"], bmti_types: ["AZ", "OM"], created_at: "2026-08-03" },
  { sample: true, id: "s5", category: "마음챙김", emoji: "🖱️", title: "손목 통증, 마우스 습관부터 바꿔요", author: "말랑 연구소", views: 210, body_parts: ["손목"], bmti_types: ["AM", "OZ"], created_at: "2026-08-05" },
  { sample: true, id: "s6", category: "루틴", emoji: "🦵", title: "무릎이 시큰할 때 하루 3분 루틴", author: "말랑 연구소", views: 264, body_parts: ["무릎"], bmti_types: ["OM", "AM"], created_at: "2026-07-30" },
  { sample: true, id: "s7", category: "회복·수면", emoji: "⚖️", title: "병원 갈 통증 vs 생활습관 통증, 경계 긋기", author: "말랑 연구소", views: 1890, body_parts: ["목·어깨", "허리·골반", "무릎", "손목"], bmti_types: ["AZ", "AM", "OZ", "OM"], pinned: true, kind: "경계 알려주는 글", created_at: "2026-07-10" },
];

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

// 리스트형 글 행 (부위·유형·고정 섹션 공용)
function ArticleRow({ r, t, onOpen, rank, border }) {
  return (
    <button onClick={() => onOpen(r)}
      style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 13, padding: "13px 0", borderTop: border ? `1px solid ${LINE}` : "none", textAlign: "left" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <Thumb cat={r.category} emoji={r.emoji} size={64} />
        {rank != null && <span style={{ position: "absolute", top: -6, left: -6, width: 24, height: 24, borderRadius: "50%", background: INK, color: "#fff", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>{rank}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 5, display: "flex", gap: 5, flexWrap: "wrap" }}>
          <Chip t={t}>{r.category}</Chip>
          {r.kind && <span style={{ fontSize: 10.5, fontWeight: 800, color: SUB, background: "#F2EFEA", borderRadius: 999, padding: "4px 9px" }}>{r.kind}</span>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: INK, lineHeight: 1.35, wordBreak: "keep-all", textWrap: "pretty" }}>{r.title}</div>
        <div style={{ fontSize: 11, color: MUTE, fontWeight: 600, marginTop: 5 }}>by. {r.author} · 조회 {(r.views || 0).toLocaleString()}</div>
      </div>
    </button>
  );
}

export default function CurationView({ bmtiCode }) {
  const t = getTypeAccent(bmtiCode);
  const mascot = CHARACTERS.find(c => c.id === (bmtiCode ? bmtiCode.split("-")[0] : ""));
  const nickname = (() => { try { return JSON.parse(localStorage.getItem("bmti_user") || "null")?.nickname || null; } catch { return null; } })();
  const isAdmin = nickname === "BMTI";
  const myType = toCurationType(bmtiCode);

  const [rows, setRows] = useState(null); // null = 로딩 전, [] = 등록 없음
  const [part, setPart] = useState(ALL);
  const [subscribed, setSubscribed] = useState(false);
  const [toast, setToast] = useState(null);
  const [reading, setReading] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const ping = (msg) => { setToast(msg); clearTimeout(window.__curToast); window.__curToast = setTimeout(() => setToast(null), 1600); };

  const fetchRows = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("curation_content").select("*").eq("published", true)
        .order("sort_order", { ascending: true }).order("created_at", { ascending: false });
      if (error) throw error;
      setRows(data || []);
    } catch { setRows([]); }
  }, []);
  useEffect(() => { fetchRows(); }, [fetchRows]);

  const hasReal = Array.isArray(rows) && rows.length > 0;
  const pool = hasReal ? rows : SAMPLE;

  // 부위 필터 적용
  const inPart = pool.filter(r => matchPart(r, part));
  // ② 내 유형이 많이 본 글 — 유형 태그 우선, 없으면 조회순
  const typedTagged = inPart.filter(r => myType && arr(r.bmti_types).includes(myType));
  const typeList = [...(typedTagged.length ? typedTagged : inPart)].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
  const typePersonalized = typedTagged.length > 0;
  // ③ 꼭 알아두면 좋은 것 (고정)
  const pinned = inPart.filter(r => r.pinned || r.featured).slice(0, 4);
  // ④ 이번 달 새 글 (최신순)
  const fresh = [...inPart].sort((a, b) => dateOf(b).localeCompare(dateOf(a)));

  const openContent = (r) => {
    if (r.sample) { ping("콘텐츠는 준비 중이에요. 곧 만나요!"); return; }
    setReading(r);
    const next = (r.views || 0) + 1;
    setRows(prev => prev ? prev.map(x => x.id === r.id ? { ...x, views: next } : x) : prev);
    supabase.from("curation_content").update({ views: next }).eq("id", r.id).then(() => {});
  };

  const sectionTitle = { fontSize: 17, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 12px", wordBreak: "keep-all" };
  const listBox = { background: "#FBFAF7", border: `1px solid ${LINE}`, borderRadius: 20, padding: "4px 15px" };
  const emptyNote = (msg) => <div style={{ fontSize: 12.5, color: MUTE, fontWeight: 600, textAlign: "center", padding: "18px 8px", lineHeight: 1.6 }}>{msg}</div>;

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "58px 18px 40px", fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      {!hasReal && (
        <div style={{ display: "flex", justifyContent: "center", margin: "2px 0 14px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 800, color: t.accentDeep, background: t.accentSoft, padding: "6px 13px", borderRadius: 999 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.accent }} />
            큐레이션 미리보기 · 곧 진짜 콘텐츠로 채워져요
          </span>
        </div>
      )}

      {/* ① 내 몸에서 출발 — 어디가 불편해요? + 부위 칩 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        {mascot && <img src={mascot.image} alt="" className={mascot.imgClass || ""} style={{ width: 52, height: 52, objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.12))" }} />}
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.35, wordBreak: "keep-all", textWrap: "balance" }}>
          {nickname ? `${nickname}님, ` : ""}어디가 불편해요?
        </h2>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, margin: "0 -18px 24px", padding: "0 18px 4px", scrollbarWidth: "none" }}>
        {[ALL, ...CURATION_BODY_PARTS].map(p => {
          const on = part === p;
          return (
            <button key={p} onClick={() => setPart(p)}
              style={{ flexShrink: 0, border: on ? "none" : `1.5px solid ${LINE}`, cursor: "pointer", borderRadius: 999, padding: "9px 15px", fontSize: 13.5, fontWeight: 800, fontFamily: "inherit", background: on ? t.accentDeep : "#fff", color: on ? "#fff" : SUB, boxShadow: on ? `0 4px 12px ${t.accentSoft}` : "none" }}>
              {p}
            </button>
          );
        })}
      </div>

      {/* ② 내 유형이 많이 본 글 (BMTI 개인화) */}
      <section style={{ marginBottom: 26 }}>
        <h3 style={sectionTitle}>
          💜 {nickname ? `${nickname}님 ` : "내 "}유형{myType ? `(${myType})` : ""}{typePersonalized ? "이 많이 본 글" : " 추천 글"}
        </h3>
        <div style={listBox}>
          {typeList.length ? typeList.map((r, i) => <ArticleRow key={r.id ?? i} r={r} t={t} onOpen={openContent} rank={i + 1} border={i > 0} />)
            : emptyNote("이 부위의 글이 곧 추가돼요.")}
        </div>
        {!typePersonalized && typeList.length > 0 && (
          <p style={{ fontSize: 11, color: MUTE, fontWeight: 600, margin: "8px 2px 0" }}>아직 내 유형 전용 글이 적어, 많이 본 글로 보여드려요.</p>
        )}
      </section>

      {/* 구독 배너 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26, background: t.accentSoft, borderRadius: 16, padding: "14px 16px" }}>
        <span style={{ fontSize: 18 }}>💌</span>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.4, wordBreak: "keep-all" }}>금요일마다 새로운 몸 관리 팁을 알려드려요!</span>
        <button onClick={() => { setSubscribed(s => !s); ping(subscribed ? "구독을 취소했어요" : "구독 완료! 금요일에 만나요 💌"); }}
          style={{ flexShrink: 0, border: "none", cursor: "pointer", borderRadius: 999, padding: "8px 14px", fontSize: 12.5, fontWeight: 800, fontFamily: "inherit", background: subscribed ? "#fff" : t.accentDeep, color: subscribed ? t.accentDeep : "#fff", boxShadow: subscribed ? `inset 0 0 0 1.5px ${t.accentDeep}` : "none" }}>
          {subscribed ? "구독 중" : "구독하기"}
        </button>
      </div>

      {/* ③ 꼭 알아두면 좋은 것 (고정 필수글) */}
      {pinned.length > 0 && (
        <section style={{ marginBottom: 26 }}>
          <h3 style={sectionTitle}>📌 꼭 알아두면 좋은 것</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pinned.map((r, i) => (
              <button key={r.id ?? i} onClick={() => openContent(r)}
                style={{ width: "100%", textAlign: "left", cursor: "pointer", border: `1px solid ${t.accentSoft}`, background: "#fff", borderRadius: 16, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: CARD_SHADOW, borderLeft: `4px solid ${t.accent}` }}>
                <Thumb cat={r.category} emoji={r.emoji} size={48} radius={12} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {r.kind && <div style={{ fontSize: 10.5, fontWeight: 800, color: t.accentDeep, marginBottom: 3 }}>{r.kind}</div>}
                  <div style={{ fontSize: 14, fontWeight: 800, color: INK, lineHeight: 1.35, wordBreak: "keep-all", textWrap: "pretty" }}>{r.title}</div>
                </div>
                <span style={{ color: MUTE, fontSize: 18, flexShrink: 0 }}>›</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ④ 이번 달 새 글 (최신순 — 맨 아래) */}
      <section>
        <h3 style={sectionTitle}>🆕 이번 달 새 글</h3>
        {fresh.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {fresh.map((a, i) => {
              const th = curationTheme(a.category);
              return (
                <button key={a.id ?? i} onClick={() => openContent(a)}
                  style={{ width: "100%", border: `1px solid ${LINE}`, background: "#fff", cursor: "pointer", padding: 0, borderRadius: 20, overflow: "hidden", textAlign: "left", boxShadow: CARD_SHADOW }}>
                  <div style={{ height: 150, background: th.grad, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 58, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.14))" }}>{a.emoji || th.emoji}</span>
                  </div>
                  <div style={{ padding: "14px 16px 16px" }}>
                    <div style={{ marginBottom: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
                      <Chip t={t}>{a.category}</Chip>
                      {arr(a.body_parts).slice(0, 2).map(bp => <span key={bp} style={{ fontSize: 10.5, fontWeight: 800, color: SUB, background: "#F2EFEA", borderRadius: 999, padding: "4px 9px" }}>{bp}</span>)}
                    </div>
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: INK, lineHeight: 1.4, letterSpacing: "-0.01em", wordBreak: "keep-all", textWrap: "pretty" }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: MUTE, fontWeight: 600, marginTop: 10 }}>by. {a.author} · {dateOf(a)} · 조회 {(a.views || 0).toLocaleString()}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : emptyNote("이 부위의 새 글이 곧 올라와요.")}
      </section>

      {!hasReal && (
        <p style={{ fontSize: 11.5, color: MUTE, textAlign: "center", lineHeight: 1.7, marginTop: 22, wordBreak: "keep-all" }}>
          지금 보이는 콘텐츠는 예시예요. 곧 회원님 몸 상태와 성향에 맞는 큐레이션으로 채워드릴게요.
        </p>
      )}

      {isAdmin && (
        <button onClick={() => setShowAdmin(true)}
          style={{ position: "fixed", right: 16, bottom: 92, zIndex: 55, border: "none", borderRadius: 999, padding: "12px 18px", fontSize: 13.5, fontWeight: 900, fontFamily: "inherit", color: "#fff", background: t.accentDeep, boxShadow: "0 6px 20px rgba(107,91,181,0.4)", cursor: "pointer" }}>
          🛠 콘텐츠 관리
        </button>
      )}
      {showAdmin && <CurationAdmin accent={t} onClose={() => setShowAdmin(false)} onChanged={fetchRows} />}

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
                <div style={{ marginBottom: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Chip t={t}>{reading.category}</Chip>
                  {arr(reading.body_parts).map(bp => <span key={bp} style={{ fontSize: 11, fontWeight: 800, color: SUB, background: "#F2EFEA", borderRadius: 999, padding: "5px 10px" }}>{bp}</span>)}
                </div>
                <h2 style={{ margin: "0 0 8px", fontSize: 21, fontWeight: 900, lineHeight: 1.35, letterSpacing: "-0.02em", wordBreak: "keep-all", textWrap: "balance" }}>{reading.title}</h2>
                <div style={{ fontSize: 12, color: MUTE, fontWeight: 600, marginBottom: 18 }}>by. {reading.author} · {dateOf(reading)} · 조회 {(reading.views || 0).toLocaleString()}</div>
                {reading.body ? (
                  <p style={{ fontSize: 15, color: "#33302B", lineHeight: 1.75, whiteSpace: "pre-line", wordBreak: "keep-all", textWrap: "pretty", margin: 0 }}>{reading.body}</p>
                ) : (
                  <p style={{ fontSize: 14, color: SUB, lineHeight: 1.7, margin: 0 }}>본문이 아직 없어요.</p>
                )}
                <p style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.6, marginTop: 20, paddingTop: 12, borderTop: `1px solid ${LINE}` }}>✍️ 이 글은 AI의 도움을 받아 작성되었어요.</p>
              </div>
            </div>
          </div>
        );
      })()}

      {toast && (
        <div style={{ position: "fixed", left: "50%", bottom: 96, transform: "translateX(-50%)", zIndex: 85, background: "rgba(28,26,23,0.9)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "11px 18px", borderRadius: 999, boxShadow: "0 6px 20px rgba(0,0,0,0.25)", whiteSpace: "nowrap", animation: "curToastUp .25s ease-out" }}>
          {toast}
        </div>
      )}
      <style>{`@keyframes curToastUp{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
    </div>
  );
}
