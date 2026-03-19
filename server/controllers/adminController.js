/**
 * ========================
 * ไฟล์ Admin Controller
 * ========================
 * จัดการการดำเนินงานด้านการบริหารสำหรับแอปพลิเคชัน mini-ecommerce
 * ส่วนใหญ่ใช้สำหรับจัดการผู้ใช้ เช่น:
 * - เรียกดูผู้ใช้ทั้งหมด (Get All Users)
 * - แก้ไขบทบาทของผู้ใช้ (Update User Role)
 * - ลบผู้ใช้ (Delete User)
 * 
 * หลักการทำงาน:
 * - ดำเนินการดำเนินงานเฉพาะผู้ดูแลระบบหรือเจ้าของระบบ
 * - บันทึกข้อมูลผู้ใช้โดยไม่รวมรหัสผ่าน
 */

// ==================== นำเข้า Dependencies ====================

// นำเข้าโมเดล User ที่ใช้สำหรับการเรียกใช้ฐานข้อมูล MongoDB
const User = require("../models/User");

// ==================== ฟังก์ชัน GET ALL USERS ====================

/**
 * เรียกดูผู้ใช้ทั้งหมดจากฐานข้อมูล
 * 
 * วัตถุประสงค์:
 * - ดึงรายการผู้ใช้ทั้งหมด
 * - ไม่รวมฟิลด์รหัสผ่านเพื่อความปลอดภัย
 * - ส่งกลับข้อมูลผู้ใช้ทั้งหมด
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Array} อาร์เรย์ของผู้ใช้ (ไม่รวมรหัสผ่าน)
 */
exports.getAllUsers = async (req, res) => {
  try {
    // ==================== ดึงผู้ใช้ทั้งหมด ====================
    /**
     * find(): ค้นหาทุกเอกสารใน User collection
     * select("-password"): ไม่รวมฟิลด์ password (เครื่องหมาย - หมายถึงลบฟิลด์นี้ออก)
     */
    const users = await User.find().select("-password");

    // ส่งอาร์เรย์ผู้ใช้เป็นการตอบสนอง JSON
    res.json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== ฟังก์ชัน UPDATE USER ROLE ====================

/**
 * อัปเดตบทบาทของผู้ใช้
 * 
 * วัตถุประสงค์:
 * - เปลี่ยนบทบาทของผู้ใช้ (เช่น จาก "user" เป็น "admin")
 * - ตรวจสอบว่าผู้ใช้มีอยู่
 * - บันทึกการเปลี่ยนแปลง
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.body - ข้อมูลจากคำขอ HTTP
 *   - role: บทบาทใหม่ (user, admin, owner)
 * @param {Object} req.params - พารามิเตอร์จาก URL
 *   - id: รหัส ID ของผู้ใช้
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อความยืนยันการอัปเดต
 */
exports.updateUserRole = async (req, res) => {
  try {
    // ==================== ดึงข้อมูล ====================
    // ดึงบทบาทใหม่จาก request body
    const { role } = req.body;

    // ==================== ค้นหาผู้ใช้ ====================
    // ค้นหาผู้ใช้โดย ID จาก URL parameters
    const user = await User.findById(req.params.id);

    // ถ้าไม่พบผู้ใช้
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ==================== อัปเดตบทบาท ====================
    // เปลี่ยนบทบาทของผู้ใช้
    user.role = role;

    // บันทึกผู้ใช้ที่อัปเดตลงในฐานข้อมูล
    await user.save();

    // ส่งการตอบสนองความสำเร็จ
    res.json({
      message: "Role updated",
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== ฟังก์ชัน DELETE USER ====================

/**
 * ลบผู้ใช้จากฐานข้อมูล
 * 
 * วัตถุประสงค์:
 * - ลบเอกสารผู้ใช้จากฐานข้อมูล
 * - ไม่ตรวจสอบว่าผู้ใช้มีอยู่ (findByIdAndDelete จัดการ ID ที่ไม่มีอยู่)
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} req.params - พารามิเตอร์จาก URL
 *   - id: รหัส ID ของผู้ใช้
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * 
 * @returns {Object} ข้อความยืนยันการลบ
 */
exports.deleteUser = async (req, res) => {
  try {
    // ==================== ลบผู้ใช้ ====================
    // ค้นหาและลบผู้ใช้โดย ID
    // findByIdAndDelete: ลบเอกสารและส่งกลับข้อมูลเอกสารที่ลบ (หรือ null ถ้าไม่พบ)
    await User.findByIdAndDelete(req.params.id);

    // ส่งการตอบสนองความสำเร็จ
    res.json({
      message: "User deleted",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};