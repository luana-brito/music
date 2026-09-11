import { Readable } from 'node:stream';
import { ZipArchive } from 'archiver';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/requireAdmin';
import { filterMusicas } from '@/lib/catalog';
import { exportZipFileName, openAudioStream, zipEntryName } from '@/lib/zipExport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function parseYear(value: string | null) {
  if (!value) return null;
  const year = Number(value);
  return Number.isInteger(year) && year >= 1900 ? year : null;
}

async function readStreamBuffer(stream: Readable) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function GET(request: NextRequest) {
  try {
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
    const archive = new ZipArchive({ store: true });
    const zipChunks: Buffer[] = [];
    const usedNames = new Set<string>();
    const failures: string[] = [];

    archive.on('data', (chunk: Buffer | Uint8Array) => {
      zipChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    const zipDone = new Promise<void>((resolve, reject) => {
      archive.once('end', resolve);
      archive.once('error', reject);
    });

    for (const musica of filtered) {
      const entryName = zipEntryName(musica, usedNames);
      try {
        const audio = await readStreamBuffer(await openAudioStream(musica.blobUrl));
        archive.append(audio, { name: entryName });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'erro desconhecido';
        failures.push(`${musica.nome}: ${message}`);
      }
    }

    if (failures.length) {
      archive.append(Buffer.from(`${failures.join('\n')}\n`, 'utf8'), { name: '_erros.txt' });
    }

    await archive.finalize();
    await zipDone;

    return new Response(Buffer.concat(zipChunks), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('ZIP export failed:', err);
    return NextResponse.json({ error: 'Não foi possível gerar o ZIP' }, { status: 500 });
  }
}
