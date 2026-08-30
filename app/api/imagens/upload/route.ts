import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { uploadErrorMessage, uploadPublicBlob } from '@/lib/blobUpload';

export const maxDuration = 60;

const UPLOAD_DIR = join(process.cwd(), 'public', 'imagens');
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'A imagem deve ter no máximo 5 MB' }, { status: 400 });
    }

    const filename = file.name;
    const mimeType = file.type || '';
    const lowerFilename = filename.toLowerCase();
    const isValidExtension = ALLOWED_EXT.some((ext) => lowerFilename.endsWith(ext));
    const isValidMime = ALLOWED_MIME.includes(mimeType);

    if (!isValidExtension && !isValidMime) {
      return NextResponse.json({ error: 'Use JPG, PNG, WEBP ou GIF' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const safeName = `${timestamp}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

    if (hasBlobToken || process.env.VERCEL) {
      const blob = await uploadPublicBlob(`imagens/${safeName}`, fileBuffer, mimeType || 'image/jpeg');
      return NextResponse.json({ url: blob.url, filename: safeName });
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Configuração ausente: defina BLOB_READ_WRITE_TOKEN no ambiente de produção.' },
        { status: 500 }
      );
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, safeName), fileBuffer);
    return NextResponse.json({ url: `/imagens/${safeName}`, filename: safeName });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: uploadErrorMessage(error, 'Falha no upload da imagem') }, { status: 500 });
  }
}
