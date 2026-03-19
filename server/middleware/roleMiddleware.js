/**
 * ========================
 * ไฟล์ Role Middleware
 * ========================
 * ตรวจสอบบทบาท (role) ของผู้ใช้
 * เพื่อกำหนดว่าผู้ใช้ได้รับอนุญาตให้เข้าถึง route นี้หรือไม่
 * 
 * วัตถุประสงค์:
 * - ตรวจสอบ req.user ที่ได้จาก authMiddleware
 * - ตรวจสอบว่า role ของผู้ใช้ตรงกับ allowed roles หรือไม่
 * - อนุญาตหรือปฏิเสธการเข้าถึง
 * 
 * หลักการขั้นตอน:
 * 1. สร้าง higher-order function ที่รับ allowed roles
 * 2. คืนค่า middleware function
 * 3. ตรวจสอบว่ามี req.user หรือไม่
 * 4. ตรวจสอบว่า user.role อยู่ใน allowed roles หรือไม่
 * 5. อนุญาตหรือปฏิเสธ
 */

// ==================== Middleware Factory ====================

/**
 * Role Middleware Factory (Higher-Order Function)
 * 
 * สร้าง middleware ที่รับบทบาท (roles) ที่อนุญาต
 * 
 * วิธีใช้:
 * - roleMiddleware('admin'): เฉพาะ admin
 * - roleMiddleware('admin', 'owner'): admin หรือ owner
 * - roleMiddleware('user', 'admin', 'owner'): ทั้งหมด
 * 
 * ตัวอย่างใน route:
 * router.delete('/users/:id', 
 *   authMiddleware,                      // ตรวจสอบ token
 *   roleMiddleware('admin', 'owner'),    // ตรวจสอบบทบาท
 *   deleteUserController
 * );
 * 
 * @param {...string} allowedRoles - ชื่อบทบาทที่อนุญาต (ใช้ rest parameter)
 * @returns {Function} middleware function
 */
module.exports = (...allowedRoles) => {

  /**
   * Middleware Function ที่ส่งกลับ
   * 
   * @param {Object} req - ออบเจ็กต์คำขอ Express
   * @param {Object} req.user - ข้อมูลผู้ใช้ (จาก authMiddleware)
   * @param {string} req.user.role - บทบาทของผู้ใช้
   * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
   * @param {Function} next - ฟังก์ชัน callback ส่งต่อ
   */
  return (req, res, next) => {

    // ==================== ขั้นตอนที่ 1: ตรวจสอบว่ามี req.user หรือไม่ ====================

    /**
     * req.user ควรถูกเติมโดย authMiddleware (middleware ที่ทำงานก่อนหน้า)
     * ถ้าไม่มี req.user แปลว่า:
     * 1. ยังไม่ได้ผ่าน authMiddleware
     * 2. ยังไม่ได้ login
     * 3. token ไม่ถูกต้อง
     */
    if (!req.user) {
      // 401: Unauthorized - ผู้ใช้ยังไม่ได้ login
      return res.status(401).json({ 
        message: "Unauthorized" 
      });
    }

    // ==================== ขั้นตอนที่ 2: ตรวจสอบบทบาท (Role) ====================

    /**
     * req.user.role คือบทบาทของผู้ใช้ (เช่น "user", "admin", "owner")
     * มาจาก JWT payload ที่เซ็นตอนที่ผู้ใช้ login
     * 
     * allowedRoles คือรายการบทบาทที่อนุญาตให้เข้าถึง route นี้
     * ตัวอย่าง: ['admin', 'owner']
     * 
     * includes() - ตรวจสอบว่า role อยู่ในอาร์เรย์หรือไม่
     */
    if (!allowedRoles.includes(req.user.role)) {
      // 403: Forbidden - ผู้ใช้ไม่มีสิทธิ์เข้าถึง route นี้
      return res.status(403).json({
        message: "Forbidden: Access denied"
      });
    }

    // ==================== ขั้นตอนที่ 3: ถ้าผ่านทุกอย่าง ให้ไปขั้นตอนถัดไป ====================

    /**
     * ถ้า role ตรงกับ allowedRoles
     * ให้เรียก next() เพื่อส่งต่อให้ controller/handler ต่อไป
     */
    next();
  };
};