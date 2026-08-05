import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';

const createTriboSchema = z.object({
  nome: z.string().min(1),
  cor: z.string().min(1),
  logo: z.string().optional(),
});

export async function GET() {
  const tribos = await prisma.tribo.findMany({ orderBy: { nome: 'asc' } });
  return NextResponse.json(tribos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parse = createTriboSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const tribo = await prisma.tribo.create({ data: parse.data });
  return NextResponse.json(tribo, { status: 201 });
}
