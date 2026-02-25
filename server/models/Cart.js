// ดึง mongoose มาใช้สร้าง Schema
const mongoose = require("mongoose");

// สร้าง schema ของตะกร้า
const cartSchema = new mongoose.Schema(
  {
    // เก็บ id ของ user เจ้าของ cart
    user: {
      type: mongoose.Schema.Types.ObjectId, // เก็บ ObjectId
      ref: "User", // อ้างอิงไปที่ model User
      required: true, // ต้องมีค่า
    },

    // เก็บรายการสินค้าในตะกร้า
    items: [
      {
        // สินค้า
        product: {
          type: mongoose.Schema.Types.ObjectId, // id ของสินค้า
          ref: "Product", // อ้างอิง Product model
          required: true,
        },

        // จำนวนสินค้า
        quantity: {
          type: Number,
          required: true,
          default: 1, // ถ้าไม่กำหนดให้เป็น 1
        },
      },
    ],
  },
  {
    timestamps: true, // เพิ่ม createdAt และ updatedAt อัตโนมัติ
  }
);

// export model ออกไปใช้
module.exports = mongoose.model("Cart", cartSchema);