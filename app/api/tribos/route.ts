import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { requireAdmin } from '@/lib/requireAdmin';

const createTriboSchema = z.object({
  nome: z.string().min(1),
  cor: z.string().min(1),
  logo: z.union([z.string().url(), z.string().regex(/^\/imagens\/.+$/)]).optional().nullable(),
});

export async function GET() {
  try {
    const tribos = await prisma.tribo.findMany({ orderBy: { nome: 'asc' } });
    return NextResponse.json(tribos);
  } catch (error) {
    console.error('Erro ao listar tribos:', error);
    return NextResponse.json({ error: 'Falha ao carregar tribos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parse = createTriboSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const tribo = await prisma.tribo.create({ data: parse.data });
  return NextResponse.json(tribo, { status: 201 });
}
