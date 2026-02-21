// เรียกใช้ User model
const User = require("../models/User");

// bcrypt ใช้สำหรับ hash และ compare password
const bcrypt = require("bcryptjs");

// jsonwebtoken ใช้สร้าง JWT token
const jwt = require("jsonwebtoken");

// ==========================
// REGISTER
// ==========================
const register = async (req, res) => {
  try {
    // รับค่าจาก body
    const { name, email, password } = req.body;

    // ----------------------------
    // 1️⃣ เช็คว่า email ซ้ำไหม
    // ----------------------------
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // ----------------------------
    // 2️⃣ hash password
    // ----------------------------

    // genSalt(10) = สร้าง salt 10 รอบ
    const salt = await bcrypt.genSalt(10);

    // เอา password ไป hash
    const hashedPassword = await bcrypt.hash(password, salt);

    // ----------------------------
    // 3️⃣ สร้าง user ใหม่
    // ----------------------------
    const user = new User({
      name,
      email,
      password: hashedPassword,
      // role จะ default เป็น "user"
    });

    // บันทึกลง database
    await user.save();

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================
// LOGIN
// ==========================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ----------------------------
    // 1️⃣ หา user จาก email
    // ----------------------------
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ----------------------------
    // 2️⃣ เช็ค password
    // ----------------------------
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ----------------------------
    // 3️⃣ สร้าง JWT token
    // ----------------------------
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    // ส่ง token กลับไปให้ client
    res.json({ token });
  } catch (error) {
    console.log("LOGIN ERROR:", error); // เพิ่มบรรทัดนี้
    res.status(500).json({
      message: "Server error",
    });
  }
};

// export ออกไปให้ route ใช้
module.exports = {
  register,
  login,
};
