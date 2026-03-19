/**
 * ========================
 * ไฟล์ Admin Routes
 * ========================
 * กำหนดเส้นทาง API สำหรับการบริหารจัดการ
 * เฉพาะผู้ดูแลระบบ (admin) เท่านั้น
 * 
 * ฟังก์ชัน:
 * - จัดการผู้ใช้ (ดู, แก้ไข บทบาท, ลบ)
 * - ดูและจัดการคำสั่งซื้อ
 * - ดูและจัดการการชำระเงิน
 * - อัปเดตสถานะคำสั่งซื้อ
 */

// ==================== นำเข้า Dependencies ====================

// express - เฟรมเวิร์กสำหรับสร้าง web server
const express = require("express");
// สร้าง router instance เพื่อจัดกลุ่มเส้นทาง
const router = express.Router();

// ==================== นำเข้า Middleware ====================

// ตรวจสอบ JWT token ของผู้ใช้
const authMiddleware = require("../middleware/authMiddleware");

// ตรวจสอบบทบาท (role) ของผู้ใช้
const roleMiddleware = require("../middleware/roleMiddleware");

// ==================== นำเข้า Model ====================

// โมเดล Order สำหรับดึงข้อมูลคำสั่งซื้อ
const Order = require("../models/Order");

// โมเดล Payment สำหรับดึงข้อมูลการชำระเงิน
const Payment = require("../models/Payment");

// ==================== นำเข้า Controller ====================

// นำเข้าฟังก์ชัน controller สำหรับจัดการผู้ใช้
const {
  getAllUsers,      // ดูผู้ใช้ทั้งหมด
  updateUserRole,   // แก้ไขบทบาท
  deleteUser,       // ลบผู้ใช้
} = require("../controllers/adminController");

// ==================== ROUTES ====================

// ==================== ผู้ใช้ ====================

/**
 * @route GET /api/admin/users
 * @description ดึงรายการผู้ใช้ทั้งหมด
 * @access Admin only
 * @middleware authMiddleware - ต้องล็อกอิน
 * @middleware roleMiddleware("admin") - ต้องเป็น admin
 */
router.get(
  "/users",
  authMiddleware,
  roleMiddleware("admin"),
  getAllUsers
);

/**
 * @route PUT /api/admin/users/:id
 * @description แก้ไขบทบาทของผู้ใช้
 * @param {string} id - ID ของผู้ใช้
 * @body {string} role - บทบาทใหม่ (user, admin, owner)
 * @access Admin only
 */
router.put(
  "/users/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateUserRole
);

/**
 * @route DELETE /api/admin/users/:id
 * @description ลบผู้ใช้เพียงคนเดียว
 * @param {string} id - ID ของผู้ใช้
 * @access Admin only
 */
router.delete(
  "/users/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteUser
);

// ==================== คำสั่งซื้อ (Orders) ====================

/**
 * @route GET /api/admin/orders
 * @description ดึงรายการคำสั่งซื้อทั้งหมด (admin ทั้งหมด)
 * @access Admin only
 * @response {Array} orders - อาร์เรย์ของคำสั่งซื้อ
 * 
 * ข้อมูลที่ดึง:
 * - user ชื่อและอีเมล
 * - items.product ชื่อ ราคา รูปภาพ
 * - coupon รหัสและเปอร์เซ็นต์ส่วนลด
 */
router.get("/orders", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    // ==================== ดึง Orders ====================
    const orders = await Order.find()
      // ดึงข้อมูล user (populate) เฉพาะ name และ email
      .populate("user", "name email")
      // ดึงข้อมูลสินค้า เฉพาะ name, price, image
      .populate("items.product", "name price image")
      // ดึงข้อมูลคูปอง เฉพาะ code และ discountPercent
      .populate("coupon", "code discountPercent")
      // เรียงลำดับ: ล่าสุดก่อน (-1 = descending)
      .sort({ createdAt: -1 });

    // ส่งรายการคำสั่งซื้อกลับ
    res.json(orders);

  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route PUT /api/admin/orders/:id/status
 * @description อัปเดตสถานะของคำสั่งซื้อ
 * @param {string} id - ID ของคำสั่งซื้อ
 * @body {string} status - สถานะใหม่
 * @access Admin only
 * 
 * สถานะที่อนุญาต:
 * - pending: รอการยืนยัน
 * - confirmed: ยืนยันแล้ว
 * - shipping: กำลังส่ง
 * - delivered: ส่งสำเร็จ
 * - cancelled: ยกเลิก
 */
router.put("/orders/:id/status", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    // ==================== ดึงสถานะใหม่ ====================
    const { status } = req.body;

    // ==================== ตรวจสอบสถานะ ====================
    // รายการสถานะที่อนุญาต
    const allowed = ["pending", "confirmed", "shipping", "delivered", "cancelled"];

    // ถ้าสถานะไม่ถูกต้อง
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
    }

    // ==================== อัปเดตสถานะ ====================
    const order = await Order.findByIdAndUpdate(
      req.params.id,              // ID ของคำสั่งซื้อ
      { status },                 // ข้อมูลที่อัปเดต
      { new: true }               // ส่งคำสั่งซื้อที่อัปเดตแล้ว
    );

    // ส่งข้อมูลคำสั่งซื้อที่อัปเดตกลับมา
    res.json(order);

  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== การชำระเงิน (Payments) ====================

/**
 * @route GET /api/admin/payments
 * @description ดึงรายการการชำระเงินทั้งหมด
 * @access Admin only
 * @response {Array} payments - อาร์เรย์ของบันทึกการชำระเงิน
 * 
 * ข้อมูลที่ดึง:
 * - user ชื่อและอีเมล
 * - เรียงลำดับ: ล่าสุดก่อน
 */
router.get("/payments", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    // ==================== ดึง Payments ====================
    const payments = await Payment.find()
      // ดึงข้อมูลผู้ใช้ เฉพาะ name และ email
      .populate("user", "name email")
      // เรียงลำดับ: ล่าสุดก่อน
      .sort({ createdAt: -1 });

    // ส่งรายการการชำระเงินกลับมา
    res.json(payments);

  } catch (err) {
    console.error("Get all payments error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== EXPORT ====================

/**
 * ส่งออก router
 * ใช้ใน server.js: app.use('/api/admin', adminRoutes);
 */
module.exports = router;