import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAdmin } from '@/lib/requireAdmin';
import { uploadErrorMessage, uploadPublicBlob } from '@/lib/blobUpload';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, assertUploadSize, sanitizeFileName } from '@/lib/uploadLimits';

export const maxDuration = 60;

const UPLOAD_DIR = join(process.cwd(), 'public', 'imagens');
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

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
          if (!pathname.startsWith('imagens/')) throw new Error('Caminho inválido');
          return {
            allowedContentTypes: ALLOWED_MIME,
            maximumSizeInBytes: MAX_UPLOAD_BYTES,
            addRandomSuffix: false,
            allowOverwrite: true,
          };
        },
        onUploadCompleted: async () => undefined,
      });
      return NextResponse.json(jsonResponse);
    } catch (error) {
      const message = uploadErrorMessage(error, 'Falha no upload da imagem');
      const status = message === 'Não autorizado' ? 401 : 400;
      return NextResponse.json({ error: message }, { status });
    }
  }

  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 });
    }

    try {
      assertUploadSize(file.size);
    } catch (sizeError) {
      return NextResponse.json(
        { error: uploadErrorMessage(sizeError, `A imagem deve ter no máximo ${MAX_UPLOAD_LABEL}`) },
        { status: 400 }
      );
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
    const safeName = `${timestamp}-${sanitizeFileName(filename)}`;
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
