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