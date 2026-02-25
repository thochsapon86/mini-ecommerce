// โหลดค่าตัวแปรแวดล้อมจากไฟล์ .env (เรียกครั้งเดียว)
require("dotenv").config();

// ===============================
// IMPORT LIBRARIES
// ===============================
const express = require("express"); // Express framework
const mongoose = require("mongoose"); // Mongoose สำหรับเชื่อม MongoDB
const cors = require("cors"); // จัดการ CORS
const helmet = require("helmet"); // เพิ่ม HTTP security headers

// นำเข้า middleware ภายในโปรเจค
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

// ===============================
// CONFIG
// ===============================
const PORT = process.env.PORT || 5000; // ค่าเริ่มต้นถ้าไม่ได้ตั้งใน .env
const MONGO_URI = process.env.MONGO_URI || "";

// ตรวจสอบค่าที่จำเป็น
if (!MONGO_URI) {
  console.error("Missing MONGO_URI in environment");
  process.exit(1);
}

// ===============================
// CREATE APP
// ===============================
const app = express();

// ===============================
// GLOBAL MIDDLEWARE
// ===============================
app.use(express.json()); // แปลง JSON body ให้เป็น JS object
app.use(cors()); // อนุญาต CORS
app.use(helmet()); // เพิ่ม security headers

// ===============================
// ROUTES (นำเข้าและติดตั้ง)
// ===============================
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");

app.use("/api/auth", authRoutes); // auth routes (register, login)
app.use("/api/products", productRoutes); // product routes (public + owner/admin)
app.use("/api/cart", cartRoutes); // cart routes (ต้องล็อกอิน)

// ตัวอย่าง protected route ใช้ middleware ที่นำเข้ามา
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "You are authorized!" });
});

// health check
app.get("/", (req, res) => res.send("API Running..."));

// ===============================
// CONNECT DATABASE & START SERVER (async/await)
// ===============================
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