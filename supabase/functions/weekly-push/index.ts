// 주간 '각도기록' 알림 — 이번 주에 아직 안 잰 사람에게만 한 번 보낸다.
//
// Supabase Edge Function. 매주 한 번 pg_cron이 부른다.
// 필요한 값(Settings → Edge Functions → Secrets):
//   VAPID_PUBLIC · VAPID_PRIVATE · VAPID_SUBJECT
//   CRON_SECRET — 부르는 쪽이 'x-cron-secret' 머리말로 같은 값을 대야 보낸다.
//     예약 작업(pg_cron)만 이 값을 안다. 값이 없으면(등록 전) 예전처럼 누구 호출이든 받는다.
//     사이트의 공개 키만으로 알림을 되풀이해 보내게 하는 것을 막는다.
//
// web-push 는 Node용이라 esm.sh 로 받으면 Deno에서 터진다.
// npm: 로 받아야 Supabase가 Node 흉내를 내 준다.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

// 비밀값은 붙여넣을 때 줄바꿈·공백이 딸려 오기 쉽다. 여기서 털어 낸다.
// 일반 Base64(+ / =)로 넣었더라도 URL용으로 고쳐 준다.
const tidy = (v: string | undefined) =>
  (v ?? '').replace(/\s+/g, '').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// 이번 주의 일요일 — posture_checks.week 와 같은 기준으로 센다.
function thisSunday(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  // 무슨 일이 있어도 까닭을 글로 돌려준다. 그래야 밖에서 원인을 알 수 있다.
  const out = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  // 부르는 쪽 확인 — 암호가 등록돼 있으면 같은 값을 댄 호출만 받는다
  const need = (Deno.env.get('CRON_SECRET') ?? '').trim();
  if (need && (req.headers.get('x-cron-secret') ?? '').trim() !== need) {
    return out({ error: '권한이 없습니다' }, 401);
  }

  try {
    const pub = tidy(Deno.env.get('VAPID_PUBLIC'));
    const priv = tidy(Deno.env.get('VAPID_PRIVATE'));
    const subj = (Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@bmti-official.co.kr').trim();
    // 길이가 맞지 않으면 값이 잘못 들어온 것이다. 무엇이 어떻게 들어왔는지 알려 준다.
    if (pub.length !== 87 || priv.length !== 43) {
      return out({
        error: '비밀값 길이가 맞지 않습니다',
        공개키: { 글자수: pub.length, 있어야: 87, 앞8: pub.slice(0, 8), 뒤8: pub.slice(-8) },
        비밀키: { 글자수: priv.length, 있어야: 43 },
        주소: subj,
      }, 500);
    }

    webpush.setVapidDetails(subj, pub, priv);

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const week = thisSunday();
    const [subs, done, on] = await Promise.all([
      db.from('push_subscriptions').select('endpoint, user_id, p256dh, auth, fail_count'),
      db.from('posture_checks').select('user_id').eq('week', week),
      db.from('users').select('id').eq('push_weekly', true),
    ]);
    const bad = [subs.error, done.error, on.error].filter(Boolean)[0];
    if (bad) return out({ error: '표를 읽지 못했습니다', detail: bad.message }, 500);

    const already = new Set((done.data ?? []).map((r) => r.user_id));
    const wants = new Set((on.data ?? []).map((r) => r.id));
    const targets = (subs.data ?? []).filter((s) => wants.has(s.user_id) && !already.has(s.user_id));

    const body = JSON.stringify({
      title: '이번 주 각도기록, 아직이에요',
      body: '1분이면 끝나요. 지난주보다 얼마나 달라졌는지 볼까요?',
      url: '/?go=angle',
      tag: 'weekly-angle',
    });

    let sent = 0;
    let gone = 0;
    const fails: string[] = [];
    for (const s of targets) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent += 1;
        await db.from('push_subscriptions')
          .update({ last_ok_at: new Date().toISOString(), fail_count: 0 })
          .eq('endpoint', s.endpoint);
      } catch (e) {
        // 404·410이면 그 기기는 사라진 것이다. 바로 지운다.
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
          gone += 1;
        } else {
          fails.push(String((e as Error)?.message ?? e).slice(0, 120));
          await db.from('push_subscriptions')
            .update({ fail_count: (s.fail_count ?? 0) + 1 })
            .eq('endpoint', s.endpoint);
        }
      }
    }
    return out({ ok: true, week, targets: targets.length, sent, gone, fails });
  } catch (e) {
    return out({ error: '함수가 터졌습니다', detail: String((e as Error)?.message ?? e) }, 500);
  }
});
