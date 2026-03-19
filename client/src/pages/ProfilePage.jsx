/**
 * ═══════════════════════════════════════════════════════════════════
 * ProfilePage.jsx - User Profile Page
 * ═══════════════════════════════════════════════════════════════════
 * 
 * หน้าโปรไฟล์ผู้ใช้ - ดูและแก้ไขข้อมูลส่วนตัว
 * 
 * ฟีเจอร์:
 *   - แสดงข้อมูลโปรไฟล์: ชื่อ, อีเมล, role (User/Owner/Admin)
 *   - แก้ไขชื่อ
 *   - เปลี่ยนรหัสผ่าน
 *   - Avatar ที่แสดงอักษรแรกของชื่อ
 * 
 * ขั้นตอนการทำงาน:
 *   1. Component mount -> เรียก load() เพื่อ fetch profile
 *   2. แสดง loading spinner ขณะโหลด
 *   3. เมื่อสำเร็จ แสดงข้อมูลและ form สำหรับแก้ไข
 *   4. ผู้ใช้แก้ไขและกดปุ่ม "บันทึก"
 *   5. ส่ง PUT request ไปยัง /users/profile
 *   6. Reload ข้อมูล โปรไฟล์
 */

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import Input from "../components/Input";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ProfilePage() {
  // ดึง token จาก AuthContext
  const { token } = useAuth();
  
  // State: ข้อมูล profile ที่ดึงมาจาก backend
  const [profile, setProfile] = useState(null);
  
  // State: ฟอร์มสำหรับแก้ไข (ชื่อและรหัสผ่าน)
  const [form, setForm] = useState({ name: "", password: "" });
  
  // State: loading ขณะ fetch profile
  const [loading, setLoading] = useState(true);
  
  // State: saving ขณะส่ง update
  const [saving, setSaving] = useState(false);

  /**
   * useEffect - เรียก load() เมื่อ component mount
   */
  useEffect(() => { 
    load(); 
  }, []);

  /**
   * load - ดึงข้อมูล profile จาก backend
   * 
   * ขั้นตอน:
   *   1. ตั้ง loading = true
   *   2. GET /users/profile
   *   3. เมื่อสำเร็จ setProfile และ setForm ด้วยข้อมูลที่ได้
   *   4. ถ้า error แสดง toast error
   *   5. ตั้ง loading = false
   */
  const load = async () => {
    try { 
      const d = await apiFetch("/users/profile", {}, token);  // เรียก API ด้วย token
      setProfile(d);  // บันทึกข้อมูล profile
      setForm({ name: d.name, password: "" });  // ตั้ง form ด้วยชื่อปัจจุบัน
    }
    catch (e) { 
      toast.error(e.message); 
    }
    finally { 
      setLoading(false); 
    }
  };

  /**
   * update - บันทึกการเปลี่ยนแปลง profile
   * 
   * ขั้นตอน:
   *   1. ตั้ง saving = true
   *   2. สร้าง body obj ด้วย name อย่างน้อย
   *   3. ถ้ามี password ใหม่ให้รวมเข้าไปด้วย
   *   4. PUT /users/profile พร้อม body
   *   5. เมื่อสำเร็จ แสดง toast, เคลียร์ password field, reload data
   *   6. ถ้ามี error แสดง toast error
   */
  const update = async () => {
    setSaving(true);
    try {
      // สร้าง body เพื่อส่งไปยัง backend
      const body = { name: form.name };
      
      // ถ้ามีการเปลี่ยนรหัสผ่าน ให้เพิ่มเข้าไป
      if (form.password) body.password = form.password;
      
      // ส่ง PUT request
      await apiFetch("/users/profile", { 
        method: "PUT", 
        body: JSON.stringify(body) 
      }, token);
      
      // แสดง toast สำเร็จ
      toast.success("อัปเดตโปรไฟล์สำเร็จ!");
      
      // เคลียร์ password field
      setForm(p => ({ ...p, password: "" }));
      
      // Reload ข้อมูล profile
      load();
    } 
    catch (e) { 
      toast.error(e.message); 
    }
    finally { 
      setSaving(false); 
    }
  };

  // ถ้ายังโหลด แสดง loading spinner
  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-6 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* หัวข้อ */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <h1 className="text-3xl font-black text-gray-900 mb-8">โปรไฟล์ของฉัน</h1>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Card: ข้อมูล Profile */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-red-600 to-rose-600 rounded-3xl p-6 mb-6 text-white shadow-2xl shadow-red-200">
        <div className="flex items-center gap-4">
          {/* Avatar: อักษรแรกของชื่อ */}
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center 
                          text-3xl font-black text-white shadow-inner">
            {profile?.name?.[0]?.toUpperCase()}
          </div>
          
          {/* ข้อมูล: ชื่อ, อีเมล, role */}
          <div>
            <p className="font-black text-xl">{profile?.name}</p>
            <p className="text-red-200 text-sm font-medium">{profile?.email}</p>
            {/* Role badge*/}
            <span className="inline-block mt-1 bg-white/20 text-white text-xs font-black px-2 py-0.5 
                            rounded-full uppercase tracking-wider">
              {profile?.role}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Form: แก้ไขข้อมูล */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
        {/* หัวข้อ Form */}
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2">
          <span>✏️</span> แก้ไขข้อมูล
        </h2>

        {/* ฟิลด์: ชื่อ */}
        <Input 
          label="ชื่อ" 
          value={form.name} 
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))} 
        />

        {/* ฟิลด์: รหัสผ่านใหม่ */}
        <Input 
          label="รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" 
          type="password" 
          value={form.password} 
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))} 
          placeholder="••••••••" 
        />

        {/* ปุ่มบันทึก */}
        <button 
          onClick={update} 
          disabled={saving}
          className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white 
                     font-bold rounded-xl text-sm transition-all shadow-md shadow-red-200 mt-2"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
        </button>
      </div>
    </div>
  );
}
