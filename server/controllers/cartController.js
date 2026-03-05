/**
 * Cart controller
 * คำอธิบาย: จัดการตรรกะการทำงานของตะกร้าสินค้า (ดู ตัดเพิ่ม ลบ ล้าง)
 * หลักการทำงาน:
 * - `getMyCart`: ดึงตะกร้าของผู้ใช้และ populate ข้อมูลสินค้า
 * - `addToCart`: ตรวจสอบสินค้า, สร้างหรือตัดสินใจเพิ่มรายการใน cart
 * - `removeFromCart` / `clearCart`: เอาสินค้าออกหรือเคลียร์ทั้งหมด
 */
// ดึง Cart model มาใช้
const Cart = require("../models/Cart");

// ดึง Product model มาใช้เพื่อตรวจสอบสินค้า
const Product = require("../models/Product");


// ===============================
// 1️⃣ ดู cart ของตัวเอง
// ===============================
exports.getMyCart = async (req, res) => {
  try {

    // ค้นหา cart ของ user ที่ login อยู่
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product"); // ดึงข้อมูล product มาด้วย

    // ถ้าไม่มี cart เลย
    if (!cart) {
      return res.json({ items: [] });
    }

    res.json(cart);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ===============================
// 2️⃣ เพิ่มสินค้าเข้าตะกร้า
// ===============================
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ── เช็ค stock ──
    if (product.stock < quantity) {
      return res.status(400).json({ message: "สินค้าไม่เพียงพอ" });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      // เช็ค stock รวมกับที่มีในตะกร้าแล้ว
      if (product.stock < quantity) {
        return res.status(400).json({ message: "สินค้าไม่เพียงพอ" });
      }
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    // ── หัก stock ──
    product.stock -= quantity;
    await product.save();

    await cart.save();
    res.json(cart);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ===============================
// 3️⃣ ลบสินค้าออกจากตะกร้า
// ===============================
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // หาจำนวนที่อยู่ในตะกร้าก่อนลบ
    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );

    // คืน stock
    if (item) {
      await Product.findByIdAndUpdate(productId, {
        $inc: { stock: item.quantity }
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    res.json(cart);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ===============================
// 4️⃣ ล้างตะกร้า
// ===============================
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // คืน stock ทุกชิ้นก่อนเคลียร์
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    cart.items = [];
    await cart.save();

    res.json({ message: "Cart cleared" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};