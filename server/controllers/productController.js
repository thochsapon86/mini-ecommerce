/**
 * ========================
 * ไฟล์ Product Controller
 * ========================
 * จัดการฟังก์ชันสำหรับการจัดการผลิตภัณฑ์ (CRUD) เช่น:
 * - สร้างสินค้าใหม่ (Create)
 * - ดึงข้อมูลสินค้า (Read)
 * - แก้ไขข้อมูลสินค้า (Update)
 * - ลบสินค้า (Delete)
 * 
 * หลักการทำงาน:
 * - `createProduct`: สร้างสินค้าใหม่ (เฉพาะ owner/admin)
 * - `getAllProducts`: ดึงรายการสินค้าทั้งหมด
 * - `getProductById`: ดึงข้อมูลสินค้าตามรหัส ID
 * - `updateProduct`: แก้ไขข้อมูลสินค้า
 * - `deleteProduct`: ลบสินค้า
 */

// ==================== นำเข้า Dependencies ====================

// นำเข้าโมเดล Product ที่ใช้สำหรับการเรียกใช้ฐานข้อมูล MongoDB
const Product = require("../models/Product");

// ==================== ฟังก์ชัน CREATE PRODUCT ====================

/**
 * สร้างสินค้าใหม่ (Owner/Admin)
 * 
 * วัตถุประสงค์:
 * - สร้างผลิตภัณฑ์ใหม่ในฐานข้อมูล
 * - บันทึกข้อมูลพื้นฐาน (ชื่อ, รายละเอียด, ราคา, คลัง, รูปภาพ)
 * - บันทึก ID ของผู้สร้าง
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.body - ข้อมูลจากคำขอ HTTP
 *   - name: ชื่อสินค้า
 *   - description: รายละเอียดสินค้า
 *   - price: ราคา
 *   - stock: จำนวนสต็อก
 *   - image: URL รูปภาพ
 * @param {Object} req.user - ข้อมูลผู้ใช้ที่ได้จากการยืนยัน
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อมูลสินค้าที่สร้างใหม่
 */
exports.createProduct = async (req, res) => {
  try {
    // ==================== ดึงข้อมูลจาก Request Body ====================
    // ดึงข้อมูลสินค้าจาก request body
    const { name, description, price, stock, image } = req.body;

    // ==================== สร้างสินค้า ====================
    // สร้างสินค้าใหม่พร้อมข้อมูลทั้งหมด
    const product = await Product.create({
      name,           // ชื่อสินค้า
      description,    // รายละเอียดสินค้า
      price,          // ราคาสินค้า
      stock,          // จำนวนคลัง
      image,          // รูปภาพ
      createdBy: req.user.id, // ID ของผู้ที่สร้างสินค้า
    });

    // ส่งข้อมูลสินค้าที่สร้างแล้ว (Status 201 = Created)
    res.status(201).json(product);

  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== ฟังก์ชัน GET ALL PRODUCTS ====================

/**
 * ดึงข้อมูลสินค้าทั้งหมด
 * 
 * วัตถุประสงค์:
 * - ดึงรายการสินค้าทั้งหมดจากฐานข้อมูล
 * - ดึงข้อมูลผู้สร้าง (populate ข้อมูลชื่อและอีเมล)
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Array} อาร์เรย์ของสินค้าทั้งหมด
 */
exports.getAllProducts = async (req, res) => {
  try {
    // ==================== ดึงสินค้าทั้งหมด ====================
    // ค้นหาสินค้าทั้งหมด และดึงข้อมูลผู้สร้าง (ชื่อและอีเมล)
    // populate: ใช้สำหรับฟิลด์ที่อ้างอิง (foreign key)
    const products = await Product.find().populate("createdBy", "name email");

    // ส่งอาร์เรย์สินค้ากลับไป
    res.json(products);

  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== ฟังก์ชัน GET PRODUCT BY ID ====================

/**
 * ดึงข้อมูลสินค้าตามรหัส ID
 * 
 * วัตถุประสงค์:
 * - ค้นหาสินค้าตามรหัส ID ที่ส่งมาใน URL
 * - ส่งกลับข้อมูลสินค้าหรือข้อความแสดงว่ายังไม่พบ
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.params - พารามิเตอร์จาก URL
 * @param {string} req.params.id - รหัส ID ของสินค้า
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อมูลสินค้า หรือข้อผิดพลาด 404
 */
exports.getProductById = async (req, res) => {
  try {
    // ==================== ค้นหาสินค้าตาม ID ====================
    // ค้นหาสินค้าโดยใช้ ID จาก URL parameters
    const product = await Product.findById(req.params.id);

    // ถ้าไม่พบสินค้า
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ส่งข้อมูลสินค้ากลับไป
    res.json(product);

  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== ฟังก์ชัน UPDATE PRODUCT ====================

/**
 * แก้ไขข้อมูลสินค้า
 * 
 * วัตถุประสงค์:
 * - ค้นหาสินค้าตาม ID
 * - อัปเดตข้อมูลที่ได้รับจาก request body
 * - บันทึกการเปลี่ยนแปลง
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.body - ข้อมูลใหม่ของสินค้า
 * @param {Object} req.params - พารามิเตอร์จาก URL
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อมูลสินค้าที่อัปเดตแล้ว
 */
exports.updateProduct = async (req, res) => {
  try {
    // ==================== อัปเดตสินค้า ====================
    /**
     * findByIdAndUpdate: ค้นหาสินค้าและอัปเดตในครั้งเดียว
     * - req.params.id: รหัส ID ของสินค้าที่ต้องการอัปเดต
     * - req.body: ข้อมูลใหม่
     * - { new: true }: ส่งกลับเอกสารที่อัปเดตแล้ว
     */
    const product = await Product.findByIdAndUpdate(
      req.params.id,      // ID ของสินค้า
      req.body,           // ข้อมูลที่อัปเดต
      { new: true }       // ส่งค่าอัปเดตกลับมา
    );

    // ถ้าไม่พบสินค้า
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ส่งข้อมูลสินค้าที่อัปเดตแล้ว
    res.json(product);

  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== ฟังก์ชัน DELETE PRODUCT ====================

/**
 * ลบสินค้า
 * 
 * วัตถุประสงค์:
 * - ค้นหาและลบสินค้าตาม ID
 * - ส่งกลับข้อความยืนยันการลบ
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.params - พารามิเตอร์จาก URL
 * @param {string} req.params.id - รหัส ID ของสินค้าที่จะลบ
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อความยืนยันการลบสินค้า
 */
exports.deleteProduct = async (req, res) => {
  try {
    // ==================== ลบสินค้า ====================
    // ค้นหาและลบสินค้าโดย ID
    const product = await Product.findByIdAndDelete(req.params.id);

    // ถ้าไม่พบสินค้า
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ส่งข้อความยืนยันการลบ
    res.json({ message: "Product deleted successfully" });

  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: error.message });
  }
};