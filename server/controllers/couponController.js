const Coupon = require("../models/Coupon");

/**
 * CREATE COUPON
 * owner/admin เท่านั้น
 */
exports.createCoupon = async (req, res) => {
    try {
        const { code, discountPercent, expiresAt } = req.body;

        const coupon = await Coupon.create({
            code,
            discountPercent,
            expiresAt,
            createdBy: req.user.id
        });

        res.json(coupon);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getCoupons = async (req, res) => {
    const coupons = await Coupon.find();
    res.json(coupons);
};
exports.claimCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (!coupon)
            return res.status(404).json({ message: "Coupon not found" });

        // กันรับซ้ำ
        if (coupon.claimedUsers.includes(req.user.id)) {
            return res.json({ message: "Already claimed" });
        }

        coupon.claimedUsers.push(req.user.id);
        await coupon.save();

        res.json({ message: "Coupon claimed" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.applyCoupon = async (code, userId, totalPrice) => {

    const coupon = await Coupon.findOne({ code });

    if (!coupon) throw new Error("Invalid coupon");

    if (new Date() > coupon.expiresAt)
        throw new Error("Coupon expired");

    if (!coupon.claimedUsers.includes(userId))
        throw new Error("Coupon not claimed");

    const discount =
        (totalPrice * coupon.discountPercent) / 100;

    return {
        discount,
        finalPrice: totalPrice - discount
    };
};