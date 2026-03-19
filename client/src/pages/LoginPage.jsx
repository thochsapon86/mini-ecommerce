/**
 * ═══════════════════════════════════════════════════════════════════
 * LoginPage.jsx - User Login Page
 * ═══════════════════════════════════════════════════════════════════
 * 
 * หน้าเข้าสู่ระบบ - ผู้ใช้โปรแกรมฟอร์มเข้าสู่ระบบด้วย email และ password
 * 
 * ฟีเจอร์:
 *   - Frontend validation (email format, required fields)
 *   - API call ไปยัง /auth/login
 *   - บันทึก JWT token ลงใน localStorage ผ่าน AuthContext
 *   - Redirect ไปหน้า /products หลังล็อกอิน
 *   - Link ไปหน้า สมัครสมาชิก และลืมรหัสผ่าน
 * 
 * ขั้นตอนการทำงาน:
 *   1. ผู้ใช้กรอก email และ password
 *   2. Validate form (ไม่ว่างและ email format ถูกต้อง)
 *   3. ส่ง POST request ไปยัง /auth/login
 *   4. ได้ JWT token จาก response
 *   5. บันทึก token ด้วย login() function
 *   6. Redirect ไปยังหน้า /products
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
  // ดึง login function จาก AuthContext
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // useValidation hook สำหรับ validate form
  const { errors, validate } = useValidation();
  
  // State ของฟอร์ม: email, password
  const [form, setForm] = useState({ email: "", password: "" });
  
  // State สำหรับแสดง loading (ขณะส่ง API)
  const [loading, setLoading] = useState(false);

  /**
   * ═══════════════════════════════════════════════════════════════
   * Validation Rules สำหรับ Login Form
   * ═══════════════════════════════════════════════════════════════
   * 
   * Email:
   *   - required: อีเมลต้องไม่ว่าง
   *   - pattern: ต้องเป็น email format (xxx@xxx.xxx)
   * 
   * Password:
   *   - required: รหัสผ่านต้องไม่ว่าง
   */
  const rules = {
    email: [
      { required: true, message: "กรุณากรอกอีเมล" },
      { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "รูปแบบอีเมลไม่ถูกต้อง" },
    ],
    password: [
      { required: true, message: "กรุณากรอกรหัสผ่าน" },
    ],
  };

  /**
   * submit - ฟังก์ชันส่งฟอร์มเข้าสู่ระบบ
   * 
   * ขั้นตอน:
   *   1. Validate form ตาม rules
   *   2. ถ้า invalid จะ return ทันที
   *   3. ถ้า valid ส่ง POST request ไปยัง /auth/login
   *   4. เมื่อสำเร็จได้ JWT token
   *   5. เรียก login() เพื่อบันทึก token
   *   6. แสดง toast สำเร็จ
   *   7. Redirect ไปหน้า /products
   *   8. ถ้ามี error แสดง toast error
   */
  const submit = async () => {
    // ขั้นตอนที่ 1: Validate form กับ rules
    if (!validate(form, rules)) return;

    // ขั้นตอนที่ 2: ตั้ง loading = true เพื่อ disable ปุ่ม
    setLoading(true);
    try {
      // ขั้นตอนที่ 3: ส่ง POST request ไปยัง /auth/login
      const data = await apiFetch("/auth/login", { 
        method: "POST", 
        body: JSON.stringify(form) 
      });
      
      // ขั้นตอนที่ 4: บันทึก token ด้วย login() function
      login(data.token);
      
      // ขั้นตอนที่ 5: แสดง toast สำเร็จ
      toast.success("เข้าสู่ระบบสำเร็จ!");
      
      // ขั้นตอนที่ 6: Redirect ไปหน้า /products
      navigate("/products");
    } catch (e) {
      // ถ้ามี error แสดง toast error
      toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally { 
      // ตั้ง loading = false เพื่อ enable ปุ่มใหม่
      setLoading(false); 
    }
  };

  return (
    <AuthLayout title="เข้าสู่ระบบ" subtitle="ร้านค้าอุปกรณ์คอมพิวเตอร์ครบวงจร">
      {/* ═════════════════════════════════════════════════════════== */}
      {/* ฟิลด์ Email - พร้อม error message */}
      {/* ═════════════════════════════════════════════════════════== */}
      <div className="mb-4">
        <Input 
          label="อีเมล" 
          type="email" 
          value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="you@example.com" 
        />
        {/* แสดง error message ถ้ามี error */}
        {errors.email && (
          <p className="text-red-500 text-xs font-semibold -mt-3 mb-3">
            ⚠ {errors.email}
          </p>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════== */}
      {/* ฟิลด์ Password - พร้อม error message */}
      {/* ═════════════════════════════════════════════════════════== */}
      <div className="mb-2">
        <Input 
          label="รหัสผ่าน" 
          type="password" 
          value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          placeholder="••••••••"
          // ถ้ากด Enter ให้ส่งฟอร์ม
          onKeyDown={e => e.key === "Enter" && submit()} 
        />
        {/* แสดง error message ถ้ามี error */}
        {errors.password && (
          <p className="text-red-500 text-xs font-semibold -mt-3 mb-3">
            ⚠ {errors.password}
          </p>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════== */}
      {/* ปุ่มส่งฟอร์ม */}
      {/* ═════════════════════════════════════════════════════════== */}
      <button 
        onClick={submit} 
        disabled={loading}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl 
                   shadow-lg shadow-red-200 transition-all text-sm disabled:opacity-60 mt-2"
      >
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ →"}
      </button>

      {/* ═════════════════════════════════════════════════════════== */}
      {/* Links: สมัครสมาชิก, ลืมรหัสผ่าน */}
      {/* ═════════════════════════════════════════════════════════== */}
      <div className="mt-5 flex items-center justify-between text-sm">
        <Link to="/register" className="text-red-600 font-bold hover:underline">
          สมัครสมาชิก
        </Link>
        <Link to="/forgot" className="text-gray-400 hover:text-gray-600 font-medium">
          ลืมรหัสผ่าน?
        </Link>
      </div>
    </AuthLayout>
  );
}