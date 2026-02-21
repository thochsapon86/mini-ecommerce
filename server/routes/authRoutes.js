// นำเข้า express framework
const express = require("express");

// สร้าง router object
// Router ใช้แยก route ออกเป็น module ย่อย
const router = express.Router();


// ดึงฟังก์ชัน register จาก authController
const { register } = require("../controllers/authController");

// ดึงฟังก์ชัน login จาก authController
const { login } = require("../controllers/authController");


// ===============================
// ROUTES
// ===============================

// เมื่อมีการส่ง POST request มาที่ /register
// จะเรียกใช้ฟังก์ชัน register ใน controller
router.post("/register", register);

// เมื่อมีการส่ง POST request มาที่ /login
// จะเรียกใช้ฟังก์ชัน login ใน controller
router.post("/login", login);


// export router ออกไปให้ server.js ใช้งาน
module.exports = router;