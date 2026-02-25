// ดึง Product model มาใช้งาน
const Product = require("../models/Product");


// ==========================
// 1️⃣ สร้างสินค้า (Owner/Admin)
// ==========================
exports.createProduct = async (req, res) => {
  try {

    // ดึงข้อมูลจาก body ที่ client ส่งมา
    const { name, description, price, stock, image } = req.body;

    // สร้าง object ใหม่จาก Product model
    const product = await Product.create({
      name, // ชื่อสินค้า
      description, // รายละเอียด
      price, // ราคา
      stock, // จำนวน
      image, // รูปภาพ
      createdBy: req.user.id, // id ของ user ที่ login อยู่
    });

    // ส่งข้อมูลกลับไป
    res.status(201).json(product);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==========================
// 2️⃣ ดูสินค้าทั้งหมด
// ==========================
exports.getAllProducts = async (req, res) => {
  try {

    // ดึงสินค้าทั้งหมดจากฐานข้อมูล
    const products = await Product.find().populate("createdBy", "name email");

    res.json(products);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==========================
// 3️⃣ ดูสินค้าตาม id
// ==========================
exports.getProductById = async (req, res) => {
  try {

    // ค้นหาสินค้าตาม id ที่ส่งมาใน URL
    const product = await Product.findById(req.params.id);

    // ถ้าไม่พบสินค้า
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==========================
// 4️⃣ แก้ไขสินค้า
// ==========================
exports.updateProduct = async (req, res) => {
  try {

    // ค้นหาสินค้าตาม id แล้วอัปเดต
    const product = await Product.findByIdAndUpdate(
      req.params.id, // id จาก URL
      req.body, // ข้อมูลใหม่
      { new: true } // ส่งค่าที่อัปเดตแล้วกลับมา
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==========================
// 5️⃣ ลบสินค้า
// ==========================
exports.deleteProduct = async (req, res) => {
  try {

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};