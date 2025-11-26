// src/modules/uploads/upload.routes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '../../middleware/auth.middleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'src', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({ storage });

router.post('/file', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ status: false, message: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  return res.json({ status: true, url, filename: req.file.filename });
});

export default router;
