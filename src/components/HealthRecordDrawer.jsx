import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// ==========================================
// 건강 기록 카테고리 정의 (MVP 5종)
// ==========================================
export const HEALTH_CATEGORIES = [
  { id: 'diet',     icon: '🍎', label: '식습관/영양', accent: 'bg-orange-50 text-orange-600 border-orange-100', dot: 'bg-orange-400' },
  { id: 'sleep',    icon: '😴', label: '수면',        accent: 'bg-indigo-50 text-indigo-600 border-indigo-100', dot: 'bg-indigo-400' },
  { id: 'exercise', icon: '💪', label: '운동/활동',    accent: 'bg-[#c0ff00]/20 text-[#5c6b00] border-[#c0ff00]/30', dot: 'bg-[#9BB31B]' },
  { id: 'mental',   icon: '🧠', label: '정서/멘탈',    accent: 'bg-purple-50 text-purple-600 border-purple-100', dot: 'bg-purple-400' },
  { id: 'symptom',  icon: '🩺', label: '증상/컨디션',  accent: 'bg-rose-50 text-rose-600 border-rose-100', dot: 'bg-rose-400' },
];

// ==========================================
// API: 건강 기록 조회
// ==========================================
export async function getHealthRecords(userId) {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[HealthRecord] 조회 실패:', error);
    return {};
  }

  // 카테고리별로 그룹핑
  const grouped = {};
  for (const cat of HEALTH_CATEGORIES) {
    grouped[cat.id] = [];
  }
  for (const record of (data || [])) {
    if (grouped[record.category]) {
      grouped[record.category].push({
        id: record.id,
        summary: record.summary,
        date: new Date(record.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }),
      });
    }
  }
  return grouped;
}

export async function addHealthRecord(userId, category, summary) {
  const { data, error } = await supabase
    .from('health_records')
    .insert([{ user_id: userId, category, summary }])
    .select('*')
    .single();
  
  if (error) {
    console.error('[HealthRecord] 저장 실패:', error);
    return null;
  }
  return data;
}

export async function deleteHealthRecord(recordId) {
  const { error } = await supabase
    .from('health_records')
    .delete()
    .eq('id', recordId);
  return !error;
}

// ==========================================
// 커스텀 훅: 건강 기록 관리
// ==========================================
export function useHealthRecords(isOpen, userId) {
  const [entries, setEntries] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;
    let cancelled = false;
    setIsLoading(true);

    getHealthRecords(userId)
      .then(data => {
        if (!cancelled) setEntries(data);
      })
      .catch(err => console.error('[HealthRecord] 로드 에러:', err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [isOpen, userId]);

  const addEntry = useCallback(async (category, summary) => {
    if (!userId) return null;
    const record = await addHealthRecord(userId, category, summary);
    if (record) {
      setEntries(prev => ({
        ...prev,
        [category]: [
          { id: record.id, summary: record.summary, date: new Date(record.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) },
          ...(prev[category] || []),
        ],
      }));
    }
    return record;
  }, [userId]);

  const removeEntry = useCallback(async (recordId, category) => {
    const ok = await deleteHealthRecord(recordId);
    if (ok) {
      setEntries(prev => ({
        ...prev,
        [category]: (prev[category] || []).filter(e => e.id !== recordId),
      }));
    }
    return ok;
  }, []);

  const totalEntries = Object.values(entries).reduce((sum, arr) => sum + arr.length, 0);

  return { entries, isLoading, totalEntries, addEntry, removeEntry };
}

// ==========================================
// 개별 카테고리 카드 (아코디언)
// ==========================================
function CategoryCard({ category, entries, isOpen, onToggle, onDelete }) {
  const latest = entries[0];

  return (
    <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-3 text-left" aria-expanded={isOpen}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${category.accent}`}>
          <span className="text-xl">{category.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-gray-900 text-sm">{category.label}</h4>
            {entries.length > 0 && (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {entries.length}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {latest ? latest.summary : '아직 기록된 내용이 없어요'}
          </p>
        </div>
        <svg className={`w-5 h-5 text-gray-300 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 border-t border-gray-50">
            {entries.length > 0 ? (
              <ul className="space-y-2.5 mt-2">
                {entries.map(entry => (
                  <li key={entry.id} className="flex gap-2.5 group/item">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${category.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-relaxed">{entry.summary}</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">{entry.date}</p>
                    </div>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(entry.id, category.id)}
                        className="opacity-0 group-hover/item:opacity-100 text-[10px] text-red-400 hover:text-red-600 flex-shrink-0 transition-opacity"
                        aria-label="기록 삭제"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-300 text-center py-4">
                대화 중 관련 내용이 나오면 자동으로 기록돼요
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 자동 저장 토스트 (채팅 중 AI 카테고리 감지 시)
// ==========================================
export function AutoSaveToast({ category, onDismiss }) {
  if (!category) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[130] animate-[fadeSlideUp_0.3s_ease-out]">
      <div className="bg-gray-900 text-white rounded-full pl-2 pr-4 py-2 flex items-center gap-2 shadow-xl">
        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90">
          <span className="text-sm">{category.icon}</span>
        </div>
        <span className="text-xs font-bold">{category.label}에 기록되었어요</span>
        <button onClick={onDismiss} className="ml-1 text-white/50 hover:text-white text-xs" aria-label="닫기">✕</button>
      </div>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
    </div>
  );
}

// ==========================================
// 건강 기록 드로어 (메인 컴포넌트)
// ==========================================
export default function HealthRecordDrawer({ isOpen, onClose, characterName, userId }) {
  const [openId, setOpenId] = useState(null);
  const { entries, isLoading, totalEntries, removeEntry } = useHealthRecords(isOpen, userId);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ease-out backdrop-blur-sm ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={onClose}
        role="presentation"
      />
      <div
        role="dialog"
        aria-label="건강 기록"
        className={`fixed inset-y-0 right-0 w-[85%] max-w-sm bg-gray-50 z-[110] transform transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-y-auto ${isOpen ? 'translate-x-0 visible shadow-2xl' : 'translate-x-full invisible shadow-none'}`}
      >
        <div className="p-5 flex flex-col min-h-full">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-xl font-black text-gray-900">건강 기록</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{characterName}와의 대화에서 자동으로 정리돼요</p>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-black" aria-label="닫기">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 요약 배너 */}
          <div className="bg-black rounded-[1.5rem] p-4 flex items-center justify-between mb-5">
            <div>
              <p className="text-white/50 text-[11px] font-bold">누적 기록</p>
              <p className="text-white font-black text-2xl mt-0.5">{isLoading ? '...' : `${totalEntries}개`}</p>
            </div>
            <span className="text-3xl">📋</span>
          </div>

          {/* 카테고리 리스트 */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-xs text-gray-400">불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {HEALTH_CATEGORIES.map(category => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  entries={entries[category.id] || []}
                  isOpen={openId === category.id}
                  onToggle={() => setOpenId(prev => (prev === category.id ? null : category.id))}
                  onDelete={removeEntry}
                />
              ))}
            </div>
          )}

          <p className="text-center text-[11px] text-gray-300 pt-4 pb-1 mt-auto">
            기록은 언제든 삭제할 수 있고, 대화 분석 외 다른 목적으로 사용되지 않아요
          </p>
        </div>
      </div>
    </>
  );
}
