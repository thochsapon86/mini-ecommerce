const Payment = require("../models/Payment");

/**
 * สร้าง payment
 */
exports.createPayment = async (req, res) => {
  try {
    const { amount } = req.body;

    const payment = await Payment.create({
      user: req.user.id,
      amount,
      status: "pending"
    });

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * จำลองการจ่ายเงิน (Mock)
 */
exports.pay = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment)
      return res.status(404).json({ message: "Payment not found" });

    payment.status = "paid";
    payment.transactionId = "TXN_" + Date.now();

    await payment.save();

    res.json({
      message: "Payment success",
      payment
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * ดู payment ของ user
 */
exports.myPayments = async (req, res) => {
  const payments = await Payment.find({
    user: req.user.id
  });

  res.json(payments);
};