// 방문자 수 추적 — Supabase에 저장, localStorage로 하루 1회 중복 방지
// KST(UTC+9) 기준으로 날짜를 판정하며, 자정이 지나면 '오늘' 카운트가 0에서 다시 시작된다.
import { supabase } from "./supabaseClient";

const LS_KEY = "bmti_visitor_date";

// KST 기준 오늘 날짜 문자열 (YYYY-MM-DD)
function todayKST() {
  const now = new Date();
  // UTC에 +9시간을 더해 KST 기준 날짜를 구한다
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// 오늘 이미 카운트했는지 확인 (localStorage 기반)
function alreadyCounted() {
  try {
    return localStorage.getItem(LS_KEY) === todayKST();
  } catch {
    return false;
  }
}

// 카운트 완료 표시
function markCounted() {
  try {
    localStorage.setItem(LS_KEY, todayKST());
  } catch {
    // localStorage가 비활성화된 환경에서도 크래시하지 않도록
  }
}

// ── 방문 기록 ──
// 1) 오늘 날짜의 visitor_counts 행에 +1 (없으면 삽입)
// 2) visitor_total 행에 +1
export async function recordVisit() {
  if (alreadyCounted()) return;

  const date = todayKST();

  try {
    // upsert: 오늘 행이 없으면 today_count=1 로 삽입, 있으면 +1
    const { data: existing } = await supabase
      .from("visitor_counts")
      .select("today_count")
      .eq("date_kst", date)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("visitor_counts")
        .update({ today_count: existing.today_count + 1 })
        .eq("date_kst", date);
    } else {
      await supabase
        .from("visitor_counts")
        .insert({ date_kst: date, today_count: 1 });
    }

    // 누적 +1
    const { data: totalRow } = await supabase
      .from("visitor_total")
      .select("total_count")
      .eq("id", 1)
      .single();

    if (totalRow) {
      await supabase
        .from("visitor_total")
        .update({ total_count: totalRow.total_count + 1 })
        .eq("id", 1);
    }

    markCounted();
  } catch (err) {
    console.error("[visitorTracker] recordVisit error:", err);
  }
}

// ── 카운트 조회 ──
// { today, total } 를 반환한다.
export async function fetchVisitorCounts() {
  const date = todayKST();
  // 월간 = 오늘 포함 최근 30일(오늘부터 한 달 전까지) 방문자 합계
  const monthStart = (() => {
    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    kst.setDate(kst.getDate() - 29);
    return kst.toISOString().slice(0, 10);
  })();

  try {
    // 오늘·월간·누적 모두 visitor_counts(일별 순방문)에서 일관되게 계산한다.
    // 누적 = 전체 기간의 일별 방문 합계이므로, 최근 30일 월간은 항상 누적의 부분집합(월간 ≤ 누적).
    // (별도 visitor_total 카운터는 증가 누락 시 월간보다 작아질 수 있어 표시에서 제외)
    const [{ data: todayRow }, { data: monthRows }, { data: allRows }, { data: totalRow }] = await Promise.all([
      supabase.from("visitor_counts").select("today_count").eq("date_kst", date).maybeSingle(),
      supabase.from("visitor_counts").select("today_count").gte("date_kst", monthStart),
      supabase.from("visitor_counts").select("today_count"),
      supabase.from("visitor_total").select("total_count").eq("id", 1).maybeSingle(),
    ]);

    const monthly = (monthRows || []).reduce((s, r) => s + (r.today_count || 0), 0);
    const sumAll = (allRows || []).reduce((s, r) => s + (r.today_count || 0), 0);
    // 혹시 수기로 더 크게 세팅해 둔 누적 카운터가 있으면 그 값을 존중하되, 최소 일별 합계 이상으로 보정.
    const total = Math.max(sumAll, totalRow?.total_count ?? 0);

    return { today: todayRow?.today_count ?? 0, monthly, total };
  } catch (err) {
    console.error("[visitorTracker] fetchVisitorCounts error:", err);
    return { today: 0, monthly: 0, total: 0 };
  }
}
