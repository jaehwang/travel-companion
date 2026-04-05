import { supabase } from '../supabase';

export async function uploadPhoto(
  fileUri: string,
  fileName: string,
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error('파일 읽기 실패'));
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', fileUri);
    xhr.send();
  });

  const filePath = `photos/${Date.now()}_${fileName}`;
  const { error } = await supabase.storage
    .from('trip-photos')
    .upload(filePath, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
      cacheControl: '31536000',
    });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from('trip-photos')
    .getPublicUrl(filePath);
  const cdnUrl = process.env.EXPO_PUBLIC_PHOTO_CDN_URL;
  return cdnUrl
    ? publicData.publicUrl.replace(process.env.EXPO_PUBLIC_SUPABASE_URL!, cdnUrl)
    : publicData.publicUrl;
}
