/**
 * ========================
 * ไฟล์ Cart Routes
 * ========================
 * กำหนดเส้นทาง API สำหรับจัดการตะกร้าสินค้า
 * ต้องล็อกอินก่อน (Protected Routes)
 * 
 * ฟังก์ชัน:
 * - ดูตะกร้าสินค้า (Get Cart)
 * - เพิ่มสินค้า (Add to Cart)
 * - ลบสินค้า (Remove from Cart)
 * - ล้างตะกร้า (Clear Cart)
 */

// ==================== นำเข้า Dependencies ====================

// express - เฟรมเวิร์ก web server
const express = require("express");

// สร้าง router instance เพื่อจัดกลุ่มเส้นทาง
const router = express.Router();

// ==================== นำเข้า Controller ====================

/**
 * นำเข้าฟังก์ชัน controller สำหรับจัดการตะกร้า
 * จากไฟล์ cartController.js
 */
const {
  getMyCart,      // ดูตะกร้า
  addToCart,      // เพิ่มสินค้า
  removeFromCart, // ลบสินค้า
  clearCart,      // ล้างตะกร้า
} = require("../controllers/cartController");

// ==================== นำเข้า Middleware ====================

// ตรวจสอบ JWT token ของผู้ใช้
const authMiddleware = require("../middleware/authMiddleware");

// ==================== ROUTES ====================

/**
 * @route GET /api/cart
 * @description ดึงข้อมูลตะกร้าของผู้ใช้ที่ล็อกอิน
 * @access Private (ต้องล็อกอิน)
 * @middleware authMiddleware
 * @response {Object} cart - ข้อมูลตะกร้า พร้อมรายละเอียดสินค้า
 */
router.get("/", authMiddleware, getMyCart);

/**
 * @route POST /api/cart/add
 * @description เพิ่มสินค้าเข้าตะกร้า
 * @access Private (ต้องล็อกอิน)
 * @middleware authMiddleware
 * @body {string} productId - รหัส ID ของสินค้า
 * @body {number} quantity - จำนวนสินค้าที่ต้องการเพิ่ม
 * @response {Object} cart - ข้อมูลตะกร้าที่อัปเดต
 * 
 * ขั้นตอน:
 * 1. ตรวจสอบสินค้ามีอยู่และมีคลังเพียงพอ
 * 2. เพิ่มเข้าตะกร้า (หรือเพิ่มจำนวนถ้ามีอยู่แล้ว)
 * 3. หัก stock
 */
router.post("/add", authMiddleware, addToCart);

/**
 * @route POST /api/cart/remove
 * @description ลบสินค้าออกจากตะกร้า
 * @access Private (ต้องล็อกอิน)
 * @middleware authMiddleware
 * @body {string} productId - รหัส ID ของสินค้าที่ต้องลบ
 * @response {Object} cart - ข้อมูลตะกร้าที่อัปเดต
 * 
 * ขั้นตอน:
 * 1. ค้นหาสินค้าในตะกร้า
 * 2. คืน stock
 * 3. ลบสินค้าออก
 */
router.post("/remove", authMiddleware, removeFromCart);

/**
 * @route POST /api/cart/clear
 * @description ล้างรายการสินค้าทั้งหมดในตะกร้า
 * @access Private (ต้องล็อกอิน)
 * @middleware authMiddleware
 * @response {Object} ข้อความยืนยันการล้าง
 * 
 * ขั้นตอน:
 * 1. คืน stock ของสินค้าทั้งหมด
 * 2. ล้างตะกร้า
 */
router.post("/clear", authMiddleware, clearCart);

// ==================== EXPORT ====================

/**
 * ส่งออก router
 * ใช้ใน server.js: app.use('/api/cart', cartRoutes);
 */
module.exports = router;