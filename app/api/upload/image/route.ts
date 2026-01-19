import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '没有上传文件' },
        { status: 400 }
      );
    }

    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的图片格式，仅支持 JPG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    // 检查文件大小（限制 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '图片大小不能超过 10MB' },
        { status: 400 }
      );
    }

    // 创建上传目录
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // 目录可能已存在，忽略错误
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const ext = path.extname(file.name);
    const filename = `${timestamp}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // 转换为 base64
    const base64 = buffer.toString('base64');
    const mimeType = file.type;
    const base64Data = `data:${mimeType};base64,${base64}`;

    // 返回文件 URL 和 base64 数据
    const url = `/uploads/${filename}`;
    
    return NextResponse.json({
      success: true,
      url,
      name: file.name,
      size: file.size,
      type: file.type,
      base64: base64Data,
    });
  } catch (error) {
    console.error('图片上传失败:', error);
    return NextResponse.json(
      { error: '图片上传失败' },
      { status: 500 }
    );
  }
}
