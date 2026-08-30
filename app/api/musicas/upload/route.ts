import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { uploadErrorMessage, uploadPublicBlob, audioBlobPath, AUDIO_MPEG } from '@/lib/blobUpload';

export const maxDuration = 60;

const UPLOAD_DIR = join(process.cwd(), 'public', 'musicas');

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    let filename = '';
    let mimeType = '';
    let fileBuffer: Buffer;

    if (isMultipart) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      filename = file.name;
      mimeType = file.type || contentType;
      fileBuffer = Buffer.from(await file.arrayBuffer());
    } else {
      const rawFilename = req.nextUrl.searchParams.get('filename');
      if (!rawFilename) {
        return NextResponse.json({ error: 'Missing filename query param' }, { status: 400 });
      }

      filename = rawFilename;
      mimeType = contentType;
      fileBuffer = Buffer.from(await req.arrayBuffer());

      if (!fileBuffer.length) {
        return NextResponse.json({ error: 'No file body provided' }, { status: 400 });
      }
    }

    const lowerFilename = filename.toLowerCase();
    const isValidExtension = lowerFilename.endsWith('.mp3') || lowerFilename.endsWith('.mpeg');
    const isValidMime =
      mimeType === 'audio/mpeg' ||
      mimeType === 'audio/mp3' ||
      mimeType === 'audio/x-mpeg' ||
      mimeType === 'video/mpeg';

    if (!isValidExtension && !isValidMime) {
      return NextResponse.json({ error: 'Apenas arquivos MP3/MPEG são permitidos' }, { status: 400 });
    }

    const pathname = audioBlobPath(filename);
    const safeName = pathname.split('/').pop() || `${Date.now()}.mp3`;
    const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

    if (hasBlobToken || process.env.VERCEL) {
      const blob = await uploadPublicBlob(pathname, fileBuffer, AUDIO_MPEG);
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
    return NextResponse.json({ url: `/musicas/${safeName}`, filename: safeName });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: uploadErrorMessage(error, 'Upload failed') }, { status: 500 });
  }
}
