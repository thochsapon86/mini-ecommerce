const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["user", "owner", "admin"],
    default: "user",
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date,
},
{ timestamps: true }
);

//
// ⭐⭐⭐ เพิ่มส่วนนี้ ⭐⭐⭐
//

// method สำหรับสร้าง reset password token
userSchema.methods.getResetPasswordToken = function () {

  // สร้าง token random
  const resetToken = crypto.randomBytes(20).toString("hex");

  // hash token ก่อนเก็บใน DB
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // หมดอายุใน 10 นาที
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);