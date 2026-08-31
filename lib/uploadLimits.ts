export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = '20 MB';

export const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/x-mpeg',
  'video/mpeg',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/vnd.wave',
];

export const AUDIO_ACCEPT = '.mp3,.mpeg,.wav,audio/mpeg,audio/mp3,audio/x-mpeg,video/mpeg,audio/wav,audio/wave,audio/x-wav';

export function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

export function isWavAudio(filename: string, mimeType = '') {
  return filename.toLowerCase().endsWith('.wav') || /wav/i.test(mimeType);
}

export function isAllowedAudio(filename: string, mimeType = '') {
  const lower = filename.toLowerCase();
  const hasValidExtension = lower.endsWith('.mp3') || lower.endsWith('.mpeg') || lower.endsWith('.wav');
  return hasValidExtension || AUDIO_MIME_TYPES.includes(mimeType);
}

export function audioContentType(filename: string, mimeType = '') {
  if (isWavAudio(filename, mimeType)) return 'audio/wav';
  return 'audio/mpeg';
}

export function audioBlobPath(originalName: string, mimeType = '') {
  const ext = isWavAudio(originalName, mimeType) ? '.wav' : '.mp3';
  const base = sanitizeFileName(originalName)
    .replace(/(\.mpeg)+$/i, '')
    .replace(/(\.mp3)+$/i, '')
    .replace(/(\.wav)+$/i, '');
  return `musicas/${Date.now()}-${base}${ext}`;
}

export function imageBlobPath(originalName: string) {
  return `imagens/${Date.now()}-${sanitizeFileName(originalName)}`;
}

export function assertUploadSize(size: number) {
  if (size > MAX_UPLOAD_BYTES) {
    throw new Error(`O arquivo deve ter no máximo ${MAX_UPLOAD_LABEL}`);
  }
}
