/**
 * ═══════════════════════════════════════════════════════════════════
 * ForgotPage.jsx - Forgot Password Page
 * ═══════════════════════════════════════════════════════════════════
 * 
 * หน้าส่งขอลิงก์รีเซ็ตรหัสผ่าน
 * ผู้ใช้กรอก email และกดปุ่ม "ส่งลิงก์รีเซ็ต"
 * 
 * ขั้นตอนการทำงาน:
 *   1. ผู้ใช้กรอก email ที่ลงทะเบียนไว้
 *   2. ส่ง POST request ไปยัง /auth/forgot-password
 *   3. Backend ส่ง email พร้อม reset link
 *   4. แสดง toast "ส่งลิงก์รีเซ็ตแล้ว"
 *   5. ให้ user กลับไปหน้า login
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiFetch } from "../api/apiFetch";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/Input";

export default function ForgotPage() {
  // State: email ที่กรอก
  const [email, setEmail] = useState("");
  
  // State: loading ขณะส่ง API
  const [loading, setLoading] = useState(false);

  /**
   * submit - ส่งคำขอรีเซ็ตรหัสผ่าน
   * 
   * ขั้นตอน:
   *   1. ตั้ง loading = true
   *   2. POST email ไปยัง /auth/forgot-password
   *   3. เมื่อสำเร็จ backend ส่ง email
   *   4. แสดง toast สำเร็จ
   *   5. ถ้ามี error แสดง toast error
   */
  const submit = async () => {
    setLoading(true);
    try {
      // ส่ง email ไปยัง backend
      await apiFetch("/auth/forgot-password", { 
        method: "POST", 
        body: JSON.stringify({ email }) 
      });
      
      // แสดง toast สำเร็จ
      toast.success("ส่งลิงก์รีเซ็ตแล้ว (ดูใน Console)");
    } catch (e) { 
      // แสดง error message จาก backend
      toast.error(e.message); 
    }
    finally { 
      setLoading(false); 
    }
  };

  return (
    <AuthLayout 
      title="ลืมรหัสผ่าน" 
      subtitle="กรอกอีเมลเพื่อรับลิงก์รีเซ็ต"
    >
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ฟิลด์ Email */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Input 
        label="อีเมล" 
        type="email" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
        placeholder="you@example.com" 
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ปุ่มส่ง */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <button 
        onClick={submit} 
        disabled={loading}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl 
                   shadow-lg shadow-red-200 transition-all text-sm disabled:opacity-60 mt-2"
      >
        {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ต →"}
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
