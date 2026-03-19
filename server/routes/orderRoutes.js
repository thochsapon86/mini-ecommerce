/**
 * ========================
 * ไฟล์ Order Routes
 * ========================
 * กำหนดเส้นทาง API สำหรับสร้างคำสั่งซื้อ (Checkout)
 * ต้องล็อกอินก่อน (Protected)
 * 
 * ฟังก์ชัน:
 * - Checkout - สร้างคำสั่งซื้อจากตะกร้า พร้อมคูปอง
 * 
 * ขั้นตอน:
 * 1. ตรวจสอบตะกร้า
 * 2. คำนวณราคารวม
 * 3. ตรวจสอบและถูกคูปอง (ถ้ามี)
 * 4. สร้างคำสั่งซื้อ
 * 5. ล้างตะกร้า
 */

// ==================== นำเข้า Dependencies ====================

// express - เฟรมเวิร์ก web server
const express = require("express");

// สร้าง router instance เพื่อจัดกลุ่มเส้นทาง
const router = express.Router();

// ==================== นำเข้า Model ====================

// โมเดล Order สำหรับบันทึกคำสั่งซื้อ
const Order = require("../models/Order");

// โมเดล Cart สำหรับดึงตะกร้า
const Cart = require("../models/Cart");

// โมเดล Coupon สำหรับตรวจสอบคูปอง
const Coupon = require("../models/Coupon");

// ==================== นำเข้า Middleware ====================

// ตรวจสอบ JWT token ของผู้ใช้
const authMiddleware = require("../middleware/authMiddleware");

// ==================== ROUTES ====================

/**
 * @route POST /api/orders/checkout
 * @description สร้างคำสั่งซื้อจากตะกร้า พร้อมใช้คูปอง (ถ้ามี)
 * @access Private (ต้องล็อกอิน)
 * @middleware authMiddleware
 * @body {string} couponCode - (ไม่บังคับ) รหัสคูปอง
 * @response {Object} order - ข้อมูลคำสั่งซื้อที่สร้าง
 * 
 * ขั้นตอน:
 * 1. ดึงตะกร้าของผู้ใช้
 * 2. ตรวจสอบว่าตะกร้าไม่ว่าง
 * 3. คำนวณราคารวม
 * 4. ตรวจสอบคูปอง (ถ้ามี):
 *    - คูปองมีอยู่
 *    - ยังไม่หมดอายุ
 *    - ผู้ใช้ได้รับคูปองแล้ว
 * 5. คำนวณส่วนลด
 * 6. สร้างคำสั่งซื้อ
 * 7. ล้างตะกร้า
 */
router.post("/checkout", authMiddleware, async (req, res) => {
  try {
    // ==================== ดึงข้อมูล ====================
    // รับรหัสคูปอง (ถ้ามี) จาก request body
    const { couponCode } = req.body;

    // ==================== ขั้นตอนที่ 1: หา Cart ====================
    // ค้นหาตะกร้าของผู้ใช้ที่ล็อกอิน และดึงข้อมูลสินค้า
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product");

    // 检查ตะกร้ามีสินค้าหรือไม่
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty"
      });
    }

    // ==================== ขั้นตอนที่ 2: คำนวณราคารวม ====================
    let totalPrice = 0;

    // สร้างรายการสินค้าสำหรับ order
    const orderItems = cart.items.map((item) => {
      // เพิ่มราคารวม (ราคาต่อหน่วย × จำนวน)
      totalPrice += item.product.price * item.quantity;

      // ส่งคืนข้อมูลสินค้า
      return {
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      };
    });

    // ==================== ขั้นตอนที่ 3: ตรวจสอบคูปอง ====================
    let discount = 0;           // ส่วนลด
    let couponDoc = null;       // เอกสารคูปอง

    // ถ้ามีรหัสคูปอง
    if (couponCode) {
      // ค้นหาคูปองจากรหัส
      couponDoc = await Coupon.findOne({ code: couponCode });

      // ตรวจสอบว่าคูปองมีอยู่
      if (!couponDoc) {
        return res.status(400).json({
          message: "Invalid coupon"
        });
      }

      // ตรวจสอบว่าคูปองยังไม่หมดอายุ
      if (new Date() > new Date(couponDoc.expiresAt)) {
        return res.status(400).json({
          message: "Coupon expired"
        });
      }

      // ตรวจสอบว่าผู้ใช้ได้รับคูปองแล้ว
      if (!couponDoc.claimedUsers.includes(req.user.id)) {
        return res.status(400).json({
          message: "คุณยังไม่ได้รับคูปองนี้"
        });
      }

      // คำนวณส่วนลด
      discount = (totalPrice * couponDoc.discountPercent) / 100;
    }

    // ==================== ขั้นตอนที่ 4: คำนวณราคาสุทธิ ====================
    const finalPrice = totalPrice - discount;

    // ==================== ขั้นตอนที่ 5: สร้าง Order ====================
    const order = await Order.create({
      user: req.user.id,                              // ID ผู้ใช้
      items: orderItems,                              // รายการสินค้า
      totalPrice,                                     // ราคารวม
      discount,                                       // ส่วนลด
      finalPrice,                                     // ราคาที่ต้องชำระ
      coupon: couponDoc ? couponDoc._id : null,      // ID คูปอง (ถ้ามี)
    });

    // ==================== ขั้นตอนที่ 6: บันทึกการใช้คูปอง ====================
    // ถ้าใช้คูปอง ให้บันทึก user ที่ใช้
    if (couponDoc) {
      await Coupon.findByIdAndUpdate(
        couponDoc._id,
        { $addToSet: { usedBy: req.user.id } }  // $addToSet = กันการเพิ่มซ้ำ
      );
    }

    // ==================== ขั้นตอนที่ 7: ล้างตะกร้า ====================
    cart.items = [];
    await cart.save();

    // ส่งคำสั่งซื้อที่สร้างกลับไป
    res.status(201).json({ 
      message: "Checkout success", 
      order 
    });

  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== EXPORT ====================

/**
 * ส่งออก router
 * ใช้ใน server.js: app.use('/api/orders', orderRoutes);
 */
module.exports = router;