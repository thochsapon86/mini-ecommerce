import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import LoadingSpinner from "../components/LoadingSpinner";

export default function PaymentsPage({ initialAmount, setCartCount }) {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(initialAmount || "");
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const d = await apiFetch("/payments/my", {}, token); setPayments(d); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const create = async () => {
    setCreating(true);
    try {
      await apiFetch("/payments", { method: "POST", body: JSON.stringify({ amount: Number(amount) }) }, token);
      toast.success("สร้าง payment สำเร็จ");
      setAmount(""); load();
    } catch (e) { toast.error(e.message); }
    finally { setCreating(false); }
  };

  const pay = async (id) => {
    try {
      await apiFetch(`/payments/${id}/pay`, { method: "POST" }, token);
      toast.success("ชำระเงินสำเร็จ! ✅");
      setCartCount(0);
      load();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-8">การชำระเงิน</h1>

      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-6">
        <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2"><span>💳</span> สร้าง Payment ใหม่</h2>
        <div className="flex gap-3">
          <input
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm font-medium bg-gray-50"
            type="number" placeholder="จำนวนเงิน (฿)" value={amount} onChange={e => setAmount(e.target.value)}
          />
          <button onClick={create} disabled={creating || !amount}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-200 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-red-200">
            {creating ? "..." : "สร้าง"}
          </button>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-4">💳</div>
          <p className="font-semibold">ยังไม่มีประวัติการชำระเงิน</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl border-2 border-gray-100 p-5 flex items-center justify-between hover:border-red-100 transition-colors">
              <div>
                <p className="font-black text-gray-900 text-xl">฿{p.amount?.toLocaleString()}</p>
                <p className="text-gray-400 text-xs mt-1 font-mono">{p._id}</p>
                {p.transactionId && <p className="text-green-600 text-xs font-bold mt-1">✓ {p.transactionId}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-black px-3 py-1.5 rounded-full ${p.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {p.status === "paid" ? "✓ ชำระแล้ว" : "⏳ รอชำระ"}
                </span>
                {p.status === "pending" && (
                  <button onClick={() => pay(p._id)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-all">
                    ชำระเงิน
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
