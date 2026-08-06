import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';

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

    // Validar tipo/extensão para MP3/MPEG.
    const fileName = file.name.toLowerCase();
    const isValidExtension = fileName.endsWith('.mp3') || fileName.endsWith('.mpeg');
    const isValidMime =
      file.type === 'audio/mpeg' ||
      file.type === 'audio/mp3' ||
      file.type === 'audio/x-mpeg' ||
      file.type === 'video/mpeg';

    if (!isValidExtension && !isValidMime) {
      return NextResponse.json({ error: 'Apenas arquivos MP3/MPEG são permitidos' }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_TOKEN;
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    if (token) {
      const blob = await put(`musicas/${filename}`, file, {
        access: 'public',
        token,
        contentType: file.type || 'audio/mpeg',
      });

      return NextResponse.json({ url: blob.url, filename });
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Configuração ausente: defina BLOB_READ_WRITE_TOKEN no ambiente de produção.' },
        { status: 500 }
      );
    }

    // Fallback local para desenvolvimento sem token do Blob.
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filepath = join(UPLOAD_DIR, filename);

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const url = `/musicas/${filename}`;

    return NextResponse.json({ url, filename });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
