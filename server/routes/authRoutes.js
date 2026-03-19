/**
 * ========================
 * ไฟล์ Auth Routes
 * ========================
 * กำหนดเส้นทาง API สำหรับการยืนยันตัวตน
 * 
 * ฟังก์ชัน:
 * - ลงทะเบียนผู้ใช้ใหม่ (Register)
 * - เข้าสู่ระบบ (Login)
 * - ลืมรหัสผ่าน (Forgot Password)
 * - รีเซ็ตรหัสผ่าน (Reset Password)
 * 
 * ทั้งหมดนี้เป็นเส้นทาง public (ไม่ต้องล็อกอิน)
 */

// ==================== นำเข้า Dependencies ====================

// express - เฟรมเวิร์ก web server
const express = require("express");

// สร้าง router instance เพื่อจัดกลุ่มเส้นทาง
const router = express.Router();

// ==================== นำเข้า Controller ====================

/**
 * นำเข้าฟังก์ชัน controller สำหรับการยืนยันตัวตน
 * จากไฟล์ authController.js
 */
const { 
  register,         // ลงทะเบียนผู้ใช้ใหม่
  login,            // เข้าสู่ระบบ
  forgotPassword,   // ส่งลิงก์รีเซ็ต
  resetPassword     // รีเซ็ตรหัสผ่าน
} = require("../controllers/authController");

// ==================== ROUTES ====================

/**
 * @route POST /api/auth/register
 * @description ลงทะเบียนผู้ใช้ใหม่
 * @body {string} name - ชื่อผู้ใช้
 * @body {string} email - อีเมล (ต้องไม่ซ้ำ)
 * @body {string} password - รหัสผ่าน
 * @response {Object} ข้อความยืนยันการลงทะเบียน
 * @access Public (ไม่ต้องล็อกอิน)
 * 
 * ขั้นตอน:
 * 1. ตรวจสอบว่าอีเมลไม่ซ้ำ
 * 2. เข้ารหัสรหัสผ่าน
 * 3. บันทึกผู้ใช้ใหม่
 */
router.post("/register", register);

/**
 * @route POST /api/auth/login
 * @description เข้าสู่ระบบและรับ JWT token
 * @body {string} email - อีเมล
 * @body {string} password - รหัสผ่าน
 * @response {Object} token - JWT token
 * @access Public (ไม่ต้องล็อกอิน)
 * 
 * ขั้นตอน:
 * 1. ค้นหาผู้ใช้ด้วยอีเมล
 * 2. เปรียบเทียบรหัสผ่าน
 * 3. สร้าง JWT token
 * 4. ส่ง token กลับไป
 */
router.post("/login", login);

/**
 * @route POST /api/auth/forgot-password
 * @description ขอลิงก์รีเซ็ตรหัสผ่าน
 * @body {string} email - อีเมลของผู้ใช้
 * @response {Object} ข้อความยืนยัน
 * @access Public (ไม่ต้องล็อกอิน)
 * 
 * ขั้นตอน:
 * 1. ค้นหาผู้ใช้ด้วยอีเมล
 * 2. สร้าง reset token
 * 3. ส่งอีเมลพร้อมลิงก์รีเซ็ต
 */
router.post("/forgot-password", forgotPassword);

/**
 * @route POST /api/auth/reset-password/:token
 * @description รีเซ็ตรหัสผ่านด้วย token
 * @param {string} token - Reset token จากอีเมล
 * @body {string} password - รหัสผ่านใหม่
 * @response {Object} ข้อความยืนยัน
 * @access Public (ไม่ต้องล็อกอิน)
 * 
 * ขั้นตอน:
 * 1. ตรวจสอบ token ว่ายังไม่หมดอายุ
 * 2. เข้ารหัสรหัสผ่านใหม่
 * 3. อัปเดตรหัสผ่านของผู้ใช้
 * 4. ล้าง reset token
 */
router.post("/reset-password/:token", resetPassword);

// ==================== EXPORT ====================

/**
 * ส่งออก router
 * ใช้ใน server.js: app.use('/api/auth', authRoutes);
 */
module.exports = router;