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

    // ดึง productId และ quantity จาก body
    const { productId, quantity } = req.body;

    // ตรวจสอบว่าสินค้ามีอยู่จริงไหม
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ค้นหา cart ของ user
    let cart = await Cart.findOne({ user: req.user.id });

    // ถ้ายังไม่มี cart ให้สร้างใหม่
    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [],
      });
    }

    // เช็คว่าสินค้านี้อยู่ใน cart แล้วไหม
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      // ถ้ามีแล้ว ให้เพิ่มจำนวน
      existingItem.quantity += quantity;
    } else {
      // ถ้ายังไม่มี ให้ push เข้า array
      cart.items.push({
        product: productId,
        quantity,
      });
    }

    // บันทึก cart ลง database
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

    // filter เอาสินค้าที่ไม่ตรง productId ออก
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

    // ทำให้ items เป็น array ว่าง
    cart.items = [];

    await cart.save();

    res.json({ message: "Cart cleared" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};