const multer = require("multer");
const path = require("path");

// กำหนดที่เก็บไฟล์และชื่อไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/slips"); // เก็บใน folder uploads/slips
  },
  filename: (req, file, cb) => {
    // ตั้งชื่อไฟล์เป็น userId_timestamp.นามสกุล
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  },
});

// ตรวจสอบประเภทไฟล์ — รับเฉพาะรูปภาพ
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("รองรับเฉพาะไฟล์รูปภาพ (jpg, png, webp)"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัด 5MB
});

module.exports = upload;