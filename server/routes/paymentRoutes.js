/**
 * ========================
 * ไฟล์ Payment Routes
 * ========================
 * กำหนดเส้นทาง API สำหรับจัดการการชำระเงิน
 * ต้องล็อกอินก่อน (Protected Routes)
 * 
 * ฟังก์ชัน:
 * - สร้างบันทึกการชำระเงิน (Create Payment)
 * - ดำเนินการจ่ายเงิน (Pay - Mock)
 * - อัปโหลดสลิปการโอน (Upload Slip)
 * - ดูประวัติการชำระเงิน (My Payments)
 */

// ==================== นำเข้า Dependencies ====================

// express - เฟรมเวิร์ก web server
const express = require("express");

// สร้าง router instance เพื่อจัดกลุ่มเส้นทาง
const router = express.Router();

// ==================== นำเข้า Controller ====================

/**
 * นำเข้าฟังก์ชัน controller สำหรับจัดการการชำระเงิน
 * จากไฟล์ paymentController.js
 */
const paymentController = require("../controllers/paymentController");

// ==================== นำเข้า Middleware ====================

// ตรวจสอบ JWT token ของผู้ใช้
const auth = require("../middleware/authMiddleware");

// multer middleware สำหรับการอัปโหลดไฟล์
const upload = require("../middleware/uploadMiddleware");

// ==================== ROUTES ====================

/**
 * @route POST /api/payments
 * @description สร้างบันทึกการชำระเงิน (สถานะ pending)
 * @access Private (ต้องล็อกอิน)
 * @middleware auth - ตรวจสอบ JWT
 * @body {number} amount - จำนวนเงิน
 * @response {Object} payment - ข้อมูล payment ที่สร้าง
 * 
 * ขั้นตอน:
 * 1. รับจำนวนเงิน
 * 2. สร้างบันทึก payment ใหม่
 * 3. ตั้งสถานะเป็น "pending"
 */
router.post("/", auth, paymentController.createPayment);

/**
 * @route POST /api/payments/:id/pay
 * @description ดำเนินการชำระเงิน (จำลอง - Mock)
 * @param {string} id - รหัส ID ของ payment
 * @access Private (ต้องล็อกอิน)
 * @middleware auth
 * @response {Object} ข้อความยืนยัน + ข้อมูล payment
 * 
 * ขั้นตอน:
 * 1. ค้นหา payment ด้วย ID
 * 2. เปลี่ยนสถานะเป็น "paid"
 * 3. สร้าง transactionId
 */
router.post("/:id/pay", auth, paymentController.pay);

/**
 * @route GET /api/payments/my
 * @description ดึงประวัติการชำระเงินของผู้ใช้ที่ล็อกอิน
 * @access Private (ต้องล็อกอิน)
 * @middleware auth
 * @response {Array} payments - อาร์เรย์ของบันทึก payment
 */
router.get("/my", auth, paymentController.myPayments);

/**
 * @route POST /api/payments/:id/slip
 * @description อัปโหลดสลิปการโอนเงิน
 * @param {string} id - รหัส ID ของ payment
 * @access Private (ต้องล็อกอิน)
 * @middleware auth - ตรวจสอบ JWT
 * @middleware upload.single('slip') - อัปโหลดไฟล์เดียว
 * @file slip - ไฟล์รูปภาพสลิป (jpg, png, webp สูงสุด 5MB)
 * @response {Object} ข้อความยืนยัน + ข้อมูล payment ที่อัปเดต
 * 
 * ขั้นตอน:
 * 1. ตรวจสอบว่า payment มีอยู่
 * 2. ตรวจสอบว่าผู้ใช้เป็นเจ้าของ payment
 * 3. ตรวจสอบไฟล์ (ต้องเป็นรูปภาพ)
 * 4. บันทึก path ของรูป
 * 5. เปลี่ยนสถานะเป็น "paid"
 */
router.post("/:id/slip", auth, upload.single("slip"), paymentController.uploadSlip);

// ==================== EXPORT ====================

/**
 * ส่งออก router
 * ใช้ใน server.js: app.use('/api/payments', paymentRoutes);
 */
module.exports = router;