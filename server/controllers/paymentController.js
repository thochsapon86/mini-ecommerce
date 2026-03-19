/**
 * ========================
 * ไฟล์ Payment Controller
 * ========================
 * จัดการการชำระเงินและการจัดเก็บสลิป เช่น:
 * - สร้างบันทึกการชำระเงิน (Create Payment)
 * - จำลองการจ่ายเงิน (Pay / Mock Payment)
 * - อัปโหลดสลิปการโอนเงิน (Upload Slip)
 * - ดูประวัติการชำระเงิน (My Payments)
 * 
 * หลักการทำงาน:
 * - `createPayment`: สร้างบันทึก payment เป็น pending
 * - `pay`: จำลองการจ่ายเงินและเปลี่ยนสถานะเป็น paid
 * - `uploadSlip`: อัปโหลดสลิปและเปลี่ยนสถานะเป็น paid
 * - `myPayments`: ดึงประวัติการชำระเงินของผู้ใช้
 */

// ==================== นำเข้า Dependencies ====================

// นำเข้าโมเดล Payment ที่ใช้สำหรับบันทึกข้อมูลการชำระเงิน
const Payment = require("../models/Payment");

// ==================== ฟังก์ชัน CREATE PAYMENT ====================

/**
 * สร้างบันทึกการชำระเงิน
 * 
 * วัตถุประสงค์:
 * - สร้างบันทึก payment ใหม่ในฐานข้อมูล
 * - สถานะเริ่มต้นเป็น "pending" (รอการชำระเงิน)
 * - เก็บจำนวนเงิน ID ผู้ใช้
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.body - ข้อมูลจากคำขอ HTTP
 *   - amount: จำนวนเงิน
 * @param {Object} req.user - ข้อมูลผู้ใช้จากการยืนยัน
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อมูล payment ที่สร้างใหม่
 */
exports.createPayment = async (req, res) => {
  try {
    // ==================== ดึงข้อมูล ====================
    // ดึงจำนวนเงินจาก request body
    const { amount } = req.body;

    // ==================== สร้าง Payment ====================
    // สร้างบันทึก payment ใหม่
    const payment = await Payment.create({
      user: req.user.id,      // ID ผู้ใช้
      amount,                 // จำนวนเงิน
      status: "pending"       // สถานะ: รอการชำระเงิน
    });

    // ส่งข้อมูล payment กลับไป
    res.json(payment);
  } catch (err) {
    console.error("Create payment error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== ฟังก์ชัน PAY (Mock Payment) ====================

/**
 * จำลองการจ่ายเงิน
 * 
 * วัตถุประสงค์:
 * - ค้นหาบันทึก payment
 * - เปลี่ยนสถานะเป็น "paid" (ชำระแล้ว)
 * - สร้าง transactionId เพื่อยืนยันการจ่าย
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.params - พารามิเตอร์จาก URL
 *   - id: รหัส ID ของ payment
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อมูล payment ที่อัปเดตแล้ว
 */
exports.pay = async (req, res) => {
  try {
    // ==================== ค้นหา Payment ====================
    // ค้นหาบันทึก payment จาก ID
    const payment = await Payment.findById(req.params.id);

    // ถ้าไม่พบ payment
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // ==================== อัปเดตสถานะ ====================
    // เปลี่ยนสถานะเป็น "paid"
    payment.status = "paid";
    
    // สร้าง transactionId เพื่อยืนยันการชำระเงิน
    // TXN_ + timestamp
    payment.transactionId = "TXN_" + Date.now();

    // บันทึก payment ที่อัปเดต
    await payment.save();

    // ส่งข้อมูล payment ที่อัปเดตแล้ว
    res.json({
      message: "Payment success",
      payment
    });

  } catch (err) {
    console.error("Pay error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== ฟังก์ชัน UPLOAD SLIP ====================

/**
 * อัปโหลดสลิปการโอนเงิน
 * 
 * วัตถุประสงค์:
 * - ตรวจสอบว่า payment มีอยู่
 * - ตรวจสอบว่าผู้ใช้เป็นเจ้าของ payment
 * - บันทึก path ของรูปสลิป
 * - เปลี่ยนสถานะเป็น "paid"
 * - สร้าง transactionId เพื่อยืนยันการอัปโหลด
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.params - พารามิเตอร์จาก URL
 *   - id: รหัส ID ของ payment
 * @param {Object} req.user - ข้อมูลผู้ใช้จากการยืนยัน
 * @param {Object} req.file - ไฟล์ที่อัปโหลดมา (จาก middleware upload)
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อมูล payment ที่อัปเดตแล้ว
 */
exports.uploadSlip = async (req, res) => {
  try {
    // ==================== ค้นหา Payment ====================
    // ค้นหาบันทึก payment จาก ID
    const payment = await Payment.findById(req.params.id);

    // ถ้าไม่พบ payment
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // ==================== ตรวจสอบเจ้าของ ====================
    /**
     * เช็คว่าผู้ใช้ปัจจุบันเป็นเจ้าของ payment นี้หรือไม่
     * toString() ใช้เพื่อแปลง ObjectId เป็น string เพื่อเปรียบเทียบ
     */
    if (payment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // ==================== ตรวจสอบไฟล์ ====================
    // ถ้าไม่มีไฟล์ส่งมา
    if (!req.file) {
      return res.status(400).json({ message: "กรุณาแนบรูปสลิป" });
    }

    // ==================== บันทึกข้อมูล ====================
    // บันทึก path ของรูปสลิป (ให้ path แบบ absolute สำหรับ client access)
    payment.slipImage = `/uploads/slips/${req.file.filename}`;
    
    // เปลี่ยนสถานะเป็น "paid"
    payment.status = "paid";
    
    // สร้าง transactionId เพื่อยืนยันการอัปโหลด
    // SLIP_ + timestamp
    payment.transactionId = "SLIP_" + Date.now();
    
    // บันทึก payment ที่อัปเดต
    await payment.save();

    // ส่งข้อมูล payment กลับไป
    res.json({ 
      message: "อัปโหลด slip สำเร็จ", 
      payment 
    });
  } catch (err) {
    console.error("Upload slip error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== ฟังก์ชัน MY PAYMENTS ====================

/**
 * ดูประวัติการชำระเงินของผู้ใช้
 * 
 * วัตถุประสงค์:
 * - ดึงบันทึก payment ทั้งหมดของผู้ใช้
 * - ส่งกลับประวัติการชำระเงิน
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.user - ข้อมูลผู้ใช้จากการยืนยัน
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Array} อาร์เรย์ของบันทึก payment ของผู้ใช้
 */
exports.myPayments = async (req, res) => {
  try {
    // ==================== ดึงประวัติการชำระเงิน ====================
    // ค้นหาบันทึก payment ทั้งหมดของผู้ใช้ปัจจุบัน
    const payments = await Payment.find({
      user: req.user.id
    });

    // ส่งประวัติการชำระเงิน
    res.json(payments);
  } catch (err) {
    console.error("Get my payments error:", err);
    res.status(500).json({ message: err.message });
  }
};