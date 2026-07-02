import { useState, useEffect, useCallback } from 'react';
import { getMyGroupRooms, createGroupRoom, deleteGroupRoom, joinGroupRoom } from '../lib/chatSystem';
import { CHARACTERS } from '../data';
import { CHARACTER_NAMES } from '../lib/gemini';
import { isSubscriber } from '../lib/tokenSystem';

// ==========================================
// 상수
// ==========================================
const MAX_GROUP_ROOMS = 3;
const INVITE_CODE_LENGTH = 6;

// ==========================================
// 커스텀 훅: 단톡방 관리
// ==========================================
function useGroupRooms(isOpen, userId) {
  const [groupRooms, setGroupRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 목록 불러오기 (race condition 방지)
  useEffect(() => {
    if (!isOpen || !userId) return;
    let cancelled = false;
    setIsLoading(true);

    getMyGroupRooms(userId)
      .then(rooms => {
        if (!cancelled) setGroupRooms(rooms);
      })
      .catch(err => {
        console.error('[ChatDrawer] 단톡방 목록 로드 실패:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [isOpen, userId]);

  // 방 생성
  const handleCreate = useCallback(async () => {
    const name = window.prompt('단톡방 이름을 입력하세요:');
    if (!name || !userId) return;

    setActionLoading(true);
    try {
      const result = await createGroupRoom(name, userId);
      if (result.success) {
        const updatedRooms = await getMyGroupRooms(userId);
        setGroupRooms(updatedRooms);
      } else {
        alert(result.message || '방 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('[ChatDrawer] 방 생성 에러:', err);
      alert('방 생성 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  }, [userId]);

  // 방 삭제
  const handleDelete = useCallback(async (roomId) => {
    if (!window.confirm('정말 삭제하시겠습니까? 이전 대화 기록도 전부 같이 삭제 됩니다.')) return;

    setActionLoading(true);
    try {
      const res = await deleteGroupRoom(roomId);
      if (res.success) {
        setGroupRooms(prev => prev.filter(r => r.id !== roomId));
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('[ChatDrawer] 방 삭제 에러:', err);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  }, []);

  // 방 참여
  const handleJoin = useCallback(async (inviteCode) => {
    if (!userId || inviteCode.length !== INVITE_CODE_LENGTH) return false;

    setActionLoading(true);
    try {
      const result = await joinGroupRoom(inviteCode, userId);
      if (result.success) {
        const updatedRooms = await getMyGroupRooms(userId);
        setGroupRooms(updatedRooms);
        return true;
      } else {
        alert(result.message || '참여에 실패했습니다.');
        return false;
      }
    } catch (err) {
      console.error('[ChatDrawer] 방 참여 에러:', err);
      alert('참여 중 오류가 발생했습니다.');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [userId]);

  return { groupRooms, isLoading, actionLoading, handleCreate, handleDelete, handleJoin };
}

// ==========================================
// 컴포넌트
// ==========================================
const ChatDrawer = ({ isOpen, onClose, setView, userInfo, bmtiCode }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteInput, setInviteInput] = useState('');

  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);
  const charName = CHARACTER_NAMES[axisCode] || 'BMTI 캐릭터';

  const tier = userInfo?.subscription_tier || userInfo?.subscriptionTier || 'free';
  const isPremium = isSubscriber(tier) || userInfo?.isPremium || userInfo?.role === 'admin';

  const { groupRooms, isLoading, actionLoading, handleCreate, handleDelete, handleJoin } =
    useGroupRooms(isOpen, userInfo?.id);

  // 초대코드 입력 필터 (영문 대문자 + 숫자만 허용)
  const handleInviteInputChange = (e) => {
    setInviteInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
  };

  // 초대코드 제출
  const handleInviteSubmit = async () => {
    if (inviteInput.length !== INVITE_CODE_LENGTH || actionLoading) return;
    const ok = await handleJoin(inviteInput);
    if (ok) {
      setShowInviteModal(false);
      setInviteInput('');
    }
  };

  // Enter 키로 초대코드 제출
  const handleInviteKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInviteSubmit();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ease-out backdrop-blur-sm ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={onClose}
        role="presentation"
      />
      
      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-[85%] max-w-sm bg-gray-50 z-[110] transform transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-y-auto ${isOpen ? 'translate-x-0 visible shadow-2xl' : 'translate-x-full invisible shadow-none'}`}
        role="dialog"
        aria-label="BMTI TALK 메뉴"
      >
        <div className="p-5 flex flex-col min-h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900">BMTI TALK</h2>
            <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-black" aria-label="닫기">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* 1:1 대화방 Box */}
            <button
              onClick={() => {
                setView('aichat_room');
                onClose();
              }}
              className="w-full bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all text-left"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c0ff00]/30 to-[#9BB31B]/10 border border-[#9BB31B]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {charData ? <img src={charData.image} alt={charName} className="w-full h-full object-contain scale-110" /> : <span className="text-2xl">💬</span>}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-1">💬 1:1 대화방</h3>
                <p className="text-xs text-gray-400 mt-1">'{charName}'과 대화하기</p>
              </div>
              <div className="ml-auto text-gray-300" aria-hidden="true">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </div>
            </button>

            {/* 단톡방 Box */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">🙋🏻🙋🏻‍♀️ 단톡방</h3>
                <div className="flex gap-2">
                  <button onClick={() => setShowInviteModal(true)} className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
                    🔗 초대코드
                  </button>
                  {isPremium && groupRooms.length < MAX_GROUP_ROOMS && (
                    <button 
                      onClick={handleCreate}
                      disabled={actionLoading}
                      className="text-[11px] font-bold text-white bg-black px-3 py-1.5 rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading ? '처리 중...' : '+ 방 만들기'}
                    </button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="bg-white rounded-[1.5rem] p-6 text-center border border-gray-100">
                  <p className="text-xs text-gray-400">불러오는 중...</p>
                </div>
              ) : groupRooms.length > 0 ? (
                <div className="space-y-2">
                  {groupRooms.map(room => (
                    <div key={room.id} className="relative flex items-center gap-2">
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('OPEN_GROUP_ROOM', { detail: room }));
                          onClose();
                        }}
                        className="flex-1 bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-all text-left min-w-0"
                      >
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">👥</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{room.name}</h4>
                          <p className="text-[11px] text-gray-400 mt-1">{room.members.length}명 참여 · 코드: {room.invite_code || room.inviteCode}</p>
                        </div>
                        <div className="text-gray-300 flex-shrink-0" aria-hidden="true">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                        </div>
                      </button>
                      
                      {room.owner_id === userInfo?.id && (
                        <button
                          type="button"
                          onClick={() => handleDelete(room.id)}
                          disabled={actionLoading}
                          className="text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1.5 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`${room.name} 삭제`}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[1.5rem] p-6 text-center border border-gray-100">
                  <p className="text-xs text-gray-400">참여 중인 단톡방이 없습니다.</p>
                </div>
              )}
            </div>

            {/* 이전 대화 기록 Box */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setView('chat_history');
                  onClose();
                }}
                className="w-full bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-[#c0ff00]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📁</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">📁 이전 대화 기록</h3>
                  <p className="text-xs text-gray-400 mt-1">과거 내역 확인하기</p>
                </div>
                <div className="ml-auto text-gray-300" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-[90%] max-w-sm shadow-2xl" onClick={e => e.stopPropagation()} role="dialog" aria-label="초대코드 입력">
            <h3 className="font-bold text-lg text-gray-900 mb-4">🔗 초대코드 입력</h3>
            <input
              type="text"
              value={inviteInput}
              onChange={handleInviteInputChange}
              onKeyDown={handleInviteKeyDown}
              placeholder={`초대코드 ${INVITE_CODE_LENGTH}자리`}
              maxLength={INVITE_CODE_LENGTH}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-lg font-bold tracking-widest focus:outline-none focus:border-black transition-colors mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setShowInviteModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors">취소</button>
              <button 
                onClick={handleInviteSubmit}
                className="flex-1 py-3 rounded-xl bg-black text-white font-bold text-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                disabled={inviteInput.length !== INVITE_CODE_LENGTH || actionLoading}
              >
                {actionLoading ? '처리 중...' : '참여하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatDrawer;
