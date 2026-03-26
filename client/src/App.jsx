/**
 * ═══════════════════════════════════════════════════════════════════
 * App.jsx - Root Application Component
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ไฟล์ main component ของแอพ
 * รับผิดชอบการ routing ทั้งหมด (Routes หลัก)
 * จัดการ authentication provider และ global state
 * 
 * ส่วนประกอบหลัก:
 *   1. ProtectedRoute - Component สำหรับป้องกันเส้นทางที่ต้องล็อกอิน
 *   2. Layout - Component wrapper สำหรับ Nav + Footer
 *   3. AppRoutes - ทั้งหมดของ Routes ในแอพ
 *   4. App - Root component ที่ wrap ทั้งหมด
 */

import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

// Import ทั้งหมดของ page components
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPage from "./pages/ForgotPage";
import ProductsPage from "./pages/ProductsPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import PaymentsPage from "./pages/PaymentPage";
import CouponsPage from "./pages/CouponsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import ResetPasswordPage from "./pages/ResetPasswordPage"
import BulkUploadPage from "./pages/BulkUploadPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import MyOrdersPage from "./pages/MyOrdersPage";

/**
 * ═══════════════════════════════════════════════════════════════════
 * ProtectedRoute - Component สำหรับป้องกันเส้นทาง
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ตรวจสอบว่าผู้ใช้ส่วนทำการล็อกอิน ก่อนอนุญาตเข้าถึงเส้นทาง
 * 
 * @param {React.ReactNode} children - Component ที่ต้องป้องกัน
 * @param {boolean} adminOnly - ถ้า true จะต้องเป็น admin บทบาท
 * @returns {React.ReactElement}
 * 
 * ขั้นตอนการตรวจสอบ:
 *   1. ดึง token และ user information จาก AuthContext
 *   2. ถ้าไม่มี token ให้พุ่งไปที่เพจ login
 *   3. ถ้า adminOnly = true แต่ role ไม่ใช่ admin ให้พุ่งไปที่ /products
 *   4. ถ้าผ่านทั้งหมด ให้แสดง children component
 */
function ProtectedRoute({ children, adminOnly = false }) {
  const { token, user } = useAuth();

  // ขั้นตอน 1: ตรวจสอบ token (ถ้าไม่มี = ไม่ได้ล็อกอิน)
  if (!token) return <Navigate to="/login" replace />;

  // ขั้นตอน 2: ตรวจสอบ admin role หากต้องการ
  if (adminOnly && user?.role !== "admin") return <Navigate to="/products" replace />;

  // ขั้นตอน 3: ทุกอย่างผ่าน ให้แสดง children
  return children;
}


/**
 * ═══════════════════════════════════════════════════════════════════
 * Layout - Component Wrapper สำหรับ Nav และ Footer
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ห่ออ้อม content ด้วย Navigation bar ด้านบนและ Footer ด้านล่าง
 * โครงสร้างเพจสำเร็จรูป (Layout template)
 * 
 * @param {React.ReactNode} children - Content ของเพจ (main content)
 * @param {number} cartCount - จำนวนสินค้าในตะกร้า (แสดงใน Nav badge)
 * 
 * โครงสร้าง:
 *   - min-h-screen: ความสูงต่ำสุดคือ 100vh (เต็มหน้าจอ)
 *   - flex: จัดเรียงแบบ flexbox เพื่อให้ footer อยู่ด้านล่าง
 *   - main flex-1: ให้ children ยืดขยายให้เต็ม space ที่เหลือ
 */
function Layout({ children, cartCount }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ส่วน Header: Navigation bar */}
      <Nav cartCount={cartCount} />

      {/* ส่วน Main: Content หลักของเพจ (ยืดขยายให้เต็ม space) */}
      <main className="flex-1">{children}</main>

      {/* ส่วน Footer: ข้อมูลด้านล่าง */}
      <Footer />
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════
 * AppRoutes - Route Configuration (การตั้งค่าเส้นทาง)
 * ═══════════════════════════════════════════════════════════════════
 * 
 * กำหนดทั้งหมดของเส้นทาง (routes) ในแอพ
 * แบ่งเป็น public routes (ไม่ต้องล็อกอิน) และ protected routes (ต้องล็อกอิน)
 * 
 * ขั้นตอนการทำงาน:
 *   1. ดึง token จาก AuthContext เพื่อตรวจสอบสถานะล็อกอิน
 *   2. สร้าง state สำหรับ cartCount และ paymentAmount
 *   3. ตั้งค่า routes ทั้งหมด
 *   4. ใช้ ProtectedRoute สำหรับเส้นทางที่ต้องล็อกอิน
 *   5. ใช้ Layout wrapper สำหรับเพจส่วนใหญ่
 */
function AppRoutes() {
  const { token } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState("");

  return (
    <Routes>
      {/* ═════════════════════════════════════════════════════════ */}
      {/* PUBLIC ROUTES - ไม่ต้องล็อกอิน (สำหรับผู้ที่ยังไม่เข้าสู่ระบบ) */}
      {/* ═════════════════════════════════════════════════════════ */}

      {/* เข้าสู่ระบบ - ถ้าล็อกอิน จะพุ่งไป /products */}
      <Route path="/login" element={token ? <Navigate to="/products" replace /> : <LoginPage />} />

      {/* สมัครสมาชิก - ถ้าล็อกอิน จะพุ่งไป /products */}
      <Route path="/register" element={token ? <Navigate to="/products" replace /> : <RegisterPage />} />

      {/* ลืมรหัสผ่าน - ถ้าล็อกอิน จะพุ่งไป /products */}
      <Route path="/forgot" element={token ? <Navigate to="/products" replace /> : <ForgotPage />} />

      {/* รีเซ็ตรหัสผ่าน - ไม่ต้องล็อกอิน (ลิงก์จากอีเมล) */}
      <Route path="/reset-password/:token/*" element={<ResetPasswordPage />} />

      {/* ═════════════════════════════════════════════════════════ */}
      {/* PROTECTED ROUTES - ต้องล็อกอิน */}
      {/* ═════════════════════════════════════════════════════════ */}

      {/* หน้าสินค้า - ดูรายชื่อสินค้า */}
      <Route path="/products" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <ProductsPage setCartCount={setCartCount} />
          </Layout>
        </ProtectedRoute>
      } />

      {/* ตะกร้าสินค้า - ดูสินค้าในตะกร้า */}
      <Route path="/cart" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <CartPage setCartCount={setCartCount} />
          </Layout>
        </ProtectedRoute>
      } />

      {/* คำสั่งซื้อ - ดูรายการสั่งซื้อที่ผ่านมา */}
      <Route path="/orders" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <OrdersPage setPaymentAmount={setPaymentAmount} />
          </Layout>
        </ProtectedRoute>
      } />

      {/* ชำระเงิน - สร้างการชำระเงิน */}
      <Route path="/payments" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <PaymentsPage initialAmount={paymentAmount} setCartCount={setCartCount} />
          </Layout>
        </ProtectedRoute>
      } />

      {/* คูปอง - ดูและเรียกใช้คูปองส่วนลด */}
      <Route path="/coupons" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <CouponsPage />
          </Layout>
        </ProtectedRoute>
      } />

      {/* โปรไฟล์ - ดูและแก้ไขข้อมูลส่วนตัว */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <ProfilePage />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Admin Panel - เฉพาะ admin เท่านั้น */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <Layout cartCount={cartCount}>
            <AdminPage />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Bulk Upload - อัปโหลดสินค้าหลายรายการพร้อมกัน */}
      <Route path="/bulk-upload" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <BulkUploadPage />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Owner Dashboard - Dashboard สำหรับเจ้าของร้าน */}
      <Route path="/owner" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <OwnerDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      {/* My Orders - ดูคำสั่งซื้อของตัวเอง */}
      <Route path="/my-orders" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <MyOrdersPage />
          </Layout>
        </ProtectedRoute>
      } />
      {/* Fallback Route - ถ้า URL ไม่ตรงกับเส้นทางไหน */}
      {/* ถ้าล็อกอิน ให้พุ่งไป /products ถ้าไม่ ให้พุ่งไป /login */}
      <Route path="/" element={
        token ? <Navigate to="/products" /> : <Navigate to="/login" />
      } />
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}

// ─── Root App ─────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Barlow', sans-serif; }
        @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="light"
            toastStyle={{
              fontFamily: "Barlow, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              borderRadius: 12,
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}
