/**
 * ========================
 * ไฟล์ Order Controller
 * ========================
 * จัดการกระบวนการ checkout และสร้างคำสั่งซื้อ เช่น:
 * - ตรวจสอบตะกร้า (Validate Cart)
 * - คำนวณราคารวม (Calculate Total)
 * - ตรวจสอบและถูกคูปอง (Apply Coupon)
 * - สร้างคำสั่งซื้อ (Create Order)
 * 
 * หลักการทำงาน:
 * - ค้นหา cart ของผู้ใช้และ populate ข้อมูลสินค้า
 * - คำนวณราคารวมตามสินค้าในตะกร้า
 * - ตรวจสอบคูปอง (ถ้ามี) และคำนวณส่วนลด
 * - สร้าง Order ข้อมูลและล้างตะกร้า
 */

// ==================== นำเข้า Dependencies ====================

// นำเข้าโมเดล Order ที่ใช้สำหรับบันทึกคำสั่งซื้อ
const Order = require("../models/Order");

// นำเข้าโมเดล Cart ที่ใช้สำหรับดึงข้อมูลตะกร้า
const Cart = require("../models/Cart");

// นำเข้าโมเดล Coupon ที่ใช้สำหรับตรวจสอบคูปอง
const Coupon = require("../models/Coupon");

// ==================== ฟังก์ชัน CHECKOUT ====================

/**
 * สร้างคำสั่งซื้อและถูกคูปอง (ถ้ามี)
 * 
 * วัตถุประสงค์:
 * - ตรวจสอบตะกร้าของผู้ใช้
 * - คำนวณราคารวม
 * - ตรวจสอบและถูกคูปอง
 * - สร้างคำสั่งซื้อ
 * - ล้างตะกร้า
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.body - ข้อมูลจากคำขอ HTTP
 *   - couponCode: (ไม่บังคับ) รหัสคูปอง
 * @param {Object} req.user - ข้อมูลผู้ใช้จากการยืนยัน
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อมูลคำสั่งซื้อ
 */
exports.checkout = async (req, res) => {
  try {
    // ==================== ดึงข้อมูล ====================
    // ดึง ID ผู้ใช้
    const userId = req.user.id;

    // ดึงรหัสคูปอง (ถ้ามี)
    const { couponCode } = req.body;

    // ==================== ขั้นตอนที่ 1: หาตะกร้า ====================
    /**
     * ค้นหาตะกร้าของผู้ใช้และ populate ข้อมูลสินค้า
     * populate: จะแทนที่ id สินค้าด้วยข้อมูลสินค้าทั้งหมด
     */
    const cart = await Cart.findOne({ user: userId })
      .populate("items.product");

    // ตรวจสอบว่าตะกร้ามีอยู่และไม่ว่างเปล่า
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty"
      });
    }

    // ==================== ขั้นตอนที่ 2: คำนวณราคารวม ====================
    let totalPrice = 0;

    /**
     * วนลูปสินค้าในตะกร้า
     * คำนวณราคารวม = ราคา × จำนวน
     * สร้าง orderItems สำหรับบันทึก order
     */
    const orderItems = cart.items.map(item => {
      // เพิ่มราคา
      totalPrice += item.product.price * item.quantity;

      // ส่งคืนข้อมูลสินค้าที่ต้องบันทึก
      return {
        product: item.product._id,      // ID สินค้า
        quantity: item.quantity,         // จำนวน
        price: item.product.price        // ราคา
      };
    });

    // ==================== ขั้นตอนที่ 3: ตรวจสอบคูปอง ====================
    let discount = 0;              // ส่วนลด
    let couponDoc = null;          // เอกสารคูปอง

    // ถ้ามีรหัสคูปอง
    if (couponCode) {
      // หาคูปองจากรหัส
      couponDoc = await Coupon.findOne({
        code: couponCode
      });

      // ถ้าไม่พบคูปอง
      if (!couponDoc) {
        return res.status(400).json({
          message: "Invalid coupon"
        });
      }

      // ตรวจสอบว่าคูปองยังไม่หมดอายุ
      if (couponDoc.expireAt < new Date()) {
        return res.status(400).json({
          message: "Coupon expired"
        });
      }

      // คำนวณส่วนลด = ราคารวม × เปอร์เซ็นต์ส่วนลด / 100
      discount = (totalPrice * couponDoc.discountPercent) / 100;
    }

    // ==================== ขั้นตอนที่ 4: คำนวณราคาสุทธิ ====================
    // ราคาสุทธิ = ราคารวม - ส่วนลด
    const finalPrice = totalPrice - discount;

    // ==================== ขั้นตอนที่ 5: สร้าง Order ====================
    // สร้างข้อมูลคำสั่งซื้อใหม่
    const order = new Order({
      user: userId,         // ID ผู้ใช้
      items: orderItems,    // รายการสินค้า
      totalPrice,           // ราคารวม
      discount,             // ส่วนลด
      finalPrice,           // ราคาที่ต้องชำระ
      coupon: couponDoc ? couponDoc._id : null  // ID คูปอง (ถ้ามี)
    });

    // บันทึก order ลงในฐานข้อมูล
    await order.save();

    // ==================== ขั้นตอนที่ 6: ล้างตะกร้า ====================
    // ล้างสินค้าทั้งหมดในตะกร้า
    cart.items = [];
    // บันทึกตะกร้าที่ว่างเปล่า
    await cart.save();

    // บันทึก log
    console.log("✓ Order created successfully:", order._id);

    // ส่งข้อมูล order (Status 201 = Created)
    res.status(201).json({
      message: "Checkout success",
      order
    });

  } catch (error) {
    // บันทึก error log
    console.log("Checkout error:", error);
    res.status(500).json({ message: "Server error" });
  }
};