/**
 * User model
 * -----------------------------
 * คำอธิบายโดยย่อ (ภาษาไทย):
 * ไฟล์นี้กำหนด Mongoose schema สำหรับผู้ใช้งานระบบ (User)
 * และรวมเมทอดช่วยเหลือสำหรับการรีเซ็ตรหัสผ่าน (reset password token).
 *
 * ฟิลด์สำคัญ:
 * - name: ชื่อผู้ใช้ (required)
 * - email: อีเมล (required, unique) — ใช้เป็นตัวระบุผู้ใช้
 * - password: รหัสผ่านที่ถูก hash แล้ว (required) — ควรเก็บเป็น hash จากฝั่งการลงทะเบียน/การยืนยัน
 * - role: สิทธิ์ของผู้ใช้ (enum: 'user'|'owner'|'admin') — ค่าเริ่มต้น 'user'
 * - resetPasswordToken: ค่า token ที่ถูก hash แล้ว เก็บไว้ใช้ตรวจสอบขณะรีเซ็ต
 * - resetPasswordExpire: เวลาหมดอายุของ token (Date)
 *
 * หลักการทำงานของการรีเซ็ตรหัสผ่าน (getResetPasswordToken):
 * 1. สร้าง token แบบสุ่ม (ไม่เข้ารหัส) เพื่อส่งให้ผู้ใช้ทางอีเมล
 * 2. สร้าง hash (SHA-256) ของ token แล้วเก็บ hash ใน DB (`resetPasswordToken`) เพื่อความปลอดภัย
 *    — การเก็บ hash แทนการเก็บ token ดิบ ช่วยป้องกันการรั่วไหลหาก DB ถูกเข้าถึง
 * 3. ตั้งเวลา `resetPasswordExpire` ให้ token หมดอายุ (ที่นี่กำหนด 10 นาที)
 * 4. คืนค่า token ดิบ (ไม่ใช่ hash) เพื่อส่งให้ผู้ใช้ทางช่องทางปลอดภัย (เช่น อีเมล)
 *
 * ตัวอย่างการใช้งานทั่วไป:
 * - เมื่อผู้ใช้ขอ 'ลืมรหัสผ่าน' ให้เรียก `user.getResetPasswordToken()` บนเอกสารผู้ใช้
 * - ส่งค่าที่คืน (token ดิบ) เป็นพารามิเตอร์ในลิงก์รีเซ็ตผ่านอีเมล
 * - เมื่อผู้ใช้เข้ามาที่ลิงก์ ให้ hash พารามิเตอร์ที่ได้รับและตรวจสอบกับ `resetPasswordToken` ใน DB
 * - ตรวจสอบว่า `resetPasswordExpire` ยังไม่เลยเวลา ถ้าผ่านให้อนุญาตตั้งรหัสผ่านใหม่
 *
 * หมายเหตุด้านความปลอดภัย:
 * - token ที่ส่งให้ผู้ใช้ต้องถูกส่งผ่านช่องทางที่ปลอดภัย (เช่น ลิงก์ HTTPS ในอีเมล)
 * - เมื่อรีเซ็ตรหัสผ่านสำเร็จ ควรลบหรือรีเซ็ต `resetPasswordToken` และ `resetPasswordExpire`
 * - ค่า `password` ควรถูก hash (เช่น bcrypt) ก่อนบันทึก (การ hash ไม่ได้ทำในไฟล์นี้)
 */

const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    // ข้อมูลประจำตัวผู้ใช้
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // สิทธิ์การเข้าถึงของผู้ใช้ (role)
    // 'user' = ลูกค้าทั่วไป, 'owner' = เจ้าของร้าน, 'admin' = ผู้ดูแลระบบ
    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user",
    },

    // ฟิลด์สำหรับกระบวนการรีเซ็ตรหัสผ่าน
    // เก็บ hash ของ token เพื่อความปลอดภัย (ไม่เก็บ token ดิบ)
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

/**
 * สร้าง reset password token:
 * - คืนค่า token ดิบ (เพื่อส่งให้ผู้ใช้ทางอีเมล)
 * - เก็บค่า hash ของ token ใน `resetPasswordToken` และตั้ง `resetPasswordExpire`
 */
userSchema.methods.getResetPasswordToken = function () {
  // สร้าง random bytes ขนาด 20 bytes แล้วแปลงเป็น hex string
  const resetToken = crypto.randomBytes(20).toString("hex");

  // สร้าง hash ของ token (SHA-256) แล้วเก็บไว้ในโมเดล (ปลอดภัยกว่าเก็บ token ดิบ)
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // ตั้งเวลาให้ token หมดอายุใน 10 นาที
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  // คืนค่า token ดิบ (ต้องส่ง token นี้ให้ผู้ใช้ ทางอีเมล)
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);