const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const Order = require("../models/Order");
const Payment = require("../models/Payment");
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
} = require("../controllers/adminController");

router.get(
  "/users",
  authMiddleware,
  roleMiddleware("admin"),
  getAllUsers
);

router.put(
  "/users/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateUserRole
);

router.delete(
  "/users/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteUser
);

// ── ดู Order ทั้งหมด ──────────────────────────────────────────────
router.get("/orders", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name price image")
      .populate("coupon", "code discountPercent")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── ดู Payment ทั้งหมด ────────────────────────────────────────────
router.get("/payments", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── อัปเดตสถานะ Order ────────────────────────────────────────────
router.put("/orders/:id/status", authMiddleware, roleMiddleware("admin"), async (req, res) => {
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
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;