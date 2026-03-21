/**
 * ═══════════════════════════════════════════════════════════════════
 * Nav.jsx - Navigation Bar Component
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Sticky navigation bar แสดงที่ด้านบนของหน้า
 * มี Logo, Navigation links, User role badge, Logout button
 * Responsive: Desktop menu แสดง horizontal, Mobile menu คลิกเป็น dropdown
 * 
 * @param {number} cartCount - จำนวนสินค้าในตะกร้า (แสดงใน badge)
 * 
 * ขั้นตอนการทำงาน:
 *   1. ดึง user info และ logout function จาก AuthContext
 *   2. สร้าง navItems array พร้อมเชค role (owner/admin)
 *   3. Render desktop menu (md+) และ mobile menu (sm)
 *   4. ให้กด logout เพื่อออกจากระบบ
 */

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Nav({ cartCount }) {
  // ขั้นตอนที่ 1: ดึง user info และ logout function
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State สำหรับ mobile menu (open/close)
  const [mobileOpen, setMobileOpen] = useState(false);

  /**
   * ═══════════════════════════════════════════════════════════════
   * navItems - Array ของรายการ navigation
   * ═══════════════════════════════════════════════════════════════
   * 
   * ขั้นตอน:
   *   1. เริ่มด้วย items ทั่วไป (สินค้า, ตะกร้า, คำสั่งซื้อ, etc.)
   *   2. ถ้า user role = "owner" ให้เพิ่ม Dashboard
   *   3. ถ้า user role = "admin" ให้เพิ่ม Admin panel
   *   4. ใช้ spread operator (...) สำหรับเพิ่ม item เงื่อนไข
   */
  const navItems = [
    { path: "/products", label: "สินค้า", icon: "🖥️" },
    { path: "/cart", label: "ตะกร้า", icon: "🛒", badge: cartCount },
    { path: "/orders", label: "คำสั่งซื้อ", icon: "📦" },
    { path: "/payments", label: "ชำระเงิน", icon: "💳" },
    { path: "/coupons", label: "คูปอง", icon: "🎫" },
    { path: "/profile", label: "โปรไฟล์", icon: "👤" },
    { path: "/my-orders", label: "ติดตามออเดอร์", icon: "📦" },
    // เพิ่ม Dashboard ถ้า role = "owner"
    ...(user?.role === "owner" ? [{ path: "/owner", label: "Dashboard", icon: "📊" }] : []),
    
    // เพิ่ม Admin ถ้า role = "admin"
    ...(user?.role === "admin" ? [{ path: "/admin", label: "Admin", icon: "⚙️" }] : []),
  ];

  /**
   * handleLogout - ฟังก์ชันออกจากระบบ
   * 
   * ขั้นตอน:
   *   1. เรียก logout() เพื่อลบ token
   *   2. พุ่งไปที่เพจ /login
   */
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b-2 border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* ╔════════════════════════════════════════════════════════╗ */}
          {/* ║ ส่วน 1: LOGO + ชื่อแบรนด์                             ║ */}
          {/* ╚════════════════════════════════════════════════════════╝ */}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate("/products")}
          >
            {/* Icon : โลโก "T" ในกล่องสีแดง */}
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-lg font-black">T</span>
            </div>
            
            {/* ชื่อแบรนด์ */}
            <div>
              <span className="text-gray-900 font-black text-lg tracking-tight">TECH</span>
              <span className="text-red-600 font-black text-lg tracking-tight">ZONE</span>
            </div>
          </div>

          {/* ╔════════════════════════════════════════════════════════╗ */}
          {/* ║ ส่วน 2: DESKTOP NAVIGATION (md screen & up)           ║ */}
          {/* ╚════════════════════════════════════════════════════════╝ */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                // className เปลี่ยนตาม isActive (หน้าปัจจุบัน)
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                  ${isActive 
                    ? "bg-red-600 text-white shadow-md shadow-red-200" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`
                }
              >
                {/* Icon */}
                <span className="text-base">{item.icon}</span>
                
                {/* Label */}
                {item.label}
                
                {/* Badge: แสดงจำนวนสินค้าในตะกร้า */}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-black 
                                 rounded-full flex items-center justify-center border-2 border-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* ╔════════════════════════════════════════════════════════╗ */}
          {/* ║ ส่วน 3: USER INFO + LOGOUT (Desktop only)            ║ */}
          {/* ╚════════════════════════════════════════════════════════╝ */}
          <div className="hidden md:flex items-center gap-3">
            {/* Role badge: แสดง role เป็นตัวใหญ่ (USER, OWNER, ADMIN) */}
            <p className="text-xs font-black text-gray-900">
              {user?.role?.toUpperCase()}
            </p>
            
            {/* ปุ่ม Logout */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-sm font-bold border-2 border-gray-200 text-gray-600 
                         hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              ออกจากระบบ
            </button>
          </div>

          {/* ╔════════════════════════════════════════════════════════╗ */}
          {/* ║ ส่วน 4: MOBILE MENU TOGGLE BUTTON (sm only)         ║ */}
          {/* ╚════════════════════════════════════════════════════════╝ */}
          {/* แสดงเฉพาะ mobile (md:hidden) */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-gray-100" 
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {/* ไอคอน Hamburger menu (3 เส้น) */}
            <div className="w-5 h-0.5 bg-gray-700 mb-1" />
            <div className="w-5 h-0.5 bg-gray-700 mb-1" />
            <div className="w-5 h-0.5 bg-gray-700" />
          </button>
        </div>
      </div>

      {/* ╔════════════════════════════════════════════════════════╗ */}
      {/* ║ ส่วน 5: MOBILE NAVIGATION MENU (Dropdown)           ║ */}
      {/* ╚════════════════════════════════════════════════════════╝ */}
      {/* แสดงเฉพาะ mobile (md:hidden) และ มา mobileOpen = true */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          {/* รายการ navigation */}
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}  // ปิด menu หลังจากคลิก
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${isActive ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100"}`
              }
            >
              {item.icon} {item.label}
              
              {/* Badge badge ในมือถือ */}
              {item.badge > 0 && (
                <span className="ml-auto bg-white text-red-600 text-xs font-black px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
          
          {/* ปุ่ม Logout ในมือถือ */}
          <button 
            onClick={handleLogout} 
            className="mt-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 
                       border-2 border-red-100 hover:bg-red-50 transition-all"
          >
            ออกจากระบบ
          </button>
        </div>
      )}
    </nav>
  );
}
