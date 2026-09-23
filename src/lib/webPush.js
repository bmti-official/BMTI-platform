// 웹 푸시 — 이 기기에서 알림을 받을지 켜고 끈다.
//
// 카카오 알림톡은 휴대폰 번호·비즈앱 검수·템플릿 심사·건당 과금이 필요하다.
// 웹 푸시는 공짜고 동의도 브라우저 권한 한 번이라 여기서 시작한다.
// 다만 아이폰은 **홈 화면에 추가해야** 받을 수 있다(16.4+).
import { supabase } from './supabaseClient';

export const VAPID_PUBLIC = 'BIwV8-0rBYCNk7dFZwICZfvYEArKXFV2VDLD_wJlMPyoETCC1RzGNuJm-vcsWQHl9Etbcq6NeMEFbM4Zp292aEI';

const toBytes = (b64) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

/** 이 기기가 푸시를 받을 수 있는가. 아이폰은 홈 화면에 추가해야 true가 된다. */
export function canPush() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** 아이폰에서 홈 화면에 추가하지 않은 상태인지 — 안내 문구를 달리 보여 주려고 본다. */
export function needsHomeScreen() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone;
  return ios && !standalone;
}

const me = () => {
  try { return JSON.parse(localStorage.getItem('bmti_user') || 'null')?.id || null; } catch { return null; }
};

/** 켜기 — 브라우저 권한을 묻고, 받은 주소를 서버에 담아 둔다. */
export async function turnOn() {
  if (!canPush()) return { ok: false, why: '이 기기에서는 알림을 받을 수 없어요.' };
  const userId = me();
  if (!userId) return { ok: false, why: '로그인한 뒤에 켤 수 있어요.' };

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, why: '알림을 허용해 주셔야 보내 드릴 수 있어요.' };

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(VAPID_PUBLIC) })
    .catch(() => null);
  if (!sub) return { ok: false, why: '알림 등록에 실패했어요. 잠시 뒤 다시 해 주세요.' };

  const j = sub.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: j.endpoint, user_id: userId,
    p256dh: j.keys.p256dh, auth: j.keys.auth,
    ua: navigator.userAgent.slice(0, 200),
  }, { onConflict: 'endpoint' });
  if (error) return { ok: false, why: '알림 등록에 실패했어요: ' + error.message };

  await supabase.from('users').update({ push_weekly: true }).eq('id', userId);
  return { ok: true };
}

/** 끄기 — 이 기기의 주소를 지운다. 다른 기기는 그대로 둔다. */
export async function turnOff() {
  const userId = me();
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  const sub = reg && await reg.pushManager.getSubscription();
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    await sub.unsubscribe().catch(() => {});
  }
  if (userId) await supabase.from('users').update({ push_weekly: false }).eq('id', userId);
  return { ok: true };
}

/** 지금 이 기기가 켜져 있는가 */
export async function isOn() {
  if (!canPush()) return false;
  if (Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  return !!(reg && await reg.pushManager.getSubscription());
}
