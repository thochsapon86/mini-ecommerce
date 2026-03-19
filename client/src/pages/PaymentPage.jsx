/**
 * PaymentPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * หน้าชำระเงิน รองรับทั้งชำระแบบจำลองและแนบสลิปการโอนเงิน
 *
 * Features:
 *   - สร้าง payment ใหม่พร้อมจำนวนเงิน
 *   - ชำระแบบ Mock (จำลอง)
 *   - แนบรูปสลิปการโอนเงิน (upload ไฟล์รูป)
 *   - แสดงรูปสลิปที่แนบไว้
 *   - แสดงประวัติการชำระเงินทั้งหมด
 */

import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import LoadingSpinner from "../components/LoadingSpinner";

const API_BASE = "http://localhost:5000";

export default function PaymentsPage({ initialAmount, setCartCount }) {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(initialAmount || "");
  const [creating, setCreating] = useState(false);

  // state สำหรับ upload slip
  const [uploadingId, setUploadingId] = useState(null); // payment id ที่กำลัง upload
  const [slipPreview, setSlipPreview] = useState({}); // preview รูป slip ก่อน upload { paymentId: url }
  const [slipFile, setSlipFile] = useState({}); // ไฟล์จริง { paymentId: File }
  const fileInputRefs = useRef({}); // ref สำหรับ input file แต่ละ payment

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await apiFetch("/payments/my", {}, token);
      setPayments(d);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  // สร้าง payment ใหม่
  const create = async () => {
    setCreating(true);
    try {
      await apiFetch("/payments", {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount) })
      }, token);
      toast.success("สร้าง payment สำเร็จ");
      setAmount("");
      load();
    } catch (e) { toast.error(e.message); }
    finally { setCreating(false); }
  };

  // ชำระแบบ Mock
  const payMock = async (id) => {
    try {
      await apiFetch(`/payments/${id}/pay`, { method: "POST" }, token);
      toast.success("ชำระเงินสำเร็จ! ✅");
      setCartCount(0);
      load();
    } catch (e) { toast.error(e.message); }
  };

  // เลือกไฟล์ slip — แสดง preview ก่อน upload จริง
  const handleSlipSelect = (paymentId, file) => {
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith("image/")) {
      toast.error("รองรับเฉพาะไฟล์รูปภาพเท่านั้น");
      return;
    }

    // ตรวจสอบขนาดไฟล์ไม่เกิน 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    // สร้าง URL สำหรับ preview
    const previewUrl = URL.createObjectURL(file);
    setSlipPreview(prev => ({ ...prev, [paymentId]: previewUrl }));
    setSlipFile(prev => ({ ...prev, [paymentId]: file }));
  };

  // Upload slip จริง
  const uploadSlip = async (paymentId) => {
    const file = slipFile[paymentId];
    if (!file) {
      toast.error("กรุณาเลือกรูปสลิปก่อน");
      return;
    }

    setUploadingId(paymentId);
    try {
      // ใช้ FormData สำหรับ upload ไฟล์
      const formData = new FormData();
      formData.append("slip", file); // "slip" ต้องตรงกับ upload.single("slip") ใน backend

      const res = await fetch(`${API_BASE}/api/payments/${paymentId}/slip`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        // ไม่ใส่ Content-Type เพราะ FormData จะจัดการเอง
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      toast.success("แนบสลิปสำเร็จ! ✅");
      setCartCount(0);

      // ล้าง preview หลัง upload สำเร็จ
      setSlipPreview(prev => { const n = { ...prev }; delete n[paymentId]; return n; });
      setSlipFile(prev => { const n = { ...prev }; delete n[paymentId]; return n; });

      load();
    } catch (e) { toast.error(e.message); }
    finally { setUploadingId(null); }
  };

  // ยกเลิกการเลือก slip
  const cancelSlip = (paymentId) => {
    setSlipPreview(prev => { const n = { ...prev }; delete n[paymentId]; return n; });
    setSlipFile(prev => { const n = { ...prev }; delete n[paymentId]; return n; });
    if (fileInputRefs.current[paymentId]) {
      fileInputRefs.current[paymentId].value = "";
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-8">การชำระเงิน</h1>

      {/* ── สร้าง Payment ใหม่ ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-6">
        <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
          <span>💳</span> สร้าง Payment ใหม่
        </h2>
        <div className="flex gap-3">
          <input
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm font-medium bg-gray-50"
            type="number"
            placeholder="จำนวนเงิน (฿)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <button
            onClick={create}
            disabled={creating || !amount}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-200 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-red-200"
          >
            {creating ? "..." : "สร้าง"}
          </button>
        </div>
      </div>

      {/* ── รายการ Payment ──────────────────────────────────── */}
      {payments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-4">💳</div>
          <p className="font-semibold">ยังไม่มีประวัติการชำระเงิน</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {payments.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-red-100 transition-colors">

              {/* ข้อมูล payment */}
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-black text-gray-900 text-xl">฿{p.amount?.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs mt-1 font-mono">{p._id}</p>
                  {p.transactionId && (
                    <p className="text-green-600 text-xs font-bold mt-1">✓ {p.transactionId}</p>
                  )}
                </div>
                <span className={`text-xs font-black px-3 py-1.5 rounded-full
                  ${p.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {p.status === "paid" ? "✓ ชำระแล้ว" : "⏳ รอชำระ"}
                </span>
              </div>

              {/* แสดงสลิปที่แนบไว้แล้ว */}
              {p.slipImage && (
                <div className="px-5 pb-4">
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">สลิปการโอนเงิน</p>
                  <img
                    src={`${API_BASE}${p.slipImage}`}
                    alt="slip"
                    className="w-full max-w-xs rounded-xl border-2 border-gray-100 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(`${API_BASE}${p.slipImage}`, "_blank")}
                  />
                </div>
              )}

              {/* ส่วนชำระเงิน — แสดงเฉพาะ pending */}
              {p.status === "pending" && (
                <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                  <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">วิธีชำระเงิน</p>

                  <div className="grid grid-cols-2 gap-3">

                    {/* ── วิธีที่ 1: Mock Payment ── */}
                    <button
                      onClick={() => payMock(p._id)}
                      className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 rounded-xl transition-all group"
                    >
                      <span className="text-2xl">⚡</span>
                      <span className="text-sm font-bold text-gray-700 group-hover:text-red-600">ชำระแบบจำลอง</span>
                      <span className="text-xs text-gray-400">Mock Payment</span>
                    </button>

                    {/* ── วิธีที่ 2: แนบสลิป ── */}
                    <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 hover:border-red-300 rounded-xl transition-all">
                      {/* hidden file input */}
                      <input
                        ref={el => fileInputRefs.current[p._id] = el}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleSlipSelect(p._id, e.target.files[0])}
                      />

                      {slipPreview[p._id] ? (
                        // แสดง preview รูปที่เลือก
                        <div className="w-full">
                          <img
                            src={slipPreview[p._id]}
                            alt="preview"
                            className="w-full h-24 object-cover rounded-lg mb-2"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => uploadSlip(p._id)}
                              disabled={uploadingId === p._id}
                              className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1"
                            >
                              {uploadingId === p._id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  กำลังส่ง...
                                </>
                              ) : "✓ ส่งสลิป"}
                            </button>
                            <button
                              onClick={() => cancelSlip(p._id)}
                              className="px-3 py-2 border-2 border-gray-200 text-gray-500 font-bold rounded-lg text-xs hover:bg-gray-50"
                            >✕</button>
                          </div>
                        </div>
                      ) : (
                        // ปุ่มเลือกรูป
                        <button
                          onClick={() => fileInputRefs.current[p._id]?.click()}
                          className="flex flex-col items-center gap-2 w-full"
                        >
                          <span className="text-2xl">📎</span>
                          <span className="text-sm font-bold text-gray-700">แนบสลิป</span>
                          <span className="text-xs text-gray-400">jpg, png ไม่เกิน 5MB</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}