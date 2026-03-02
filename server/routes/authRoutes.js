// นำเข้า express framework และสร้าง router
const express = require("express");
const router = express.Router(); // แยก route เป็นโมดูลย่อย

// นำเข้า controller functions สำหรับ authentication
const { register, login } = require("../controllers/authController");
const { forgotPassword, resetPassword } = require("../controllers/authController");
// ===============================
// ROUTES (AUTH)
// ===============================

// POST /api/auth/register -> ลงทะเบียนผู้ใช้ใหม่
router.post("/register", register);

// POST /api/auth/login -> ล็อกอินและรับ JWT
router.post("/login", login);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

// ส่ง router ออกไปให้ server.js ติดตั้ง
module.exports = router;