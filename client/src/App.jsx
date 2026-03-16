import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

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
import ResetPasswordPage from "./pages/ResetPasswordPage";

// ─── Protected Route ──────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== "admin") return <Navigate to="/products" replace />;
  return children;
}

// ─── Layout (Nav + Footer) ────────────────────────────────────────
function Layout({ children, cartCount }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Nav cartCount={cartCount} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

// ─── App Routes ───────────────────────────────────────────────────
function AppRoutes() {
  const { token } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState("");

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={token ? <Navigate to="/products" replace /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/products" replace /> : <RegisterPage />} />
      <Route path="/forgot" element={token ? <Navigate to="/products" replace /> : <ForgotPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route path="/products" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <ProductsPage setCartCount={setCartCount} />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/cart" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <CartPage setCartCount={setCartCount} />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/orders" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <OrdersPage setPaymentAmount={setPaymentAmount} />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/payments" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <PaymentsPage initialAmount={paymentAmount} setCartCount={setCartCount} />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/coupons" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <CouponsPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout cartCount={cartCount}>
            <ProfilePage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <Layout cartCount={cartCount}>
            <AdminPage />
          </Layout>
        </ProtectedRoute>
      } />
      {/* เพิ่มบรรทัดนี้ก่อน Fallback */}
      <Route path="/" element={<Navigate to={token ? "/products" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={token ? "/products" : "/login"} replace />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to={token ? "/products" : "/login"} replace />} />
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
