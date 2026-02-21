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

    // req.user จะถูกใส่มาจาก authMiddleware
    // ถ้าไม่มี แปลว่ายังไม่ได้ผ่านการ login
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ----------------------------------
    // 2️⃣ ตรวจสอบ role ของ user
    // ----------------------------------

    // req.user.role มาจาก token
    // allowedRoles คือ role ที่ route นี้อนุญาต

    // includes() จะเช็คว่า
    // role ของ user อยู่ใน allowedRoles ไหม
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden: Access denied"
      });
    }

    // ----------------------------------
    // 3️⃣ ถ้าผ่านทุกอย่าง → ไปขั้นตอนถัดไป
    // ----------------------------------
    next();
  };
};