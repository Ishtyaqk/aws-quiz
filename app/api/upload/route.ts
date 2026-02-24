import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir();
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      if (!file.name.endsWith('.md')) {
        continue;
      }

      const buffer = await file.arrayBuffer();
      const filename = `${Date.now()}_${file.name}`;
      const filepath = join(UPLOAD_DIR, filename);

      await writeFile(filepath, Buffer.from(buffer));
      uploadedFiles.push({
        name: file.name,
        size: file.size,
        saved: filename,
      });
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: 'No markdown files found' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
