import { useState, useRef, useEffect } from "react";
import { Mallang } from "./Mallang";
import MallangStressPopup from "./MallangStressPopup";
import { MOODS, CHARACTERS } from "../data";
import {
  getDiaryHistory, getEntryForDate, todayISO, saveDiaryEntry,
  isDayWritable,
} from "../lib/diaryHistory";
import { MALLANG_SKINS, getMallangSkin, setMallangSkin } from "../lib/mallangSkins";

const C = {
  bg: "#FFFFFF", card: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2",
};
const SAT_BLUE = "#2F6FE0";
const SUN_RED = "#E0554F";
const PINK = "#FF6B9D";
const MIN_YEAR = 2026;
const MIN_MONTH = 7; // 2026년 7월 이전은 선택 불가

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n) => String(n).padStart(2, "0");
const weekdayColor = (dow) => (dow === 0 ? SUN_RED : dow === 6 ? SAT_BLUE : null);

export default function DiaryCalendar({ onPickMood, onEditDay, bmtiCode }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSkinPicker, setShowSkinPicker] = useState(false);
  const currentSkin = getMallangSkin();
  const axisCode = bmtiCode ? bmtiCode.split("-")[0] : "";
  const charImage = CHARACTERS.find(c => c.id === axisCode)?.image;
  const isM = axisCode.includes("M");
  // Z유형은 담백하게, M유형은 발랄하게 — 유형별로 다르게 물어보고 다르게 반응해준다.
  const moodQuestionTitle = isM ? "오늘 기분, 어떤 말랑이예요?" : "오늘의 기분을 선택하세요";
  const moodQuestionSub = isM ? "정답은 없어요. 지금 느낌그대로면 돼요" : "기록이 쌓이면 주간 패턴을 찾아드립니다";
  const moodPickedMessage = isM ? "오늘은 그랬군요. 기억해둘게요" : "기록을 완료했습니다";
  const year = cursor.getFullYear();
  const month = cursor.getMonth(); // 0-indexed
  const monthKey = `${year}-${pad(month + 1)}`;
  const todayStr = todayISO();

  const history = getDiaryHistory();
  const entryCountThisMonth = history.filter(e => e.date.startsWith(monthKey)).length;

  // 오늘 기분 팝업 — 오늘 기록이 없으면 탭에 들어오자마자 자동으로 뜬다.
  const [showMoodPopup, setShowMoodPopup] = useState(() => !getEntryForDate(todayISO()));
  const [poppedMood, setPoppedMood] = useState(null);
  // "오늘은 여기까지 할게요"로 짧게 끝내도, 조금 더 기록할 때와 마찬가지로
  // 스트레스 해소 팝업(말랑이 눌러보기)을 한 번 보여준다.
  const [showStressPopup, setShowStressPopup] = useState(false);
  const [stressMood, setStressMood] = useState(null);

  const quickSaveMood = () => {
    saveDiaryEntry(todayStr, poppedMood);
    setStressMood(poppedMood);
    setShowMoodPopup(false);
    setPoppedMood(null);
    setShowStressPopup(true);
  };
  const continueToFullForm = () => {
    setShowMoodPopup(false);
    const v = poppedMood;
    setPoppedMood(null);
    onPickMood && onPickMood(v);
  };

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", justifyContent: "center", fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>
      <div style={{ width: "100%", maxWidth: 420, minHeight: "100vh", display: "flex", flexDirection: "column", padding: "76px 20px 96px" }}>

        {/* 헤더 */}
        <div style={{ position: "relative", textAlign: "center", marginBottom: 22 }}>
          <button
            onClick={() => setShowDatePicker(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer", padding: "4px 8px" }}
          >
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", color: C.ink }}>{year}년 {month + 1}월</h1>
            <span style={{ fontSize: 12, color: C.sub, transform: "translateY(1px)" }}>▼</span>
          </button>
          <p style={{ fontSize: 13.5, color: C.sub, margin: "8px 0 0" }}>총 {entryCountThisMonth}일 기록했어요</p>

          {/* 말랑이 스킨(외형) 선택 버튼 — 지금 고른 스킨의 표정을 그대로 보여준다 */}
          <button
            onClick={() => setShowSkinPicker(true)}
            aria-label="말랑이 모양 바꾸기"
            style={{ position: "absolute", right: 0, top: 2, width: 38, height: 38, borderRadius: "50%", border: `1px solid ${C.line}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Mallang v={5} size={24} />
          </button>
        </div>

        {/* 요일 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: weekdayColor(i) || C.sub, padding: "6px 0" }}>{w}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 22 }}>
          {cells.map((d, idx) => {
            if (!d) return <div key={idx} />;
            const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
            const entry = getEntryForDate(dateStr);
            const isToday = dateStr === todayStr;
            const dow = idx % 7;
            const writable = isDayWritable(dateStr);
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {entry && writable ? (
                  <button
                    onClick={() => onEditDay && onEditDay(dateStr, entry.mood)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, border: "none", background: "transparent", cursor: "pointer", padding: 2 }}
                  >
                    <Mallang v={entry.mood} size={36} />
                  </button>
                ) : entry ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: 2 }}>
                    <Mallang v={entry.mood} size={36} />
                  </div>
                ) : isToday ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: weekdayColor(dow) || C.ink }}>
                      {d}
                    </div>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: SUN_RED }} />
                  </div>
                ) : writable ? (
                  // 아직 안 썼지만 7일 이내라 쓸 수 있는 날 — 살짝 강조해서 표시
                  <button
                    onClick={() => onEditDay && onEditDay(dateStr, null)}
                    style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2 }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${PINK}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: weekdayColor(dow) || C.ink }}>
                      {d}
                    </div>
                  </button>
                ) : (
                  <span style={{ fontSize: 15, color: weekdayColor(dow) || "#C9C4BB", fontWeight: 500 }}>{d}</span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />
      </div>

      {showDatePicker && (
        <DatePickerModal
          year={year}
          month={month}
          onCancel={() => setShowDatePicker(false)}
          onConfirm={(y, m) => { setCursor(new Date(y, m, 1)); setShowDatePicker(false); }}
        />
      )}

      {showSkinPicker && (
        <div
          onClick={() => setShowSkinPicker(false)}
          style={{ position: "fixed", inset: 0, zIndex: 65, background: "rgba(28,26,23,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: "24px 24px 0 0", padding: "22px 20px 30px" }}>
            <h3 style={{ textAlign: "center", fontSize: 16, fontWeight: 800, margin: "0 0 18px", color: C.ink }}>말랑이 모양 바꾸기</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {Object.entries(MALLANG_SKINS).map(([key, skinInfo]) => {
                const on = currentSkin === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setMallangSkin(key); setShowSkinPicker(false); }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 4px", borderRadius: 16,
                      border: on ? `2px solid ${C.ink}` : "2px solid transparent", background: on ? "#F5F3EE" : "transparent", cursor: "pointer" }}
                  >
                    <Mallang v={5} size={44} skinOverride={key} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: on ? C.ink : C.sub, whiteSpace: "nowrap" }}>{skinInfo.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showMoodPopup && (
        <>
          {/* 배경은 하단 네비 바까지 포함해서 전부 톤다운하되, 캐릭터가 떠 있는 자리만 원형으로
              뚫어서(mask) 그 캐릭터만 톤다운되지 않고 그대로 보이게 한다. */}
          <div
            onClick={() => { setShowMoodPopup(false); setPoppedMood(null); }}
            style={{
              position: "fixed", inset: 0, zIndex: 55, background: "rgba(28,26,23,0.4)",
              WebkitMaskImage: "radial-gradient(circle 42px at 50% calc(100% - 58px), transparent 98%, black 100%)",
              maskImage: "radial-gradient(circle 42px at 50% calc(100% - 58px), transparent 98%, black 100%)",
            }}
          />
          {/* 하단 네비게이션의 캐릭터를 기준으로 그 위에 말풍선이 뜬다 (꼬리가 캐릭터와 겹치지 않게 여유를 둔다) */}
          <div style={{ position: "fixed", left: "50%", bottom: 108, transform: "translateX(-50%)", width: "calc(100% - 48px)", maxWidth: 340, zIndex: 60 }}>
            <div style={{ background: "#fff", borderRadius: 22, padding: "18px 20px 20px", position: "relative", boxShadow: "0 10px 34px rgba(0,0,0,0.16)", animation: "diaryPopupUp .28s cubic-bezier(.22,.9,.32,1)" }}>
              <button
                onClick={() => { setShowMoodPopup(false); setPoppedMood(null); }}
                style={{ position: "absolute", top: 10, right: 12, width: 26, height: 26, border: "none", background: "transparent", color: C.sub, fontSize: 15, cursor: "pointer" }}
              >
                ✕
              </button>

              {poppedMood === null ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, textAlign: "center", margin: "2px 0 4px", lineHeight: 1.4 }}>{moodQuestionTitle}</div>
                  <div style={{ fontSize: 12.5, color: C.sub, textAlign: "center", fontWeight: 600, marginBottom: 18 }}>{moodQuestionSub}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    {MOODS.map(m => (
                      <button key={m.v} onClick={() => setPoppedMood(m.v)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                        padding: "6px 2px", borderRadius: 14, border: "none", background: "transparent", cursor: "pointer" }}>
                        <Mallang v={m.v} size={40} />
                        <span style={{ fontSize: 9.5, color: C.sub, fontWeight: 700, whiteSpace: "nowrap" }}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", paddingTop: 2 }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Mallang v={poppedMood} size={58} /></div>
                  <div style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 18 }}>{moodPickedMessage}</div>
                  <button onClick={continueToFullForm} style={{ width: "100%", padding: 15, borderRadius: 15, border: "none", background: "#5F8A76", color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer", marginBottom: 8, boxShadow: "0 4px 14px rgba(95,138,118,0.25)" }}>
                    네, 조금 더 기록할게요
                  </button>
                  <button onClick={quickSaveMood} style={{ width: "100%", padding: 12, borderRadius: 15, border: "none", background: "transparent", color: C.sub, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                    오늘은 여기까지 할게요
                  </button>
                </div>
              )}

              {/* 말풍선 꼬리 — 하단 네비게이션의 캐릭터를 가리킨다 */}
              <div style={{ position: "absolute", left: "50%", bottom: -8, transform: "translateX(-50%) rotate(45deg)", width: 16, height: 16, background: "#fff" }} />
            </div>
          </div>
          <style>{`@keyframes diaryPopupUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </>
      )}

      {showStressPopup && (
        <MallangStressPopup mood={stressMood} charImage={charImage} onNext={() => setShowStressPopup(false)} />
      )}
    </div>
  );
}

// ── 날짜 선택 팝업 (연/월 휠 피커) ──
function DatePickerModal({ year, month, onCancel, onConfirm }) {
  const [selYear, setSelYear] = useState(year);
  const [selMonth, setSelMonth] = useState(month + 1); // 1-indexed로 표시

  const nowYear = new Date().getFullYear();
  const years = [];
  for (let y = MIN_YEAR; y <= nowYear + 1; y++) years.push(y);
  const months = selYear === MIN_YEAR
    ? Array.from({ length: 12 - MIN_MONTH + 1 }, (_, i) => MIN_MONTH + i)
    : Array.from({ length: 12 }, (_, i) => i + 1);

  // 연도를 2026년으로 바꿨는데 이미 골라둔 월이 7월 이전이면 7월로 당겨온다.
  const handleYearChange = (y) => {
    setSelYear(y);
    if (y === MIN_YEAR && selMonth < MIN_MONTH) setSelMonth(MIN_MONTH);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.4)" }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: "24px 24px 0 0", padding: "22px 20px 28px" }}>
        <h3 style={{ textAlign: "center", fontSize: 17, fontWeight: 800, margin: "0 0 16px", color: C.ink }}>날짜 선택</h3>
        <div style={{ display: "flex", gap: 12 }}>
          <WheelColumn options={years} value={selYear} onChange={handleYearChange} formatLabel={y => `${y}년`} />
          <WheelColumn options={months} value={selMonth} onChange={setSelMonth} formatLabel={m => `${m}월`} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 15, borderRadius: 16, border: "none", background: "#EFEDE9", color: "#6B6660", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>취소</button>
          <button onClick={() => onConfirm(selYear, selMonth - 1)} style={{ flex: 1, padding: 15, borderRadius: 16, border: "none", background: "#5F8A76", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>확인</button>
        </div>
      </div>
    </div>
  );
}

function WheelColumn({ options, value, onChange, formatLabel }) {
  const itemHeight = 46;
  const padCount = 2; // 위/아래로 2칸씩 여백 → 총 5줄이 보임
  const containerHeight = itemHeight * (padCount * 2 + 1);
  const scrollRef = useRef(null);
  const settleTimer = useRef(null);
  const selIdx = options.indexOf(value);

  useEffect(() => {
    if (scrollRef.current && selIdx >= 0) scrollRef.current.scrollTop = selIdx * itemHeight;
    // 마운트 시, 그리고 목록 길이가 바뀔 때(예: 연도가 2026년이 되어 월 목록이
    // 7~12월로 줄어들 때)만 강제로 다시 스크롤 위치를 맞추고, 그 외엔 사용자 스크롤에 맡긴다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length]);

  const settle = () => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.max(0, Math.min(options.length - 1, Math.round(el.scrollTop / itemHeight)));
    el.scrollTo({ top: idx * itemHeight, behavior: "smooth" });
    if (options[idx] !== value) onChange(options[idx]);
  };

  const handleScroll = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(settle, 110);
  };

  const jumpTo = (idx) => {
    onChange(options[idx]);
    scrollRef.current?.scrollTo({ top: idx * itemHeight, behavior: "smooth" });
  };

  return (
    <div style={{ position: "relative", height: containerHeight, overflow: "hidden", flex: 1 }}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ height: containerHeight, overflowY: "scroll", scrollSnapType: "y mandatory" }}
      >
        <div style={{ height: itemHeight * padCount }} />
        {options.map((opt, idx) => {
          const dist = Math.abs(idx - selIdx);
          return (
            <div
              key={opt}
              onClick={() => jumpTo(idx)}
              style={{
                height: itemHeight, scrollSnapAlign: "center", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: dist === 0 ? 19 : 16, fontWeight: dist === 0 ? 800 : 500, cursor: "pointer",
                color: dist === 0 ? C.ink : dist === 1 ? "#B7B2A9" : "#DAD6CE", transition: "color .15s, font-size .15s",
              }}
            >
              {formatLabel(opt)}
            </div>
          );
        })}
        <div style={{ height: itemHeight * padCount }} />
      </div>
      {/* 중앙 선택 밴드 */}
      <div style={{
        position: "absolute", top: itemHeight * padCount, left: 0, right: 0, height: itemHeight,
        borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, pointerEvents: "none",
      }} />
    </div>
  );
}
