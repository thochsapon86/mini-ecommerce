/**
 * ========================
 * ไฟล์ Owner Routes
 * ========================
 * กำหนดเส้นทาง API สำหรับเจ้าของร้าน (Owner)
 * เฉพาะผู้มีบทบาท owner หรือ admin เท่านั้น
 * 
 * ฟังก์ชัน:
 * - ดูคำสั่งซื้อของสินค้าที่ตัวเองสร้าง
 * - ดูการชำระเงินที่เกี่ยวข้องกับสินค้า
 * - อัปเดตสถานะคำสั่ง
 * 
 * ความแตกต่างจาก Admin:
 * - Owner เห็นเฉพาะคำสั่งของสินค้าที่ตัวเองสร้าง
 * - Admin เห็นทุกคำสั่ง
 */

// ==================== นำเข้า Dependencies ====================

// express - เฟรมเวิร์ก web server
const express = require("express");

// สร้าง router instance เพื่อจัดกลุ่มเส้นทาง
const router = express.Router();

// ==================== นำเข้า Middleware ====================

// ตรวจสอบ JWT token ของผู้ใช้
const auth = require("../middleware/authMiddleware");

// ตรวจสอบบทบาท (role) ของผู้ใช้
const role = require("../middleware/roleMiddleware");

// ==================== นำเข้า Model ====================

// โมเดล Order สำหรับดึงคำสั่งซื้อ
const Order = require("../models/Order");

// โมเดล Payment สำหรับดึงข้อมูลการชำระเงิน
const Payment = require("../models/Payment");

// โมเดล Product สำหรับหาสินค้าของ owner
const Product = require("../models/Product");

// ==================== ROUTES ====================

/**
 * @route GET /api/owner/orders
 * @description ดึงรายการคำสั่งซื้อของสินค้าที่ owner สร้าง
 * @access Private - Owner/Admin only
 * @middleware auth - ตรวจสอบ JWT
 * @middleware role("owner", "admin") - ตรวจสอบบทบาท
 * @response {Array} orders - คำสั่งซื้อที่มีสินค้าของ owner นี้
 * 
 * ขั้นตอน:
 * 1. ค้นหาสินค้าทั้งหมดที่ owner สร้าง
 * 2. หคำสั่งซื้อที่มีสินค้าเหล่านี้
 * 3. Populate ข้อมูลผู้ใช้, สินค้า, และคูปอง
 * 4. เรียงลำดับ: ล่าสุดก่อน
 */
router.get("/orders", auth, role("owner", "admin"), async (req, res) => {
  try {
    // ==================== หาสินค้าของ Owner ====================
    // ค้นหาสินค้าทั้งหมดที่ owner คนนี้สร้าง
    const myProducts = await Product.find({ createdBy: req.user.id }).select("_id");

    // ดึgเฉพาะ ID ของสินค้า
    const myProductIds = myProducts.map(p => p._id);

    // ==================== หาคำสั่งซื้อ ====================
    /**
     * $in operator: ค้นหา orders ที่มี items.product เป็นหนึ่งใน myProductIds
     * เช่น: ถ้า owner มีสินค้า A, B, C
     *     จะดึงคำสั่งที่มีสินค้า A, B, หรือ C
     */
    const orders = await Order.find({
      "items.product": { $in: myProductIds }
    })
      // ดึงข้อมูลผู้ซื้อ เฉพาะ name และ email
      .populate("user", "name email")
      // ดึงข้อมูลสินค้า เฉพาะ name, price, image
      .populate("items.product", "name price image")
      // ดึงข้อมูลคูปอง (ถ้ามี) เฉพาะ code และ discountPercent
      .populate("coupon", "code discountPercent")
      // เรียงลำดับ: ล่าสุดก่อน (-1 = descending)
      .sort({ createdAt: -1 });

    // ส่งรายการคำสั่งกลับไป
    res.json(orders);

  } catch (err) {
    console.error("Get owner orders error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/owner/payments
 * @description ดึงการชำระเงินของลูกค้าที่ซื้อสินค้าของ owner
 * @access Private - Owner/Admin only
 * @middleware auth
 * @middleware role("owner", "admin")
 * @response {Array} payments - บันทึกการชำระเงิน
 * 
 * ขั้นตอน:
 * 1. ค้นหาสินค้าทั้งหมดของ owner
 * 2. ค้นหาคำสั่งซื้อที่มีสินค้าเหล่านั้น
 * 3. ดึง ID ของลูกค้า (user)
 * 4. ค้นหาการชำระเงินของลูกค้าเหล่านั้น
 */
router.get("/payments", auth, role("owner", "admin"), async (req, res) => {
  try {
    // ==================== หาสินค้าของ Owner ====================
    const myProducts = await Product.find({ createdBy: req.user.id }).select("_id");
    const myProductIds = myProducts.map(p => p._id);

    // ==================== หาคำสั่งซื้อของ Owner ====================
    /**
     * ค้นหาคำสั่งซื้อที่มีสินค้าของ owner
     * และดึงเฉพาะฟิลด์ user (ID ของผู้ซื้อ)
     */
    const orders = await Order.find({
      "items.product": { $in: myProductIds }
    }).select("user");

    // ==================== หา User IDs ที่ไม่ซ้ำกัน ====================
    /**
     * [...new Set()] ใช้สำหรับลบ ID ที่ซ้ำ
     * toString() ใช้สำหรับแปลง ObjectId เป็น string
     */
    const userIds = [...new Set(orders.map(o => o.user.toString()))];

    // ==================== หาการชำระเงิน ====================
    /**
     * $in operator: ค้นหา payments ที่ user เป็นหนึ่งใน userIds
     * เช่น: หา payments ของ user 1, 2, 3
     */
    const payments = await Payment.find({ user: { $in: userIds } })
      // ดึงข้อมูลผู้ใช้ เฉพาะ name และ email
      .populate("user", "name email")
      // เรียงลำดับ: ล่าสุดก่อน
      .sort({ createdAt: -1 });

    // ส่งรายการการชำระเงินกลับไป
    res.json(payments);

  } catch (err) {
    console.error("Get owner payments error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route PUT /api/owner/orders/:id/status
 * @description อัปเดตสถานะคำสั่งซื้อ
 * @param {string} id - รหัส ID ของคำสั่งซื้อ
 * @access Private - Owner/Admin only
 * @middleware auth
 * @middleware role("owner", "admin")
 * @body {string} status - สถานะใหม่
 * @response {Object} order - คำสั่งที่อัปเดตแล้ว
 * 
 * สถานะที่อนุญาต:
 * - pending: รอการยืนยัน
 * - confirmed: ยืนยันแล้ว
 * - shipping: กำลังส่ง
 * - delivered: ส่งสำเร็จ
 * - cancelled: ยกเลิก
 */
router.put("/orders/:id/status", auth, role("owner", "admin"), async (req, res) => {
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
      req.params.id,                  // ID ของคำสั่ง
      { status },                     // ข้อมูลที่อัปเดต
      { new: true }                   // ส่งคำสั่งที่อัปเดตแล้ว
    ).populate("user", "name email"); // ดึงข้อมูลผู้ใช้

    // ส่งข้อมูลคำสั่งที่อัปเดตกลับไป
    res.json(order);

  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== EXPORT ====================

/**
 * ส่งออก router
 * ใช้ใน server.js: app.use('/api/owner', ownerRoutes);
 */
module.exports = router;