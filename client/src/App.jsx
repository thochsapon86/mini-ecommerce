/**
 * MINI ECOMMERCE - Frontend Main Application
 * 
 * ===== WORKFLOW (ขั้นตอนการทำงาน) =====
 * 1. User ยังไม่เข้าสู่ระบบ → แสดงหน้า Login/Register/Forgot Password
 * 2. User เข้าสู่ระบบสำเร็จ → บันทึก Token ใน LocalStorage และ Context
 * 3. Decode JWT Token → ดึงข้อมูล user (name, email, role)
 * 4. ตรวจสอบ Role (user/owner/admin) → แสดง/ซ่อน features ที่เหมาะสม
 * 5. Navigation → เปลี่ยนหน้า (Products/Cart/Orders/Payments/Coupons/Profile/Admin)
 * 6. Products → ค้นหา, เพิ่มลงตะกร้า, Admin: สร้าง/แก้ไข/ลบสินค้า
 * 7. Cart → ดู/ลบสินค้า, คำนวณยอดรวม, ไปหน้า Checkout
 * 8. Orders → ใช้Coupon code, ยืนยันการสั่งซื้อ
 * 9. Payments → สร้าง Payment, ชำระเงิน, เห็นประวัติ
 * 10. Coupons → ดู/รับคูปอง, Admin: สร้างคูปอง
 * 11. Profile → ดูข้อมูล, แก้ไขชื่อ/รหัสผ่าน
 * 12. Admin → จัดการผู้ใช้, เปลี่ยน Role
 */

import { useState, useEffect, createContext, useContext } from "react";

// ===== CONSTANTS (ค่าคงที่) =====
const API = "http://localhost:5000/api"; // Backend API URL

// ═══════════════════════════════════════════════════════════════════
// ═════════════ AUTH CONTEXT SECTION (การจัดการการตรวจสอบตัวตน) =====
// ═══════════════════════════════════════════════════════════════════

/**
 * AuthContext - Context สำหรับเก็บข้อมูลการตรวจสอบตัวตน
 * - token: JWT token จากการเข้าสู่ระบบ
 * - user: ข้อมูล user ที่ decode จาก token
 * - login(): บันทึก token และอัปเดต state
 * - logout(): ลบ token และ logout
 */
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

/**
 * AuthProvider - Component ที่ครอบ App เพื่อให้ทั้งแอป access ข้อมูลการตรวจสอบตัวตน
 * 
 * Workflow:
 * 1. เมื่อ load ครั้งแรก → อ่าน token จาก LocalStorage
 * 2. ถ้ามี token → decode เพื่อหา user info
 * 3. ถ้าไม่มี token → user = null (ยังไม่เข้าสู่ระบบ)
 */
function AuthProvider({ children }) {
  // เก็บ JWT token ที่ get จาก localStorage ตั้งแต่เริ่มต้น
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  
  // เก็บข้อมูล user ที่ decode จาก token
  const [user, setUser] = useState(null);

  /**
   * decodeToken() - ถอดรหัส JWT token
   * JWT Format: header.payload.signature
   * payload = Base64(JSON user data)
   * 
   * @param {string} t - JWT token
   * @returns {object} user data หรือ null ถ้า error
   */
  const decodeToken = (t) => {
    try {
      // Split token เป็น 3 ส่วน, เอาส่วน payload (index 1)
      // atob() = decode Base64 → JSON string
      // JSON.parse() = แปลง JSON string เป็น object
      return JSON.parse(atob(t.split(".")[1]));
    } catch {
      return null; // Token invalid
    }
  };

  /**
   * useEffect - เมื่อ token เปลี่ยน → decode ใหม่เพื่อ update user
   * Dependencies: [token]
   */
  useEffect(() => {
    if (token) setUser(decodeToken(token)); // มี token → decode
    else setUser(null); // ไม่มี token → clear user
  }, [token]);

  /**
   * login() - บันทึก token และอัปเดต state
   * @param {string} t - JWT token จากการเข้าสู่ระบบ
   */
  const login = (t) => {
    localStorage.setItem("token", t); // เก็บ token ใน LocalStorage
    setToken(t); // อัปเดต state → trigger useEffect
  };

  /**
   * logout() - ลบ token และออกจากระบบ
   */
  const logout = () => {
    localStorage.removeItem("token"); // ลบ token จาก LocalStorage
    setToken(null); // อัปเดต state → clear user
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ══════════ API HELPER SECTION (ส่วนช่วยเหลือ API) ==================
// ═══════════════════════════════════════════════════════════════════

/**
 * apiFetch() - ฟังก์ชันช่วยส่ง HTTP request ไป Backend พร้อม JWT Token
 * 
 * Workflow:
 * 1. สร้าง headers พร้อม Content-Type
 * 2. ถ้ามี token → เพิ่ม Authorization header
 * 3. ส่ง fetch request ไป Backend
 * 4. แปลง response เป็น JSON
 * 5. ถ้า error → throw error message
 * 6. ถ้าสำเร็จ → return data
 * 
 * @param {string} path - API endpoint (e.g., "/products")
 * @param {object} options - fetch options (method, body, etc.)
 * @param {string} token - JWT token
 * @returns {object} API response data
 */
async function apiFetch(path, options = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  
  // ถ้ามี token → เพิ่ม Authorization header
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  // ส่ง fetch request
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  
  // ถ้า response ไม่ OK → throw error
  if (!res.ok) throw new Error(data.message || "Error");
  
  return data;
}

// ═══════════════════════════════════════════════════════════════════
// ════════════ TOAST SECTION (ข้อความแจ้งเตือน) ====================
// ═══════════════════════════════════════════════════════════════════

/**
 * Toast - ข้อความแจ้งเตือนชั่วคราวที่แสดงด้านขวาบน
 * ตัวอย่าง: "เพิ่มลงตะกร้าสำเร็จ!" (green), "Error!" (red)
 */
let toastCounter = 0;

/**
 * useToast() - Custom hook สำหรับจัดการ toast notifications
 * 
 * Workflow:
 * 1. add() → เพิ่ม toast ใหม่ พร้อม ID และ type
 * 2. setTimeout → ลบ toast หลังจาก 3.5 วินาที
 * 3. remove() → ลบ toast ด้วยตนเอง (click)
 * 
 * @returns {object} { toasts, remove, success, error, info }
 */
function useToast() {
  const [toasts, setToasts] = useState([]);
  
  /**
   * add() - เพิ่ม toast notification
   * @param {string} message - ข้อความแจ้งเตือน
   * @param {string} type - "success", "error", or "info"
   */
  const add = (message, type = "info") => {
    const id = ++toastCounter; // สร้าง ID ไม่ซ้ำกัน
    setToasts((p) => [...p, { id, message, type }]);
    
    // ลบ toast เอง หลังจาก 3.5 วินาที
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };
  
  /**
   * remove() - ลบ toast ทันที
   * @param {number} id - Toast ID
   */
  const remove = (id) => setToasts((p) => p.filter((t) => t.id !== id));
  
  return {
    toasts,
    remove,
    success: (m) => add(m, "success"),
    error: (m) => add(m, "error"),
    info: (m) => add(m, "info"),
  };
}

/**
 * ToastContainer - Component แสดง toast notifications
 * ตำแหน่ง: fixed ด้านขวาบน (top-5 right-5)
 * 
 * @param {array} toasts - Array of toast objects
 * @param {function} remove - Function ลบ toast
 */
function ToastContainer({ toasts, remove }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)} // Click ลบ
          className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl cursor-pointer text-sm font-semibold transition-all
            // เลือกสี filter ตาม type
            ${t.type === "error" ? "bg-red-600 text-white" : t.type === "success" ? "bg-emerald-500 text-white" : "bg-gray-800 text-white"}`}
          style={{ animation: "slideIn 0.3s ease", minWidth: 260 }}
        >
          {/* Icon ตาม type */}
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "•"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ═════════════ MODAL SECTION (หน้าต่างป๊อปอัป) =====================
// ═══════════════════════════════════════════════════════════════════

/**
 * Modal - Generic modal component สำหรับฟอร์มต่างๆ
 * (เพิ่มสินค้า, แก้ไขสินค้า, สร้างคูปอง, เปลี่ยน Role, ฯลฯ)
 * 
 * @param {boolean} open - แสดง modal หรือไม่
 * @param {function} onClose - Callback เมื่อปิด modal
 * @param {string} title - หัวข้อ modal
 * @param {JSX} children - เนื้อหา modal
 */
function Modal({ open, onClose, title, children }) {
  if (!open) return null; // ถ้า open=false → ไม่แสดง
  
  return (
    // Background overlay - click เพื่อปิด
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      {/* Modal dialog - stopPropagation เพื่อไม่ให้ปิดเมื่อ click ข้างใน */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "popIn 0.25s ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
          {/* ปุ่มปิด X */}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-lg font-bold">✕</button>
        </div>
        {/* Body */}
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ══════ PRODUCT DETAIL MODAL SECTION (Modal แสดงรายละเอียดสินค้า) =====
// ═══════════════════════════════════════════════════════════════════

/**
 * ProductModal - Modal ที่ click รูปหรือชื่อสินค้า เพื่อดูรายละเอียด
 * 
 * UI:
 * - รูปสินค้า (ด้านบน)
 * - ชื่อ, ราคา, จำนวนสต็อก (กลาง)
 * - ปุ่ม "เพิ่มลงตะกร้า" และ "ปิด" (ล่าง)
 * 
 * @param {object} product - สินค้า object
 * @param {function} onClose - Callback ปิด modal
 * @param {function} onAddCart - Callback เพิ่มลงตะกร้า
 */
function ProductModal({ product, onClose, onAddCart }) {
  if (!product) return null; // ถ้าไม่มี product → ไม่แสดง
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "popIn 0.25s ease" }}
      >
        {/* ═══════ SECTION: รูปสินค้า ═══════ */}
        <div className="relative h-72 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
          {/* แสดงรูป หรือ emoji ถ้าไม่มี */}
          {product.image
            ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            : <span className="text-9xl opacity-20">🖥️</span>
          }
          
          {/* Overlay: หมดสต็อก */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="bg-red-100 text-red-600 font-black text-lg px-5 py-2 rounded-full">หมดสต็อก</span>
            </div>
          )}
          
          {/* Badge: เหลือน้อย */}
          {product.stock > 0 && product.stock <= 5 && (
            <div className="absolute top-4 left-4">
              <span className="bg-orange-100 text-orange-600 font-bold text-sm px-3 py-1 rounded-full">เหลือน้อย!</span>
            </div>
          )}
          
          {/* ปุ่มปิด X */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-500 hover:text-gray-800 font-bold text-lg transition-colors"
          >✕</button>
        </div>

        {/* ═══════ SECTION: เนื้อหา ═══════ */}
        <div className="p-8">
          {/* ชื่อ + สต็อก status */}
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-2xl font-black text-gray-900 leading-tight flex-1 mr-4">{product.name}</h2>
            {/* Badge สต็อก */}
            <span className={`flex-shrink-0 text-xs font-black px-3 py-1.5 rounded-full
              ${product.stock > 5 ? "bg-green-100 text-green-700" : product.stock > 0 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-600"}`}>
              {product.stock > 0 ? `เหลือ ${product.stock} ชิ้น` : "หมดสต็อก"}
            </span>
          </div>

          {/* รายละเอียด */}
          <p className="text-gray-500 text-sm leading-relaxed mb-6 min-h-12">
            {product.description || "ไม่มีคำอธิบาย"}
          </p>

          {/* ═══ Grid: ราคา + สต็อก ═══ */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-semibold mb-1">ราคา</p>
              <p className="text-2xl font-black text-red-600">฿{product.price?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-semibold mb-1">สต็อกคงเหลือ</p>
              <p className="text-2xl font-black text-gray-900">{product.stock} ชิ้น</p>
            </div>
          </div>

          {/* ═══ ปุ่ม: เพิ่มตะกร้า + ปิด ═══ */}
          <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
            <button
              onClick={() => { onAddCart(product._id); onClose(); }} // เพิ่มตะกร้า แล้วปิด
              disabled={product.stock === 0}
              className="flex-1 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black rounded-2xl text-base transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
            >
              <span>🛒</span> เพิ่มลงตะกร้า
            </button>
            <button
              onClick={onClose}
              className="px-6 py-4 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl text-base hover:bg-gray-50 transition-all"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ═════════ UI COMPONENT SECTION (ส่วนประกอบ UI พื้นฐาน) ===========
// ═══════════════════════════════════════════════════════════════════

/**
 * LoadingSpinner - Animated spinner เมื่อ loading data
 * ใช้ใน: ProductsPage, CartPage, PaymentsPage, CouponsPage, ProfilePage, AdminPage
 */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
    </div>
  );
}

/**
 * Input - Reusable input field component พร้อม label
 * 
 * @param {string} label - ข้อความ label
 * @param {object} ...props - other HTML input attributes
 */
function Input({ label, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">{label}</label>}
      <input
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 outline-none text-sm text-gray-800 font-medium transition-colors bg-gray-50 focus:bg-white placeholder-gray-400"
        {...props}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ═══════════════ NAVIGATION SECTION (เมนูหลัก) ====================
// ═══════════════════════════════════════════════════════════════════

/**
 * Nav - Navigation bar ด้านบน (sticky)
 * 
 * UI Layout:
 * - Logo (ซ้าย)
 * - Menu items (กลาง): Products, Cart, Orders, Payments, Coupons, Profile, Admin
 * - Role + Logout (ขวา)
 * - Mobile hamburger menu
 * 
 * Workflow:
 * 1. ดึง page state เพื่อ highlight active page
 * 2. ตรวจสอบ user role → แสดง Admin menu ถ้า role=admin
 * 3. แสดง cart count badge
 * 4. Mobile responsive: ซ่อน menu, แสดง hamburger
 * 
 * @param {string} page - หน้าปัจจุบัน
 * @param {function} setPage - Function เปลี่ยนหน้า
 * @param {number} cartCount - จำนวนสินค้าในตะกร้า
 */
function Nav({ page, setPage, cartCount }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false); // Toggle mobile menu
  
  // ข้อมูล menu items
  const navItems = [
    { key: "products", label: "สินค้า", icon: "🖥️" },
    { key: "cart", label: "ตะกร้า", icon: "🛒", badge: cartCount },
    { key: "orders", label: "คำสั่งซื้อ", icon: "📦" },
    { key: "payments", label: "ชำระเงิน", icon: "💳" },
    { key: "coupons", label: "คูปอง", icon: "🎫" },
    { key: "profile", label: "โปรไฟล์", icon: "👤" },
    // แสดง Admin menu เฉพาะ admin user
    ...(user?.role === "admin" ? [{ key: "admin", label: "Admin", icon: "⚙️" }] : []),
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white border-b-2 border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* ═══ Logo ═══ */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage("products")}>
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-lg font-black">T</span>
            </div>
            <div>
              <span className="text-gray-900 font-black text-lg tracking-tight">TECH</span>
              <span className="text-red-600 font-black text-lg tracking-tight">ZONE</span>
            </div>
          </div>

          {/* ═══ Desktop Menu (ซ่อนใน mobile) ═══ */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                  // highlight active page
                  ${page === item.key ? "bg-red-600 text-white shadow-md shadow-red-200" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                
                {/* ═ Cart Badge ═ */}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-white">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ═══ Right Side (Role + Logout) ═══ */}
          <div className="hidden md:flex items-center gap-3">
            <p className="text-xs font-black text-gray-900">{user?.role?.toUpperCase()}</p>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg text-sm font-bold border-2 border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all"
            >ออกจากระบบ</button>
          </div>

          {/* ═══ Mobile Hamburger Button ═══ */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
            <div className="w-5 h-0.5 bg-gray-700 mb-1" />
            <div className="w-5 h-0.5 bg-gray-700 mb-1" />
            <div className="w-5 h-0.5 bg-gray-700" />
          </button>
        </div>
      </div>

      {/* ═══ Mobile Menu (ซ่อนตอน desktop) ═══ */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <button key={item.key} onClick={() => { setPage(item.key); setMobileOpen(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-left transition-all
                ${page === item.key ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {item.icon} {item.label}
              {/* Cart badge ใน mobile */}
              {item.badge > 0 && <span className="ml-auto bg-white text-red-600 text-xs font-black px-1.5 py-0.5 rounded-full">{item.badge}</span>}
            </button>
          ))}
          {/* Logout button ใน mobile */}
          <button onClick={logout} className="mt-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 border-2 border-red-100 hover:bg-red-50 transition-all">ออกจากระบบ</button>
        </div>
      )}
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ════════════ AUTH PAGES SECTION (หน้า Login/Register/Forgot) ======
// ═══════════════════════════════════════════════════════════════════

/**
 * AuthLayout - Layout ร่วมสำหรับหน้า Login, Register, Forgot Password
 * 
 * UI:
 * - Background gradient สีแดง
 * - Logo + heading กลางหน้า
 * - White box เนื้อหา
 * 
 * @param {JSX} children - เนื้อหา (form)
 * @param {string} title - หัวข้อ
 * @param {string} subtitle - คำอธิบายเพิ่มเติม
 */
function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center px-4">
      {/* ═══ Decorative Elements ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-50 rounded-full opacity-60 blur-3xl" />
      </div>

      {/* ═══ Card ═══ */}
      <div className="relative w-full max-w-md" style={{ animation: "popIn 0.3s ease" }}>
        {/* ═ Header ═ */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl shadow-xl shadow-red-200 mb-4">
            <span className="text-white text-3xl font-black">T</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">TECH<span className="text-red-600">ZONE</span></h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">{subtitle}</p>
        </div>

        {/* ═ Form Box ═ */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 border border-gray-100 p-8">
          <h2 className="text-2xl font-black text-gray-900 mb-6">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * LoginPage - หน้าเข้าสู่ระบบ
 * 
 * Workflow:
 * 1. User input email + password
 * 2. Click "เข้าสู่ระบบ"
 * 3. ส่ง POST /auth/login ไป Backend
 * 4. Backend return token
 * 5. เก็บ token ใน Context → redirect ไปหน้า Products
 * 6. ถ้า error → แสดง toast แดง
 * 
 * @param {function} setPage - Function เปลี่ยนหน้า
 * @param {object} toast - Toast notification object
 */
function LoginPage({ setPage, toast }) {
  const { login } = useAuth(); // ดึง login() จาก Auth Context
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      // ส่ง POST request ไป Backend /auth/login
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      
      // บันทึก token ใน localStorage + Context
      login(data.token);
      
      // แสดง toast success
      toast.success("เข้าสู่ระบบสำเร็จ!");
      // จะ redirect อัตโนมัติ เพราะ token มีค่า
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="เข้าสู่ระบบ" subtitle="ร้านค้าอุปกรณ์คอมพิวเตอร์ครบวงจร">
      {/* ═══ Email Input ═══ */}
      <Input
        label="อีเมล"
        type="email"
        value={form.email}
        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        placeholder="you@example.com"
      />
      
      {/* ═══ Password Input ═══ */}
      <Input
        label="รหัสผ่าน"
        type="password"
        value={form.password}
        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
        placeholder="••••••••"
      />
      
      {/* ═══ Submit Button ═══ */}
      <button
        onClick={submit}
        disabled={loading}
        className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all text-sm disabled:opacity-60 mt-2"
      >
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ →"}
      </button>
      
      {/* ═══ Links ═══ */}
      <div className="mt-5 flex items-center justify-between text-sm">
        <button onClick={() => setPage("register")} className="text-red-600 font-bold hover:underline">สมัครสมาชิก</button>
        <button onClick={() => setPage("forgot")} className="text-gray-400 hover:text-gray-600 font-medium">ลืมรหัสผ่าน?</button>
      </div>
    </AuthLayout>
  );
}

/**
 * RegisterPage - หน้าสมัครสมาชิก
 * 
 * Workflow:
 * 1. User input name + email + password
 * 2. Click "สมัครสมาชิก"
 * 3. ส่ง POST /auth/register ไป Backend
 * 4. Backend สร้าง user ใหม่
 * 5. Redirect ไปหน้า Login
 * 
 * @param {function} setPage - Function เปลี่ยนหน้า
 * @param {object} toast - Toast notification object
 */
function RegisterPage({ setPage, toast }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      // ส่ง POST request ไป Backend /auth/register
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      
      toast.success("สมัครสำเร็จ! กรุณาเข้าสู่ระบบ");
      setPage("login"); // Redirect ไป Login
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="สมัครสมาชิก" subtitle="สร้างบัญชีเพื่อเริ่มช้อปปิ้ง">
      <Input
        label="ชื่อ"
        type="text"
        value={form.name}
        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        placeholder="ชื่อของคุณ"
      />
      <Input
        label="อีเมล"
        type="email"
        value={form.email}
        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        placeholder="you@example.com"
      />
      <Input
        label="รหัสผ่าน"
        type="password"
        value={form.password}
        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
        placeholder="••••••••"
      />
      <button
        onClick={submit}
        disabled={loading}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all text-sm disabled:opacity-60 mt-2"
      >
        {loading ? "กำลังสมัคร..." : "สมัครสมาชิก →"}
      </button>
      <div className="mt-4 text-center text-sm">
        <button onClick={() => setPage("login")} className="text-red-600 font-bold hover:underline">มีบัญชีแล้ว? เข้าสู่ระบบ</button>
      </div>
    </AuthLayout>
  );
}

/**
 * ForgotPage - หน้าลืมรหัสผ่าน
 * 
 * Workflow:
 * 1. User input email
 * 2. ส่ง POST request /auth/forgot-password
 * 3. Backend ส่ง reset link ไป email (ดูใน Console)
 * 
 * @param {function} setPage - Function เปลี่ยนหน้า
 * @param {object} toast - Toast notification object
 */
function ForgotPage({ setPage, toast }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      toast.success("ส่งลิงก์รีเซ็ตแล้ว (ดูใน Console)");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="ลืมรหัสผ่าน" subtitle="กรอกอีเมลเพื่อรับลิงก์รีเซ็ต">
      <Input
        label="อีเมล"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <button
        onClick={submit}
        disabled={loading}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all text-sm disabled:opacity-60 mt-2"
      >
        {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ต →"}
      </button>
      <div className="mt-4 text-center text-sm">
        <button onClick={() => setPage("login")} className="text-gray-400 hover:text-gray-600 font-medium">← กลับไปหน้าเข้าสู่ระบบ</button>
      </div>
    </AuthLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ═════════ PRODUCT CARD SECTION (card แสดงสินค้า) ==================
// ═══════════════════════════════════════════════════════════════════

/**
 * ProductCard - Card component แสดงข้อมูลสินค้า ในตาราง
 * 
 * UI:
 * - รูป (ด้านบน)
 * - ชื่อ + ราคา + สต็อก (กลาง)
 * - ปุ่มเพิ่มตะกร้า, แก้ไข, ลบ (ล่าง)
 * 
 * Workflow:
 * 1. Hover → เพิ่ม shadow + border, เลื่อนขึ้น
 * 2. Click รูป/ชื่อ → เปิด ProductModal
 * 3. Click ปุ่มเพิ่ม → เรียก onAddCart()
 * 4. Click ปุ่มแก้ไข (admin) → เรียก onEdit()
 * 5. Click ปุ่มลบ (admin) → เรียก onDelete()
 * 
 * @param {object} p - Product object
 * @param {function} onAddCart - Callback เพิ่มตะกร้า
 * @param {function} onEdit - Callback แก้ไขสินค้า
 * @param {function} onDelete - Callback ลบสินค้า
 * @param {boolean} canManage - สิทธิ์ admin
 * @param {function} onClick - Callback เปิด detail modal
 */
function ProductCard({ p, onAddCart, onEdit, onDelete, canManage, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick} // เปิด Product Detail Modal
      className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden cursor-pointer
        // hover effect
        ${hover ? "border-red-300 shadow-xl shadow-red-100 -translate-y-1" : "border-gray-100 shadow-sm"}`}
    >
      {/* ═══ Image Section ═══ */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        {p.image
          ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
          : <span className="text-6xl opacity-20">🖥️</span>
        }
        
        {/* Badge: หมดสต็อก */}
        {p.stock === 0 && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="bg-red-100 text-red-600 font-black text-sm px-3 py-1 rounded-full">หมดสต็อก</span>
          </div>
        )}
        
        {/* Badge: เหลือน้อย */}
        {p.stock > 0 && p.stock <= 5 && (
          <div className="absolute top-3 right-3">
            <span className="bg-orange-100 text-orange-600 font-bold text-xs px-2 py-1 rounded-full">เหลือน้อย</span>
          </div>
        )}
      </div>

      {/* ═══ Content Section ═══ */}
      <div className="p-5">
        {/* ชื่อสินค้า */}
        <h3 className="font-black text-gray-900 text-base mb-1 truncate">{p.name}</h3>
        
        {/* รายละเอียด */}
        <p className="text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">{p.description || "ไม่มีคำอธิบาย"}</p>

        {/* ราคา + สต็อก */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-black text-red-600">฿{p.price?.toLocaleString()}</span>
          <span className={`text-xs font-bold px-2 py-1 rounded-full
            ${p.stock > 5 ? "bg-green-100 text-green-600" : p.stock > 0 ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"}`}>
            {p.stock > 0 ? `${p.stock} ชิ้น` : "หมด"}
          </span>
        </div>

        {/* ปุ่ม */}
        <div className="flex gap-2">
          {/* ปุ่มเพิ่มตะกร้า */}
          <button
            onClick={(e) => { e.stopPropagation(); onAddCart(p._id); }} // stopPropagation เพื่อไม่เปิด modal
            disabled={p.stock === 0}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-red-200 flex items-center justify-center gap-1.5"
          >
            <span>🛒</span> เพิ่มลงตะกร้า
          </button>
          
          {/* ปุ่มแก้ไข (admin only) */}
          {canManage && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(p); }}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 transition-colors">✏️</button>
          )}
          
          {/* ปุ่มลบ (admin only) */}
          {canManage && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(p._id); }}
              className="w-10 h-10 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center text-red-500 transition-colors">🗑️</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ════════ PRODUCTS PAGE SECTION (หน้าแสดงสินค้า) ==================
// ═══════════════════════════════════════════════════════════════════

/**
 * ProductsPage - หน้าหลัก ที่แสดงรายการสินค้า
 * 
 * Workflow:
 * 1. Load → ดึงข้อมูลสินค้าจาก API GET /products
 * 2. แสดง product grid พร้อม loading spinner
 * 3. Search → filter products ตาม name/description
 * 4. Click สินค้า → เปิด ProductModal
 * 5. Click "เพิ่มลงตะกร้า" → POST /cart/add, อัปเดต cartCount
 * 6. Admin: สร้าง/แก้ไข/ลบสินค้า
 * 
 * @param {object} toast - Toast notification object
 * @param {function} setCartCount - Function update cart count
 */
function ProductsPage({ toast, setCartCount }) {
  const { token, user } = useAuth();
  const [products, setProducts] = useState([]); // รายการสินค้า
  const [loading, setLoading] = useState(true); // loading state
  const [showModal, setShowModal] = useState(false); // modal add/edit
  const [editProduct, setEditProduct] = useState(null); // สินค้าที่แก้ไข (null = add new)
  const [selectedProduct, setSelectedProduct] = useState(null); // สินค้าที่เลือก (สำหรับ detail modal)
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", image: "" }); // form data
  const [search, setSearch] = useState(""); // search input

  const canManage = user?.role === "admin" || user?.role === "owner"; // ตรวจสอบสิทธิ์ admin

  /**
   * useEffect - Load products เมื่อ component mount
   */
  useEffect(() => { load(); }, []);

  /**
   * load() - ดึงข้อมูลสินค้าจาก Backend
   */
  const load = async () => {
    try {
      const d = await apiFetch("/products");
      setProducts(d);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * openAdd() - เตรียมฟอร์ม สำหรับเพิ่มสินค้า
   * - ล้าง form
   * - ตั้ง editProduct = null (ส่วนเพิ่ม ไม่ใช่แก้ไข)
   */
  const openAdd = () => {
    setForm({ name: "", description: "", price: "", stock: "", image: "" });
    setEditProduct(null);
    setShowModal(true);
  };

  /**
   * openEdit() - เตรียมฟอร์ม สำหรับแก้ไขสินค้า
   * @param {object} p - Product object
   */
  const openEdit = (p) => {
    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      stock: p.stock,
      image: p.image || "",
    });
    setEditProduct(p); // ตั้ง editProduct (เพื่อบ่งบอกว่าแก้ไข ไม่ใช่เพิ่ม)
    setShowModal(true);
  };

  /**
   * save() - บันทึก product (เพิ่ม หรือ แก้ไข)
   * 
   * Logic:
   * - ถ้า editProduct มีค่า → PUT (แก้ไข)
   * - ถ้า editProduct = null → POST (เพิ่ม)
   */
  const save = async () => {
    try {
      if (editProduct) {
        // แก้ไขสินค้า
        await apiFetch(`/products/${editProduct._id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        }, token);
      } else {
        // เพิ่มสินค้า
        await apiFetch("/products", {
          method: "POST",
          body: JSON.stringify(form),
        }, token);
      }
      toast.success(editProduct ? "อัปเดตสำเร็จ!" : "เพิ่มสินค้าสำเร็จ!");
      setShowModal(false);
      load(); // refresh products list
    } catch (e) {
      toast.error(e.message);
    }
  };

  /**
   * del() - ลบสินค้า
   * @param {string} id - Product ID
   */
  const del = async (id) => {
    if (!confirm("ต้องการลบสินค้านี้?")) return;
    try {
      await apiFetch(`/products/${id}`, { method: "DELETE" }, token);
      toast.success("ลบสำเร็จ");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  /**
   * addToCart() - เพิ่มสินค้าลงตะกร้า
   * 
   * Workflow:
   * 1. ส่ง POST /cart/add พร้อม productId + quantity
   * 2. ดึง /cart ใหม่ เพื่อ update cartCount
   * 3. Refresh products เพื่ออัปเดต stock
   * 
   * @param {string} productId - Product ID
   */
  const addToCart = async (productId) => {
    try {
      await apiFetch("/cart/add", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      }, token);
      toast.success("เพิ่มลงตะกร้าแล้ว! 🛒");
      
      // อัปเดต cartCount จากการดึง /cart
      const cart = await apiFetch("/cart", {}, token);
      setCartCount(cart?.items?.length || 0);
      
      // Refresh stock
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  /**
   * filtered - ฟิลเตอร์สินค้า ตามคำค้นหา
   */
  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  // ═══ Loading State ═══
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 bg-gray-100 rounded-xl w-48 mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ═══ Main Content ═══
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* ═══ Hero Banner ═══ */}
      <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-rose-500 rounded-3xl p-8 mb-8 overflow-hidden shadow-2xl shadow-red-200">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 text-9xl">🖥️</div>
          <div className="absolute bottom-4 right-48 text-7xl">⌨️</div>
        </div>
        <div className="relative">
          <p className="text-red-200 text-sm font-bold uppercase tracking-widest mb-2">TECHZONE STORE</p>
          <h1 className="text-white text-4xl font-black mb-2 tracking-tight">อุปกรณ์คอมพิวเตอร์<br />ครบวงจร</h1>
          <p className="text-red-100 text-sm font-medium">CPU · GPU · RAM · SSD · Monitor · Peripherals</p>
        </div>
      </div>

      {/* ═══ Search + Add Button ═══ */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search Box */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm font-medium bg-white"
            placeholder="ค้นหาสินค้า... (CPU, GPU, RAM, ...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {/* Count */}
        <div className="flex items-center text-sm text-gray-400 font-medium">
          <span>{filtered.length} รายการ</span>
        </div>
        
        {/* Add Button (admin only) */}
        {canManage && (
          <button onClick={openAdd}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-200 flex items-center gap-2">
            + เพิ่มสินค้า
          </button>
        )}
      </div>

      {/* ═══ Product Grid ═══ */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-6xl mb-4">🔍</div>
          <p className="font-semibold text-lg">ไม่พบสินค้าที่ค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <ProductCard
              key={p._id}
              p={p}
              onAddCart={addToCart}
              onEdit={openEdit}
              onDelete={del}
              canManage={canManage}
              onClick={() => setSelectedProduct(p)} // เปิด detail modal
            />
          ))}
        </div>
      )}

      {/* ═══ Product Detail Modal ═══ */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddCart={addToCart}
      />

      {/* ═══ Add/Edit Product Modal ═══ */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
      >
        <Input
          label="ชื่อสินค้า"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="เช่น Intel Core i9-14900K"
        />
        <Input
          label="รายละเอียด"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="รายละเอียดสินค้า..."
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="ราคา (฿)"
            type="number"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            placeholder="0"
          />
          <Input
            label="จำนวนสต็อก"
            type="number"
            value={form.stock}
            onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
            placeholder="0"
          />
        </div>
        <Input
          label="URL รูปภาพ"
          value={form.image}
          onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
          placeholder="https://..."
        />
        <div className="flex gap-3 mt-2">
          <button
            onClick={save}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all"
          >
            {editProduct ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มสินค้า"}
          </button>
          <button
            onClick={() => setShowModal(false)}
            className="px-5 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50"
          >
            ยกเลิก
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ════════════ CART PAGE SECTION (หน้าตะกร้า) =======================
// ═══════════════════════════════════════════════════════════════════

/**
 * CartPage - หน้าแสดงตะกร้าสินค้า
 * 
 * Workflow:
 * 1. Load → GET /cart เพื่อดึงไอเทมในตะกร้า
 * 2. แสดงรายการสินค้า พร้อมราคา, จำนวน, ยอดรวม
 * 3. Click "ลบออก" → POST /cart/remove
 * 4. Click "ล้างตะกร้า" → POST /cart/clear
 * 5. Click "ดำเนินการสั่งซื้อ" → ไปหน้า Orders (checkout)
 * 
 * @param {function} setPage - Function เปลี่ยนหน้า
 * @param {function} setCartCount - Function update cart count
 * @param {object} toast - Toast notification object
 */
function CartPage({ setPage, setCartCount, toast }) {
  const { token } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await apiFetch("/cart", {}, token);
      setCart(d);
      setCartCount(d?.items?.length || 0);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (productId) => {
    try {
      await apiFetch("/cart/remove", {
        method: "POST",
        body: JSON.stringify({ productId }),
      }, token);
      toast.success("ลบออกแล้ว");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const clear = async () => {
    if (!confirm("ล้างตะกร้าทั้งหมด?")) return;
    try {
      await apiFetch("/cart/clear", { method: "POST" }, token);
      toast.success("ล้างตะกร้าแล้ว");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  const items = cart?.items || [];
  const total = items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">ตะกร้าสินค้า</h1>
          <p className="text-gray-400 text-sm mt-1">{items.length} รายการ</p>
        </div>
        {items.length > 0 && (
          <button onClick={clear} className="text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-all">ล้างตะกร้า</button>
        )}
      </div>

      {/* ═══ Empty State ═══ */}
      {items.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-8xl mb-6">🛒</div>
          <p className="text-gray-400 text-lg font-semibold mb-6">ตะกร้าว่างเปล่า</p>
          <button onClick={() => setPage("products")}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all">
            เริ่มช้อปปิ้ง →
          </button>
        </div>
      ) : (
        <>
          {/* ═ Items List ═ */}
          <div className="flex flex-col gap-3 mb-6">
            {items.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl border-2 border-gray-100 p-4 flex items-center gap-4 hover:border-red-100 transition-colors">
                {/* รูป */}
                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.product?.image
                    ? <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                    : <span className="text-3xl">🖥️</span>
                  }
                </div>
                
                {/* ข้อมูล */}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 truncate">{item.product?.name || "สินค้า"}</p>
                  <p className="text-sm text-gray-400 font-medium">฿{item.product?.price?.toLocaleString()} × {item.quantity} ชิ้น</p>
                </div>
                
                {/* ยอดย่อย + ลบ */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-black text-red-600 text-lg">฿{((item.product?.price || 0) * item.quantity).toLocaleString()}</span>
                  <button onClick={() => remove(item.product?._id)}
                    className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center text-sm transition-colors font-bold">✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* ═ Summary ═ */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-400 text-sm font-medium">ยอดรวมทั้งหมด</p>
                <p className="text-4xl font-black text-gray-900">฿{total.toLocaleString()}</p>
              </div>
              <p className="text-sm text-gray-400">{items.length} รายการ</p>
            </div>
            <button onClick={() => setPage("orders")}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-200 transition-all text-base flex items-center justify-center gap-2">
              ดำเนินการสั่งซื้อ →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ═════════════ ORDERS PAGE SECTION (Checkout) ======================
// ═══════════════════════════════════════════════════════════════════

/**
 * OrdersPage - หน้า Checkout (สรุปการสั่งซื้อ)
 * 
 * Workflow:
 * 1. User นำ coupon code มาใช้ (ถ้ามี)
 * 2. Click "ยืนยันการสั่งซื้อ"
 * 3. ส่ง POST /orders/checkout พร้อม couponCode
 * 4. Backend บันทึก order, ลดสต็อก, คำนวณส่วนลด
 * 5. Return order data + finalPrice
 * 6. Save finalPrice ไปใน state paymentAmount
 * 7. Redirect ไปหน้า Payments
 * 
 * @param {object} toast - Toast notification object
 * @param {function} setPage - Function เปลี่ยนหน้า
 * @param {function} setPaymentAmount - Function set amount สำหรับ payment
 */
function OrdersPage({ toast, setPage, setPaymentAmount }) {
  const { token } = useAuth();
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);

  const checkout = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/orders/checkout", {
        method: "POST",
        body: JSON.stringify({ couponCode: coupon || undefined }),
      }, token);
      
      const order = data.order || data; // ความปลอดภัย
      toast.success("สั่งซื้อสำเร็จ! 🎉");
      
      // save amount สำหรับหน้า Payments
      setPaymentAmount(order.finalPrice || order.totalPrice);
      
      // redirect ไป Payments
      setPage("payments");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Checkout</h1>
      <p className="text-gray-400 text-sm mb-8">ยืนยันคำสั่งซื้อและชำระเงิน</p>

      {/* ═══ Coupon Input ═══ */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-4">
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">โค้ดส่วนลด (ไม่บังคับ)</label>
        <input
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm font-medium bg-gray-50 placeholder-gray-400"
          placeholder="กรอกโค้ดคูปอง..."
          value={coupon}
          onChange={(e) => setCoupon(e.target.value.toUpperCase())}
        />
        {coupon && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600 font-semibold">
            <span>🎫</span> ใช้โค้ด: <span className="font-black bg-green-50 px-2 py-0.5 rounded-lg">{coupon}</span>
          </div>
        )}
      </div>

      {/* ═══ Submit Button ═══ */}
      <button onClick={checkout} disabled={loading}
        className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-black rounded-xl shadow-lg shadow-red-200 transition-all text-base">
        {loading ? "กำลังดำเนินการ..." : "✓ ยืนยันการสั่งซื้อ"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ═════════════ PAYMENTS PAGE SECTION (ชำระเงิน) ====================
// ═══════════════════════════════════════════════════════════════════

/**
 * PaymentsPage - หน้าชำระเงิน
 * 
 * Workflow:
 * 1. Load → GET /payments/my เพื่อดึง payment history
 * 2. สร้างใหม่: input amount → POST /payments → ได้ payment ID
 * 3. ชำระเงิน: click "ชำระเงิน" → POST /payments/{id}/pay
 * 4. ถ้า success → clear cart (setCartCount(0))
 * 5. refresh payment list
 * 
 * @param {object} toast - Toast notification object
 * @param {number} initialAmount - Initial amount from Orders page
 * @param {function} setCartCount - Function clear cart count
 */
function PaymentsPage({ toast, initialAmount, setCartCount }) {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(initialAmount || "");
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await apiFetch("/payments/my", {}, token);
      setPayments(d);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    setCreating(true);
    try {
      await apiFetch("/payments", {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount) }),
      }, token);
      toast.success("สร้าง payment สำเร็จ");
      setAmount("");
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const pay = async (id) => {
    try {
      await apiFetch(`/payments/${id}/pay`, { method: "POST" }, token);
      toast.success("ชำระเงินสำเร็จ! ✅");
      setCartCount(0); // clear cart
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-8">การชำระเงิน</h1>

      {/* ═══ Create Payment Box ═══ */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-6">
        <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2"><span>💳</span> สร้าง Payment ใหม่</h2>
        <div className="flex gap-3">
          <input
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm font-medium bg-gray-50"
            type="number"
            placeholder="จำนวนเงิน (฿)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={create} disabled={creating || !amount}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-200 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-red-200">
            {creating ? "..." : "สร้าง"}
          </button>
        </div>
      </div>

      {/* ═══ Payments List ═══ */}
      {payments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-4">💳</div>
          <p className="font-semibold">ยังไม่มีประวัติการชำระเงิน</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl border-2 border-gray-100 p-5 flex items-center justify-between hover:border-red-100 transition-colors">
              {/* Info */}
              <div>
                <p className="font-black text-gray-900 text-xl">฿{p.amount?.toLocaleString()}</p>
                <p className="text-gray-400 text-xs mt-1 font-mono">{p._id}</p>
                {p.transactionId && <p className="text-green-600 text-xs font-bold mt-1">✓ {p.transactionId}</p>}
              </div>
              
              {/* Status + Action */}
              <div className="flex items-center gap-3">
                <span className={`text-xs font-black px-3 py-1.5 rounded-full
                  ${p.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {p.status === "paid" ? "✓ ชำระแล้ว" : "⏳ รอชำระ"}
                </span>
                {p.status === "pending" && (
                  <button onClick={() => pay(p._id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-all">
                    ชำระเงิน
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ═════════════ COUPONS PAGE SECTION (คูปอง) =======================
// ═══════════════════════════════════════════════════════════════════

/**
 * CouponsPage - หน้าแสดง/รับคูปอง
 * 
 * Workflow:
 * 1. Load → GET /coupons (แสดงคูปองทั้งหมด)
 * 2. User: click "รับคูปอง" → POST /coupons/{id}/claim
 * 3. Admin: click "+ สร้างคูปอง" → POST /coupons
 * 4. ตรวจสอบ: วันหมดอายุ, user claim ใหม่or ให้มี่
 * 
 * @param {object} toast - Toast notification object
 */
function CouponsPage({ toast }) {
  const { token, user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: "", discountPercent: "", expiresAt: "" });

  const canCreate = user?.role === "admin" || user?.role === "owner";

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await apiFetch("/coupons");
      setCoupons(d);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    try {
      await apiFetch("/coupons", {
        method: "POST",
        body: JSON.stringify(form),
      }, token);
      toast.success("สร้างคูปองสำเร็จ!");
      setShowModal(false);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const claim = async (id) => {
    try {
      await apiFetch(`/coupons/${id}/claim`, { method: "POST" }, token);
      toast.success("รับคูปองสำเร็จ! 🎫");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">คูปองส่วนลด</h1>
          <p className="text-gray-400 text-sm mt-1">รับคูปองเพื่อประหยัดค่าใช้จ่าย</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowModal(true)}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-200">
            + สร้างคูปอง
          </button>
        )}
      </div>

      {/* ═══ Coupons Grid ═══ */}
      {coupons.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-6xl mb-4">🎫</div>
          <p className="font-semibold text-lg">ยังไม่มีคูปอง</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => {
            const claimed = c.claimedUsers?.includes(user?.id);
            const expired = c.expiresAt && new Date() > new Date(c.expiresAt);
            
            return (
              <div key={c._id} className={`relative rounded-2xl border-2 p-5 overflow-hidden transition-all
                ${expired ? "border-gray-200 bg-gray-50 opacity-60" : "border-red-100 bg-gradient-to-br from-white to-red-50 hover:border-red-300 hover:shadow-lg hover:shadow-red-100"}`}>
                {/* Dashed Left Border */}
                <div className="absolute left-0 top-4 bottom-4 w-1 border-l-2 border-dashed border-red-200" />
                
                <div className="pl-4">
                  {/* Code + Discount % */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-red-600 text-white font-black text-xl px-3 py-1 rounded-xl tracking-widest shadow-md shadow-red-200">{c.code}</div>
                    <div className="text-right">
                      <span className="text-4xl font-black text-red-600 leading-none">{c.discountPercent}</span>
                      <span className="text-red-400 font-bold text-lg">%</span>
                    </div>
                  </div>
                  
                  {/* Expiry */}
                  <p className="text-gray-400 text-xs font-medium mb-4">
                    {expired ? "หมดอายุ" : c.expiresAt ? `หมดอายุ: ${new Date(c.expiresAt).toLocaleDateString("th-TH")}` : "ไม่มีวันหมดอายุ"}
                  </p>
                  
                  {/* Action Button */}
                  {expired ? (
                    <span className="text-sm text-gray-400 font-bold">หมดอายุแล้ว</span>
                  ) : claimed ? (
                    <span className="flex items-center gap-1 text-sm text-green-600 font-bold">✓ รับแล้ว</span>
                  ) : (
                    <button onClick={() => claim(c._id)}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-red-200">
                      รับคูปอง
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Create Coupon Modal ═══ */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="สร้างคูปองใหม่">
        <Input
          label="โค้ดคูปอง"
          value={form.code}
          onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
          placeholder="เช่น SAVE20"
        />
        <Input
          label="ส่วนลด (%)"
          type="number"
          value={form.discountPercent}
          onChange={(e) => setForm((p) => ({ ...p, discountPercent: e.target.value }))}
          placeholder="20"
        />
        <Input
          label="วันหมดอายุ"
          type="date"
          value={form.expiresAt}
          onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
        />
        <div className="flex gap-3 mt-2">
          <button onClick={create} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all">สร้างคูปอง</button>
          <button onClick={() => setShowModal(false)} className="px-5 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50">ยกเลิก</button>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ══════════ PROFILE PAGE SECTION (โปรไฟล์ผู้ใช้) ====================
// ═══════════════════════════════════════════════════════════════════

/**
 * ProfilePage - หน้าแสดง/แก้ไขโปรไฟล์
 * 
 * Workflow:
 * 1. Load → GET /users/profile เพื่อดึงข้อมูล user
 * 2. User แก้ไขชื่อหรือรหัสผ่าน
 * 3. Click "บันทึก" → PUT /users/profile
 * 4. Refresh ข้อมูล
 * 
 * @param {object} toast - Toast notification object
 */
function ProfilePage({ toast }) {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await apiFetch("/users/profile", {}, token);
      setProfile(d);
      setForm({ name: d.name, password: "" });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const update = async () => {
    setSaving(true);
    try {
      const body = { name: form.name };
      if (form.password) body.password = form.password;
      
      await apiFetch("/users/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      }, token);
      
      toast.success("อัปเดตโปรไฟล์สำเร็จ!");
      setForm((p) => ({ ...p, password: "" }));
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-lg mx-auto px-6 py-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-8">โปรไฟล์ของฉัน</h1>
      
      {/* ═══ Profile Info Card ═══ */}
      <div className="bg-gradient-to-br from-red-600 to-rose-600 rounded-3xl p-6 mb-6 text-white shadow-2xl shadow-red-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-black text-white shadow-inner">
            {profile?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-black text-xl">{profile?.name}</p>
            <p className="text-red-200 text-sm font-medium">{profile?.email}</p>
            <span className="inline-block mt-1 bg-white/20 text-white text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wider">{profile?.role}</span>
          </div>
        </div>
      </div>
      
      {/* ═══ Edit Form ═══ */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2"><span>✏️</span> แก้ไขข้อมูล</h2>
        
        <Input
          label="ชื่อ"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />
        <Input
          label="รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)"
          type="password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          placeholder="••••••••"
        />
        
        <button
          onClick={update}
          disabled={saving}
          className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-200 mt-2"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ════════════ ADMIN PAGE SECTION (Admin Panel) ======================
// ═══════════════════════════════════════════════════════════════════

/**
 * AdminPage - Admin Panel จัดการผู้ใช้
 * 
 * Workflow:
 * 1. Load → GET /admin/users ดึง users ทั้งหมด
 * 2. แสดง stats (total users, admins, owners, users)
 * 3. Table แสดง users พร้อม role badge
 * 4. Click "เปลี่ยน Role" → Modal select role ใหม่
 * 5. Click "ลบ" → DELETE /admin/users/{id}
 * 
 * @param {object} toast - Toast notification object
 */
function AdminPage({ toast }) {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await apiFetch("/admin/users", {}, token);
      setUsers(d);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async () => {
    try {
      await apiFetch(`/admin/users/${editUser._id}`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      }, token);
      toast.success("อัปเดต role สำเร็จ!");
      setEditUser(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const del = async (id) => {
    if (!confirm("ต้องการลบผู้ใช้นี้?")) return;
    try {
      await apiFetch(`/admin/users/${id}`, { method: "DELETE" }, token);
      toast.success("ลบผู้ใช้สำเร็จ");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  // ═══ Role Styles ═══
  const roleStyle = {
    admin: "bg-red-100 text-red-700",
    owner: "bg-orange-100 text-orange-700",
    user: "bg-blue-100 text-blue-700",
  };

  // ═══ Stats ═══
  const stats = [
    { label: "ผู้ใช้ทั้งหมด", value: users.length, icon: "👥", color: "bg-blue-50 border-blue-200" },
    { label: "Admin", value: users.filter((u) => u.role === "admin").length, icon: "⚙️", color: "bg-red-50 border-red-200" },
    { label: "Owner", value: users.filter((u) => u.role === "owner").length, icon: "👑", color: "bg-orange-50 border-orange-200" },
    { label: "User", value: users.filter((u) => u.role === "user").length, icon: "👤", color: "bg-gray-50 border-gray-200" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">จัดการผู้ใช้และสิทธิ์การเข้าถึง</p>
        </div>
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white text-xl">⚙️</div>
      </div>

      {/* ═══ Stats Grid ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`${s.color} border-2 rounded-2xl p-4`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 font-semibold">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Users Table ═══ */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-gray-900">รายชื่อผู้ใช้ทั้งหมด</h2>
          <span className="text-sm text-gray-400 font-medium">{users.length} บัญชี</span>
        </div>
        
        {/* Scrollable Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Head */}
            <thead className="bg-gray-50">
              <tr>
                {["ผู้ใช้", "อีเมล", "Role", "จัดการ"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Body */}
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{u.name}</span>
                    </div>
                  </td>
                  
                  {/* Email */}
                  <td className="px-6 py-4 text-gray-500 text-sm font-medium">{u.email}</td>
                  
                  {/* Role */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${roleStyle[u.role] || "bg-gray-100 text-gray-600"}`}>
                      {u.role}
                    </span>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {/* Change Role Button */}
                      <button
                        onClick={() => {
                          setEditUser(u);
                          setNewRole(u.role);
                        }}
                        className="px-3 py-1.5 text-xs font-bold border-2 border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        เปลี่ยน Role
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => del(u._id)}
                        className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ Change Role Modal ═══ */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title={`เปลี่ยน Role: ${editUser?.name}`}
      >
        {/* User Info */}
        <div className="mb-4 p-4 bg-gray-50 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black">
            {editUser?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900">{editUser?.name}</p>
            <p className="text-gray-400 text-sm">{editUser?.email}</p>
          </div>
        </div>
        
        {/* Role Select */}
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
          Role ใหม่
        </label>
        <select
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm font-bold bg-gray-50 mb-5"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
        >
          {["user", "owner", "admin"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={updateRole}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all"
          >
            บันทึก
          </button>
          <button
            onClick={() => setEditUser(null)}
            className="px-5 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50"
          >
            ยกเลิก
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ════════════ MAIN APP SECTION (แอปหลัก) ==========================
// ═══════════════════════════════════════════════════════════════════

/**
 * AppInner - Component ภายในที่เข้าถึง Auth Context
 * 
 * Workflow หลัก:
 * 1. ตรวจสอบ token
 * 2. ถ้าไม่มี token → แสดง Login/Register/Forgot หน้า
 * 3. ถ้ามี token → แสดง Main App (Nav + Page)
 * 4. renderPage() → ค้นหาหน้าตาม page state
 */
function AppInner() {
  const { token } = useAuth();
  const [page, setPage] = useState("products"); // current page
  const [cartCount, setCartCount] = useState(0); // cart items count
  const [paymentAmount, setPaymentAmount] = useState(""); // amount to pay
  const toast = useToast(); // toast notifications

  /**
   * renderPage() - Return component ตาม page state
   */
  const renderPage = () => {
    switch (page) {
      case "products": return <ProductsPage toast={toast} setCartCount={setCartCount} />;
      case "cart": return <CartPage setPage={setPage} setCartCount={setCartCount} toast={toast} />;
      case "orders": return <OrdersPage toast={toast} setPage={setPage} setPaymentAmount={setPaymentAmount} />;
      case "payments": return <PaymentsPage toast={toast} initialAmount={paymentAmount} setCartCount={setCartCount} />;
      case "coupons": return <CouponsPage toast={toast} />;
      case "profile": return <ProfilePage toast={toast} />;
      case "admin": return <AdminPage toast={toast} />;
      default: return <ProductsPage toast={toast} setCartCount={setCartCount} />;
    }
  };

  // ═══ ไม่เข้าสู่ระบบ → Auth Pages ═══
  if (!token) {
    if (page === "register") {
      return (
        <>
          <RegisterPage setPage={setPage} toast={toast} />
          <ToastContainer toasts={toast.toasts} remove={toast.remove} />
        </>
      );
    }
    if (page === "forgot") {
      return (
        <>
          <ForgotPage setPage={setPage} toast={toast} />
          <ToastContainer toasts={toast.toasts} remove={toast.remove} />
        </>
      );
    }
    return (
      <>
        <LoginPage setPage={setPage} toast={toast} />
        <ToastContainer toasts={toast.toasts} remove={toast.remove} />
      </>
    );
  }

  // ═══ เข้าสู่ระบบแล้ว → Main App ═══
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Nav page={page} setPage={setPage} cartCount={cartCount} />
      
      {/* Main Content */}
      <main>{renderPage()}</main>
      
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} remove={toast.remove} />
      
      {/* Footer */}
      <footer className="mt-16 border-t-2 border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-black">T</span>
            </div>
            <span className="font-black text-gray-900">
              TECH<span className="text-red-600">ZONE</span>
            </span>
          </div>
          
          {/* Copyright */}
          <p className="text-gray-400 text-sm font-medium">© 2025 TECHZONE · อุปกรณ์คอมพิวเตอร์ครบวงจร</p>
          
          {/* Categories */}
          <div className="flex items-center gap-4 text-gray-400 text-sm font-medium">
            <span>🖥️ CPU</span>
            <span>🎮 GPU</span>
            <span>💾 Storage</span>
            <span>⌨️ Peripherals</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * App - Root Component
 * 
 * ประกอบด้วย:
 * 1. Global Styles (fonts, animations, utilities)
 * 2. AuthProvider wrapper
 * 3. AppInner component
 */
export default function App() {
  return (
    <>
      {/* ═══ Global Styles ═══ */}
      <style>{`
        /* Import Google Font */
        @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,600;0,700;0,800;0,900;1,800&display=swap');
        
        /* Apply font globally */
        * { font-family: 'Barlow', sans-serif; }
        
        /* Animation: Slide In (ทางขวา) */
        @keyframes slideIn {
          from { transform: translateX(110%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        /* Animation: Pop In (ขยาย + fade) */
        @keyframes popIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        /* Utility: จำกัด text 2 บรรทัด */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* ═══ Auth Provider + App ═══ */}
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </>
  );
}