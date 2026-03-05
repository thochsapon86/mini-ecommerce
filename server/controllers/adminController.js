const User = require("../models/User");

// ==========================
// GET ALL USERS
// ==========================
exports.getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");

  res.json(users);
};

// ==========================
// UPDATE USER ROLE
// ==========================
exports.updateUserRole = async (req, res) => {
  const { role } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  user.role = role;
  await user.save();

  res.json({
    message: "Role updated",
  });
};

// ==========================
// DELETE USER
// ==========================
exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);

  res.json({
    message: "User deleted",
  });
};