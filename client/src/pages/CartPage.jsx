import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import LoadingSpinner from "../components/LoadingSpinner";

export default function CartPage({ setCartCount }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await apiFetch("/cart", {}, token);
      setCart(d); setCartCount(d?.items?.length || 0);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const remove = async (productId) => {
    try { await apiFetch("/cart/remove", { method: "POST", body: JSON.stringify({ productId }) }, token); toast.success("ลบออกแล้ว"); load(); }
    catch (e) { toast.error(e.message); }
  };

  const clear = async () => {
    if (!confirm("ล้างตะกร้าทั้งหมด?")) return;
    try { await apiFetch("/cart/clear", { method: "POST" }, token); toast.success("ล้างตะกร้าแล้ว"); load(); }
    catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  const items = cart?.items || [];
  const total = items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">ตะกร้าสินค้า</h1>
          <p className="text-gray-400 text-sm mt-1">{items.length} รายการ</p>
        </div>
        {items.length > 0 && (
          <button onClick={clear} className="text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-all">ล้างตะกร้า</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-8xl mb-6">🛒</div>
          <p className="text-gray-400 text-lg font-semibold mb-6">ตะกร้าว่างเปล่า</p>
          <button onClick={() => navigate("/products")} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all">
            เริ่มช้อปปิ้ง →
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 mb-6">
            {items.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl border-2 border-gray-100 p-4 flex items-center gap-4 hover:border-red-100 transition-colors">
                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.product?.image ? <img src={item.product.image} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl">🖥️</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 truncate">{item.product?.name || "สินค้า"}</p>
                  <p className="text-sm text-gray-400 font-medium">฿{item.product?.price?.toLocaleString()} × {item.quantity} ชิ้น</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-black text-red-600 text-lg">฿{((item.product?.price || 0) * item.quantity).toLocaleString()}</span>
                  <button onClick={() => remove(item.product?._id)} className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center text-sm transition-colors font-bold">✕</button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-400 text-sm font-medium">ยอดรวมทั้งหมด</p>
                <p className="text-4xl font-black text-gray-900">฿{total.toLocaleString()}</p>
              </div>
              <p className="text-sm text-gray-400">{items.length} รายการ</p>
            </div>
            <button onClick={() => navigate("/orders")} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-200 transition-all text-base flex items-center justify-center gap-2">
              ดำเนินการสั่งซื้อ →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
