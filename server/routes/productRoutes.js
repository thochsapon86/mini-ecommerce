// สร้าง router สำหรับ product endpoints
const express = require("express");
const router = express.Router();

// นำเข้า controller ฟังก์ชันสำหรับจัดการสินค้า
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

// นำเข้า middleware สำหรับการยืนยันตัวตนและบทบาท
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// GET /api/products -> ดูสินค้าทั้งหมด (public)
router.get("/", getAllProducts);

// GET /api/products/:id -> ดูสินค้าตาม id (public)
router.get("/:id", getProductById);

// POST /api/products -> สร้างสินค้า (ต้องเป็น owner หรือ admin)
router.post(
  "/",
  authMiddleware,
  roleMiddleware("owner", "admin"),
  createProduct
);

// PUT /api/products/:id -> แก้ไขสินค้า (owner/admin)
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("owner", "admin"),
  updateProduct
);

// DELETE /api/products/:id -> ลบสินค้า (owner/admin)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("owner", "admin"),
  deleteProduct
);

module.exports = router;