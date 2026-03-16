import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Nav({ cartCount }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: "/products", label: "สินค้า", icon: "🖥️" },
    { path: "/cart", label: "ตะกร้า", icon: "🛒", badge: cartCount },
    { path: "/orders", label: "คำสั่งซื้อ", icon: "📦" },
    { path: "/payments", label: "ชำระเงิน", icon: "💳" },
    { path: "/coupons", label: "คูปอง", icon: "🎫" },
    { path: "/profile", label: "โปรไฟล์", icon: "👤" },
    ...(user?.role === "admin" ? [{ path: "/admin", label: "Admin", icon: "⚙️" }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b-2 border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/products")}>
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-lg font-black">T</span>
            </div>
            <div>
              <span className="text-gray-900 font-black text-lg tracking-tight">TECH</span>
              <span className="text-red-600 font-black text-lg tracking-tight">ZONE</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                  ${isActive ? "bg-red-600 text-white shadow-md shadow-red-200" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`
                }
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* User + Logout */}
          <div className="hidden md:flex items-center gap-3">
            <p className="text-xs font-black text-gray-900">{user?.role?.toUpperCase()}</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-sm font-bold border-2 border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all"
            >ออกจากระบบ</button>
          </div>

          {/* Mobile menu */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
            <div className="w-5 h-0.5 bg-gray-700 mb-1" />
            <div className="w-5 h-0.5 bg-gray-700 mb-1" />
            <div className="w-5 h-0.5 bg-gray-700" />
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${isActive ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100"}`
              }
            >
              {item.icon} {item.label}
              {item.badge > 0 && (
                <span className="ml-auto bg-white text-red-600 text-xs font-black px-1.5 py-0.5 rounded-full">{item.badge}</span>
              )}
            </NavLink>
          ))}
          <button onClick={handleLogout} className="mt-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 border-2 border-red-100 hover:bg-red-50 transition-all">
            ออกจากระบบ
          </button>
        </div>
      )}
    </nav>
  );
}
