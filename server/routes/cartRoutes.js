// โมดูล router สำหรับ resource "cart" หรือ "ตะกร้าสินค้า"
// เส้นทางทั้งหมดในโฟลเดอร์นี้จะต่อท้ายด้วย /api/cart เมื่อถูกติดตั้ง

const express = require("express");
const router = express.Router(); // สร้าง router อินสแตนซ์

// นำเข้าฟังก์ชัน controller ที่จะทำงานกับ cart
const {
  getMyCart,
  addToCart,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

// middleware ที่ใช้ตรวจสอบว่าผู้ใช้ล็อกอิน และใส่ข้อมูล user ลงใน req
const authMiddleware = require("../middleware/authMiddleware");

// ------------------------------------------------------------------
// แต่ละ route ด้านล่างนี้ต้องมีการล็อกอินก่อน (จึงใส่ authMiddleware)
// ------------------------------------------------------------------

// GET /api/cart/       -> ดึงข้อมูลตะกร้าของผู้ใช้ที่ล็อกอิน
// - controller: getMyCart จะค้นหา cart ตาม req.user.id และคืนผล
router.get("/", authMiddleware, getMyCart);

// POST /api/cart/add   -> เพิ่มสินค้าลงในตะกร้า
// - ต้องส่ง productId และ quantity ใน body
router.post("/add", authMiddleware, addToCart);

// POST /api/cart/remove -> ลบสินค้าออกจากตะกร้า
// - ส่ง productId ที่ต้องการลบใน body
router.post("/remove", authMiddleware, removeFromCart);

// POST /api/cart/clear  -> ล้างรายการทั้งหมดในตะกร้า
router.post("/clear", authMiddleware, clearCart);

// ส่ง router ออกไปให้ server.js ใช้งาน
module.exports = router;