const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Product = require("../models/Product");

// ── ดู Order ทั้งหมดของสินค้าที่ตัวเองสร้าง ──────────────────────
router.get("/orders", auth, role("owner", "admin"), async (req, res) => {
  try {
    // หาสินค้าที่ owner คนนี้สร้าง
    const myProducts = await Product.find({ createdBy: req.user.id }).select("_id");
    const myProductIds = myProducts.map(p => p._id);

    // หา orders ที่มีสินค้าของ owner นี้
    const orders = await Order.find({
      "items.product": { $in: myProductIds }
    })
      .populate("user", "name email")
      .populate("items.product", "name price image")
      .populate("coupon", "code discountPercent")
      .sort({ createdAt: -1 }); // ล่าสุดก่อน

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── ดู Payment ทั้งหมดที่เกี่ยวข้องกับ Order ของร้าน ─────────────
router.get("/payments", auth, role("owner", "admin"), async (req, res) => {
  try {
    const myProducts = await Product.find({ createdBy: req.user.id }).select("_id");
    const myProductIds = myProducts.map(p => p._id);

    // หา orders ของร้านก่อน
    const orders = await Order.find({
      "items.product": { $in: myProductIds }
    }).select("user");

    const userIds = [...new Set(orders.map(o => o.user.toString()))];

    // หา payments ของ users เหล่านั้น
    const payments = await Payment.find({ user: { $in: userIds } })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── อัปเดตสถานะ Order ───────────────────────────────────────────
router.put("/orders/:id/status", auth, role("owner", "admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "confirmed", "shipping", "delivered", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "name email");

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;