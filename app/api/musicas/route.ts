import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { requireAdmin } from '@/lib/requireAdmin';
import { isCurrentIsoWeek } from '@/lib/week';

const createMusicaSchema = z.object({
  nome: z.string().min(1),
  ano: z.number().int().min(1900),
  blobUrl: z.union([z.string().url(), z.string().regex(/^\/musicas\/.+$/)]),
  capa: z.union([z.string().url(), z.string().regex(/^\/imagens\/.+$/)]).optional().nullable(),
  duracao: z.number().int().min(1),
  triboId: z.string().min(1),
});

export async function GET() {
  try {
    const musicas = await prisma.musica.findMany({
      include: { tribo: true },
      orderBy: [{ plays: 'desc' }, { nome: 'asc' }],
    });
    return NextResponse.json(
      musicas.map((musica) => ({
        ...musica,
        playsWeek: isCurrentIsoWeek(musica.playsWeekAt) ? musica.playsWeek : 0,
      }))
    );
  } catch (error) {
    console.error('Erro ao listar músicas:', error);
    return NextResponse.json({ error: 'Falha ao carregar músicas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parse = createMusicaSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const data = parse.data;
  let capa = data.capa || null;

  if (!capa) {
    const tribo = await prisma.tribo.findUnique({ where: { id: data.triboId } });
    capa = tribo?.logo || null;
  }

  const musica = await prisma.musica.create({
    data: {
      nome: data.nome,
      ano: data.ano,
      blobUrl: data.blobUrl,
      capa,
      duracao: data.duracao,
      triboId: data.triboId,
    },
  });
  return NextResponse.json(musica, { status: 201 });
}
