/**
 * ═══════════════════════════════════════════════════════════════════
 * Input.jsx - Reusable Input Component
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Wrapper สำหรับ HTML input element พร้อมเลเบลและสไตล์ Tailwind
 * ใช้ได้กับทุก input type (text, email, password, number, etc.)
 * 
 * @param {string} label - ข้อความ label ด้านบน input
 * @param {object} props - ส่ง props ที่เหลือไปยัง input element
 *                          เช่น type, value, onChange, placeholder
 * 
 * ตัวอย่าง:
 *   <Input 
 *     label="อีเมล" 
 *     type="email" 
 *     value={email}
 *     onChange={(e) => setEmail(e.target.value)}
 *     placeholder="your@email.com"
 *   />
 */
export default function Input({ label, ...props }) {
  return (
    <div className="mb-4">
      {/* ===== ส่วน Label ===== */}
      {label && (
        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">
          {label}
        </label>
      )}
      
      {/* ===== ส่วน Input ===== */}
      <input
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 
                   focus:border-red-500 outline-none text-sm text-gray-800 
                   font-medium transition-colors bg-gray-50 focus:bg-white 
                   placeholder-gray-400"
        {...props}  // ส่ง type, value, onChange, placeholder, etc.
      />
    </div>
  );
}
