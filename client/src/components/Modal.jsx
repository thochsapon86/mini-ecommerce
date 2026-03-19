/**
 * ═══════════════════════════════════════════════════════════════════
 * Modal.jsx - Generic Modal Component
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Component modal (pop-up) ทั่วไปใช้ได้กับทุกเนื้อหา
 * ปิดได้โดยกดปุ่มปิด หรือคลิกพื้นหลัง
 * 
 * @param {boolean} open - ว่าต้อง display modal หรือไม่
 * @param {function} onClose - ฟังก์ชันเมื่อ user ปิด modal
 * @param {string} title - หัวเรื่องของ modal
 * @param {React.ReactNode} children - เนื้อหา (form, content, etc.)
 * 
 * ตัวอย่าง:
 *   const [isOpen, setIsOpen] = useState(false);
 *   
 *   <button onClick={() => setIsOpen(true)}>Open Modal</button>
 *   
 *   <Modal 
 *     open={isOpen}
 *     onClose={() => setIsOpen(false)}
 *     title="Modal Title"
 *   >
 *     <p>Modal Content</p>
 *   </Modal>
 */
export default function Modal({ open, onClose, title, children }) {
  // ถ้า open = false จะไม่แสดง modal เลย
  if (!open) return null;

  return (
    <>
      {/* ===== พื้นหลัง (Overlay) ===== */}
      {/* 
        fixed inset-0: ปิด modal ทั้งหน้าจอ
        z-50: อยู่เหนือ element ทั้งหมด
        bg-black/50: สีดำโปร่งแสง 50%
        backdrop-blur-sm: เบลอพื้นหลัง
        onClick={onClose}: ปิด modal เมื่อคลิกพื้นหลัง
      */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* ===== กล่อง Modal ===== */}
        {/* 
          e.stopPropagation(): หยุดการคลิกเพื่อไม่ให้ปิด modal
          (ถ้าคลิกข้างใน modal จะไม่ปิด)
        */}
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "popIn 0.25s ease" }}
        >
          {/* ===== ส่วน Header: ชื่อ + ปุ่มปิด ===== */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
            {/* ชื่อเรื่อง */}
            <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
            
            {/* ปุ่มปิด (X) */}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 
                         text-gray-400 hover:text-gray-700 transition-colors text-lg font-bold"
            >
              ✕
            </button>
          </div>

          {/* ===== ส่วน Content ===== */}
          <div className="px-7 py-6">{children}</div>
        </div>
      </div>
    </>
  );
}
