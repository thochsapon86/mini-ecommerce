const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Coupon = require("../models/Coupon");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/checkout", authMiddleware, async (req, res) => {
  try {
    const { couponCode } = req.body;  // ← รับ couponCode จาก body

    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalPrice = 0;
    const orderItems = cart.items.map((item) => {
      totalPrice += item.product.price * item.quantity;
      return {
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      };
    });

    // ── ตรวจสอบคูปอง ──────────────────────────
    let discount = 0;
    let couponDoc = null;

    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode });

      if (!couponDoc) {
        return res.status(400).json({ message: "Invalid coupon" });
      }

      if (new Date() > new Date(couponDoc.expiresAt)) {
        return res.status(400).json({ message: "Coupon expired" });
      }

      if (!couponDoc.claimedUsers.includes(req.user.id)) {
        return res.status(400).json({ message: "คุณยังไม่ได้รับคูปองนี้" });
      }

      discount = (totalPrice * couponDoc.discountPercent) / 100;
    }
    // ──────────────────────────────────────────

    const finalPrice = totalPrice - discount;

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalPrice,
      discount,        // ← เพิ่ม
      finalPrice,      // ← เพิ่ม
      coupon: couponDoc ? couponDoc._id : null,  // ← เพิ่ม
    });

    if (couponDoc) {
      await Coupon.findByIdAndUpdate(
        couponDoc._id,
        { $addToSet: { usedBy: req.user.id } } // addToSet กัน duplicate
      );
    }

    cart.items = [];
    await cart.save();

    res.status(201).json({ message: "Checkout success", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;