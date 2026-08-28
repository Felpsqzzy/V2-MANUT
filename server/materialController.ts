import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, process.env.UPLOAD_DIR || './uploads'),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`)
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/webm',
      'application/pdf'
    ];
    cb(null, allowed.includes(file.mimetype));
  }
});

export async function registerMaterial(req: Request, res: Response): Promise<Response> {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

  let fileType = 'document';
  if (file.mimetype.startsWith('image/')) fileType = 'image';
  else if (file.mimetype.startsWith('video/')) fileType = 'video';
  else if (file.mimetype === 'application/pdf') fileType = 'pdf';

  const materialData = {
    id: crypto.randomUUID(),
    title: String(req.body.title || file.originalname),
    description: String(req.body.description || ''),
    category: String(req.body.category || 'Geral'),
    fileUrl: `/uploads/${file.filename}`,
    fileType,
    fileMime: file.mimetype,
    fileSizeBytes: file.size
  };

  return res.status(201).json({ message: 'Material registrado com sucesso!', data: materialData });
}
