// นำเข้า jsonwebtoken
// ใช้สำหรับตรวจสอบ (verify) JWT token
const jwt = require("jsonwebtoken");


// export middleware function ออกไปใช้ใน route อื่น
module.exports = (req, res, next) => {

  // -----------------------------------------
  // 1️⃣ ดึง token จาก request header
  // -----------------------------------------

  // ปกติ client จะส่ง header แบบนี้:
  // Authorization: Bearer <token>

  // req.headers.authorization จะได้ค่าแบบ:
  // "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

  // split(" ") จะแยกเป็น:
  // ["Bearer", "<token>"]

  // [1] คือเอาเฉพาะตัว token จริง ๆ
  const token = req.headers.authorization?.split(" ")[1];

  // -----------------------------------------
  // 2️⃣ ถ้าไม่มี token → ปฏิเสธทันที
  // -----------------------------------------
  if (!token) {
    return res.status(401).json({ message: "No token, access denied" });
  }

  try {

    // -----------------------------------------
    // 3️⃣ ตรวจสอบ token ว่าถูกต้องไหม
    // -----------------------------------------

    // jwt.verify จะ:
    // - ตรวจสอบ signature ด้วย JWT_SECRET
    // - เช็คว่า token หมดอายุหรือยัง
    // - ถ้าถูกต้อง จะคืนค่า payload กลับมา

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded จะเป็นข้อมูลที่เราใส่ตอน login เช่น:
    // { id: "...", role: "...", iat: ..., exp: ... }

    // -----------------------------------------
    // 4️⃣ เก็บข้อมูล user ไว้ใน request
    // -----------------------------------------

    // เพื่อให้ controller ใช้ต่อได้
    req.user = decoded;

    // -----------------------------------------
    // 5️⃣ บอก express ให้ไปขั้นตอนถัดไป
    // -----------------------------------------
    next();

  } catch (error) {

    // ถ้า token ปลอม / หมดอายุ / signature ไม่ตรง
    res.status(401).json({ message: "Invalid token" });
  }
};