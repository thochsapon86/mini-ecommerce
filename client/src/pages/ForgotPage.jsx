import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiFetch } from "../api/apiFetch";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/Input";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      toast.success("ส่งลิงก์รีเซ็ตแล้ว (ดูใน Console)");
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="ลืมรหัสผ่าน" subtitle="กรอกอีเมลเพื่อรับลิงก์รีเซ็ต">
      <Input label="อีเมล" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
      <button onClick={submit} disabled={loading}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all text-sm disabled:opacity-60 mt-2">
        {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ต →"}
      </button>
      <div className="mt-4 text-center text-sm">
        <Link to="/login" className="text-gray-400 hover:text-gray-600 font-medium">← กลับไปหน้าเข้าสู่ระบบ</Link>
      </div>
    </AuthLayout>
  );
}
