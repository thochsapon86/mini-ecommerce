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
    default: "pending"
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);