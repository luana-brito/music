import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, senha } = body;

  if (!email || !senha) {
    return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
  }

  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
  }

  const isValid = await bcrypt.compare(senha, user.senha);
  if (!isValid || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
}
