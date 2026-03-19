/**
 * ═══════════════════════════════════════════════════════════════════
 * LoadingSpinner.jsx - Loading Indicator Component
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Component แสดงสัญญาณโหลด (loading indicator)
 * ใช้ CSS animation ในการหมุน วงกลม
 * 
 * ตัวอย่าง:
 *   {loading && <LoadingSpinner />}
 * 
 *   const [loading, setLoading] = useState(false);
 *   <LoadingSpinner />
 */
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      {/* ===== วงกลมหมุน ===== */}
      {/* 
        border-4: เส้นขอบหนา 4px
        border-red-100: สีขอบเทาอ่อน
        border-t-red-600: ส่วนบนเป็นสีแดง (จะเห็นการหมุน)
        rounded-full: เป็นวงกลม
        animate-spin: CSS animation หมุนอย่างต่อเนื่อง
      */}
      <div className="w-10 h-10 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
    </div>
  );
}
