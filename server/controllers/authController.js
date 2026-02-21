// นำเข้า User model เพื่อใช้ติดต่อกับ collection users ใน MongoDB
const User = require("../models/User");

// bcrypt ใช้สำหรับ hash และ compare password
// ช่วยป้องกันการเก็บรหัสผ่านแบบ plain text
const bcrypt = require("bcryptjs");

// jsonwebtoken ใช้สำหรับสร้างและตรวจสอบ JWT
// ทำหน้าที่เป็นระบบยืนยันตัวตนแบบ stateless
const jwt = require("jsonwebtoken");


// ===============================
// REGISTER FUNCTION
// ===============================
exports.register = async (req, res) => {
  try {
    // ดึงข้อมูลจาก body ที่ client ส่งมา
    const { name, email, password } = req.body;

    // -------------------------------
    // 1️⃣ ตรวจสอบว่า email ซ้ำไหม
    // -------------------------------
    const existingUser = await User.findOne({ email });

    // ถ้าเจอ user ที่มี email นี้แล้ว
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // -------------------------------
    // 2️⃣ เข้ารหัส password
    // -------------------------------

    // สร้าง salt (ค่าที่ทำให้ hash ซับซ้อนขึ้น)
    // 10 คือ salt rounds (ยิ่งมากยิ่งปลอดภัยแต่ช้าลง)
    const salt = await bcrypt.genSalt(10);

    // นำ password มาผ่านกระบวนการ hash พร้อม salt
    const hashedPassword = await bcrypt.hash(password, salt);

    // -------------------------------
    // 3️⃣ สร้าง user ใหม่
    // -------------------------------
    const user = new User({
      name,
      email,
      password: hashedPassword // เก็บเป็น hash ไม่ใช่รหัสจริง
    });

    // บันทึกลง database
    await user.save();

    // ส่ง response กลับ client
    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    // ถ้าเกิด error ใด ๆ
    res.status(500).json({ message: "Server error" });
  }
};