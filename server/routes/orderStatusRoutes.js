/**
 * orderStatusRoutes.js
 * ═══════════════════════════════════════════════════════════════════
 * Routes สำหรับระบบติดตามและจัดการสถานะคำสั่งซื้อ
 *
 * Flow สถานะทั้งหมด:
 * ┌─────────────────────────────────────────────────────────┐
 * │  pending → confirmed → shipping → delivered ✅          │
 * │                ↓                                        │
 * │         cancel_requested → cancelled ❌                 │
 * │         (pending ก็ยกเลิกได้เช่นกัน)                   │
 * └─────────────────────────────────────────────────────────┘
 *
 * สิทธิ์การเข้าถึงแต่ละ route:
 *   User  → GET /my, POST /:id/cancel-request, POST /:id/confirm-delivery
 *   Owner → PUT /:id/status, POST /:id/confirm-sent, POST /:id/cancel-response
 *   Admin → เหมือน Owner (ผ่าน role middleware)
 *
 * ใช้งานใน server.js:
 *   app.use("/api/order-status", orderStatusRoutes);
 */

// ── นำเข้า Dependencies ───────────────────────────────────────────

// express - web framework สำหรับสร้าง HTTP server
const express = require("express");

// สร้าง router instance แยกออกมาจาก app หลัก
// ทำให้จัดกลุ่ม routes ได้สะดวกและ import ไปใช้ใน server.js ได้
const router = express.Router();

// Order model - schema ของคำสั่งซื้อใน MongoDB
const Order = require("../models/Order");

// Product model - ใช้สำหรับคืน stock เมื่อยกเลิก order
const Product = require("../models/Product");

// authMiddleware - ตรวจสอบ JWT token ก่อนเข้า route
// ถ้าไม่มี token หรือ token ไม่ถูกต้องจะ return 401
const auth = require("../middleware/authMiddleware");

// roleMiddleware - ตรวจสอบ role ของ user
// เช่น role("owner", "admin") = เฉพาะ owner หรือ admin เท่านั้น
const role = require("../middleware/roleMiddleware");


// ════════════════════════════════════════════════════════════════════
// USER ROUTES — เฉพาะ user เจ้าของ order เท่านั้น
// ════════════════════════════════════════════════════════════════════

/**
 * GET /api/order-status/my
 * ─────────────────────────────────────────────────────────────────
 * ดึงคำสั่งซื้อทั้งหมดของ user ที่ login อยู่
 *
 * การทำงาน:
 * 1. ค้นหา Order ที่ user field ตรงกับ id ของ user ที่ login
 * 2. populate("items.product") → แทนที่ product id ด้วยข้อมูลสินค้าจริง
 * 3. populate("coupon") → แทนที่ coupon id ด้วยข้อมูลคูปองจริง
 * 4. sort({ createdAt: -1 }) → เรียงจากใหม่ไปเก่า
 *
 * @access Private (ต้องล็อกอิน)
 * @returns {Array} รายการ Order ทั้งหมดของ user พร้อมข้อมูลสินค้าและคูปอง
 */
router.get("/my", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "name price image") // ดึงเฉพาะ field ที่จำเป็น
      .populate("coupon", "code discountPercent")
      .sort({ createdAt: -1 }); // -1 = ใหม่สุดก่อน

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/**
 * POST /api/order-status/:id/cancel-request
 * ─────────────────────────────────────────────────────────────────
 * User ส่งคำขอยกเลิก Order — รอ Owner ยืนยัน/ปฏิเสธ
 *
 * เงื่อนไขที่ยกเลิกได้:
 *   ✅ pending   (รอ owner ยืนยัน)
 *   ✅ confirmed (owner ยืนยันแล้ว แต่ยังไม่ส่ง)
 *   ❌ shipping  (กำลังจัดส่ง — ยกเลิกไม่ได้แล้ว)
 *   ❌ delivered (ส่งแล้ว)
 *   ❌ cancelled (ยกเลิกไปแล้ว)
 *
 * หมายเหตุ: ยังไม่คืน stock ตอนนี้
 * stock จะคืนก็ต่อเมื่อ Owner กด "อนุมัติยกเลิก" เท่านั้น
 * เพื่อป้องกัน stock เพิ่มโดยไม่จำเป็นในกรณี Owner ปฏิเสธ
 *
 * @access Private (เฉพาะเจ้าของ order)
 * @body {string} reason - เหตุผลยกเลิก (ไม่บังคับ)
 * @returns {Object} order ที่อัปเดตสถานะเป็น cancel_requested
 */
router.post("/:id/cancel-request", auth, async (req, res) => {
  try {
    // ดึง Order จาก id ใน URL params
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // ตรวจสอบว่าเป็นเจ้าของ order จริงๆ
    // เปรียบเทียบ user id ใน order กับ user ที่ login อยู่
    // ต้อง .toString() เพราะ MongoDB ObjectId ไม่ใช่ string
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // ตรวจสอบสถานะที่ยกเลิกไม่ได้
    if (["shipping", "delivered", "cancelled", "cancel_requested"].includes(order.status)) {
      return res.status(400).json({
        // แสดงข้อความที่เหมาะสมตามสถานะ
        message: order.status === "shipping"
          ? "ไม่สามารถยกเลิกได้ เนื่องจากสินค้ากำลังถูกจัดส่งอยู่"
          : "ไม่สามารถยกเลิกได้ในสถานะนี้"
      });
    }

    // เปลี่ยนสถานะเป็น cancel_requested (รอ Owner ตอบกลับ)
    order.status = "cancel_requested";

    // บันทึกเหตุผลยกเลิก (ถ้ามี) ใช้ || "" กัน undefined
    order.cancelReason = req.body.reason || "";

    await order.save();

    res.json({ message: "ส่งคำขอยกเลิกแล้ว รอ Owner ยืนยัน", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/**
 * POST /api/order-status/:id/confirm-delivery
 * ─────────────────────────────────────────────────────────────────
 * User กดยืนยันว่าได้รับสินค้าแล้ว
 *
 * ระบบยืนยัน 2 ฝ่าย:
 * - User กด confirm-delivery → userConfirmedDelivery = true
 * - Owner กด confirm-sent   → ownerConfirmedDelivery = true
 * - เมื่อทั้งสองฝ่ายยืนยัน → status = "delivered" อัตโนมัติ
 *
 * ตัวอย่าง:
 *   User กดก่อน → รอ Owner ยืนยัน
 *   Owner กดก่อน → รอ User ยืนยัน
 *   ใครกดทีหลัง → delivered ทันที
 *
 * @access Private (เฉพาะเจ้าของ order)
 * @returns {Object} order พร้อม message แจ้งสถานะ
 */
router.post("/:id/confirm-delivery", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // เช็คว่าเป็นเจ้าของ order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // ต้องอยู่ในสถานะ shipping เท่านั้นถึงจะยืนยันรับได้
    if (order.status !== "shipping") {
      return res.status(400).json({ message: "สินค้ายังไม่ได้อยู่ระหว่างจัดส่ง" });
    }

    // ป้องกันการกดซ้ำ
    if (order.userConfirmedDelivery) {
      return res.status(400).json({ message: "ยืนยันไปแล้ว" });
    }

    // บันทึกว่า user ยืนยันแล้ว
    order.userConfirmedDelivery = true;

    // เช็คว่า owner ยืนยันไปแล้วหรือยัง
    // ถ้ายืนยันแล้วทั้งคู่ → เปลี่ยนสถานะเป็น delivered ทันที
    if (order.ownerConfirmedDelivery) {
      order.status = "delivered";
    }

    await order.save();

    // แจ้ง message ตามสถานะที่เกิดขึ้น
    res.json({
      message: order.status === "delivered"
        ? "การจัดส่งสำเร็จ! 🎉"
        : "ยืนยันรับสินค้าแล้ว รอ Owner ยืนยันอีกครั้ง",
      order
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ════════════════════════════════════════════════════════════════════
// OWNER ROUTES — เฉพาะ owner และ admin เท่านั้น
// ════════════════════════════════════════════════════════════════════

/**
 * PUT /api/order-status/:id/status
 * ─────────────────────────────────────────────────────────────────
 * Owner อัปเดตสถานะ Order ตาม flow ที่กำหนด
 *
 * Flow ที่อนุญาต:
 *   pending   → confirmed  (ยืนยันรับคำสั่งซื้อ)
 *   confirmed → shipping   (ส่งสินค้าออกไปแล้ว)
 *
 * ใช้ validTransitions object เพื่อป้องกันการข้ามสถานะ
 * เช่น ไม่สามารถข้าม pending → shipping ได้โดยตรง
 *
 * @access Private (owner, admin)
 * @body {string} status - สถานะใหม่ที่ต้องการเปลี่ยน
 * @returns {Object} order ที่อัปเดตสถานะแล้ว
 */
router.put("/:id/status", auth, role("owner", "admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // กำหนด transition ที่อนุญาต
    // key = สถานะปัจจุบัน, value = สถานะที่เปลี่ยนไปได้
    const validTransitions = {
      pending:   ["confirmed"], // pending → confirmed เท่านั้น
      confirmed: ["shipping"],  // confirmed → shipping เท่านั้น
    };

    // ตรวจสอบว่า transition นี้อนุญาตหรือไม่
    // ?. (optional chaining) ป้องกัน error ถ้า key ไม่มีใน object
    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        message: `ไม่สามารถเปลี่ยนจาก ${order.status} เป็น ${status} ได้`
      });
    }

    // อัปเดตสถานะ
    order.status = status;
    await order.save();

    res.json({ message: "อัปเดตสถานะแล้ว", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/**
 * POST /api/order-status/:id/confirm-sent
 * ─────────────────────────────────────────────────────────────────
 * Owner ยืนยันว่าส่งสินค้าถึงมือลูกค้าแล้ว
 *
 * ระบบยืนยัน 2 ฝ่าย (เหมือน confirm-delivery ฝั่ง user):
 * - Owner กด confirm-sent   → ownerConfirmedDelivery = true
 * - User กด confirm-delivery → userConfirmedDelivery = true
 * - เมื่อทั้งสองฝ่ายยืนยัน → status = "delivered" อัตโนมัติ
 *
 * @access Private (owner, admin)
 * @returns {Object} order พร้อม message แจ้งสถานะ
 */
router.post("/:id/confirm-sent", auth, role("owner", "admin"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // ต้องอยู่ในสถานะ shipping เท่านั้น
    if (order.status !== "shipping") {
      return res.status(400).json({ message: "สินค้ายังไม่ได้อยู่ระหว่างจัดส่ง" });
    }

    // ป้องกันการกดซ้ำ
    if (order.ownerConfirmedDelivery) {
      return res.status(400).json({ message: "ยืนยันไปแล้ว" });
    }

    // บันทึกว่า owner ยืนยันแล้ว
    order.ownerConfirmedDelivery = true;

    // เช็คว่า user ยืนยันไปแล้วหรือยัง
    // ถ้าทั้งคู่ยืนยันแล้ว → เปลี่ยนเป็น delivered ทันที
    if (order.userConfirmedDelivery) {
      order.status = "delivered";
    }

    await order.save();

    res.json({
      message: order.status === "delivered"
        ? "การจัดส่งสำเร็จ! 🎉"
        : "ยืนยันการส่งแล้ว รอลูกค้ายืนยันรับสินค้า",
      order
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/**
 * POST /api/order-status/:id/cancel-response
 * ─────────────────────────────────────────────────────────────────
 * Owner ตอบกลับคำขอยกเลิกจาก User
 *
 * มี 2 ทางเลือก:
 *   approve = true  → อนุมัติยกเลิก
 *     - คืน stock ทุกรายการใน order กลับไป
 *     - เปลี่ยนสถานะเป็น cancelled
 *
 *   approve = false → ปฏิเสธคำขอยกเลิก
 *     - สถานะกลับไปเป็น confirmed เหมือนเดิม
 *     - ล้าง cancelReason
 *     - user ต้องสั่งซื้อต่อไป
 *
 * การคืน stock ใช้ $inc operator ของ MongoDB:
 *   $inc: { stock: item.quantity } = เพิ่ม stock ตามจำนวนที่ซื้อ
 *
 * @access Private (owner, admin)
 * @body {boolean} approve - true = อนุมัติ, false = ปฏิเสธ
 * @returns {Object} order ที่อัปเดตสถานะแล้ว พร้อม message
 */
router.post("/:id/cancel-response", auth, role("owner", "admin"), async (req, res) => {
  try {
    const { approve } = req.body;

    // populate("items.product") เพื่อให้ได้ product id สำหรับคืน stock
    const order = await Order.findById(req.params.id).populate("items.product");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // ต้องมีคำขอยกเลิกอยู่ก่อนถึงจะตอบกลับได้
    if (order.status !== "cancel_requested") {
      return res.status(400).json({ message: "ไม่มีคำขอยกเลิก" });
    }

    if (approve) {
      // ── อนุมัติยกเลิก ──────────────────────────────────────

      // คืน stock ทุกรายการใน order
      // วน loop ทุก item แล้วเพิ่ม stock กลับไปใน Product
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product._id || item.product, // รองรับทั้ง populate แล้วและยังไม่ populate
          { $inc: { stock: item.quantity } } // $inc = increment (เพิ่มค่า)
        );
      }

      // เปลี่ยนสถานะเป็น cancelled
      order.status = "cancelled";

    } else {
      // ── ปฏิเสธคำขอยกเลิก ──────────────────────────────────

      // กลับไปสถานะ confirmed (ก่อนที่จะมีคำขอยกเลิก)
      order.status = "confirmed";

      // ล้างเหตุผลยกเลิก
      order.cancelReason = "";
    }

    await order.save();

    res.json({
      message: approve ? "ยืนยันการยกเลิกแล้ว" : "ปฏิเสธคำขอยกเลิกแล้ว",
      order
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ── Export router ─────────────────────────────────────────────────
// ส่งออก router เพื่อใช้ใน server.js
// app.use("/api/order-status", orderStatusRoutes);
module.exports = router;