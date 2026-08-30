import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/requireAdmin';
import { deletePublicBlob } from '@/lib/blobUpload';

const mediaUrl = z.union([z.string().url(), z.string().regex(/^\/(musicas|imagens)\/.+$/)]);

const updateMusicaSchema = z.object({
  nome: z.string().min(1),
  ano: z.number().int().min(1900),
  blobUrl: mediaUrl.optional(),
  capa: mediaUrl.optional().nullable(),
  duracao: z.number().int().min(1).optional(),
  triboId: z.string().min(1),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.musica.findUnique({ where: { id }, include: { tribo: true } });
  if (!existing) {
    return NextResponse.json({ error: 'Música não encontrada' }, { status: 404 });
  }

  const body = await request.json();
  const parse = updateMusicaSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const data = parse.data;
  const tribo = await prisma.tribo.findUnique({ where: { id: data.triboId } });
  if (!tribo) {
    return NextResponse.json({ error: 'Tribo não encontrada' }, { status: 400 });
  }

  let capa = data.capa === undefined ? existing.capa : data.capa;
  if (!capa) {
    capa = tribo.logo || null;
  }

  if (data.blobUrl && data.blobUrl !== existing.blobUrl) {
    await deletePublicBlob(existing.blobUrl);
  }
  if (existing.capa && existing.capa !== capa && existing.capa !== existing.tribo?.logo) {
    await deletePublicBlob(existing.capa);
  }

  const musica = await prisma.musica.update({
    where: { id },
    data: {
      nome: data.nome,
      ano: data.ano,
      triboId: data.triboId,
      blobUrl: data.blobUrl || existing.blobUrl,
      capa,
      duracao: data.duracao ?? existing.duracao,
    },
    include: { tribo: true },
  });

  return NextResponse.json(musica);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.musica.findUnique({ where: { id }, include: { tribo: true } });
  if (!existing) {
    return NextResponse.json({ error: 'Música não encontrada' }, { status: 404 });
  }

  await prisma.musica.delete({ where: { id } });
  await deletePublicBlob(existing.blobUrl);
  if (existing.capa && existing.capa !== existing.tribo?.logo) {
    await deletePublicBlob(existing.capa);
  }
  return NextResponse.json({ ok: true });
}
