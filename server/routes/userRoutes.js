/**
 * ========================
 * ไฟล์ User Routes
 * ========================
 * กำหนดเส้นทาง API สำหรับจัดการโปรไฟล์ผู้ใช้
 * ต้องล็อกอินก่อน (Protected Routes)
 * 
 * ฟังก์ชัน:
 * - ดูข้อมูลโปรไฟล์ (Get Profile)
 * - แก้ไขข้อมูลโปรไฟล์ (Update Profile)
 */

// ==================== นำเข้า Dependencies ====================

// express - เฟรมเวิร์ก web server
const express = require("express");

// สร้าง router instance เพื่อจัดกลุ่มเส้นทาง
const router = express.Router();

// ==================== นำเข้า Middleware ====================

// ตรวจสอบ JWT token ของผู้ใช้
const authMiddleware = require("../middleware/authMiddleware");

// ==================== นำเข้า Controller ====================

/**
 * นำเข้าฟังก์ชัน controller สำหรับจัดการโปรไฟล์
 * จากไฟล์ userController.js
 */
const {
  getProfile,       // ดูโปรไฟล์
  updateProfile,    // แก้ไขโปรไฟล์
} = require("../controllers/userController");

// ==================== ROUTES ====================

/**
 * @route GET /api/user/profile
 * @description ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่ล็อกอิน
 * @access Private (ต้องล็อกอิน)
 * @middleware authMiddleware
 * @response {Object} ข้อมูลผู้ใช้ (โดยไม่รวมรหัสผ่าน)
 */
router.get("/profile", authMiddleware, getProfile);

/**
 * @route PUT /api/user/profile
 * @description แก้ไขข้อมูลโปรไฟล์ผู้ใช้
 * @access Private (ต้องล็อกอิน)
 * @middleware authMiddleware
 * @body {string} name - (ไม่บังคับ) ชื่อใหม่
 * @body {string} password - (ไม่บังคับ) รหัสผ่านใหม่
 * @response {Object} ข้อความยืนยันการแก้ไข
 */
router.put("/profile", authMiddleware, updateProfile);

// ==================== EXPORT ====================

/**
 * ส่งออก router
 * ใช้ใน server.js: app.use('/api/user', userRoutes);
 */
module.exports = router;