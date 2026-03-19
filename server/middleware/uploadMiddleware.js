/**
 * ========================
 * ไฟล์ Upload Middleware
 * ========================
 * จัดการการอัปโหลดไฟล์รูปภาพ (เช่น สลิปการโอนเงิน)
 * 
 * วัตถุประสงค์:
 * - ตั้งค่าการเก็บไฟล์ (ที่อยู่ของโฟลเดอร์และการตั้งชื่อไฟล์)
 * - ตรวจสอบประเภทไฟล์ (รับเฉพาะรูปภาพ)
 * - จำกัดขนาดไฟล์
 * - ใช้ multer สำหรับการจัดการการอัปโหลด
 */

// ==================== นำเข้า Dependencies ====================

// multer - ไลบรารีสำหรับจัดการการอัปโหลดไฟล์ใน Express
const multer = require("multer");

// path - ไลบรารี Node.js สำหรับจัดการเส้นทางและนามสกุลไฟล์
const path = require("path");

// ==================== ตั้งค่า Storage ====================

/**
 * ตั้งค่าพื้นที่เก็บไฟล์ (diskStorage)
 * กำหนดว่าเก็บไฟล์ที่ไหนและตั้งชื่อไฟล์อย่างไร
 */
const storage = multer.diskStorage({
  /**
   * destination - กำหนดตำแหน่งเก็บไฟล์
   * 
   * @param {Object} req - ออบเจ็กต์คำขอ Express
   * @param {Object} file - ข้อมูลไฟล์ที่อัปโหลด
   * @param {Function} cb - callback function (err, path)
   */
  destination: (req, file, cb) => {
    // เก็บไฟล์ในโฟลเดอร์ uploads/slips
    // cb(null, path) - null หมายถึงไม่มีข้อผิดพลาด
    cb(null, "uploads/slips");
  },

  /**
   * filename - กำหนดชื่อไฟล์ที่เก็บ
   * รูปแบบ: userId_timestamp.นามสกุล
   * 
   * @param {Object} req - ออบเจ็กต์คำขอ Express
   * @param {Object} file - ข้อมูลไฟล์ที่อัปโหลด
   * @param {Function} cb - callback function (err, filename)
   */
  filename: (req, file, cb) => {
    // ==================== ดึงนามสกุลไฟล์ ====================
    // path.extname() - ดึงนามสกุลจากชื่อไฟล์ (เช่น .jpg, .png)
    const ext = path.extname(file.originalname);

    // ==================== สร้างชื่อไฟล์ ====================
    /**
     * ตั้งชื่อไฟล์ตามรูปแบบ: userId_timestamp.นามสกุล
     * ตัวอย่าง: 507f1f77bcf86cd799439011_1710000000000.jpg
     * 
     * ทำไมใช้ timestamp?
     * - ป้องกันไฟล์ทับกัน
     * - แต่ละการอัปโหลดจะมีชื่อไฟล์ที่ต่างกัน
     */
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  },
});

// ==================== ตั้งค่า File Filter ====================

/**
 * ตรวจสอบประเภทไฟล์ (MIME type)
 * รับเฉพาะไฟล์รูปภาพ ปฏิเสธไฟล์อื่น
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} file - ข้อมูลไฟล์ที่อัปโหลด
 * @param {Function} cb - callback function (err, accept)
 */
const fileFilter = (req, file, cb) => {
  // ==================== ประเภทไฟล์ที่อนุญาต ====================
  // รู้รับเฉพาะไฟล์รูปภาพในรูปแบบเหล่านี้
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  // ==================== ตรวจสอบ MIME type ====================
  // file.mimetype คือประเภท MIME ของไฟล์
  // เช่น: "image/jpeg", "image/png", "application/pdf" เป็นต้น
  if (allowed.includes(file.mimetype)) {
    // ถ้าเป็นไฟล์ที่อนุญาต ให้ยอมรับ (true)
    cb(null, true);
  } else {
    // ถ้าไม่ใช่ไฟล์ที่อนุญาต ให้ปฏิเสธและส่งข้อมูลข้อผิดพลาด
    cb(new Error("รองรับเฉพาะไฟล์รูปภาพ (jpg, png, webp)"), false);
  }
};

// ==================== ตั้งค่า Multer ====================

/**
 * สร้างอ็บเจกต์ multer พร้อมตั้งค่า
 * 
 * ตัวเลือก:
 * - storage: ตั้งค่าการเก็บไฟล์
 * - fileFilter: ตรวจสอบประเภทไฟล์
 * - limits: จำกัดขนาดไฟล์
 */
const upload = multer({
  storage,                              // ใช้ storage ที่ตั้งค่าไว้
  fileFilter,                           // ใช้ fileFilter ที่ตั้งค่าไว้
  limits: { 
    fileSize: 5 * 1024 * 1024          // จำกัดขนาดไฟล์สูงสุด 5 MB
  },                                    // 1 MB = 1024 * 1024 bytes
});

// ==================== EXPORT ====================

/**
 * ส่งออก middleware upload
 * ใช้ในระหว่างการอัปโหลดไฟล์
 * 
 * ตัวอย่างการใช้ใน route:
 * router.post('/upload', upload.single('file'), controller)
 * 
 * - .single('file'): ยอมรับไฟล์เดียว (field name คือ 'file')
 * - .array('files'): ยอมรับหลายไฟล์
 * - .fields(): ยอมรับหลาย field
 */
module.exports = upload;