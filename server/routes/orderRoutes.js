/**
 * Order routes
 * คำอธิบาย: เส้นทางสำหรับการสร้างคำสั่งซื้อ (checkout)
 * หลักการทำงาน:
 * - รับคำขอ checkout จากผู้ใช้ที่ล็อกอิน
 * - ดึง cart, คำนวณราคารวม, ใช้คูปองหากมี และสร้าง Order
 * - ล้าง cart หลังสร้าง order สำเร็จ
 */
// Router สำหรับจัดการคำสั่งซื้อ (orders)
const express = require("express");
const router = express.Router();

// นำเข้าโมเดลที่จำเป็นในขั้นตอน checkout
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product"); // อาจจะใช้ในอนาคต
// middleware สำหรับเช็ค JWT และเติม req.user
const authMiddleware = require("../middleware/authMiddleware");

// ------------------------------------------------------------------
// เส้นทาง POST /api/orders/checkout
// - กลุ่มการทำงาน: สร้าง Order จากข้อมูลในตะกร้าสินค้า
// - ต้องล็อกอินก่อน (authMiddleware)
// - ขั้นตอนโดยสังเขป:
//   1. หา cart ของผู้ใช้และ populate product details
//   2. ถ้า cart ว่าง ให้ส่ง error 400
//   3. คำนวณราคารวม และจัดรูปแบบรายการ orderItems
//   4. สร้างเอกสาร Order ใหม่ในฐานข้อมูล
//   5. ล้างรายการใน cart แล้วบันทึก
//   6. ส่งข้อมูล Order กลับพร้อม status 201
// ------------------------------------------------------------------
router.post("/checkout", authMiddleware, async (req, res) => {
  try {
    // ดึง cart ของผู้ใช้จากฐานข้อมูล
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");

    // ตรวจสอบว่ามี cart หรือยังมีสินค้าอยู่หรือไม่
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // คำนวณราคาทั้งหมดและเตรียม orderItems
    let totalPrice = 0;

    const orderItems = cart.items.map((item) => {
      totalPrice += item.product.price * item.quantity;

      return {
        product: item.product._id, // เก็บเฉพาะ id ของสินค้า
        quantity: item.quantity,
        price: item.product.price, // ราคาต่อหน่วย
      };
    });

    // สร้างคำสั่งซื้อในฐานข้อมูล
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalPrice,
    });

    // ล้างตะกร้าหลังจากสร้างคำสั่งซื้อเสร็จ
    cart.items = [];
    await cart.save();

    // ตอบกลับกับไคลเอนต์
    res.status(201).json(order);
  } catch (err) {
    // เก็บ error เพื่อ debug และตอบ 500
    res.status(500).json({ message: err.message });
  }
});

// ส่ง router ออกไปให้ server.js นำไป mount
module.exports = router;