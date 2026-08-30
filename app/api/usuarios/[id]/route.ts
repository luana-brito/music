import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/requireAdmin';

const updateUsuarioSchema = z.object({
  nome: z.string().min(1).max(80),
  email: z.string().email().max(180),
  senha: z.string().min(8).max(120).optional().or(z.literal('')),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.usuario.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  const body = await request.json();
  const parse = updateUsuarioSchema.safeParse({
    ...body,
    email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : body.email,
  });
  if (!parse.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  try {
    const senha = parse.data.senha?.trim();
    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        nome: parse.data.nome,
        email: parse.data.email,
        ...(senha ? { senha: await bcrypt.hash(senha, 12) } : {}),
      },
      select: { id: true, nome: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json(usuario);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'Este email já está em uso' }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.usuario.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  if (session?.user?.id === id) {
    return NextResponse.json({ error: 'Você não pode excluir o próprio usuário.' }, { status: 409 });
  }

  const remaining = await prisma.usuario.count({ where: { role: 'ADMIN' } });
  if (remaining <= 1) {
    return NextResponse.json({ error: 'Não é possível excluir o último administrador.' }, { status: 409 });
  }

  await prisma.usuario.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
