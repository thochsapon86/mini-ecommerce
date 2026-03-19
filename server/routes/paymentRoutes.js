/**
 * Payment routes
 * คำอธิบาย: เส้นทางสำหรับสร้างและจัดการการชำระเงิน
 * หลักการทำงาน:
 * - ต้องล็อกอินก่อน (auth middleware) ทุก operation ที่เกี่ยวข้องกับ user
 * - รองรับการสร้าง payment, ดำเนินการจ่าย (mock), และดึงรายการของผู้ใช้
 */
// Router สำหรับจัดการเรื่องการชำระเงิน (payments)
// เส้นทางจะอยู่ภายใต้ /api/payments เมื่อถูกติดตั้งใน server.js

const express = require("express");
const router = express.Router();

// Controller เก็บฟังก์ชันที่เกี่ยวข้องกับ payment logic
const paymentController = require("../controllers/paymentController");
// middleware ตรวจสอบ JWT และใส่ข้อมูลผู้ใช้ลง req.user
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
// --------------------------------------------
// สร้าง request สำหรับบันทึก payment (สถานะ pending)
// POST /api/payments/ -> { amount }
// --------------------------------------------
router.post("/", auth, paymentController.createPayment);

// --------------------------------------------
// ดำเนินการชำระเงินสำหรับ payment ที่ระบุ
// POST /api/payments/:id/pay
// --------------------------------------------
router.post("/:id/pay", auth, paymentController.pay);

// --------------------------------------------
// ดึงประวัติ payment ของผู้ใช้ที่ล็อกอิน
// GET /api/payments/my
// --------------------------------------------
router.get("/my", auth, paymentController.myPayments);
router.post("/:id/slip", auth, upload.single("slip"), paymentController.uploadSlip);
// ส่ง router ออกให้ server.js ต่อเข้ากับแอปหลัก
module.exports = router;