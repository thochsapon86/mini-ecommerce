const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Coupon = require("../models/Coupon");


// =====================================================
// CHECKOUT + APPLY COUPON
// =====================================================
exports.checkout = async (req, res) => {
  try {

    const userId = req.user.id;

    // รับ couponCode จาก body
    const { couponCode } = req.body;

    // ----------------------------------
    // 1️⃣ หา cart
    // ----------------------------------
    const cart = await Cart.findOne({ user: userId })
      .populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty"
      });
    }

    // ----------------------------------
    // 2️⃣ คำนวณราคารวม
    // ----------------------------------
    let totalPrice = 0;

    const orderItems = cart.items.map(item => {
      totalPrice += item.product.price * item.quantity;

      return {
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      };
    });

    // ----------------------------------
    // 3️⃣ ตรวจสอบ Coupon
    // ----------------------------------
    let discount = 0;
    let couponDoc = null;

    if (couponCode) {

      // หา coupon จาก code
      couponDoc = await Coupon.findOne({
        code: couponCode
      });

      if (!couponDoc) {
        return res.status(400).json({
          message: "Invalid coupon"
        });
      }

      // เช็ควันหมดอายุ
      if (couponDoc.expireAt < new Date()) {
        return res.status(400).json({
          message: "Coupon expired"
        });
      }

      // คิด % ส่วนลด
      discount = (totalPrice * couponDoc.discountPercent) / 100;
    }

    // ----------------------------------
    // 4️⃣ คำนวณราคาสุทธิ
    // ----------------------------------
    const finalPrice = totalPrice - discount;

    // ----------------------------------
    // 5️⃣ สร้าง Order
    // ----------------------------------
    const order = new Order({
      user: userId,
      items: orderItems,
      totalPrice,
      discount,
      finalPrice,
      coupon: couponDoc ? couponDoc._id : null
    });

    await order.save();

    // ----------------------------------
    // 6️⃣ ล้าง cart
    // ----------------------------------
    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: "Checkout success",
      order
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};