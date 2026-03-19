/**
 * Order model
 * คำอธิบาย: เก็บข้อมูลคำสั่งซื้อ (orders)
 * หลักการทำงานสั้น ๆ:
 * - เก็บ `user`, รายการสินค้า (items), ราคาก่อนลด `totalPrice`, ส่วนลด `discount`, และราคาสุทธิ `finalPrice`
 * - สนับสนุนการเชื่อมโยงกับ `Coupon` (ถ้ามี)
 * - ใช้ timestamps เพื่อติดตามเวลาสร้าง/อัปเดต
 */
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        quantity: Number,
        price: Number
      }
    ],

    totalPrice: Number,      // ราคาก่อนลด
    discount: {              // ส่วนลด
      type: Number,
      default: 0
    },
    finalPrice: Number,      // ราคาหลังลด

    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon"
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
      default: "pending"
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);