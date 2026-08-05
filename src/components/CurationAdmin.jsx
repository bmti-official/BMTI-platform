import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { CURATION_CATEGORIES, curationTheme } from "../lib/curationMeta";

// 관리자(닉네임 BMTI)만 여는 큐레이션 콘텐츠 관리 화면 — 등록/수정/삭제.
// 저장하면 큐레이션 피드에 바로 반영된다(= 화이트보드 메뉴판).
const INK = "#1C1A17", SUB = "#8A8378", LINE = "#EEEAE2";

const EMPTY = {
  title: "", body: "", category: CURATION_CATEGORIES[0], emoji: "",
  author: "말랑 연구소", featured: false, published: true, sort_order: 0,
};

export default function CurationAdmin({ accent, onClose, onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null); // null = 새 콘텐츠
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("curation_content")
      .select("*")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    else { setRows(data || []); setErr(null); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const resetForm = () => { setForm(EMPTY); setEditId(null); };

  const startEdit = (r) => {
    setEditId(r.id);
    setForm({
      title: r.title || "", body: r.body || "", category: r.category || CURATION_CATEGORIES[0],
      emoji: r.emoji || "", author: r.author || "말랑 연구소",
      featured: !!r.featured, published: r.published !== false, sort_order: r.sort_order || 0,
    });
    window.scrollTo?.({ top: 0 });
  };

  const save = async () => {
    if (!form.title.trim()) { alert("제목을 입력해 주세요."); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(), body: form.body.trim() || null, category: form.category,
      emoji: form.emoji.trim() || null, author: form.author.trim() || "말랑 연구소",
      featured: form.featured, published: form.published, sort_order: Number(form.sort_order) || 0,
      updated_at: new Date().toISOString(),
    };
    const q = editId
      ? supabase.from("curation_content").update(payload).eq("id", editId)
      : supabase.from("curation_content").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) { alert("저장 실패: " + error.message); return; }
    resetForm();
    await load();
    onChanged && onChanged();
  };

  const remove = async (r) => {
    if (!window.confirm(`'${r.title}' 콘텐츠를 삭제할까요?`)) return;
    const { error } = await supabase.from("curation_content").delete().eq("id", r.id);
    if (error) { alert("삭제 실패: " + error.message); return; }
    if (editId === r.id) resetForm();
    await load();
    onChanged && onChanged();
  };

  const inputStyle = { width: "100%", boxSizing: "border-box", border: `1px solid ${LINE}`, borderRadius: 12, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: INK, background: "#fff", outline: "none" };
  const labelStyle = { fontSize: 12, fontWeight: 800, color: SUB, marginBottom: 6, display: "block" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(28,26,23,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "92vh", background: "#fff", borderRadius: "24px 24px 0 0", display: "flex", flexDirection: "column", fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 12px", borderBottom: `1px solid ${LINE}` }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: INK }}>🛠 큐레이션 콘텐츠 관리</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 20, color: SUB, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ overflowY: "auto", padding: "16px 20px 28px" }}>
          {/* 등록/수정 폼 */}
          <div style={{ fontSize: 13, fontWeight: 900, color: accent.accentDeep, marginBottom: 12 }}>
            {editId ? "✏️ 콘텐츠 수정" : "➕ 새 콘텐츠 등록"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>제목 *</label>
              <input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} placeholder="예: 굽은 등, 하루 3분이면 펴져요" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>카테고리</label>
                <select style={{ ...inputStyle, appearance: "none" }} value={form.category} onChange={e => set("category", e.target.value)}>
                  {CURATION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ width: 92 }}>
                <label style={labelStyle}>이모지</label>
                <input style={{ ...inputStyle, textAlign: "center" }} value={form.emoji} onChange={e => set("emoji", e.target.value)} placeholder={curationTheme(form.category).emoji} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>본문</label>
              <textarea style={{ ...inputStyle, minHeight: 120, resize: "vertical", lineHeight: 1.6 }} value={form.body} onChange={e => set("body", e.target.value)} placeholder="콘텐츠 내용을 적어주세요. 줄바꿈 그대로 보여져요." />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>작성자</label>
                <input style={inputStyle} value={form.author} onChange={e => set("author", e.target.value)} />
              </div>
              <div style={{ width: 92 }}>
                <label style={labelStyle}>정렬</label>
                <input type="number" style={inputStyle} value={form.sort_order} onChange={e => set("sort_order", e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 2 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 700, color: INK, cursor: "pointer" }}>
                <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} /> 이달의 추천(히어로)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 700, color: INK, cursor: "pointer" }}>
                <input type="checkbox" checked={form.published} onChange={e => set("published", e.target.checked)} /> 공개
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={save} disabled={saving}
                style={{ flex: 1, border: "none", borderRadius: 13, padding: 14, fontSize: 14.5, fontWeight: 900, fontFamily: "inherit", color: "#fff", background: accent.accentDeep, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "저장 중…" : editId ? "수정 저장" : "등록하기"}
              </button>
              {editId && (
                <button onClick={resetForm} style={{ border: `1px solid ${LINE}`, borderRadius: 13, padding: "14px 18px", fontSize: 14, fontWeight: 800, fontFamily: "inherit", color: SUB, background: "#fff", cursor: "pointer" }}>취소</button>
              )}
            </div>
          </div>

          {/* 목록 */}
          <div style={{ fontSize: 13, fontWeight: 900, color: INK, margin: "26px 0 12px" }}>
            등록된 콘텐츠 {rows.length > 0 && `(${rows.length})`}
          </div>
          {err && <div style={{ fontSize: 12.5, color: "#C0392B", background: "#FDECEA", borderRadius: 12, padding: 12, marginBottom: 12, lineHeight: 1.5 }}>불러오기 오류: {err}<br />테이블(curation_content)이 아직 없으면 안내해 드린 SQL을 먼저 실행해 주세요.</div>}
          {loading ? (
            <div style={{ fontSize: 13, color: SUB, textAlign: "center", padding: 20 }}>불러오는 중…</div>
          ) : rows.length === 0 ? (
            <div style={{ fontSize: 13, color: SUB, textAlign: "center", padding: 20 }}>아직 등록된 콘텐츠가 없어요.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rows.map(r => {
                const th = curationTheme(r.category);
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 11, border: `1px solid ${LINE}`, borderRadius: 14, padding: 10, background: r.published ? "#fff" : "#FAF8F4" }}>
                    <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 11, background: th.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{r.emoji || th.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: SUB, fontWeight: 600, marginTop: 3 }}>
                        {r.category} · 조회 {r.views || 0}{r.featured ? " · ⭐추천" : ""}{r.published ? "" : " · 비공개"}
                      </div>
                    </div>
                    <button onClick={() => startEdit(r)} style={{ border: "none", background: "transparent", color: accent.accentDeep, fontSize: 12.5, fontWeight: 800, cursor: "pointer", padding: 4 }}>수정</button>
                    <button onClick={() => remove(r)} style={{ border: "none", background: "transparent", color: "#C0392B", fontSize: 12.5, fontWeight: 800, cursor: "pointer", padding: 4 }}>삭제</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
