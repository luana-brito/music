import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const UPLOAD_DIR = join(process.cwd(), 'public', 'musicas');

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be audio' }, { status: 400 });
    }

    // Criar diretório se não existir
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Gerar nome único
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Retornar URL pública
    const url = `/musicas/${filename}`;

    return NextResponse.json({ url, filename });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
