import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { requireAdmin } from '@/lib/requireAdmin';

const createUsuarioSchema = z.object({
  nome: z.string().min(1).max(80),
  email: z.string().email().max(180),
  senha: z.string().min(8).max(120),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json(usuarios);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parse = createUsuarioSchema.safeParse({
    ...body,
    email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : body.email,
  });
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const senhaHash = await bcrypt.hash(parse.data.senha, 12);
  const usuario = await prisma.usuario.create({
    data: {
      nome: parse.data.nome,
      email: parse.data.email,
      senha: senhaHash,
      role: 'ADMIN',
    },
  });

  return NextResponse.json(
    { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role, createdAt: usuario.createdAt },
    { status: 201 }
  );
}
