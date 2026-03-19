/**
 * Server entrypoint
 * คำอธิบาย: ตั้งค่า Express app, ติดตั้ง middleware และ mount routes
 * หลักการทำงาน:
 * - โหลด environment variables (dotenv)
 * - ติดตั้ง global middleware (json, cors, helmet)
 * - เชื่อมต่อ MongoDB ด้วย Mongoose แล้วเริ่มฟังที่พอร์ต
 * - แยก router ไปยังไฟล์ในโฟลเดอร์ routes
 */

// โหลดค่าตัวแปรแวดล้อม
require("dotenv").config();

// -------------------------------
// Imports (ไลบรารีที่นำเข้าและหน้าที่)
// -------------------------------
// `dotenv` ถูกเรียกไปแล้วข้างบนเพื่อโหลด environment variables

// `express` - เว็บเฟรมเวิร์คหลักของแอป ใช้สร้าง HTTP server, router, middleware
const express = require("express");

// `mongoose` - ODM (object-document-mapper) สำหรับเชื่อมต่อและทำงานกับ MongoDB
// - สร้าง schema, model และช่วยจัดการการเชื่อมต่อฐานข้อมูล
const mongoose = require("mongoose");

// `cors` - จัดการ Cross-Origin Resource Sharing
// - กำหนดว่าเว็บเบราว์เซอร์จากโดเมนอื่นสามารถเรียก API ได้หรือไม่
const cors = require("cors");

// `helmet` - ตั้ง HTTP security headers เพื่อช่วยป้องกันความเสี่ยงด้านความปลอดภัย
// - เช่น XSS, clickjacking, MIME sniffing ฯลฯ (เป็นชุด header เริ่มต้นที่แนะนำ)
const helmet = require("helmet");

// local middleware
// `authMiddleware` - middleware ภายในโปรเจค: ตรวจสอบ JWT และเติม `req.user`
const authMiddleware = require("./middleware/authMiddleware");

// -------------------------------
// Config
// -------------------------------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

const dns = require("dns").promises;
dns.setServers(["8.8.8.8", "1.1.1.1"]);

if (!MONGO_URI) {
  console.error("Missing MONGO_URI in environment");
  process.exit(1);
}

// -------------------------------
// App setup
// -------------------------------
const app = express();

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(cors());
app.use(helmet());

// -------------------------------
// Routes
// -------------------------------
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const couponRoutes = require("./routes/couponRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const ownerRoutes = require("./routes/ownerRoutes");

app.use("/api/auth", authRoutes); // auth routes (register, login)
app.use("/api/products", productRoutes); // product routes (public + owner/admin)
app.use("/api/cart", cartRoutes); // cart routes (ต้องล็อกอิน)
app.use("/api/orders", orderRoutes); // order routes (ต้องล็อกอิน)
app.use("/api/payments", paymentRoutes); // payment routes (ต้องล็อกอิน)
app.use("/api/coupons", couponRoutes); // coupon routes (บางอันต้องล็อกอิน บางอันไม่ต้อง)
app.use("/api/users", userRoutes); // user profile routes (ต้องล็อกอิน)
app.use("/api/admin", adminRoutes); // admin routes (ต้องล็อกอินและเป็น admin)
app.use("/api/owner", ownerRoutes); // owner routes (ต้องล็อกอินและเป็น owner/admin)
// ตัวอย่าง protected route ใช้ middleware ที่นำเข้ามา
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "You are authorized!" });
});

// health check
app.get("/", (req, res) => res.send("API Running..."));

// -------------------------------
// Start server
// -------------------------------
const start = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected");

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();