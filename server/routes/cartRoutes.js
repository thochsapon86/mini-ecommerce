// สร้าง router สำหรับ cart endpoints
const express = require("express");
const router = express.Router();

// นำเข้า controller ฟังก์ชันสำหรับจัดการ cart
const {
  getMyCart,
  addToCart,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

// นำเข้า middleware ตรวจสอบการล็อกอิน
const authMiddleware = require("../middleware/authMiddleware");

// GET /api/cart/ -> ดู cart ของผู้ที่ล็อกอิน
router.get("/", authMiddleware, getMyCart);

// POST /api/cart/add -> เพิ่มสินค้าเข้าตะกร้า
router.post("/add", authMiddleware, addToCart);

// POST /api/cart/remove -> ลบสินค้าจากตะกร้า
router.post("/remove", authMiddleware, removeFromCart);

// POST /api/cart/clear -> ล้างตะกร้า
router.post("/clear", authMiddleware, clearCart);

module.exports = router;