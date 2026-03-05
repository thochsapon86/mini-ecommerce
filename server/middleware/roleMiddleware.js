/**
 * Role middleware
 * คำอธิบาย: middleware สำหรับตรวจสอบว่าผู้ใช้มีบทบาท (role) ที่อนุญาตหรือไม่
 * หลักการทำงาน:
 * - รับพารามิเตอร์ allowed roles เช่น roleMiddleware('admin','owner')
 * - ตรวจสอบ `req.user` (ซึ่งควรถูกเติมโดย authMiddleware)
 * - ถ้า role ไม่ถูกต้อง จะตอบ 403 Forbidden
 */
// export function ออกไปใช้งาน
// (...allowedRoles) คือการรับ parameter ได้หลายค่า เช่น
// roleMiddleware("admin")
// roleMiddleware("admin", "manager")
module.exports = (...allowedRoles) => {

  // คืน middleware function กลับไป
  return (req, res, next) => {

    // ----------------------------------
    // 1️⃣ เช็คก่อนว่ามี req.user ไหม
    // ----------------------------------

    // req.user จะถูกใส่มาจาก authMiddleware ก่อนหน้านี้
    // ถ้าไม่มี แปลว่ายังไม่ได้ผ่านการ login หรือ token ไม่ถูกต้อง
    if (!req.user) {
      // ส่ง 401 Unauthorized หากยังไม่ได้ล็อกอิน
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ----------------------------------
    // 2️⃣ ตรวจสอบ role ของ user
    // ----------------------------------

    // req.user.role มาจาก payload ใน JWT (เช่น 'admin' หรือ 'user')
    // allowedRoles คือรายการ role ที่อนุญาตให้เข้าถึง route นี้

    // ตรวจสอบว่า role ของผู้ใช้รวมอยู่ใน allowedRoles หรือไม่
    if (!allowedRoles.includes(req.user.role)) {
      // ถ้า role ไม่ตรง ให้ตอบ 403 Forbidden
      return res.status(403).json({
        message: "Forbidden: Access denied"
      });
    }

    // ----------------------------------
    // 3️⃣ ถ้าผ่านทุกอย่าง → ไปขั้นตอนถัดไป
    // ----------------------------------
    // ถ้า role ถูกต้อง ให้เรียก next() เพื่อดำเนินการต่อ
    next();
  };
};