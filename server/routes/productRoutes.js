// โมดูล router สำหรับจัดการเส้นทางที่เกี่ยวข้องกับ "สินค้า"
// เราจะแยกกลุ่มเส้นทางนี้ออกจาก server.js เพื่อความเป็นระเบียบ

const express = require("express");
const router = express.Router(); // สร้างอินสแตนซ์ของ router

// นำเข้าฟังก์ชัน handler ต่าง ๆ จาก productController ซึ่งแต่ละ
// ฟังก์ชันจะรับ (req, res) และทำงานตามชื่อ
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

// middleware ที่ใช้ตรวจสอบสถานะการล็อกอิน และสิทธิ์ของผู้ใช้
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// ----------------------------------------
// เส้นทางสาธารณะ (ไม่ต้องล็อกอิน)
// ----------------------------------------

// GET /api/products
// - ดึงรายการสินค้าทั้งหมดจากฐานข้อมูล
router.get("/", getAllProducts);

// GET /api/products/:id
// - ดึงข้อมูลสินค้าตาม id ที่ระบุใน URL
router.get("/:id", getProductById);

// ----------------------------------------
// เส้นทางป้องกัน (ต้องล็อกอินและมีสิทธิ์)
// ----------------------------------------

// POST /api/products
// - สร้างสินค้าใหม่
// - ต้องล็อกอิน (authMiddleware) และต้องมี role เป็น owner หรือ admin
router.post(
  "/",
  authMiddleware,
  roleMiddleware("owner", "admin"),
  createProduct
);

// PUT /api/products/:id
// - แก้ไขสินค้าเดิม
// - :id ระบุสินค้า
// - ผู้ใช้ต้องเป็น owner/admin
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("owner", "admin"),
  updateProduct
);

// DELETE /api/products/:id
// - ลบสินค้า
// - ต้องเป็น owner/admin
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("owner", "admin"),
  deleteProduct
);

// ส่ง router นี้ออกไปให้ server.js ใช้งาน
module.exports = router;