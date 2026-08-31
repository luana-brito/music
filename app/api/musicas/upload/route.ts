import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAdmin } from '@/lib/requireAdmin';
import { uploadErrorMessage, uploadPublicBlob } from '@/lib/blobUpload';
import {
  AUDIO_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  assertUploadSize,
  audioBlobPath,
  audioContentType,
  isAllowedAudio,
} from '@/lib/uploadLimits';

export const maxDuration = 60;

const UPLOAD_DIR = join(process.cwd(), 'public', 'musicas');

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const body = (await req.json()) as HandleUploadBody;
      if (body?.type === 'blob.generate-client-token') {
        const { error } = await requireAdmin();
        if (error) return error;
      }
      const jsonResponse = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async (pathname) => {
          const { error } = await requireAdmin();
          if (error) throw new Error('Não autorizado');
          if (!pathname.startsWith('musicas/')) throw new Error('Caminho inválido');
          if (!isAllowedAudio(pathname)) throw new Error('Apenas arquivos MP3, MPEG ou WAV são permitidos');
          return {
            allowedContentTypes: AUDIO_MIME_TYPES,
            maximumSizeInBytes: MAX_UPLOAD_BYTES,
            addRandomSuffix: false,
            allowOverwrite: true,
          };
        },
        onUploadCompleted: async () => undefined,
      });
      return NextResponse.json(jsonResponse);
    } catch (error) {
      const message = uploadErrorMessage(error, 'Upload failed');
      const status = message === 'Não autorizado' ? 401 : 400;
      return NextResponse.json({ error: message }, { status });
    }
  }

  try {
    const { error } = await requireAdmin();
    if (error) return error;

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

      try {
        assertUploadSize(file.size);
      } catch (sizeError) {
        return NextResponse.json({ error: uploadErrorMessage(sizeError, `O arquivo deve ter no máximo ${MAX_UPLOAD_LABEL}`) }, { status: 400 });
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

      try {
        assertUploadSize(fileBuffer.length);
      } catch (sizeError) {
        return NextResponse.json({ error: uploadErrorMessage(sizeError, `O arquivo deve ter no máximo ${MAX_UPLOAD_LABEL}`) }, { status: 400 });
      }
    }

    if (!isAllowedAudio(filename, mimeType)) {
      return NextResponse.json({ error: 'Apenas arquivos MP3, MPEG ou WAV são permitidos' }, { status: 400 });
    }

    const pathname = audioBlobPath(filename, mimeType);
    const safeName = pathname.split('/').pop() || `${Date.now()}.mp3`;
    const blobContentType = audioContentType(filename, mimeType);
    const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

    if (hasBlobToken || process.env.VERCEL) {
      const blob = await uploadPublicBlob(pathname, fileBuffer, blobContentType);
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
