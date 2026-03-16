import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiFetch } from "../api/apiFetch";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/Input";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await apiFetch("/auth/register", { method: "POST", body: JSON.stringify(form) });
      toast.success("สมัครสำเร็จ! กรุณาเข้าสู่ระบบ");
      navigate("/login");
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="สมัครสมาชิก" subtitle="สร้างบัญชีเพื่อเริ่มช้อปปิ้ง">
      <Input label="ชื่อ" type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="ชื่อของคุณ" />
      <Input label="อีเมล" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
      <Input label="รหัสผ่าน" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
      <button onClick={submit} disabled={loading}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all text-sm disabled:opacity-60 mt-2">
        {loading ? "กำลังสมัคร..." : "สมัครสมาชิก →"}
      </button>
      <div className="mt-4 text-center text-sm">
        <Link to="/login" className="text-red-600 font-bold hover:underline">มีบัญชีแล้ว? เข้าสู่ระบบ</Link>
      </div>
    </AuthLayout>
  );
}
