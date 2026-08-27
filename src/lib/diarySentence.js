// 하루 기록을 '그림일기 문장'으로 바꾼다 — 미리보기 팝업이 쓴다.
//
// 반환 형태: 문단 3개. 각 문단은 왼쪽에 놓을 아이콘들과, 이어 붙일 글 조각들로 이뤄진다.
//   { icons: [{ kind:'svg', name:'sleepWell' } | { kind:'chip', label:'요가' }],
//     segs:  [{ t:'어제는 ' } | { hi:'11시' }] }      hi = 연보라로 강조할 낱말
import {
  SLEEP_LABELS, SLEEP_ICON, KEY_TO_EXERCISE_TYPE_LABEL,
  KEY_TO_PART_LABEL, KEY_TO_WHEN_LABEL,
} from "./diaryEntryLabels";
import { hasBatchim } from "./mallangProfile";

// ── 조사 ──────────────────────────────────────────────────────
const josa = (w, withB, withoutB) => (hasBatchim(String(w || "")) ? withB : withoutB);
const eulReul = (w) => josa(w, "을", "를");
const iGa = (w) => josa(w, "이", "가");
const waGwa = (w) => josa(w, "과", "와");
const euRo = (w) => josa(w, "으로", "로");

// ── 말 바꾸기 ─────────────────────────────────────────────────
// '푹 잤어요' → '푹 잤고' 처럼 뒤 문장으로 이어지게 어미를 바꾼다.
const SLEEP_CONJ = ["밤을 새웠고", "뒤척였고", "그냥 그랬고", "푹 잤고"];

// 운동을 못 한 이유 → '~서'
const REASON_PHRASE = {
  busy: "바빠서", tired: "피곤해서", sick: "몸이 안좋아서",
  rest: "그냥 쉬고 싶어서", forgot: "깜빡해서",
};
const REASON_ICON = { busy: "clock", tired: "yawn", sick: "slump", rest: "sofa", forgot: "forgot" };

// 무리한 까닭 → '~느라 / ~서 / ~며'
const LOAD_PHRASE = {
  sit: "오래 앉아있느라", stand: "오래 서 있느라",
  walk: "많이 걸어서", lift: "무거운 물건을 들며",
};
const LOAD_ICON = { sit: "chair", stand: "standing", walk: "walk", lift: "heavyLift" };

// 한 줄 일기 갈래
const NOTE_ICON = { "운동습관": "flex", "일상": "editPencil", "고민": "stress" };

const partName = (s) => (s.part === "etc" && s.partOther ? s.partOther : (KEY_TO_PART_LABEL[s.part] || s.part));

/** 하루 기록 → 문단 3개. 내용이 없는 문단은 빠진다. */
export function buildDiaryParagraphs(entry) {
  const e = entry || {};
  const out = [];

  // ── 1. 어젯밤 잠 + 오늘 운동 ──
  {
    const icons = [], segs = [];
    if (e.sleep != null && SLEEP_CONJ[e.sleep]) {
      icons.push({ kind: "svg", name: SLEEP_ICON[e.sleep] });
      segs.push({ t: "어제는 " });
      if (e.sleepTime) { segs.push({ hi: e.sleepTime }); segs.push({ t: " 즈음 자고 " }); }
      segs.push({ hi: SLEEP_CONJ[e.sleep] });
      segs.push({ t: ", " });
    }
    if (e.exercise?.did === false) {
      const ph = REASON_PHRASE[e.exercise.reason] || "그냥";
      icons.push({ kind: "svg", name: REASON_ICON[e.exercise.reason] || "restNo" });
      segs.push({ t: segs.length ? "오늘은 " : "오늘은 " }, { hi: ph }, { t: " 운동을 못했다." });
    } else if (e.exercise?.did === true) {
      const names = (e.exercise.types || []).map((t) => KEY_TO_EXERCISE_TYPE_LABEL[t] || t);
      names.forEach((n) => icons.push({ kind: "chip", label: n }));
      segs.push({ t: "오늘은 " });
      names.forEach((n, i) => {
        segs.push({ hi: n });
        if (i < names.length - 1) segs.push({ t: waGwa(n) + " " });
      });
      const last = names[names.length - 1] || "운동";
      segs.push({ t: `${eulReul(last)} 했다.` });
    }
    if (segs.length) out.push({ icons, segs });
  }

  // ── 2. 무리한 정도 + 불편한 곳 ──
  {
    const icons = [], segs = [];
    if (e.overwork?.yes === false) {
      segs.push({ t: "그리고 " }, { hi: "무리하지 않은" }, { t: " 하루였고, " });
    } else if (e.overwork?.yes === true) {
      const loads = e.overwork.loads || [];
      segs.push({ t: "그리고 " });
      loads.forEach((l, i) => {
        if (l === "etc") {
          const w = String(e.overwork.etcText || e.overwork.other || "").trim();
          if (w) { segs.push({ hi: w + euRo(w) }); } else { segs.push({ hi: "이런저런 일로" }); }
        } else {
          icons.push({ kind: "svg", name: LOAD_ICON[l] || "warn" });
          segs.push({ hi: LOAD_PHRASE[l] || "무리하느라" });
        }
        if (i < loads.length - 1) segs.push({ t: ", " });
      });
      segs.push({ t: " 무리했고, " });
    }

    const sores = e.soreness || [];
    if (sores.length === 0) {
      if (segs.length) segs.push({ hi: "불편함은 그다지 없었던" }, { t: " 것 같다." });
    } else {
      sores.forEach((s, i) => {
        const name = partName(s);
        icons.push({ kind: "chip", label: name });
        const when = KEY_TO_WHEN_LABEL[s.situation] || "하루 종일";
        segs.push({ hi: when }, { t: "에 " }, { hi: name }, { t: iGa(name) + " " },
          { hi: `${s.level ?? 5}정도` }, { t: i < sores.length - 1 ? "로 불편한 날이었고, " : "로 불편한 날이었다." });
      });
    }
    if (segs.length) out.push({ icons, segs });
  }

  // ── 3. 한 줄 일기 ──
  if (e.note?.text) {
    const cat = e.note.category || "일상";
    out.push({
      icons: [{ kind: "svg", name: NOTE_ICON[cat] || "editPencil" }],
      segs: [{ t: "오늘 " }, { hi: cat }, { t: `${euRo(cat)}는 ` }, { t: e.note.text }],
    });
  }

  return out;
}

export { SLEEP_LABELS };
