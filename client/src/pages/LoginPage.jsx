import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/Input";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
  setLoading(true);
  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(form)
    });
    login(data.token);
    toast.success("เข้าสู่ระบบสำเร็จ!");
    navigate("/products");
  } catch (e) {
    // ── แก้ตรงนี้ ──
    toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  } finally {
    setLoading(false);
  }
};

  return (
    <AuthLayout title="เข้าสู่ระบบ" subtitle="ร้านค้าอุปกรณ์คอมพิวเตอร์ครบวงจร">
      <Input label="อีเมล" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
      <Input label="รหัสผ่าน" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••"
        onKeyDown={e => e.key === "Enter" && submit()} />
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
