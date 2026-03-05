const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ==========================
// GET MY PROFILE
// ==========================
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  res.json(user);
};

// ==========================
// UPDATE PROFILE
// ==========================
exports.updateProfile = async (req, res) => {
  const { name, password } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  if (name) user.name = name;

  if (password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
  }

  await user.save();

  res.json({
    message: "Profile updated successfully",
  });
};