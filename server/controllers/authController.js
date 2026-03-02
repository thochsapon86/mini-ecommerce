// เรียกใช้ User model
// นำเข้าโมเดล User เพื่อใช้ค้นหา/สร้างผู้ใช้ใน MongoDB
const User = require("../models/User");

// bcrypt ใช้สำหรับ hash และ compare password
// นำเข้าไลบรารี bcryptjs เพื่อสร้าง salt และ hash พาสเวิร์ด
const bcrypt = require("bcryptjs");

// jsonwebtoken ใช้สร้าง JWT token
// นำเข้าไลบรารี jsonwebtoken สำหรับการเซ็นและตรวจสอบ JWT
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // ใช้สำหรับสร้าง token สำหรับ reset password
// ==========================
// REGISTER
// ==========================
// ฟังก์ชันสำหรับลงทะเบียนผู้ใช้ใหม่
const register = async (req, res) => {
  try {
    // รับค่าจาก body
    // ดึง name, email, password จาก request body ที่ client ส่งมา
    const { name, email, password } = req.body;

    // ----------------------------
    // 1️⃣ เช็คว่า email ซ้ำไหม
    // ----------------------------
    // ค้นหาในฐานข้อมูลว่ามีผู้ใช้ที่มีอีเมลนี้แล้วหรือไม่
    const existingUser = await User.findOne({ email });

    // ถ้าพบว่ามีผู้ใช้งานอยู่แล้ว ให้ตอบกลับด้วยสถานะ 400
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // ----------------------------
    // 2️⃣ hash password
    // ----------------------------
    // สร้าง salt เพื่อเพิ่มความปลอดภัยให้กับการ hash
    // genSalt(10) หมายถึงจำนวนรอบ (cost factor) เป็น 10
    const salt = await bcrypt.genSalt(10);

    // เอา password ที่ผู้ใช้ส่งมาไป hash กับ salt ที่สร้างขึ้น
    const hashedPassword = await bcrypt.hash(password, salt);

    // ----------------------------
    // 3️⃣ สร้าง user ใหม่
    // ----------------------------
    // สร้างอินสแตนซ์ของโมเดล User โดยเก็บ password เป็นค่า hashed
    const user = new User({
      name,
      email,
      password: hashedPassword,
      // role จะ default เป็น "user" ตามที่กำหนดใน schema
    });

    // บันทึกผู้ใช้ใหม่ลงในฐานข้อมูล (MongoDB)
    await user.save();

    // ตอบกลับ client ว่าสร้างผู้ใช้สำเร็จ พร้อมสถานะ 201 (Created)
    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    // หากเกิดข้อผิดพลาดใด ๆ ให้ตอบกลับสถานะ 500 (Server error)
    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================
// LOGIN
// ==========================
// ฟังก์ชันสำหรับตรวจสอบผู้ใช้และออก JWT
const login = async (req, res) => {
  try {
    // ดึง email และ password ที่ผู้ใช้ส่งมาใน body
    const { email, password } = req.body;

    // ----------------------------
    // 1️⃣ หา user จาก email
    // ----------------------------
    // ค้นหาผู้ใช้ในฐานข้อมูลโดยใช้ email
    const user = await User.findOne({ email });

    // หากไม่พบผู้ใช้ ให้ตอบกลับว่า credentials ไม่ถูกต้อง
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ----------------------------
    // 2️⃣ เช็ค password
    // ----------------------------
    // เปรียบเทียบ password ที่ส่งมากับ hashed password ใน DB
    const isMatch = await bcrypt.compare(password, user.password);

    // ถ้าไม่ตรงกัน ให้ตอบกลับว่า credentials ไม่ถูกต้อง
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ----------------------------
    // 3️⃣ สร้าง JWT token
    // ----------------------------
    // สร้าง payload ที่ต้องการเก็บใน token (เช่น id และ role)
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      // ใช้ secret จาก environment variable ในการเซ็น token
      process.env.JWT_SECRET,
      {
        // กำหนดอายุของ token เป็น 1 ชั่วโมง
        expiresIn: "1h",
      },
    );
// เรียกใช้ User model
// นำเข้าโมเดล User เพื่อใช้ค้นหา/สร้างผู้ใช้ใน MongoDB
const User = require("../models/User");

// bcrypt ใช้สำหรับ hash และ compare password
// นำเข้าไลบรารี bcryptjs เพื่อสร้าง salt และ hash พาสเวิร์ด
const bcrypt = require("bcryptjs");

// jsonwebtoken ใช้สร้าง JWT token
// นำเข้าไลบรารี jsonwebtoken สำหรับการเซ็นและตรวจสอบ JWT
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // ใช้สำหรับสร้าง token สำหรับ reset password
// ==========================
// REGISTER
// ==========================
// ฟังก์ชันสำหรับลงทะเบียนผู้ใช้ใหม่
const register = async (req, res) => {
  try {
    // รับค่าจาก body
    // ดึง name, email, password จาก request body ที่ client ส่งมา
    const { name, email, password } = req.body;

    // ----------------------------
    // 1️⃣ เช็คว่า email ซ้ำไหม
    // ----------------------------
    // ค้นหาในฐานข้อมูลว่ามีผู้ใช้ที่มีอีเมลนี้แล้วหรือไม่
    const existingUser = await User.findOne({ email });

    // ถ้าพบว่ามีผู้ใช้งานอยู่แล้ว ให้ตอบกลับด้วยสถานะ 400
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // ----------------------------
    // 2️⃣ hash password
    // ----------------------------
    // สร้าง salt เพื่อเพิ่มความปลอดภัยให้กับการ hash
    // genSalt(10) หมายถึงจำนวนรอบ (cost factor) เป็น 10
    const salt = await bcrypt.genSalt(10);

    // เอา password ที่ผู้ใช้ส่งมาไป hash กับ salt ที่สร้างขึ้น
    const hashedPassword = await bcrypt.hash(password, salt);

    // ----------------------------
    // 3️⃣ สร้าง user ใหม่
    // ----------------------------
    // สร้างอินสแตนซ์ของโมเดล User โดยเก็บ password เป็นค่า hashed
    const user = new User({
      name,
      email,
      password: hashedPassword,
      // role จะ default เป็น "user" ตามที่กำหนดใน schema
    });

    // บันทึกผู้ใช้ใหม่ลงในฐานข้อมูล (MongoDB)
    await user.save();

    // ตอบกลับ client ว่าสร้างผู้ใช้สำเร็จ พร้อมสถานะ 201 (Created)
    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    // หากเกิดข้อผิดพลาดใด ๆ ให้ตอบกลับสถานะ 500 (Server error)
    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================
// LOGIN
// ==========================
// ฟังก์ชันสำหรับตรวจสอบผู้ใช้และออก JWT
const login = async (req, res) => {
  try {
    // ดึง email และ password ที่ผู้ใช้ส่งมาใน body
    const { email, password } = req.body;

    // ----------------------------
    // 1️⃣ หา user จาก email
    // ----------------------------
    // ค้นหาผู้ใช้ในฐานข้อมูลโดยใช้ email
    const user = await User.findOne({ email });

    // หากไม่พบผู้ใช้ ให้ตอบกลับว่า credentials ไม่ถูกต้อง
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ----------------------------
    // 2️⃣ เช็ค password
    // ----------------------------
    // เปรียบเทียบ password ที่ส่งมากับ hashed password ใน DB
    const isMatch = await bcrypt.compare(password, user.password);

    // ถ้าไม่ตรงกัน ให้ตอบกลับว่า credentials ไม่ถูกต้อง
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ----------------------------
    // 3️⃣ สร้าง JWT token
    // ----------------------------
    // สร้าง payload ที่ต้องการเก็บใน token (เช่น id และ role)
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      // ใช้ secret จาก environment variable ในการเซ็น token
      process.env.JWT_SECRET,
      {
        // กำหนดอายุของ token เป็น 1 ชั่วโมง
        expiresIn: "1h",
      },
    );

    // ส่ง token และข้อความยืนยันกลับไปให้ client ใช้ในการเรียก API ที่ต้องการการยืนยันตัวตน
    res.json({ token, message: "เข้าสู่ระบบสำเร็จ" });
  } catch (error) {
    // พิมพ์ข้อผิดพลาดลง console เพื่อช่วย debug
    console.log("LOGIN ERROR:", error); // เพิ่มบรรทัดนี้
    // ตอบกลับ client ว่าเกิด server error
    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetUrl =
    `http://localhost:5173/reset-password/${resetToken}`;

  // TODO: send email
  console.log("RESET LINK:", resetUrl);

  res.json({
    message: "Reset password link sent",
  });
};
exports.resetPassword = async (req, res) => {

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      message: "Token invalid or expired"
    });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({
    message: "Password reset success"
  });
};
// export ออกไปให้ route ใช้
// ส่งฟังก์ชัน register และ login เพื่อให้นำไปเชื่อมกับ route ที่เหมาะสม
module.exports = {
  register,
  login, 
  forgotPassword,
  resetPassword
};

    // ส่ง token และข้อความยืนยันกลับไปให้ client ใช้ในการเรียก API ที่ต้องการการยืนยันตัวตน
    res.json({ token, message: "เข้าสู่ระบบสำเร็จ" });
  } catch (error) {
    // พิมพ์ข้อผิดพลาดลง console เพื่อช่วย debug
    console.log("LOGIN ERROR:", error); // เพิ่มบรรทัดนี้
    // ตอบกลับ client ว่าเกิด server error
    res.status(500).json({
      message: "Server error",
    });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetUrl =
    `http://localhost:5173/reset-password/${resetToken}`;

  // TODO: send email
  console.log("RESET LINK:", resetUrl);

  res.json({
    message: "Reset password link sent",
  });
};
const resetPassword = async (req, res) => {

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      message: "Token invalid or expired"
    });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({
    message: "Password reset success"
  });
};
// export ออกไปให้ route ใช้
// ส่งฟังก์ชัน register และ login เพื่อให้นำไปเชื่อมกับ route ที่เหมาะสม
module.exports = {
  register,
  login, 
  forgotPassword,
  resetPassword
};
