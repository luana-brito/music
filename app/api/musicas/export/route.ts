import { Readable } from 'node:stream';
import archiver from 'archiver';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/requireAdmin';
import { filterMusicas } from '@/lib/catalog';
import { exportZipFileName, openAudioStream, zipEntryName } from '@/lib/zipExport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function parseYear(value: string | null) {
  if (!value) return null;
  const year = Number(value);
  return Number.isInteger(year) && year >= 1900 ? year : null;
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const query = request.nextUrl.searchParams.get('q') || '';
  const year = parseYear(request.nextUrl.searchParams.get('ano'));
  const triboId = request.nextUrl.searchParams.get('triboId') || null;

  const musicas = await prisma.musica.findMany({
    include: { tribo: true },
    orderBy: [{ nome: 'asc' }],
  });

  const filtered = filterMusicas(musicas, { query, year, triboId });
  if (!filtered.length) {
    return NextResponse.json({ error: 'Nenhuma música corresponde aos filtros' }, { status: 400 });
  }

  const triboNome = triboId ? filtered[0]?.tribo?.nome : null;
  const filename = exportZipFileName({ triboNome, year, query });
  const archive = archiver('zip', { store: true });
  const usedNames = new Set<string>();
  const failures: string[] = [];

  const fillArchive = async () => {
    for (const musica of filtered) {
      const entryName = zipEntryName(musica, usedNames);
      try {
        const stream = await openAudioStream(musica.blobUrl);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        archive.append(Buffer.concat(chunks), { name: entryName });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'erro desconhecido';
        failures.push(`${musica.nome}: ${message}`);
      }
    }

    if (failures.length) {
      archive.append(Buffer.from(`${failures.join('\n')}\n`, 'utf8'), { name: '_erros.txt' });
    }

    await archive.finalize();
  };

  fillArchive().catch((err) => {
    archive.emit('error', err);
  });

  const body = Readable.toWeb(archive as unknown as Readable) as ReadableStream<Uint8Array>;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
