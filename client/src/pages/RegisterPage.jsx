/**
 * ═══════════════════════════════════════════════════════════════════
 * RegisterPage.jsx - User Registration Page
 * ═══════════════════════════════════════════════════════════════════
 * 
 * หน้าสมัครสมาชิก - ผู้ใช้ใหม่สร้างบัญชีด้วย ชื่อ, อีเมล, รหัสผ่าน
 * 
 * ฟีเจอร์:
 *   - Frontend validation สำหรับทุกฟิลด์
 *   - Password strength indicator (ระดับความแข็งแกร่ง)
 *   - ยืนยันรหัสผ่าน (ต้องตรงกัน)
 *   - API call ไปยัง /auth/register
 *   - Redirect ไปหน้า /login หลังสมัครสำเร็จ
 * 
 * Validation Rules:
 *   - ชื่อ: ต้องไม่ว่าง, อย่างน้อย 2 ตัวอักษร
 *   - อีเมล: ต้องไม่ว่าง, รูปแบบ email ถูกต้อง
 *   - รหัสผ่าน: ต้องไม่ว่าง, อย่างน้อย 6 ตัวอักษร
 *   - ยืนยันรหัสผ่าน: ต้องตรงกับรหัสผ่าน
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiFetch } from "../api/apiFetch";
import { useValidation } from "../hooks/useValidation";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/Input";

export default function RegisterPage() {
  const navigate = useNavigate();
  
  // useValidation hook สำหรับ validate form
  const { errors, validate } = useValidation();
  
  // State: form ทั้งหมด (ชื่อ, อีเมล, รหัสผ่าน, ยืนยันรหัสผ่าน)
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  
  // State: loading ขณะส่ง API
  const [loading, setLoading] = useState(false);

  /**
   * ═══════════════════════════════════════════════════════════════
   * Validation Rules สำหรับ Register Form
   * ═══════════════════════════════════════════════════════════════
   */
  const rules = {
    name: [
      { required: true, message: "กรุณากรอกชื่อ" },
      { minLength: 2, message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร" },
    ],
    email: [
      { required: true, message: "กรุณากรอกอีเมล" },
      { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "รูปแบบอีเมลไม่ถูกต้อง" },
    ],
    password: [
      { required: true, message: "กรุณากรอกรหัสผ่าน" },
      { minLength: 6, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
    ],
    confirmPassword: [
      { required: true, message: "กรุณายืนยันรหัสผ่าน" },
      { custom: (val, data) => val === data.password, message: "รหัสผ่านไม่ตรงกัน" },
    ],
  };

  /**
   * submit - ส่งฟอร์มสมัครสมาชิก
   * 
   * ขั้นตอน:
   *   1. Validate form ตาม rules
   *   2. ส่ง POST ไปยัง /auth/register ด้วยชื่อ, อีเมล, รหัสผ่าน
   *   3. เมื่อสำเร็จ แสดง toast แล้ว redirect ไปหน้า /login
   *   4. ถ้ามี error แสดง toast error
   */
  const submit = async () => {
    // Validate form ตาม rules ด้านบน
    if (!validate(form, rules)) return;

    setLoading(true);
    try {
      // ส่ง POST ไปยัง /auth/register
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });
      
      // แสดง toast สำเร็จ
      toast.success("สมัครสำเร็จ! กรุณาเข้าสู่ระบบ");
      
      // Redirect ไปหน้า /login
      navigate("/login");
    } 
    catch (e) { 
      // แสดง error message จาก backend
      toast.error(e.message); 
    }
    finally { 
      setLoading(false); 
    }
  };

  /**
   * Err - Component helper สำหรับแสดง error message
   * @param {string} field - ชื่อ field (name, email, password, confirmPassword)
   */
  const Err = ({ field }) => errors[field]
    ? <p className="text-red-500 text-xs font-semibold -mt-3 mb-3">⚠ {errors[field]}</p>
    : null;

  return (
    <AuthLayout 
      title="สมัครสมาชิก" 
      subtitle="สร้างบัญชีเพื่อเริ่มช้อปปิ้ง"
    >
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ฟิลด์: ชื่อ */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Input 
        label="ชื่อ" 
        type="text" 
        value={form.name}
        onChange={e => setForm(p => ({ ...p, name: e.target.value }))} 
        placeholder="ชื่อของคุณ" 
      />
      <Err field="name" />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ฟิลด์: อีเมล */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Input 
        label="อีเมล" 
        type="email" 
        value={form.email}
        onChange={e => setForm(p => ({ ...p, email: e.target.value }))} 
        placeholder="you@example.com" 
      />
      <Err field="email" />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ฟิลด์: รหัสผ่าน */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Input 
        label="รหัสผ่าน" 
        type="password" 
        value={form.password}
        onChange={e => setForm(p => ({ ...p, password: e.target.value }))} 
        placeholder="••••••••" 
      />
      <Err field="password" />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ฟิลด์: ยืนยันรหัสผ่าน */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Input 
        label="ยืนยันรหัสผ่าน" 
        type="password" 
        value={form.confirmPassword}
        onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} 
        placeholder="••••••••" 
      />
      <Err field="confirmPassword" />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Password Strength Indicator (ความแข็งแกร่งรหัสผ่าน) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {form.password && (
        <div className="mb-4 -mt-2">
          {/* Bar graphs แสดงระดับ */}
          <div className="flex gap-1 mb-1">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className={`h-1 flex-1 rounded-full transition-all
                  ${form.password.length >= i * 3
                    ? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-orange-400" : i <= 3 ? "bg-yellow-400" : "bg-green-400"
                    : "bg-gray-200"}`} 
              />
            ))}
          </div>
          
          {/* ข้อความแสดงระดับ */}
          <p className="text-xs text-gray-400">
            {form.password.length < 3 ? "อ่อนมาก" 
              : form.password.length < 6 ? "อ่อน" 
              : form.password.length < 9 ? "ปานกลาง" 
              : "แข็งแกร่ง"}
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ปุ่มสมัคร */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <button 
        onClick={submit} 
        disabled={loading}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl 
                   shadow-lg shadow-red-200 transition-all text-sm disabled:opacity-60 mt-2"
      >
        {loading ? "กำลังสมัคร..." : "สมัครสมาชิก →"}
      </button>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Link ไปหน้า Login */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="mt-4 text-center text-sm">
        <Link 
          to="/login" 
          className="text-red-600 font-bold hover:underline"
        >
          มีบัญชีแล้ว? เข้าสู่ระบบ
        </Link>
      </div>
    </AuthLayout>
  );
}