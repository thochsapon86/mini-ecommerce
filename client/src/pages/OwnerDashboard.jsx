/**
 * OwnerDashboard.jsx (Updated)
 * ─────────────────────────────────────────────────────────────────
 * เพิ่มฟีเจอร์:
 *   - ยืนยันการส่งสินค้าสำเร็จ (confirm-sent)
 *   - ยืนยัน/ปฏิเสธคำขอยกเลิกจาก User
 *   - แสดง badge คำขอยกเลิกที่รอดำเนินการ
 */

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import LoadingSpinner from "../components/LoadingSpinner";

const API_BASE = "http://localhost:5000";

const ORDER_STATUS = {
  pending:          { label: "รอยืนยัน",       color: "bg-amber-100 text-amber-700",   icon: "⏳" },
  confirmed:        { label: "ยืนยันแล้ว",      color: "bg-blue-100 text-blue-700",    icon: "✓"  },
  shipping:         { label: "กำลังจัดส่ง",     color: "bg-purple-100 text-purple-700", icon: "🚚" },
  delivered:        { label: "ส่งสำเร็จ",       color: "bg-green-100 text-green-700",  icon: "📦" },
  cancel_requested: { label: "รอยืนยันยกเลิก", color: "bg-orange-100 text-orange-700", icon: "⚠️" },
  cancelled:        { label: "ยกเลิกแล้ว",      color: "bg-red-100 text-red-700",      icon: "✕"  },
};

const PAYMENT_STATUS = {
  pending: { label: "รอชำระ",   color: "bg-amber-100 text-amber-700" },
  paid:    { label: "ชำระแล้ว", color: "bg-green-100 text-green-700" },
  failed:  { label: "ล้มเหลว",  color: "bg-red-100 text-red-700"    },
};

export default function OwnerDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [slipModal, setSlipModal] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ordersData, paymentsData] = await Promise.all([
        apiFetch("/owner/orders", {}, token),
        apiFetch("/owner/payments", {}, token),
      ]);
      setOrders(ordersData);
      setPayments(paymentsData);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  // อัปเดตสถานะ (confirmed, shipping)
  const updateStatus = async (orderId, status) => {
    setActionLoading(orderId + "_" + status);
    try {
      await apiFetch(`/order-status/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }, token);
      toast.success(`อัปเดตสถานะเป็น "${ORDER_STATUS[status]?.label}" แล้ว`);
      loadAll();
    } catch (e) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  // Owner กดยืนยันส่งสำเร็จ
  const confirmSent = async (orderId) => {
    setActionLoading(orderId + "_sent");
    try {
      const data = await apiFetch(`/order-status/${orderId}/confirm-sent`, { method: "POST" }, token);
      toast.success(data.message);
      loadAll();
    } catch (e) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  // ยืนยันหรือปฏิเสธคำขอยกเลิก
  const respondCancel = async (orderId, approve) => {
    setActionLoading(orderId + "_cancel_" + approve);
    try {
      const data = await apiFetch(`/order-status/${orderId}/cancel-response`, {
        method: "POST",
        body: JSON.stringify({ approve }),
      }, token);
      toast.success(data.message);
      loadAll();
    } catch (e) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  // Stats
  const totalRevenue = orders
    .filter(o => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.finalPrice || o.totalPrice || 0), 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const cancelRequests = orders.filter(o => o.status === "cancel_requested").length;
  const paidPayments = payments.filter(p => p.status === "paid").length;

  if (loading) return <div className="max-w-6xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Owner Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">จัดการคำสั่งซื้อและการชำระเงินของร้าน</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "คำสั่งซื้อทั้งหมด", value: orders.length,   icon: "📦", color: "bg-blue-50 border-blue-200",   text: "text-blue-700"   },
          { label: "รอดำเนินการ",        value: pendingOrders,   icon: "⏳", color: "bg-amber-50 border-amber-200", text: "text-amber-700" },
          { label: "รอยืนยันยกเลิก",    value: cancelRequests,  icon: "⚠️", color: "bg-orange-50 border-orange-200", text: "text-orange-700" },
          { label: "ยอดขายรวม",          value: `฿${totalRevenue.toLocaleString()}`, icon: "💰", color: "bg-red-50 border-red-200", text: "text-red-700" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} border-2 rounded-2xl p-4`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
                <p className="text-xs text-gray-500 font-semibold">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "orders",   label: "คำสั่งซื้อ",  icon: "📦", count: orders.length,   badge: cancelRequests },
          { key: "payments", label: "ชำระเงิน",    icon: "💳", count: payments.length  },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all
              ${tab === t.key ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white border-2 border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600"}`}>
            <span>{t.icon}</span>
            {t.label}
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${tab === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
              {t.count}
            </span>
            {/* Badge คำขอยกเลิก */}
            {t.badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 text-white text-xs font-black rounded-full flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Orders ───────────────────────────────────────── */}
      {tab === "orders" && (
        <div className="flex flex-col gap-4">
          {/* คำขอยกเลิกที่รอดำเนินการ — แสดงก่อนเลย */}
          {cancelRequests > 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4">
              <p className="font-black text-orange-700 mb-3 flex items-center gap-2">
                <span>⚠️</span> มีคำขอยกเลิก {cancelRequests} รายการ รอการตอบกลับ
              </p>
              {orders.filter(o => o.status === "cancel_requested").map(order => (
                <div key={order._id} className="bg-white rounded-xl p-4 mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-gray-500">{order.user?.name} — ฿{(order.finalPrice || order.totalPrice)?.toLocaleString()}</p>
                    {order.cancelReason && (
                      <p className="text-xs text-orange-600 mt-1">เหตุผล: {order.cancelReason}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondCancel(order._id, true)}
                      disabled={!!actionLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-all">
                      ✓ ยืนยันยกเลิก
                    </button>
                    <button
                      onClick={() => respondCancel(order._id, false)}
                      disabled={!!actionLoading}
                      className="px-4 py-2 border-2 border-gray-200 text-gray-600 font-bold rounded-lg text-xs hover:bg-gray-50 transition-all">
                      ✕ ปฏิเสธ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">📦</div>
              <p className="font-semibold">ยังไม่มีคำสั่งซื้อ</p>
            </div>
          ) : orders.map((order) => {
            const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
            const isExpanded = expandedOrder === order._id;

            return (
              <div key={order._id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-red-100 transition-colors">

                {/* Order header */}
                <div className="p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedOrder(isExpanded ? null : order._id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black flex-shrink-0">
                      {order.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{order.user?.name}</p>
                      <p className="text-gray-400 text-xs">{order.user?.email}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("th-TH", {
                          year: "numeric", month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-black text-gray-900 text-lg">฿{(order.finalPrice || order.totalPrice)?.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{order.items?.length} รายการ</p>
                    </div>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full ${status.color}`}>
                      {status.icon} {status.label}
                    </span>
                    <span className="text-gray-400">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Delivery confirmation status (shipping) */}
                {order.status === "shipping" && (
                  <div className="px-5 pb-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                      <p className="text-purple-700 font-bold text-sm mb-2">สถานะการยืนยันรับสินค้า</p>
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black
                            ${order.userConfirmedDelivery ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                            {order.userConfirmedDelivery ? "✓" : "?"}
                          </div>
                          <span className="text-xs text-gray-600">ลูกค้า{order.userConfirmedDelivery ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black
                            ${order.ownerConfirmedDelivery ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                            {order.ownerConfirmedDelivery ? "✓" : "?"}
                          </div>
                          <span className="text-xs text-gray-600">คุณ{order.ownerConfirmedDelivery ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="px-5 pb-5 flex flex-wrap gap-2">
                  {order.status === "pending" && (
                    <button onClick={() => updateStatus(order._id, "confirmed")}
                      disabled={!!actionLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all">
                      ✓ ยืนยันคำสั่งซื้อ
                    </button>
                  )}
                  {order.status === "confirmed" && (
                    <button onClick={() => updateStatus(order._id, "shipping")}
                      disabled={!!actionLoading}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all">
                      🚚 ส่งสินค้าแล้ว
                    </button>
                  )}
                  {order.status === "shipping" && !order.ownerConfirmedDelivery && (
                    <button onClick={() => confirmSent(order._id)}
                      disabled={actionLoading === order._id + "_sent"}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1">
                      {actionLoading === order._id + "_sent"
                        ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : null}
                      📦 ยืนยันส่งสำเร็จ
                    </button>
                  )}
                </div>

                {/* Expanded: รายการสินค้า */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5">
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
                          <p className="font-black text-gray-900 text-sm">฿{(item.price * item.quantity)?.toLocaleString()}</p>
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

      {/* ── Tab: Payments ─────────────────────────────────────── */}
      {tab === "payments" && (
        <div className="flex flex-col gap-3">
          {payments.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">💳</div>
              <p className="font-semibold">ยังไม่มีข้อมูลการชำระเงิน</p>
            </div>
          ) : payments.map((p) => {
            const status = PAYMENT_STATUS[p.status] || PAYMENT_STATUS.pending;
            return (
              <div key={p._id} className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:border-red-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black flex-shrink-0">
                      {p.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{p.user?.name}</p>
                      <p className="text-gray-400 text-xs">{p.user?.email}</p>
                      {p.transactionId && <p className="text-green-600 text-xs font-bold mt-1">✓ {p.transactionId}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-black text-gray-900 text-xl">฿{p.amount?.toLocaleString()}</p>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full ${status.color}`}>{status.label}</span>
                    {p.slipImage && (
                      <button onClick={() => setSlipModal(`${API_BASE}${p.slipImage}`)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-lg text-xs">
                        📎 ดูสลิป
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slip Modal */}
      {slipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSlipModal(null)}>
          <div className="relative max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSlipModal(null)}
              className="absolute -top-4 -right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg font-bold text-gray-600">✕</button>
            <img src={slipModal} alt="slip" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}