/**
 * ========================
 * ไฟล์ User Controller
 * ========================
 * จัดการฟังก์ชันสำหรับผู้ใช้ที่มีการ login อยู่ เช่น:
 * - ดึงข้อมูลโปรไฟล์ของตัวเอง (Get My Profile)
 * - แก้ไขข้อมูลโปรไฟล์ (Update Profile)
 * - เปลี่ยนรหัสผ่าน (Change Password)
 */

// ==================== นำเข้า Dependencies ====================

// นำเข้าโมเดล User ที่ใช้สำหรับการเรียกใช้ฐานข้อมูล MongoDB
const User = require("../models/User");

// bcryptjs - ใช้สำหรับเข้ารหัสรหัสผ่าน
const bcrypt = require("bcryptjs");

// ==================== ฟังก์ชัน GET PROFILE ====================

/**
 * ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่ login อยู่
 * 
 * วัตถุประสงค์:
 * - ดึงข้อมูลผู้ใช้ปัจจุบันจากฐานข้อมูล
 * - ไม่รวมหรือซ่อนฟิลด์รหัสผ่านเพื่อความปลอดภัย
 * - ส่งกลับข้อมูลส่วนตัวของผู้ใช้
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.user - ข้อมูลผู้ใช้ที่ได้จากการยืนยัน (มาจาก middleware)
 * @param {string} req.user.id - ID ของผู้ใช้ที่ login อยู่
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อมูลผู้ใช้ (โดยไม่รวมรหัสผ่าน)
 */
exports.getProfile = async (req, res) => {
  try {
    // ==================== ดึงข้อมูลผู้ใช้ ====================
    // ค้นหาผู้ใช้โดย ID และซ่อนฟิลด์ password (เครื่องหมาย - หมายถึงข้ามฟิลด์นี้)
    const user = await User.findById(req.user.id).select("-password");

    // ส่งข้อมูลผู้ใช้กลับไป
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== ฟังก์ชัน UPDATE PROFILE ====================

/**
 * แก้ไขข้อมูลโปรไฟล์ของผู้ใช้
 * 
 * วัตถุประสงค์:
 * - อัปเดตชื่อผู้ใช้ (ถ้ามี)
 * - เปลี่ยนรหัสผ่าน (ถ้ามี)
 * - บันทึกการเปลี่ยนแปลงลงในฐานข้อมูล
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.body - ข้อมูลจากคำขอ HTTP
 *   - name: (ไม่บังคับ) ชื่อใหม่ของผู้ใช้
 *   - password: (ไม่บังคับ) รหัสผ่านใหม่
 * @param {Object} req.user - ข้อมูลผู้ใช้ที่ได้จากการยืนยัน
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อความยืนยันการแก้ไขสำเร็จ
 */
exports.updateProfile = async (req, res) => {
  try {
    // ==================== ดึงข้อมูลจาก Request Body ====================
    // ดึงชื่อใหม่และรหัสผ่านใหม่จาก request body (ถ้ามี)
    const { name, password } = req.body;

    // ==================== ค้นหาผู้ใช้ ====================
    // ค้นหาผู้ใช้ที่มี ID ตรงกับ ID ที่ได้จากการยืนยัน
    const user = await User.findById(req.user.id);

    // ถ้าไม่พบผู้ใช้
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ==================== อัปเดตชื่อ ====================
    // ถ้ามีชื่อใหม่ถูกส่งมา ให้อัปเดตชื่อ
    if (name) {
      user.name = name;
    }

    // ==================== อัปเดตรหัสผ่าน ====================
    // ถ้ามีรหัสผ่านใหม่ถูกส่งมา
    if (password) {
      // สร้าง salt สำหรับการเข้ารหัส
      const salt = await bcrypt.genSalt(10);
      // เข้ารหัสรหัสผ่านใหม่
      user.password = await bcrypt.hash(password, salt);
    }

    // ==================== บันทึกการเปลี่ยนแปลง ====================
    // บันทึกผู้ใช้ที่อัปเดตลงในฐานข้อมูล
    await user.save();

    // ส่งการตอบสนองสำเร็จ
    res.json({
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};