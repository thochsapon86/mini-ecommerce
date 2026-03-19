// ═══════════════════════════════════════════════════════════════
// LoginPage.jsx — พร้อม Validation
// ═══════════════════════════════════════════════════════════════
/**
 * LoginPage.jsx
 * เพิ่ม Frontend Validation:
 *   - อีเมลต้องไม่ว่างและรูปแบบถูกต้อง
 *   - รหัสผ่านต้องไม่ว่าง
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import { useValidation } from "../hooks/useValidation";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/Input";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { errors, validate } = useValidation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // กฎ validation
  const rules = {
    email: [
      { required: true, message: "กรุณากรอกอีเมล" },
      { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "รูปแบบอีเมลไม่ถูกต้อง" },
    ],
    password: [
      { required: true, message: "กรุณากรอกรหัสผ่าน" },
    ],
  };

  const submit = async () => {
    // validate ก่อนส่ง
    if (!validate(form, rules)) return;

    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify(form) });
      login(data.token);
      toast.success("เข้าสู่ระบบสำเร็จ!");
      navigate("/products");
    } catch (e) {
      toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="เข้าสู่ระบบ" subtitle="ร้านค้าอุปกรณ์คอมพิวเตอร์ครบวงจร">
      {/* Input พร้อม error message */}
      <div className="mb-4">
        <Input label="อีเมล" type="email" value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="you@example.com" />
        {errors.email && <p className="text-red-500 text-xs font-semibold -mt-3 mb-3">⚠ {errors.email}</p>}
      </div>

      <div className="mb-2">
        <Input label="รหัสผ่าน" type="password" value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          placeholder="••••••••"
          onKeyDown={e => e.key === "Enter" && submit()} />
        {errors.password && <p className="text-red-500 text-xs font-semibold -mt-3 mb-3">⚠ {errors.password}</p>}
      </div>

      <button onClick={submit} disabled={loading}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all text-sm disabled:opacity-60 mt-2">
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ →"}
      </button>

      <div className="mt-5 flex items-center justify-between text-sm">
        <Link to="/register" className="text-red-600 font-bold hover:underline">สมัครสมาชิก</Link>
        <Link to="/forgot" className="text-gray-400 hover:text-gray-600 font-medium">ลืมรหัสผ่าน?</Link>
      </div>
    </AuthLayout>
  );
}