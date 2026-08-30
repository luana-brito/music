import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/requireAdmin';

const updateTriboSchema = z.object({
  nome: z.string().min(1),
  cor: z.string().min(1),
  logo: z.union([z.string().url(), z.string().regex(/^\/imagens\/.+$/)]).optional().nullable(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.tribo.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Tribo não encontrada' }, { status: 404 });
  }

  const body = await request.json();
  const parse = updateTriboSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const tribo = await prisma.tribo.update({
    where: { id },
    data: parse.data,
  });
  return NextResponse.json(tribo);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.tribo.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Tribo não encontrada' }, { status: 404 });
  }

  const musicasCount = await prisma.musica.count({ where: { triboId: id } });
  if (musicasCount > 0) {
    return NextResponse.json(
      { error: `Não é possível excluir: há ${musicasCount} música(s) nesta tribo.` },
      { status: 409 }
    );
  }

  await prisma.tribo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
