import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfIsoWeek, isCurrentIsoWeek } from '@/lib/week';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.musica.findUnique({ where: { id }, select: { playsWeekAt: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Não foi possível registrar a reprodução' }, { status: 404 });
    }

    const sameWeek = isCurrentIsoWeek(existing.playsWeekAt);
    await prisma.musica.update({
      where: { id },
      data: sameWeek
        ? { plays: { increment: 1 }, playsWeek: { increment: 1 } }
        : { plays: { increment: 1 }, playsWeek: 1, playsWeekAt: startOfIsoWeek(new Date()) },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Não foi possível registrar a reprodução' }, { status: 404 });
  }
}
