import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const createUsuarioSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const usuarios = await prisma.usuario.findMany({ select: { id: true, nome: true, email: true, role: true, createdAt: true } });
  return NextResponse.json(usuarios);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parse = createUsuarioSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const senhaHash = await bcrypt.hash(parse.data.senha, 10);
  const usuario = await prisma.usuario.create({
    data: {
      nome: parse.data.nome,
      email: parse.data.email,
      senha: senhaHash,
      role: 'ADMIN',
    },
  });

  return NextResponse.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role, createdAt: usuario.createdAt }, { status: 201 });
}
