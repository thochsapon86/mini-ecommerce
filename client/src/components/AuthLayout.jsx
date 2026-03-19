/**
 * ═══════════════════════════════════════════════════════════════════
 * AuthLayout.jsx - Layout Component สำหรับหน้า Authentication
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Component layout สำเร็จรูป สำหรับหน้า login, register, forgot password
 * จัดเตรียมพื้นหลัง gradient, ตกแต่ง UI, และ animation
 * 
 * ส่วนประกอบ:
 *   1. Background gradient - ลาด สีจากเทาไปแดง
 *   2. Blur effect - วงกลมสีเบลอตามพื้นหลัง (decoration)
 *   3. Header - โลโก TECHZONE
 *   4. Main card - กล่องขาว ใส่ form ต่างๆ
 * 
 * @param {React.ReactNode} children - Form content ที่ต้องการแสดง
 * @param {string} title - ชื่อเรื่องของหน้า เช่น "เข้าสู่ระบบ"
 * @param {string} subtitle - คำอธิบายเพิ่มเติม
 * 
 * ตัวอย่าง:
 *   <AuthLayout title="เข้าสู่ระบบ" subtitle="ใส่อีเมลและรหัสผ่าน">
 *     <LoginForm />
 *   </AuthLayout>
 */
export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center px-4">
      {/* ===== ส่วนตกแต่ง: Blur elements ในพื้นหลัง ===== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* วงกลมสีแดงอ่อน ที่มุมบนขวา (animation ตกแต่ง) */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-100 rounded-full opacity-40 blur-3xl" />
        
        {/* วงกลมสีแดงอ่อนกว่า ที่มุมล่างซ้าย (animation ตกแต่ง) */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-50 rounded-full opacity-60 blur-3xl" />
      </div>

      {/* ===== ส่วนเนื้อหา: Logo + Card ===== */}
      {/* relative ทำให้ card อยู่ด้านบน (ไม่ซ่อน passive blur elements) */}
      <div className="relative w-full max-w-md" style={{ animation: "popIn 0.3s ease" }}>
        {/* ===== ส่วน Header: โลโก + ชื่อแบรนด์ ===== */}
        <div className="text-center mb-8">
          {/* โลโก: ตัวอักษร "T" ในกล่องสีแดง */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl shadow-xl shadow-red-200 mb-4">
            <span className="text-white text-3xl font-black">T</span>
          </div>
          
          {/* ชื่อแบรนด์: TECHZONE */}
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            TECH<span className="text-red-600">ZONE</span>
          </h1>
          
          {/* คำอธิบาย */}
          <p className="text-gray-500 text-sm mt-1 font-medium">{subtitle}</p>
        </div>

        {/* ===== ส่วน Card: ฟอร์ม ===== */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 border border-gray-100 p-8">
          {/* ชื่อเรื่องของฟอร์ม */}
          <h2 className="text-2xl font-black text-gray-900 mb-6">{title}</h2>
          
          {/* Content: ฟอร์ม/input ต่างๆ ที่ส่งมา */}
          {children}
        </div>
      </div>
    </div>
  );
}
