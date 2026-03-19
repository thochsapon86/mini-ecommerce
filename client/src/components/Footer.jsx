/**
 * ═══════════════════════════════════════════════════════════════════
 * Footer.jsx - Footer Component
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Component แสดงข้อมูลด้านล่างของเพจ
 * มี 3 ส่วน: โลโก, copyright, และ feature/category icons
 * 
 * Responsive:
 *   - sm (≤640px): จัดเรียงแนวตั้ง (flex-col)
 *   - md+ (>640px): จัดเรียงแนวนอน (flex-row)
 */
export default function Footer() {
  return (
    <footer className="mt-16 border-t-2 border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* ===== ส่วนที่ 1: โลโก + ชื่อแบรนด์ ===== */}
        <div className="flex items-center gap-2">
          {/* โลโก: สี่เหลี่ยมสีแดงพร้อมตัวอักษร "T" */}
          <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-black">T</span>
          </div>
          
          {/* ชื่อแบรนด์: TECHZONE */}
          <span className="font-black text-gray-900">
            TECH<span className="text-red-600">ZONE</span>
          </span>
        </div>

        {/* ===== ส่วนที่ 2: สงวนลิขสิทธิ์ ===== */}
        {/* ข้อความนี้จะอยู่อันดับส่วนกลาง */}
        <p className="text-gray-400 text-sm font-medium">
          © 2025 TECHZONE · อุปกรณ์คอมพิวเตอร์ครบวงจร
        </p>

        {/* ===== ส่วนที่ 3: Categories/Features ===== */}
        {/* แสดงหมวดหมู่สินค้ากลัง emoji */}
        <div className="flex items-center gap-4 text-gray-400 text-sm font-medium">
          <span>🖥️ CPU</span>
          <span>🎮 GPU</span>
          <span>💾 Storage</span>
          <span>⌨️ Peripherals</span>
        </div>
      </div>
    </footer>
  );
}
