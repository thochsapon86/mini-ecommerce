/**
 * MyOrdersPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * หน้าติดตามสถานะคำสั่งซื้อสำหรับ User
 *
 * Features:
 *   - Timeline แสดงความคืบหน้า 4 ขั้น
 *   - กดยืนยันรับสินค้า (ตอน shipping)
 *   - ขอยกเลิก Order (pending/confirmed เท่านั้น)
 *   - แสดงสถานะยืนยันของทั้งสองฝั่ง
 */

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import LoadingSpinner from "../components/LoadingSpinner";

const STATUS_INFO = {
  pending:          { label: "รอยืนยัน",       color: "bg-amber-100 text-amber-700",   icon: "⏳", step: 0 },
  confirmed:        { label: "ยืนยันแล้ว",      color: "bg-blue-100 text-blue-700",    icon: "✓",  step: 1 },
  shipping:         { label: "กำลังจัดส่ง",     color: "bg-purple-100 text-purple-700", icon: "🚚", step: 2 },
  delivered:        { label: "ส่งสำเร็จ",       color: "bg-green-100 text-green-700",  icon: "📦", step: 3 },
  cancel_requested: { label: "รอยืนยันยกเลิก", color: "bg-orange-100 text-orange-700", icon: "⚠️", step: -1 },
  cancelled:        { label: "ยกเลิกแล้ว",      color: "bg-red-100 text-red-700",      icon: "✕",  step: -1 },
};

const STEPS = ["รอยืนยัน", "ยืนยันแล้ว", "กำลังจัดส่ง", "ส่งสำเร็จ"];

export default function MyOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await apiFetch("/order-status/my", {}, token);
      setOrders(d);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  // ยืนยันรับสินค้า
  const confirmDelivery = async (orderId) => {
    setActionLoading(orderId + "_delivery");
    try {
      const data = await apiFetch(`/order-status/${orderId}/confirm-delivery`, { method: "POST" }, token);
      toast.success(data.message);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  // ส่งคำขอยกเลิก
  const requestCancel = async () => {
    if (!cancelModal) return;
    setActionLoading(cancelModal._id + "_cancel");
    try {
      await apiFetch(`/order-status/${cancelModal._id}/cancel-request`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason })
      }, token);
      toast.success("ส่งคำขอยกเลิกแล้ว รอ Owner ยืนยัน");
      setCancelModal(null);
      setCancelReason("");
      load();
    } catch (e) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-2">คำสั่งซื้อของฉัน</h1>
      <p className="text-gray-400 text-sm mb-8">{orders.length} รายการ</p>

      {orders.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-6xl mb-4">📦</div>
          <p className="font-semibold text-lg">ยังไม่มีคำสั่งซื้อ</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const status = STATUS_INFO[order.status] || STATUS_INFO.pending;
            const isExpanded = expandedId === order._id;
            const canCancel = ["pending", "confirmed"].includes(order.status);
            const canConfirmDelivery = order.status === "shipping" && !order.userConfirmedDelivery;
            const isCancelled = ["cancelled", "cancel_requested"].includes(order.status);

            return (
              <div key={order._id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-red-100 transition-colors">

                {/* Header */}
                <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : order._id)}>
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("th-TH", {
                          year: "numeric", month: "long", day: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-lg font-black text-red-600">
                        ฿{(order.finalPrice || order.totalPrice)?.toLocaleString()}
                      </span>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                      <span className="text-gray-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* Timeline — ซ่อนถ้า cancelled */}
                  {!isCancelled && (
                    <div className="flex items-start">
                      {STEPS.map((step, i) => {
                        const done = status.step > i;
                        const current = status.step === i;
                        return (
                          <div key={step} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center min-w-0">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0
                                ${done ? "bg-green-500 text-white" : current ? "bg-red-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                                {done ? "✓" : i + 1}
                              </div>
                              <p className={`text-xs mt-1 font-medium text-center leading-tight
                                ${done ? "text-green-600" : current ? "text-red-600" : "text-gray-400"}`}>
                                {step}
                              </p>
                            </div>
                            {i < STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${done ? "bg-green-400" : "bg-gray-200"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Cancel requested banner */}
                  {order.status === "cancel_requested" && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2 mt-2">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <p className="text-orange-700 font-bold text-sm">รอ Owner ยืนยันการยกเลิก</p>
                        {order.cancelReason && (
                          <p className="text-orange-600 text-xs mt-0.5">เหตุผล: {order.cancelReason}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cancelled banner */}
                  {order.status === "cancelled" && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 mt-2">
                      <span>✕</span>
                      <p className="text-red-700 font-bold text-sm">คำสั่งซื้อถูกยกเลิกแล้ว</p>
                    </div>
                  )}

                  {/* Delivery confirmation status (shipping) */}
                  {order.status === "shipping" && (
                    <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-3">
                      <p className="text-purple-700 font-bold text-sm mb-2">สถานะการยืนยันรับสินค้า</p>
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black
                            ${order.userConfirmedDelivery ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                            {order.userConfirmedDelivery ? "✓" : "?"}
                          </div>
                          <span className="text-xs text-gray-600 font-medium">คุณ{order.userConfirmedDelivery ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black
                            ${order.ownerConfirmedDelivery ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                            {order.ownerConfirmedDelivery ? "✓" : "?"}
                          </div>
                          <span className="text-xs text-gray-600 font-medium">ผู้ขาย{order.ownerConfirmedDelivery ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {(canConfirmDelivery || canCancel) && (
                  <div className="px-5 pb-5 flex gap-3 border-t border-gray-50 pt-4">
                    {canConfirmDelivery && (
                      <button
                        onClick={() => confirmDelivery(order._id)}
                        disabled={actionLoading === order._id + "_delivery"}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-green-200 flex items-center justify-center gap-2"
                      >
                        {actionLoading === order._id + "_delivery"
                          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <span>📦</span>
                        }
                        ยืนยันรับสินค้าแล้ว
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => setCancelModal(order)}
                        className="px-5 py-3 border-2 border-red-200 text-red-600 font-bold rounded-xl text-sm hover:bg-red-50 transition-all"
                      >
                        ขอยกเลิก
                      </button>
                    )}
                  </div>
                )}

                {/* Expanded: รายการสินค้า */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5">
                    <h3 className="font-bold text-gray-700 text-sm mb-3">รายการสินค้า</h3>
                    <div className="flex flex-col gap-2 mb-4">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.product?.image
                              ? <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                              : <span className="text-xl">🖥️</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">{item.product?.name}</p>
                            <p className="text-gray-400 text-xs">฿{item.price?.toLocaleString()} × {item.quantity}</p>
                          </div>
                          <p className="font-black text-gray-900 text-sm flex-shrink-0">
                            ฿{(item.price * item.quantity)?.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">ราคาสินค้า</span>
                        <span className="font-bold">฿{order.totalPrice?.toLocaleString()}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-green-600">ส่วนลด</span>
                          <span className="font-bold text-green-600">-฿{order.discount?.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black border-t border-gray-200 pt-2 mt-2">
                        <span>ราคาสุทธิ</span>
                        <span className="text-red-600">฿{(order.finalPrice || order.totalPrice)?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setCancelModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-1">ขอยกเลิกคำสั่งซื้อ</h2>
            <p className="text-gray-400 text-sm mb-5">Owner จะได้รับคำขอและยืนยันหรือปฏิเสธการยกเลิก</p>

            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">เหตุผล (ไม่บังคับ)</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm font-medium bg-gray-50 resize-none mb-5"
              rows={3}
              placeholder="ระบุเหตุผลที่ต้องการยกเลิก..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={requestCancel}
                disabled={actionLoading === cancelModal._id + "_cancel"}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold rounded-xl text-sm">
                {actionLoading === cancelModal._id + "_cancel" ? "กำลังส่ง..." : "ส่งคำขอยกเลิก"}
              </button>
              <button
                onClick={() => { setCancelModal(null); setCancelReason(""); }}
                className="px-5 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50">
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}