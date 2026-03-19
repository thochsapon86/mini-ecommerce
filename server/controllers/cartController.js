/**
 * ========================
 * ไฟล์ Cart Controller
 * ========================
 * จัดการตะกร้าสินค้าของผู้ใช้ เช่น:
 * - ดูตะกร้าสินค้า (Get My Cart)
 * - เพิ่มสินค้าเข้าตะกร้า (Add to Cart)
 * - ลบสินค้าออกจากตะกร้า (Remove from Cart)
 * - ล้างตะกร้า (Clear Cart)
 * 
 * หลักการทำงาน:
 * - ตรวจสอบสต็อกสินค้าก่อนเพิ่มเข้าตะกร้า
 * - จัดการคืน/หัก stock เมื่อเพิ่มหรือเอาสินค้าออก
 * - ใช้ populate เพื่อดึงข้อมูลสินค้า
 */

// ==================== นำเข้า Dependencies ====================

// นำเข้าโมเดล Cart ที่ใช้สำหรับจัดการตะกร้า
const Cart = require("../models/Cart");

// นำเข้าโมเดล Product เพื่อตรวจสอบสินค้าและสต็อก
const Product = require("../models/Product");

// ==================== ฟังก์ชัน GET MY CART ====================

/**
 * ดูตะกร้าสินค้าของผู้ใช้ที่ login อยู่
 * 
 * วัตถุประสงค์:
 * - ดึงข้อมูลตะกร้าของผู้ใช้ปัจจุบัน
 * - ดึงข้อมูลสินค้าในแต่ละรายการ (populate)
 * - ส่งกลับตะกร้าหรืออาร์เรย์ว่าง
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.user - ข้อมูลผู้ใช้จากการยืนยัน
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อมูลตะกร้า หรือ { items: [] } ถ้ายังไม่มีตะกร้า
 */
exports.getMyCart = async (req, res) => {
  try {
    // ==================== ค้นหาตะกร้า ====================
    /**
     * ค้นหาตะกร้าของผู้ใช้ที่ login อยู่
     * populate("items.product"): ดึงข้อมูลสินค้า (แทนที่จะเป็น ID เท่านั้น)
     */
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product"); // ดึงข้อมูลสินค้าในตะกร้า

    // ถ้าไม่มีตะกร้า ส่งอาร์เรย์ว่าง
    if (!cart) {
      return res.json({ items: [] });
    }

    // ส่งข้อมูลตะกร้า
    res.json(cart);

  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== ฟังก์ชัน ADD TO CART ====================

/**
 * เพิ่มสินค้าเข้าตะกร้า
 * 
 * วัตถุประสงค์:
 * - ตรวจสอบว่าสินค้ามีอยู่และมีสต็อกเพียงพอ
 * - สร้างตะกร้าใหม่หรือเพิ่มเข้าตะกร้าที่มีอยู่
 * - หัก stock ของสินค้าและบันทึกการเปลี่ยนแปลง
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.body - ข้อมูลจากคำขอ
 *   - productId: รหัส ID ของสินค้า
 *   - quantity: จำนวนที่ต้องการเพิ่ม
 * @param {Object} req.user - ข้อมูลผู้ใช้จากการยืนยัน
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อมูลตะกร้าที่อัปเดต
 */
exports.addToCart = async (req, res) => {
  try {
    // ==================== ดึงข้อมูล ====================
    // ดึง productId และ quantity จาก request body
    const { productId, quantity } = req.body;

    // ==================== ตรวจสอบสินค้า ====================
    // ค้นหาสินค้าตาม ID
    const product = await Product.findById(productId);

    // ถ้าไม่พบสินค้า
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ==================== ตรวจสอบสต็อก ====================
    // ถ้าสต็อกไม่เพียงพอ
    if (product.stock < quantity) {
      return res.status(400).json({ message: "สินค้าไม่เพียงพอ" });
    }

    // ==================== ค้นหาหรือสร้างตะกร้า ====================
    // ค้นหาตะกร้าของผู้ใช้
    let cart = await Cart.findOne({ user: req.user.id });

    // ถ้ายังไม่มีตะกร้า ให้สร้างตะกร้าใหม่
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // ==================== ตรวจสอบสินค้าซ้ำ ====================
    // หาสินค้าที่มีอยู่ในตะกร้าแล้ว
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    // ถ้าสินค้ามีอยู่ในตะกร้าแล้ว
    if (existingItem) {
      // ตรวจสอบสต็อกอีกครั้ง
      if (product.stock < quantity) {
        return res.status(400).json({ message: "สินค้าไม่เพียงพอ" });
      }
      // เพิ่มจำนวน
      existingItem.quantity += quantity;
    } else {
      // ถ้าเป็นสินค้าใหม่ ให้เพิ่มเข้าตะกร้า
      cart.items.push({ product: productId, quantity });
    }

    // ==================== หัก Stock ====================
    // ลดจำนวนสต็อก
    product.stock -= quantity;
    // บันทึกสินค้าที่อัปเดต
    await product.save();

    // บันทึกตะกร้า
    await cart.save();

    // ส่งข้อมูลตะกร้าที่อัปเดต
    res.json(cart);

  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== ฟังก์ชัน REMOVE FROM CART ====================

/**
 * ลบสินค้าออกจากตะกร้า
 * 
 * วัตถุประสงค์:
 * - ค้นหาสินค้าในตะกร้า
 * - คืนสต็อกของสินค้าที่ลบออก
 * - ลบสินค้าออกจากตะกร้า
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.body - ข้อมูลจากคำขอ
 *   - productId: รหัส ID ของสินค้าที่จะลบ
 * @param {Object} req.user - ข้อมูลผู้ใช้จากการยืนยัน
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อมูลตะกร้าที่อัปเดต
 */
exports.removeFromCart = async (req, res) => {
  try {
    // ==================== ดึงข้อมูล ====================
    const { productId } = req.body;

    // ==================== ค้นหาตะกร้า ====================
    const cart = await Cart.findOne({ user: req.user.id });

    // ถ้าไม่พบตะกร้า
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // ==================== หาสินค้าในตะกร้า ====================
    // หาจำนวนสินค้าที่จะลบ
    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );

    // ==================== คืน Stock ====================
    // ถ้าพบสินค้า ให้คืนสต็อก
    if (item) {
      await Product.findByIdAndUpdate(productId, {
        $inc: { stock: item.quantity } // เพิ่มสต็อก
      });
    }

    // ==================== ลบสินค้าออกจากตะกร้า ====================
    // กรองเอาสินค้าออก
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    // บันทึกตะกร้า
    await cart.save();

    // ส่งข้อมูลตะกร้าที่อัปเดต
    res.json(cart);

  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== ฟังก์ชัน CLEAR CART ====================

/**
 * ล้างตะกร้า (ลบสินค้าทั้งหมด)
 * 
 * วัตถุประสงค์:
 * - ลบสินค้าทั้งหมดออกจากตะกร้า
 * - คืนสต็อกของสินค้าทั้งหมดที่อยู่ในตะกร้า
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.user - ข้อมูลผู้ใช้จากการยืนยัน
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อความยืนยันการล้างตะกร้า
 */
exports.clearCart = async (req, res) => {
  try {
    // ==================== ค้นหาตะกร้า ====================
    const cart = await Cart.findOne({ user: req.user.id });

    // ถ้าไม่พบตะกร้า
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // ==================== คืน Stock ทั้งหมด ====================
    // วนลูปสินค้าทั้งหมดในตะกร้า
    for (const item of cart.items) {
      // คืนสต็อกของแต่ละสินค้า
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity } // เพิ่มสต็อก
      });
    }

    // ==================== ล้างตะกร้า ====================
    // ลบสินค้าทั้งหมด
    cart.items = [];
    // บันทึกตะกร้าที่ว่างเปล่า
    await cart.save();

    // ส่งข้อความยืนยัน
    res.json({ message: "Cart cleared" });

  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: error.message });
  }
};