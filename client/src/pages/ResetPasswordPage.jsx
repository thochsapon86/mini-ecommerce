/**
 * ═══════════════════════════════════════════════════════════════════
 * ResetPasswordPage.jsx - Password Reset Page
 * ═══════════════════════════════════════════════════════════════════
 * 
 * หน้าตั้งรหัสผ่านใหม่ - เข้าถึงได้ผ่านลิงก์ในอีเมลเท่านั้น
 * URL: /reset-password/:token (เช่น /reset-password/abc123xyz)
 * 
 * ขั้นตอนการทำงาน:
 *   1. ผู้ใช้ได้รับลิงก์รีเซ็ตจากอีเมล
 *   2. URL มี reset token ใน params
 *   3. ผู้ใช้กรอกรหัสผ่านใหม่ 2 ครั้ง (ต้องตรงกัน)
 *   4. ส่ง POST ไปยัง /auth/reset-password/:token
 *   5. Backend ตรวจสอบ token และอัปเดต password
 *   6. Redirect ไปหน้า /login
 * 
 * Validation:
 *   - รหัสผ่านต้องไม่ว่าง
 *   - อย่างน้อย 6 ตัวอักษร
 *   - ยืนยันรหัสผ่านต้องตรงกัน
 */

import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiFetch } from "../api/apiFetch";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/Input";

export default function ResetPasswordPage() {
  /**
   * ขั้นตอนที่ 1: ดึง token จาก URL params
   * 
   * เช่น URL = /reset-password/abc123xyz
   * token = "abc123xyz"
   */
  const { token } = useParams();
  const navigate = useNavigate();

  // State: ฟอร์มสำหรับรหัสผ่าน
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  
  // State: loading ขณะส่ง API
  const [loading, setLoading] = useState(false);

  /**
   * submit - ส่งคำขอตั้งรหัสผ่านใหม่
   * 
   * ขั้นตอน:
   *   1. ตรวจสอบว่ารหัสผ่านทั้อง 2 ช่องตรงกัน
   *   2. ตรวจสอบความยาวขั้นต่ำ (6 ตัวอักษร)
   *   3. ส่ง POST ไปยัง /auth/reset-password/:token
   *   4. เมื่อสำเร็จ redirect ไปหน้า /login
   *   5. ถ้ามี error แสดง toast error
   */
  const submit = async () => {
    // ขั้นตอนที่ 1: ตรวจสอบว่าตรงกัน
    if (form.password !== form.confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }

    // ขั้นตอนที่ 2: ตรวจสอบความยาว
    if (form.password.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    try {
      // ขั้นตอนที่ 3: ส่ง POST request
      await apiFetch(`/auth/reset-password/${token}`, {
        method: "POST",
        body: JSON.stringify({ password: form.password }),
      });

      // ขั้นตอนที่ 4: แสดง toast สำเร็จ
      toast.success("ตั้งรหัสผ่านใหม่สำเร็จ! กรุณาเข้าสู่ระบบ");
      
      // Redirect ไปหน้า login
      navigate("/login");
    } 
    catch (e) {
      // ขั้นตอนที่ 5: แสดง error message
      // เช่น "Token invalid or expired"
      toast.error(e.message);
    } 
    finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="ตั้งรหัสผ่านใหม่" 
      subtitle="กรอกรหัสผ่านใหม่ของคุณ"
    >
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ฟิลด์: รหัสผ่านใหม่ */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Input
        label="รหัสผ่านใหม่"
        type="password"
        value={form.password}
        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
        placeholder="••••••••"
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ฟิลด์: ยืนยันรหัสผ่านใหม่ */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Input
        label="ยืนยันรหัสผ่านใหม่"
        type="password"
        value={form.confirmPassword}
        onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
        placeholder="••••••••"
        // กด Enter เพื่อส่ง
        onKeyDown={e => e.key === "Enter" && submit()}
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Indicator: ตรวจสอบความทำนายของรหัสผ่าน */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {form.confirmPassword && (
        <p className={`text-xs font-semibold mb-2 ${
          form.password === form.confirmPassword 
            ? "text-green-500" 
            : "text-red-500"
        }`}>
          {form.password === form.confirmPassword 
            ? "✓ รหัสผ่านตรงกัน" 
            : "✕ รหัสผ่านไม่ตรงกัน"}
        </p>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ปุ่มตั้งรหัสผ่าน */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <button
        onClick={submit}
        disabled={loading}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl 
                   shadow-lg shadow-red-200 transition-all text-sm disabled:opacity-60 mt-2"
      >
        {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่ →"}
      </button>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Link กลับไปหน้า Login */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="mt-4 text-center text-sm">
        <Link 
          to="/login" 
          className="text-gray-400 hover:text-gray-600 font-medium"
        >
          ← กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    </AuthLayout>
  );
}