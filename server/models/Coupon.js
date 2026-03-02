const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({

  // โค้ดคูปอง เช่น SALE50
  code: {
    type: String,
    required: true,
    unique: true
  },

  // ส่วนลด (%)
  discountPercent: {
    type: Number,
    required: true
  },

  // วันหมดอายุ
  expiresAt: {
    type: Date,
    required: true
  },

  // ใครสร้าง (owner/admin)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // user ที่กดรับคูปอง
  claimedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("Coupon", couponSchema);