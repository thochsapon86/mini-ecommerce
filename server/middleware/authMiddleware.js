/**
 * ========================
 * ไฟล์ Authentication Middleware
 * ========================
 * ตรวจสอบและยืนยันตัวตนของผู้ใช้ด้วย JWT Token
 * 
 * วัตถุประสงค์:
 * - ดึง JWT token จาก request header
 * - ตรวจสอบความถูกต้องของ token
 * - ดึงข้อมูลผู้ใช้จาก token payload
 * - บันทึกข้อมูล user ใน req.user เพื่อให้ route ถัดไปใช้
 * 
 * หลักการการทำงาน:
 * 1. ดึง token จาก Authorization header (Bearer scheme)
 * 2. ตรวจสอบ signature ด้วย JWT_SECRET
 * 3. ตรวจสอบเวลาหมดอายุ (exp)
 * 4. เก็บ payload ใน req.user
 * 5. ถัดไปให้ route handler ทำงาน
 */

// ==================== นำเข้า Dependencies ====================

/**
 * jsonwebtoken - ไลบรารีสำหรับสร้าง ตรวจสอบ และถอดรหัส JWT
 * JWT ใช้สำหรับการยืนยันตัวตนแบบ stateless
 */
const jwt = require("jsonwebtoken");

// ==================== Middleware Function ====================

/**
 * Authentication Middleware
 * ตรวจสอบและยืนยัน JWT token ของผู้ใช้
 * 
 * วิธีใช้ใน route:
 * app.get('/profile', authMiddleware, controller)
 * 
 * @param {Object} req - ออบเจ็กต์คำขอ Express
 * @param {Object} res - ออบเจ็กต์การตอบสนอง Express
 * @param {Function} next - ฟังก์ชัน callback เพื่อส่งต่อให้ handler ถัดไป
 */
module.exports = (req, res, next) => {

  // ==================== ขั้นตอนที่ 1: ดึง Token จาก Header ====================
  
  /**
   * ดึง token จาก Authorization header
   * 
   * ลักษณะการส่ง token จาก client:
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * req.headers.authorization จะได้ค่า: "Bearer <token>"
   * ใช้ optional chaining (?.) เพื่อป้องกันข้อผิดพลาด
   * .split(" ")[1] เพื่อดึงเฉพาะส่วน token หลังคำว่า "Bearer"
   */
  const token = req.headers.authorization?.split(" ")[1];

  // ==================== ขั้นตอนที่ 2: ตรวจสอบว่ามี Token หรือไม่ ====================

  /**
   * ถ้าไม่มี token แม้กแต่คำหนึ่ง
   * แสดงว่าผู้ใช้ยังไม่ได้เข้าสู่ระบบ
   * ส่งกลับสถานะ 401 Unauthorized
   */
  if (!token) {
    // 401: Unauthorized - ไม่มี token
    return res.status(401).json({ 
      message: "No token, access denied" 
    });
  }

  try {
    // ==================== ขั้นตอนที่ 3: ตรวจสอบและถอดรหัส Token ====================

    /**
     * jwt.verify(token, secret) จะ:
     * 1. ตรวจสอบ signature (ว่า token ไม่ถูกแก้ไข)
     * 2. ตรวจสอบเวลาหมดอายุ (exp claim)
     * 3. ถอดรหัส payload ถ้าทั้งหมดถูกต้อง
     * 
     * ถ้าผ่านได้ จะคืนค่า payload (เข้ารหัส data)
     * ถ้าไม่ผ่าน จะโยนข้อผิดพลาด (catch block)
     * 
     * process.env.JWT_SECRET คือกุญแจลับที่ใช้เซ็น token
     * ต้องตรงกับ secret ที่ใช้สร้าง token
     */
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * payload ของ token มีลักษณะแบบนี้:
     * {
     *   id: "507f1f77bcf86cd799439011",   // ID ผู้ใช้
     *   role: "user",                      // บทบาท (user/admin/owner)
     *   iat: 1710000000,                   // ออกเมื่อ (issued at)
     *   exp: 1710003600                    // หมดอายุเมื่อ (expires)
     * }
     */

    // ==================== ขั้นตอนที่ 4: บันทึกข้อมูล User ใน Request ====================

    /**
     * เก็บข้อมูล payload ลงใน req.user
     * เพื่อให้ controller และ middleware ถัดไปเข้าถึงข้อมูลผู้ใช้ได้
     * 
     * ตัวอย่างการใช้ใน controller:
     * const userId = req.user.id;
     * const userRole = req.user.role;
     */
    req.user = decoded;

    // ==================== ขั้นตอนที่ 5: ถัดไปให้ Handler ทำงาน ====================

    /**
     * เรียก next() เพื่อให้ Express ไปทำงาน handler ต่อไป
     * ถ้าไม่เรียก next() ระบบจะค้างและไม่มีการตอบสนอง
     */
    next();

  } catch (error) {
    // ==================== ขั้นตอนที่ 6: จัดการข้อผิดพลาด ====================

    /**
     * ข้อผิดพลาดที่อาจจะเกิดขึ้น:
     * 1. TokenExpiredError - token หมดอายุแล้ว
     * 2. JsonWebTokenError - signature ไม่ตรง (token ถูกแก้ไข)
     * 3. NotBeforeError - token ยังไม่ถึงเวลาใช้
     * 4. SyntaxError - format token ไม่ถูกต้อง
     * 
     * ทั้งหมดแสดงว่า token ไม่ถูกต้องสงสัย
     * ควรปฏิเสธการเข้าถึง
     */

    // 401: Unauthorized - token ไม่ถูกต้อง/หมดอายุ/ถูกปลอมแปลง
    res.status(401).json({ 
      message: "Invalid token" 
    });
  }
};