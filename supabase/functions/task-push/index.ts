// 새 과제 알림 — 강사가 과제를 보내면, 알림을 켜 둔 그 회원의 기기에 한 번 알려 준다.
//
// Supabase Edge Function. 강사의 브라우저가 과제를 보낸 직후에 부른다.
// 필요한 값(Settings → Edge Functions → Secrets): VAPID_PUBLIC · VAPID_PRIVATE · VAPID_SUBJECT (주간 알림과 같은 값)
//
// 누가 불러도 되게 열어 두되, 보낼지 말지는 데이터베이스가 정한다.
//   · 부른 사람의 로그인 표(Authorization)를 그대로 들고 task_notice()를 부른다.
//   · task_notice()가 '활동 중이고 약관에 동의한 강사인가', '그 회원에게 그 플리를 보낸 것이 맞는가'를 보고,
//     같은 과제로 10분 안에 다시 보내지 못하게 한다. 아니면 아무것도 보내지 않는다.
// 부른 쪽에는 '보냈는지'를 알려 주지 않는다(회원이 알림을 켰는지가 강사에게 새지 않게).
//
// web-push 는 Node용이라 esm.sh 로 받으면 Deno에서 터진다. npm: 로 받는다(주간 알림과 같다).
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const tidy = (v: string | undefined) =>
  (v ?? '').replace(/\s+/g, '').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  const out = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return out({ ok: false }, 405);

  try {
    const auth = req.headers.get('Authorization') ?? '';
    if (!auth) return out({ ok: false }, 401);
    const { member, routine } = await req.json().catch(() => ({}));
    if (typeof member !== 'string' || !Number.isFinite(Number(routine))) return out({ ok: false }, 400);

    // 부른 사람의 이름으로 — 보내도 되는지 데이터베이스에 묻는다
    const asCaller = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: notice, error } = await asCaller.rpc('task_notice', { p_member: member, p_routine_id: Number(routine) });
    // 보낼 수 없는 경우에도 같은 답을 준다
    if (error || !notice || notice.ok !== true) return out({ ok: true });

    const pub = tidy(Deno.env.get('VAPID_PUBLIC'));
    const priv = tidy(Deno.env.get('VAPID_PRIVATE'));
    const subj = (Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@bmti-official.co.kr').trim();
    if (pub.length !== 87 || priv.length !== 43) return out({ ok: true });
    webpush.setVapidDetails(subj, pub, priv);

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: subs } = await db.from('push_subscriptions')
      .select('endpoint, p256dh, auth, fail_count').eq('user_id', notice.member_id);

    const title = String(notice.title ?? '').slice(0, 40);
    const body = JSON.stringify({
      title: '새 과제가 왔어요',
      body: `${notice.coach_name} 강사님이 ‘${title}’을(를) 보냈어요.`,
      url: '/?go=task',
      tag: 'coach-task',
    });

    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
        await db.from('push_subscriptions').update({ last_ok_at: new Date().toISOString(), fail_count: 0 }).eq('endpoint', s.endpoint);
      } catch (e) {
        // 404·410이면 그 기기는 사라진 것이다. 바로 지운다.
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        else await db.from('push_subscriptions').update({ fail_count: (s.fail_count ?? 0) + 1 }).eq('endpoint', s.endpoint);
      }
    }
    return out({ ok: true });
  } catch {
    return out({ ok: true });
  }
});
