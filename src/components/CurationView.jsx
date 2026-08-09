import { useState, useMemo, useEffect } from "react";
import { CHARACTERS } from "../data";
import { getTypeAccent } from "../lib/typeAccent";
import {
  CURATION_ARTICLES, CURATION_PARTS, partTheme, SORE_TO_PART,
  OUTRO_SAFETY, AUTHOR,
} from "../data/curationArticles";

// ─────────────────────────────────────────────
// 말랑 큐레이션 — '치료법'이 아니라 '판별력'을 파는 근골격계 큐레이션. (구현 지시서)
//   · 조작은 부위(6)+매체(글/영상)+말투(Z/M)뿐. A/O·C/L·D/Q는 조립에만 자동 관여.
//   · 목록은 몸축: 기록 > 유형 > 고정 > 최신.
//   · 글은 블록으로 저장되고, 유형에 따라 조립 렌더 + 관점/매체 전환.
//   · §6 카피 규칙·전문가 안내 상시 노출 준수.
// ─────────────────────────────────────────────

const INK = "#1C1A17", SUB = "#8A8378", MUTE = "#B7B2A9", LINE = "#EEEAE2";
const CARD_SHADOW = "0 1px 2px rgba(28,26,23,0.03), 0 8px 20px rgba(28,26,23,0.05)";

// BMTI 4글자 → 4축. pos0 A/O · pos1 C/L · pos2 D/Q · pos3 Z/M
const getAxes = (code) => {
  const c = (code ? String(code).split("-")[0] : "").toUpperCase();
  return { ao: c[0] === "A" ? "A" : "O", cl: c[1] === "C" ? "C" : "L", dq: c[2] === "Q" ? "Q" : "D", zm: c[3] === "Z" ? "Z" : "M" };
};
const titleOf = (a, mode) => (a.title && typeof a.title === "object" ? (a.title[mode] || a.title.M || a.title.Z) : a.title);
const AUDIENCE_LABEL = { common: "공통 추천", A: "A유형 추천", O: "O유형 추천" };

// 선택하면 알약이 옆으로 부드럽게 미끄러지는 세그먼트 토글.
function SlideToggle({ options, value, onChange, containerBg, pillBg, activeColor, inactiveColor, radius = 14, pad = 4, itemPad = "11px 0", fontSize = 13.5, style }) {
  const n = options.length;
  const idx = Math.max(0, options.findIndex(o => o.k === value));
  return (
    <div style={{ position: "relative", display: "flex", background: containerBg, borderRadius: radius, padding: pad, ...style }}>
      <div style={{ position: "absolute", top: pad, bottom: pad, left: pad, width: `calc((100% - ${pad * 2}px) / ${n})`, transform: `translateX(${idx * 100}%)`, background: pillBg, borderRadius: Math.max(6, radius - 3), boxShadow: "0 2px 8px rgba(0,0,0,0.12)", transition: "transform .3s cubic-bezier(.34,1.45,.5,1)" }} />
      {options.map(o => (
        <button key={o.k} onClick={() => onChange(o.k)}
          style={{ position: "relative", zIndex: 1, flex: 1, border: "none", background: "transparent", cursor: "pointer", padding: itemPad, fontSize, fontWeight: 800, fontFamily: "inherit", color: value === o.k ? activeColor : inactiveColor, whiteSpace: "nowrap", transition: "color .2s" }}>{o.label}</button>
      ))}
    </div>
  );
}

// 썸네일 — 사진(image)이 있으면 사진, 없으면 부위 색면 + 이모지. 크게.
function ArticleThumb({ a, size, radius = 16 }) {
  const th = partTheme(a.parts[0]);
  if (a.image) {
    return <img src={a.image} alt="" style={{ width: size, height: size, flexShrink: 0, borderRadius: radius, objectFit: "cover", boxShadow: "inset 0 -6px 14px rgba(0,0,0,0.05)" }} />;
  }
  return (
    <div style={{ width: size, height: size, flexShrink: 0, borderRadius: radius, background: th.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.44 }}>
      <span style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.1))" }}>{th.emoji}</span>
    </div>
  );
}

// 해시태그 — ① 핵심 부위(연한 보라) + 연관 부위(회색) ② 공통/유형 추천
function HashTags({ a, t, small }) {
  const fs = small ? 10.5 : 11.5;
  const core = a.parts[0];
  const related = a.parts.slice(1);
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
      <span style={{ fontSize: fs, fontWeight: 800, color: t.accentDeep, background: t.accentSoft, borderRadius: 999, padding: "4px 9px" }}>#{core}</span>
      {related.slice(0, 2).map(p => (
        <span key={p} style={{ fontSize: fs, fontWeight: 800, color: SUB, background: "#F2EFEA", borderRadius: 999, padding: "4px 9px" }}>#{p}</span>
      ))}
      {a.audience && (
        <span style={{ fontSize: fs, fontWeight: 800, color: a.audience === "common" ? SUB : t.accentDeep, background: a.audience === "common" ? "#F2EFEA" : t.accentSoft, borderRadius: 999, padding: "4px 9px" }}>
          #{AUDIENCE_LABEL[a.audience] || a.audience}
        </span>
      )}
    </div>
  );
}

// 리스트형 글 행 (기록·유형 섹션 공용) — 큰 썸네일 + 조회수
function Row({ a, t, mode, onOpen, rank, border }) {
  return (
    <button onClick={() => onOpen(a)}
      style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: border ? `1px solid ${LINE}` : "none", textAlign: "left" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <ArticleThumb a={a} size={78} />
        {rank != null && <span style={{ position: "absolute", top: -6, left: -6, width: 24, height: 24, borderRadius: "50%", background: INK, color: "#fff", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>{rank}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 6 }}><HashTags a={a} t={t} small /></div>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, lineHeight: 1.35, wordBreak: "keep-all", textWrap: "pretty" }}>{titleOf(a, mode)}</div>
        <div style={{ fontSize: 11.5, color: MUTE, fontWeight: 600, marginTop: 5 }}>조회 {(a.views || 0).toLocaleString()}</div>
      </div>
    </button>
  );
}

export default function CurationView({ bmtiCode, onGoDiary }) {
  const t = getTypeAccent(bmtiCode);
  const mascot = CHARACTERS.find(c => c.id === (bmtiCode ? bmtiCode.split("-")[0] : ""));
  const nickname = (() => { try { return JSON.parse(localStorage.getItem("bmti_user") || "null")?.nickname || null; } catch { return null; } })();
  const axes = getAxes(bmtiCode);

  const [part, setPart] = useState("전체");
  const [media, setMedia] = useState("article"); // 'article' | 'video'
  const [titleMode, setTitleMode] = useState(axes.zm); // 'Z' | 'M' — 제목 말투
  const [reading, setReading] = useState(null);
  const [typePage, setTypePage] = useState(0); // 유형 인기 페이지네이션(전체일 때 3개씩)
  useEffect(() => { setTypePage(0); }, [part, media]);

  // 기록 기반 — 이번 달 다이어리에서 가장 자주 적은 부위 (가장 강한 근거, §7.1)
  const record = useMemo(() => {
    try {
      const hist = JSON.parse(localStorage.getItem("bmti_diary_history") || "[]");
      const ym = new Date().toISOString().slice(0, 7);
      const cnt = {};
      hist.filter(e => e && typeof e.date === "string" && e.date.startsWith(ym))
        .forEach(e => (e.soreness || []).forEach(s => { const p = SORE_TO_PART[s.part]; if (p) cnt[p] = (cnt[p] || 0) + 1; }));
      const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
      return top ? { part: top[0], n: top[1] } : null;
    } catch { return null; }
  }, []);

  const mediaOk = (a) => media === "video" ? !!a.media?.video : !!a.media?.article;
  const partOk = (a) => part === "전체" || a.parts.includes(part);
  const pool = CURATION_ARTICLES.filter(a => mediaOk(a) && partOk(a));

  // 섹션 구성 (기록 > 유형 > 고정 > 최신).
  // 기록 박스는 '전체'일 때만. 유형 인기: 전체=3개씩 페이지 넘김 / 부위 선택 시 top3.
  const recordPart = record && part === "전체" ? record.part : null;
  const recordList = recordPart ? pool.filter(a => a.parts.includes(recordPart)).slice(0, 3) : [];
  const typeSorted = [...pool].sort((a, b) => (b.views || 0) - (a.views || 0));
  const TYPE_PAGE = 3;
  const typeAll = part === "전체" ? typeSorted.slice(0, 12) : typeSorted.slice(0, 3);
  const typePages = Math.max(1, Math.ceil(typeAll.length / TYPE_PAGE));
  const typePaged = part === "전체" ? typeAll.slice(typePage * TYPE_PAGE, typePage * TYPE_PAGE + TYPE_PAGE) : typeAll;
  const pinned = pool.filter(a => a.pinned);
  const fresh = [...pool].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const sectionTitle = { fontSize: 17, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 12px", wordBreak: "keep-all", color: INK };
  const listBox = { background: "#FCFBF9", border: `1px solid ${LINE}`, borderRadius: 20, padding: "4px 15px" };

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "58px 18px 44px", fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      {/* ① 어디가 불편해요? + 말투(Z/M) 토글 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        {mascot && <img src={mascot.image} alt="" className={mascot.imgClass || ""} style={{ width: 48, height: 48, objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.12))" }} />}
        <h2 style={{ flex: 1, margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.3, wordBreak: "keep-all", textWrap: "balance" }}>
          {nickname ? `${nickname}님, ` : ""}어디가 불편해요?
        </h2>
        {/* 제목 말투 Z/M 알약 — 부드럽게 미끄러짐 */}
        <SlideToggle
          options={[{ k: "Z", label: "Z" }, { k: "M", label: "M" }]}
          value={titleMode} onChange={setTitleMode}
          containerBg="#F2EFEA" pillBg={t.accentSoft} activeColor={t.accentDeep} inactiveColor={SUB}
          radius={999} pad={3} itemPad="6px 0" fontSize={13} style={{ flexShrink: 0, width: 66 }} />
      </div>

      {/* 부위 6칩 — 가로 스크롤 */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", margin: "0 -18px 14px", padding: "0 18px 4px", scrollbarWidth: "none" }}>
        {CURATION_PARTS.map(p => {
          const on = part === p;
          return (
            <button key={p} onClick={() => setPart(p)}
              style={{ flexShrink: 0, border: on ? `1.5px solid ${t.accentSoft}` : `1.5px solid ${LINE}`, cursor: "pointer", borderRadius: 999, padding: "9px 15px", fontSize: 13.5, fontWeight: 800, fontFamily: "inherit", whiteSpace: "nowrap", background: on ? t.accentSoft : "#fff", color: on ? t.accentDeep : SUB }}>{p}</button>
          );
        })}
      </div>

      {/* 매체 토글 — 연옐로우 배경 + 알약이 옆으로 미끄러짐 */}
      <div style={{ marginBottom: 24 }}>
        <SlideToggle
          options={[
            { k: "article", label: (<span><span style={{ fontSize: 15.5, fontWeight: 900 }}>Q</span> <span style={{ fontSize: 12.5, fontWeight: 700 }}>왜 아픈 걸까?</span></span>) },
            { k: "video", label: (<span><span style={{ fontSize: 15.5, fontWeight: 900 }}>D</span> <span style={{ fontSize: 12.5, fontWeight: 700 }}>당장 따라 해보자!</span></span>) },
          ]}
          value={media} onChange={setMedia}
          containerBg="#FBF3D6" pillBg="#fff" activeColor={INK} inactiveColor="#A8925A"
          radius={999} itemPad="9px 0" fontSize={13.5} />
      </div>

      {media === "video" && pool.length === 0 ? (
        <div style={{ background: "#FCFBF9", border: `1px solid ${LINE}`, borderRadius: 20, padding: "28px 18px", textAlign: "center", fontSize: 13, color: SUB, fontWeight: 600, lineHeight: 1.7 }}>
          영상은 곧 올라와요. 검수를 마친 영상만 골라서 담을게요.<br />지금은 <b style={{ color: t.accentDeep }}>글로 읽기</b>로 먼저 만나보세요.
        </div>
      ) : (
        <>
          {/* ② 기록에서 시작한 글 — 흰 배경 + 연한 옐로 그림자 */}
          {recordPart && recordList.length > 0 && (
            <section style={{ marginBottom: 26 }}>
              <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 20, padding: "16px 16px 6px", boxShadow: "0 2px 6px rgba(220,188,86,0.2), 0 12px 30px rgba(233,203,110,0.45)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 17 }}>💜</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: INK }}>{nickname ? `${nickname}님 ` : ""}기록에서 시작한 글</span>
                </div>
                <p style={{ fontSize: 12.5, color: t.accentDeep, fontWeight: 800, margin: "0 0 4px 25px" }}>이번 달 {recordPart}를 {record.n}번 적으셨어요.</p>
                <div>{recordList.map((a, i) => <Row key={a.id} a={a} t={t} mode={titleMode} onOpen={setReading} border={i > 0} />)}</div>
              </div>
            </section>
          )}

          {/* ③ 같은 유형이 많이 본 글/영상 — 전체는 3개씩 페이지 넘김 / 부위 선택 시 top3 */}
          <section style={{ marginBottom: 26 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              <h3 style={{ ...sectionTitle, margin: 0 }}>{axes.ao}{axes.cl} 유형인 분들이 많이 본 {media === "video" ? "영상" : "글"}</h3>
              {part === "전체" && typePages > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setTypePage(p => Math.max(0, p - 1))} disabled={typePage === 0} aria-label="이전"
                    style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${LINE}`, background: "#fff", color: typePage === 0 ? MUTE : INK, cursor: typePage === 0 ? "default" : "pointer", fontSize: 15, fontWeight: 900, lineHeight: 1 }}>‹</button>
                  <span style={{ fontSize: 12, fontWeight: 800, color: SUB, minWidth: 30, textAlign: "center" }}>{typePage + 1}/{typePages}</span>
                  <button onClick={() => setTypePage(p => Math.min(typePages - 1, p + 1))} disabled={typePage >= typePages - 1} aria-label="다음"
                    style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${LINE}`, background: "#fff", color: typePage >= typePages - 1 ? MUTE : INK, cursor: typePage >= typePages - 1 ? "default" : "pointer", fontSize: 15, fontWeight: 900, lineHeight: 1 }}>›</button>
                </div>
              )}
            </div>
            <div style={listBox}>
              {typePaged.length ? typePaged.map((a, i) => <Row key={a.id} a={a} t={t} mode={titleMode} onOpen={setReading} rank={typePage * TYPE_PAGE + i + 1} border={i > 0} />)
                : <div style={{ fontSize: 12.5, color: MUTE, fontWeight: 600, textAlign: "center", padding: "18px 8px" }}>이 부위의 글이 곧 추가돼요.</div>}
            </div>
          </section>

          {/* ④ 꼭 알아두면 좋은 것 (고정) */}
          {pinned.length > 0 && (
            <section style={{ marginBottom: 26 }}>
              <h3 style={sectionTitle}>📌 꼭 알아두면 좋은 것</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pinned.map(a => (
                  <button key={a.id} onClick={() => setReading(a)}
                    style={{ width: "100%", textAlign: "left", cursor: "pointer", border: `1px solid ${t.accentSoft}`, background: "#fff", borderRadius: 16, padding: "13px 14px", display: "flex", alignItems: "center", gap: 13, boxShadow: CARD_SHADOW, borderLeft: `4px solid ${t.accent}` }}>
                    <ArticleThumb a={a} size={58} radius={13} />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 800, color: INK, lineHeight: 1.35, wordBreak: "keep-all", textWrap: "pretty" }}>{titleOf(a, titleMode)}</div>
                    <span style={{ color: MUTE, fontSize: 18, flexShrink: 0 }}>›</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ⑤ 이번 달 새 글 (최신순 — 맨 아래) — 큰 썸네일 */}
          <section>
            <h3 style={sectionTitle}>🆕 이번 달 새 {media === "video" ? "영상" : "글"}</h3>
            {fresh.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {fresh.map(a => {
                  const th = partTheme(a.parts[0]);
                  return (
                    <button key={a.id} onClick={() => setReading(a)}
                      style={{ width: "100%", border: `1px solid ${LINE}`, background: "#fff", cursor: "pointer", padding: 0, borderRadius: 20, overflow: "hidden", textAlign: "left", boxShadow: CARD_SHADOW }}>
                      <div style={{ height: 190, background: th.grad, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {a.image ? <img src={a.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ fontSize: 72, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.12))" }}>{th.emoji}</span>}
                      </div>
                      <div style={{ padding: "14px 16px 16px" }}>
                        <div style={{ marginBottom: 8 }}><HashTags a={a} t={t} /></div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: INK, lineHeight: 1.4, letterSpacing: "-0.01em", wordBreak: "keep-all", textWrap: "pretty" }}>{titleOf(a, titleMode)}</div>
                        <div style={{ fontSize: 12, color: MUTE, fontWeight: 600, marginTop: 10 }}>{a.createdAt} · 조회 {(a.views || 0).toLocaleString()}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : <div style={{ fontSize: 12.5, color: MUTE, fontWeight: 600, textAlign: "center", padding: "18px 8px" }}>이 부위의 새 글이 곧 올라와요.</div>}
          </section>
        </>
      )}

      {reading && <ArticleReader article={reading} axes={axes} t={t} titleMode={titleMode} initialMedia={media} onClose={() => setReading(null)} onGoDiary={onGoDiary} />}
    </div>
  );
}

// ── 글 화면 — 유형별 블록 조립 + 관점(A/O·C/L) 토글 + 매체(글↔영상) 전환 ──
function ArticleReader({ article: a, axes, t, titleMode, initialMedia, onClose, onGoDiary }) {
  const [ao, setAo] = useState(axes.ao);
  const [cl, setCl] = useState(axes.cl);
  const [view, setView] = useState(initialMedia === "video" && a.media?.video ? "video" : "article");
  const dq = axes.dq, zm = axes.zm;
  const th = partTheme(a.parts[0]);
  const hasVideo = !!a.media?.video;

  const Block = ({ label, children }) => (
    <div style={{ marginTop: 20 }}>
      {label && <div style={{ fontSize: 11.5, fontWeight: 900, color: t.accentDeep, marginBottom: 7, letterSpacing: "0.02em" }}>{label}</div>}
      <p style={{ fontSize: 14.5, color: "#33302B", lineHeight: 1.78, margin: 0, whiteSpace: "pre-line", wordBreak: "keep-all", textWrap: "pretty" }}>{children}</p>
    </div>
  );
  const toggleBtn = (label, onClick) => (
    <button onClick={onClick}
      style={{ border: `1.5px solid ${t.accentSoft}`, background: t.accentSoft, color: t.accentDeep, cursor: "pointer", borderRadius: 999, padding: "8px 13px", fontSize: 12, fontWeight: 800, fontFamily: "inherit" }}>{label}</button>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(28,26,23,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "92vh", background: "#fff", borderRadius: "24px 24px 0 0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* 헤더 — 사진 or 색면 */}
        <div style={{ height: 200, background: th.grad, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0, overflow: "hidden" }}>
          {a.image ? <img src={a.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 72, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.12))" }}>{th.emoji}</span>}
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.9)", color: SUB, fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ overflowY: "auto", padding: "18px 20px 28px" }}>
          <div style={{ marginBottom: 10 }}><HashTags a={a} t={t} /></div>
          <h2 style={{ margin: "0 0 12px", fontSize: 21, fontWeight: 900, lineHeight: 1.35, letterSpacing: "-0.02em", wordBreak: "keep-all", textWrap: "balance" }}>{titleOf(a, titleMode)}</h2>

          {/* 매체 전환 (글 ↔ 영상) — 서로 연관된 같은 콘텐츠를 바로 오간다 */}
          <div style={{ display: "flex", background: "#F2EFEA", borderRadius: 12, padding: 3, marginBottom: 14 }}>
            {[["article", "📖 글"], ["video", "▶ 영상"]].map(([k, label]) => (
              <button key={k} onClick={() => setView(k)}
                style={{ flex: 1, border: "none", cursor: "pointer", borderRadius: 9, padding: "9px 0", fontSize: 12.5, fontWeight: 800, fontFamily: "inherit", background: view === k ? "#fff" : "transparent", color: view === k ? INK : SUB, boxShadow: view === k ? "0 2px 6px rgba(0,0,0,0.08)" : "none" }}>{label}</button>
            ))}
          </div>

          {view === "video" ? (
            hasVideo ? (
              <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 14, overflow: "hidden", background: "#000" }}>
                <iframe src={`https://www.youtube.com/embed/${a.media.video}`} title={titleOf(a, titleMode)} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
              </div>
            ) : (
              <div style={{ background: "#FCFBF9", border: `1px solid ${LINE}`, borderRadius: 14, padding: "26px 18px", textAlign: "center", fontSize: 13, color: SUB, fontWeight: 600, lineHeight: 1.7 }}>
                이 글의 영상은 검수 후 올라와요.<br /><b style={{ color: t.accentDeep }}>글로 읽기</b>로 먼저 보실 수 있어요.
              </div>
            )
          ) : (
            <>
              {/* 유형 배지 + 다른 관점으로 보기 */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7, paddingBottom: 14, borderBottom: `1px solid ${LINE}` }}>
                <span style={{ fontSize: 11.5, fontWeight: 900, color: "#fff", background: t.accentDeep, borderRadius: 999, padding: "5px 11px" }}>{ao}{cl}{dq}{zm}</span>
                {toggleBtn(ao === "O" ? "움직임 관점으로" : "차분한 관점으로", () => setAo(v => (v === "O" ? "A" : "O")))}
                {toggleBtn(cl === "C" ? "연결된 부위까지" : "이 부위만", () => setCl(v => (v === "C" ? "L" : "C")))}
              </div>

              {/* 블록 조립: intro[zm] → body → scope[cl] → deeper[dq] → action[ao] → mistakes → outro */}
              <Block>{a.intro[zm]}</Block>
              <Block>{a.body}</Block>
              <Block label="어디를 쓰는가">{a.scope[cl]}</Block>
              <Block label="조금 더 알아보기">{a.deeper[dq]}</Block>
              <Block label="해볼 만한 것">{a.action[ao]}</Block>

              {/* 흔히 하는 실수 */}
              <div style={{ marginTop: 22, background: "#FCFBF8", border: `1px solid ${LINE}`, borderRadius: 16, padding: "15px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 10 }}>⚠️ 흔히 하는 실수</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {a.mistakes.map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: t.accentDeep, fontWeight: 900, flexShrink: 0 }}>·</span>
                      <span style={{ fontSize: 13, color: "#4A453D", fontWeight: 600, lineHeight: 1.6, wordBreak: "keep-all", textWrap: "pretty" }}>{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Block>{a.outro}</Block>
            </>
          )}

          {/* 전문가 안내(상시) */}
          <p style={{ fontSize: 13.5, color: t.accentDeep, fontWeight: 800, lineHeight: 1.7, margin: "18px 0 0", padding: "13px 15px", background: t.accentSoft, borderRadius: 14, wordBreak: "keep-all", textWrap: "pretty" }}>{OUTRO_SAFETY}</p>

          {onGoDiary && (
            <button onClick={() => { onClose(); onGoDiary(); }}
              style={{ width: "100%", marginTop: 16, border: "none", cursor: "pointer", borderRadius: 14, padding: "14px 0", fontSize: 14.5, fontWeight: 800, fontFamily: "inherit", color: "#fff", background: t.accentDeep }}>
              📝 내 기록 보러 가기
            </button>
          )}

          {/* 필자 — 자격은 소개란에만 사실로 (§6.4) */}
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${LINE}`, display: "flex", gap: 11, alignItems: "flex-start" }}>
            <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: "50%", background: t.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🩵</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: INK }}>{AUTHOR.name}</div>
              <div style={{ fontSize: 11.5, color: SUB, fontWeight: 600, lineHeight: 1.55, marginTop: 2, wordBreak: "keep-all" }}>{AUTHOR.note}</div>
            </div>
          </div>

          {/* 여기까지가 일반 정보 — 1:1은 별도 (§5-④) */}
          <div style={{ marginTop: 16, background: "#FFFDF6", border: "1px solid #F0E4C0", borderRadius: 14, padding: "14px 15px" }}>
            <div style={{ fontSize: 12.5, color: "#7A6A3A", fontWeight: 700, lineHeight: 1.6, wordBreak: "keep-all", textWrap: "pretty" }}>
              여기까지는 누구에게나 해당하는 일반 정보예요. 내 몸 상태에 맞춘 구체적인 안내가 필요하면 1:1로 이어드릴게요.
            </div>
          </div>

          <p style={{ fontSize: 11, color: MUTE, lineHeight: 1.6, marginTop: 16 }}>✍️ 이 글은 AI의 도움을 받아 작성되었어요.</p>
        </div>
      </div>
    </div>
  );
}
