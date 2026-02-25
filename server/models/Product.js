// ดึง mongoose มาใช้งานเพื่อสร้าง Schema
const mongoose = require("mongoose");

// สร้าง schema ของสินค้า
const productSchema = new mongoose.Schema(
  {
    // ชื่อสินค้า
    name: {
      type: String, // ชนิดข้อมูลเป็นข้อความ
      required: true, // ต้องมีค่า ห้ามว่าง
    },

    // รายละเอียดสินค้า
    description: {
      type: String,
      required: true,
    },

    // ราคาสินค้า
    price: {
      type: Number, // ต้องเป็นตัวเลข
      required: true,
    },

    // จำนวนสินค้าในสต็อก
    stock: {
      type: Number,
      required: true,
      default: 0, // ถ้าไม่ใส่ค่า ให้เริ่มต้นที่ 0
    },

    // รูปภาพสินค้า (เก็บเป็น URL หรือ path)
    image: {
      type: String,
    },

    // ใครเป็นคนสร้างสินค้า (owner)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId, // เก็บ id ของ user
      ref: "User", // อ้างอิงไปที่ model User
    },
  },
  {
    timestamps: true, // เพิ่ม createdAt และ updatedAt อัตโนมัติ
  }
);

// export model ออกไปใช้งาน
module.exports = mongoose.model("Product", productSchema);