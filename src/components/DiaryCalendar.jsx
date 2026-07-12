import { useState, useRef, useEffect } from "react";
import { Mallang } from "./Mallang";
import { MOODS } from "../data";
import {
  getDiaryHistory, getEntryForDate, todayISO,
  getEntriesSinceWeeklyBaseline, canClaimWeeklyReport, setWeeklyReportBaseline, markWeeklyReportIssued,
  getPrevMonthEntryCount, canClaimMonthlyReport, getPrevMonthKey, markMonthlyReportIssued,
  isDayWritable,
} from "../lib/diaryHistory";

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

export default function DiaryCalendar({ onPickMood, onEditDay }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [, setReportTick] = useState(0); // 리포트 수령 후 활성 조건을 강제로 다시 계산시키는 용도
  const year = cursor.getFullYear();
  const month = cursor.getMonth(); // 0-indexed
  const monthKey = `${year}-${pad(month + 1)}`;
  const todayStr = todayISO();

  const history = getDiaryHistory();
  const entryCountThisMonth = history.filter(e => e.date.startsWith(monthKey)).length;
  const todayEntry = getEntryForDate(todayStr);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const weeklyActive = canClaimWeeklyReport();
  const weeklyProgress = Math.min(getEntriesSinceWeeklyBaseline(), 7);
  const monthlyActive = canClaimMonthlyReport();
  const monthlyProgress = Math.min(getPrevMonthEntryCount(), 10);

  const claimWeeklyReport = () => {
    if (!weeklyActive) return;
    setWeeklyReportBaseline(getDiaryHistory().length);
    markWeeklyReportIssued(); // 발행 시점까지의 기록은 이제 수정 불가
    setReportTick(t => t + 1);
    alert("📋 주간 리포트는 곧 만나볼 수 있어요! 열심히 준비하고 있어요.");
  };

  const claimMonthlyReport = () => {
    if (!monthlyActive) return;
    markMonthlyReportIssued(getPrevMonthKey()); // 리포트로 나간 달의 기록은 이제 수정 불가
    setReportTick(t => t + 1);
    alert("📊 월간 리포트는 곧 만나볼 수 있어요! 열심히 준비하고 있어요.");
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", justifyContent: "center", fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>
      <div style={{ width: "100%", maxWidth: 420, minHeight: "100vh", display: "flex", flexDirection: "column", padding: "140px 20px 40px" }}>

        {/* 헤더 */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <button
            onClick={() => setShowDatePicker(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer", padding: "4px 8px" }}
          >
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", color: C.ink }}>{year}년 {month + 1}월</h1>
            <span style={{ fontSize: 12, color: C.sub, transform: "translateY(1px)" }}>▼</span>
          </button>
          <p style={{ fontSize: 13.5, color: C.sub, margin: "8px 0 0" }}>총 {entryCountThisMonth}일 기록했어요</p>
        </div>

        {/* 요일 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: weekdayColor(i) || C.sub, padding: "6px 0" }}>{w}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 14 }}>
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

        {/* 오늘 기록 카드 */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "26px 22px", marginTop: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          {todayEntry ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Mallang v={todayEntry.mood} size={48} /></div>
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>오늘 기록 완료했어요 ✓</p>
              <p style={{ fontSize: 12.5, color: C.sub, margin: "6px 0 0" }}>내일 또 만나요!</p>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 6px", textAlign: "center" }}>오늘 기분은 어떤 말랑이에 가까워요?</h3>
              <p style={{ fontSize: 12.5, color: C.sub, textAlign: "center", margin: "0 0 18px" }}>지금 마음에 가장 가까운 표정을 골라주세요.</p>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                {MOODS.map(m => (
                  <button key={m.v} onClick={() => onPickMood && onPickMood(m.v)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "6px 2px", borderRadius: 14, border: "none", background: "transparent", cursor: "pointer" }}>
                    <Mallang v={m.v} size={44} />
                    <span style={{ fontSize: 9.5, color: C.sub, fontWeight: 700, whiteSpace: "nowrap" }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 주간/월간 리포트 버튼 */}
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <ReportButton
            label="📋 주간 리포트"
            active={weeklyActive}
            progressLabel={`${weeklyProgress}/7`}
            onClick={claimWeeklyReport}
          />
          <ReportButton
            label="📊 월간 리포트"
            active={monthlyActive}
            progressLabel={`${monthlyProgress}/10`}
            onClick={claimMonthlyReport}
          />
        </div>
      </div>

      {showDatePicker && (
        <DatePickerModal
          year={year}
          month={month}
          onCancel={() => setShowDatePicker(false)}
          onConfirm={(y, m) => { setCursor(new Date(y, m, 1)); setShowDatePicker(false); }}
        />
      )}
    </div>
  );
}

function ReportButton({ label, active, progressLabel, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "14px 10px", borderRadius: 18, border: active ? "none" : `1px solid ${C.line}`,
        background: active ? C.ink : "#FBFAF8", color: active ? "#fff" : C.sub,
        cursor: active ? "pointer" : "default", textAlign: "center",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 3, opacity: active ? 0.7 : 1 }}>
        {active ? "받으러 가기" : `${progressLabel} 기록하면 열려요`}
      </div>
    </button>
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
