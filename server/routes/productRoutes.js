/**
 * ========================
 * ไฟล์ Product Routes
 * ========================
 * กำหนดเส้นทาง API สำหรับจัดการสินค้า (CRUD)
 * 
 * ฟังก์ชัน:
 * - ดึงรายการสินค้า (Public)
 * - สร้าง/แก้ไข/ลบสินค้า (Protected - เฉพาะ owner/admin)
 * 
 * การแบ่งสิทธิ์:
 * - GET: สาธารณะ (ไม่ต้องล็อกอิน)
 * - POST/PUT/DELETE: ต้องเป็น owner หรือ admin
 */

// ==================== นำเข้า Dependencies ====================

// express - เฟรมเวิร์ก web server
const express = require("express");

// สร้าง router instance เพื่อจัดกลุ่มเส้นทาง
const router = express.Router();

// ==================== นำเข้า Controller ====================

/**
 * นำเข้าฟังก์ชัน controller สำหรับจัดการสินค้า
 * จากไฟล์ productController.js
 */
const {
  createProduct,    // สร้างสินค้า
  getAllProducts,   // ดึงทั้งหมด
  getProductById,   // ดึงตามรหัส
  updateProduct,    // แก้ไข
  deleteProduct,    // ลบ
} = require("../controllers/productController");

// ==================== นำเข้า Middleware ====================

// ตรวจสอบ JWT token ของผู้ใช้
const authMiddleware = require("../middleware/authMiddleware");

// ตรวจสอบบทบาท (role) ของผู้ใช้
const roleMiddleware = require("../middleware/roleMiddleware");

// ==================== PUBLIC ROUTES (ไม่ต้องล็อกอิน) ====================

/**
 * @route GET /api/products
 * @description ดึงรายการสินค้าทั้งหมด
 * @access Public
 * @response {Array} products - อาร์เรย์ของสินค้าทั้งหมด
 * 
 * ข้อมูลที่ส่งกลับ:
 * - name, description, price, stock, image
 * - createdBy (ข้อมูลผู้สร้าง)
 */
router.get("/", getAllProducts);

/**
 * @route GET /api/products/:id
 * @description ดึงข้อมูลสินค้าตามรหัส ID
 * @param {string} id - รหัส ID ของสินค้า
 * @access Public
 * @response {Object} product - ข้อมูลสินค้า
 */
router.get("/:id", getProductById);

// ==================== PROTECTED ROUTES (ต้องล็อกอิน + role) ====================

/**
 * @route POST /api/products
 * @description สร้างสินค้าใหม่
 * @access Private - Owner/Admin only
 * @middleware authMiddleware - ต้องล็อกอิน
 * @middleware roleMiddleware("owner", "admin") - ต้องเป็น owner หรือ admin
 * @body {string} name - ชื่อสินค้า
 * @body {string} description - รายละเอียด
 * @body {number} price - ราคา
 * @body {number} stock - จำนวนคลัง
 * @body {string} image - URL รูปภาพ
 * @response {Object} product - ข้อมูลสินค้าที่สร้าง
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("owner", "admin"),
  createProduct
);

/**
 * @route PUT /api/products/:id
 * @description แก้ไขข้อมูลสินค้า
 * @param {string} id - รหัส ID ของสินค้า
 * @access Private - Owner/Admin only
 * @middleware authMiddleware - ต้องล็อกอิน
 * @middleware roleMiddleware("owner", "admin")
 * @body {Object} - ข้อมูลที่ต้องการแก้ไข (name, price, stock, etc.)
 * @response {Object} product - ข้อมูลสินค้าที่แก้ไขแล้ว
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("owner", "admin"),
  updateProduct
);

/**
 * @route DELETE /api/products/:id
 * @description ลบสินค้า
 * @param {string} id - รหัส ID ของสินค้า
 * @access Private - Owner/Admin only
 * @middleware authMiddleware - ต้องล็อกอิน
 * @middleware roleMiddleware("owner", "admin")
 * @response {Object} ข้อความยืนยันการลบ
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("owner", "admin"),
  deleteProduct
);

// ==================== EXPORT ====================

/**
 * ส่งออก router
 * ใช้ใน server.js: app.use('/api/products', productRoutes);
 */
module.exports = router;