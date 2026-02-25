// นำเข้า jsonwebtoken
// ใช้สำหรับตรวจสอบ (verify) JWT token
const jwt = require("jsonwebtoken"); // นำเข้าไลบรารี jsonwebtoken เพื่อตรวจสอบและถอดรหัส token


// export middleware function ออกไปใช้ใน route อื่น
module.exports = (req, res, next) => {

  // -----------------------------------------
  // 1️⃣ ดึง token จาก request header
  // -----------------------------------------

  // ปกติ client จะส่ง header แบบนี้:
  // Authorization: Bearer <token>

  // req.headers.authorization จะได้ค่าแบบ: "Bearer <token>"
  // ใช้ optional chaining ? เพื่อหลีกเลี่ยง error ถ้า header ไม่มี
  const token = req.headers.authorization?.split(" ")[1]; // แยกคำว่า "Bearer" ออกจาก token แล้วเอา index 1

  // -----------------------------------------
  // 2️⃣ ถ้าไม่มี token → ปฏิเสธทันที
  // -----------------------------------------
  if (!token) {
    // ส่ง status 401 (Unauthorized) และข้อความว่าไม่มี token
    return res.status(401).json({ message: "No token, access denied" });
  }

  try {

    // -----------------------------------------
    // 3️⃣ ตรวจสอบ token ว่าถูกต้องไหม
    // -----------------------------------------

    // jwt.verify จะตรวจสอบ signature ด้วย secret และเช็คเวลา exp
    // ถ้าถูกต้อง จะคืน payload (ข้อมูลที่ใส่ตอน sign เช่น id, role)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded ตัวอย่าง: { id: "...", role: "...", iat: 123, exp: 456 }

    // -----------------------------------------
    // 4️⃣ เก็บข้อมูล user ไว้ใน request
    // -----------------------------------------

    // แปะข้อมูลผู้ใช้ (payload) ลงบน req เพื่อให้ controller หรือ middleware ถัดไปใช้งานได้
    req.user = decoded;

    // -----------------------------------------
    // 5️⃣ บอก express ให้ไปขั้นตอนถัดไป
    // -----------------------------------------
    next(); // เรียก next() เพื่อให้ route handler หรือ middleware ถัดไปทำงาน

  } catch (error) {

    // ถ้า token ปลอม / หมดอายุ / signature ไม่ตรง
    // ตอบกลับด้วย 401 และข้อความว่า token ไม่ถูกต้อง
    res.status(401).json({ message: "Invalid token" });
  }
};