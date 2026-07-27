import { useState, useRef, useEffect } from "react";
import { HOTSPOTS, VIEW_ORDER, VIEW_LABEL, WHEN_OPTS, hasBatchim } from "../lib/mallangProfile";
import { getTypeAccent, GOLD } from "../lib/typeAccent";

import femaleFront from "../assets/3d_body/female_front.png";
import femaleBack from "../assets/3d_body/female_back.png";
import femaleLeft from "../assets/3d_body/female_left.png";
import femaleRight from "../assets/3d_body/female_right.png";
import maleFront from "../assets/3d_body/male_front.png";
import maleBack from "../assets/3d_body/male_back.png";
import maleLeft from "../assets/3d_body/male_left.png";
import maleRight from "../assets/3d_body/male_right.png";

const IMGS = {
  female: { front: femaleFront, back: femaleBack, left: femaleLeft, right: femaleRight },
  male: { front: maleFront, back: maleBack, left: maleLeft, right: maleRight },
};

const HOLD_MS = 2000; // 2초 꾹 누르기
const MAX_PARTS = 2;

// 성별별 3D 캐릭터를 좌우로 돌려보며(◀▶) 부위를 2초 꾹 눌러 최대 2부위 선택.
// value: [{ part, when, whenOther }] / onChange(next)
export default function BodySelector3D({ gender, value, onChange }) {
  const t = getTypeAccent();
  const isMale = gender === "male" || gender === "M" || gender === "남성";
  const imgSet = IMGS[isMale ? "male" : "female"];
  const [viewIdx, setViewIdx] = useState(0);
  const view = VIEW_ORDER[viewIdx];

  const [press, setPress] = useState(null); // { key, progress }
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const doneRef = useRef(false);

  const selectedParts = value.map(v => v.part);

  const stopPress = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPress(null);
  };
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const togglePart = (part) => {
    const exists = value.find(v => v.part === part);
    if (exists) onChange(value.filter(v => v.part !== part));
    else if (value.length < MAX_PARTS) onChange([...value, { part, when: null, whenOther: "" }]);
    // 이미 2개면 무시(꽉 참)
    if (navigator.vibrate) navigator.vibrate(exists ? 10 : [12, 40, 12]);
  };

  const startPress = (zoneKey, part) => {
    doneRef.current = false;
    startRef.current = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - startRef.current) / HOLD_MS);
      setPress({ key: zoneKey, progress: p });
      if (p >= 1) {
        doneRef.current = true;
        togglePart(part);
        stopPress();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const setWhen = (part, when) => onChange(value.map(v => v.part === part ? { ...v, when } : v));
  const setWhenOther = (part, txt) => onChange(value.map(v => v.part === part ? { ...v, whenOther: txt } : v));

  const rotate = (dir) => { stopPress(); setViewIdx(i => (i + dir + VIEW_ORDER.length) % VIEW_ORDER.length); };

  const zones = HOTSPOTS[view];

  return (
    <div style={{ width: "100%" }}>
      {/* 캐릭터 + 히트존 */}
      <div style={{ position: "relative", width: "100%", maxWidth: 300, margin: "0 auto", aspectRatio: "1 / 2",
        background: "linear-gradient(180deg,#FAF8F3,#F3F1EC)", borderRadius: 24, overflow: "hidden", touchAction: "none",
        userSelect: "none", WebkitUserSelect: "none" }}>
        <img src={imgSet[view]} alt={VIEW_LABEL[view]} draggable={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />

        {zones.map((z, i) => {
          const key = `${view}-${i}`;
          const on = selectedParts.includes(z.part);
          const pressing = press && press.key === key;
          return (
            <div key={key} data-hotspot={z.part}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); startPress(key, z.part); }}
              onPointerUp={() => { if (!doneRef.current) stopPress(); }}
              onPointerLeave={() => stopPress()}
              onPointerCancel={() => stopPress()}
              style={{ position: "absolute", left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%`,
                borderRadius: 14, cursor: "pointer",
                background: on ? "rgba(201,151,90,0.28)" : (pressing ? "rgba(201,151,90,0.16)" : "transparent"),
                border: on ? `2px solid ${GOLD}` : "2px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "background .12s" }}>
              {pressing && (
                <svg viewBox="0 0 44 44" style={{ width: "72%", maxWidth: 52, height: "auto" }}>
                  <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="4" />
                  <circle cx="22" cy="22" r="18" fill="none" stroke={GOLD} strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 18}
                    strokeDashoffset={2 * Math.PI * 18 * (1 - press.progress)}
                    transform="rotate(-90 22 22)" />
                </svg>
              )}
              {on && !pressing && (
                <span style={{ fontSize: 10, fontWeight: 800, color: GOLD, background: "#fff", borderRadius: 8, padding: "1px 5px", boxShadow: "0 1px 3px rgba(0,0,0,.12)" }}>{z.part}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 회전 컨트롤 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 12 }}>
        <RotBtn dir="◀" onClick={() => rotate(-1)} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#9B9489", minWidth: 44, textAlign: "center" }}>{VIEW_LABEL[view]}</span>
        <RotBtn dir="▶" onClick={() => rotate(1)} />
      </div>
      <p style={{ textAlign: "center", fontSize: 11.5, color: "#B7B2A9", fontWeight: 600, margin: "8px 0 0" }}>
        불편한 곳을 <b style={{ color: t.accent }}>2초간 꾹</b> 눌러 선택하세요 (최대 2곳)
      </p>

      {/* 선택된 부위별: 언제 그러셨어요 */}
      {value.length > 0 && (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          {value.map(v => (
            <div key={v.part} style={{ background: "#FAF8F3", borderRadius: 16, padding: "14px 15px" }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1C1A17", marginBottom: 10 }}>
                '{v.part}'{hasBatchim(v.part) ? "은" : "는"} 언제 그러셨어요?
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {WHEN_OPTS.map(w => (
                  <WhenChip key={w} label={w} on={v.when === w} onClick={() => setWhen(v.part, w)} />
                ))}
                <WhenChip label="기타" on={v.when === "기타"} onClick={() => setWhen(v.part, "기타")} />
              </div>
              {v.when === "기타" && (
                <input value={v.whenOther || ""} onChange={e => setWhenOther(v.part, e.target.value.slice(0, 30))}
                  placeholder="예: 계단 오를 때"
                  style={{ width: "100%", marginTop: 8, padding: "10px 13px", borderRadius: 12, border: "1px solid #EDE9E2", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RotBtn({ dir, onClick }) {
  return (
    <button onClick={onClick}
      style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid #EDE9E2", background: "#fff",
        color: "#6B6459", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
      {dir}
    </button>
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
