import { useState } from "react";
import { HOTSPOTS, VIEW_ORDER, VIEW_LABEL, WHEN_OPTS, hasBatchim } from "../lib/mallangProfile";
import { getTypeAccent, GOLD } from "../lib/typeAccent";

import femaleFront from "../assets/3d_body/female_front.png";
import femaleBack from "../assets/3d_body/female_back.png";
import maleFront from "../assets/3d_body/male_front.png";
import maleBack from "../assets/3d_body/male_back.png";

const IMGS = {
  female: { front: femaleFront, back: femaleBack },
  male: { front: maleFront, back: maleBack },
};

const MAX_PARTS = 2;

// 성별별 3D 캐릭터의 앞/뒤를 전환하며 부위를 한 번 터치해 최대 2부위 선택.
// value: [{ part, when: string[], whenOther }] / onChange(next)
export default function BodySelector3D({ gender, value, onChange }) {
  const t = getTypeAccent();
  const isMale = gender === "male" || gender === "M" || gender === "남성";
  const imgSet = IMGS[isMale ? "male" : "female"];
  const [viewIdx, setViewIdx] = useState(0);
  const view = VIEW_ORDER[viewIdx];
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

  const flip = () => setViewIdx(i => (i + 1) % VIEW_ORDER.length);
  const zones = HOTSPOTS[view];

  return (
    <div style={{ width: "100%" }}>
      {/* 캐릭터 + 히트존(한 번 터치로 선택) */}
      <div style={{ position: "relative", width: "100%", maxWidth: 300, margin: "0 auto", aspectRatio: "1 / 2",
        background: "linear-gradient(180deg,#FAF8F3,#F3F1EC)", borderRadius: 24, overflow: "hidden", touchAction: "manipulation",
        userSelect: "none", WebkitUserSelect: "none" }}>
        <img src={imgSet[view]} alt={VIEW_LABEL[view]} draggable={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />

        {zones.map((z, i) => {
          const on = selectedParts.includes(z.part);
          return (
            <button key={`${view}-${i}`} data-hotspot={z.part} onClick={() => togglePart(z.part)}
              style={{ position: "absolute", left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%`,
                borderRadius: 14, cursor: "pointer", padding: 0,
                // 선택 가능한 부위엔 멀어질수록 연해지는 아주 연한 원형 그라데이션으로 위치를 안내
                background: on ? "rgba(201,151,90,0.28)" : "radial-gradient(circle 15px at 50% 50%, rgba(201,151,90,0.30) 0%, rgba(201,151,90,0.12) 50%, rgba(201,151,90,0) 100%)",
                border: on ? `2px solid ${GOLD}` : "2px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "background .12s" }}>
              {on && (
                <span style={{ fontSize: 10, fontWeight: 800, color: GOLD, background: "#fff", borderRadius: 8, padding: "1px 5px", boxShadow: "0 1px 3px rgba(0,0,0,.12)" }}>{z.part}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 앞/뒤 전환 */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
        <button onClick={flip}
          style={{ padding: "9px 18px", borderRadius: 999, border: "1px solid #EDE9E2", background: "#fff",
            color: "#6B6459", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
          🔄 {VIEW_LABEL[VIEW_ORDER[(viewIdx + 1) % VIEW_ORDER.length]]} 보기
        </button>
      </div>
      <p style={{ textAlign: "center", fontSize: 11.5, color: "#B7B2A9", fontWeight: 600, margin: "8px 0 0" }}>
        불편한 곳을 <b style={{ color: t.accent }}>한 번 터치</b>해 선택하세요 (최대 2곳)
      </p>

      {/* 선택된 부위별: 언제 그러셨어요 (중복 선택) */}
      {value.length > 0 && (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          {value.map(v => {
            const whens = Array.isArray(v.when) ? v.when : [];
            return (
              <div key={v.part} style={{ background: "#FAF8F3", borderRadius: 16, padding: "14px 15px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1C1A17", marginBottom: 10 }}>
                  '{v.part}'{hasBatchim(v.part) ? "은" : "는"} 언제 그러셨어요? <span style={{ color: "#B7B2A9", fontWeight: 600, fontSize: 11.5 }}>중복 선택 가능</span>
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
