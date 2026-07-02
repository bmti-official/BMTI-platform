import { useState, useEffect } from 'react';
import { getHealthRecordConsent, updateHealthRecordConsent } from '../lib/healthConsentSystem';

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

  const handleRevoke = async () => {
    if (confirm('건강 기록 동의를 철회하시겠습니까?\n철회 후에는 대화 중 건강 기록이 자동으로 수집되지 않습니다.')) {
      const success = await updateHealthRecordConsent(userId, false);
      if (success) {
        onRevoke();
      } else {
        alert('동의 철회 처리에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
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
            <div className="space-y-6">
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

              <div className="pt-2">
                <button
                  onClick={handleRevoke}
                  className="w-full py-4 rounded-2xl border border-red-200 text-red-500 font-bold bg-red-50 hover:bg-red-100 transition-colors"
                >
                  건강 기록 동의 철회
                </button>
                <p className="text-center text-[11px] text-gray-400 mt-3">
                  기존에 수집된 기록은 삭제되지 않으며 개별 삭제가 가능합니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
