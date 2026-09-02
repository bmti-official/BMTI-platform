import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fiesnznufryrkxcpwuja.supabase.co';
const supabaseKey = 'sb_publishable_eJEbt-Raw_UTFDDghG9nqQ_x32PXONo';

// 관리자 페이지와 손님 앱은 주소가 같아서, 그냥 두면 로그인 정보를 한 칸에 같이 쓴다.
// 그러면 손님 앱에서 카카오로 로그인하는 순간 관리자 로그인이 덮어써져,
// 큐레이션·바로카드 저장이 '권한 없음'으로 막힌다.
// 그래서 보관하는 칸 이름을 서로 다르게 준다.
const isAdminPage = typeof window !== 'undefined' && /(^|\/)admin(\.html)?$/.test(window.location.pathname);
const storageKey = isAdminPage ? 'bmti-admin-auth' : 'bmti-user-auth';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { storageKey, persistSession: true, autoRefreshToken: true },
});
