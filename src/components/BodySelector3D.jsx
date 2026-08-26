import { HOTSPOTS, WHEN_OPTS, hasBatchim } from "../lib/mallangProfile";
import { getTypeAccent, GOLD } from "../lib/typeAccent";

import femaleFront from "../assets/3d_body/female_front.png";
import femaleBack from "../assets/3d_body/female_back.png";
import maleFront from "../assets/3d_body/male_front.png";
import maleBack from "../assets/3d_body/male_back.png";

const IMGS = {
  female: { front: femaleFront, back: femaleBack },
  male: { front: maleFront, back: maleBack },
};

const MAX_PARTS = 3;

// 성별별 3D 캐릭터의 앞(좌)·뒤(우)를 한 화면에 나란히 두고 부위를 한 번 터치해 최대 3부위 선택.
// value: [{ part, when: string[], whenOther }] / onChange(next)
export default function BodySelector3D({ gender, value, onChange }) {
  const t = getTypeAccent();
  const isMale = gender === "male" || gender === "M" || gender === "남성";
  const imgSet = IMGS[isMale ? "male" : "female"];
  const selectedParts = value.map(v => v.part);

  const togglePart = (part) => {
    const exists = value.find(v => v.part === part);
    if (exists) onChange(value.filter(v => v.part !== part));
    else if (value.length < MAX_PARTS) onChange([...value, { part, when: [], whenOther: "" }]);
    if (navigator.vibrate) navigator.vibrate(exists ? 10 : 14);
  };

  // 언제 그러셨어요 — 중복 선택 가능(토글)
  const toggleWhen = (part, w) => onChange(value.map(v => {
    if (v.part !== part) return v;
    const cur = Array.isArray(v.when) ? v.when : [];
    return { ...v, when: cur.includes(w) ? cur.filter(x => x !== w) : [...cur, w] };
  }));
  const setWhenOther = (part, txt) => onChange(value.map(v => v.part === part ? { ...v, whenOther: txt } : v));
  // '기타'로 고른 부위가 어디였는지 — 여기서 바로 적어 프로필에 함께 저장한다.
  const setPartOther = (txt) => onChange(value.map(v => v.part === "기타" ? { ...v, partOther: txt } : v));

  // 화면에 부를 이름 — '기타'는 직접 적은 부위명으로 부른다.
  const partName = (v) => (v.part === "기타" ? (String(v.partOther || "").trim() || "기타") : v.part);

  const Figure = ({ view, label }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 2",
        background: "linear-gradient(180deg,#FAF8F3,#F3F1EC)", borderRadius: 20, overflow: "hidden", touchAction: "manipulation",
        userSelect: "none", WebkitUserSelect: "none" }}>
        <img src={imgSet[view]} alt={label} draggable={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
        {/* '기타' — 몸에 짚을 자리가 없는 부위(엉덩이·손가락 등)를 위해 앞모습 우측 상단에 둔다.
            어디였는지는 하루 기록 화면에서 직접 적는다. */}
        {view === "front" && (() => {
          const on = selectedParts.includes("기타");
          return (
            <button data-hotspot="기타" onClick={() => togglePart("기타")}
              style={{ position: "absolute", right: "5%", top: "3.5%", padding: "5px 10px", borderRadius: 999, cursor: "pointer",
                background: on ? "rgba(201,151,90,0.30)" : "rgba(255,255,255,0.92)",
                border: on ? `2px solid ${GOLD}` : "1.5px dashed #D8D3C8",
                color: on ? GOLD : "#9B9489", fontSize: 10.5, fontWeight: 800, whiteSpace: "nowrap",
                boxShadow: "0 1px 3px rgba(0,0,0,.08)", transition: "background .12s" }}>
              기타
            </button>
          );
        })()}
        {HOTSPOTS[view].map((z, i) => {
          const on = selectedParts.includes(z.part);
          return (
            <button key={`${view}-${i}`} data-hotspot={z.part} onClick={() => togglePart(z.part)}
              style={{ position: "absolute", left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%`,
                borderRadius: z.line ? 999 : 12, cursor: "pointer", padding: 0,
                background: on ? "rgba(201,151,90,0.30)" : "transparent",
                border: on ? `2px solid ${GOLD}` : "2px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "background .12s" }}>
              {on ? (
                <span style={{ fontSize: 9, fontWeight: 800, color: GOLD, background: "#fff", borderRadius: 7, padding: "1px 4px", whiteSpace: "nowrap", boxShadow: "0 1px 3px rgba(0,0,0,.12)" }}>{z.part}</span>
              ) : z.line ? (
                // 팔·다리는 점 대신 몸 옆면에 ㄷ자 괄호를 그어 '여기부터 여기까지'를 보여준다.
                // 몸 왼쪽이면 오른쪽으로, 오른쪽이면 왼쪽으로 열리게 방향을 뒤집는다.
                <span className={`body-bracket ${z.x < 50 ? "is-left" : "is-right"}`} />
              ) : (
                <span className="body-dot" />
              )}
            </button>
          );
        })}
      </div>
      <div style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: "#9B9489", marginTop: 6 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ width: "100%" }}>
      {/* 안내점: '여기를 누르세요' 느낌의 또렷한 타깃 점 — 가운데 골드 점 + 잔잔히 퍼지는 링 */}
      <style>{`
        @keyframes bodyDotRing {
          0% { transform: scale(0.7); opacity: 0.55; }
          70%, 100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes bodyDotCore {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        .body-dot { position: relative; width: 8px; height: 8px; display: block; }
        .body-dot::before { content: ""; position: absolute; inset: 0; border-radius: 50%;
          background: radial-gradient(circle, #F79089 0%, #EE6A62 70%); box-shadow: 0 1px 2px rgba(200,90,80,0.32);
          animation: bodyDotCore 2.2s ease-in-out infinite; }
        .body-dot::after { content: ""; position: absolute; inset: 0; border-radius: 50%;
          border: 1.5px solid #EE6A62; animation: bodyDotRing 2.2s ease-out infinite; }
        .body-bracket { display: block; width: 100%; height: 86%; box-sizing: border-box;
          border-top: 2.5px solid #EE6A62; border-bottom: 2.5px solid #EE6A62;
          animation: bodyDotCore 2.2s ease-in-out infinite; }
        .body-bracket.is-left  { border-left: 2.5px solid #EE6A62; border-radius: 7px 0 0 7px; }
        .body-bracket.is-right { border-right: 2.5px solid #EE6A62; border-radius: 0 7px 7px 0; }
      `}</style>
      {/* 앞모습(좌) · 뒷모습(우) 나란히 */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Figure view="front" label="앞모습" />
        <Figure view="back" label="뒷모습" />
      </div>
      <p style={{ textAlign: "center", fontSize: 11.5, color: "#B7B2A9", fontWeight: 600, margin: "10px 0 0" }}>
        불편한 곳을 <b style={{ color: t.accent }}>한 번 터치</b>해 선택하세요 (최대 3곳)
      </p>

      {/* 선택된 부위별: 언제 그러셨어요 (중복 선택) */}
      {value.length > 0 && (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          {value.map(v => {
            const whens = Array.isArray(v.when) ? v.when : [];
            return (
              <div key={v.part} style={{ background: "#FAF8F3", borderRadius: 16, padding: "14px 15px" }}>
                {v.part === "기타" && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1C1A17", marginBottom: 8 }}>어디가 불편했나요?</div>
                    <input value={v.partOther || ""} onChange={e => setPartOther(e.target.value.slice(0, 20))}
                      placeholder="예: 엉덩이, 손가락, 종아리"
                      style={{ width: "100%", padding: "10px 13px", borderRadius: 12, border: "1px solid #EDE9E2", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>
                )}
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1C1A17", marginBottom: 10 }}>
                  '{partName(v)}'{hasBatchim(partName(v)) ? "은" : "는"} 언제 그러셨어요? <span style={{ color: "#B7B2A9", fontWeight: 600, fontSize: 11.5 }}>중복 선택 가능</span>
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {WHEN_OPTS.map(w => (
                    <WhenChip key={w} label={w} on={whens.includes(w)} onClick={() => toggleWhen(v.part, w)} />
                  ))}
                  <WhenChip label="기타" on={whens.includes("기타")} onClick={() => toggleWhen(v.part, "기타")} />
                </div>
                {whens.includes("기타") && (
                  <input value={v.whenOther || ""} onChange={e => setWhenOther(v.part, e.target.value.slice(0, 30))}
                    placeholder="예: 계단 오를 때"
                    style={{ width: "100%", marginTop: 8, padding: "10px 13px", borderRadius: 12, border: "1px solid #EDE9E2", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WhenChip({ label, on, onClick }) {
  const t = getTypeAccent();
  return (
    <button onClick={onClick}
      style={{ padding: "7px 13px", borderRadius: 16, fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: "none",
        background: on ? t.accent : "#F3F1EC", color: on ? "#fff" : "#9B9489", transition: "all .12s" }}>
      {label}
    </button>
  );
}
