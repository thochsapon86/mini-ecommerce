// นำเข้าไลบรารี jsonwebtoken เพื่อใช้ตรวจสอบและถอดรหัส JWT
const jwt = require("jsonwebtoken"); // นำเข้าโมดูล jsonwebtoken


// ส่งออก middleware function เพื่อนำไปใช้กับ route อื่นใน Express
module.exports = (req, res, next) => {

  // -----------------------------------------
  // 1️⃣ ดึง token จาก request header
  // -----------------------------------------

  // ปกติ client จะส่ง header แบบนี้: Authorization: Bearer <token>
  // req.headers.authorization จะได้ค่าแบบ: "Bearer <token>"
  // ใช้ optional chaining ? เพื่อไม่ให้เกิด error หาก header ไม่มี
  const token = req.headers.authorization?.split(" ")[1]; // ดึงเฉพาะส่วน token หลังคำว่า "Bearer"

  // -----------------------------------------
  // 2️⃣ ถ้าไม่มี token → ปฏิเสธทันที
  // -----------------------------------------
  if (!token) { // ตรวจสอบว่ามี token หรือไม่
    return res.status(401).json({ message: "No token, access denied" }); // ถ้าไม่มี ให้ตอบ 401 และส่งข้อความ
  }

  try {

    // -----------------------------------------
    // 3️⃣ ตรวจสอบ token ว่าถูกต้องไหม
    // -----------------------------------------

    // jwt.verify จะตรวจสอบ signature ด้วย secret และเช็คเวลา exp
    // ถ้า token ถูกต้อง จะคืนค่า payload ที่ใส่ตอน sign (เช่น id, role)
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // ถอดรหัส token ด้วย secret จาก environment

    // ตัวอย่างค่าที่ได้: { id: "...", role: "...", iat: 123, exp: 456 }

    // -----------------------------------------
    // 4️⃣ เก็บข้อมูล user ไว้ใน request
    // -----------------------------------------

    // แปะข้อมูลผู้ใช้ (payload) ลงบน req เพื่อให้ controller หรือ middleware ถัดไปใช้งานได้
    req.user = decoded; // บันทึก payload ของ token ใน req.user

    // -----------------------------------------
    // 5️⃣ บอก express ให้ไปขั้นตอนถัดไป
    // -----------------------------------------
    next(); // เรียก next() เพื่อให้ route handler หรือ middleware ถัดไปทำงาน

  } catch (error) { // จับข้อผิดพลาดจากการ verify token (เช่น หมดอายุหรือปลอมแปลง)

    // ถ้า token ปลอม / หมดอายุ / signature ไม่ตรง ให้ตอบกลับด้วย 401
    res.status(401).json({ message: "Invalid token" }); // ส่งสถานะและข้อความว่า token ไม่ถูกต้อง
  }
};