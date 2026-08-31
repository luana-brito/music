import { del, put } from '@vercel/blob';

export { audioBlobPath } from './uploadLimits';

export async function uploadPublicBlob(pathname: string, file: Buffer | File, contentType: string) {
  return put(pathname, file, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
    multipart: true,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
}

export async function deletePublicBlob(url?: string | null) {
  if (!url || !/^https?:\/\//i.test(url)) return;
  try {
    await del(url);
  } catch (error) {
    console.error('Falha ao remover arquivo remoto:', error);
  }
}

export function uploadErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    if (/access denied|valid token/i.test(error.message)) {
      return 'Falha no armazenamento de arquivos. Tente enviar de novo.';
    }
    return error.message;
  }
  return fallback;
}
