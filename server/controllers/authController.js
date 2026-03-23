/**
 * ========================
 * ไฟล์ Authentication Controller
 * ========================
 * จัดการฟังก์ชันการยืนยันตัวตนของผู้ใช้ เช่น:
 * - สมัครสมาชิก (Register)
 * - เข้าสู่ระบบ (Login)
 * - ลืมรหัสผ่าน (Forgot Password)
 * - รีเซ็ตรหัสผ่าน (Reset Password)
 */

// ==================== นำเข้า Dependencies ====================

// นำเข้าโมเดล User ที่ใช้สำหรับการเรียกใช้ฐานข้อมูล MongoDB
const User = require("../models/User");

// bcryptjs - ใช้สำหรับเข้ารหัสและเปรียบเทียบรหัสผ่าน
const bcrypt = require("bcryptjs");

// jsonwebtoken (JWT) - ใช้สำหรับสร้าง token ที่ใช้ยืนยันตัวตนของผู้ใช้
const jwt = require("jsonwebtoken");

// crypto - ใช้สำหรับสร้างหรือแฮชรหัส token สำหรับรีเซ็ตรหัสผ่าน
const crypto = require("crypto");

// nodemailer - ใช้สำหรับส่งอีเมลถึงผู้ใช้
const nodemailer = require("nodemailer");

// ==================== ตั้งค่า Email Transporter ====================

/**
 * สร้าง transporter สำหรับส่งอีเมลผ่าน Gmail
 * ใช้สำหรับส่งลิงก์รีเซ็ตรหัสผ่านถึงผู้ใช้
 * ข้อมูลการเชื่อมต่อจะเก็บไว้ใน environment variables (.env)
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});


// ==================== ฟังก์ชัน REGISTER ====================

/**
 * ฟังก์ชันสมัครสมาชิก (Register)
 * 
 * วัตถุประสงค์:
 * - สร้างบัญชีผู้ใช้ใหม่
 * - ตรวจสอบว่าอีเมลยังไม่ถูกใช้งาน
 * - เข้ารหัสรหัสผ่านด้วย bcrypt
 * - บันทึกผู้ใช้ใหม่ลงในฐานข้อมูล
 * 
 * @param {Object} req.body - ข้อมูลจากคำขอ HTTP
 *   - name: ชื่อผู้ใช้
 *   - email: อีเมลผู้ใช้
 *   - password: รหัสผ่านต้นทาง
 * @param {Object} res - การตอบสนอง HTTP
 * 
 * @returns {Object} ข้อความยืนยันการสมัครสำเร็จหรือข้อผิดพลาด
 */
const register = async (req, res) => {
  try {
    // ดึงข้อมูลจาก request body
    const { name, email, password } = req.body;

    // ตรวจสอบว่าอีเมลนี้มีอยู่ในฐานข้อมูลแล้วหรือไม่
    const existingUser = await User.findOne({ email });

    // ถ้ามีผู้ใช้ที่มีอีเมลเดียวกัน ให้ส่งข้อมูลข้อผิดพลาด
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // ==================== เข้ารหัสรหัสผ่าน ====================
    // สร้าง salt (ตัวเกลือสำหรับการเข้ารหัส) - จำนวน 10 รอบ
    const salt = await bcrypt.genSalt(10);
    // เข้ารหัสรหัสผ่านโดยใช้ salt นี้
    const hashedPassword = await bcrypt.hash(password, salt);

    // ==================== สร้าง User Object ====================
    // สร้างอ็บเจกต์ผู้ใช้ใหม่ด้วยข้อมูลที่ได้รับ
    const user = new User({
      name,                    // ชื่อผู้ใช้
      email,                   // อีเมลผู้ใช้
      password: hashedPassword, // รหัสผ่านที่เข้ารหัสแล้ว
    });

    // บันทึกผู้ใช้ลงในฐานข้อมูล MongoDB
    await user.save();

    // ส่งการตอบสนองสำเร็จ (Status 201 = Created)
    res.status(201).json({
      message: "User registered successfully",
    });

  } catch (error) {
    // หากมีข้อผิดพลาด ให้ส่งข้อมูลข้อผิดพลาดเซิร์ฟเวอร์
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== ฟังก์ชัน LOGIN ====================

/**
 * ฟังก์ชันเข้าสู่ระบบ (Login)
 * 
 * วัตถุประสงค์:
 * - ตรวจสอบชื่ออีเมลและรหัสผ่าน
 * - เปรียบเทียบรหัสผ่านที่ส่งมากับ hash ในฐานข้อมูล
 * - สร้าง JWT token สำหรับการยืนยันตัวตน
 * 
 * @param {Object} req.body - ข้อมูลจากคำขอ HTTP
 *   - email: อีเมลของผู้ใช้
 *   - password: รหัสผ่านของผู้ใช้
 * @param {Object} res - การตอบสนอง HTTP
 * 
 * @returns {Object} JWT token สำหรับใช้ในการยืนยันตัวตน
 */
const login = async (req, res) => {
  try {
    // ดึงข้อมูลอีเมลและรหัสผ่านจาก request body
    const { email, password } = req.body;

    // ค้นหาผู้ใช้ที่มีอีเมลตรงกับที่ส่งมา
    const user = await User.findOne({ email });

    // ถ้าไม่พบผู้ใช้ที่มีอีเมลนี้
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ==================== ตรวจสอบรหัสผ่าน ====================
    // เปรียบเทียบรหัสผ่านที่ส่งมากับ hash ในฐานข้อมูล
    // bcrypt.compare จะคืนค่า true ถ้าตรงกัน
    const isMatch = await bcrypt.compare(password, user.password);

    // ถ้ารหัสผ่านไม่ตรงกัน
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ==================== สร้าง JWT Token ====================
    /**
     * JWT token จะประกอบด้วย:
     * - payload: { id, role } - ข้อมูลผู้ใช้และบทบาท
     * - secret: JWT_SECRET - กุญแจลับสำหรับการเข้ารหัส token
     * - expiresIn: "1h" - token หมดอายุใん 1 ชั่วโมง
     */
    const token = jwt.sign(
      {
        id: user._id,      // ID ของผู้ใช้ใน MongoDB
        role: user.role,   // บทบาทของผู้ใช้ (user, admin, owner)
      },
      process.env.JWT_SECRET, // กุญแจลับสำหรับการเข้ารหัส
      { expiresIn: "1h" }     // กำหนดเวลาหมดอายุ
    );

    // ส่ง token กลับไปให้ client
    res.json({
      token,               // JWT token
      message: "เข้าสู่ระบบสำเร็จ",
    });

  } catch (error) {
    // บันทึกข้อผิดพลาดในคอนโซล
    console.log("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ==================== ฟังก์ชัน FORGOT PASSWORD ====================

/**
 * ฟังก์ชันลืมรหัสผ่าน (Forgot Password)
 * 
 * วัตถุประสงค์:
 * - สร้าง reset token สำหรับรีเซ็ตรหัสผ่าน
 * - ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของผู้ใช้
 * - หากอีเมลไม่มีอยู่ ให้ส่งข้อความเดียวกันเพื่อเหตุผลด้านความปลอดภัย
 * 
 * @param {Object} req.body - ข้อมูลจากคำขอ HTTP
 *   - email: อีเมลของผู้ใช้
 * @param {Object} res - การตอบสนอง HTTP
 * 
 * @returns {Object} ข้อความยืนยันว่าส่งลิงก์ไปแล้ว
 */
const forgotPassword = async (req, res) => {
  console.log("🔥 forgotPassword called", req.body); // เพิ่มตรงนี้
  try {
    // ดึงอีเมลจาก request body
    const { email } = req.body;

    // ค้นหาผู้ใช้ที่มีอีเมลตรงกับที่ส่งมา
    const user = await User.findOne({ email });
    console.log("👤 user found:", user ? user.email : "NOT FOUND"); // เพิ่มตรงนี้
    // ==================== การตรวจสอบด้านความปลอดภัย ====================
    /**
     * เหตุผล: ถ้าส่งข้อมูลต่างกันเมื่ออีเมลไม่มีอยู่
     * จะเป็นการเผยให้เห็นว่าอีเมลนั้นอยู่ในระบบหรือไม่
     * ดังนั้นเราจึงส่งข้อความเดียวกันไม่ว่ากรณีใด
     */
    if (!user) {
      return res.json({ message: "Reset password link sent" });
    }
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // ==================== สร้าง Reset Token ====================
    // เรียกฟังก์ชัน getResetPasswordToken จากโมเดล User
    // ฟังก์ชันนี้สร้าง token และบันทึกลงในฐานข้อมูล
    const resetToken = user.getResetPasswordToken();
    // บันทึกผู้ใช้ด้วยโทเค็นรีเซ็ต (ข้ามการตรวจสอบความถูกต้อง)
    await user.save({ validateBeforeSave: false });

    // ==================== สร้าง Reset URL ====================
    // สร้าง URL ที่มี token เพื่อส่งไปให้ผู้ใช้
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      // ==================== ส่งอีเมล ====================
      await transporter.sendMail({
        from: `"TECHZONE" <${process.env.GMAIL_USER}>`, // ผู้ส่ง
        to: user.email,                                   // ผู้รับ
        subject: "รีเซ็ตรหัสผ่าน TECHZONE",              // หัวเรื่อง
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

      // บันทึก log เพื่อวัตถุประสงค์ในการดีบัก
      console.log("✉️ Email sent to:", user.email);

      // ส่งการตอบสนองดำเนินการสำเร็จ
      res.json({ message: "Reset password link sent" });

    } catch (err) {
      // ==================== การจัดการข้อผิดพลาดในการส่งอีเมล ====================
      /**
       * หากการส่งอีเมลล้มเหลว จะล้างการเก็บ token ที่สร้างไว้
       * เพื่อไม่ให้ผู้ใช้สามารถใช้ token ที่ไม่ได้รับอีเมลได้
       */
      user.resetPasswordToken = undefined;       // ล้าง token
      user.resetPasswordExpire = undefined;      // ล้างเวลาหมดอายุ
      await user.save({ validateBeforeSave: false });
      console.error("EMAIL ERROR:", err.message);
      console.error("EMAIL CONFIG:", {
        user: process.env.GMAIL_USER,
        hasPass: !!process.env.GMAIL_PASS,
        clientUrl: process.env.CLIENT_URL,
      });
      // บันทึก error log
      console.error("Email error:", err);

      // ส่งข้อมูลข้อผิดพลาด
      res.status(500).json({ message: "ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่" });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== ฟังก์ชัน RESET PASSWORD ====================

/**
 * ฟังก์ชันรีเซ็ตรหัสผ่าน (Reset Password)
 * 
 * วัตถุประสงค์:
 * - ตรวจสอบ token ที่ได้รับจาก URL
 * - ตรวจสอบว่า token ยังไม่หมดอายุ
 * - อัปเดตรหัสผ่านผู้ใช้ด้วยรหัสผ่านใหม่
 * - ล้าง token เมื่อเสร็จสิ้น
 * 
 * @param {Object} req.params.token - Token รีเซ็ตจาก URL
 * @param {Object} req.body.password - รหัสผ่านใหม่
 * @param {Object} res - การตอบสนอง HTTP
 * 
 * @returns {Object} ข้อความยืนยันการรีเซ็ตสำเร็จ
 */
const resetPassword = async (req, res) => {
  try {
    // ==================== แฮช Token ====================
    /**
     * Token ที่ส่งมาในลิงก์ต้องแฮชเหมือนกับที่บันทึกไว้ในฐานข้อมูล
     * เพื่อตรวจสอบว่าเป็น token ที่ถูกต้อง
     */
    const resetPasswordToken = crypto
      .createHash("sha256")           // ใช้ SHA256 สำหรับแฮช
      .update(req.params.token)       // แฮช token ที่ได้รับ
      .digest("hex");                 // แปลงเป็น hexadecimal

    // ==================== ค้นหา User ด้วย Token ====================
    /**
     * ค้นหาผู้ใช้ที่มี:
     * 1. resetPasswordToken ตรงกับ token ที่แฮชไว้
     * 2. resetPasswordExpire มากกว่าเวลาปัจจุบัน ($gt = greater than)
     */
    const user = await User.findOne({
      resetPasswordToken,                         // token ต้องตรงกัน
      resetPasswordExpire: { $gt: Date.now() },   // token ต้องยังไม่หมดอายุ
    });

    // ถ้าไม่พบผู้ใช้หรือ token หมดอายุ
    if (!user) {
      return res.status(400).json({
        message: "Token invalid or expired",
      });
    }

    // ==================== เข้ารหัสรหัสผ่านใหม่ ====================
    // สร้าง salt สำหรับการเข้ารหัส
    const salt = await bcrypt.genSalt(10);
    // เข้ารหัสรหัสผ่านใหม่ที่ได้รับจาก request body
    user.password = await bcrypt.hash(req.body.password, salt);

    // ==================== ล้าง Token ====================
    // ล้าง reset token เพื่อไม่ให้สามารถใช้ token นี้ได้อีก
    user.resetPasswordToken = undefined;
    // ล้างเวลาหมดอายุของ token
    user.resetPasswordExpire = undefined;

    // บันทึกผู้ใช้ที่อัปเดตแล้ว
    await user.save();

    // ส่งการตอบสนองสำเร็จ
    res.json({
      message: "Password reset success",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// ==================== EXPORT Modules ====================

/**
 * ส่งออกฟังก์ชัน Authentication ทั้งหมด
 * เพื่อให้สามารถนำเข้าใช้ในไฟล์ routes ได้
 * 
 * ฟังก์ชันที่ส่งออก:
 * - register: สมัครสมาชิก
 * - login: เข้าสู่ระบบ
 * - forgotPassword: ลืมรหัสผ่าน
 * - resetPassword: รีเซ็ตรหัสผ่าน
 */
module.exports = {
  register,       // ฟังก์ชันสมัครสมาชิก
  login,          // ฟังก์ชันเข้าสู่ระบบ
  forgotPassword, // ฟังก์ชันลืมรหัสผ่าน
  resetPassword,  // ฟังก์ชันรีเซ็ตรหัสผ่าน
};