/**
 * Coupon model
 * คำอธิบาย: เก็บข้อมูลคูปอง โปรโมชั่น และผู้ที่รับคูปองแล้ว
 * หลักการทำงาน:
 * - `code` เป็นตัวแทนคูปองที่ใช้ตรวจสอบ
 * - `discountPercent` คำนวณส่วนลดจากราคารวม
 * - `expiresAt` ระบุวันหมดอายุของคูปอง
 * - `claimedUsers` เก็บลิสต์ผู้ใช้ที่รับคูปองแล้ว
 */
const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({

  // โค้ดคูปอง เช่น SALE50
  code: {
    type: String,
    required: true,
    unique: true
  },

  // ส่วนลด (%)
  discountPercent: {
    type: Number,
    required: true
  },

  // วันหมดอายุ
  expiresAt: {
    type: Date,
    required: true
  },

  // ใครสร้าง (owner/admin)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // user ที่กดรับคูปอง
  claimedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("Coupon", couponSchema);