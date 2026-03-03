/**
 * Payment model
 * คำอธิบาย: เก็บข้อมูลการชำระเงินของผู้ใช้
 * หลักการทำงาน:
 * - เก็บ `user`, `amount`, `method`, `status`, และ `transactionId`
 * - `status` แสดงสถานะของการชำระเงิน (pending/paid/failed)
 * - การเปลี่ยนสถานะและการสร้าง transactionId ควบคุมโดย controller
 */
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  method: {
    type: String,
    enum: ["mock", "promptpay", "card"],
    default: "mock"
  },

  status: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending"
  },

  transactionId: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);