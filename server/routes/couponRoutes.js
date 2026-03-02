// Router module สำหรับจัดการเส้นทางที่เกี่ยวกับคูปอง (coupons)
// ทุกเส้นทางในไฟล์นี้จะถูกต่อเข้ากับ base path ที่กำหนดใน server.js

const express = require("express");
// สร้าง router สร้างอินสแตนซ์ของ Router เพื่อแยกกลุ่มเส้นทาง
const router = express.Router();

// นำเข้า controller ซึ่งเก็บฟังก์ชันต่าง ๆ ที่มีตรรกะการทำงานสำหรับคูปอง
const couponController = require("../controllers/couponController");
// middleware ตรวจสอบ JWT token ที่ส่งมาจาก client
const auth = require("../middleware/authMiddleware");
// middleware ตรวจสอบบทบาทของผู้ใช้ (role) เช่น admin, owner เป็นต้น
const role = require("../middleware/roleMiddleware");

// ------------------------------------------------------------------
// สร้างคูปองใหม่
// เส้นทาง: POST /api/coupons/
// ความปลอดภัย: ต้องล็อกอิน (auth) และต้องมี role เป็น "admin" หรือ "owner"
// คำอธิบาย: เมื่อผู้ใช้ที่มีสิทธิสร้างคูปองเรียก endpoint นี้, โค้ดจะ
// รับข้อมูลคูปองจาก req.body และเรียกฟังก์ชัน createCoupon ของ controller
// ------------------------------------------------------------------
router.post(
  "/",
  auth,
  role("admin", "owner"),
  couponController.createCoupon
);

// ------------------------------------------------------------------
// ดึงรายการคูปองทั้งหมด
// เส้นทาง: GET /api/coupons/
// ความปลอดภัย: เปิดให้ทุกคน (ไม่ต้องล็อกอิน) เพื่อให้ง่ายต่อการ
// แสดงหน้าร้านหรือหน้าคูปองทั่วไป
// ------------------------------------------------------------------
router.get(
  "/",
  couponController.getCoupons
);

// ------------------------------------------------------------------
// รับคูปอง (claim) โดยผู้ใช้งาน
// เส้นทาง: POST /api/coupons/:id/claim
// ความปลอดภัย: ต้องล็อกอิน (auth) เพราะต้องเก็บว่าผู้ใช้ไหน claim แล้ว
// คำอธิบาย: จะตรวจสอบว่าคูปองมีอยู่จริงหรือไม่, และอัพเดตรายการ
// claimedUsers ของคูปองให้รวม user ที่ร้องขอด้วย
// ------------------------------------------------------------------
router.post(
  "/:id/claim",
  auth,
  couponController.claimCoupon
);

// ส่ง router นี้ให้ server.js เพื่อติดตั้งลงบนแอปหลัก
module.exports = router;