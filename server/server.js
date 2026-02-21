require("dotenv").config();
// ===============================
// IMPORT LIBRARIES (นำเข้าไลบรารีที่จำเป็น)
// ===============================

// Express คือ framework สำหรับสร้าง Web Server และ API
const express = require("express");

// Mongoose ใช้เชื่อมต่อและจัดการ MongoDB ผ่าน Schema/Model
const mongoose = require("mongoose");

// dotenv ใช้โหลดค่าตัวแปรจากไฟล์ .env มาใส่ใน process.env
const dotenv = require("dotenv");

// cors (Cross-Origin Resource Sharing)
// ใช้อนุญาตให้ frontend ที่รันคนละ port หรือ domain
// สามารถเรียก API นี้ได้
const cors = require("cors");

// helmet คือ middleware สำหรับเพิ่ม HTTP security headers
// เพื่อป้องกันช่องโหว่พื้นฐาน เช่น XSS, clickjacking
const helmet = require("helmet");

// authMiddleware คือ middleware ที่เราสร้างเอง
// ใช้ตรวจสอบ JWT token ก่อนเข้า route ที่ต้อง login
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

// ===============================
// LOAD ENVIRONMENT VARIABLES
// ===============================

// โหลดค่าจากไฟล์ .env
// เช่น MONGO_URI และ PORT
dotenv.config();


// ===============================
// CREATE EXPRESS APP
// ===============================

// สร้าง instance ของ express application
const app = express();


// ===============================
// GLOBAL MIDDLEWARE
// ===============================

// ทำให้ server สามารถอ่านข้อมูล JSON จาก request body ได้
// เช่น ตอน client ส่ง POST/PUT
app.use(express.json());

// เปิดใช้งาน CORS
// ถ้าไม่มีตัวนี้ เวลา frontend (เช่น React ที่ port 3000)
// เรียก backend (เช่น port 5000) จะโดน block
app.use(cors());

// เปิดใช้งาน helmet
// จะเพิ่ม security headers อัตโนมัติ เช่น:
// - X-Content-Type-Options
// - X-Frame-Options
// - Strict-Transport-Security
// ช่วยป้องกันการโจมตีพื้นฐานตามแนว OWASP
app.use(helmet());


// ===============================
// TEST ROUTE
// ===============================

// Route ทดสอบว่า server ทำงานหรือยัง
// ถ้าเข้า http://localhost:PORT/
// จะเห็นข้อความ "API Running..."
app.get("/", (req, res) => {
  res.send("API Running...");
});

app.get(
  "/api/test-owner",
  authMiddleware,
  roleMiddleware(["owner", "admin"]),
  (req, res) => {
    res.json({ message: "Owner or Admin only" });
  }
);
// ===============================
// ROUTES
// ===============================

// นำเข้า auth routes (เช่น /register, /login)
const authRoutes = require("./routes/authRoutes");

// กำหนด prefix ให้ route
// ทุก route ใน authRoutes จะขึ้นต้นด้วย /api/auth
// เช่น:
// POST /api/auth/register
// POST /api/auth/login
app.use("/api/auth", authRoutes);


// ===============================
// PROTECTED ROUTE (ต้องมี Token)
// ===============================

// Route นี้เป็นตัวอย่าง route ที่ต้อง login ก่อน
// โดยใส่ authMiddleware เป็นตัวกลางก่อนเข้า function หลัก
app.get("/api/protected", authMiddleware, (req, res) => {

  // ถ้า token ถูกต้อง จะเข้ามาถึงตรงนี้
  // แสดงว่าผ่านการยืนยันตัวตนแล้ว
  res.json({ message: "You are authorized!" });
});


// ===============================
// CONNECT DATABASE & START SERVER
// ===============================

// เชื่อมต่อ MongoDB โดยใช้ URI จากไฟล์ .env
mongoose.connect(process.env.MONGO_URI)

  // ถ้าเชื่อมต่อสำเร็จ
  .then(() => {
    console.log("MongoDB Connected");

    // เริ่มเปิด server หลังจาก DB เชื่อมสำเร็จ
    // เพื่อป้องกันกรณี server รันแต่ DB ยังไม่พร้อม
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })

  // ถ้าเชื่อมต่อ DB ไม่สำเร็จ
  .catch(err => console.log(err));