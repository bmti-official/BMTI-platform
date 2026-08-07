import { useState, useMemo } from "react";
import { CHARACTERS } from "../data";
import { getTypeAccent } from "../lib/typeAccent";
import {
  CURATION_ARTICLES, CURATION_PARTS, partTheme, SORE_TO_PART,
  OUTRO_SAFETY, AUTHOR,
} from "../data/curationArticles";

// ─────────────────────────────────────────────
// 말랑 큐레이션 — '치료법'이 아니라 '판별력'을 파는 근골격계 큐레이션. (구현 지시서)
//   · 사용자가 조작하는 건 부위(6) + 매체(글/영상) 2개뿐. BMTI 4축은 자동으로 '조립'에만 관여.
//   · 목록은 최신순이 아니라 몸축: 기록 > 유형 > 고정 > 최신.
//   · 글은 블록으로 저장되고, 유형에 따라 다른 블록을 조립해 렌더 + '다른 관점으로 보기' 토글.
//   · §6 카피 규칙(의료성 단어 금지)·전문가 안내 상시 노출 준수.
// ─────────────────────────────────────────────

const INK = "#1C1A17", SUB = "#8A8378", MUTE = "#B7B2A9", LINE = "#EEEAE2";
const CARD_SHADOW = "0 1px 2px rgba(28,26,23,0.03), 0 8px 20px rgba(28,26,23,0.05)";
const YELLOW = "#FBF3D6", YELLOW_LINE = "#F0E4B0", YELLOW_INK = "#8A7220"; // 강조 박스 딱 하나 (§8)

// BMTI 4글자 → 4축. pos0 A/O · pos1 C/L · pos2 D/Q · pos3 Z/M
const getAxes = (code) => {
  const c = (code ? String(code).split("-")[0] : "").toUpperCase();
  return { ao: c[0] === "A" ? "A" : "O", cl: c[1] === "C" ? "C" : "L", dq: c[2] === "Q" ? "Q" : "D", zm: c[3] === "Z" ? "Z" : "M" };
};

function PartThumb({ part, size, radius = 14 }) {
  const th = partTheme(part);
  return (
    <div style={{ width: size, height: size, flexShrink: 0, borderRadius: radius, background: th.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4 }}>
      <span style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.1))" }}>{th.emoji}</span>
    </div>
  );
}
function PartTags({ parts }) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {parts.slice(0, 3).map(p => (
        <span key={p} style={{ fontSize: 10.5, fontWeight: 800, color: SUB, background: "#F2EFEA", borderRadius: 999, padding: "4px 9px" }}>{p}</span>
      ))}
    </div>
  );
}

// 리스트형 글 행 (기록·유형 섹션 공용)
function Row({ a, t, onOpen, rank, border }) {
  return (
    <button onClick={() => onOpen(a)}
      style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 13, padding: "13px 0", borderTop: border ? `1px solid ${LINE}` : "none", textAlign: "left" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <PartThumb part={a.parts[0]} size={62} />
        {rank != null && <span style={{ position: "absolute", top: -6, left: -6, width: 23, height: 23, borderRadius: "50%", background: INK, color: "#fff", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>{rank}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 5 }}><PartTags parts={a.parts} /></div>
        <div style={{ fontSize: 14, fontWeight: 800, color: INK, lineHeight: 1.35, wordBreak: "keep-all", textWrap: "pretty" }}>{a.title}</div>
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
  const [reading, setReading] = useState(null);

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

  // 섹션 구성 (기록 > 유형 > 고정 > 최신)
  const recordPart = record && (part === "전체" || part === record.part) ? record.part : null;
  const recordList = recordPart ? pool.filter(a => a.parts.includes(recordPart)).slice(0, 3) : [];
  const typeList = [...pool].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
  const pinned = pool.filter(a => a.pinned);
  const fresh = [...pool].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const sectionTitle = { fontSize: 17, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 12px", wordBreak: "keep-all", color: INK };
  const listBox = { background: "#FCFBF9", border: `1px solid ${LINE}`, borderRadius: 20, padding: "4px 15px" };

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "58px 18px 44px", fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      {/* ① 내 몸에서 출발 — 어디가 불편해요? + 부위 6칩 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        {mascot && <img src={mascot.image} alt="" className={mascot.imgClass || ""} style={{ width: 50, height: 50, objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.12))" }} />}
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.35, wordBreak: "keep-all", textWrap: "balance" }}>
          {nickname ? `${nickname}님, ` : ""}어디가 불편해요?
        </h2>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -18px 12px", padding: "0 18px 4px", scrollbarWidth: "none" }}>
        {CURATION_PARTS.map(p => {
          const on = part === p;
          return (
            <button key={p} onClick={() => setPart(p)}
              style={{ flexShrink: 0, border: on ? "none" : `1.5px solid ${LINE}`, cursor: "pointer", borderRadius: 999, padding: "9px 15px", fontSize: 13.5, fontWeight: 800, fontFamily: "inherit", background: on ? t.accentDeep : "#fff", color: on ? "#fff" : SUB, boxShadow: on ? `0 4px 12px ${t.accentSoft}` : "none" }}>{p}</button>
          );
        })}
      </div>
      {/* 매체 토글 (글/영상) — BMTI와 무관한 취향 (§2.2) */}
      <div style={{ display: "inline-flex", background: "#F2EFEA", borderRadius: 999, padding: 3, marginBottom: 24 }}>
        {[["article", "📖 글로 읽기"], ["video", "▶ 영상으로 보기"]].map(([k, label]) => (
          <button key={k} onClick={() => setMedia(k)}
            style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "7px 14px", fontSize: 12.5, fontWeight: 800, fontFamily: "inherit", background: media === k ? "#fff" : "transparent", color: media === k ? INK : SUB, boxShadow: media === k ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>{label}</button>
        ))}
      </div>

      {media === "video" && pool.length === 0 ? (
        <div style={{ background: "#FCFBF9", border: `1px solid ${LINE}`, borderRadius: 20, padding: "28px 18px", textAlign: "center", fontSize: 13, color: SUB, fontWeight: 600, lineHeight: 1.7 }}>
          영상은 곧 올라와요. 검수를 마친 영상만 골라서 담을게요.<br />지금은 <b style={{ color: t.accentDeep }}>글로 읽기</b>로 먼저 만나보세요.
        </div>
      ) : (
        <>
          {/* ② 기록에서 시작한 글 — 가장 강한 근거 (단 하나의 옐로 강조 박스) */}
          {recordPart && recordList.length > 0 && (
            <section style={{ marginBottom: 26 }}>
              <div style={{ background: YELLOW, border: `1px solid ${YELLOW_LINE}`, borderRadius: 20, padding: "16px 16px 6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 17 }}>💜</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: INK }}>{nickname ? `${nickname}님 ` : ""}기록에서 시작한 글</span>
                </div>
                <p style={{ fontSize: 12.5, color: YELLOW_INK, fontWeight: 800, margin: "0 0 4px 25px" }}>이번 달 {recordPart}를 {record.n}번 적으셨어요.</p>
                <div>{recordList.map((a, i) => <Row key={a.id} a={a} t={t} onOpen={setReading} border={i > 0} />)}</div>
              </div>
            </section>
          )}

          {/* ③ 같은 유형이 많이 본 글 */}
          <section style={{ marginBottom: 26 }}>
            <h3 style={sectionTitle}>{axes.ao}{axes.zm} 유형인 분들이 많이 본 글</h3>
            <div style={listBox}>
              {typeList.length ? typeList.map((a, i) => <Row key={a.id} a={a} t={t} onOpen={setReading} rank={i + 1} border={i > 0} />)
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
                    style={{ width: "100%", textAlign: "left", cursor: "pointer", border: `1px solid ${t.accentSoft}`, background: "#fff", borderRadius: 16, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: CARD_SHADOW, borderLeft: `4px solid ${t.accent}` }}>
                    <PartThumb part={a.parts[0]} size={46} radius={12} />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: INK, lineHeight: 1.35, wordBreak: "keep-all", textWrap: "pretty" }}>{a.title}</div>
                    <span style={{ color: MUTE, fontSize: 18, flexShrink: 0 }}>›</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ⑤ 이번 달 새 글 (최신순 — 맨 아래) */}
          <section>
            <h3 style={sectionTitle}>🆕 이번 달 새 글</h3>
            {fresh.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {fresh.map(a => {
                  const th = partTheme(a.parts[0]);
                  return (
                    <button key={a.id} onClick={() => setReading(a)}
                      style={{ width: "100%", border: `1px solid ${LINE}`, background: "#fff", cursor: "pointer", padding: 0, borderRadius: 20, overflow: "hidden", textAlign: "left", boxShadow: CARD_SHADOW }}>
                      <div style={{ height: 140, background: th.grad, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 54, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.12))" }}>{th.emoji}</span>
                      </div>
                      <div style={{ padding: "14px 16px 16px" }}>
                        <div style={{ marginBottom: 8 }}><PartTags parts={a.parts} /></div>
                        <div style={{ fontSize: 15.5, fontWeight: 800, color: INK, lineHeight: 1.4, letterSpacing: "-0.01em", wordBreak: "keep-all", textWrap: "pretty" }}>{a.title}</div>
                        <div style={{ fontSize: 12, color: MUTE, fontWeight: 600, marginTop: 10 }}>{a.createdAt}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : <div style={{ fontSize: 12.5, color: MUTE, fontWeight: 600, textAlign: "center", padding: "18px 8px" }}>이 부위의 새 글이 곧 올라와요.</div>}
          </section>
        </>
      )}

      {reading && <ArticleReader article={reading} axes={axes} t={t} onClose={() => setReading(null)} onGoDiary={onGoDiary} />}
    </div>
  );
}

// ── 글 화면 — 유형에 따라 블록을 조립해 렌더 + '다른 관점으로 보기' 토글 (§7.2, §7.3) ──
function ArticleReader({ article: a, axes, t, onClose, onGoDiary }) {
  const [ao, setAo] = useState(axes.ao); // 움직임 관점 A/O
  const [cl, setCl] = useState(axes.cl); // 범위 관점 C/L
  const dq = axes.dq, zm = axes.zm;
  const th = partTheme(a.parts[0]);

  const Block = ({ label, children, tint }) => (
    <div style={{ marginTop: 20 }}>
      {label && <div style={{ fontSize: 11.5, fontWeight: 900, color: t.accentDeep, marginBottom: 7, letterSpacing: "0.02em" }}>{label}</div>}
      <p style={{ fontSize: 14.5, color: "#33302B", lineHeight: 1.78, margin: 0, whiteSpace: "pre-line", wordBreak: "keep-all", textWrap: "pretty", ...(tint || {}) }}>{children}</p>
    </div>
  );

  const toggleBtn = (label, onClick) => (
    <button onClick={onClick}
      style={{ border: `1.5px solid ${t.accentSoft}`, background: t.accentSoft, color: t.accentDeep, cursor: "pointer", borderRadius: 999, padding: "8px 13px", fontSize: 12, fontWeight: 800, fontFamily: "inherit" }}>{label}</button>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(28,26,23,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "92vh", background: "#fff", borderRadius: "24px 24px 0 0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* 헤더 색면 (해부도 대신 조용한 색) */}
        <div style={{ height: 150, background: th.grad, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
          <span style={{ fontSize: 58, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.12))" }}>{th.emoji}</span>
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.9)", color: SUB, fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ overflowY: "auto", padding: "18px 20px 28px" }}>
          <div style={{ marginBottom: 10 }}><PartTags parts={a.parts} /></div>
          <h2 style={{ margin: "0 0 12px", fontSize: 21, fontWeight: 900, lineHeight: 1.35, letterSpacing: "-0.02em", wordBreak: "keep-all", textWrap: "balance" }}>{a.title}</h2>

          {/* 유형 배지 + 다른 관점으로 보기 (§7.3) */}
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

          {/* 흔히 하는 실수 — 시각적으로 구분 (§7.2, §5-③) */}
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

          {/* 마무리 + 전문가 안내(상시) */}
          <Block>{a.outro}</Block>
          <p style={{ fontSize: 13.5, color: t.accentDeep, fontWeight: 800, lineHeight: 1.7, margin: "12px 0 0", padding: "13px 15px", background: t.accentSoft, borderRadius: 14, wordBreak: "keep-all", textWrap: "pretty" }}>{OUTRO_SAFETY}</p>

          {/* 내 기록 보러 가기 — 앱으로 연결 (§7.2) */}
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

          {/* 여기까지가 일반 정보 — 1:1은 별도 (§5-④, 골드 신호) */}
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
