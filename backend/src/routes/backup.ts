import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'project-wallet-secret-key-2026';

// Middleware verifikasi token
function authenticate(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Harus login terlebih dahulu' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Sesi tidak valid' });
  }
}

// POST /api/backup/save - Cadangkan data lokal terenkripsi ke akun user
router.post('/save', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { payload, backupName, deviceInfo } = req.body;

    if (!payload) {
      return res.status(400).json({ success: false, message: 'Data cadangan tidak boleh kosong' });
    }

    const backup = await prisma.cloudBackup.create({
      data: {
        userId,
        backupName: backupName || 'Cadangan Manual',
        encryptedPayload: typeof payload === 'string' ? payload : JSON.stringify(payload),
        deviceInfo: deviceInfo || 'Mobile Device',
      },
    });

    res.json({
      success: true,
      message: 'Data lokal berhasil dicadangkan ke akun cloud Anda',
      data: {
        id: backup.id,
        backupName: backup.backupName,
        createdAt: backup.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/backup/latest - Ambil cadangan terbaru untuk dipulihkan (Restore)
router.get('/latest', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const latest = await prisma.cloudBackup.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      return res.status(404).json({ success: false, message: 'Belum ada data cadangan di akun Anda' });
    }

    res.json({
      success: true,
      data: {
        id: latest.id,
        backupName: latest.backupName,
        createdAt: latest.createdAt,
        payload: JSON.parse(latest.encryptedPayload),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
