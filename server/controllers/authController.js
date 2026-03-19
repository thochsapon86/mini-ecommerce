// เรียกใช้ User model
// นำเข้าโมเดล User เพื่อใช้ค้นหา/สร้างผู้ใช้ใน MongoDB
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ================= REGISTER =================
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      message: "เข้าสู่ระบบสำเร็จ",
    });

  } catch (error) {
    console.log("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= FORGOT PASSWORD =================
// ================= FORGOT PASSWORD =================
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ message: "Reset password link sent" });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await transporter.sendMail({
      from: `"TECHZONE" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: "รีเซ็ตรหัสผ่าน TECHZONE",
      html: `
        <div style="font-family:sans-serif; max-width:520px; margin:auto; padding:24px; border:1px solid #eee; border-radius:12px;">
          <h2 style="color:#dc2626;">TECHZONE 🖥️</h2>
          <p>สวัสดี <strong>${user.name}</strong></p>
          <p>คุณได้ขอรีเซ็ตรหัสผ่าน กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่</p>
          <div style="text-align:center; margin:32px 0;">
            <a href="${resetUrl}"
               style="background:#dc2626; color:white; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:700;">
              รีเซ็ตรหัสผ่าน →
            </a>
          </div>
          <p style="color:#888; font-size:13px;">⚠️ ลิงก์หมดอายุใน 10 นาที</p>
          <p style="color:#888; font-size:13px;">ถ้าไม่ได้ขอ ไม่ต้องสนใจอีเมลนี้</p>
        </div>
      `,
    });

    console.log("✉️ Email sent to:", user.email);
    res.json({ message: "Reset password link sent" });

  } catch (err) {
    // ส่งอีเมลไม่ได้ → reset token ออก
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    console.error("Email error:", err);
    res.status(500).json({ message: "ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่" });
  }
};

// ================= RESET PASSWORD =================
const resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      message: "Token invalid or expired",
    });
  }
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({
    message: "Password reset success",
  });
};

// ================= EXPORT =================
module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};