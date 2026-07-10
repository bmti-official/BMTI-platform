import { useState } from "react";
import { Mallang } from "./Mallang";
import { MOODS } from "../data";
import { getDiaryHistory, getEntryForDate, todayISO } from "../lib/diaryHistory";

const C = {
  bg: "#F7F6F3", card: "#FFFFFF", ink: "#1C1A17", sub: "#9B9489", line: "#EDE9E2",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n) => String(n).padStart(2, "0");

export default function DiaryCalendar({ onPickMood }) {
  const [cursor] = useState(() => new Date()); // 현재는 이번 달만 보여줌
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

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", justifyContent: "center", fontFamily: "'Pretendard',-apple-system,sans-serif", color: C.ink }}>
      <div style={{ width: "100%", maxWidth: 420, minHeight: "100vh", display: "flex", flexDirection: "column", padding: "140px 20px 40px" }}>

        {/* 헤더 */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>{month + 1}월</h1>
          <p style={{ fontSize: 13.5, color: C.sub, margin: "8px 0 0" }}>이번 달 {entryCountThisMonth}일 기록했어요</p>
        </div>

        {/* 요일 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
          {WEEKDAYS.map(w => (
            <div key={w} style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: C.sub, padding: "6px 0" }}>{w}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 14 }}>
          {cells.map((d, idx) => {
            if (!d) return <div key={idx} />;
            const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
            const entry = getEntryForDate(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {entry ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <Mallang v={entry.mood} size={36} />
                  </div>
                ) : isToday ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800 }}>
                      {d}
                    </div>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#E0554F" }} />
                  </div>
                ) : (
                  <span style={{ fontSize: 15, color: "#C9C4BB", fontWeight: 500 }}>{d}</span>
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
      </div>
    </div>
  );
}
