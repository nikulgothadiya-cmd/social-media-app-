import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post("/", upload.array("images", 6), (req, res) => {
  const files = req.files || [];
  if (files.length === 0 && req.file) {
    const urlPath = `/uploads/${req.file.filename}`;
    return res.status(201).json({ url: urlPath });
  }
  if (files.length === 0) {
    return res.status(400).json({ message: "image file is required" });
  }
  const urls = files.map((file) => `/uploads/${file.filename}`);
  res.status(201).json({ urls });
});

const uploadVideo = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

router.post("/video", uploadVideo.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "video file is required" });
  }
  const urlPath = `/uploads/${req.file.filename}`;
  res.status(201).json({ url: urlPath });
});

export default router;
