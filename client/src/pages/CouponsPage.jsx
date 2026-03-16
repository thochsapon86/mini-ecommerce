import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import Modal from "../components/Modal";
import Input from "../components/Input";
import LoadingSpinner from "../components/LoadingSpinner";

export default function CouponsPage() {
  const { token, user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: "", discountPercent: "", expiresAt: "" });

  const canCreate = user?.role === "admin" || user?.role === "owner";

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const d = await apiFetch("/coupons"); setCoupons(d); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const create = async () => {
    try {
      await apiFetch("/coupons", { method: "POST", body: JSON.stringify(form) }, token);
      toast.success("สร้างคูปองสำเร็จ!"); setShowModal(false); load();
    } catch (e) { toast.error(e.message); }
  };

  const claim = async (id) => {
    try { await apiFetch(`/coupons/${id}/claim`, { method: "POST" }, token); toast.success("รับคูปองสำเร็จ! 🎫"); load(); }
    catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">คูปองส่วนลด</h1>
          <p className="text-gray-400 text-sm mt-1">รับคูปองเพื่อประหยัดค่าใช้จ่าย</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowModal(true)} className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-200">
            + สร้างคูปอง
          </button>
        )}
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-6xl mb-4">🎫</div>
          <p className="font-semibold text-lg">ยังไม่มีคูปอง</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => {
            const claimed = c.claimedUsers?.includes(user?.id);
            const expired = c.expiresAt && new Date() > new Date(c.expiresAt);
            return (
              <div key={c._id} className={`relative rounded-2xl border-2 p-5 overflow-hidden transition-all
                ${expired ? "border-gray-200 bg-gray-50 opacity-60" : "border-red-100 bg-gradient-to-br from-white to-red-50 hover:border-red-300 hover:shadow-lg hover:shadow-red-100"}`}>
                <div className="absolute left-0 top-4 bottom-4 w-1 border-l-2 border-dashed border-red-200" />
                <div className="pl-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-red-600 text-white font-black text-xl px-3 py-1 rounded-xl tracking-widest shadow-md shadow-red-200">{c.code}</div>
                    <div className="text-right">
                      <span className="text-4xl font-black text-red-600 leading-none">{c.discountPercent}</span>
                      <span className="text-red-400 font-bold text-lg">%</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs font-medium mb-4">
                    {expired ? "หมดอายุ" : c.expiresAt ? `หมดอายุ: ${new Date(c.expiresAt).toLocaleDateString("th-TH")}` : "ไม่มีวันหมดอายุ"}
                  </p>
                  {expired ? (
                    <span className="text-sm text-gray-400 font-bold">หมดอายุแล้ว</span>
                  ) : claimed ? (
                    <span className="flex items-center gap-1 text-sm text-green-600 font-bold">✓ รับแล้ว</span>
                  ) : (
                    <button onClick={() => claim(c._id)} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-red-200">
                      รับคูปอง
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="สร้างคูปองใหม่">
        <Input label="โค้ดคูปอง" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="เช่น SAVE20" />
        <Input label="ส่วนลด (%)" type="number" value={form.discountPercent} onChange={e => setForm(p => ({ ...p, discountPercent: e.target.value }))} placeholder="20" />
        <Input label="วันหมดอายุ" type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
        <div className="flex gap-3 mt-2">
          <button onClick={create} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all">สร้างคูปอง</button>
          <button onClick={() => setShowModal(false)} className="px-5 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50">ยกเลิก</button>
        </div>
      </Modal>
    </div>
  );
}
