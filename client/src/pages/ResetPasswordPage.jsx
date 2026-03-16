/**
 * ResetPasswordPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * หน้าตั้งรหัสผ่านใหม่ เข้าถึงได้ผ่านลิงก์ในอีเมล
 * URL: /reset-password/:token
 *
 * หลักการทำงาน:
 * 1. ดึง token จาก URL params
 * 2. user กรอกรหัสผ่านใหม่ 2 ครั้ง
 * 3. ส่ง POST /api/auth/reset-password/:token ไปยัง backend
 * 4. ถ้าสำเร็จ redirect ไปหน้า login
 */

import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiFetch } from "../api/apiFetch";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/Input";

export default function ResetPasswordPage() {
  // ดึง token จาก URL เช่น /reset-password/abc123xyz
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    // ตรวจสอบว่ารหัสผ่านทั้งสองช่องตรงกัน
    if (form.password !== form.confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }

    // ตรวจสอบความยาวรหัสผ่านขั้นต่ำ
    if (form.password.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    try {
      // POST /api/auth/reset-password/:token
      await apiFetch(`/auth/reset-password/${token}`, {
        method: "POST",
        body: JSON.stringify({ password: form.password }),
      });

      toast.success("ตั้งรหัสผ่านใหม่สำเร็จ! กรุณาเข้าสู่ระบบ");
      navigate("/login"); // redirect ไปหน้า login
    } catch (e) {
      toast.error(e.message); // เช่น "Token invalid or expired"
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="ตั้งรหัสผ่านใหม่" subtitle="กรอกรหัสผ่านใหม่ของคุณ">

      <Input
        label="รหัสผ่านใหม่"
        type="password"
        value={form.password}
        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
        placeholder="••••••••"
      />

      <Input
        label="ยืนยันรหัสผ่านใหม่"
        type="password"
        value={form.confirmPassword}
        onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
        placeholder="••••••••"
        onKeyDown={e => e.key === "Enter" && submit()}
      />

      {/* แสดง indicator ว่ารหัสผ่านตรงกันไหม */}
      {form.confirmPassword && (
        <p className={`text-xs font-semibold mb-2 ${form.password === form.confirmPassword ? "text-green-500" : "text-red-500"}`}>
          {form.password === form.confirmPassword ? "✓ รหัสผ่านตรงกัน" : "✕ รหัสผ่านไม่ตรงกัน"}
        </p>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all text-sm disabled:opacity-60 mt-2"
      >
        {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่ →"}
      </button>

      <div className="mt-4 text-center text-sm">
        <Link to="/login" className="text-gray-400 hover:text-gray-600 font-medium">
          ← กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    </AuthLayout>
  );
}