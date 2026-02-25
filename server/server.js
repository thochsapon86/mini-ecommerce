require("dotenv").config(); // โหลดค่าจากไฟล์ .env เข้าไปไว้ใน process.env ทันทีเมื่อเริ่มต้นโปรแกรม
// ===============================
// IMPORT LIBRARIES (นำเข้าไลบรารีที่จำเป็น)
// ===============================

// Express คือ framework สำหรับสร้าง Web Server และ API
const express = require("express"); // นำเข้าไลบรารี express เพื่อสร้าง app และ route

// Mongoose ใช้เชื่อมต่อและจัดการ MongoDB ผ่าน Schema/Model
const mongoose = require("mongoose"); // นำเข้า mongoose เพื่อเชื่อมต่อและใช้งาน MongoDB

// dotenv ใช้โหลดค่าตัวแปรจากไฟล์ .env มาใส่ใน process.env
const dotenv = require("dotenv"); // นำเข้าโมดูล dotenv เพื่อเรียกใช้งานการอ่านไฟล์ .env (อีกครั้ง ถูกเรียกใช้จริงๆ แต่เรียงลำดับไว้)

// cors (Cross-Origin Resource Sharing)
// ใช้อนุญาตให้ frontend ที่รันคนละ port หรือ domain
// สามารถเรียก API นี้ได้
const cors = require("cors"); // นำเข้า middleware สำหรับจัดการ CORS

// helmet คือ middleware สำหรับเพิ่ม HTTP security headers
// เพื่อป้องกันช่องโหว่พื้นฐาน เช่น XSS, clickjacking
const helmet = require("helmet"); // นำเข้า helmet เพื่อเพิ่ม header ด้านความปลอดภัย

// authMiddleware คือ middleware ที่เราสร้างเอง
// ใช้ตรวจสอบ JWT token ก่อนเข้า route ที่ต้อง login
const authMiddleware = require("./middleware/authMiddleware"); // นำเข้า middleware ตรวจสอบ token (ไฟล์ภายในโปรเจค)
const roleMiddleware = require("./middleware/roleMiddleware"); // นำเข้า middleware ตรวจสอบบทบาทผู้ใช้

// ===============================
// LOAD ENVIRONMENT VARIABLES
// ===============================

// โหลดค่าจากไฟล์ .env
// เช่น MONGO_URI และ PORT
dotenv.config(); // เรียก config() อีกครั้งเพื่อให้แน่ใจว่า process.env ถูกตั้งค่าจาก .env

// ===============================
// CREATE EXPRESS APP
// ===============================

// สร้าง instance ของ express application
const app = express(); // สร้างแอปพลิเคชัน Express (ตัวหลักของเว็บเซิร์ฟเวอร์)

// ===============================
// GLOBAL MIDDLEWARE
// ===============================

// ทำให้ server สามารถอ่านข้อมูล JSON จาก request body ได้
// เช่น ตอน client ส่ง POST/PUT
app.use(express.json()); // ติดตั้ง middleware ให้ Express แปลง JSON body เป็น object

// เปิดใช้งาน CORS
// ถ้าไม่มีตัวนี้ เวลา frontend (เช่น React ที่ port 3000)
// เรียก backend (เช่น port 5000) จะโดน block
app.use(cors()); // ติดตั้ง middleware CORS เพื่ออนุญาตคำขอจาก origins ภายนอก

// เปิดใช้งาน helmet
// จะเพิ่ม security headers อัตโนมัติ เช่น:
// - X-Content-Type-Options
// - X-Frame-Options
// - Strict-Transport-Security
// ช่วยป้องกันการโจมตีพื้นฐานตามแนว OWASP
app.use(helmet()); // ติดตั้ง helmet เพื่อปรับ HTTP headers ให้ปลอดภัยขึ้น

// ===============================
// TEST ROUTE
// ===============================

// Route ทดสอบว่า server ทำงานหรือยัง
// ถ้าเข้า http://localhost:PORT/
// จะเห็นข้อความ "API Running..."
app.get("/", (req, res) => {
  res.send("API Running..."); // ส่งข้อความเรียบง่ายเพื่อยืนยันว่าเซิร์ฟเวอร์ตอบสนอง
});

// ตัวอย่าง route ที่ใช้ middleware หลายตัว: ตรวจสอบ token แล้วตรวจ role
app.get(
  "/api/test-owner",
  authMiddleware, // ตรวจสอบ JWT ว่าถูกต้องและแปะข้อมูลผู้ใช้บน req
  roleMiddleware(["owner", "admin"]), // ตรวจสอบว่าบทบาทเป็น owner หรือ admin
  (req, res) => {
    res.json({ message: "Owner or Admin only" }); // ตอบกลับเฉพาะผู้ที่ผ่านการตรวจบทบาท
  },
);
// ===============================
// ROUTES
// ===============================

// นำเข้า auth routes (เช่น /register, /login)
const authRoutes = require("./routes/authRoutes"); // นำเข้าไฟล์ route สำหรับการยืนยันตัวตน

// กำหนด prefix ให้ route
// ทุก route ใน authRoutes จะขึ้นต้นด้วย /api/auth
// เช่น:
// POST /api/auth/register
// POST /api/auth/login
app.use("/api/auth", authRoutes); // ติดตั้ง router โดยตั้ง path พื้นฐานเป็น /api/auth

// ===============================
// PROTECTED ROUTE (ต้องมี Token)
// ===============================

// Route นี้เป็นตัวอย่าง route ที่ต้อง login ก่อน
// โดยใส่ authMiddleware เป็นตัวกลางก่อนเข้า function หลัก
app.get("/api/protected", authMiddleware, (req, res) => {
  // ถ้า token ถูกต้อง จะเข้ามาถึงตรงนี้
  // แสดงว่าผ่านการยืนยันตัวตนแล้ว
  res.json({ message: "You are authorized!" }); // ตอบกลับข้อความยืนยันสิทธิ์
});

// ===============================
// CONNECT DATABASE & START SERVER
// ===============================

// เชื่อมต่อ MongoDB โดยใช้ URI จากไฟล์ .env
mongoose
  .connect(process.env.MONGO_URI) // เรียก mongoose.connect โดยรับค่าจาก environment variable

  // ถ้าเชื่อมต่อสำเร็จ
  .then(() => {
    console.log("MongoDB Connected"); // แสดงข้อความว่าเชื่อมต่อฐานข้อมูลสำเร็จ

    // เริ่มเปิด server หลังจาก DB เชื่อมสำเร็จ
    // เพื่อป้องกันกรณี server รันแต่ DB ยังไม่พร้อม
    app.listen(
      process.env.PORT,
      () => console.log(`Server running on port ${process.env.PORT}`), // แสดงพอร์ตที่ server ฟัง
    );
  })

  // ถ้าเชื่อมต่อ DB ไม่สำเร็จ
  .catch((err) => console.log(err)); // พิมพ์ error ในกรณีล้มเหลว
