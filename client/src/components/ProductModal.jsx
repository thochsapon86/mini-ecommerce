/**
 * ═══════════════════════════════════════════════════════════════════
 * ProductModal.jsx - Product Detail Modal Component
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Modal แสดงรายละเอียดสินค้า
 * มีรูปสินค้า, ราคา, ส่วนหญ่า, ข้อมูลผู้ขาย, ปุ่มเพิ่มตะกร้า
 * 
 * @param {object} product - ข้อมูลสินค้า
 *   {
 *     _id: string
 *     name: string
 *     price: number
 *     description: string
 *     image: string (URL)
 *     stock: number
 *     createdBy: { name: string, email: string }
 *   }
 * @param {function} onClose - ฟังก์ชันปิด modal
 * @param {function} onAddCart - ฟังก์ชันเพิ่มสินค้าลงตะกร้า
 * 
 * ตัวอย่าง:
 *   <ProductModal 
 *     product={selectedProduct}
 *     onClose={() => setSelected(null)}
 *     onAddCart={(productId) => addProductToCart(productId)}
 *   />
 */
export default function ProductModal({ product, onClose, onAddCart }) {
  // ถ้าไม่มี product อย่าแสดง modal
  if (!product) return null;

  return (
    <>
      {/* ===== พื้นหลัง (Overlay) ===== */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* ===== กล่อง Modal (Product Detail) ===== */}
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "popIn 0.25s ease" }}
        >
          {/* ===== ส่วนรูปสินค้า ===== */}
          <div className="relative h-72 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
            {/* รูปสินค้า หรือ emoji ถ้าไม่มีรูป */}
            {product.image
              ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              : <span className="text-9xl opacity-20">🖥️</span>
            }
            
            {/* ===== ป้ายว่าง/หมดสต็อก ===== */}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <span className="bg-red-100 text-red-600 font-black text-lg px-5 py-2 rounded-full">
                  หมดสต็อก
                </span>
              </div>
            )}
            
            {/* ===== ข้อเตือน: เหลือน้อย (1-5 ชิ้น) ===== */}
            {product.stock > 0 && product.stock <= 5 && (
              <div className="absolute top-4 left-4">
                <span className="bg-orange-100 text-orange-600 font-bold text-sm px-3 py-1 rounded-full">
                  เหลือน้อย!
                </span>
              </div>
            )}
            
            {/* ===== ปุ่มปิด ===== */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center 
                         shadow-lg text-gray-500 hover:text-gray-800 font-bold text-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* ===== ส่วนรายละเอียด ===== */}
          <div className="p-8">
            
            {/* ← ชื่อและสถานะส่วนหญ่า ← */}
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-2xl font-black text-gray-900 leading-tight flex-1 mr-4">
                {product.name}
              </h2>
              
              {/* Badge: สถานะส่วนหญ่า */}
              <span className={`flex-shrink-0 text-xs font-black px-3 py-1.5 rounded-full
                ${product.stock > 5 ? "bg-green-100 text-green-700" 
                  : product.stock > 0 ? "bg-orange-100 text-orange-700" 
                  : "bg-red-100 text-red-600"}`}>
                {product.stock > 0 ? `เหลือ ${product.stock} ชิ้น` : "หมดสต็อก"}
              </span>
            </div>

            {/* ← คำอธิบายสินค้า ← */}
            <p className="text-gray-500 text-sm leading-relaxed mb-4 min-h-12">
              {product.description || "ไม่มีคำอธิบาย"}
            </p>

            {/* ← Grid: ราคา + ส่วนหญ่า ← */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Box: ราคา */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold mb-1">ราคา</p>
                <p className="text-2xl font-black text-red-600">
                  ฿{product.price?.toLocaleString()}
                </p>
              </div>
              
              {/* Box: ส่วนหญ่า */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold mb-1">สต็อกคงเหลือ</p>
                <p className="text-2xl font-black text-gray-900">{product.stock} ชิ้น</p>
              </div>
            </div>

            {/* ← ข้อมูลผู้ขาย ← */}
            {product.createdBy && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-3 mb-6">
                {/* Avatar: อักษรแรก */}
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 
                               flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {product.createdBy?.name?.[0]?.toUpperCase()}
                </div>
                
                {/* ข้อมูล: ชื่อ + อีเมล */}
                <div>
                  <p className="text-xs text-gray-400 font-semibold">ผู้วางขาย</p>
                  <p className="text-sm font-black text-gray-900">{product.createdBy?.name}</p>
                  <p className="text-xs text-gray-400">{product.createdBy?.email}</p>
                </div>
                
                {/* Badge: Seller */}
                <span className="ml-auto text-xs bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full">
                  Seller
                </span>
              </div>
            )}

            {/* ← ปุ่มกระทำ: เพิ่มตะกร้า + ปิด ← */}
            <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
              {/* ปุ่มเพิ่มตะกร้า */}
              <button
                onClick={() => { onAddCart(product._id); onClose(); }}
                disabled={product.stock === 0}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 
                           text-white font-black rounded-2xl text-base transition-all shadow-lg shadow-red-200 
                           flex items-center justify-center gap-2"
              >
                <span>🛒</span> เพิ่มลงตะกร้า
              </button>
              
              {/* ปุ่มปิด */}
              <button
                onClick={onClose}
                className="px-6 py-4 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl text-base 
                           hover:bg-gray-50 transition-all"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
