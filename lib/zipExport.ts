import { createReadStream, constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { Musica } from '@/types';
import { isWavAudio } from '@/lib/uploadLimits';

export function sanitizeZipPart(name: string) {
  const cleaned = name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'arquivo';
}

export function audioExtension(url: string) {
  return isWavAudio(url) ? '.wav' : '.mp3';
}

export function zipEntryName(musica: Musica, used: Set<string>) {
  const tribo = sanitizeZipPart(musica.tribo?.nome || 'Sem tribo');
  const ext = audioExtension(musica.blobUrl);
  const base = `${musica.ano} - ${sanitizeZipPart(musica.nome)}`;
  let relative = `${tribo}/${base}${ext}`;
  let index = 2;
  while (used.has(relative.toLowerCase())) {
    relative = `${tribo}/${base} (${index})${ext}`;
    index += 1;
  }
  used.add(relative.toLowerCase());
  return relative;
}

export function exportZipFileName(opts: { triboNome?: string | null; year?: number | null; query?: string }) {
  const parts = ['hype'];
  if (opts.triboNome) parts.push(sanitizeZipPart(opts.triboNome).replace(/\s+/g, '-'));
  if (opts.year) parts.push(String(opts.year));
  if (opts.query?.trim() && !opts.triboNome && !opts.year) parts.push('filtrado');
  if (parts.length === 1) parts.push('musicas');
  return `${parts.join('-').replace(/[^a-zA-Z0-9._-]/g, '_')}.zip`;
}

export async function openAudioStream(blobUrl: string): Promise<Readable> {
  if (blobUrl.startsWith('/musicas/')) {
    const filename = blobUrl.slice('/musicas/'.length);
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new Error('Caminho de áudio inválido');
    }
    const fullPath = join(process.cwd(), 'public', 'musicas', filename);
    await access(fullPath, constants.R_OK);
    return createReadStream(fullPath);
  }

  if (!/^https?:\/\//i.test(blobUrl)) {
    throw new Error('URL de áudio inválida');
  }

  const response = await fetch(blobUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Falha ao baixar áudio (${response.status})`);
  }

  return Readable.fromWeb(response.body as import('stream/web').ReadableStream);
}
