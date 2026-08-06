import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const createMusicaSchema = z.object({
  nome: z.string().min(1),
  ano: z.number().int().min(1900),
  blobUrl: z.union([z.string().url(), z.string().regex(/^\/musicas\/.+$/)]),
  duracao: z.number().int().min(1),
  triboId: z.string().min(1),
});

export async function GET() {
  const musicas = await prisma.musica.findMany({
    include: { tribo: true },
    orderBy: [{ ano: 'desc' }, { nome: 'asc' }],
  });
  return NextResponse.json(musicas);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parse = createMusicaSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const musica = await prisma.musica.create({ data: parse.data });
  return NextResponse.json(musica, { status: 201 });
}
