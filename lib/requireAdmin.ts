import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return { session: null, error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }
  return { session, error: null };
}
