import { supabase } from './supabaseClient';

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ==========================================
// 1:1 채팅 메시지
// ==========================================

export async function getTodayMessages(userId) {
  if (!userId) return [];
  const today = getTodayStr();
  const startOfDay = new Date(today + 'T00:00:00+09:00').toISOString();
  
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfDay)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching today messages:', error);
    return [];
  }
  return data || [];
}

export async function addMessage(userId, sender, content, tokensUsed = 0) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{
      user_id: userId,
      sender,
      content,
      tokens_used: tokensUsed
    }])
    .select('*')
    .single();
    
  if (error) {
    console.error('Error adding message:', error);
    return null;
  }
  return data;
}

// ==========================================
// 대화 기록 보관 (서버 조회)
// ==========================================

export async function getArchives(userId) {
  const { data, error } = await supabase
    .from('chat_archives')
    .select('*')
    .eq('user_id', userId)
    .order('chat_date', { ascending: false });
    
  if (error) return [];
  return data || [];
}

export async function getArchiveById(id) {
  const { data, error } = await supabase
    .from('chat_archives')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) return null;
  return data;
}

// ==========================================
// 기억/요약 시스템
// ==========================================

export async function saveMemory(userId, summary, chatDate) {
  const { data, error } = await supabase
    .from('chat_memories')
    .insert([{
      user_id: userId,
      summary,
      chat_date: chatDate || getTodayStr(),
      is_selected: false
    }])
    .select('*')
    .single();
    
  if (error) return null;
  return data;
}

export async function getAllMemories(userId) {
  const { data, error } = await supabase
    .from('chat_memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) return [];
  return data || [];
}

export async function getSelectedMemories(userId, maxCount = 5) {
  const all = await getAllMemories(userId);
  const selected = all.filter(m => m.is_selected);
  if (selected.length === 0) {
    return all.slice(0, maxCount);
  }
  return selected.slice(0, maxCount);
}

export async function toggleMemorySelection(memoryId, userId, maxCount = 5) {
  const all = await getAllMemories(userId);
  const target = all.find(m => m.id === memoryId);
  
  if (!target) return { success: false, message: '기억을 찾을 수 없습니다.' };
  
  const selectedCount = all.filter(m => m.is_selected && m.id !== memoryId).length;
  if (!target.is_selected && selectedCount >= maxCount) {
    return { success: false, message: `최대 ${maxCount}개까지 선택할 수 있습니다.` };
  }
  
  const { error } = await supabase
    .from('chat_memories')
    .update({ is_selected: !target.is_selected })
    .eq('id', memoryId);
    
  if (error) return { success: false, message: '업데이트 실패' };
  return { success: true, isSelected: !target.is_selected };
}

// ==========================================
// 단톡방 관리
// ==========================================

export async function createGroupRoom(name, ownerId) {
  const { count, error: countError } = await supabase
    .from('group_rooms')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId);
    
  if (countError) return { success: false, message: '서버 오류가 발생했습니다.' };
  if (count >= 3) {
    return { success: false, message: '최대 3개의 단톡방만 개설할 수 있습니다.' };
  }
  
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const { data: room, error: insertError } = await supabase
    .from('group_rooms')
    .insert([{
      owner_id: ownerId,
      name,
      invite_code: inviteCode,
      max_members: 5
    }])
    .select('*')
    .single();
    
  if (insertError) return { success: false, message: '단톡방 생성 실패' };
  
  await supabase.from('group_members').insert([{ room_id: room.id, user_id: ownerId }]);
  return { success: true, room };
}

export async function joinGroupRoom(inviteCode, userId) {
  const { data: room, error } = await supabase
    .from('group_rooms')
    .select('*')
    .eq('invite_code', inviteCode)
    .single();
    
  if (error || !room) return { success: false, message: '유효하지 않은 초대 코드입니다.' };
  
  const { data: members, error: memError } = await supabase
    .from('group_members')
    .select('*')
    .eq('room_id', room.id);
    
  if (memError) return { success: false, message: '서버 오류' };
  if (members.find(m => m.user_id === userId)) {
    return { success: false, message: '이미 참여 중인 방입니다.' };
  }
  if (members.length >= room.max_members) {
    return { success: false, message: '방 인원이 초과되었습니다.' };
  }
  
  const { error: joinError } = await supabase
    .from('group_members')
    .insert([{ room_id: room.id, user_id: userId }]);
    
  if (joinError) return { success: false, message: '참여 실패' };
  return { success: true, room };
}

export async function getMyGroupRooms(userId) {
  const { data, error } = await supabase
    .from('group_members')
    .select('room_id, group_rooms(*)')
    .eq('user_id', userId);
    
  if (error) return [];
  const rooms = data.map(d => d.group_rooms).filter(Boolean);
  
  for (const r of rooms) {
    const { data: mems } = await supabase.from('group_members').select('user_id').eq('room_id', r.id);
    r.members = mems ? mems.map(m => m.user_id) : [];
  }
  return rooms;
}

export async function getGroupMessages(roomId) {
  const today = getTodayStr();
  const startOfDay = new Date(today + 'T00:00:00+09:00').toISOString();
  
  const { data, error } = await supabase
    .from('group_messages')
    .select('*')
    .eq('room_id', roomId)
    .gte('created_at', startOfDay)
    .order('created_at', { ascending: true });
    
  if (error) return [];
  return data || [];
}

export async function addGroupMessage(roomId, userId, senderType, content, bmtiCharacter = null, tokensUsed = 0) {
  const { data, error } = await supabase
    .from('group_messages')
    .insert([{
      room_id: roomId,
      user_id: userId,
      sender_type: senderType,
      bmti_character: bmtiCharacter,
      content,
      tokens_used: tokensUsed
    }])
    .select('*')
    .single();
    
  if (error) return null;
  return data;
}

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
