import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(authMiddleware);

// Multer storage for maintenance attachments
const maintenanceStorage = multer.diskStorage({
  destination: (req: any, file, cb) => {
    const customerId = req.user?.customerId || 'default';
    const uploadsDir = path.resolve(__dirname, `../../uploads/maintenance/${customerId}`);
    fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const maintenanceUpload = multer({
  storage: maintenanceStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow images and common document formats
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4',
      'video/quicktime'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, documents, and videos are allowed.'));
    }
  }
});

// Upload maintenance files (multiple)
router.post('/maintenance', maintenanceUpload.array('files', 5), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const customerId = req.user?.customerId || 'default';
    const uploadedFiles = req.files.map((file: Express.Multer.File) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/maintenance/${customerId}/${file.filename}`
    }));

    return res.json({
      success: true,
      files: uploadedFiles
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload files' });
  }
});

// Delete maintenance file
router.delete('/maintenance/:customerId/:filename', async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, filename } = req.params;
    const userId = req.user?.id;
    const userCustomerId = req.user?.customerId;

    // Security check: user can only delete files from their own customer
    if (userCustomerId !== customerId && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.resolve(__dirname, `../../uploads/maintenance/${customerId}/${filename}`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({ success: true, message: 'File deleted successfully' });
    } else {
      return res.status(404).json({ error: 'File not found' });
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;

