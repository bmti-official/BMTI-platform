// 파일 한 개를 Supabase Storage의 'curation' 버킷에 올리는 일만 맡는다.
// 화면 부품이 아니라 순수 함수라서 따로 두었다(빠른 새로고침이 깨지지 않게).
import { supabase } from '../lib/supabaseClient';

export const BUCKET = 'curation';

const MAX_MB = 5;          // 사진
const MAX_VIDEO_MB = 20;   // 반복 영상
const MAX_AUDIO_MB = 8;    // AI 음성
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const OK_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];
const OK_AUDIO = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm'];
export const AUDIO_ACCEPT = 'audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/ogg,audio/webm,.mp3,.m4a,.wav,.ogg';


// 파일 이름은 한글·공백이 섞여도 안전하게 새로 지어 준다.
function safeName(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${ym}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

// 한 장(또는 한 편)을 올리고 { url } 또는 { err }를 돌려준다.
// opt는 true(=영상 허용)로도, { allowVideo, allowAudio }로도 받는다.
export async function uploadOne(file, opt = false) {
  const { allowVideo = false, allowAudio = false } = (opt === true ? { allowVideo: true } : (opt || {}));
  const audio = OK_AUDIO.includes(file.type) || /\.(mp3|m4a|wav|ogg)$/i.test(file.name) || (allowAudio && /\.webm$/i.test(file.name) && !allowVideo);
  const video = !audio && (OK_VIDEO.includes(file.type) || /\.(mp4|webm|mov)$/i.test(file.name));
  if (audio && !allowAudio) return { err: `'${file.name}'은 소리 파일이라 이 칸에는 넣을 수 없어요.` };
  if (allowAudio && !audio) return { err: `'${file.name}'은 소리 파일이 아니에요 (mp3 · m4a · wav).` };
  if (video && !allowVideo) return { err: `'${file.name}'은 영상이라 이 칸에는 넣을 수 없어요.` };
  if (!video && !audio && !OK_TYPES.includes(file.type)) return { err: `'${file.name}'은 사진·영상 파일이 아니에요 (jpg · png · webp · mp4 · webm).` };
  const cap = audio ? MAX_AUDIO_MB : video ? MAX_VIDEO_MB : MAX_MB;
  if (file.size > cap * 1024 * 1024) return { err: `'${file.name}'이 ${cap}MB보다 큽니다.` };
  const path = safeName(file);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '31536000', upsert: false });
  if (error) {
    const m = String(error.message || '');
    if (/not found|does not exist/i.test(m)) return { err: `'${BUCKET}' 저장소가 아직 없어요. 04_storage.sql을 한 번 실행해 주세요.` };
    if (/policy|permission|unauthorized/i.test(m)) return { err: '올릴 권한이 없어요. 04_storage.sql을 한 번 실행해 주세요.' };
    return { err: '올리기 실패: ' + m };
  }
  return { url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}
