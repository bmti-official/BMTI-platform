import { useState, useEffect } from 'react';
import { getHealthRecordConsent, updateHealthRecordConsent } from '../lib/healthConsentSystem';
import { deleteAllHealthRecords } from './HealthRecordDrawer';

export default function HealthRecordSettingsModal({ userId, onClose, onRevoke }) {
  const [consentData, setConsentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConsent = async () => {
      const data = await getHealthRecordConsent(userId);
      setConsentData(data);
      setIsLoading(false);
    };
    loadConsent();
  }, [userId]);

  const [view, setView] = useState('main'); // 'main', 'revoke_confirm', 'delete_all'
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleRevoke = async (deleteRecords = false) => {
    if (deleteRecords) {
      await deleteAllHealthRecords(userId);
    }
    const success = await updateHealthRecordConsent(userId, false);
    if (success) {
      onRevoke();
    } else {
      alert('동의 철회 처리에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleDeleteAll = async () => {
    if (deleteConfirmText !== '삭제') return;
    const success = await deleteAllHealthRecords(userId);
    if (success) {
      alert('모든 건강 기록이 영구 삭제되었습니다.');
      onClose(); // 드로어 닫음
      window.location.reload(); // 새로고침
    } else {
      alert('기록 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl relative">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">건강 기록 설정</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">불러오는 중...</p>
            </div>
          ) : (
            <>
            {view === 'main' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">자동 기록 켜짐</h4>
                      <p className="text-xs text-gray-500">현재 대화에서 건강 정보가 자동 수집되고 있어요.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-3">동의 상세 내역</h4>
                  <div className="space-y-3 bg-white border border-gray-100 rounded-2xl p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">최초 동의일</span>
                      <span className="text-gray-900 font-medium">
                        {consentData?.agreed_at ? new Date(consentData.agreed_at).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">약관 버전</span>
                      <span className="text-gray-900 font-medium">{consentData?.version || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => setView('delete_all')}
                    className="w-full py-4 rounded-2xl border border-red-200 text-red-500 font-bold hover:bg-red-50 transition-colors"
                  >
                    모든 건강 기록 지우기
                  </button>
                  <button
                    onClick={() => setView('revoke_confirm')}
                    className="w-full py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    건강 기록 동의 철회
                  </button>
                </div>
              </div>
            )}

            {view === 'revoke_confirm' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                    🤔
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg mb-2">기존 기록도 지울까요?</h4>
                  <p className="text-sm text-gray-500">
                    동의를 철회하면 더 이상 기록하지 않아요. 
                    <br />지금까지 모인 기록은 어떻게 할까요?
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleRevoke(true)}
                    className="w-full py-4 rounded-2xl border border-red-200 text-red-500 font-bold bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    모두 지우고 철회
                  </button>
                  <button
                    onClick={() => handleRevoke(false)}
                    className="w-full py-4 rounded-2xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                  >
                    기록은 남기고 철회
                  </button>
                  <button
                    onClick={() => setView('main')}
                    className="w-full py-3 mt-2 text-sm text-gray-400 font-bold hover:text-gray-600 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {view === 'delete_all' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg mb-2">모든 기록을 삭제할까요?</h4>
                  <p className="text-sm text-gray-500">
                    모든 건강 기록이 영구 삭제돼요.<br/>이 작업은 되돌릴 수 없어요.
                  </p>
                </div>
                
                <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                  <p className="text-xs text-red-600 font-bold text-center mb-3">
                    정말 삭제하려면 아래에 '삭제'를 입력하세요
                  </p>
                  <input 
                    type="text" 
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="삭제"
                    className="w-full text-center py-3 rounded-xl border border-red-200 focus:outline-none focus:border-red-400 font-bold text-red-600 placeholder-red-300"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleDeleteAll}
                    disabled={deleteConfirmText !== '삭제'}
                    className="w-full py-4 rounded-2xl text-white font-bold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600 active:scale-[0.98]"
                  >
                    영구 삭제
                  </button>
                  <button
                    onClick={() => {
                      setView('main');
                      setDeleteConfirmText('');
                    }}
                    className="w-full py-3 mt-2 text-sm text-gray-400 font-bold hover:text-gray-600 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
