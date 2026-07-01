/**
 * 채팅 시스템 유틸리티
 * 대화 저장, 일일 초기화, 7일 보관, 기억 관리
 */

const CHAT_MESSAGES_KEY = 'bmti_chat_messages';
const CHAT_ARCHIVES_KEY = 'bmti_chat_archives';
const CHAT_MEMORIES_KEY = 'bmti_chat_memories';
const GROUP_ROOMS_KEY = 'bmti_group_rooms';
const GROUP_MESSAGES_KEY = 'bmti_group_messages';

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// ==========================================
// 1:1 채팅 메시지
// ==========================================

/**
 * 오늘의 1:1 채팅 메시지 가져오기
 */
export function getTodayMessages() {
  try {
    const data = JSON.parse(localStorage.getItem(CHAT_MESSAGES_KEY) || '{}');
    if (data.date !== getTodayStr()) {
      // 새 날 → 어제 대화를 아카이브에 저장하고 초기화
      if (data.date && data.messages && data.messages.length > 0) {
        archiveMessages('direct', null, data.date, data.messages);
      }
      return [];
    }
    return data.messages || [];
  } catch {
    return [];
  }
}

/**
 * 1:1 채팅 메시지 저장
 */
export function saveTodayMessages(messages) {
  localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify({
    date: getTodayStr(),
    messages
  }));
}

/**
 * 1:1 채팅에 메시지 추가
 */
export function addMessage(message) {
  const messages = getTodayMessages();
  messages.push({
    ...message,
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  saveTodayMessages(messages);
  return messages;
}

// ==========================================
// 대화 기록 보관 (7일)
// ==========================================

/**
 * 대화를 아카이브에 저장
 */
export function archiveMessages(roomType, roomId, chatDate, messages) {
  const archives = JSON.parse(localStorage.getItem(CHAT_ARCHIVES_KEY) || '[]');
  
  // 이미 같은 날짜의 아카이브가 있으면 업데이트
  const existingIdx = archives.findIndex(a => a.chatDate === chatDate && a.roomType === roomType && a.roomId === roomId);
  if (existingIdx >= 0) {
    archives[existingIdx].messages = messages;
  } else {
    archives.push({
      id: Date.now(),
      roomType,
      roomId,
      chatDate,
      messages,
      createdAt: new Date().toISOString()
    });
  }
  
  // 7일 초과 기록 삭제
  const sevenDaysAgo = getDateDaysAgo(7);
  const filtered = archives.filter(a => a.chatDate >= sevenDaysAgo);
  
  localStorage.setItem(CHAT_ARCHIVES_KEY, JSON.stringify(filtered));
}

/**
 * 아카이브 목록 조회
 */
export function getArchives() {
  const archives = JSON.parse(localStorage.getItem(CHAT_ARCHIVES_KEY) || '[]');
  const sevenDaysAgo = getDateDaysAgo(7);
  return archives.filter(a => a.chatDate >= sevenDaysAgo).sort((a, b) => b.chatDate.localeCompare(a.chatDate));
}

/**
 * 특정 아카이브 조회
 */
export function getArchiveById(id) {
  const archives = JSON.parse(localStorage.getItem(CHAT_ARCHIVES_KEY) || '[]');
  return archives.find(a => a.id === id);
}

// ==========================================
// 기억/요약 시스템
// ==========================================

/**
 * 기억(요약) 저장
 */
export function saveMemory(summary, chatDate) {
  const memories = JSON.parse(localStorage.getItem(CHAT_MEMORIES_KEY) || '[]');
  memories.push({
    id: Date.now(),
    summary,
    chatDate: chatDate || getTodayStr(),
    isSelected: false,
    createdAt: new Date().toISOString()
  });
  
  // 최근 30개만 보관
  if (memories.length > 30) memories.splice(0, memories.length - 30);
  
  localStorage.setItem(CHAT_MEMORIES_KEY, JSON.stringify(memories));
  return memories;
}

/**
 * 모든 기억 조회
 */
export function getAllMemories() {
  return JSON.parse(localStorage.getItem(CHAT_MEMORIES_KEY) || '[]')
    .sort((a, b) => b.chatDate.localeCompare(a.chatDate));
}

/**
 * 선택된 기억 조회 (최대 maxCount개)
 */
export function getSelectedMemories(maxCount = 5) {
  const all = getAllMemories();
  const selected = all.filter(m => m.isSelected);
  
  // 선택된 것이 없으면 최근 maxCount개 반환
  if (selected.length === 0) {
    return all.slice(0, maxCount);
  }
  
  return selected.slice(0, maxCount);
}

/**
 * 기억 선택/해제 토글
 */
export function toggleMemorySelection(memoryId, maxCount = 5) {
  const memories = JSON.parse(localStorage.getItem(CHAT_MEMORIES_KEY) || '[]');
  const target = memories.find(m => m.id === memoryId);
  
  if (!target) return { success: false, message: '기억을 찾을 수 없습니다.' };
  
  // 이미 선택된 개수 확인
  const selectedCount = memories.filter(m => m.isSelected && m.id !== memoryId).length;
  
  if (!target.isSelected && selectedCount >= maxCount) {
    return { success: false, message: `최대 ${maxCount}개까지 선택할 수 있습니다.` };
  }
  
  target.isSelected = !target.isSelected;
  localStorage.setItem(CHAT_MEMORIES_KEY, JSON.stringify(memories));
  
  return { success: true, isSelected: target.isSelected };
}

// ==========================================
// 단톡방 관리
// ==========================================

/**
 * 단톡방 생성
 */
export function createGroupRoom(name, ownerId) {
  const rooms = JSON.parse(localStorage.getItem(GROUP_ROOMS_KEY) || '[]');
  
  // 방장이 만든 방 개수 체크 (최대 3개)
  const ownerRooms = rooms.filter(r => r.ownerId === ownerId);
  if (ownerRooms.length >= 3) {
    return { success: false, message: '최대 3개의 단톡방만 개설할 수 있습니다.' };
  }
  
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newRoom = {
    id: `room_${Date.now()}`,
    ownerId,
    name,
    inviteCode,
    maxMembers: 5,
    members: [ownerId],
    morningTime: '08:00',
    lunchTime: '12:00',
    lunchEnabled: true,
    dinnerTime: '19:00',
    dinnerEnabled: true,
    lateEveningTime: '21:00',
    lateEveningEnabled: true,
    createdAt: new Date().toISOString()
  };
  
  rooms.push(newRoom);
  localStorage.setItem(GROUP_ROOMS_KEY, JSON.stringify(rooms));
  
  return { success: true, room: newRoom };
}

/**
 * 초대 코드로 방 참여
 */
export function joinGroupRoom(inviteCode, userId) {
  const rooms = JSON.parse(localStorage.getItem(GROUP_ROOMS_KEY) || '[]');
  const room = rooms.find(r => r.inviteCode === inviteCode);
  
  if (!room) return { success: false, message: '유효하지 않은 초대 코드입니다.' };
  if (room.members.includes(userId)) return { success: false, message: '이미 참여 중인 방입니다.' };
  if (room.members.length >= room.maxMembers) return { success: false, message: '방 인원이 초과되었습니다.' };
  
  room.members.push(userId);
  localStorage.setItem(GROUP_ROOMS_KEY, JSON.stringify(rooms));
  
  return { success: true, room };
}

/**
 * 내 단톡방 목록
 */
export function getMyGroupRooms(userId) {
  const rooms = JSON.parse(localStorage.getItem(GROUP_ROOMS_KEY) || '[]');
  return rooms.filter(r => r.members.includes(userId));
}

/**
 * 단톡방 메시지 관리
 */
export function getGroupMessages(roomId) {
  try {
    const allMessages = JSON.parse(localStorage.getItem(GROUP_MESSAGES_KEY) || '{}');
    const roomData = allMessages[roomId];
    if (!roomData || roomData.date !== getTodayStr()) {
      // 새 날 → 아카이브 후 초기화
      if (roomData && roomData.messages && roomData.messages.length > 0) {
        archiveMessages('group', roomId, roomData.date, roomData.messages);
      }
      return [];
    }
    return roomData.messages || [];
  } catch {
    return [];
  }
}

export function addGroupMessage(roomId, message) {
  const allMessages = JSON.parse(localStorage.getItem(GROUP_MESSAGES_KEY) || '{}');
  
  if (!allMessages[roomId] || allMessages[roomId].date !== getTodayStr()) {
    allMessages[roomId] = { date: getTodayStr(), messages: [] };
  }
  
  allMessages[roomId].messages.push({
    ...message,
    id: Date.now() + Math.random(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  
  localStorage.setItem(GROUP_MESSAGES_KEY, JSON.stringify(allMessages));
  return allMessages[roomId].messages;
}

/**
 * 단톡방 @BMTI 사용량 관리
 */
const GROUP_BMTI_USAGE_KEY = 'bmti_group_usage';

export function getGroupBmtiUsage(roomId) {
  try {
    const data = JSON.parse(localStorage.getItem(GROUP_BMTI_USAGE_KEY) || '{}');
    const roomUsage = data[roomId];
    if (!roomUsage || roomUsage.date !== getTodayStr()) {
      return { used: 0, bonus: 0 };
    }
    return roomUsage;
  } catch {
    return { used: 0, bonus: 0 };
  }
}

export function useGroupBmtiCall(roomId) {
  const data = JSON.parse(localStorage.getItem(GROUP_BMTI_USAGE_KEY) || '{}');
  if (!data[roomId] || data[roomId].date !== getTodayStr()) {
    data[roomId] = { date: getTodayStr(), used: 0, bonus: 0 };
  }
  data[roomId].used += 1;
  localStorage.setItem(GROUP_BMTI_USAGE_KEY, JSON.stringify(data));
  return data[roomId];
}
