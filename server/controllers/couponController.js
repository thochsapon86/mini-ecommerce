/**
 * ========================
 * ไฟล์ Coupon Controller
 * ========================
 * จัดการคูปอง (โค้ดส่วนลด) เช่น:
 * - สร้างคูปองใหม่ (Create Coupon)
 * - ดึงรายการคูปอง (Get Coupons)
 * - รับคูปอง (Claim Coupon)
 * - ใช้คูปอง (Apply Coupon)
 * 
 * หลักการทำงาน:
 * - `createCoupon`: สร้างคูปองใหม่ (เฉพาะ owner/admin)
 * - `getCoupons`: ดึงรายการคูปองทั้งหมด
 * - `claimCoupon`: ผู้ใช้รับคูปอง (ป้องกันรับซ้ำ)
 * - `applyCoupon`: ตรวจสอบและคำนวณส่วนลด
 */

// ==================== นำเข้า Dependencies ====================

// นำเข้าโมเดล Coupon ที่ใช้สำหรับจัดการคูปอง
const Coupon = require("../models/Coupon");

// ==================== ฟังก์ชัน CREATE COUPON ====================

/**
 * สร้างคูปองใหม่ (Owner/Admin)
 * 
 * วัตถุประสงค์:
 * - สร้างคูปองใหม่ในฐานข้อมูล
 * - เก็บข้อมูล: รหัส, เปอร์เซ็นต์ส่วนลด, วันหมดอายุ
 * - บันทึก ID ผู้สร้าง
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.body - ข้อมูลจากคำขอ HTTP
 *   - code: รหัสคูปอง (เช่น SUMMER20)
 *   - discountPercent: เปอร์เซ็นต์ส่วนลด (เช่น 20)
 *   - expiresAt: วันหมดอายุคูปอง
 * @param {Object} req.user - ข้อมูลผู้ใช้จากการยืนยัน
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อมูลคูปองที่สร้างใหม่
 */
exports.createCoupon = async (req, res) => {
    try {
        // ==================== ดึงข้อมูล ====================
        // ดึงข้อมูลคูปองจาก request body
        const { code, discountPercent, expiresAt } = req.body;

        // ==================== สร้างคูปอง ====================
        // สร้างคูปองใหม่ในฐานข้อมูล
        const coupon = await Coupon.create({
            code,                 // รหัสคูปอง
            discountPercent,      // เปอร์เซ็นต์ส่วนลด
            expiresAt,            // วันหมดอายุ
            createdBy: req.user.id  // ID ผู้สร้าง
        });

        // ส่งข้อมูลคูปองกลับไป
        res.json(coupon);

    } catch (err) {
        console.error("Create coupon error:", err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== ฟังก์ชัน GET COUPONS ====================

/**
 * ดึงรายการคูปองทั้งหมด
 * 
 * วัตถุประสงค์:
 * - ดึงคูปองทั้งหมดจากฐานข้อมูล
 * - ส่งกลับเป็นอาร์เรย์
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Array} อาร์เรย์ของคูปองทั้งหมด
 */
exports.getCoupons = async (req, res) => {
    try {
        // ==================== ดึงคูปองทั้งหมด ====================
        // ค้นหาคูปองทั้งหมด
        const coupons = await Coupon.find();

        // ส่งอาร์เรย์คูปอง
        res.json(coupons);
    } catch (err) {
        console.error("Get coupons error:", err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== ฟังก์ชัน CLAIM COUPON ====================

/**
 * ผู้ใช้รับคูปอง
 * 
 * วัตถุประสงค์:
 * - ให้ผู้ใช้รับคูปอง
 * - บันทึก ID ผู้ใช้ใน claimedUsers
 * - ป้องกันไม่ให้รับคูปองซ้ำ
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.params - พารามิเตอร์จาก URL
 *   - id: รหัส ID ของคูปอง
 * @param {Object} req.user - ข้อมูลผู้ใช้จากการยืนยัน
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อความยืนยันการรับคูปอง
 */
exports.claimCoupon = async (req, res) => {
    try {
        // ==================== ค้นหาคูปอง ====================
        // ค้นหาคูปองจาก ID
        const coupon = await Coupon.findById(req.params.id);

        // ถ้าไม่พบคูปอง
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }

        // ==================== ตรวจสอบการรับซ้ำ ====================
        /**
         * ตรวจสอบว่า user นี้มีอยู่ใน claimedUsers แล้วหรือไม่
         * ถ้ามีอยู่แล้ว ให้ส่งข้อความว่ารับไปแล้ว
         */
        if (coupon.claimedUsers.includes(req.user.id)) {
            return res.json({ message: "Already claimed" });
        }

        // ==================== เพิ่ม User ให้กับคูปอง ====================
        // เพิ่ม ID ผู้ใช้ลงใน claimedUsers
        coupon.claimedUsers.push(req.user.id);

        // บันทึกคูปองที่อัปเดต
        await coupon.save();

        // ส่งข้อความยืนยัน
        res.json({ message: "Coupon claimed" });

    } catch (err) {
        console.error("Claim coupon error:", err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== ฟังก์ชัน APPLY COUPON ====================

/**
 * ใช้คูปองและคำนวณส่วนลด
 * 
 * วัตถุประสงค์:
 * - ตรวจสอบรหัสคูปอง
 * - ตรวจสอบวันหมดอายุ
 * - ตรวจสอบว่าผู้ใช้ได้รับคูปองแล้ว
 * - คำนวณส่วนลดและส่งกลับ
 * 
 * หมายเหตุ: ฟังก์ชันนี้ไม่ใช่ express controller (ไม่มี req, res)
 * เป็นฟังก์ชันช่วยเหลือที่ใช้ภายใน flow อื่น ๆ
 * 
 * @param {string} code - รหัสคูปอง
 * @param {string} userId - ID ผู้ใช้
 * @param {number} totalPrice - ราคารวม
 * 
 * @returns {Object} ข้อมูลส่วนลดและราคาหลังลด
 * @throws {Error} หากคูปองไม่ถูกต้องหรือหมดอายุ
 */
exports.applyCoupon = async (code, userId, totalPrice) => {
    try {
        // ==================== ค้นหาคูปอง ====================
        // ค้นหาคูปองจากรหัส
        const coupon = await Coupon.findOne({ code });

        // ถ้าไม่พบคูปอง
        if (!coupon) {
            throw new Error("Invalid coupon");
        }

        // ==================== ตรวจสอบวันหมดอายุ ====================
        /**
         * เช็คว่าวันปัจจุบัน > วันหมดอายุหรือไม่
         * ถ้าใช่ แสดงว่าคูปองหมดอายุแล้ว
         */
        if (new Date() > coupon.expiresAt) {
            throw new Error("Coupon expired");
        }

        // ==================== ตรวจสอบว่าผู้ใช้ได้รับคูปองแล้ว ====================
        /**
         * เช็คว่า userId มีอยู่ใน claimedUsers หรือไม่
         * ถ้าไม่มี แสดงว่าผู้ใช้ยังไม่ได้รับคูปอง
         */
        if (!coupon.claimedUsers.includes(userId)) {
            throw new Error("Coupon not claimed");
        }

        // ==================== คำนวณส่วนลด ====================
        // ส่วนลด = ราคารวม × เปอร์เซ็นต์ส่วนลด / 100
        const discount = (totalPrice * coupon.discountPercent) / 100;

        // ==================== ส่งค่าคืน ====================
        // ส่งกลับข้อมูลส่วนลด และราคาหลังลด
        return {
            discount,                       // จำนวนส่วนลด
            finalPrice: totalPrice - discount  // ราคาที่ต้องชำระ
        };
    } catch (err) {
        console.error("Apply coupon error:", err);
        throw err;  // โยนข้อผิดพลาดให้เรียกใช้ function
    }
};