/**
 * ========================
 * ไฟล์ Coupon Routes
 * ========================
 * กำหนดเส้นทาง API สำหรับจัดการคูปอง (โค้ดส่วนลด)
 * 
 * ฟังก์ชัน:
 * - สร้างคูปอง (Create - เฉพาะ owner/admin)
 * - ดึงรายการคูปอง (Get All - Public)
 * - รับคูปอง (Claim - ต้องล็อกอิน)
 * 
 * การแบ่งสิทธิ์:
 * - POST (สร้าง): Admin/Owner only
 * - GET (ดู): Public
 * - POST (รับ): Login required
 */

// ==================== นำเข้า Dependencies ====================

// express - เฟรมเวิร์ก web server
const express = require("express");

// สร้าง router instance เพื่อจัดกลุ่มเส้นทาง
const router = express.Router();

// ==================== นำเข้า Controller ====================

/**
 * นำเข้าฟังก์ชัน controller สำหรับจัดการคูปอง
 * จากไฟล์ couponController.js
 */
const couponController = require("../controllers/couponController");

// ==================== นำเข้า Middleware ====================

// ตรวจสอบ JWT token ของผู้ใช้
const auth = require("../middleware/authMiddleware");

// ตรวจสอบบทบาท (role) ของผู้ใช้
const role = require("../middleware/roleMiddleware");

// ==================== ROUTES ====================

/**
 * @route POST /api/coupons
 * @description สร้างคูปองใหม่
 * @access Private - Admin/Owner only
 * @middleware auth - ตรวจสอบ JWT
 * @middleware role("admin", "owner") - ตรวจสอบบทบาท
 * @body {string} code - รหัสคูปอง (เช่น SUMMER20)
 * @body {number} discountPercent - เปอร์เซ็นต์ส่วนลด (0-100)
 * @body {string} expiresAt - วันหมดอายุ (ISO 8601 format)
 * @response {Object} coupon - ข้อมูลคูปองที่สร้าง
 */
router.post(
  "/",
  auth,
  role("admin", "owner"),
  couponController.createCoupon
);

/**
 * @route GET /api/coupons
 * @description ดึงรายการคูปองทั้งหมด
 * @access Public (ไม่ต้องล็อกอิน)
 * @response {Array} coupons - อาร์เรย์ของคูปอง
 * 
 * ข้อมูลที่ส่งกลับ:
 * - code, discountPercent, expiresAt
 * - claimedUsers (ผู้ที่รับแล้ว)
 */
router.get(
  "/",
  couponController.getCoupons
);

/**
 * @route POST /api/coupons/:id/claim
 * @description ผู้ใช้รับคูปอง
 * @param {string} id - รหัส ID ของคูปอง
 * @access Private (ต้องล็อกอิน)
 * @middleware auth - ตรวจสอบ JWT
 * @response {Object} ข้อความยืนยัน
 * 
 * ขั้นตอน:
 * 1. ค้นหาคูปองจาก ID
 * 2. ตรวจสอบว่าผู้ใช้ยังไม่ได้รับ (กันรับซ้ำ)
 * 3. บันทึก ID ผู้ใช้ใน claimedUsers
 * 4. บันทึก ID ผู้ใช้ใน usedBy (ตามต้องการ)
 */
router.post(
  "/:id/claim",
  auth,
  couponController.claimCoupon
);

// ==================== EXPORT ====================

/**
 * ส่งออก router
 * ใช้ใน server.js: app.use('/api/coupons', couponRoutes);
 */
module.exports = router;